/*
 * 문제은행에 나오는 영문 낱말을 다 모아 드물게 쓰인 것부터 보여 준다.
 *
 *   node tools/eng-words.mjs [몇 번 이하]      기본 2
 *
 * 오타는 대개 한 번밖에 안 나온다. 사람이 훑어보라고 만든 목록이다.
 */
import fs from "node:fs";
import path from "node:path";

const MAX = Number(process.argv[2] || 2);
const ROOT = "public/data";
const HANGUL = /[가-힣]/;

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const count = new Map();
const where = new Map();

for (const f of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const rel = path.relative(ROOT, f).split(path.sep).join("/").replace(".json", "");

  for (const q of items) {
    const texts = [q.question, q.groupNote, ...(q.options || [])].filter(Boolean);

    for (const t of texts) {
      /* 한글이 든 줄은 우리말 풀이라 뺀다 */
      for (const line of String(t).split("\n")) {
        if (HANGUL.test(line)) continue;

        for (const w of line.match(/[A-Za-z][A-Za-z'-]*/g) || []) {
          if (w.length < 3) continue;
          count.set(w, (count.get(w) || 0) + 1);
          if (!where.has(w)) where.set(w, `${rel} id${q.id}`);
        }
      }
    }
  }
}

const rare = [...count].filter(([, n]) => n <= MAX).sort((a, b) => a[0].localeCompare(b[0]));

console.log(`낱말 ${count.size}종 · ${MAX}번 이하 ${rare.length}종\n`);
let line = "";
for (const [w] of rare) {
  line += w.padEnd(Math.max(16, w.length + 2));
  if (line.length >= 90) { console.log(line); line = ""; }
}
if (line) console.log(line);

console.log("\n--- 어디에 있는지 ---");
for (const [w] of rare) console.log(w.padEnd(22) + where.get(w));
