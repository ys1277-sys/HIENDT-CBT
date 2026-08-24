/* 발표자료에 쓸 수치를 모은다 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

let total = 0, withImage = 0, withNote = 0, multi = 0;
const per = {};

for (const f of walk(PUB)) {
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);

  per[rel] = items.length;
  total += items.length;
  withImage += items.filter((q) => q.image).length;
  withNote += items.filter((q) => q.groupNote).length;
  multi += items.filter((q) => Array.isArray(q.answer)).length;
}

/* "Level III" 도 "Level II" 로 시작한다. 슬래시까지 봐야 안 섞인다 */
const lv2 = Object.entries(per)
  .filter(([k]) => k.startsWith("Level II/"))
  .reduce((a, [, v]) => a + v, 0);

console.log(`전체 ${total}문항  (Level II ${lv2} / Level III ${total - lv2})`);
console.log(`그림 붙은 문항 ${withImage} / 묶음 지시문 ${withNote} / 복수정답 ${multi}`);
console.log(`과목 파일 ${Object.keys(per).length}개\n`);

console.log("과목별");
for (const [k, v] of Object.entries(per)) console.log(`  ${k.padEnd(26)} ${v}`);

const m = JSON.parse(fs.readFileSync(`${PUB}/procedures/index.json`, "utf8")).procedures;
const docs = new Set(Object.values(m).map((v) => v.doc));
console.log(`\n절차서 등록 이름 ${Object.keys(m).length}개 / 실제 문서 ${docs.size}편`);
