/*
 * 규칙 문서 두 편의 앞뒤가 맞는지 본다.
 *
 *   node tools/rule-check.mjs
 *
 * 보는 것
 *   조항 참조   본문이 부르는 항 번호가 그 문서에 실제로 있는지
 *   서식 참조   EXHIBIT / HIE-QP-Exx-nn 이 8.0 목록과 맞는지
 *   조항 번호   빠지거나 거꾸로 간 자리
 *   낱말        같은 뜻을 두 낱말로 쓴 곳
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "docs";
/* 규칙 원본은 마크다운이다. docx 는 그것을 옮긴 것이라 안 본다 */
const FILES = fs.readdirSync(DIR).filter((f) => /^HIE-QP-E0[23].*.md$/.test(f));

/* 문서마다 실제로 있는 항 번호를 모은다 */
function sections(text) {
  const out = new Set();
  for (const line of text.split("\n")) {
    /* 「### 7.10 기록」 「#### 7.10.3 …」 「7.10.3 …」 */
    const m = line.match(/^#{2,5}\s*(\d+(?:\.\d+)*)\s/) || line.match(/^\*?\*?(\d+\.\d+(?:\.\d+)*)\s/);
    if (m) out.add(m[1]);
  }
  return out;
}

/* 서식 목록 (8.0 EXHIBITS 아래) */
function exhibits(text) {
  const out = new Map();
  for (const m of text.matchAll(/HIE-QP-(E0[123])-(\d{2})\s*[：:·|｜]?\s*([^\n|*]{0,40})/g)) {
    const code = `HIE-QP-${m[1]}-${m[2]}`;
    if (!out.has(code)) out.set(code, m[3].trim());
  }
  return out;
}

const docs = new Map();
for (const f of FILES) {
  const text = fs.readFileSync(path.join(DIR, f), "utf8");
  docs.set(f, { text, sec: sections(text), exh: exhibits(text) });
}

/* E01 은 절차서 json 에서 항 번호를 얻는다 */
let e01 = new Set();
try {
  const d = JSON.parse(fs.readFileSync("public/data/procedures/HIE-QP-E01.json", "utf8"));
  const walk = (bs) => {
    for (const b of bs) {
      if (b.t === "table") { for (const r of b.grid) for (const c of r) if (c && c !== "covered") walk(c.blocks); continue; }
      const m = String(b.s || "").match(/^(\d+(?:\.\d+)+)\s/);
      if (m) e01.add(m[1]);
    }
  };
  walk(d.blocks);
} catch { /* 없으면 E01 참조는 안 본다 */ }

console.log(`E01 에서 읽은 항 ${e01.size}개\n`);

for (const [name, d] of docs) {
  console.log("=".repeat(66));
  console.log(name);
  console.log("=".repeat(66));

  const self = name.includes("E02") ? "E02" : "E03";
  const other = self === "E02" ? "E03" : "E02";
  const otherDoc = [...docs].find(([n]) => n.includes(other));

  /* ── 조항 참조 ── */
  const bad = [];
  for (const m of d.text.matchAll(/(HIE-QP-)?(E0[123])\s*(\d+\.\d+(?:\.\d+)*)/g)) {
    const doc = m[2], sec = m[3];
    const has =
      doc === self ? d.sec.has(sec)
      : doc === other ? (otherDoc && otherDoc[1].sec.has(sec))
      : e01.size ? e01.has(sec) : true;
    if (!has) bad.push(`${doc} ${sec}`);
  }

  /* 제 문서 안에서 번호만 부르는 것 — 「7.7.7 에 따라」 */
  for (const m of d.text.matchAll(/(?:^|[^\d.])(\d\.\d+(?:\.\d+)*)\s*(?:항|에 따라|의 )/g)) {
    if (!d.sec.has(m[1])) bad.push(`${self} ${m[1]} (제 문서)`);
  }

  const cnt = new Map();
  for (const b of bad) cnt.set(b, (cnt.get(b) || 0) + 1);

  console.log(`\n[없는 항을 부르는 곳]  ${cnt.size}가지`);
  if (!cnt.size) console.log("   없다");
  for (const [b, n] of [...cnt].sort()) console.log(`   ${b}   ${n}번`);

  /* ── 조항 번호가 빠진 자리 ── */
  const nums = [...d.sec].map((s) => s.split(".").map(Number));
  const gaps = [];
  const byParent = new Map();
  for (const n of nums) {
    if (n.length < 2) continue;
    const p = n.slice(0, -1).join(".");
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(n[n.length - 1]);
  }
  for (const [p, kids] of byParent) {
    kids.sort((a, b) => a - b);
    for (let i = 1; i < kids.length; i++) {
      if (kids[i] !== kids[i - 1] + 1) gaps.push(`${p}.${kids[i - 1]} 다음이 ${p}.${kids[i]}`);
    }
  }
  console.log(`\n[번호가 건너뛴 자리]  ${gaps.length}곳`);
  for (const g of gaps) console.log("   " + g);

  /* ── 서식 ── */
  console.log(`\n[서식]  ${d.exh.size}가지`);
  for (const [code, title] of [...d.exh].sort()) console.log(`   ${code}  ${title}`);
}
