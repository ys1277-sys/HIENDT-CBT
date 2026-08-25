/*
 * 원본 절차서(.hwp)와 앱에 실린 절차서(.json)의 글을 맞대 본다.
 *
 * build-procedures.mjs 는 빈 줄과 빈 표 줄을 걷어내고 표를 펴기도 한다.
 * 그 과정에서 글이 통째로 사라지면 응시자가 못 보는 대목이 생긴다.
 * 무엇이 빠졌는지 글자로 보여 준다.
 */
import fs from "node:fs";
import path from "node:path";
import { readRich } from "./hwprich.mjs";

const SRC = "D:/Visual Studio Code/절차서";
const OUT = "public/data/procedures";

/* 원본 파일 이름 → 문서번호 */
const index = JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8"));

/*
 * 한 문서에 이름이 둘 붙기도 한다. TOFD 절차서는 표지에 문서번호가
 * 「HIE-NDT-P11」로만 적혀 있어 그 이름으로도 등록해 두었다.
 * 이름을 문서로 덮어쓰면 본 이름을 잃으니 이름 쪽을 열쇠로 둔다.
 */
const docOf = new Map();
for (const [code, v] of Object.entries(index.procedures || {}))
  docOf.set(code, v.doc);
const CODES = [...docOf.keys()];

/*
 * 한글이 가로줄로 쓰는 제 글꼴 글자는 build-procedures 가 ─ 와 ━ 로
 * 바꾼다. 그대로 견주면 바뀐 줄이 전부 「빠진 글」로 잡힌다.
 * 견줄 때는 양쪽 다 한 글자로 맞춰 둔다.
 */
const RULE = /[─━\u{F080F}\u{F081A}\u{F0827}]/gu;

const norm = (s) => String(s).replace(RULE, "─").replace(/\s+/g, " ").trim();

/* 원본에서 글만 뽑는다 */
function fromHwp(file) {
  const doc = readRich(file);
  const out = [];
  (function w(bs) {
    for (const b of bs) {
      if (b.t === "p") { const t = norm(b.s); if (t) out.push(t); }
      else if (b.t === "table")
        for (const r of b.grid) for (const c of r) if (c && c !== "covered") w(c.blocks);
    }
  })(doc.blocks);
  return out;
}

/* 만들어진 것에서 글만 뽑는다 */
function fromJson(file) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const out = [];
  (function w(b) {
    if (Array.isArray(b)) { b.forEach(w); return; }
    if (!b || typeof b !== "object") return;
    if ((b.t === "p" || b.t === "h") && b.s) { const t = norm(b.s); if (t) out.push(t); }
    if (b.blocks) w(b.blocks);
    if (b.grid) w(b.grid);
  })(j);
  return out;
}

const files = fs.readdirSync(SRC).filter((f) => /\.hwp$/i.test(f));
let bad = 0;

for (const f of files) {
  const a = fromHwp(path.join(SRC, f));

  /* 문서번호를 첫 줄들에서 찾는다 */
  let code = CODES.find((c) =>
    a.slice(0, 40).some((s) => s.replace(/\s/g, "").includes(c.replace(/\s/g, ""))));

  /*
   * TOFD 절차서 표지에는 문서번호가 「HIE-NDT-P11」로만 적혀 있고
   * 실제 등록 이름은 HIE-NDT-TOFD-U09 다. 표지로 못 찾으면 파일 이름의
   * 종목으로 찾는다.
   */
  if (!code) {
    const m = f.toUpperCase().match(/(TOFD|PAUT|ECT|RFT|MT|PT|RT|UT|VT)/);
    if (m) code = CODES.find((c) => c.toUpperCase().includes("-" + m[1] + "-"));
  }
  if (!code) { console.log(f + "  → 문서번호를 못 찾음"); continue; }

  const p = path.join(OUT, docOf.get(code) || code + ".json");
  if (!fs.existsSync(p)) { console.log(f + "  → " + code + ".json 없음"); continue; }
  const b = fromJson(p);

  /* 만들어진 쪽에 없는 글 */
  const has = new Set(b);
  const gone = a.filter((s) => s.length > 3 && !has.has(s));
  /* 여러 줄이 한 줄로 엮인 것은 이어 붙인 글 안에 들어 있다 */
  const joined = b.join(" ");
  const really = gone.filter((s) => !joined.includes(s));

  console.log("=".repeat(74));
  console.log(f + "  →  " + code);
  console.log("  원본 " + a.length + "줄 / 앱 " + b.length + "줄");

  if (!really.length) { console.log("  빠진 글 없음"); continue; }

  console.log("  ▶ 앱에서 못 찾은 글 " + really.length + "줄");
  really.slice(0, 12).forEach((s) => console.log("      " + s.slice(0, 88)));
  if (really.length > 12) console.log("      … 외 " + (really.length - 12));
  bad += really.length;
}

console.log("\n" + (bad ? "살펴볼 곳 " + bad + "줄" : "빠진 글 없음"));
