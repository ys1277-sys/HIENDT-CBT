/*
 * 규칙 문서가 가리키는 조항이 실제로 있는지 본다.
 *
 *   "6.3.2에 따라"        같은 문서 안의 조항
 *   "(E01 7.4.5)"          HIE-QP-E01 의 조항
 *   "HIE-QP-E02 7.1.1"     다른 규칙의 조항
 *   "(HIE-QP-E02-06)"      서식 번호
 *
 * 없는 곳을 가리키면 읽는 사람이 헤맨다.
 */
import fs from "node:fs";
import { readRich } from "./hwprich.mjs";

const DOCS = {
  "HIE-QP-E02": "docs/HIE-QP-E02 필기시험 시행 규칙.md",
  "HIE-QP-E03": "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md",
};

/* 문서에 실제로 있는 조항 번호를 모은다 */
function clausesOf(md) {
  const set = new Set();
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^(?:#{2,4}\s*)?(\d{1,2}(?:\.\d{1,2}){0,2})\s/);
    if (m) set.add(m[1]);
  }
  return set;
}

/* 서식 번호 */
function exhibitsOf(md) {
  return new Set(md.match(/HIE-QP-E0\d-\d\d/g) || []);
}

/* E01 의 조항 */
function e01Clauses() {
  const doc = readRich(
    "D:/Visual Studio Code/절차서/비파괴시험요원 자격인정 절차서(HIE-QP-E01(Rev.8).hwp"
  );
  const lines = [];
  (function w(bs) {
    for (const b of bs) {
      if (b.t === "p") lines.push(String(b.s).replace(/\s+/g, " ").trim());
      else if (b.t === "table")
        for (const r of b.grid) for (const c of r) if (c && c !== "covered") w(c.blocks);
    }
  })(doc.blocks);

  const set = new Set();
  for (const s of lines) {
    const m = s.match(/^(\d{1,2}(?:\.\d{1,2}){0,2})[\s.]/);
    if (m) set.add(m[1]);
    /* "7.3.4 1)" 처럼 하위 항 */
    const m2 = s.match(/^(\d{1,2}(?:\.\d{1,2}){1,2})\s+(\d)\)/);
    if (m2) set.add(m2[1] + "-" + m2[2]);
  }
  return set;
}

const E01 = e01Clauses();
console.log("HIE-QP-E01 에서 찾은 조항 " + E01.size + "개\n");

const md = {};
const clause = {};
const exhibit = {};
for (const [k, f] of Object.entries(DOCS)) {
  md[k] = fs.readFileSync(f, "utf8");
  clause[k] = clausesOf(md[k]);
  exhibit[k] = exhibitsOf(md[k]);
}

let bad = 0;

for (const [key, text] of Object.entries(md)) {
  const lines = text.split(/\r?\n/);
  const miss = [];

  lines.forEach((line, i) => {
    /* (E01 7.4.5) 또는 (E01 7.3.3-1) */
    for (const m of line.matchAll(/\(E01\s+([\d.]+(?:-\d)?)[^)]*\)/g)) {
      const c = m[1];
      const base = c.split("-")[0];
      if (!E01.has(c) && !E01.has(base)) miss.push([i + 1, "E01 " + c, line.trim()]);
    }

    /* 다른 규칙의 조항 — HIE-QP-E02 7.1.1 */
    for (const m of line.matchAll(/HIE-QP-(E0\d)\s+(\d{1,2}(?:\.\d{1,2}){0,2})/g)) {
      const doc = "HIE-QP-" + m[1];
      if (doc === "HIE-QP-E01") {
        if (!E01.has(m[2])) miss.push([i + 1, doc + " " + m[2], line.trim()]);
      } else if (clause[doc] && !clause[doc].has(m[2])) {
        miss.push([i + 1, doc + " " + m[2], line.trim()]);
      }
    }

    /* 서식 번호 */
    for (const m of line.matchAll(/HIE-QP-(E0\d)-(\d\d)/g)) {
      const doc = "HIE-QP-" + m[1];
      const full = m[0];
      if (exhibit[doc] && !exhibit[doc].has(full)) miss.push([i + 1, full, line.trim()]);
    }
  });

  console.log("=".repeat(74));
  console.log(key + "  —  가리키는 곳이 없는 것 " + miss.length + "군데");

  for (const [ln, what, line] of miss) {
    console.log("  " + String(ln).padStart(4) + "줄  「" + what + "」");
    console.log("        " + line.slice(0, 84));
  }
  bad += miss.length;
  console.log();
}

console.log(bad === 0 ? "가리키는 조항이 모두 있다" : "살펴볼 곳 " + bad + "군데");
