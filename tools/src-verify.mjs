/*
 * 은행에 든 영문이 원본 시험지에 정말 있는지 본다.
 *
 *   node tools/src-verify.mjs
 *
 * src-compare.mjs 는 원본을 문항으로 나눠 견주느라 보기 짝이 자주
 * 어긋난다. 여기서는 나누지 않는다. 원본 시험지 글 전체를 한 덩이로
 * 두고, 은행의 발문·보기 한 줄 한 줄이 그 안에 있는지만 본다.
 *
 * 없다고 다 잘못은 아니다. 은행에는 원본에 없는 것이 얹혀 있다.
 *   - 주관식을 객관식으로 바꾸며 지은 보기
 *   - 원본이 그림으로 둔 수식을 글로 옮긴 것
 *   - 원본에 한글이 없어 새로 붙인 우리말
 * 그래서 고치지 않고 목록만 낸다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const SRC = ["D:/Visual Studio Code/원본자료/Level II 문제", "D:/Visual Studio Code/원본자료/Level III 문제"];
const PUB = "public/data";
const HANGUL = /[가-힣]/;

/*
 * 견줄 때는 낱자만 남긴다. 띄어쓰기·문장부호·대소문자는 무시한다.
 *
 * 한글 시험지는 단위를 한 글자로 뭉친 글자(㎜ ㎒ ㎲)로 적는다. 그냥
 * 지워 버리면 「13㎜」가 「13」이 되어 은행의 「13mm」와 안 맞는다.
 * 풀어 쓴 다음에 지운다.
 */
const UNIT = new Map(Object.entries({
  "㎜": "mm", "㎝": "cm", "㎞": "km", "㎛": "um", "㎚": "nm",
  "㎡": "m2", "㎥": "m3", "㎏": "kg", "㎎": "mg", "㎍": "ug",
  "㎖": "ml", "㎗": "dl", "㎳": "ms", "㎲": "us", "㎱": "ns",
  "㎐": "hz", "㎑": "khz", "㎒": "mhz", "㎓": "ghz",
  "㎀": "pa", "㎂": "ua", "㎃": "ma", "㎸": "kv", "㎹": "mv",
  "㎾": "kw", "㎿": "mw", "％": "%", "℃": "c", "ω": "ohm", "Ω": "ohm",
}));

/*
 * 길이 단위 표기.
 *
 * 원본은 「1/16"」 「10"」 처럼 겹따옴표로 인치를 적는다. 은행은 그것을
 * 「1/16 inch」 로 풀어 두었다 — 겹따옴표는 JSON 과 화면에서 헷갈린다.
 * 견줄 때는 둘 다 in 으로 맞춘다.
 */
const key = (s) => {
  let t = String(s).toLowerCase();
  for (const [from, to] of UNIT) t = t.split(from).join(to);

  t = t
    .replace(/inches|inch\b/g, "in")
    .replace(/["″]/g, "in")
    .replace(/feet|foot\b/g, "ft")
    .replace(/['′]/g, "");

  return t.replace(/[^a-z0-9]/g, "");
};

/* ── 원본 시험지 글을 종목별로 모은다 ───────── */
const walkHwp = (d) => {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walkHwp(p));
    else if (/\.hwp$/i.test(e.name)) out.push(p);
  }
  return out;
};

let all = "";
let papers = 0;
for (const root of SRC) {
  if (!fs.existsSync(root)) continue;
  for (const f of walkHwp(root)) {
    try { all += "\n" + readHwp(f).text; papers++; } catch { /* 못 읽는 것은 넘긴다 */ }
  }
}
const bag = key(all);
console.log(`원본 시험지 ${papers}장 · 글자 ${bag.length}자\n`);

/* ── 은행을 훑는다 ─────────────────────────── */
const walkJson = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures/.test(e.name) ? [] : walkJson(p);
    return p.endsWith(".json") ? [p] : [];
  });

const missing = [];
let checked = 0;

for (const f of walkJson(PUB)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const rel = path.relative(PUB, f).split(path.sep).join("/").replace(".json", "");

  for (const q of items) {
    const parts = [
      ["문항", q.question],
      ...(q.options || []).map((o, i) => ["보기" + (i + 1), o]),
    ];

    for (const [kind, text] of parts) {
      if (!text) continue;

      for (const line of String(text).split("\n")) {
        /* 영문 줄만 본다. 우리말은 우리가 붙인 것이 많다 */
        if (HANGUL.test(line)) continue;

        const k = key(line);
        /* 너무 짧은 줄은 우연히 걸린다 */
        if (k.length < 12) continue;

        checked++;
        if (!bag.includes(k)) missing.push({ at: `${rel} id${q.id} ${kind}`, line: line.trim() });
      }
    }
  }
}

console.log(`견준 영문 줄 ${checked}개 · 원본에서 못 찾은 줄 ${missing.length}개\n`);

const by = new Map();
for (const m of missing) {
  const bank = m.at.split(" id")[0];
  by.set(bank, (by.get(bank) || 0) + 1);
}
for (const [b, n] of [...by].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${b.padEnd(28)} ${String(n).padStart(4)}줄`);
}

fs.writeFileSync(
  "src-verify-out.txt",
  missing.map((m) => m.at + "\n   " + m.line).join("\n"),
  "utf8"
);
console.log("\n자세한 목록 → src-verify-out.txt");
