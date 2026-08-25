/*
 * 한글로 저장한 규칙 문서를 원본 Markdown 과 맞대 본다.
 *
 * .docx 를 거쳐 .hwp 로 옮기는 사이에 글자가 빠지거나 깨지지 않았는지,
 * 철자와 표기가 어긋나지 않았는지 본다.
 */
import fs from "node:fs";
import { readRich } from "./hwprich.mjs";

const JOBS = [
  ["HIE-QP-E02 필기시험 시행 규칙", "docs/HIE-QP-E02 필기시험 시행 규칙.md"],
  ["HIE-QP-E03 자격증 발행 및 관리 규칙", "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md"],
];

const DESK = "C:/Users/W11/Desktop/";

/* 견줄 때는 꾸밈 기호를 걷어낸다 */
const norm = (s) =>
  String(s || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/* Markdown 에서 글자만 뽑는다 */
function fromMd(md) {
  const out = [];
  let code = false;

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();

    if (/^```/.test(line)) { code = !code; continue; }
    if (code) { if (line) out.push(norm(line)); continue; }
    if (!line || /^---+$/.test(line)) continue;

    /* 표는 칸마다 하나씩 */
    if (/^\|/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue;
      for (const c of line.replace(/^\|/, "").replace(/\|$/, "").split("|")) {
        const t = norm(c);
        if (t) out.push(t);
      }
      continue;
    }

    out.push(norm(line.replace(/^#+\s*/, "").replace(/^>\s?/, "")));
  }

  return out.filter(Boolean);
}

/* 한글 문서에서 글자만 뽑는다 */
function fromHwp(file) {
  const doc = readRich(file);
  const out = [];

  (function w(bs) {
    for (const b of bs) {
      if (b.t === "p") {
        const t = norm(b.s);
        if (t) out.push(t);
      } else if (b.t === "table") {
        for (const r of b.grid) for (const c of r) if (c && c !== "covered") w(c.blocks);
      }
    }
  })(doc.blocks);

  return out;
}

/* 깨진 글자를 찾는다 */
const BROKEN = [
  [/\uFFFD/g, "깨진 글자(?)"],
  [/&nbsp;/g, "&nbsp; 가 글자로"],
  [/<br\s*\/?>/gi, "<br> 이 글자로"],
  [/&amp;|&lt;|&gt;|&quot;/g, "HTML 기호가 글자로"],
  [/\*\*/g, "** 가 글자로"],
];

let bad = 0;

for (const [name, mdPath] of JOBS) {
  const hwp = DESK + name + ".hwp";
  console.log("=".repeat(74));
  console.log(name);

  if (!fs.existsSync(hwp)) { console.log("  한글 파일 없음\n"); bad++; continue; }

  const a = fromMd(fs.readFileSync(mdPath, "utf8"));
  const b = fromHwp(hwp);

  console.log(`  원본 ${a.length}조각 / 한글 ${b.length}조각`);

  /* 1) 원본에 있는데 한글에 없는 글 */
  const has = new Set(b);
  const gone = [...new Set(a.filter((s) => s.length > 3 && !has.has(s)))];

  if (gone.length) {
    console.log(`\n  ▶ 한글 문서에서 못 찾은 글 ${gone.length}조각`);
    gone.slice(0, 15).forEach((s) => console.log("      " + s.slice(0, 88)));
    if (gone.length > 15) console.log(`      … 외 ${gone.length - 15}`);
    bad += gone.length;
  } else {
    console.log("  빠진 글 없음");
  }

  /* 2) 깨진 글자 */
  const broke = [];
  b.forEach((s, i) => {
    for (const [re, why] of BROKEN) {
      re.lastIndex = 0;
      if (re.test(s)) broke.push([i, why, s]);
    }
  });

  if (broke.length) {
    console.log(`\n  ▶ 깨진 글자 ${broke.length}군데`);
    broke.slice(0, 12).forEach(([i, why, s]) =>
      console.log(`      [${why}] ${s.slice(0, 74)}`));
    bad += broke.length;
  } else {
    console.log("  깨진 글자 없음");
  }

  console.log();
}

console.log(bad === 0 ? "한글 문서가 원본과 같다" : `살펴볼 곳 ${bad}건`);
