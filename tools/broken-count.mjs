/*
 * 진짜로 깨진 답지 항목만 센다.
 *
 * 긴 답이라고 다 깨진 게 아니다. 프로드 자화전류처럼 원래 문장인 답도 있다.
 * 깨진 것은 "답 안에 다른 문항이나 각주가 통째로 들어온" 경우다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAnswerKey } from "./anskey.mjs";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

/* 깨짐 판정: 다음 문항 번호가 섞였거나, 각주 표시가 답 중간에 있거나, 선택지 라벨이 들어옴 */
const BROKEN = [
  { re: /\b\d{1,2}\.\s+[A-Z][a-z]{3}/, why: "다음 문항이 섞임" },
  { re: /\s[#*]\d\s*\//, why: "각주가 섞임" },
  { re: /\/\s*[#*]\d/, why: "각주가 섞임" },
  { re: /\b[A-D]\.\s+[A-Z가-힣]/, why: "선택지 라벨이 섞임" },
];

const files = [
  ...walk("D:/Visual Studio Code/Level II 문제"),
  ...walk("D:/Visual Studio Code/Level III 문제"),
];

let log = "";
let total = 0;

for (const f of files) {
  const { text, picAnchors } = readHwp(f);
  const qs = parseExam(text, picAnchors).filter((q) => q.question);
  if (!qs.length) continue;
  const byNo = new Map(qs.map((q) => [q.no, q]));
  const { key } = parseAnswerKey(text, {
    questionCount: Math.max(...qs.map((q) => q.no)),
    hasOptions: (no) => {
      const q = byNo.get(no);
      return !!(q && Array.isArray(q.options) && q.options.length >= 2);
    },
  });

  const bad = [];
  for (const [no, v] of Object.entries(key)) {
    const s = String(v);
    const hit = BROKEN.find((b) => b.re.test(s));
    if (hit) bad.push({ no, why: hit.why, s: s.slice(0, 70).replace(/\s+/g, " ") });
  }

  if (!bad.length) continue;
  total += bad.length;

  const rel = path.relative("D:/Visual Studio Code", f).replace(/\\/g, "/")
    .replace("Level II 문제/", "II/").replace("Level III 문제/", "III/").replace(/\.hwp$/i, "");
  log += `\n### ${rel}  ${bad.length}건\n`;
  bad.forEach((b) => (log += `  Q${b.no}  [${b.why}]  ${b.s}\n`));
}

log = `진짜 깨진 답지 항목 ${total}건\n` + log;
fs.writeFileSync("brokencount-out.txt", log, "utf8");
console.log(log);
