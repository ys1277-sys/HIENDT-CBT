/* 원본 hwp 시험지에서 글월을 찾는다:  node tools/_srcgrep.mjs "찾을 말" */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const ROOTS = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];
const needle = process.argv[2];

const walk = (d) => {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/\.hwp$/i.test(e.name)) out.push(p);
  }
  return out;
};

let hit = 0;
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    let doc;
    try { doc = readHwp(f); } catch { continue; }
    const lines = String(doc.text).split("\n");
    lines.forEach((l, i) => {
      if (!l.toLowerCase().includes(needle.toLowerCase())) return;
      console.log(path.basename(f) + "  " + (i + 1) + "줄");
      console.log("   " + l.trim().slice(0, 160));
      hit++;
    });
  }
}
if (!hit) console.log("원본에 없음: " + needle);
