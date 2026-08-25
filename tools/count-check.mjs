/*
 * 시험마다 실제로 몇 문항이 나가는지, 그것이 HIE-QP-E01 표 3 의
 * 최소 문제 수를 채우는지 본다.
 */
import fs from "node:fs";
/*
 * src/ExamData.jsx 는 확장자 때문에 node 가 바로 못 읽는다.
 * JSX 문법이 없는 데이터 모듈이라 글자를 그대로 읽어 평가한다.
 */
const SRC = fs.readFileSync(new URL("../src/ExamData.jsx", import.meta.url), "utf8");
const { QUESTION_COUNT, questionCount } = await import(
  "data:text/javascript," + encodeURIComponent(SRC.replace(/export default[sS]*$/, ""))
);

/* HIE-QP-E01(Rev.8) 표 3 — Level Ⅱ 최소 문제 수 */
const NEED = {
  RT:   { General: 40, Specific: 20 },
  MT:   { General: 40, Specific: 20 },
  UT:   { General: 40, Specific: 20 },
  PT:   { General: 40, Specific: 20 },
  VT:   { General: 40, Specific: 20 },
  ECT:  { General: 40, Specific: 20 },
  RFT:  { General: 40, Specific: 20 },
  TOFD: { General: 40, Specific: 30 },
  PAUT: { General: 40, Specific: 30 },
};

const bank = (sub, m) => {
  const p = `public/data/Level II/${sub}/${m}.json`;
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")).flat(Infinity).length;
};

console.log("종목   구분        규정   은행   뽑는수   실제출제   판정");

let short = 0;

for (const m of Object.keys(NEED)) {
  for (const sub of ["General", "Specific"]) {
    const n = bank(sub, m);
    if (n === null) continue;

    const need = NEED[m][sub];
    const want = questionCount("Level II", sub, m);
    const real = want === null ? n : Math.min(want, n);

    const ok = real >= need;
    if (!ok) short++;

    console.log(
      m.padEnd(6) + sub.padEnd(12) +
      String(need).padStart(4) + String(n).padStart(7) +
      String(want ?? "전체").padStart(9) + String(real).padStart(11) +
      "   " + (ok ? "충족" : `★ ${need - real}문항 모자람`)
    );
  }
}

console.log(short ? `\n모자란 시험 ${short}개 — 문항을 보충해야 한다` : "\n모든 시험이 표 3 을 채운다");
