/*
 * 직원현황 엑셀 → 「요원」 시트 붙여넣기용 CSV
 *
 *   node tools/make-people.mjs "D:/…/01_직원현황(24.01.17).xlsx"
 *
 * 원본은 자격증 하나가 한 줄이라 사람마다 여러 줄이고, 성명·소속 같은
 * 칸은 병합되어 첫 줄에만 있다. 사람 단위로 접고 사내 Level 을 모은다.
 *
 * 주민등록번호는 옮기지 않는다. 시험 이력에 쓸 일이 없고, 구글 시트로
 * 올리면 접근 권한이 시트에 딸린다. 원본 엑셀에만 둔다.
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const SRC = process.argv[2] || "D:/Visual Studio Code/원본자료/01_직원현황(24.01.17).xlsx";
const SHEET = "열람(사내레벨포함)";     /* 사내 Level 이 들어 있는 시트 */
const OUT = path.join(process.cwd(), "docs", "요원-붙여넣기.csv");

/* 원본 칸 자리 (0-based) */
const C = {
  siteNo: 0, dept: 1, role: 2, name: 3,
  edu: 9, school: 10, major: 11,
  career: 17,            /* 근무경력 (년) */
  careerM: 18,           /* 근무경력 (월) */
  hired: 22,
  certName: 23, method: 24, certNo: 25, gotAt: 26,
};

/* 병합되어 첫 줄에만 있는 칸 — 앞줄 값을 이어받는다 */
const CARRY = [C.siteNo, C.dept, C.role, C.name, C.edu, C.school, C.major,
               C.career, C.careerM, C.hired];

/*
 * "1/11/19" · "10/13/15" · "4/17/95"  →  YYYY-MM-DD
 *
 * 엑셀이 M/D/YY 로 뱉는다. 두 자리 연도는 40 을 기준으로 갈랐다 —
 * 입사일자에 1980~90년대가 있고 자격 취득은 2000년대 이후다.
 */
function ymd(v) {
  const s = String(v == null ? "" : v).trim();
  if (!s) return "";

  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += y <= 40 ? 2000 : 1900;
    const p = n => String(n).padStart(2, "0");
    return `${y}-${p(m[1])}-${p(m[2])}`;
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) {
    const p = n => String(n).padStart(2, "0");
    return `${iso[1]}-${p(iso[2])}-${p(iso[3])}`;
  }
  return "";
}

/*
 * "RT.UT.MT.PT,ECT,RFT,PAUT,TOFD" 처럼 마침표와 쉼표, 줄바꿈이 섞여 있다.
 * 종목 이름만 골라낸다.
 */
const KNOWN = ["RT", "UT", "MT", "PT", "VT", "ECT", "RFT", "TOFD", "PAUT", "ET", "LT"];

function methods(v) {
  const raw = String(v == null ? "" : v).toUpperCase();
  const found = [];

  for (const tok of raw.split(/[^A-Z0-9]+/)) {
    if (!tok) continue;
    /* ET 는 회사 문서가 ECT 로도 쓴다. 시험 종목 이름에 맞춘다 */
    const m = tok === "ET" ? "ECT" : tok;
    if (KNOWN.includes(m) && !found.includes(m)) found.push(m);
  }
  return found;
}

function levelOf(certName) {
  const s = String(certName || "");
  if (/사내\s*Level\s*III/i.test(s)) return "Level III";
  if (/사내\s*Level\s*II/i.test(s)) return "Level II";
  return "";
}

/* ─────────────────────────────────────────── */

const wb = XLSX.readFile(SRC);
if (!wb.Sheets[SHEET]) {
  console.error(`「${SHEET}」 시트가 없습니다. 있는 시트: ${wb.SheetNames.join(", ")}`);
  process.exit(1);
}

const raw = XLSX.utils
  .sheet_to_json(wb.Sheets[SHEET], { header: 1, defval: "", raw: false })
  .slice(2);                                     /* 1행 메모, 2행 머리글 */

const carried = [];
const last = {};

for (const row of raw) {
  const r = [...row];
  for (const c of CARRY) {
    if (String(r[c] || "").trim() === "") r[c] = last[c] || "";
    else last[c] = r[c];
  }
  carried.push(r);
}

const people = new Map();

for (const r of carried) {
  const name = String(r[C.name] || "").trim();
  if (!name) continue;

  if (!people.has(name)) {
    const yrs = String(r[C.career] || "").trim();
    const mos = String(r[C.careerM] || "").trim();

    people.set(name, {
      name,
      dept: String(r[C.dept] || "").trim(),
      role: String(r[C.role] || "").trim(),
      hiredAt: ymd(r[C.hired]),
      education: [r[C.edu], r[C.school], r[C.major]]
        .map(x => String(x || "").trim()).filter(Boolean).join(" "),
      experience: [yrs, mos].filter(Boolean).join(" "),
      levels: [],
    });
  }

  const level = levelOf(r[C.certName]);
  if (!level) continue;

  people.get(name).levels.push({
    level,
    methods: methods(r[C.method]),
    certNo: String(r[C.certNo] || "").trim(),
    gotAt: ymd(r[C.gotAt]),
  });
}

/*
 * 「요원」 시트 칸.
 *
 * 종목마다 인증일이 다르고 등급도 갈리므로 certifiedAt:등급/종목 으로
 * 적는다. src/history.js 가 이 차례로 찾는다.
 *   certifiedAt:Level III/ET  →  certifiedAt:ET  →  certifiedAt
 */
const BASE = ["name", "dept", "role", "empNo", "eyeExamDate", "certifiedAt",
              "hiredAt", "terminatedAt", "education", "experience", "training",
              "approvedBy", "employerSign"];

const rows = [];
const extra = [];

for (const p of [...people.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"))) {
  /*
   * 사내 Level 이 없는 사람도 넣는다.
   *
   * 처음에는 Level 보유자 92명만 뽑았는데, 명부는 직원 전원이 있어야
   * 한다 — 앞으로 시험을 칠 사람이 여기 없으면 응시 기록이 이름만 뜨고
   * 소속도 학력도 붙지 않는다. Level 이 없으면 인증일자 칸이 빌 뿐이다.
   */

  const row = {
    name: p.name,
    dept: p.dept,
    role: p.role,
    empNo: "",
    eyeExamDate: "",                          /* 원본에 없다 — 사람이 채운다 */
    certifiedAt: "",
    hiredAt: p.hiredAt,
    terminatedAt: "",
    education: p.education,
    experience: p.experience,
    training: "",
    approvedBy: "",
    employerSign: "",
  };

  const notes = [];

  for (const lv of p.levels) {
    if (lv.certNo) notes.push(`${lv.level} ${lv.certNo}`);

    for (const m of lv.methods) {
      const key = `certifiedAt:${lv.level}/${m}`;
      if (!extra.includes(key)) extra.push(key);

      /* 같은 등급·종목이 두 번 나오면 이른 날짜를 남긴다 */
      if (!row[key] || (lv.gotAt && lv.gotAt < row[key])) row[key] = lv.gotAt;
    }
  }

  row.training = notes.join(" / ");            /* 자격증 번호를 적어 둔다 */
  rows.push(row);
}

extra.sort();
const head = BASE.concat(extra);

/*
 * 한 칸을 CSV 한 조각으로.
 *
 * 원본의 학력·종목 칸에는 줄바꿈이 들어 있다 ("RT.UT.MT.PT⏎ECT,RFT").
 * 따옴표로 감싸면 CSV 로는 옳지만, 구글 시트에 그대로 붙여넣을 때 그
 * 줄바꿈이 새 줄로 읽혀 사람 하나가 두 줄로 갈라진다. 칸 안의 공백은
 * 하나로 편다.
 */
function cell(v) {
  const s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const csv = [head.join(",")]
  .concat(rows.map(r => head.map(h => cell(r[h])).join(",")))
  .join("\r\n");

fs.writeFileSync(OUT, "\uFEFF" + csv, "utf8");   /* 엑셀이 한글을 읽도록 BOM */

/* ─── 사람이 볼 요약 ─── */
const byLevel = {};
for (const p of people.values())
  for (const lv of p.levels) byLevel[lv.level] = (byLevel[lv.level] || 0) + 1;

console.log(`원본        ${SRC}`);
console.log(`  시트      ${SHEET}`);
console.log(`  사람      ${people.size}명`);
const hasLevel = rows.filter(r =>
  Object.keys(r).some(k => k.startsWith("certifiedAt:") && r[k])
).length;

console.log(`  명부에 넣음 ${rows.length}명`);
console.log(`    사내 Level 있음 ${hasLevel}명  (${
  Object.entries(byLevel).map(([k, v]) => `${k} ${v}건`).join(", ")})`);
console.log(`    사내 Level 없음 ${rows.length - hasLevel}명  — 인증일자 칸만 빈다`);
console.log();
console.log(`칸 ${head.length}개  — 기본 ${BASE.length} + 등급·종목별 인증일 ${extra.length}`);
console.log(`  ${extra.join(", ")}`);
console.log();
console.log(`빈 칸으로 둔 것 (원본에 없음)`);
console.log(`  eyeExamDate  시력검사일 — 만료 계산에 필요합니다`);
console.log(`  empNo        사번`);
console.log(`  approvedBy · employerSign  서명 확인`);
console.log();
console.log(`주민등록번호는 옮기지 않았습니다.`);
console.log();
console.log(`만듦  ${OUT}`);
