/*
 * Level Ⅲ 문항을 규정이 정한 갈래로 나눈다.
 *
 *   node tools/level3-part.mjs          나눈 결과만 본다
 *   node tools/level3-part.mjs --써라    문항 파일에 part 를 적어 넣는다
 *
 * 왜 필요한가.
 *   E01 7.3.4 는 문항 수만 정하는 것이 아니라 구성까지 정한다.
 *
 *     기초시험 55 = a) SNT-TC-1A 이해 15
 *                   b) 적용 재질·제작·생산 기술 20
 *                   c) 다른 종목의 Level Ⅱ 문제와 유사한 것 20
 *
 *     종목시험 65 = a) 기본 원리 30
 *                   b) 기법 및 절차의 응용과 설정 15
 *                   c) 코드·규격·사양서의 해석 20
 *
 *   지금은 갈래 표시가 없어 은행에서 그냥 55개(또는 65개)를 뽑는다.
 *   운이 나쁘면 SNT-TC-1A 문제가 하나도 없는 시험지가 나올 수 있다.
 *   문항 수는 맞아도 규정이 요구한 시험이 아니다.
 *
 * 이 도구가 붙이는 것은 초안이다. E02 6.1.2·6.3.1 에 따라 해당 종목
 * NDE Level Ⅲ 의 승인을 받아야 확정된다.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "public/data/Level III";

/* 규정이 요구하는 갈래별 문항 수 */
const NEED = {
  Basic: { a: 15, b: 20, c: 20 },
  Method: { a: 30, b: 15, c: 20 },
};

const NAME = {
  Basic: {
    a: "SNT-TC-1A 규정의 이해",
    b: "적용 재질·제작 및 생산 기술",
    c: "다른 종목의 Level Ⅱ 문제와 유사한 것",
  },
  Method: {
    a: "기본 원리",
    b: "기법 및 절차의 응용과 설정",
    c: "코드·규격·사양서의 해석",
  },
};

/* ── 기초시험 — topic 으로 가른다 ───────────── */
const BASIC_BY_TOPIC = {
  "SNT-TC-1A": "a",

  "Materials": "b",
  "Welding": "b",
  "Heat Treatment": "b",
  "Discontinuity": "b",
  "Measurement": "b",

  "Radiographic Testing": "c",
  "Magnetic Particle Testing": "c",
  "Ultrasonic Testing": "c",
  "Liquid Penetrant Testing": "c",
  "Eddy Current Testing": "c",
  "Leak Testing": "c",
  "Visual Testing": "c",
  "Visual Examination": "c",
  "Inspection": "c",
};

/*
 * topic 이 안 붙은 30문항. 글을 읽고 손으로 가른 것이다.
 *   56~63  SNT-TC-1A 를 직접 묻는다        → a
 *   64~77  용접·재질·열처리·주조 결함      → b
 *   78~85  종목을 고르거나 견주는 문제      → c
 */
const BASIC_BY_ID = {};
for (let i = 56; i <= 63; i++) BASIC_BY_ID[i] = "a";
for (let i = 64; i <= 77; i++) BASIC_BY_ID[i] = "b";
for (let i = 78; i <= 85; i++) BASIC_BY_ID[i] = "c";

function partOfBasic(q) {
  if (BASIC_BY_ID[q.id]) return BASIC_BY_ID[q.id];
  return BASIC_BY_TOPIC[q.topic] || null;
}

/* ── 종목시험 — 글에서 실마리를 찾는다 ──────── */
/*
 * 낱말 경계를 꼭 준다. 처음에는 그냥 /Article/ 로 두었더니 「particle」
 * 안의 article 이 걸려 MT 1번(습식법의 입자)이 「코드 해석」으로 갔다.
 */
const CODE = /\b(codes?|standards?|specifications?|ASME|ASTM|AWS|articles?|paragraphs?)\b|\bSection\s+[IVX]+\b|acceptance criteria|규격|코드|사양서|시방|합격기준|판정/i;
const APPLY = /\b(techniques?|procedures?|calibrat\w*|set[- ]?ups?|scan\w*|adjust\w*|select\w*)\b|기법|절차|교정|설정|주사|보정|선정|설치|운용/i;

function partOfMethod(q) {
  const s = [q.question, ...(q.options || [])].join(" ");
  if (CODE.test(s)) return "c";
  if (APPLY.test(s)) return "b";
  return "a";   /* 나머지는 기본 원리 */
}

/* ── 훑기 ──────────────────────────────────── */
const write = process.argv.includes("--써라");
let hold = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const p = path.join(DIR, file);
  const list = JSON.parse(fs.readFileSync(p, "utf8"));
  const kind = file === "Basic.json" ? "Basic" : "Method";
  const need = NEED[kind];

  const cnt = { a: 0, b: 0, c: 0, "?": 0 };
  for (const q of list) {
    const part = kind === "Basic" ? partOfBasic(q) : partOfMethod(q);
    cnt[part || "?"]++;
    if (write && part) q.part = part;
  }

  console.log("\n══ " + file.replace(".json", "") + "  " + list.length + "문항 ══");
  for (const k of ["a", "b", "c"]) {
    const ok = cnt[k] >= need[k];
    if (!ok) hold++;
    console.log(
      "  " + k + ")  " + String(cnt[k]).padStart(3) + "개 / " + String(need[k]).padStart(2) + "개 필요  " +
      (ok ? "○" : "★ " + (need[k] - cnt[k]) + "개 모자람") + "   " + NAME[kind][k]
    );
  }
  if (cnt["?"]) console.log("  ?)  " + cnt["?"] + "개 — 못 가름");

  if (write) fs.writeFileSync(p, JSON.stringify(list, null, 2) + "\n", "utf8");
}

console.log("\n" + "─".repeat(66));
console.log(hold ? "★ 모자란 갈래 " + hold + "곳 — 문항을 채워야 규정대로 낼 수 있다"
                 : "모든 갈래가 규정 수를 넘는다");
if (write) console.log("\n문항 파일에 part 를 적어 넣었다. E02 6.1.2·6.3.1 에 따라 Level Ⅲ 승인이 필요하다.");
else console.log("\n적어 넣으려면 --써라 를 붙인다.");
