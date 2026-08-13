/*
 * 원본의 묶음 지시문을 문항에 도로 붙인다. (규칙 13)
 *
 * 원본은 묶음 앞에 한 줄만 두고, 아래 문항들은 그 줄을 전제로 한다.
 *
 *   * The following questions (6-10) refer to HIE procedure, HIE-NDT-MT-N21 ...
 *   6. This procedure describes the Magnetic particle testing for        .
 *   ...
 *   10. This procedure describes the Magnetic particle testing methode of  .
 *   * The following questions (11-16) refer to HIE procedure, HIE-NDT-MT-P11 ...
 *   11. ...
 *
 * CBT 는 문항을 섞어 뽑으니 이 줄이 문항마다 따라붙지 않으면
 * 어느 절차서를 보고 풀어야 하는지 알 수 없다.
 *
 * 발문만으로는 못 가린다
 * ----------------------
 * 같은 문장이 A 시험지에서는 N21 묶음, B 시험지에서는 P11 묶음에
 * 들어가 있다. 절차서가 다르면 답도 다르다.
 *
 * 대신 은행이 원본 차례를 그대로 지킨다는 점을 쓴다. 한 과목 파일을
 * 앞에서부터 훑으면서, 직전 문항과 같은 원본 시험지에서 번호가
 * 커지는 쪽을 고른다. 한 번 자리를 잡으면 그 뒤로는 계속 맞는다.
 *
 * 번호 범위는 떼어낸다
 * --------------------
 * 3번으로 뽑힌 문항에 "The following questions (6-10)" 이 붙어 있으면
 * 응시자가 헷갈린다. A 시험지 (6-10) 과 B 시험지 (21-25) 가 같은
 * 절차서를 가리키니 번호는 시험지마다 다른 값일 뿐이다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const SRC = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];

const walk = (d, ext) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" ? [] : walk(p, ext);
    return ext.test(e.name) ? [p] : [];
  });

const HANGUL = /[가-힣]/;
const MARK = /^\s*[a-eA-E][.)]/;
const QSTART = /^\s*(?:\[\[OBJ\]\])*\s*(\d{1,3})[.)]\s*\S/;
const TAG = /^\s*[(（]\s*[EPTSA](\s*[,，]\s*[EPTSA])*\s*[)）]\s*/;
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const KEYLEN = 120;

/*
 * 지시문 줄. 원본이 두 가지로 쓴다.
 *   * The following questions (11-16) refer to HIE procedure, ...
 *   * Refer to HIE-NDT-MT-P6A(SKB) ... and answer question No.16.
 */
const NOTE =
  /^\s*[*※]?\s*(?:(?:The following|Following|Questions?)\b.*\b(?:refer|refers|based on|pertain)|Refer\s+to\b.*\bquestions?\b)/i;

/* "(6-10)" "No.25" "No.18~19" "questions 5 through 8" 에서 번호 범위를 읽는다 */
function parseRange(line) {
  let m = line.match(/[(（]\s*(\d{1,3})\s*[-–~～]\s*(\d{1,3})\s*[)）]/);
  if (m) return [Number(m[1]), Number(m[2])];
  m = line.match(/No\.\s*(\d{1,3})\s*[-–~～]\s*(\d{1,3})/i);
  if (m) return [Number(m[1]), Number(m[2])];
  m = line.match(/No\.\s*(\d{1,3})/i);
  if (m) return [Number(m[1]), Number(m[1])];
  m = line.match(/questions?\s+(\d{1,3})\s+through\s+(\d{1,3})/i);
  if (m) return [Number(m[1]), Number(m[2])];
  return null;
}

/* 지시문에서 문항 번호를 떼어낸다 */
function stripRange(note) {
  return note
    .split("\n")
    .map((l) =>
      l
        .replace(/(questions?)\s*[(（]\s*\d{1,3}\s*[-–~～]\s*\d{1,3}\s*[)）]/gi, "$1")
        .replace(/(questions?)\s*No\.\s*\d{1,3}(\s*[-–~～]\s*\d{1,3})?/gi, "$1")
        .replace(/(questions?)\s+\d{1,3}\s+through\s+\d{1,3}/gi, "$1")
        /* 괄호가 있든 없든 "문제 11-16은" 을 떼어낸다 */
        .replace(/(문제|문항)\s*[(（]?\s*\d{1,3}\s*[-–~～]\s*\d{1,3}\s*[)）]?\s*(?:은|는|이|가)?/g, "$1는")
        .replace(/(문제|문항)\s*No\.\s*\d{1,3}(\s*[-–~～]\s*\d{1,3})?\s*(?:은|는|이|가)?/g, "$1는")
        /* "10~11번 물음에 답하시오" 처럼 번호가 뒤에 붙는 꼴 */
        .replace(/\d{1,3}\s*[-–~～]\s*\d{1,3}\s*번\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .join("\n");
}

/*
 * 원본은 한글을 영문 줄 뒤에 그대로 이어붙여 놓기도 한다.
 *   ... (2023 Edition).(문제 11-16은 HIE절차서에 따라 언급한다.)
 * 규칙 11 대로 한글을 다음 줄로 내린다.
 */
function splitKo(note) {
  const lines = note.split("\n");
  const head = lines[0];
  if (!HANGUL.test(head)) return note;

  const at = head.search(HANGUL);
  const open = head.lastIndexOf("(", at);
  if (open <= 0 || at - open > 4) return note;

  const en = head.slice(0, open).trim();
  const ko = head.slice(open).trim();
  if (!en || !/[A-Za-z]{4,}/.test(en)) return note;
  return [en, ko, ...lines.slice(1)].join("\n");
}

/* 원본 블록에서 보기 영문만 뽑아 열쇠 꼬리를 만든다 */
const TWO = /^\s*([a-eA-E])[.)]\s*(\S.*?)\s{3,}([a-eA-E])[.)]\s*(\S.*?)\s*$/;
const ONE = /^\s*([a-eA-E])[.)]\s*(\S.*?)\s*$/;

function optTail(block) {
  const got = [];
  for (const l of block) {
    if (!l.trim() || (HANGUL.test(l) && !MARK.test(l))) continue;
    const two = l.match(TWO);
    if (two) { got.push(two[2], two[4]); continue; }
    const one = l.match(ONE);
    if (one) got.push(one[2]);
  }
  return norm(got.slice(0, 4).join("|")).slice(0, 70);
}

/* ---- 원본에서 "열쇠 -> [{file, no, note}]" 사전을 만든다 ---- */

const book = new Map();          // 발문 + 보기
const bookStem = new Map();      // 발문만
let srcNotes = 0;

const push = (map, key, hit) => {
  const got = map.get(key);
  if (got) got.push(hit);
  else map.set(key, [hit]);
};

for (const root of SRC) {
  for (const f of walk(root, /\.hwp$/i)) {
    let text;
    try { ({ text } = readHwp(f)); } catch { continue; }
    const file = path.relative(root, f).replace(/\\/g, "/");
    const lines = text.split("\n").map((l) => l.replace(/\[\[OBJ\]\]/g, " "));

    const starts = [];
    lines.forEach((l, i) => {
      const m = l.match(QSTART);
      if (m) starts.push({ at: i, no: Number(m[1]) });
    });

    const notes = [];
    for (let i = 0; i < lines.length; i++) {
      if (!NOTE.test(lines[i])) continue;
      const range = parseRange(lines[i]);
      if (!range) continue;

      const parts = [lines[i].trim()];
      for (let k = i + 1; k < Math.min(i + 6, lines.length); k++) {
        const l = lines[k];
        if (!l.trim()) continue;
        if (QSTART.test(l) || MARK.test(l)) break;
        if (!HANGUL.test(l)) break;
        parts.push(l.trim());
      }
      notes.push({ at: i, range, text: splitKo(stripRange(parts.join("\n"))) });
      srcNotes++;
    }
    if (!notes.length) continue;

    for (const n of notes) {
      for (let s = 0; s < starts.length; s++) {
        const q = starts[s];
        if (q.at < n.at) continue;
        if (q.no < n.range[0] || q.no > n.range[1]) continue;

        const to = s + 1 < starts.length ? starts[s + 1].at : Math.min(q.at + 40, lines.length);
        const block = lines.slice(q.at, to);

        const stem = [];
        for (let k = 0; k < block.length; k++) {
          const l = block[k];
          if (k === 0) { stem.push(l.replace(/^\s*\d{1,3}[.)]\s*/, "")); continue; }
          if (!l.trim()) continue;
          if (MARK.test(l) || HANGUL.test(l)) break;
          stem.push(l);
        }
        const key = norm(stem.join(" ").replace(TAG, "")).slice(0, KEYLEN);
        if (key.length < 20) continue;

        const hit = { file, no: q.no, note: n.text };
        push(book, `${key}##${optTail(block.slice(1))}`, hit);
        push(bookStem, key, hit);
      }
    }
  }
}

/* ---- 은행을 원본 차례에 맞춰 훑는다 ---- */

const added = [];
const skipped = [];
let already = 0;

for (const f of walk(PUB, /\.json$/)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  const flat = items.flat(Infinity);
  let touched = false;

  /* 문항마다 후보를 모은다 */
  const cands = flat.map((q) => {
    const key = norm(String(q.question).split("\n")[0]).slice(0, KEYLEN);
    if (key.length < 20) return [];
    const tail = norm(
      (q.options || []).slice(0, 4).map((o) => String(o).split("\n")[0]).join("|")
    ).slice(0, 70);
    return book.get(`${key}##${tail}`) || bookStem.get(key) || [];
  });

  /*
   * 앞에서부터 훑으며 원본 시험지 한 벌을 따라간다.
   * 직전과 같은 시험지에서 번호가 커지는 후보를 먼저 본다.
   */
  let curFile = null, lastNo = -1;

  flat.forEach((q, i) => {
    const list = cands[i];
    if (!list.length) return;

    let pick = list
      .filter((c) => c.file === curFile && c.no > lastNo)
      .sort((a, b) => a.no - b.no)[0];

    if (!pick) {
      /* 새 줄기를 잡는다. 다음 문항도 같은 시험지를 가리키면 그쪽을 믿는다 */
      const nextFiles = new Set((cands[i + 1] || []).map((c) => c.file));
      const sorted = list.slice().sort((a, b) => a.no - b.no);
      pick = sorted.find((c) => nextFiles.has(c.file)) || sorted[0];
      curFile = pick.file;
    }
    lastNo = pick.no;

    if (q.groupNote) { already++; return; }
    q.groupNote = pick.note;
    touched = true;
    added.push(
      `${rel} id ${q.id}  <- ${pick.file} ${pick.no}번\n` +
      `   문항: ${String(q.question).split("\n")[0].slice(0, 82)}\n` +
      `   지시: ${pick.note.replace(/\n/g, "\n         ").slice(0, 260)}`
    );
  });

  flat.forEach((q, i) => {
    if (!q.groupNote && cands[i].length) skipped.push(`${rel} id ${q.id}`);
  });

  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

let log = `원본 지시문 ${srcNotes}줄\n`;
log += `지시문을 붙인 문항 ${added.length}건 (이미 있던 문항 ${already}건, 못 붙인 문항 ${skipped.length}건)\n\n`;
log += added.join("\n\n") + "\n";
if (skipped.length) log += `\n못 붙인 문항\n` + skipped.map((s) => "  " + s).join("\n") + "\n";
log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";

fs.writeFileSync("attach-groupnote-out.txt", log, "utf8");
console.log(log.split("\n").slice(0, 2).join("\n"));
