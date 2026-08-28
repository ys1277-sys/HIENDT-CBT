/*
 * 한 문서 안에서 같은 말을 두 번 하고 있는지 본다.
 *
 *   node tools/dup-clause.mjs
 *
 * 문서를 손보다 보면 같은 규칙이 두 자리에 남는다. 실제로 바깥 자격
 * 면제가 5.1.5 와 5.2.4 두 곳에 있었다. 둘이 조금씩 다르면 읽는 사람이
 * 어느 쪽을 따라야 할지 모른다.
 *
 * 어떻게 보나
 * -----------
 * 조항을 하나씩 떼어 낱말 꾸러미로 만들고, 두 조항이 얼마나 겹치는지
 * 잰다. 겹침이 높으면 올린다. 고치라는 것이 아니라 눈으로 보라는 것이다 —
 * 표와 흐름도가 본문을 다시 말하는 것은 일부러 그런 것일 때가 많다.
 */
import fs from "node:fs";

const DOCS = [
  "docs/HIE-QP-E02 필기시험 시행 규칙.md",
  "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md",
];

const HIT = 0.62;          /* 이만큼 겹치면 올린다 */
const MIN_WORDS = 8;       /* 너무 짧은 조항은 견주지 않는다 */

/* 조항 하나를 떼어 낸다 — 「5.1.5 …」부터 다음 번호 앞까지 */
function clauses(md) {
  const out = [];
  let cur = null;

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s+(.*)$/);

    if (m) {
      if (cur) out.push(cur);
      cur = { no: m[1], text: m[2] };
      continue;
    }

    /*
     * 제목을 만나면 조항이 끝난다.
     *
     * 이걸 안 하면 마지막 조항이 뒤에 오는 것을 통째로 삼킨다. 실제로
     * 7.10.4 가 8.0 양식과 9.0 첨부까지 다 먹어, 다른 조항이 전부
     * 그 안에 든 꼴이 되어 겹침이 100% 로 나왔다.
     */
    if (/^#/.test(line)) { if (cur) out.push(cur); cur = null; continue; }

    /* 표·인용은 조항 몸에 넣지 않는다. 본문을 다시 말하는 것이 정상이다 */
    if (!cur || !line || /^[|>`]/.test(line)) continue;
    cur.text += " " + line;
  }
  if (cur) out.push(cur);
  return out;
}

function words(s) {
  return new Set(
    s
      .replace(/\*\*|`/g, "")
      .replace(/\(E01[^)]*\)/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function overlap(a, b) {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / Math.min(a.size, b.size);
}

let found = 0;

for (const file of DOCS) {
  const cs = clauses(fs.readFileSync(file, "utf8"))
    .map((c) => ({ ...c, w: words(c.text) }))
    .filter((c) => c.w.size >= MIN_WORDS);

  console.log("");
  console.log("══ " + file.replace("docs/", "") + " — 조항 " + cs.length + "개 ══");

  const hits = [];
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      const s = overlap(cs[i].w, cs[j].w);
      if (s >= HIT) hits.push({ a: cs[i], b: cs[j], s });
    }
  }

  if (!hits.length) {
    console.log("  같은 말을 두 번 하는 조항 없음");
    continue;
  }

  found += hits.length;
  hits.sort((x, y) => y.s - x.s);
  for (const h of hits) {
    console.log("");
    console.log(`  ${Math.round(h.s * 100)}%  ${h.a.no}  ↔  ${h.b.no}`);
    console.log(`     ${h.a.no}  ${h.a.text.slice(0, 84)}`);
    console.log(`     ${h.b.no}  ${h.b.text.slice(0, 84)}`);
  }
}

console.log("");
console.log("-".repeat(70));
console.log(found ? `겹치는 자리 ${found}쌍 — 눈으로 볼 것` : "겹치는 조항 없음");
