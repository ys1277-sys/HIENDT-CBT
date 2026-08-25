/*
 * 문제은행의 영어와 한국어를 본다.
 * 기계로 확실히 잡히는 것만 본다. 뜻이 맞는지는 사람이 읽어야 한다.
 */
import fs from "node:fs";
import path from "node:path";

const H = /[가-힣]/;
const load = () => {
  const out = [];
  for (const [n, r] of [["일반", "public/data/Level II/General"],
                        ["전문", "public/data/Level II/Specific"],
                        ["LIII", "public/data/Level III"]])
    for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json")))
      for (const q of JSON.parse(fs.readFileSync(path.join(r, f), "utf8")))
        out.push({ bank: n + "/" + f.replace(".json", ""), q });
  return out;
};

const all = load();
const hits = {};
const add = (k, bank, id, msg) => (hits[k] ??= []).push(`${bank} id${id}  ${msg}`);

for (const { bank, q } of all) {
  const [en, ...rest] = String(q.question || "").split("\n");
  const ko = rest.join(" ").trim();

  /* 1. 한국어 번역이 없다 */
  if (!ko && /[A-Za-z]{4}/.test(en)) add("번역 없음", bank, q.id, en.slice(0, 78));

  /* 2. 영어 줄에 한국어가 섞였다 */
  if (H.test(en)) add("영어 줄에 한국어", bank, q.id, en.slice(0, 78));

  /* 3. 한국어 줄에 영어 문장이 통째로 */
  if (ko && /[A-Za-z]{4,}\s+[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(ko))
    add("한국어 줄에 영어 문장", bank, q.id, ko.slice(0, 78));

  /* 4. 같은 낱말이 두 번 잇달아 */
  const dbl = en.match(/\b([A-Za-z]{2,})\s+\1\b/i);
  if (dbl) add("낱말 겹침", bank, q.id, `「${dbl[0]}」  ${en.slice(0, 60)}`);

  /* 5. 깨진 글자 */
  const bad = String(q.question).match(/[\uFFFD\u00D8\u00A8\u00AA]/);
  if (bad) add("깨진 글자", bank, q.id, JSON.stringify(bad[0]) + "  " + en.slice(0, 60));

  const opts = (q.options || []).map(String);

  /* 6. 정답 번호가 보기 밖 */
  const idx = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (idx.some((i) => !Number.isInteger(i) || i < 0 || i >= opts.length))
    add("정답 번호가 보기 밖", bank, q.id, `정답 ${JSON.stringify(q.answer)} / 보기 ${opts.length}개`);

  /* 7. 보기가 서로 같다 */
  const seen = new Map();
  opts.forEach((o, i) => {
    const k = o.toLowerCase().replace(/\s/g, "");
    if (seen.has(k)) add("보기가 서로 같음", bank, q.id,
      `${seen.get(k) + 1}번 = ${i + 1}번  「${o.split("\n")[0].slice(0, 40)}」`);
    else seen.set(k, i);
  });

  /* 8. 보기가 비었다 */
  opts.forEach((o, i) => { if (!o.trim()) add("보기가 빔", bank, q.id, `${i + 1}번`); });

  /* 9. 보기 안에 보기 번호가 남았다 (A. B. C. 따위) */
  opts.forEach((o, i) => {
    if (/\s[A-E]\.\s/.test(o)) add("보기 안에 보기 번호", bank, q.id,
      `${i + 1}번  「${o.split("\n")[0].slice(0, 50)}」`);
  });

  /* 10. 보기 수가 2개 미만 */
  if (opts.length < 2) add("보기가 모자람", bank, q.id, `${opts.length}개`);

  /*
   * 11. 번역이 빠진 보기.
   *     줄바꿈이 있으면 번역한 것으로 본다. 옮긴 쪽에 한글이 없을 수도
   *     있다 (MT Level Ⅰ and Ⅱ → MT Level Ⅰ, Ⅱ). 한글만 세면 헛짖는다.
   */
  const done = (o) => o.includes("\n") || H.test(o);
  const koCnt = opts.filter(done).length;
  if (koCnt > 0 && koCnt < opts.length) {
    const miss = opts.map((o, i) => done(o) ? null : i + 1).filter(Boolean);
    const real = miss.filter((i) => /[A-Za-z]{3,}/.test(opts[i - 1]));
    if (real.length) add("일부 보기만 번역", bank, q.id,
      `${real.join(",")}번  「${real.map((i) => opts[i - 1].split("\n")[0]).join(" / ").slice(0, 60)}」`);
  }
}

let tot = 0;
for (const [k, v] of Object.entries(hits)) {
  console.log("=".repeat(74));
  console.log(k + " — " + v.length + "건");
  v.slice(0, 14).forEach((s) => console.log("  " + s));
  if (v.length > 14) console.log("  … 외 " + (v.length - 14));
  tot += v.length;
}
console.log("\n문항 " + all.length + "개 / 걸린 것 " + tot + "건");
