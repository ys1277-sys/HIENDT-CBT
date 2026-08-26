/*
 * src/history.js 검사
 *
 * 규정을 옮긴 계산이라 값으로 확인한다. 특히 날짜 — "만료되는 달의
 * 마지막 날" 은 말로는 쉬운데 윤년과 월말에서 어긋나기 쉽다.
 *
 *   node tools/history-test.mjs
 */
import {
  endOfMonth, addYearsToEndOfMonth, certExpiry, eyeExpiry,
  daysLeft, expiryState, examKind, unitKey, requiredKinds,
  average, judgeUnit, pickAttempt, retakeIssues,
  buildHistory, expiringSoon, ymd,
} from "../src/history.js";

let pass = 0, fail = 0;

function eq(got, want, label) {
  const g = got instanceof Date ? ymd(got) : String(got);
  const w = want instanceof Date ? ymd(want) : String(want);
  if (g === w) { pass++; return; }
  fail++;
  console.log(`  ✗ ${label}\n      나온 값 ${g}\n      바른 값 ${w}`);
}

function section(t) { console.log("\n" + t); }

/* ── 날짜 ───────────────────────────────────── */
section("만료일 — E03 6.1.1 「만료되는 달의 마지막 날」");

eq(endOfMonth("2026-02-10"), "2026-02-28", "2월 말일 (평년)");
eq(endOfMonth("2028-02-10"), "2028-02-29", "2월 말일 (윤년)");

eq(certExpiry("Level II", "2026-08-26"), "2029-08-31", "Level Ⅱ 3년");
eq(certExpiry("Level III", "2026-08-26"), "2031-08-31", "Level Ⅲ 5년");
eq(certExpiry("Level II", "2026-08-01"), "2029-08-31", "달 초에 인증해도 그 달 말일");
eq(certExpiry("Level II", "2026-08-31"), "2029-08-31", "달 말에 인증해도 같은 날");

/* 윤년 2월 29일 인증 — 3년 뒤는 평년이라 말일이 28일 */
eq(certExpiry("Level II", "2028-02-29"), "2031-02-28", "윤일 인증, 3년 뒤 평년");
/* Level Ⅲ 는 5년 뒤가 다시 윤년 */
eq(certExpiry("Level III", "2028-02-29"), "2033-02-28", "윤일 인증, 5년 뒤");
eq(certExpiry("Level III", "2027-02-10"), "2032-02-29", "5년 뒤가 윤년이면 29일");

eq(certExpiry("Level II", ""), "null", "인증일자를 모르면 만료일도 없다");
eq(certExpiry("Level IV", "2026-08-26"), "null", "모르는 등급");

section("시력검사 — E03 6.1.2 「검사일로부터 1년 뒤 만료 월의 마지막 날」");
eq(eyeExpiry("2026-08-26"), "2027-08-31", "1년 뒤 그 달 말일");
eq(eyeExpiry("2026-12-15"), "2027-12-31", "연말");

section("남은 날수와 상태 — E03 6.2.1 「만료 3개월 전까지」");
const 오늘 = new Date(2026, 7, 26);          /* 2026-08-26 */

eq(daysLeft("2026-08-26", 오늘), "0", "만료일 당일은 0");
eq(expiryState("2026-08-26", 오늘), "warn", "만료일 당일 — 아직 유효하지만 알려야 한다");
eq(expiryState("2026-08-25", 오늘), "expired", "하루 지나면 만료");
eq(expiryState("2026-11-26", 오늘), "warn", "석 달 뒤 — 알려야 한다");
eq(expiryState("2026-11-25", 오늘), "warn", "석 달 안");
eq(expiryState("2026-11-27", 오늘), "valid", "석 달 하고 하루 더 남음");
eq(expiryState("", 오늘), "unknown", "인증일자를 모른다");

/* ── 시험 갈래 ───────────────────────────────── */
section("시험 갈래");
eq(examKind({ level: "Level II", subject: "General", method: "RT" }), "일반", "Level Ⅱ 일반");
eq(examKind({ level: "Level II", subject: "Specific", method: "RT" }), "전문", "Level Ⅱ 전문");
eq(examKind({ level: "Level III", method: "Basic" }), "기초", "Level Ⅲ 기초");
eq(examKind({ level: "Level III", method: "RT" }), "종목", "Level Ⅲ 종목");

eq(unitKey({ level: "Level II", subject: "General", method: "RT" }), "Level II/RT", "자격 단위");
eq(unitKey({ level: "Level III", method: "Basic" }), "", "기초시험은 종목이 없다");

eq(requiredKinds("Level II").join(","), "일반,전문", "Level Ⅱ 필기");
eq(requiredKinds("Level III").join(","), "기초,종목,전문", "Level Ⅲ 필기");

/* ── 합격 판정 ───────────────────────────────── */
section("합격 판정 — E01 7.4.4 단순 평균 · 7.4.5 개별 70 / 종합 80");

eq(average([80, 90]), "85", "단순 평균");
eq(average([80, null]), "80", "빠진 것은 빼고 낸다");
eq(average([]), "null", "아무것도 없으면 없다");

const r = (score, when, extra = {}) => ({
  name: "홍길동", level: "Level II", method: "RT", score,
  startedAt: when, ...extra,
});

{
  const j = judgeUnit("Level II", {
    일반: r(85, "2026-03-02", { subject: "General" }),
    전문: r(80, "2026-03-02", { subject: "Specific" }),
  });
  eq(j.total, "82.5", "종합 82.5");
  eq(j.verdict, "pass", "둘 다 70 넘고 종합 80 넘음 → 합격");
}

{
  /* 개별은 다 넘겼는데 종합이 80 에 못 미치는 경우 */
  const j = judgeUnit("Level II", {
    일반: r(75, "2026-03-02", { subject: "General" }),
    전문: r(80, "2026-03-02", { subject: "Specific" }),
  });
  eq(j.total, "77.5", "종합 77.5");
  eq(j.verdict, "fail", "개별은 넘겨도 종합 80 미만이면 불합격");
  eq(j.belowEach.length, "0", "개별 미달은 없다");
}

{
  const j = judgeUnit("Level II", {
    일반: r(65, "2026-03-02", { subject: "General" }),
    전문: r(98, "2026-03-02", { subject: "Specific" }),
  });
  eq(j.verdict, "fail", "한 과목이 70 미만이면 종합이 높아도 불합격");
  eq(j.belowEach.join(","), "일반", "미달 과목을 짚는다");
}

{
  /* 딱 경계 */
  const j = judgeUnit("Level II", {
    일반: r(70, "2026-03-02", { subject: "General" }),
    전문: r(90, "2026-03-02", { subject: "Specific" }),
  });
  eq(j.total, "80", "종합 정확히 80");
  eq(j.verdict, "pass", "70 과 80 은 「이상」이므로 합격");
}

{
  const j = judgeUnit("Level II", { 일반: r(85, "2026-03-02", { subject: "General" }) });
  eq(j.verdict, "incomplete", "전문시험을 안 쳤으면 판정 못 한다");
  eq(j.missing.join(","), "전문", "빠진 시험을 짚는다");
}

{
  /* Level Ⅲ 전문시험은 종이라 CBT 에 점수가 없다 (E02 5.2.3) */
  const j = judgeUnit("Level III", {
    기초: { level: "Level III", method: "Basic", score: 90, startedAt: "2026-03-02" },
    종목: { level: "Level III", method: "RT", score: 88, startedAt: "2026-04-02" },
  });
  eq(j.verdict, "incomplete", "전문 점수가 없으면 미완");
  eq(j.paperOnly.join(","), "전문", "종이로 치는 시험임을 밝힌다");
}

/* ── 여러 번 친 경우 ─────────────────────────── */
section("재응시 — E01 7.5 「30일 경과 후」");

{
  const list = [
    r(60, "2026-03-02"),
    r(85, "2026-06-10"),
    r(95, "2026-09-01"),
  ];
  eq(scoreOfPick(list), "85", "붙은 것 가운데 가장 이른 것을 쓴다");
}

{
  const list = [r(60, "2026-03-02"), r(65, "2026-06-10")];
  eq(scoreOfPick(list), "65", "다 떨어졌으면 가장 나중 것");
}

function scoreOfPick(list) {
  const p = pickAttempt(list);
  return p ? p.score : "null";
}

{
  const issues = retakeIssues([r(60, "2026-03-02"), r(85, "2026-03-20")]);
  eq(issues.length, "1", "18일 만에 재응시 — 확인 거리");
  eq(issues[0].gapDays, "18", "간격");
  eq(issues[0].allowedFrom, "2026-04-01", "30일 뒤부터 칠 수 있었다");
}

{
  const issues = retakeIssues([r(60, "2026-03-02"), r(85, "2026-04-01")]);
  eq(issues.length, "0", "30일 지나 재응시 — 문제 없다");
}

{
  const issues = retakeIssues([r(85, "2026-03-02"), r(95, "2026-03-05")]);
  eq(issues.length, "0", "붙은 뒤 다시 친 것은 재시험이 아니다");
}

/* ── 사람 단위 ───────────────────────────────── */
section("사람 단위 이력");

const 기록 = [
  { name: "홍길동", level: "Level II", method: "RT", subject: "General", score: 85, startedAt: "2026-03-02" },
  { name: "홍길동", level: "Level II", method: "RT", subject: "Specific", score: 90, startedAt: "2026-03-02" },
  { name: "홍길동", level: "Level II", method: "UT", subject: "General", score: 60, startedAt: "2026-05-02" },
  { name: " 홍길동 ", level: "Level II", method: "UT", subject: "Specific", score: 95, startedAt: "2026-05-02" },
  { name: "김철수", level: "Level III", method: "Basic", score: 88, startedAt: "2026-01-15" },
  { name: "김철수", level: "Level III", method: "RT", score: 92, startedAt: "2026-02-20" },
];

const 명부 = [
  { name: "홍길동", dept: "검사1팀", eyeExamDate: "2026-06-01", certifiedAt: "2026-03-10" },
];

const h = buildHistory(기록, 명부, 오늘);

eq(h.length, "2", "사람 둘");
eq(h[0].name, "김철수", "이름순 정렬");

const 홍 = h.find(x => x.name === "홍길동");
eq(홍.units.length, "2", "RT 와 UT 두 자격");
eq(홍.dept, "검사1팀", "명부에서 소속을 읽는다");
eq(홍.eyeExpiry, "2027-06-30", "시력검사 만료");
eq(홍.eyeState, "valid", "시력검사 유효");

const RT = 홍.units.find(u => u.method === "RT");
eq(RT.verdict, "pass", "RT 합격");
eq(RT.total, "87.5", "RT 종합");
eq(RT.certifiedAt, "2026-03-10", "인증일자는 명부가 우선");
eq(RT.certifiedFrom, "명부", "출처를 밝힌다");
eq(RT.expiry, "2029-03-31", "3년 뒤 그 달 말일");
eq(RT.expiryState, "valid", "아직 유효");

const UT = 홍.units.find(u => u.method === "UT");
eq(UT.verdict, "fail", "일반 60 → 불합격");
eq(UT.belowEach.join(","), "일반", "미달 과목");

const 김 = h.find(x => x.name === "김철수");
const 김RT = 김.units[0];
eq(김RT.level, "Level III", "Level Ⅲ");
eq(김RT.scores["기초"], "88", "기초시험 점수가 종목에 얹힌다");
eq(김RT.verdict, "incomplete", "전문(종이) 점수가 없어 미완");
eq(김RT.certifiedFrom, "", "명부에 없고 필기도 미완이라 인증일 없음");

/* ── 만료 예정자 ─────────────────────────────── */
section("만료 예정자 명단 — E03-04");

const 곧 = buildHistory(
  [
    { name: "이영희", level: "Level II", method: "PT", subject: "General", score: 85, startedAt: "2023-09-02" },
    { name: "이영희", level: "Level II", method: "PT", subject: "Specific", score: 90, startedAt: "2023-09-02" },
  ],
  [{ name: "이영희", dept: "검사2팀", certifiedAt: "2023-09-10" }],
  오늘
);

const 명단 = expiringSoon(곧, 오늘);
eq(명단.length, "1", "만료 3개월 안이라 명단에 오른다");
eq(명단[0].expiry, "2026-09-30", "만료일");
eq(명단[0].state, "warn", "만료 임박");
eq(명단[0].daysLeft, "35", "남은 날수");

/* 합격하지 않은 자격은 만료 명단에 올리지 않는다 */
const 명단2 = expiringSoon(h, 오늘);
eq(명단2.length, "0", "불합격·미완은 만료 명단에 없다");


/* ── 등급마다 다른 종목을 갖는 사람 ─────────── */
section("인증일자 — 등급 + 종목 칸이 우선");

{
  /* 이주경 꼴 — Level Ⅲ 는 ET, Level Ⅱ 는 UT */
  const recs = [
    { name: "이주경", level: "Level III", method: "Basic", score: 90, startedAt: "2026-01-05" },
    { name: "이주경", level: "Level III", method: "ET", score: 90, startedAt: "2026-01-10" },
    { name: "이주경", level: "Level II", method: "UT", subject: "General", score: 85, startedAt: "2026-02-01" },
    { name: "이주경", level: "Level II", method: "UT", subject: "Specific", score: 90, startedAt: "2026-02-01" },
  ];
  const 명부 = [{
    name: "이주경",
    certifiedAt: "2020-01-01",
    "certifiedAt:ET": "2021-01-29",
    "certifiedAt:Level II/UT": "2018-06-09",
    "certifiedAt:Level III/ET": "2021-01-29",
  }];

  const h = buildHistory(recs, 명부, 오늘);
  const 이 = h[0];
  const ut = 이.units.find(u => u.method === "UT");
  const et = 이.units.find(u => u.method === "ET");

  eq(ut.certifiedAt, "2018-06-09", "Level Ⅱ UT 는 등급까지 맞는 칸을 쓴다");
  eq(ut.expiry, "2021-06-30", "Level Ⅱ 3년");
  eq(et.certifiedAt, "2021-01-29", "Level Ⅲ ET");
  eq(et.expiry, "2026-01-31", "Level Ⅲ 5년");
  eq(ut.certifiedFrom, "명부", "출처는 명부");
}

console.log(`\n${"-".repeat(56)}\n확인 ${pass + fail}건 · 통과 ${pass} · 실패 ${fail}\n`);
process.exit(fail ? 1 : 0);
