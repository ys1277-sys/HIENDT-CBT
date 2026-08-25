/*
 * 남은 여덟 문항을 넷으로 맞춘다.
 *
 * 복수정답 여섯은 항목을 묶어 조합형으로 바꾼다. 규칙은 to-combo.mjs 와 같다.
 *   정답 조합은 원본 그대로, 오답 조합만 새로 만든다.
 *   네 보기의 항목 수를 같게 한다.
 *   오답 조합에는 원본에서 오답인 항목이 반드시 하나 이상 들어간다.
 *   정답 자리를 한 번호에 몰지 않는다.
 *
 * 「다른 보기 번호를 가리킨다」고 걸러 뒀던 둘은 살펴보니 ⑤만 빼면 된다.
 *   일반/VT 42  ⑤ "both 2 and 3 above" 가 오답이라 지워도 남는 번호가 안 흔들린다
 *   전문/RFT 11 정답이 ④ "Both 1 & 2" 인데 1·2 가 그대로 남아 참조가 살아 있다
 *
 * ★ 오답 조합은 내가 지은 것이다. 해당 종목 NDE Level Ⅲ 의 확인이 필요하다
 *   (HIE-QP-E02 6.1.2, 6.3.1). 각 문항의 note 에 적어 둔다.
 */
import fs from "node:fs";

const DRY = process.argv.includes("--dry");
const G = "public/data/Level II/General/";
const S = "public/data/Level II/Specific/";
const T = "public/data/Level III/";

const NOTE =
  "원본은 여러 보기 가운데 복수정답을 고르는 문항이었다. 오답 보기를 지워 넷으로 " +
  "줄이면 정답 비율이 올라가 문제가 쉬워지므로, 항목을 묶어 조합형 4지선다로 바꿨다. " +
  "정답 조합은 원본 정답 그대로이고 오답 조합은 새로 만든 것이다. 네 보기의 항목 수를 " +
  "같게 맞춰 개수로 답이 드러나지 않게 했다. " +
  "★ 오답 조합은 해당 종목 NDE Level Ⅲ 의 확인이 필요하다 (HIE-QP-E02 6.1.2, 6.3.1).";

const COMBO = [];

/* 일반/MT 7 — 무관지시의 원인 셋 */
{
  const x = {
    sec:  { en: "Change in section", ko: "단면의 변화" },
    hole: { en: "drilled holes near test surface", ko: "시험 표면 근처의 구멍" },
    blow: { en: "Blow holes", ko: "블로홀" },
    lof:  { en: "Lack of fusion", ko: "융합 불량" },
    grind:{ en: "Grinding cracks", ko: "연삭 균열" },
  };
  COMBO.push({ file: G + "MT.json", id: 7,
    question: "Which group lists three causes of nonrelevant indications?\n" +
              "무관지시(nonrelevant indication)의 원인끼리 묶은 것은?",
    groups: [[x.lof, x.sec, x.grind], [x.sec, x.hole, x.blow], [x.lof, x.grind, x.blow], [x.sec, x.lof, x.hole]],
    answer: 1 });
}

/* LIII/PT 78 — 절차 재검증이 필요한 때 */
{
  const x = {
    pre:  { en: "when a change is made in the type of precleaning materials", ko: "전처리 세척 재료의 종류가 바뀔 때" },
    pen:  { en: "when a change is made in the type of penetrant materials", ko: "침투 재료의 종류가 바뀔 때" },
    year: { en: "annually thereafter", ko: "그 뒤로 매년" },
    per:  { en: "when personnel (operators) are changed", ko: "작업자가 바뀔 때" },
  };
  COMBO.push({ file: T + "PT.json", id: 78,
    question: "After a procedure is qualified in accordance with Article 6 of ASME Section Ⅴ, " +
              "which group lists the cases where requalification is needed?\n" +
              "ASME Section Ⅴ Article 6에 따라 절차를 검증한 뒤, 재검증이 필요한 경우끼리 묶은 것은?",
    groups: [[x.year, x.per], [x.pen, x.per], [x.year, x.pre], [x.pre, x.pen]],
    answer: 3 });
}

/* LIII/RT 42 — X선관 타겟 재료의 성질 */
{
  const x = {
    mp:   { en: "high melting point", ko: "높은 융점" },
    tc:   { en: "high thermal conductivity", ko: "높은 열전도율" },
    hiZ:  { en: "high atomic number", ko: "높은 원자번호" },
    loZ:  { en: "low atomic number", ko: "낮은 원자번호" },
  };
  COMBO.push({ file: T + "RT.json", id: 42,
    question: "Which group lists the properties that target materials for x-ray tubes must possess?\n" +
              "X선관의 타겟 재료가 갖춰야 할 성질끼리 묶은 것은?",
    groups: [[x.mp, x.tc, x.loZ], [x.mp, x.loZ, x.hiZ], [x.mp, x.tc, x.hiZ], [x.tc, x.loZ, x.hiZ]],
    answer: 2 });
}

/* LIII/RT 55 — 감도를 높이는 방법 */
{
  const x = {
    slow: { en: "Use a slower film", ko: "감도가 느린 필름을 쓴다" },
    down: { en: "Reduce the KV of the x-ray machine used", ko: "사용하는 X선 장치의 관전압을 낮춘다" },
    shield:{ en: "Add shielding for back scatter", ko: "후방산란용 차폐를 추가한다" },
    sfd:  { en: "Reduce the source-to-film distance", ko: "선원-필름 거리를 줄인다" },
    up:   { en: "Increase the KV of the x-ray machine used", ko: "사용하는 X선 장치의 관전압을 높인다" },
  };
  COMBO.push({ file: T + "RT.json", id: 55,
    question: "A radiograph showing poor sensitivity is to be retaken. " +
              "Which group lists the changes that would improve the sensitivity?\n" +
              "감도가 나쁜 방사선사진을 다시 찍으려 한다. 감도를 높이는 방법끼리 묶은 것은?",
    groups: [[x.sfd, x.slow, x.up], [x.slow, x.down, x.shield], [x.sfd, x.up, x.shield], [x.slow, x.up, x.shield]],
    answer: 1 });
}

/* LIII/RT 57 — 관용도에 영향을 주는 것 */
{
  const x = {
    film: { en: "The type of film used", ko: "사용한 필름의 종류" },
    eng:  { en: "The energy level or quality of the radiation beam", ko: "방사선 빔의 에너지 준위 또는 선질" },
    sfd:  { en: "The source-to-film distance", ko: "선원-필름 거리" },
    spot: { en: "The effective focal spot size", ko: "유효 초점 크기" },
    len:  { en: "The length of the film used", ko: "사용한 필름의 길이" },
  };
  COMBO.push({ file: T + "RT.json", id: 57,
    question: "Which group lists the items that affect latitude?\n" +
              "관용도(latitude)에 영향을 주는 것끼리 묶은 것은?",
    groups: [[x.film, x.eng], [x.sfd, x.spot], [x.film, x.spot], [x.eng, x.len]],
    answer: 0 });
}

/* LIII/RT 60 — X선 발생에 최소한 필요한 것 */
{
  const x = {
    acc:  { en: "a means of accelerating electrons", ko: "전자를 가속하는 수단" },
    tgt:  { en: "a target", ko: "표적" },
    src:  { en: "a source of free electrons", ko: "자유전자의 공급원" },
    be:   { en: "a beryllium window", ko: "베릴륨 창" },
    cu:   { en: "a copper anode", ko: "구리 양극" },
  };
  COMBO.push({ file: T + "RT.json", id: 60,
    question: "Which group lists what a system must have as a minimum in order to produce x-rays?\n" +
              "X선을 발생시키는 데 최소한 필요한 것끼리 묶은 것은?",
    groups: [[x.be, x.acc, x.tgt], [x.tgt, x.src, x.cu], [x.acc, x.tgt, x.src], [x.be, x.src, x.cu]],
    answer: 2 });
}

/* ⑤만 덜어내면 되는 둘 */
const TRIM = [
  { file: G + "VT.json", id: 42, drop: 4, answer: 3,
    why: "⑤ 「both 2 and 3 above」는 오답이라 지워도 남는 보기 번호가 흔들리지 않는다." },
  { file: S + "RFT.json", id: 11, drop: 4, answer: 3,
    why: "정답 ④ 「Both 1 & 2」가 가리키는 ①·②가 그대로 남아 참조가 살아 있다. ⑤만 덜어냈다." },
];

/* ── 적용 ─────────────────────────────── */
let n = 0;
const join = (g) => g.map((x) => x.en).join(" · ") + "\n" + g.map((x) => x.ko).join(" · ");

for (const j of COMBO) {
  const bank = JSON.parse(fs.readFileSync(j.file, "utf8"));
  const q = bank.find((x) => x.id === j.id);
  if (!q) { console.error("  ! 못 찾음 " + j.file + " id" + j.id); continue; }
  if (new Set(j.groups.map((g) => g.length)).size !== 1) {
    console.error("  ! 항목 수가 보기마다 다르다 " + j.id); continue;
  }
  q.question = j.question;
  q.options = j.groups.map(join);
  q.answer = j.answer;
  q.note = NOTE;
  if (!DRY) fs.writeFileSync(j.file, JSON.stringify(bank, null, 2) + "\n");

  console.log("■ " + j.file.split("/").slice(-2).join("/") + " id" + j.id +
    "  항목 " + j.groups[0].length + "개씩  정답 " + "①②③④"[j.answer]);
  j.groups.forEach((g, i) =>
    console.log("   " + (i === j.answer ? "▶" : " ") + "①②③④"[i] + " " +
      g.map((x) => x.ko).join(" · ").slice(0, 74)));
  n++;
}

for (const t of TRIM) {
  const bank = JSON.parse(fs.readFileSync(t.file, "utf8"));
  const q = bank.find((x) => x.id === t.id);
  if (!q) { console.error("  ! 못 찾음 " + t.file + " id" + t.id); continue; }
  const gone = String(q.options[t.drop]).split("\n")[0];
  q.options = q.options.filter((_, i) => i !== t.drop);
  q.answer = t.answer;
  q.note = "보기를 넷으로 맞추면서 「" + gone + "」을 덜어냈다. " + t.why;
  if (!DRY) fs.writeFileSync(t.file, JSON.stringify(bank, null, 2) + "\n");
  console.log("■ " + t.file.split("/").slice(-2).join("/") + " id" + t.id +
    "  「" + gone + "」 덜어냄  정답 " + "①②③④"[t.answer]);
  n++;
}

console.log("\n" + (DRY ? "[미리보기] " : "") + "바꾼 문항 " + n + "개");
