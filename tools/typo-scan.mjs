/*
 * 영문 오타 후보를 뽑는다.
 *
 * 문제은행 안에서만 견준다. 바깥 사전을 안 쓴다.
 *
 * 원리
 *   같은 은행에 자주 나오는 낱말과 글자 하나만 다른데, 자기는 한두 번밖에
 *   안 나오는 낱말은 오타일 가능성이 크다.
 *     angel   1번  <->  angle   30번
 *     pahse   1번  <->  phase   24번
 *     fileter 1번  <->  filter  12번
 *
 *   전문 용어는 여러 문항에 걸쳐 여러 번 나오므로 자연히 걸러진다.
 *
 * 붙어 버린 낱말도 함께 본다. "AEvery" 처럼 대문자가 가운데 끼거나
 * 자음만 길게 이어지는 것.
 *
 * 사람이 봐야 할 목록을 만드는 도구다. 스스로 고치지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";
const RARE = Number(process.argv[3] || 2);   // 이만큼 이하로 나오면 후보
const COMMON = Number(process.argv[4] || 5); // 이만큼 이상 나오면 바른 낱말로 본다

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const words = new Map();

for (const f of walk(ROOT)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);
  const rel = path.relative(ROOT, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    for (const t of [String(q.question || ""), ...(q.options || []).map(String)]) {
      for (const line of t.split("\n")) {
        if (/[가-힣]/.test(line)) continue;

        for (const w of line.match(/[A-Za-z][A-Za-z'-]{2,}/g) || []) {
          const k = w.toLowerCase();
          const got = words.get(k) || { n: 0, raw: w, where: new Set() };
          got.n++;
          got.where.add(`${rel} id ${q.id}`);
          words.set(k, got);
        }
      }
    }
  }
}

const common = [...words.entries()].filter(([, v]) => v.n >= COMMON).map(([k]) => k);
const rare = [...words.entries()].filter(([, v]) => v.n <= RARE);

/* 글자 하나 차이인지 (바꾸기·빠짐·끼어듦·자리바꿈) */
function near(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return false;

  if (a.length === b.length) {
    let diff = 0, at = -1;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { diff++; at = i; }
      if (diff > 2) return false;
    }
    if (diff === 1) return true;
    /* 자리바꿈: pahse <-> phase */
    if (diff === 2 && at > 0) {
      for (let i = 0; i < a.length - 1; i++) {
        if (a[i] !== b[i]) {
          return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
        }
      }
    }
    return false;
  }

  /* 글자 하나 빠짐 또는 끼어듦 */
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  let i = 0, j = 0, skip = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue; }
    if (++skip > 1) return false;
    j++;
  }
  return true;
}

const hits = [];

for (const [k, v] of rare) {
  const mates = common.filter((c) => near(k, c));
  if (!mates.length) continue;

  hits.push({
    word: v.raw,
    n: v.n,
    mates: mates.map((m) => `${words.get(m).raw}(${words.get(m).n})`),
    where: [...v.where],
  });
}

/* 붙어 버린 낱말 */
const glued = [];
for (const [, v] of words) {
  if (v.n > RARE) continue;
  if (/[a-z][A-Z]/.test(v.raw) && !/^[A-Z]-/.test(v.raw)) {
    glued.push({ word: v.raw, n: v.n, where: [...v.where] });
  }
}

let out = `낱말 ${words.size}종 (자주 쓰임 ${common.length}종)\n`;
out += `오타 후보 ${hits.length}건 / 붙어 버린 낱말 ${glued.length}건\n\n`;

out += "=== 자주 쓰는 낱말과 한 글자 차이 ===\n";
hits
  .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()))
  .forEach((h) => {
    out += `\n${h.word}  (${h.n}번)  ->  ${h.mates.join(", ")}\n`;
    h.where.slice(0, 4).forEach((w) => (out += `    ${w}\n`));
  });

if (glued.length) {
  out += "\n=== 붙어 버린 낱말 ===\n";
  glued.forEach((g) => {
    out += `\n${g.word}  (${g.n}번)\n`;
    g.where.slice(0, 4).forEach((w) => (out += `    ${w}\n`));
  });
}

fs.writeFileSync("typo-scan-out.txt", out, "utf8");
console.log(out.split("\n").slice(0, 2).join("\n"));
