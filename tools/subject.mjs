/*
 * 과목 하나를 원본 시험지에서 뽑아 검수용 문서로 만든다.
 *
 * 사용:  node subject.mjs General RT
 *
 * A형/B형/밸브판을 합치고 중복을 제거한다.
 * 정답은 각 시험지의 답지에서 읽는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAnswerKey } from "./anskey.mjs";

const [, , CAT, METHOD] = process.argv;
if (!CAT || !METHOD) { console.error("사용: node subject.mjs General RT"); process.exit(1); }

const METHODS = ["ECT", "PAUT", "TOFD", "RFT", "UT", "MT", "PT", "RT", "VT"];

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
const toks = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2));
function jac(a, b) {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
}

/* 선택지 텍스트에서 "A. " 같은 접두사를 뗀다 (앱이 번호를 따로 그린다) */
const stripLabel = (s) => String(s || "").replace(/^\s*[A-Ja-j][.)]\s*/, "").trim();

const L = (c) => String(c.toUpperCase().charCodeAt(0) - 64);

/*
 * 보기를 글자로 가리키는 표현을 번호로 바꾼다.
 * 보기 번호를 1·2·3·4 로 쓰기로 했으므로 "both A and B above" 를 그대로 두면
 * 응시자가 어느 보기인지 알 수 없다.
 * "A-scan" 이나 "Type A" 를 건드리지 않도록 문구를 특정해서만 바꾼다.
 */
const renumberRefs = (s) =>
  String(s || "")
    .replace(/\bboth\s+([A-J])\s+and\s+([A-J])\b/gi, (_, a, b) => `both ${L(a)} and ${L(b)}`)
    .replace(/\bneither\s+([A-J])\s+nor\s+([A-J])\b/gi, (_, a, b) => `neither ${L(a)} nor ${L(b)}`)
    .replace(/\b([A-J])\s+and\s+([A-J])\s+above\b/g, (_, a, b) => `${L(a)} and ${L(b)} above`)
    .replace(/위\s*의?\s*([A-J])\s*,\s*([A-J])/g, (_, a, b) => `위 ${L(a)}, ${L(b)}`)
    .replace(/([A-J])\s*와\s*([A-J])\s*모두/g, (_, a, b) => `${L(a)}와 ${L(b)} 모두`);

/*
 * 규칙 11: 문제·선택지 모두 "영문 다음 줄에 한글".
 * 시험지는 "the quality of the beam (빔의 질)" 처럼 한 줄에 붙여 쓴 게 많다.
 */
function splitKo(s) {
  const t = String(s || "").replace(/\n{2,}/g, "\n").trim();

  // 이미 줄바꿈으로 나뉘어 있으면 그대로
  if (t.includes("\n")) return t;

  const m = /^([\s\S]*?)\s*\(([^()]*[가-힣][^()]*)\)\s*$/.exec(t);
  if (m && /[A-Za-z]{3}/.test(m[1])) return `${m[1].trim()}\n${m[2].trim()}`;

  return t;
}

const normOption = (s) => splitKo(renumberRefs(stripLabel(s)));

/* 정답 문자 -> 0-based 인덱스 */
function toIndex(ans, n) {
  const s = String(ans ?? "").trim();
  if (!s) return null;
  if (/^[A-Ja-j](?:\s*[,·\/]\s*[A-Ja-j])*$/.test(s)) {
    const idx = s.split(/[,·\/\s]+/).filter(Boolean).map((c) => c.toUpperCase().charCodeAt(0) - 65);
    if (idx.every((v) => v >= 0 && v < n)) return idx.length === 1 ? idx[0] : idx.sort((a, b) => a - b);
  }
  return s;   // 글자가 아니면 원문 그대로 (주관식)
}

const papers = [];
for (const f of walk("D:/Visual Studio Code/Level II 문제")) {
  const rel = path.relative("D:/Visual Studio Code", f).replace(/\\/g, "/");
  const base = path.basename(f);
  const method = METHODS.find((m) => base.toUpperCase().startsWith(m));
  if (method !== METHOD) continue;
  if ((/Genernal/.test(rel) ? "General" : "Specific") !== CAT) continue;

  const { text, picAnchors, images } = readHwp(f);
  const qs = parseExam(text, picAnchors).filter((q) => q.question);
  const byNo = new Map(qs.map((q) => [q.no, q]));
  const { key } = parseAnswerKey(text, {
    questionCount: qs.length ? Math.max(...qs.map((q) => q.no)) : 0,
    hasOptions: (no) => {
      const q = byNo.get(no);
      return !!(q && Array.isArray(q.options) && q.options.length >= 2);
    },
  });

  papers.push({ name: base.replace(/\.hwp$/i, ""), valve: /B16\.34/.test(rel), qs, key, images });
}

/* 합치고 중복 제거 */
const merged = [];
for (const p of papers) {
  for (const q of p.qs) {
    if (merged.some((m) => jac(m.question, q.question) >= 0.8)) continue;
    merged.push({
      ...q,
      question: renumberRefs(q.question),
      korean: renumberRefs(q.korean),
      options: (q.options || []).map(normOption),
      rawAnswer: p.key[q.no],
      paper: p.name + (p.valve ? " [밸브]" : ""),
    });
  }
}

/* 검수 문서 */
let md = `# ${CAT} / ${METHOD} 재구축 초안\n\n`;
md += `원본 시험지 ${papers.length}종을 합쳐 중복을 제거했습니다. **${merged.length}문항**\n\n`;
md += papers.map((p) => `- ${p.name}${p.valve ? " [밸브]" : ""} — ${p.qs.length}문항, 답지 ${Object.keys(p.key).length}개`).join("\n");
md += `\n\n표시: **한글없음** = 제가 번역해야 하는 문항 · **주관식** = 객관식화 필요\n\n---\n\n`;

let noKo = 0, textQ = 0, badAns = 0;

merged.forEach((q, i) => {
  const n = q.options.length;
  const idx = toIndex(q.rawAnswer, n);
  const isText = n < 2;
  const flags = [];
  if (!q.korean || !q.korean.trim()) { flags.push("**한글없음**"); noKo++; }
  if (isText) { flags.push("**주관식**"); textQ++; }
  if (!isText && typeof idx !== "number" && !Array.isArray(idx)) { flags.push("**정답확인**"); badAns++; }
  if (q.images && q.images.length) flags.push("그림");

  md += `### ${i + 1}. ${flags.join(" · ")}\n`;
  md += `\`${q.paper} Q${q.no}\`\n\n`;
  md += `${q.question}\n\n`;
  if (q.korean) md += `${q.korean}\n\n`;
  q.options.forEach((o, j) => {
    const mark = (Array.isArray(idx) ? idx.includes(j) : idx === j) ? "  **← 정답**" : "";
    const [en, ...rest] = String(o).split("\n");
    md += `${j + 1}. ${en}${mark}\n`;
    if (rest.length) md += `   ${rest.join(" ")}\n`;
  });
  if (isText) md += `\n원본 정답: \`${q.rawAnswer ?? "(없음)"}\`\n`;
  md += `\n`;
});

md += `---\n\n**${merged.length}문항** · 한글없음 ${noKo} · 주관식 ${textQ} · 정답확인 ${badAns}\n`;

const out = `D:/Visual Studio Code/재구축-${CAT}-${METHOD}.md`;
fs.writeFileSync(out, md, "utf8");
console.log(`${CAT}/${METHOD}  ${merged.length}문항 · 한글없음 ${noKo} · 주관식 ${textQ} · 정답확인 ${badAns}`);
console.log(`-> ${out}`);
