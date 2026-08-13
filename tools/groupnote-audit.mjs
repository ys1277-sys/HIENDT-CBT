/*
 * 원본의 묶음 지시문이 은행에 붙었는지 본다. (규칙 13)
 *
 * 원본은 묶음 문항 앞에 이런 줄을 둔다.
 *
 *   * The following questions (6-10) refer to HIE procedure, HIE-NDT-MT-N21 ...
 *       (다음 문제 (21-25)은 HIE 절차서에 언급된다. ...)
 *
 * 이 줄이 없으면 응시자는 어느 절차서·그림을 보고 풀어야 하는지 알 수 없다.
 * 여기서는 원본에 이런 줄이 몇 개 있고, 은행 groupNote 가 몇 개인지 견준다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const SRC = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];

const walk = (d, ext) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p, ext);
    return ext.test(e.name) ? [p] : [];
  });

/* 묶음 지시문으로 볼 만한 줄 */
const NOTE =
  /^\s*[*※]?\s*(?:The following|Following|Questions?)\b.*\b(?:refer|refers|based on|pertain)/i;

let srcTotal = 0;
const rows = [];

for (const root of SRC) {
  for (const f of walk(root, /\.hwp$/i)) {
    let text;
    try { ({ text } = readHwp(f)); } catch { continue; }
    const hits = text.split("\n").filter((l) => NOTE.test(l.replace(/\[\[OBJ\]\]/g, " ")));
    if (!hits.length) continue;
    srcTotal += hits.length;
    rows.push({ file: path.basename(f), hits });
  }
}

/* 은행 쪽 groupNote 종류 */
const notes = new Map();
for (const f of walk(PUB, /\.json$/)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  for (const q of items) {
    if (!q.groupNote) continue;
    const k = `${rel} :: ${String(q.groupNote).replace(/\n/g, " ").slice(0, 70)}`;
    notes.set(k, (notes.get(k) || 0) + 1);
  }
}

let out = `원본 묶음 지시문 ${srcTotal}줄 / 은행 groupNote 종류 ${notes.size}개\n\n`;
out += "=== 원본에 있는 줄 ===\n";
for (const r of rows) {
  out += `\n--- ${r.file} ---\n`;
  r.hits.forEach((h) => (out += `  ${h.trim().slice(0, 150)}\n`));
}
out += "\n=== 은행 groupNote ===\n";
[...notes.entries()].sort().forEach(([k, c]) => (out += `  (${c}문항) ${k}\n`));

fs.writeFileSync("groupnote-audit-out.txt", out, "utf8");
console.log(out.split("\n")[0]);
