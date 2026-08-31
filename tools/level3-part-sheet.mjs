/*
 * Level Ⅲ 문항 갈래 나누기 — 검토용 엑셀을 뽑는다.
 *
 *   node tools/level3-part-sheet.mjs
 *   → docs/Level3-갈래검토.xlsx
 *
 * 화면으로만 보면 567문항을 확인할 수가 없다. 시트에 한 줄씩 펴고
 * 「고칠 갈래」 칸을 비워 두어, 해당 종목 NDE Level Ⅲ 가 거기에 적어
 * 돌려주면 그대로 반영할 수 있게 한다. (E02 6.1.2 · 6.3.1)
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const DIR = "public/data/Level III";
const OUT = "docs/Level3-갈래검토.xlsx";

const NEED = {
  Basic: { a: 15, b: 20, c: 20 },
  Method: { a: 30, b: 15, c: 20 },
};
const NAME = {
  Basic: {
    a: "a) SNT-TC-1A 규정의 이해",
    b: "b) 적용 재질·제작 및 생산 기술",
    c: "c) 다른 종목의 Level Ⅱ 문제와 유사",
  },
  Method: {
    a: "a) 기본 원리",
    b: "b) 기법 및 절차의 응용과 설정",
    c: "c) 코드·규격·사양서의 해석",
  },
};

const BASIC_BY_TOPIC = {
  "SNT-TC-1A": "a",
  "Materials": "b", "Welding": "b", "Heat Treatment": "b",
  "Discontinuity": "b", "Measurement": "b",
  "Radiographic Testing": "c", "Magnetic Particle Testing": "c",
  "Ultrasonic Testing": "c", "Liquid Penetrant Testing": "c",
  "Eddy Current Testing": "c", "Leak Testing": "c",
  "Visual Testing": "c", "Visual Examination": "c", "Inspection": "c",
};
const BASIC_BY_ID = {};
for (let i = 56; i <= 63; i++) BASIC_BY_ID[i] = "a";
for (let i = 64; i <= 77; i++) BASIC_BY_ID[i] = "b";
for (let i = 78; i <= 85; i++) BASIC_BY_ID[i] = "c";

/* 낱말 경계를 꼭 준다 — 「particle」 안의 article 이 걸린 적이 있다 */
const CODE = /\b(codes?|standards?|specifications?|ASME|ASTM|AWS|articles?|paragraphs?)\b|\bSection\s+[IVX]+\b|acceptance criteria|규격|코드|사양서|시방|합격기준|판정/i;
const APPLY = /\b(techniques?|procedures?|calibrat\w*|set[- ]?ups?|scan\w*|adjust\w*|select\w*)\b|기법|절차|교정|설정|주사|보정|선정|설치|운용/i;

/* 왜 그 갈래로 갔는지 — 검토하는 사람이 판단하려면 근거가 보여야 한다 */
function why(q, kind) {
  if (kind === "Basic") {
    if (BASIC_BY_ID[q.id]) return "글을 읽고 손으로";
    return q.topic ? "topic = " + q.topic : "";
  }
  const s = [q.question, ...(q.options || [])].join(" ");
  const m = s.match(CODE) || s.match(APPLY);
  return m ? "낱말 「" + m[0] + "」" : "나머지 → 기본 원리";
}

function partOf(q, kind) {
  if (kind === "Basic") return BASIC_BY_ID[q.id] || BASIC_BY_TOPIC[q.topic] || "";
  const s = [q.question, ...(q.options || [])].join(" ");
  if (CODE.test(s)) return "c";
  if (APPLY.test(s)) return "b";
  return "a";
}

/* 영문·한글이 한 칸에 붙어 있어 앞부분만 보여 준다 */
const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

const wb = XLSX.utils.book_new();
const summary = [["은행", "문항", "갈래", "초안", "규정", "모자람", "무엇을 묻는 갈래인가"]];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const list = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  const bank = file.replace(".json", "");
  const kind = bank === "Basic" ? "Basic" : "Method";

  const rows = [["ID", "초안 갈래", "갈래 이름", "그렇게 본 까닭", "문항", "고칠 갈래", "비고"]];
  const cnt = { a: 0, b: 0, c: 0 };

  for (const q of list) {
    const p = partOf(q, kind);
    if (p) cnt[p]++;
    rows.push([
      q.id,
      p || "?",
      p ? NAME[kind][p] : "",
      why(q, kind),
      cut(q.question, 120),
      "",     /* Level Ⅲ 가 채우는 칸 */
      "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 9 }, { wch: 30 }, { wch: 22 }, { wch: 76 }, { wch: 10 }, { wch: 22 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, bank);

  for (const k of ["a", "b", "c"]) {
    summary.push([
      bank, list.length, k, cnt[k], NEED[kind][k],
      cnt[k] >= NEED[kind][k] ? "" : NEED[kind][k] - cnt[k],
      NAME[kind][k],
    ]);
  }
}

const sws = XLSX.utils.aoa_to_sheet([
  ["Level Ⅲ 문항 갈래 검토표"],
  ["HIE-QP-E01 7.3.4 는 문항 수만이 아니라 구성까지 정한다. 아래 갈래대로 나눠 출제해야 한다."],
  ["「초안」은 자동으로 가른 것이다. 각 시트의 「고칠 갈래」 칸에 a·b·c 를 적어 돌려주면 그대로 반영한다."],
  ["문항 등록·수정은 해당 종목 NDE Level Ⅲ 승인 사항이다. (HIE-QP-E02 6.1.2 · 6.3.1)"],
  [],
  ...summary,
]);
sws["!cols"] = [{ wch: 10 }, { wch: 7 }, { wch: 6 }, { wch: 7 }, { wch: 7 }, { wch: 8 }, { wch: 34 }];
XLSX.utils.book_append_sheet(wb, sws, "요약");

/* 요약을 맨 앞으로 */
wb.SheetNames = ["요약", ...wb.SheetNames.filter((n) => n !== "요약")];

fs.mkdirSync("docs", { recursive: true });
XLSX.writeFile(wb, OUT);
console.log("만듦  " + OUT + "  " + (fs.statSync(OUT).size / 1024).toFixed(0) + "KB");
console.log("  시트 : " + wb.SheetNames.join(" · "));
