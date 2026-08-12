/*
 * 앱의 채점 경로를 그대로 흉내내어 검증한다. (src/grading.js 와 같은 규칙)
 *   Quiz.jsx   : list.flat().filter(q => Array.isArray(q.options))
 *   grading.js : 단일선택 / 복수선택 / 주관식
 * 정답을 모두 맞힌 응시자를 가정했을 때 100점이 나와야 정상이다.
 */
import fs from "node:fs";

const B = "D:/Visual Studio Code/HIENDT-CBT/public/data/";
const FILES = [
  ...["ECT", "UT", "MT", "PT", "RT", "VT", "PAUT", "RFT", "TOFD"].flatMap((m) => [
    `Level II/General/${m}.json`,
    `Level II/Specific/${m}.json`,
  ]),
  ...["Basic", "MT", "PT", "RT", "UT", "VT"].map((m) => `Level III/${m}.json`),
];

const MULTI = "multi", TEXT = "text", SINGLE = "single";

const questionType = (q) => {
  if (Array.isArray(q && q.answer)) return MULTI;
  return Array.isArray(q && q.options) && q.options.length > 0 ? SINGLE : TEXT;
};

const normalizeText = (v) =>
  String(v == null ? "" : v)
    .toLowerCase()
    .replace(/[()[\]{}"'`~!?;:*_]/g, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sortedUnique = (l) =>
  [...new Set(l.map(Number))].filter(Number.isFinite).sort((a, b) => a - b);

function isCorrect(q, user) {
  switch (questionType(q)) {
    case MULTI: {
      if (!Array.isArray(user)) return false;
      const got = sortedUnique(user), want = sortedUnique(q.answer);
      return want.length > 0 && got.length === want.length && got.every((v, i) => v === want[i]);
    }
    case TEXT: {
      const want = normalizeText(q.answer);
      return want !== "" && normalizeText(user) === want;
    }
    default:
      if (user === undefined || user === null || user === "") return false;
      return Number(user) === Number(q.answer);
  }
}

let allGood = true;

for (const rel of FILES) {
  const raw = fs.readFileSync(B + rel, "utf8");
  const data = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);

  let list = Array.isArray(data) ? data : Array.isArray(data.questions) ? data.questions : [];
  list = list.flat().filter((q) => Array.isArray(q.options));

  // 만점 응시자: 정답을 그대로 답으로 낸다
  const answers = {};
  list.forEach((q, i) => (answers[i] = q.answer));

  let correct = 0;
  const failed = [];
  list.forEach((q, i) => {
    if (isCorrect(q, answers[i])) correct++;
    else failed.push(`id=${q.id}(${questionType(q)}, ${JSON.stringify(q.answer)})`);
  });

  const score = list.length === 0 ? 0 : Math.round((correct / list.length) * 100);
  const counts = { single: 0, multi: 0, text: 0 };
  list.forEach((q) => counts[questionType(q)]++);

  const ok = score === 100 && list.length > 0;
  if (!ok) allGood = false;

  console.log(
    `${ok ? "OK  " : "FAIL"} ${rel.padEnd(30)} ${String(list.length).padStart(2)}문항 ` +
    `(단일 ${String(counts.single).padStart(2)} 복수 ${counts.multi} 주관 ${String(counts.text).padStart(2)}) ` +
    `만점시 ${String(score).padStart(3)}점` +
    (failed.length ? `  실패: ${failed.slice(0, 4).join(", ")}` : "")
  );
}

console.log(allGood ? "\n전체 통과" : "\n일부 확인 필요");
