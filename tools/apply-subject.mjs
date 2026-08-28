/*
 * 과목 하나를 원본에서 재구축해 JSON 에 반영한다.
 *
 *   node apply-subject.mjs General RT [--apply]
 *
 * 규칙
 *   - A형/B형/밸브판을 합치고 중복 제거
 *   - 정답은 원본 답지에서 (0-based 인덱스)
 *   - 문제·선택지 모두 "영문\n한글"
 *   - 선택지 접두사 제거, 보기 참조를 번호로
 *   - 묶음 지시문은 groupNote
 *   - 그림은 공용(로고/서명) 제외하고 연결
 *
 * 한글 번역이 없거나 주관식인 문항이 있으면 적용하지 않고 보고만 한다.
 * (그런 과목은 내가 번역·객관식화를 해야 하므로 따로 다뤄야 한다)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAnswerKey } from "./anskey.mjs";
import { toWebImage } from "./img.mjs";

const [, , CAT, METHOD] = process.argv;
const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
if (!CAT || !METHOD) { console.error("사용: node apply-subject.mjs General RT [--apply]"); process.exit(1); }

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const IMG = `${PUB}/images`;
const METHODS = ["ECT", "PAUT", "TOFD", "RFT", "UT", "MT", "PT", "RT", "VT"];

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const boiler = new Set(JSON.parse(fs.readFileSync("boiler-hashes.json", "utf8")));

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

const L = (c) => String(c.toUpperCase().charCodeAt(0) - 64);
const stripLabel = (s) => String(s || "").replace(/^\s*[A-Ja-j][.)]\s*/, "").trim();

const renumberRefs = (s) =>
  String(s || "")
    .replace(/\bboth\s+([A-J])\s+and\s+([A-J])\b/gi, (_, a, b) => `both ${L(a)} and ${L(b)}`)
    .replace(/\bneither\s+([A-J])\s+nor\s+([A-J])\b/gi, (_, a, b) => `neither ${L(a)} nor ${L(b)}`)
    .replace(/\b([A-J])\s+and\s+([A-J])\s+above\b/g, (_, a, b) => `${L(a)} and ${L(b)} above`)
    .replace(/위\s*의?\s*([A-J])\s*,\s*([A-J])/g, (_, a, b) => `위 ${L(a)}, ${L(b)}`)
    .replace(/([A-J])\s*와\s*([A-J])\s*모두/g, (_, a, b) => `${L(a)}와 ${L(b)} 모두`);

function splitKo(s) {
  const t = String(s || "").replace(/\n{2,}/g, "\n").trim();
  if (t.includes("\n")) return t;
  const m = /^([\s\S]*?)\s*\(([^()]*[가-힣][^()]*)\)\s*$/.exec(t);
  if (m && /[A-Za-z]{3}/.test(m[1])) return `${m[1].trim()}\n${m[2].trim()}`;
  return t;
}
const normOption = (s) => splitKo(renumberRefs(stripLabel(s)));

function toIndex(ans, n) {
  const s = String(ans ?? "").trim();
  if (!s) return null;
  if (/^[A-Ja-j](?:\s*[,·\/]\s*[A-Ja-j])*$/.test(s)) {
    const idx = s.split(/[,·\/\s]+/).filter(Boolean).map((c) => c.toUpperCase().charCodeAt(0) - 65);
    if (idx.every((v) => v >= 0 && v < n)) return idx.length === 1 ? idx[0] : idx.sort((a, b) => a - b);
  }
  return null;
}

/* ---------- 원본 읽기 ---------- */

const papers = [];
for (const f of walk("D:/Visual Studio Code/원본자료/Level II 문제")) {
  const rel = path.relative("D:/Visual Studio Code", f).replace(/\\/g, "/");
  const base = path.basename(f);
  if (METHODS.find((m) => base.toUpperCase().startsWith(m)) !== METHOD) continue;
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

/* ---------- 합치기 ---------- */

const optText = (q) => (q.options || []).join(" ");

/*
 * 같은 문제인지 판단할 때 문구만 보면 안 된다.
 *   "...may not be found in castings?"  (주조물)
 *   "...may not be found in forgings."  (단조물)
 * 처럼 단어 하나만 다른 별개 문제가 유사도 0.88 로 잡혀 지워졌다.
 * 선택지까지 비슷해야 같은 문제로 본다.
 */
const sameQuestion = (a, b) =>
  jac(a.question, b.question) >= 0.8 && jac(optText(a), optText(b)) >= 0.7;

const merged = [];
for (const p of papers) {
  const byBin = new Map(p.images.map((i) => [i.binId, i]));

  for (const q of p.qs) {
    const options = (q.options || []).map(normOption);
    const cand = { question: renumberRefs(q.question), options };

    if (merged.some((m) => sameQuestion(m, cand))) continue;

    const answer = toIndex(p.key[q.no], options.length);

    // 그림
    let image = null;
    for (const bid of q.images || []) {
      const im = byBin.get(bid);
      if (!im || boiler.has(sha1(im.data))) continue;
      try {
        const web = toWebImage(im.data, im.kind);
        image = { name: `${METHOD}_${CAT.toUpperCase()}_${p.valve ? "V" : ""}Q${q.no}.${web.ext}`, data: web.data };
      } catch { }
      break;
    }

    merged.push({
      question: renumberRefs(q.question),
      korean: renumberRefs(q.korean),
      options,
      answer,
      rawAnswer: p.key[q.no],
      image,
      paper: p.name,
    });
  }
}

/* ---------- 검사 ---------- */

const noKo = merged.filter((q) => !q.korean || !q.korean.trim());
const textQ = merged.filter((q) => q.options.length < 2);
const noAns = merged.filter((q) => q.answer === null);

console.log(`${CAT}/${METHOD}  ${merged.length}문항 (시험지 ${papers.length}종)`);
console.log(`  한글없음 ${noKo.length} · 주관식 ${textQ.length} · 정답미확정 ${noAns.length} · 그림 ${merged.filter((q) => q.image).length}`);

/*
 * --skip : 손봐야 하는 문항(번역 필요·주관식·정답 미확정)을 빼고
 *          원본 그대로 쓸 수 있는 것만 넣는다.
 *          뺀 문항은 목록으로 남겨 나중에 채운다.
 */
const SKIP = process.argv.includes("--skip");
let held = [];

if (SKIP) {
  /*
   * 뺄 것은 "채점이 안 되는 문항" 뿐이다.
   *   주관식(선택지 없음) · 정답 미확정
   * 한글 번역이 없는 건 문제 자체는 풀 수 있으므로 남긴다.
   * 번역 없다고 빼면 General/TOFD 가 41 -> 17 로 줄어 시험이 성립하지 않는다.
   */
  const bad = new Set([...textQ, ...noAns]);
  held = merged.filter((q) => bad.has(q));
  for (let i = merged.length - 1; i >= 0; i--) if (bad.has(merged[i])) merged.splice(i, 1);
  console.log(`  -> 보류 ${held.length}문항 제외, ${merged.length}문항 반영`);
}

if ((noKo.length || textQ.length || noAns.length) && !FORCE && !SKIP) {
  console.log("\n손봐야 할 문항이 있어 적용하지 않았습니다. 목록:");
  noKo.slice(0, 5).forEach((q) => console.log(`  [한글없음] ${q.question.slice(0, 60)}`));
  textQ.slice(0, 5).forEach((q) => console.log(`  [주관식]   ${q.question.slice(0, 60)}  답 "${q.rawAnswer}"`));
  noAns.slice(0, 5).forEach((q) => console.log(`  [정답]     ${q.question.slice(0, 60)}  답 "${q.rawAnswer}"`));
  process.exit(0);
}

/* ---------- 적용 ---------- */

const out = merged.map((q, i) => {
  const item = {
    id: i + 1,
    level: "Level II",
    method: METHOD,
    category: CAT,
    source: q.paper,
    question: q.korean ? `${q.question}\n${q.korean}` : q.question,
    options: q.options,
    answer: q.answer,
  };
  if (q.image) item.image = q.image.name;
  return item;
});

if (APPLY) {
  fs.mkdirSync(IMG, { recursive: true });
  for (const q of merged) if (q.image) fs.writeFileSync(`${IMG}/${q.image.name}`, q.image.data);
  fs.writeFileSync(`${PUB}/Level II/${CAT}/${METHOD}.json`, JSON.stringify(out, null, 2) + "\n", "utf8");

  // 보류한 문항을 남겨 나중에 채운다
  if (held.length) {
    fs.mkdirSync("held", { recursive: true });
    const md = held.map((q, i) => {
      const why = [];
      if (q.options.length < 2) why.push("주관식");
      if (q.answer === null) why.push("정답 미확정");
      return `### ${i + 1}. ${why.join(" · ")}\n\`${q.paper}\`\n\n${q.question}\n${q.korean ? q.korean + "\n" : ""}\n` +
        q.options.map((o, j) => `${j + 1}. ${String(o).replace(/\n/g, " / ")}`).join("\n") +
        `\n\n원본 정답: \`${q.rawAnswer ?? "(없음)"}\`\n`;
    }).join("\n");
    fs.writeFileSync(`held/${CAT}-${METHOD}.md`, `# ${CAT}/${METHOD} 보류 ${held.length}문항\n\n${md}`, "utf8");
  }

  console.log(`\n적용 완료: ${out.length}문항${held.length ? ` (보류 ${held.length} -> held/${CAT}-${METHOD}.md)` : ""}`);
} else {
  console.log("\ndry-run 입니다. 적용하려면 --apply");
}
