/*
 * 절차서 열 편의 우리말과 영문을 훑는다.
 *
 *   node tools/proc-proof.mjs            모두
 *   node tools/proc-proof.mjs 문체       한 갈래만
 *
 * 보는 것
 *   문체     「…합니다」와 「…한다」가 한 절차서에 섞여 있는지
 *   띄어쓰기 「되어야한다」처럼 보조용언을 붙여 쓴 자리
 *   글자     한글·영문에 섞여 든 깨진 글자
 *   번역     영문만 있고 우리말이 없는 항목
 *
 * 고치지 않는다. 어디가 어떻게 어긋났는지만 보여 준다. 절차서 본문은
 * 원본 hwp 가 임자라 사람이 판단할 몫이다.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "public/data/procedures";
const only = process.argv[2] || "";

/* ── 덩이에서 글월만 뽑는다 ────────────────── */
function lines(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "table") {
      for (const row of b.grid) {
        for (const c of row) if (c && c !== "covered") lines(c.blocks, out);
      }
      continue;
    }
    if (b.t === "img") continue;
    const s = String(b.s || "").trim();
    if (s) out.push(s);
  }
  return out;
}

const HANGUL = /[가-힣]/;

/* ── 갈래별 검사 ───────────────────────────── */

/*
 * 「…합니다」체.
 *
 * 절차서는 「…한다」로 적는 것이 원칙이다. RFT 절차서는 기계번역을
 * 그대로 받아 「…해야 합니다」가 섞여 있다.
 */
const POLITE = /(습니다|합니다|입니다|됩니다|십시오)[.。]?\s*$/;
const PLAIN = /(한다|된다|이다|하다|않는다|없다|있다)[.。]?\s*$/;

/*
 * 보조용언·의존명사를 붙여 쓴 자리.
 *
 * 「되어야 한다」가 옳다. 원본에 「되어야한다」가 흔하다.
 */
const GLUED = [
  [/[가-힣]야한다/g, "-야 한다"],
  [/[가-힣]야합니다/g, "-야 합니다"],
  [/[가-힣]야된다/g, "-야 된다"],
  [/[가-힣]어야할/g, "-어야 할"],
  [/할수\s?있다/g, "할 수 있다"],
  [/할수\s?없다/g, "할 수 없다"],
  [/[가-힣]수있다/g, "- 수 있다"],
  [/[가-힣]지않/g, "-지 않"],
  [/[가-힣]하는것/g, "-하는 것"],
];

/* 깨진 글자 — 한글·영문·숫자·문장부호 어디에도 안 드는 것 */
const JUNK = /[\uE000-\uF8FF\uFFFD]/;

const found = { 문체: [], 띄어쓰기: [], 글자: [], 번역: [] };

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith(".json") || f === "index.json") continue;

  const doc = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const code = f.replace(".json", "");
  const ls = lines(doc.blocks);

  /* 문체 — 한 절차서 안에서 두 말투가 섞였는지 */
  const polite = ls.filter((s) => HANGUL.test(s) && POLITE.test(s));
  const plain = ls.filter((s) => HANGUL.test(s) && PLAIN.test(s));

  if (polite.length && plain.length) {
    found.문체.push({
      code,
      polite: polite.length,
      plain: plain.length,
      보기: polite.slice(0, 4),
    });
  }

  for (const s of ls) {
    if (JUNK.test(s)) found.글자.push({ code, s: s.slice(0, 70) });

    for (const [re, want] of GLUED) {
      for (const m of s.match(re) || []) {
        found.띄어쓰기.push({ code, hit: m, want, s: s.slice(0, 70) });
      }
    }
  }
}

/* ── 알림 ──────────────────────────────────── */
const show = (name) => !only || only === name;

if (show("문체")) {
  console.log("\n━━ 말투가 섞인 절차서 ━━");
  if (!found.문체.length) console.log("   없다");
  for (const r of found.문체) {
    console.log(`\n${r.code}   …합니다 ${r.polite}줄 · …한다 ${r.plain}줄`);
    for (const s of r.보기) console.log("     " + s.slice(0, 80));
  }
}

if (show("띄어쓰기")) {
  console.log("\n━━ 붙여 쓴 보조용언 ━━");
  const by = new Map();
  for (const r of found.띄어쓰기) {
    const k = r.code + "\u0000" + r.hit;
    by.set(k, (by.get(k) || 0) + 1);
  }
  if (!by.size) console.log("   없다");

  const rows = [...by].map(([k, n]) => {
    const [code, hit] = k.split("\u0000");
    return { code, hit, n };
  });
  rows.sort((a, b) => b.n - a.n);
  for (const r of rows) console.log(`   ${r.code.padEnd(20)} ${r.hit.padEnd(14)} ${r.n}군데`);
}

if (show("글자")) {
  console.log("\n━━ 깨진 글자 ━━");
  if (!found.글자.length) console.log("   없다");
  for (const r of found.글자.slice(0, 20)) console.log(`   ${r.code}  ${r.s}`);
  if (found.글자.length > 20) console.log(`   … 모두 ${found.글자.length}줄`);
}
