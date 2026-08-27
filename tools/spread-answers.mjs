/*
 * 새로 지은 문항의 정답 자리를 고르게 편다.
 *
 *   node tools/spread-answers.mjs <은행>          보여만 준다
 *   node tools/spread-answers.mjs <은행> --써라    실제로 고친다
 *   node tools/spread-answers.mjs "Level II/General/RT" --써라
 *
 * 문항을 짓다 보면 정답 자리가 한쪽으로 쏠린다. RT 를 짓고 세어 보니
 * ①4 ②13 ③3 ④0 이었다. 검토 모드에서는 보기를 안 섞으므로(E02 7.3.1)
 * 그대로 두면 「②를 찍으면 얼추 맞는」 시험지가 된다.
 *
 * 보기의 글은 그대로 두고 자리만 맞바꾼다. 정답 번호도 함께 옮기므로
 * 어느 보기가 정답인지는 달라지지 않는다.
 *
 * 자리를 지켜야 하는 보기가 있는 문항은 건드리지 않는다 —
 * 「위의 모두」가 가운데로 오면 뜻이 무너진다. (src/optionShuffle.js)
 */
import fs from "node:fs";
import path from "node:path";
import { isLocked, callsByNumber } from "../src/optionShuffle.js";

const ROOT = "public/data";
const bank = process.argv[2];
const write = process.argv.includes("--써라");

if (!bank) {
  console.error("쓰는 법: node tools/spread-answers.mjs \"Level II/General/RT\" [--써라]");
  process.exit(1);
}

const file = path.join(ROOT, bank + ".json");
const items = JSON.parse(fs.readFileSync(file, "utf8"));

/* 새로 지은 문항만 본다. 원본 문항의 정답 자리는 안 건드린다 */
const isNew = (q) => q.note && /새로 지은 문항이다/.test(q.note);

const targets = items.filter(
  (q) =>
    isNew(q) &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.answer) &&
    !callsByNumber(q.options) &&
    !q.options.some(isLocked)
);

const count = (list) => {
  const c = [0, 0, 0, 0];
  for (const q of list) c[q.answer]++;
  return c;
};

const before = count(targets);
console.log(`${bank}  새 문항 ${targets.length}개`);
console.log(`   전 : ①${before[0]} ②${before[1]} ③${before[2]} ④${before[3]}`);

/*
 * 고르게 펴기.
 *
 * 나오는 차례대로 ① ② ③ ④ ① ② … 를 준다. 이미 그 자리에 있으면
 * 그대로 두고, 아니면 두 보기를 맞바꾼다. 셈이 정해져 있어 몇 번을
 * 돌려도 같은 결과가 된다.
 */
let moved = 0;

targets.forEach((q, i) => {
  const want = i % 4;
  if (q.answer === want) return;

  const o = q.options;
  [o[q.answer], o[want]] = [o[want], o[q.answer]];
  q.answer = want;
  moved++;
});

const after = count(targets);
console.log(`   후 : ①${after[0]} ②${after[1]} ③${after[2]} ④${after[3]}   (자리를 옮긴 문항 ${moved}개)`);

/* 건드리지 않은 것 */
const skipped = items.filter((q) => isNew(q) && !targets.includes(q));
if (skipped.length) {
  console.log(`   자리를 지켜야 하는 보기가 있어 건드리지 않은 문항 ${skipped.length}개`);
}

if (write) {
  fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
  console.log("   썼다.");
} else {
  console.log("   보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
}
