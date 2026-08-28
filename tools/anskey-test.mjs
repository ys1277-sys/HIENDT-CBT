/* 49개 시험지 전부에서 통합 답지 파서 검증 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAnswerKey } from "./anskey.mjs";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const files = [
  ...walk("D:/Visual Studio Code/원본자료/Level II 문제"),
  ...walk("D:/Visual Studio Code/원본자료/Level III 문제"),
];

let log = "파일".padEnd(46) + "문항  답지  방식    매칭  범위밖\n" + "-".repeat(92) + "\n";
let full = 0, partial = 0, none = 0;
const detail = [];

for (const f of files) {
  const rel = path.relative("D:/Visual Studio Code", f).replace(/\\/g, "/")
    .replace("Level II 문제/", "II/").replace("Level III 문제/", "III/").replace(/\.hwp$/i, "");

  const { text, picAnchors } = readHwp(f);
  const qs = parseExam(text, picAnchors).filter((q) => q.question);
  const byNo = new Map(qs.map((q) => [q.no, q]));

  const hasOptions = (no) => {
    const q = byNo.get(no);
    return !!(q && Array.isArray(q.options) && q.options.length >= 2);
  };

  const { key, how, warnings } = parseAnswerKey(text, {
    questionCount: qs.length ? Math.max(...qs.map((q) => q.no)) : 0,
    hasOptions,
  });

  let matched = 0, out = 0;
  const bad = [];
  for (const q of qs) {
    const ans = key[q.no];
    if (ans === undefined) continue;
    matched++;
    const n = Array.isArray(q.options) ? q.options.length : 0;
    if (n > 0 && /^[A-Za-z](?:\s*[,·\/]\s*[A-Za-z])*$/.test(ans)) {
      const idx = ans.split(/[,·\/\s]+/).filter(Boolean).map((c) => c.toUpperCase().charCodeAt(0) - 65);
      if (idx.some((v) => v < 0 || v >= n)) { out++; bad.push(`Q${q.no}="${ans}" (선택지 ${n})`); }
    }
  }

  const keyN = Object.keys(key).length;
  const rate = qs.length ? matched / qs.length : 0;
  const status = qs.length === 0 ? "none" : rate >= 0.98 && out === 0 ? "full" : keyN > 0 ? "partial" : "none";
  if (status === "full") full++; else if (status === "partial") partial++; else none++;

  log += rel.slice(0, 45).padEnd(46) +
    String(qs.length).padStart(4) + String(keyN).padStart(6) + "  " + how.padEnd(7) +
    String(matched).padStart(5) + String(out).padStart(7) + "  " +
    (status === "full" ? "" : "!!") + "\n";

  if (status !== "full") detail.push({ rel, qs: qs.length, keyN, matched, out, bad, warnings, how });
}

log += "-".repeat(92) + `\n완전 ${full} · 부분 ${partial} · 없음 ${none} / 전체 ${files.length}\n`;

if (detail.length) {
  log += `\n${"=".repeat(80)}\n확인 필요\n${"=".repeat(80)}\n`;
  for (const d of detail) {
    log += `\n### ${d.rel}  [${d.how}]  문항 ${d.qs} · 답지 ${d.keyN} · 매칭 ${d.matched} · 범위밖 ${d.out}\n`;
    d.warnings.slice(0, 4).forEach((w) => (log += `   경고: ${w}\n`));
    d.bad.slice(0, 5).forEach((b) => (log += `   ${b}\n`));
  }
}

fs.writeFileSync("anskey-out.txt", log, "utf8");
console.log(`완전 ${full} · 부분 ${partial} · 없음 ${none} / ${files.length}`);
