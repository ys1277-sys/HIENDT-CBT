/*
 * Level Ⅱ 일반 시험지 A형·B형에서 은행에 없는 문항을 찾는다.
 *
 *   node tools/general-gap.mjs
 *
 * 일반 시험지는 종목마다 A형·B형 두 벌이고 각각 40문항이다. 은행은
 * 둘을 합쳐 중복을 지운 것인데 딱 40문항이다 — 두 벌이 거의 같은
 * 문항으로 이루어졌다는 뜻이다. 정말 그런지, 안 들어간 것이 있는지 본다.
 *
 * 발문을 낱자만 남겨 견준다. 띄어쓰기·문장부호·대소문자는 무시한다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const SRC = "D:/Visual Studio Code/원본자료/Level II 문제/Genernal(40문항)";
const PUB = "public/data/Level II/General";

/* 갑지 NOTE 는 번호가 붙어 있어 물음처럼 읽힌다 */
const NOTE = /closed book|intent of examination|ink or ball-point|composite grade of at least|completed within/i;

const key = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);

/* 시험지에서 「번호. 영문 물음」 꼴을 뽑는다 */
function questions(text) {
  const out = [];
  for (const raw of String(text).split("\n")) {
    const s = raw.trim();
    const m = s.match(/^(\d{1,2})[.)]\s+(.{15,})$/);
    if (!m) continue;
    /* 보기 줄(A. B. C. D.)과 한글 풀이는 뺀다 */
    if (/^[A-E][.)]\s/.test(m[2])) continue;
    /* 갑지 NOTE 는 1·2·3·4 번호가 붙어 있어 물음처럼 읽힌다 */
    if (NOTE.test(m[2])) continue;
    out.push({ no: Number(m[1]), q: m[2].trim() });
  }
  return out;
}

/*
 * 낱말 겹침으로 본다.
 *
 * 낱자를 이어 붙여 견주면 은행이 오타를 고쳤거나(focussed → focused)
 * 물음을 다듬은 문항이 「없는 것」으로 잡힌다. 낱말이 6할 넘게 겹치면
 * 같은 문항으로 본다.
 */
const words = (s) =>
  new Set(String(s).toLowerCase().match(/[a-z]{3,}/g) || []);

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const w of b) if (a.has(w)) n++;
  return n / Math.min(a.size, b.size);
}

const files = fs.readdirSync(SRC).filter((f) => /\.hwp$/i.test(f));

/* 시험지 이름 → 종목 */
const method = (f) =>
  /^ECTG/i.test(f) ? "ECT" : /^MTG/i.test(f) ? "MT" : /^PTG/i.test(f) ? "PT"
  : /^RFTG/i.test(f) ? "RFT" : /^RTG/i.test(f) ? "RT" : /^UTG/i.test(f) ? "UT"
  : /^VTG/i.test(f) ? "VT" : /^PAUT/i.test(f) ? "PAUT" : /^TOFD/i.test(f) ? "TOFD" : null;

const byMethod = new Map();
for (const f of files) {
  const m = method(f);
  if (!m) { console.log(`★ 종목을 못 읽음 : ${f}`); continue; }
  if (!byMethod.has(m)) byMethod.set(m, []);
  byMethod.get(m).push(f);
}

let total = 0;
const out = [];

for (const [m, papers] of [...byMethod].sort()) {
  let bank;
  try { bank = JSON.parse(fs.readFileSync(path.join(PUB, m + ".json"), "utf8")); } catch {
    console.log(`★ 은행 없음 : ${m}`);
    continue;
  }

  const have = bank.map((q) => words(String(q.question).split("\n")[0]));
  const seen = new Set();
  const missing = [];
  let read = 0;

  for (const f of papers) {
    let qs;
    try { qs = questions(readHwp(path.join(SRC, f)).text); } catch { continue; }
    read += qs.length;

    for (const q of qs) {
      const k = key(q.q);
      if (k.length < 20) continue;
      if (seen.has(k)) continue;
      if (have.some((w) => overlap(w, words(q.q)) > 0.6)) continue;
      seen.add(k);
      missing.push({ f, no: q.no, q: q.q });
    }
  }

  console.log(
    `${m.padEnd(6)} 은행 ${String(bank.length).padStart(3)}문항 · ` +
    `시험지 ${papers.length}벌에서 읽은 물음 ${String(read).padStart(3)}개 · ` +
    `은행에 없는 것 ${String(missing.length).padStart(3)}개`
  );

  total += missing.length;
  if (missing.length) out.push({ m, missing });
}

console.log(`\n모두 ${total}개\n`);

for (const { m, missing } of out) {
  console.log(`━━ ${m} ━━`);
  for (const x of missing) console.log(`   ${x.f}  ${x.no}번\n      ${x.q.slice(0, 110)}`);
  console.log("");
}
