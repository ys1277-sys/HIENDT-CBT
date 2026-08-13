/*
 * 빈칸 표시를 되살린다.
 *
 * 원본은 빈칸을 밑줄이나 긴 공백으로 찍는다.
 *
 *   6. This procedure describes the Magnetic particle testing for            .
 *      본 절차서는           을 위한 자분 탐상방법을 기술한다.
 *   11. ... shall be made over an area extending at least ________inch beyond ...
 *
 * 파서가 공백을 하나로 줄여 채울 자리가 사라졌다.
 *
 *   This procedure describes the Magnetic particle testing for .
 *   본 절차서는 을 위한 자분 탐상방법을 기술한다.
 *
 * 문장만 보고 빈칸 자리를 짐작하면 안 된다. 이 시험지는 콜론 앞을
 * 띄어 쓰는 버릇이 있어("shut off :"), 벌어진 자리가 다 빈칸이 아니다.
 * 원본에 밑줄이나 긴 공백이 실제로 있는 문항만 고친다.
 *
 * 원본 줄로 통째로 갈아 끼우지도 않는다. 원본에는 "clock wise" 같은
 * 오타가 남아 있어서, 규칙 4 로 이미 고쳐 둔 것이 되살아난다.
 * 빈칸 자리만 찾아 끼워 넣고 나머지 글자는 은행 것을 그대로 둔다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const SRC = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];
const BLANK = "______";
const HOLE = "\u0001";

const walk = (d, ext) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p, ext);
    return ext.test(e.name) ? [p] : [];
  });

const MARK = /^\s*[a-eA-E][.)]/;
const word = (s) => String(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

/* 빈칸을 뺀 알맹이. 원본 줄과 은행 줄이 같은 문장인지 견주는 데 쓴다 */
const bones = (s) => word(String(s).replace(/[_\u0001]+/g, " "));

/* 원본 줄에서 빈칸 자리를 표식으로 바꾼다 */
function markHoles(line) {
  return line
    .replace(/^\s*\d{1,3}[.)]\s*/, "")
    .trim()
    .replace(/_{2,}/g, HOLE)
    .replace(/(?<=\S)[ \t]{4,}(?=\S)/g, ` ${HOLE} `);
}

const hasHole = (l) => l.includes(HOLE);

/* ---- 원본에서 "알맹이 -> 표식이 든 줄" 사전 ---- */
const book = new Map();

for (const root of SRC) {
  for (const f of walk(root, /\.hwp$/i)) {
    let text;
    try { ({ text } = readHwp(f)); } catch { continue; }

    for (const raw of text.split("\n")) {
      const l = raw.replace(/\[\[OBJ\]\]/g, " ").replace(/\u0000/g, "");
      if (!l.trim() || MARK.test(l)) continue;

      const marked = markHoles(l);
      if (!hasHole(marked)) continue;

      const key = bones(marked);
      if (key.length < 12) continue;
      if (!book.has(key)) book.set(key, marked);
    }
  }
}

/*
 * 원본의 빈칸 자리를 은행 줄에 끼워 넣는다.
 *
 * 원본 낱말을 앞에서부터 차례로 은행 줄에 맞춰 간다. 같은 낱말이
 * 두 번 나오는 문장이 많아("... side of a joint, what types of ...")
 * 첫 자리만 찾으면 엉뚱한 곳에 빈칸이 들어간다.
 */
const findFrom = (arr, from, w) => {
  for (let k = from; k < arr.length; k++) if (word(arr[k]) === w) return k;
  return -1;
};

/*
 * "최소     A     인치" 처럼 A·B 가 이미 빈칸 이름인 자리가 있다.
 * 그 옆의 공백은 빈칸이 아니라 그냥 자리 맞춤이다.
 */
const isLabel = (t) =>
  !!t && /^[(（]?[A-D][)）.,]?$/.test(String(t).split(HOLE).join(""));

function insertBlanks(bankLine, marked) {
  const src = marked.split(/\s+/).filter(Boolean);
  const bank = bankLine.split(/\s+/).filter(Boolean);
  const out = [];
  let bi = 0;
  let put = 0;

  const take = (w) => {
    const at = findFrom(bank, bi, w);
    if (at < 0) return;
    out.push(...bank.slice(bi, at + 1));
    bi = at + 1;
  };

  let wanted = 0;

  for (let i = 0; i < src.length; i++) {
    const tok = src[i];

    if (tok.includes(HOLE)) {
      if (!isLabel(src[i - 1]) && !isLabel(src[i + 1])) {
        wanted++;
        /* 앞 낱말을 못 찾아 빈칸이 연달아 붙으면 자리를 잘못 잡은 것이다 */
        if (out[out.length - 1] !== BLANK) {
          out.push(BLANK);
          put++;
        }
      }
      /* "____inch" 처럼 낱말이 붙어 있으면 그 낱말도 마저 맞춘다 */
      const glued = word(tok.split(HOLE).join(""));
      if (glued) take(glued);
      continue;
    }

    const w = word(tok);
    if (w) take(w);
  }

  out.push(...bank.slice(bi));

  /*
   * 원본 빈칸을 하나라도 못 놓았으면 그 줄은 그냥 둔다.
   * 반만 채워진 문장이 아예 안 채운 것보다 더 헷갈린다.
   */
  if (!put || put !== wanted) return bankLine;

  /* 문장부호와 조사는 빈칸에 붙여 쓴다 */
  return out
    .join(" ")
    .replace(new RegExp(`${BLANK}\\s+([.,:;?)）"”])`, "g"), `${BLANK}$1`)
    .replace(new RegExp(`${BLANK}\\s+(을|를|은|는|이|가|와|과|에|에서|까지|부터|으로|로)(?=\\s)`, "g"), `${BLANK}$1`);
}

/* ---- 은행에 끼워 넣는다 ---- */
let n = 0;
const log = [];

for (const f of walk(PUB, /\.json$/)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const before = String(q.question);

    const after = before
      .split("\n")
      .map((line) => {
        /* 이미 빈칸이 있는 줄은 손대지 않는다. "( )" 나 "(____)" 도 빈칸이다 */
        if (/_{2,}/.test(line) || /[(（]\s*_*\s*[)）]/.test(line)) return line;
        const key = bones(line);
        if (key.length < 12) return line;
        const marked = book.get(key);
        if (!marked) return line;
        return insertBlanks(line, marked);
      })
      .join("\n");

    if (after === before) continue;
    q.question = after;
    touched = true;
    n++;
    log.push(
      `${rel} id ${q.id}\n   전 ${before.replace(/\n/g, "\n      ")}\n   후 ${after.replace(/\n/g, "\n      ")}`
    );
  }
  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

let out = `빈칸을 되살린 문항 ${n}건\n\n` + log.join("\n\n") + "\n";
out += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";
fs.writeFileSync("restore-blank-out.txt", out, "utf8");
console.log(out.split("\n")[0]);
