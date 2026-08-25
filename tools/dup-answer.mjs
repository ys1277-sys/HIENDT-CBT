/*
 * 겹치는 문제 가운데 「정답으로 고른 보기의 글」이 서로 다른 것을 찾는다.
 * 보기 차례만 다르면 번호가 달라도 같은 답이다. 글을 견줘야 진짜가 보인다.
 */
import fs from "node:fs";
import path from "node:path";

const key = (q) => String(q.question || "").split("\n")[0]
  .toLowerCase().replace(/[^a-z0-9]/g, "");
const norm = (s) => String(s || "").split("\n")[0]
  .toLowerCase().replace(/[^a-z0-9]/g, "");

const all = [];
for (const [n, r] of [["Level II/General", "public/data/Level II/General"],
                      ["Level II/Specific", "public/data/Level II/Specific"],
                      ["Level III", "public/data/Level III"]])
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json")))
    for (const q of JSON.parse(fs.readFileSync(path.join(r, f), "utf8")))
      all.push({ bank: n + "/" + f.replace(".json", ""), q });

const by = new Map();
for (const a of all) {
  const k = key(a.q);
  if (k.length < 20) continue;
  if (!by.has(k)) by.set(k, []);
  by.get(k).push(a);
}

const answerText = (q) => {
  const idx = Array.isArray(q.answer) ? q.answer : [q.answer];
  return idx.map((i) => norm((q.options || [])[i])).sort().join(" | ");
};

let conflict = 0, agree = 0;
for (const [, g] of by) {
  if (g.length < 2) continue;
  const texts = [...new Set(g.map(answerText))];
  if (texts.length === 1) { agree++; continue; }
  conflict++;
  console.log("=".repeat(74));
  console.log(String(g[0].q.question).split("\n")[0].slice(0, 100));
  for (const x of g) {
    const idx = Array.isArray(x.q.answer) ? x.q.answer : [x.q.answer];
    console.log("  " + (x.bank + " id" + x.q.id).padEnd(30) +
      "정답 " + idx.map((i) => i + 1).join(",") + "  →  " +
      idx.map((i) => String((x.q.options || [])[i]).split("\n")[0]).join(" / ").slice(0, 60));
  }
}
console.log("\n겹치는 무리 " + (conflict + agree) + "개 — 답이 같은 것 " + agree +
  " / ★ 답이 다른 것 " + conflict);
