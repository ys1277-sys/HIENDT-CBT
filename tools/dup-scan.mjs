/*
 * 같은 문제가 두 군데 들어 있는지 본다.
 *
 * 응시자가 PT 전문시험을 보는데 일반시험 문제가 나오면 이상하다.
 * 은행 안에서 겹치는 것도, 은행끼리 겹치는 것도 찾는다.
 */
import fs from "node:fs";
import path from "node:path";

/* 견줄 때는 영어 문장만, 공백과 문장부호를 걷어내고 본다 */
const key = (q) => String(q.question || "").split("\n")[0]
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
  if (k.length < 20) continue;          /* 너무 짧으면 우연히 같을 수 있다 */
  if (!by.has(k)) by.set(k, []);
  by.get(k).push(a);
}

const same = [], cross = [];
for (const [, g] of by) {
  if (g.length < 2) continue;
  const banks = new Set(g.map((x) => x.bank));
  (banks.size === 1 ? same : cross).push(g);
}

const show = (title, list) => {
  console.log("=".repeat(74));
  console.log(title + " — " + list.length + "건");
  for (const g of list) {
    const en = String(g[0].q.question).split("\n")[0];
    console.log("\n  " + en.slice(0, 96));
    for (const x of g) {
      const ans = Array.isArray(x.q.answer) ? x.q.answer.join(",") : x.q.answer;
      console.log("     " + (x.bank + " id" + x.q.id).padEnd(30) +
        "정답 " + ans + " / 보기 " + (x.q.options || []).length + "개");
    }
    /* 정답이 서로 다르면 둘 중 하나는 틀렸다 */
    const opts = g.map((x) => JSON.stringify(x.q.options));
    const ans = g.map((x) => JSON.stringify(x.q.answer));
    if (new Set(ans).size > 1 || new Set(opts).size > 1)
      console.log("     ★ 보기나 정답이 서로 다르다");
  }
  console.log();
};

show("한 은행 안에서 겹침", same);
show("은행끼리 겹침", cross);
console.log(`문항 ${all.length}개 가운데 겹치는 무리 ${same.length + cross.length}개`);
