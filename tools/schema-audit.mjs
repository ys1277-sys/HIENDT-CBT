/*
 * 문제은행 24개가 서로 다른 꼴로 쌓여 있다.
 * 어느 파일이 어떤 필드를 쓰는지, 한국어를 어디에 담는지 본다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  ["Level II/General", "public/data/Level II/General"],
  ["Level II/Specific", "public/data/Level II/Specific"],
  ["Level III", "public/data/Level III"],
];

const FIELDS = ["id","level","method","category","subject","source","question",
  "question_kr","question_original","korean","options","answer","groupNote",
  "explanation","type","image"];

const rows = [];
for (const [name, r] of ROOTS) {
  if (!fs.existsSync(r)) continue;
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(r, f), "utf8")).flat(Infinity);
    const has = {};
    for (const k of FIELDS) has[k] = j.filter((q) => q[k] !== undefined).length;

    /* 한국어를 어디에 담았나 */
    const koInQ = j.filter((q) => /\n/.test(q.question || "")).length;
    const koField = has.question_kr + has.korean;

    rows.push({ file: name + "/" + f.replace(".json", ""), n: j.length, has, koInQ, koField });
  }
}

const W = 26;
console.log("파일".padEnd(W) + "수".padStart(4) +
  FIELDS.filter((k) => !["id","question","options","answer"].includes(k))
    .map((k) => k.slice(0, 8).padStart(10)).join(""));

for (const r of rows) {
  console.log(
    r.file.padEnd(W) + String(r.n).padStart(4) +
    FIELDS.filter((k) => !["id","question","options","answer"].includes(k))
      .map((k) => (r.has[k] === 0 ? "·" : r.has[k] === r.n ? "전부" : String(r.has[k]))
        .padStart(10)).join("")
  );
}

console.log("\n한국어를 어디에 담았나  (question 안 줄바꿈 / 따로 필드)");
for (const r of rows) {
  const a = r.koInQ, b = r.koField;
  const how = b === 0 ? "question 안에 줄바꿈" :
              a === 0 ? "따로 필드(question_kr·korean)" : "★ 섞여 있음";
  console.log("  " + r.file.padEnd(W) + `줄바꿈 ${String(a).padStart(4)} / 필드 ${String(b).padStart(4)}   ${how}`);
}
