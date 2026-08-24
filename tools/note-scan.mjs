/*
 * 원본 시험지 갑지의 NOTE 부분만 뽑아 서로 비교한다.
 * CBT 갑지에는 1/2/3 세 줄만 박아 뒀는데, 원본은 시험지마다
 * 다르다고 해서 실제로 몇 가지인지 센다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const ROOTS = [
  "D:/Visual Studio Code/Level II 문제",
  "D:/Visual Studio Code/Level III 문제"
];

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.hwp$/i.test(e.name) && !e.name.startsWith("~") ? [p] : [];
  });

const files = ROOTS.filter(fs.existsSync).flatMap(walk);
console.log("시험지", files.length, "개\n");

const seen = new Map();
const noNote = [];

for (const f of files) {
  let txt;
  try { txt = readHwp(f).text; } catch (e) { console.log("읽기실패", path.basename(f), e.message); continue; }

  const i = txt.search(/NOTE\s*:/i);
  if (i < 0) { noNote.push(path.relative("D:/Visual Studio Code", f)); continue; }

  let seg = txt.slice(i, i + 2000);
  const j = seg.search(/Approved\s*by/i);
  if (j > 0) seg = seg.slice(0, j);

  const norm = seg.replace(/\s+/g, " ").trim();
  if (!seen.has(norm)) seen.set(norm, []);
  seen.get(norm).push(path.relative("D:/Visual Studio Code", f));
}

if (noNote.length) console.log("NOTE 없는 시험지", noNote.length, "개\n");
console.log("서로 다른 NOTE", seen.size, "가지\n");

let n = 0;
for (const [txt, fl] of [...seen.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log("─".repeat(72));
  console.log(`[${++n}] 시험지 ${fl.length}개`);
  fl.slice(0, 5).forEach((x) => console.log("   " + x));
  if (fl.length > 5) console.log("   … 외 " + (fl.length - 5));
  console.log("   " + txt.slice(0, 1000));
}
