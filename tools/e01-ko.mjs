/*
 * HIE-QP-E01(Rev.8) 을 조항 단위 우리말로 쪼갠다.
 *
 *   node tools/e01-ko.mjs              전 조항
 *   node tools/e01-ko.mjs 7.9          그 아래만
 *   node tools/e01-ko.mjs --miss       E02·E03 이 안 받은 조항만
 *
 * 원문 표는 「영문 │ 우리말」 한 줄에 담겨 있다. 뒤쪽 우리말만 떼어
 * 조항 번호로 자른다. 이 절차서가 뼈대이므로, 규칙 문서를 손대기 전에
 * 여기서 원문을 먼저 본다.
 */
import fs from "node:fs";
import { readRich } from "./hwprich.mjs";

const E01 =
  "D:/Visual Studio Code/원본자료/절차서/비파괴시험요원 자격인정 절차서(HIE-QP-E01(Rev.8).hwp";

const RULES = {
  E02: "docs/HIE-QP-E02 필기시험 시행 규칙.md",
  E03: "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md",
};

function flat(blocks, out = []) {
  for (const b of blocks || []) {
    if (typeof b === "string") { out.push(b); continue; }
    if (Array.isArray(b)) { flat(b, out); continue; }
    if (b == null) continue;
    if (b.t === "p") { out.push(b.s == null ? "" : String(b.s)); continue; }
    if (b.t === "table") {
      for (const row of b.grid || []) {
        const cells = [];
        for (const c of row || []) {
          if (c === "covered" || c == null) continue;
          cells.push(flat(c.blocks).join(" ").replace(/\s+/g, " ").trim());
        }
        if (cells.join("").trim()) out.push("│" + cells.join("│"));
      }
      continue;
    }
    if (b.blocks) { flat(b.blocks, out); continue; }
  }
  return out;
}

/* 한 줄에서 우리말 쪽만 — 한글이 가장 많이 든 칸을 고른다 */
function koOf(line) {
  if (!line.startsWith("│")) return line;
  const cells = line.slice(1).split("│");
  let best = "", n = -1;
  for (const c of cells) {
    const k = (c.match(/[가-힣]/g) || []).length;
    if (k > n) { n = k; best = c; }
  }
  return best;
}

const doc = await readRich(E01);
const text = flat(doc.blocks).map(koOf).join("\n");

/* 조항 번호로 자른다 — 「7.3.4」 「7.5」 「7.10.1」 꼴 */
const RE = /(?:^|\s)(\d{1,2}\.\d(?:\.\d{1,2})?)\s+(?=[가-힣A-Z(])/g;
const marks = [];
let m;
while ((m = RE.exec(text))) marks.push({ no: m[1], at: m.index + m[0].indexOf(m[1]) });

const clauses = [];
for (let i = 0; i < marks.length; i++) {
  const body = text
    .slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : undefined)
    .replace(/\s+/g, " ")
    .trim();
  /* 같은 번호가 목차·본문에 두 번 나오면 긴 쪽만 남긴다 */
  const old = clauses.find((c) => c.no === marks[i].no);
  if (old) { if (body.length > old.body.length) old.body = body; continue; }
  clauses.push({ no: marks[i].no, body });
}

const md = {};
for (const [k, f] of Object.entries(RULES)) md[k] = fs.readFileSync(f, "utf8");
const cited = (no) =>
  Object.entries(md)
    .filter(([, v]) => v.includes("E01 " + no))
    .map(([k]) => k);

const arg = process.argv[2] || "";

if (arg === "--miss") {
  const miss = clauses.filter((c) => cited(c.no).length === 0);
  console.log("E01 조항 " + clauses.length + "개 가운데 규칙 문서가 안 받은 것 " + miss.length + "개\n");
  for (const c of miss) console.log("  " + c.no.padEnd(9) + c.body.slice(c.no.length).trim().slice(0, 78));
  process.exit(0);
}

for (const c of clauses) {
  if (arg && !(c.no === arg || c.no.startsWith(arg + "."))) continue;
  const w = cited(c.no);
  console.log("\n━━ E01 " + c.no + "  " + (w.length ? "[" + w.join(",") + " 가 받음]" : "[아무 데도 안 받음]"));
  console.log(c.body.slice(c.no.length).trim());
}
