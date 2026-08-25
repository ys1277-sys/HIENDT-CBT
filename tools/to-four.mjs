/*
 * 보기가 다섯인 문항을 넷으로 맞춘다.
 *
 * 문항마다 성격이 달라 한 가지 방법으로는 안 된다.
 *
 *   가) 단일정답이고 정답이 ①~④  → 오답인 ⑤를 덜어낸다. 가장 안전하다.
 *   나) 단일정답인데 정답이 ⑤     → ⑤를 못 지우니 오답 하나를 대신 덜어낸다.
 *   다) 복수정답                   → 항목을 묶어 조합형으로 바꿔야 한다.
 *                                    tools/to-combo.mjs 처럼 손으로 짜야 하므로
 *                                    여기서는 건드리지 않고 목록만 낸다.
 *   라) 보기가 다른 보기 번호를 가리킴 ("both 2 and 3 above")
 *                                  → 하나만 덜어내도 가리키는 번호가 어긋난다.
 *                                    건드리지 않고 목록만 낸다.
 *
 * 쓰임 : node tools/to-four.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

const BANKS = [
  ["일반", "public/data/Level II/General"],
  ["전문", "public/data/Level II/Specific"],
  ["LIII", "public/data/Level III"],
];

/* 다른 보기 번호를 가리키는가 — "both 2 and 3", "1 and 2 above", "①②" */
const REFS = /\b(both|either)\s+\d|\b\d\s+(and|or)\s+\d\b|[①②③④⑤]|보기\s*\d/i;

const 손봄 = [], 조합필요 = [], 번호참조 = [];

for (const [b, dir] of BANKS) {
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const p = path.join(dir, f);
    const bank = JSON.parse(fs.readFileSync(p, "utf8"));
    let touched = false;

    for (const q of bank) {
      const opts = q.options || [];
      if (opts.length !== 5) continue;

      const name = b + "/" + f.replace(".json", "") + " id" + q.id;
      const ans = Array.isArray(q.answer) ? q.answer : [q.answer];

      if (ans.length > 1) { 조합필요.push([name, q]); continue; }
      if (opts.some((o) => REFS.test(String(o)))) { 번호참조.push([name, q]); continue; }

      const a = ans[0];

      /* 덜어낼 오답을 고른다. 정답이 아닌 것 가운데 하나 */
      let drop;
      if (a !== 4) drop = 4;                 /* 가) 끝의 오답을 덜어낸다 */
      else drop = opts.findIndex((_, i) => i !== a);  /* 나) 앞쪽 오답을 덜어낸다 */

      const before = opts.map((o) => String(o).split("\n")[0]);
      q.options = opts.filter((_, i) => i !== drop);
      q.answer = a > drop ? a - 1 : a;
      q.note = (q.note ? q.note + " " : "") +
        "보기를 넷으로 맞추면서 오답 「" + before[drop].slice(0, 40) + "」을 덜어냈다. " +
        "정답과 묻는 내용은 그대로다.";

      손봄.push([name, before[drop], "①②③④"[q.answer]]);
      touched = true;
    }

    if (touched && !DRY) fs.writeFileSync(p, JSON.stringify(bank, null, 2) + "\n");
  }
}

console.log("오답 하나를 덜어낸 문항 " + 손봄.length + "개");
for (const [n, d, a] of 손봄)
  console.log("   " + n.padEnd(20) + " 덜어냄 「" + d.slice(0, 42) + "」  정답 " + a);

console.log("\n손으로 짜야 하는 것");
console.log("  복수정답 " + 조합필요.length + "개 — 항목을 묶어 조합형으로 바꿔야 한다");
for (const [n, q] of 조합필요)
  console.log("     " + n + "  정답 " + q.answer.map((i) => i + 1).join(",") +
    "  " + String(q.question).split("\n")[0].slice(0, 56));

console.log("  보기가 다른 번호를 가리킴 " + 번호참조.length + "개 — 하나만 빼도 번호가 어긋난다");
for (const [n, q] of 번호참조)
  console.log("     " + n + "  " + q.options.map((o) => String(o).split("\n")[0]).join(" / ").slice(0, 70));

console.log("\n" + (DRY ? "[미리보기]" : "고쳤다"));
