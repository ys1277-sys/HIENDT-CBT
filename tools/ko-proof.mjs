/*
 * 문제은행 우리말을 훑는다 — 띄어쓰기·표준말.
 *
 *   node tools/ko-proof.mjs
 *
 * 고치지 않는다. 어디에 무엇이 있는지만 보여 준다. 문항을 고치는 것은
 * 해당 종목 NDE Level Ⅲ 권한이다(HIE-QP-E02 6.1.2).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const HANGUL = /[가-힣]/;

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

/*
 * 잡을 것.  [이름, 무엇을 찾나, 어떻게 써야 하나]
 *
 * 보조용언과 의존명사는 띄어 쓴다. 「안 된다」의 「안」은 부사라 띄어 쓴다.
 * 「되어진다」는 이중피동이라 「된다」로 적는다.
 */
const RULES = [
  ["보조용언 붙여쓰기", /[가-힣](야한다|야합니다|야된다|야함)/g, "-야 한다"],
  ["의존명사 「수」", /([가-힣])(할|볼|줄|쓸|될|알|올|들|낼)수(?=\s*(있|없))/g, "- 수 있다"],
  ["부사 「안」", /안된다|안되는|안됨|안되고/g, "안 된다"],
  ["이중피동", /되어진다|되어지는|되어진|불려진|보여진다|사용되어진/g, "된다"],
  ["의존명사 「것」", /[가-힣](하는것|되는것|있는것|없는것|같은것)/g, "-는 것"],
  ["의존명사 「때」", /[가-힣](할때|일때|될때|있을때)/g, "-할 때"],
  ["「위하다」 붙여쓰기", /[가-힣](기위해|기위한|기위하여|를위해|을위해|를위한|을위한)/g, "-기 위해"],
  ["「때문」 붙여쓰기", /[가-힣](기때문|이때문|하기때문)/g, "-기 때문"],
  ["의존명사 「뒤·후·중·간」", /[가-힣](한후|된후|한뒤|된뒤|하는중|되는중)/g, "-한 뒤"],
  ["겹빈칸", /[가-힣]  +[가-힣]/g, "빈칸 하나"],
  ["문장부호 앞 빈칸", /[가-힣] +[,.?!]/g, "붙여 쓴다"],
  ["숫자와 단위", /\d\s+(년|개월|개|배|번|회|도|퍼센트|가지)(?![가-힣])/g, "붙여 쓴다"],
  ["줄임표", /\.\.\.|·{3,}|…{2,}/g, "……"],
];

const SKIP = new Set();

const found = new Map();

for (const f of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const rel = path.relative(ROOT, f).split(path.sep).join("/").replace(".json", "");

  for (const q of items) {
    const parts = [
      ["문항", q.question],
      ["지시문", q.groupNote],
      ...(q.options || []).map((o, i) => ["보기" + (i + 1), o]),
    ];

    for (const [kind, text] of parts) {
      if (!text) continue;

      for (const line of String(text).split("\n")) {
        if (!HANGUL.test(line)) continue;

        for (const [name, re, want] of RULES) {
          if (SKIP.has(name)) continue;

          for (const m of line.match(re) || []) {
            if (!found.has(name)) found.set(name, []);
            found.get(name).push({
              hit: m.trim(),
              want,
              at: `${rel} id${q.id} ${kind}`,
              line: line.trim().slice(0, 90),
            });
          }
        }
      }
    }
  }
}

let total = 0;
for (const [name, rows] of found) {
  console.log(`\n━━ ${name} — ${rows.length}군데 ━━`);
  total += rows.length;

  /* 같은 꼴끼리 모아 보여 준다 */
  const by = new Map();
  for (const r of rows) {
    const k = r.hit;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(r);
  }

  for (const [hit, list] of [...by].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${hit.padEnd(14)} ${String(list.length).padStart(3)}군데   ${list[0].at}`);
    console.log(`       ${list[0].line}`);
  }
}
console.log(`\n모두 ${total}군데`);
