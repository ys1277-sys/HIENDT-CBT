/*
 * 규칙 문서 두 건의 우리말을 훑는다 — 철자·받침·띄어쓰기.
 *
 *   node tools/doc-proof.mjs
 *
 * 고치지 않는다. 어디에 무엇이 있는지만 보여 준다. 규칙 문서를 고치는
 * 것은 사람이 판단할 일이다.
 *
 * 무엇을 보나
 * -----------
 * 규칙에 기대어 확실히 가려낼 수 있는 것만 본다. 문맥을 알아야 하는
 * 것(되/돼 가운데 어느 쪽이 맞는지 같은 것)은 「볼 것」으로만 올린다.
 * 잘못 고치는 것이 안 고치는 것보다 나쁘다.
 *
 * 표 안의 칸과 코드 조각, 문서번호는 건너뛴다. 거기까지 띄어쓰기를
 * 따지면 없는 흠이 잔뜩 잡힌다.
 */
import fs from "node:fs";

const DOCS = [
  "docs/HIE-QP-E02 필기시험 시행 규칙.md",
  "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md",
];

/* ── 틀림이 분명한 것 ───────────────────── */
const WRONG = [
  [/되야(?=\s*(한다|합니다|된다|할|하는|하며))/g, "되어야", "「되-」에 「-어야」가 붙는다"],
  [/([가-힣])야한다/g, "$1야 한다", "보조용언은 띄어 쓴다"],
  [/([가-힣])야합니다/g, "$1야 합니다", "보조용언은 띄어 쓴다"],
  [/([가-힣])야된다/g, "$1야 된다", "보조용언은 띄어 쓴다"],
  [/([가-힣])어야할(?=\s)/g, "$1어야 할", "보조용언은 띄어 쓴다"],
  [/([가-힣])할수(?=\s*(있|없))/g, "$1할 수", "의존명사 「수」는 띄어 쓴다"],
  [/([가-힣])는것(?=[\s.,·])/g, "$1는 것", "의존명사 「것」은 띄어 쓴다"],
  [/([가-힣])ㄹ것(?=[\s.,·])/g, "$1ㄹ 것", "의존명사 「것」은 띄어 쓴다"],
  [/([가-힣])하지않/g, "$1하지 않", "보조용언은 띄어 쓴다"],
  [/([가-힣])지말아야/g, "$1지 말아야", "보조용언은 띄어 쓴다"],
  [/\b년도(?=\s*별)/g, "연도", "두음법칙 — 연도"],
  [/싯가|갯수|촛점|헛점/g, "", "사이시옷을 안 쓰는 말 — 시가·개수·초점·허점"],
  [/([0-9])개월간(?=\s)/g, "$1개월간", ""],
  [/일부러라도/g, "", ""],

  /*
   * 회사 이름은 (주)가 앞에 온다.
   *
   * 원본 절차서 아홉 군데가 모두 「(주)한국공업엔지니어링」이다.
   * E01 4.16 도 「HIE : (주)한국공업엔지니어링의 약어」라고 적는다.
   * 뒤에 붙이거나 ㈜ 한 글자를 쓰면 걸린다.
   */
  [/한국공업엔지니어링\s*(?:㈜|\(주\)|주식회사)/g, "(주)한국공업엔지니어링", "(주)는 앞에 온다"],
  [/㈜\s*한국공업엔지니어링/g, "(주)한국공업엔지니어링", "㈜ 대신 (주)로 적는다"],
  [/주식회사\s*한국공업엔지니어링/g, "(주)한국공업엔지니어링", "(주)로 적는다"],
];

/* ── 문맥을 봐야 하는 것 — 눈으로 확인할 자리 ── */
const LOOK = [
  [/[^되]돼(?=[^\s]*(다|서|어|야))/g, "돼 / 되 — 「되어」로 바꿔 말이 되면 「돼」"],
  [/로써/g, "로써 / 로서 — 수단이면 로써, 자격이면 로서"],
  [/율(?=\s|$|\.)/g, "율 / 률 — 앞이 모음이나 ㄴ 받침이면 율, 그 밖은 률"],
  /*
   * 「데」가 의존명사면 띄어 쓴다. 다만 한 낱말로 굳은 것은 빼야 한다 —
   * 가운데·그런데·이런데·건데. 안 빼면 「가운데」마다 걸려 흠이 아닌 것이
   * 잔뜩 올라온다.
   */
  [/(?<=[가-힣])(?<!가운|그런|이런|저런|는|은)데(?=[\s.,])/g, "데 — 의존명사면 띄어 쓴다"],
];

/* 건너뛸 줄 */
function skip(line) {
  const s = line.trim();
  if (!s) return true;
  if (s.startsWith("|")) return true;              /* 표 */
  if (s.startsWith("```") || s.startsWith("    ")) return true;
  if (/^[#>\-*\d.]*\s*$/.test(s)) return true;
  return false;
}

/* 문서번호·코드 안의 글자는 건드리지 않는다 */
function mask(s) {
  return s
    .replace(/HIE-[A-Z0-9-]+/g, (m) => "·".repeat(m.length))
    .replace(/`[^`]*`/g, (m) => "·".repeat(m.length))
    .replace(/[A-Za-z][A-Za-z0-9.\-/]*/g, (m) => "·".repeat(m.length));
}

let wrong = 0;
let look = 0;

for (const file of DOCS) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const hitsW = [];
  const hitsL = [];

  lines.forEach((line, i) => {
    if (skip(line)) return;
    const s = mask(line);

    for (const [re, to, why] of WRONG) {
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      hitsW.push({ n: i + 1, text: line.trim().slice(0, 78), got: m[0], to, why });
    }
    for (const [re, why] of LOOK) {
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      hitsL.push({ n: i + 1, text: line.trim().slice(0, 78), got: m[0], why });
    }
  });

  console.log(`══ ${file.replace("docs/", "")} — ${lines.length}줄 ══`);

  if (hitsW.length) {
    console.log("");
    console.log("  틀린 곳");
    for (const h of hitsW) {
      console.log(`    ${String(h.n).padStart(4)}  ${h.got}  →  ${h.to}   (${h.why})`);
      console.log(`          ${h.text}`);
    }
    wrong += hitsW.length;
  } else {
    console.log("  틀린 곳 없음");
  }

  if (hitsL.length) {
    console.log("");
    console.log("  눈으로 볼 자리");
    for (const h of hitsL.slice(0, 12)) {
      console.log(`    ${String(h.n).padStart(4)}  ${h.why}`);
      console.log(`          ${h.text}`);
    }
    if (hitsL.length > 12) console.log(`    … 그 밖 ${hitsL.length - 12}군데`);
    look += hitsL.length;
  }

  console.log("");
}

console.log("-".repeat(70));
console.log(`틀린 곳 ${wrong}군데 · 눈으로 볼 자리 ${look}군데`);
if (wrong) process.exitCode = 1;
