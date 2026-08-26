/*
 * 한 문항 안에서 보기가 겹치는 것을 찾는다.
 *
 *   node tools/dup-option.mjs
 *
 * 같은 보기가 둘 있으면 응시자는 어느 쪽을 골라야 할지 알 수 없다.
 * 정답이 그 둘이 아니면 채점은 되지만, 시험지로는 결함이다.
 *
 * 영문만 견준다. 한글은 뒤에 붙는 풀이라 조금 달라도 같은 보기다.
 *
 * 처음에는 첫 줄만 견줬는데, 영문이 두 줄인 긴 보기에서 앞줄만 같아도
 * 겹친다고 잡았다. 한글이 없는 줄을 다 모아 견준다.
 */
import fs from "node:fs";
import path from "node:path";

const HANGUL = /[가-힣]/;

const eng = s => String(s)
  .split("\n")
  .filter(line => !HANGUL.test(line))
  .join(" ")
  .trim().toLowerCase()
  .replace(/\s+/g, " ").replace(/[.．]$/, "");

let files = 0, hits = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!f.endsWith(".json")) continue;

    let bank;
    try { bank = JSON.parse(fs.readFileSync(p, "utf8")); } catch { continue; }
    if (!Array.isArray(bank)) continue;

    files++;
    const name = p.replace(/^public[\/]data[\/]/, "");

    for (const q of bank) {
      const opts = q.options || [];
      if (opts.length < 2) continue;

      const seen = new Map();
      for (let i = 0; i < opts.length; i++) {
        const k = eng(opts[i]);
        if (!k) continue;
        if (!seen.has(k)) seen.set(k, []);
        seen.get(k).push(i);
      }

      for (const [k, at] of seen) {
        if (at.length < 2) continue;
        hits++;
        console.log(`${name}  id${q.id}`);
        console.log(`   ${at.map(i => i + 1).join("번 · ")}번이 같다 : ${opts[at[0]].split("\n")[0]}`);
        console.log(`   정답 ${q.answer + 1}번${at.includes(q.answer) ? "  ★ 정답이 그 안에 있다" : ""}`);
        console.log("");
      }
    }
  }
}

walk("public/data");
console.log(`은행 ${files}개 · 보기가 겹치는 자리 ${hits}건`);
