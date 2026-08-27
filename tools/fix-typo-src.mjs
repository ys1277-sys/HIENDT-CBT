/*
 * 원본 시험지에 있던 영문 오타를 바로잡는다.
 *
 *   node tools/fix-typo-src.mjs         무엇이 바뀌는지 보여만 준다
 *   node tools/fix-typo-src.mjs --써라   실제로 고친다
 *
 * 여기 든 것은 다 원본 hwp 시험지에 그대로 있던 철자다. 옮기면서 생긴
 * 것이 아니다. 뜻이 달라지지 않는 철자만 다룬다 — 낱말을 바꾸거나
 * 보기를 손보지 않는다.
 *
 * 앞선 작업에서 이미 고쳐 둔 것이 여섯 가지 있었다(pahse -> phase,
 * focussed -> focused 등). 어떤 것은 고치고 어떤 것은 두면 기준이
 * 왔다 갔다 하므로 나머지도 다 맞춘다.
 *
 * 고친 자리는 문항의 note 에 남긴다. note 는 화면에 안 뜨고 종목
 * NDE Level Ⅲ 가 나중에 무엇이 바뀌었는지 볼 수 있게 하는 메모다.
 * (HIE-QP-E02 6.1.2)
 */
import fs from "node:fs";
import path from "node:path";

/* 은행 → id → [틀린 말, 바른 말] */
const FIX = [
  ["Level II/General/MT",   22, "Mamgetic",         "Magnetic"],
  ["Level II/General/MT",   20, "cabels",           "cables"],
  ["Level II/Specific/MT",  16, "exanimation",      "examination"],
  ["Level II/General/PT",   18, "Immedicately",     "Immediately"],
  ["Level II/General/PT",    3, "penetrantes",      "penetrants"],
  ["Level II/General/VT",   37, "Denritic",         "Dendritic"],
  ["Level II/General/VT",    6, "equiped",          "equipped"],
  ["Level II/General/VT",   40, "trasnformation",   "transformation"],
  ["Level II/General/RT",   33, "increases upto",   "increases up to"],
  ["Level III/UT",         105, "Accpetable",       "Acceptable"],
  ["Level III/MT",          96, "Jeager",           "Jaeger"],
  ["Level III/MT",          69, "magnetic witing",  "magnetic writing"],
  ["Level III/RT",          32, "zeroradiography",  "xeroradiography"],
  ["Level III/RT",          99, "radiographicall,", "radiographically,"],
];

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/* 한 문항 안의 모든 글자밭에서 바꾼다 */
function swap(q, from, to) {
  let n = 0;

  const fix = (s) => {
    if (typeof s !== "string" || !s.includes(from)) return s;
    n += s.split(from).length - 1;
    return s.split(from).join(to);
  };

  q.question = fix(q.question);
  if (q.groupNote) q.groupNote = fix(q.groupNote);
  if (Array.isArray(q.options)) q.options = q.options.map(fix);

  /* 주관식 정답이 그 낱말일 수 있다 */
  if (typeof q.answer === "string") q.answer = fix(q.answer);

  return n;
}

let touched = 0;
let missed = 0;

for (const [bank, id, from, to] of FIX) {
  const file = path.join(ROOT, bank + ".json");

  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch {
    console.log(`★ ${bank} 를 못 읽음`);
    missed++;
    continue;
  }

  const q = items.find((x) => x.id === id);
  if (!q) { console.log(`★ ${bank} id${id} 없음`); missed++; continue; }

  const n = swap(q, from, to);
  if (!n) { console.log(`★ ${bank} id${id} 에 「${from}」 없음`); missed++; continue; }

  const memo = `원본 시험지의 철자 「${from}」을 「${to}」로 바로잡음 (2026-08-27)`;
  q.note = q.note ? `${q.note}\n${memo}` : memo;

  console.log(`${bank.padEnd(24)} id${String(id).padStart(3)}  ${from} → ${to}  (${n}군데)`);
  touched++;

  if (write) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log("");
console.log(`고친 문항 ${touched}개 · 못 찾은 것 ${missed}개`);
if (!write) console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
