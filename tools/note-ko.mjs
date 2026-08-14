/*
 * 묶음 지시문에 한글이 빠진 것을 찾는다. (규칙 11)
 *
 * 원본 시험지는 지시문을 영문 한 줄, 한글 한 줄로 적는다.
 *
 *   * The following questions refer to HIE procedure, HIE-NDT-MT-N21 ...
 *     (다음 문제는 HIE 절차서에 언급된다. ...)
 *
 * 그런데 어떤 시험지는 영문만 적어 두었다. 문항 본문과 보기는 전부
 * 영문 다음 한글인데 지시문만 영문이면 응시자가 조건을 놓친다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;

/* 지시문 종류별로 모은다 */
const notes = new Map();

for (const f of walk(PUB)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const note = q.groupNote;
    if (!note) continue;

    const got = notes.get(note) || { n: 0, where: new Set() };
    got.n++;
    got.where.add(rel);
    notes.set(note, got);
  }
}

const missing = [];
const ok = [];

for (const [note, v] of notes) {
  (HANGUL.test(note) ? ok : missing).push({ note, ...v });
}

let out = `지시문 ${notes.size}종\n`;
out += `  한글 있음 ${ok.length}종\n`;
out += `  한글 없음 ${missing.length}종\n\n`;

if (missing.length) {
  out += "=== 한글이 빠진 지시문 ===\n";
  missing
    .sort((a, b) => b.n - a.n)
    .forEach((m) => {
      out += `\n(${m.n}문항) ${[...m.where].join(", ")}\n`;
      out += `  ${m.note.replace(/\n/g, "\n  ")}\n`;
    });
}

fs.writeFileSync("note-ko-out.txt", out, "utf8");
console.log(out);
