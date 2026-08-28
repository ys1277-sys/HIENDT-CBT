/*
 * 규칙 두 건이 상위 절차서와 어긋나지 않는지 본다.
 *
 *   node tools/e01-crosscheck.mjs
 *
 * 왜 필요한가
 * -----------
 * HIE-QP-E02(필기시험 시행 규칙)와 HIE-QP-E03(자격증 발행 및 관리 규칙)은
 * HIE-QP-E01 비파괴시험요원 자격인정 절차서를 시행하는 세부 규칙이다.
 * 상위가 정한 값을 그대로 옮겨 적은 자리가 많은데, 옮겨 적은 값은 언젠가
 * 어긋난다. E01 이 개정되면 더 그렇다.
 *
 * tools/xref-check.mjs 는 「가리키는 조항이 있느냐」만 본다. 조항이 있어도
 * 값이 다를 수 있다. 이 도구는 값을 본다.
 *
 * 어떻게 보나
 * -----------
 * 아래 표가 잣대다. 한 줄이 하나의 약속이다.
 *
 *   e01   E01 원본에 이런 말이 있어야 한다
 *   rule  E02 또는 E03 에 이런 말이 있어야 한다
 *
 * 둘 중 하나라도 없으면 알린다. E01 쪽이 없으면 상위가 바뀐 것이고,
 * 규칙 쪽이 없으면 옮겨 적기를 빠뜨린 것이다.
 *
 * 원본은 한글 파일이라 tools/hwprich.mjs 로 읽는다. 본문이 커다란 표 칸에
 * 통째로 들어 있어 줄로는 못 나눈다. 공백을 하나로 눌러 한 덩어리로 놓고
 * 찾는다.
 */
import fs from "node:fs";
import { readRich } from "./hwprich.mjs";

const E01_HWP =
  "D:/Visual Studio Code/원본자료/절차서/비파괴시험요원 자격인정 절차서(HIE-QP-E01(Rev.8).hwp";

const RULES = {
  E02: "docs/HIE-QP-E02 필기시험 시행 규칙.md",
  E03: "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md",
};

/*
 * 잣대.
 *
 * e01 · rule 은 정규식이다. 띄어쓰기가 판마다 달라 \s* 를 넉넉히 둔다.
 * 숫자와 단위는 반드시 그대로 나와야 한다 — 거기가 어긋나는 자리다.
 */
const CHECKS = [
  {
    at: "E01 7.3.2 3)",
    what: "시력검사 유효기간 1년 · 만료 월 마지막 날",
    e01: /시력검사는\s*검사일로부터\s*1년\s*후\s*만료\s*월.{0,4}의?\s*마지막\s*일/,
    doc: "E03",
    rule: /검사일로부터\s*\*{0,2}1년\s*뒤\s*만료[\s\S]{0,12}마지막\s*날/,
  },
  {
    at: "E01 7.3.2 1)",
    /*
     * 원문 어순은 「12인치(30.5cm) 이상의 거리에서 … Jaeger … No. 1」이다.
     * Jaeger 를 앞에 두고 찾다가 헛돌았다. 원문 차례대로 본다.
     */
    what: "근거리 시력 — 12 in.(30.5cm) 거리에서 Jaeger No.1",
    e01: /12\s*인치\s*\(\s*30\.5\s*cm\s*\)\s*이상의\s*거리에서[\s\S]{0,60}Jaeger[\s\S]{0,30}No\.?\s*1/i,
    doc: "E03",
    rule: /Jaeger[\s\S]{0,40}(12\s*in|30\.5\s*cm)|(12\s*in|30\.5\s*cm)[\s\S]{0,60}Jaeger/i,
  },
  {
    at: "E01 7.3.4 1)",
    what: "Level Ⅲ 기초시험 15 + 20 + 20, 2시간",
    e01: /SNT-TC-1A\s*규정을\s*이해하는데\s*관련된\s*15\s*문제[\s\S]{0,120}20\s*문제[\s\S]{0,120}20\s*문제/,
    doc: "E02",
    rule: /15[\s\S]{0,40}20[\s\S]{0,40}20[\s\S]{0,60}55/,
  },
  {
    at: "E01 7.3.4 2)",
    what: "Level Ⅲ 종목시험 30 + 15 + 20 = 65",
    e01: /기본원리에\s*관한\s*30문제[\s\S]{0,200}15\s*문제[\s\S]{0,200}20문항/,
    doc: "E02",
    rule: /65/,
  },
  {
    at: "E01 7.3.4 3)",
    what: "Level Ⅲ 전문시험 20문항",
    e01: /전문\s*시험[\s\S]{0,200}20문항/,
    doc: "E02",
    rule: /Level\s*Ⅲ[\s\S]{0,200}전문시험/,
  },
  {
    at: "E01 7.3.5",
    what: "ASNT·ISO 9712 Level Ⅲ 소지자는 기초·종목 면제 · 남은 시험 80%",
    e01: /ISO\s*9712\s*Level\s*Ⅲ\s*자격을\s*소지한\s*응시자는[\s\S]{0,40}1\)\s*및\s*2\)의\s*시험을\s*만족[\s\S]{0,200}80%이상/,
    doc: "E02",
    /* 가름표가 쉼표일 때도 가운뎃점일 때도 걸리게 둔다 */
    rule: /ASNT\s*NDE\s*Level\s*Ⅲ[\s\S]{0,200}기초시험\s*[,·]?\s*종목시험/,
  },
  {
    at: "E01 7.3.7",
    what: "ISO 9712 Level Ⅱ 소지자는 일반·실기 면제 · 전문시험 80%",
    e01: /ISO\s*9712\s*Level\s*Ⅱ\s*자격을\s*소지한\s*응시자는[\s\S]{0,40}1\)\s*및\s*3\)의\s*시험을\s*만족[\s\S]{0,200}80%\s*이상/,
    doc: "E02",
    rule: /ISO\s*9712\s*Level\s*Ⅱ[\s\S]{0,120}일반시험/,
  },
  {
    at: "E01 7.4.1",
    what: "시험 문제는 해당 종목 책임 NDE Level Ⅲ 승인",
    e01: /모든\s*자격시험\s*문제는\s*적용\s*종목에\s*대해\s*책임있는\s*NDE\s*Level\s*III에\s*의하여\s*승인/,
    doc: "E02",
    rule: /종목[\s\S]{0,20}NDE\s*Level\s*Ⅲ[\s\S]{0,40}승인/,
  },
  {
    at: "E01 7.4.2",
    what: "운영과 채점은 임명된 대표 NDE Level Ⅲ 책임",
    e01: /임명된\s*대표\s*NDE\s*Level\s*Ⅲ는[\s\S]{0,80}운영과\s*채점에\s*대해\s*책임/,
    doc: "E02",
    rule: /대표\s*NDE\s*Level\s*Ⅲ[\s\S]{0,60}(운영|채점)/,
  },
  {
    at: "E01 7.4.3",
    what: "필기시험은 비공개 · 참고자료는 줄 수 있다",
    e01: /비공개\(closed\s*book\)\s*시험이며[\s\S]{0,80}제공될\s*수\s*있다/,
    doc: "E02",
    rule: /비공개[\s\S]{0,200}(참고자료|절차서|표|그래프)/,
  },
  {
    at: "E01 7.4.4",
    what: "종합점수는 단순 평균",
    e01: /종합점수는\s*요구되는\s*시험\s*결과의\s*단순\s*평균치/,
    doc: "E02",
    rule: /단순\s*평균/,
  },
  {
    at: "E01 7.4.5",
    what: "종합 80% 이상 · 개별 70% 이상",
    e01: /종합\s*합격\s*점수는\s*80%이상[\s\S]{0,80}각\s*개별\s*시험의\s*합격\s*점수는\s*70%이상/,
    doc: "E02",
    rule: /개별[\s\S]{0,30}70\s*%[\s\S]{0,120}종합[\s\S]{0,30}80\s*%/,
  },
  {
    at: "E01 7.4.5",
    what: "실기는 시험편마다 80% 이상 · 최종은 평균",
    e01: /각\s*개별\s*실기시험은\s*각각의\s*시험편에\s*대해\s*80%\s*이상[\s\S]{0,60}평균내어\s*산정/,
    doc: "E02",
    rule: /시험편[\s\S]{0,40}80/,
  },
  {
    at: "E01 7.4.6",
    what: "외부기관 위탁 시 합격을 80%로 본다",
    e01: /외부기관에\s*위탁한\s*경우[\s\S]{0,80}합격기준을\s*80%/,
    doc: "E02",
    rule: /외부기관[\s\S]{0,120}80/,
  },
  {
    at: "E01 7.4.7",
    what: "시험지는 대표 NDE Level Ⅲ 관리 · 시건 장치 보관",
    e01: /시건\s*장치가\s*있는\s*보관함에\s*보관/,
    doc: "E02",
    rule: /(시건|잠금)[\s\S]{0,40}보관/,
  },
  {
    at: "E01 7.4.8",
    what: "본인이나 부하직원이 시험을 관리하지 않는다",
    e01: /본인이나\s*부하직원에\s*의해\s*시험이\s*관리되는\s*경우는\s*없어야/,
    doc: "E02",
    rule: /(본인이나\s*부하|부하직원)/,
  },
  {
    at: "E01 7.5",
    what: "재시험은 30일 경과 후 · 추가 훈련 증거가 있으면 앞당길 수 있다",
    e01: /최소한\s*30일이\s*경과한\s*후[\s\S]{0,140}30일\s*이전에도\s*재시험/,
    doc: "E02",
    rule: /30일이\s*경과한[\s\S]{0,200}30일\s*이전에도/,
  },
  {
    at: "E01 7.9.1",
    what: "재자격 시험은 시력검사를 뺀 7.3항의 시험으로 한다",
    e01: /재자격\s*시험은\s*7\.3\.2\(시력검사\)를\s*제외한/,
    doc: "E03",
    rule: /시력검사[\s\S]{0,20}제외/,
  },
  {
    at: "E01 7.9.2",
    what: "재자격 주기 Level Ⅰ·Ⅱ 3년 · Level Ⅲ 5년, 만료 월 마지막 날",
    e01: /재자격\s*인정주기는\s*Level\s*I과\s*II는\s*3년[\s\S]{0,40}Level\s*III는\s*5년[\s\S]{0,80}마지막\s*날/,
    doc: "E03",
    rule: /3년[\s\S]{0,200}5년[\s\S]{0,200}마지막\s*날|마지막\s*날[\s\S]{0,300}3년[\s\S]{0,120}5년/,
  },
];

/*
 * 표 3 — 필기시험의 최소 문제 수.
 *
 * 이 시스템에서 가장 무거운 숫자다. 여기가 틀리면 규정보다 적게, 또는
 * 많게 시험이 나간다. 실제로 예전에 TOFD·PAUT 전문시험이 5문항 적게
 * 나간 적이 있다.
 *
 * E01 원본의 표 3 을 그대로 적어 두고, 원문과 src/ExamData.jsx 양쪽에
 * 맞는지 본다. 셋 가운데 하나라도 어긋나면 걸린다.
 */
const TABLE3 = {
  RT:   [40, 20],  CR:  [40, 30],  DR:   [40, 30],
  MT:   [40, 20],  UT:  [40, 20],
  TOFD: [40, 30],  PAUT:[40, 30],  FMC:  [40, 30],
  PT:   [40, 20],  VT:  [40, 20],
  ECT:  [40, 20],  RFT: [40, 20],
};

/*
 * 원문 표 3 의 줄. 종목 이름이 영문이고, 칸은 공백으로만 이어진다.
 *
 * 「Level Ⅰ 일반 · Level Ⅰ 전문 · Level Ⅱ 일반 · Level Ⅱ 전문」 네 값이
 * 이 차례로 온다. 표 1A(교육훈련·경력)에도 같은 종목 이름이 나오므로,
 * 표 3 이 시작하는 자리부터 잘라서 그 안에서만 찾는다.
 */
const TABLE3_HEAD = "Minimum Number of Test Questions";

const TABLE3_ROW = {
  RT:   /(?:^|\s)Radiography\s+40\s+20\s+40\s+20/,
  CR:   /Computed Radiography\(CR\)\s+40\s+30\s+40\s+30/,
  DR:   /Digital Radiography\(DR\)\s+40\s+30\s+40\s+30/,
  MT:   /Magnetic Particle Testing\s+40\s+20\s+40\s+20/,
  UT:   /Ultrasonic Testing\s+40\s+20\s+40\s+20/,
  TOFD: /Time of Flight Diffraction\(TOFD\)\s+-\s+-\s+40\s+30/,
  PAUT: /Phased Array\(PAUT\)\s+-\s+-\s+40\s+30/,
  FMC:  /Full Matrix Capture\(FMC\)\s+-\s+-\s+40\s+30/,
  PT:   /Liquid Penetrant Testing\s+40\s+20\s+40\s+20/,
  VT:   /Visual Testing\s+40\s+20\s+40\s+20/,
  ECT:  /Eddy Current Testing\s+40\s+20\s+40\s+20/,
  RFT:  /Remote Field Testing\s+40\s+20\s+40\s+20/,
};

/* src/ExamData.jsx 에서 출제 수를 읽는다 */
function examData() {
  const src = fs
    .readFileSync("src/ExamData.jsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const block = (name) => {
    const i = src.indexOf(name + ":");
    if (i < 0) return "";
    const a = src.indexOf("{", i);
    let d = 0, j = a;
    for (; j < src.length; j++) {
      if (src[j] === "{") d++;
      else if (src[j] === "}") { d--; if (!d) break; }
    }
    return src.slice(a + 1, j);
  };

  const read = (blk) => {
    const o = {};
    for (const m of blk.matchAll(/([A-Z]+)\s*:\s*(\d+)/g)) o[m[1]] = +m[2];
    return o;
  };

  return { G: read(block("General")), S: read(block("Specific")) };
}

/* ───────────────────────────────────────── */

function flat(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "table") {
      for (const row of b.grid)
        for (const cell of row) if (cell && cell !== "covered") flat(cell.blocks, out);
      continue;
    }
    if (b.t === "img") continue;
    const s = String(b.s || "").trim();
    if (s) out.push(s);
  }
  return out;
}

const doc = await readRich(E01_HWP);
const e01 = flat(doc.blocks).join(" ").replace(/\s+/g, " ");

const md = {};
for (const [k, f] of Object.entries(RULES)) md[k] = fs.readFileSync(f, "utf8").replace(/\s+/g, " ");

let ok = 0;
const bad = [];

for (const c of CHECKS) {
  const inE01 = c.e01.test(e01);
  const inRule = c.rule.test(md[c.doc]);

  if (inE01 && inRule) {
    ok++;
    continue;
  }
  bad.push({
    ...c,
    why: !inE01
      ? "E01 원본에서 못 찾았다 — 상위가 개정됐거나 잣대가 낡았다"
      : `${c.doc} 에서 못 찾았다 — 옮겨 적기를 빠뜨렸다`,
  });
}

console.log("HIE-QP-E01 Rev.8 과 대조");
console.log("=".repeat(74));
console.log("");

for (const c of CHECKS) {
  const hit = !bad.find((b) => b.at === c.at && b.what === c.what);
  console.log(`  ${hit ? "○" : "✗"}  ${c.at.padEnd(14)} ${c.what}`);
}

/* ── 표 3 — 원문 · 코드 양쪽과 맞는지 ─────── */

console.log("");
console.log("  표 3 — 필기시험의 최소 문제 수");

const { G, S } = examData();
const t3 = [];

/* 표 1A 에도 같은 종목 이름이 있다. 표 3 자리부터 잘라 그 안에서만 본다 */
const at3 = e01.indexOf(TABLE3_HEAD);
const table3 = at3 < 0 ? "" : e01.slice(at3, at3 + 1200);

if (at3 < 0) {
  t3.push({ at: "E01 표 3", what: "표 3 을 원문에서 못 찾았다", why: "제목이 바뀌었거나 원본이 다르다" });
}

for (const [k, [gen, spe]] of Object.entries(TABLE3)) {
  const inE01 = TABLE3_ROW[k].test(table3);
  const run = G[k] !== undefined || S[k] !== undefined;
  const inCode = !run || (G[k] === gen && S[k] === spe);

  const mark = !inE01 ? "✗" : !inCode ? "✗" : "○";
  const what = !run
    ? "시행 안 함"
    : `${G[k]} / ${S[k]}`;

  console.log(
    `  ${mark}  ${k.padEnd(6)} 원문 ${String(gen).padStart(2)} / ${String(spe).padStart(2)}` +
    `   코드 ${what}`
  );

  if (!inE01) t3.push({ at: `E01 표 3`, what: `${k} 줄을 원문에서 못 찾았다`, why: "표 3 이 개정됐거나 잣대가 낡았다" });
  else if (!inCode) t3.push({ at: `E01 표 3`, what: `${k} — 원문 ${gen}/${spe} 인데 코드는 ${G[k]}/${S[k]}`, why: "src/ExamData.jsx 를 표 3 에 맞춰야 한다" });
}

bad.push(...t3);

console.log("");
console.log("=".repeat(74));

if (!bad.length) {
  console.log(`잣대 ${CHECKS.length}가지 + 표 3 ${Object.keys(TABLE3).length}종목 — 어긋난 곳이 없다`);
} else {
  console.log(`잣대 ${CHECKS.length}가지 중 ${bad.length}가지가 어긋난다`);
  console.log("");
  for (const b of bad) console.log(`  ✗ ${b.at}  ${b.what}\n      ${b.why}`);
  process.exitCode = 1;
}
