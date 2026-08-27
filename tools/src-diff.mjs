/*
 * 원본에서 못 찾은 줄마다 가장 비슷한 원본 줄을 찾아 나란히 보여 준다.
 *
 *   node tools/src-diff.mjs [몇 개]
 *
 * src-verify.mjs 가 낸 목록을 읽는다. 무엇이 어떻게 달라졌는지 눈으로
 * 가리라고 만든 것이다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const N = Number(process.argv[2] || 40);
const SRC = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];

const walk = (d) => {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/\.hwp$/i.test(e.name)) out.push(p);
  }
  return out;
};

const srcLines = [];
for (const root of SRC) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    let t; try { t = readHwp(f).text; } catch { continue; }
    for (const l of String(t).split("\n")) {
      const s = l.trim();
      if (s.length > 15) srcLines.push(s);
    }
  }
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const srcNorm = srcLines.map(norm);

/* 낱말 겹침으로 가장 비슷한 줄을 고른다 */
function nearest(line) {
  const want = new Set(norm(line).split(" ").filter((w) => w.length > 2));
  if (!want.size) return null;

  let best = null, score = 0;
  for (let i = 0; i < srcNorm.length; i++) {
    const have = srcNorm[i].split(" ");
    let hit = 0;
    for (const w of have) if (want.has(w)) hit++;
    const s = hit / Math.max(want.size, have.length);
    if (s > score) { score = s; best = srcLines[i]; }
  }
  return score > 0.45 ? { line: best, score } : null;
}

const rows = [];
const txt = fs.readFileSync("src-verify-out.txt", "utf8").split("\n");
for (let i = 0; i < txt.length; i += 2) {
  if (txt[i] && txt[i + 1]) rows.push({ at: txt[i].trim(), line: txt[i + 1].trim() });
}

let shown = 0, near = 0, none = 0;
for (const r of rows) {
  if (shown >= N) break;
  const m = nearest(r.line);
  if (m) near++; else { none++; continue; }

  console.log(r.at);
  console.log("   원본 " + m.line.slice(0, 130));
  console.log("   은행 " + r.line.slice(0, 130));
  console.log("");
  shown++;
}
console.log(`비슷한 원본 줄을 찾은 것 ${near} · 아예 없는 것 ${none} (앞 ${near + none}줄만 훑음)`);
