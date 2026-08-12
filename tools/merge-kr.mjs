/*
 * 별도 키에 들어 있는 한글 번역을 question 에 합친다.
 *
 * 앱은 q.question 만 읽고 줄바꿈으로 영문/한글을 나눈다.
 * 번역이 question_kr / korean / question_ko / translation 에 들어 있으면
 * 화면에 나오지 않는다. Level III 는 501문항 전부가 이 상태였다.
 *
 * 선택지도 마찬가지로 "영문 (한글)" 형태면 줄바꿈으로 나눈다.
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const KO_KEYS = ["question_kr", "korean", "question_ko", "translation"];
const hasKo = (s) => /[가-힣]/.test(String(s || ""));

/* "the quality of the beam (빔의 질)" -> "the quality of the beam\n빔의 질" */
function splitInline(s) {
  const t = String(s || "").replace(/\n{2,}/g, "\n").trim();
  if (t.includes("\n")) return t;

  const m = /^([\s\S]*?)\s*\(([^()]*[가-힣][^()]*)\)\s*$/.exec(t);
  if (m && /[A-Za-z]{3}/.test(m[1])) return `${m[1].trim()}\n${m[2].trim()}`;

  return t;
}

let mergedQ = 0, mergedO = 0, files = 0;
const rows = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const data = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const items = (Array.isArray(data) ? data : data.questions ?? []).flat(Infinity);

  let q = 0, o = 0;

  for (const it of items) {
    // 문제 한글 합치기
    if (!hasKo(it.question)) {
      const k = KO_KEYS.find((x) => hasKo(it[x]));
      if (k) {
        it.question = `${String(it.question).trim()}\n${String(it[k]).trim()}`;
        q++;
      }
    }

    // 선택지 안 괄호 한글을 아랫줄로
    if (Array.isArray(it.options)) {
      it.options = it.options.map((opt) => {
        const next = splitInline(opt);
        if (next !== String(opt)) o++;
        return next;
      });
    }
  }

  if (!q && !o) continue;

  files++;
  mergedQ += q; mergedO += o;
  rows.push(`${path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "").padEnd(26)} 문제 +${String(q).padStart(3)} · 선택지 +${o}`);

  if (APPLY) fs.writeFileSync(f, JSON.stringify(data, null, 2) + "\n", "utf8");
}

console.log(rows.join("\n"));
console.log("-".repeat(58));
console.log(`${files}개 파일 · 문제 ${mergedQ} · 선택지 ${mergedO}`);
console.log(APPLY ? "적용 완료" : "dry-run 입니다. 적용하려면 --apply");
