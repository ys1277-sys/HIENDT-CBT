/*
 * 출제 추첨 검증
 *
 * Quiz.jsx 의 drawQuestions 와 같은 규칙으로 여러 번 뽑아 보고
 *   1) 요구 문항수를 정확히 채우는가
 *   2) 조건문을 공유하는 묶음이 쪼개지지 않는가  (규칙 10)
 *   3) 매번 다른 시험지가 나오는가              (규칙 9)
 * 를 확인한다.
 */
import fs from "node:fs";
import path from "node:path";

/* 요구 문항수는 앱과 같은 곳에서 가져온다 */
const SRC = fs.readFileSync(new URL("../src/ExamData.jsx", import.meta.url), "utf8");
const { questionCount } = await import(
  "data:text/javascript," + encodeURIComponent(SRC.replace(/export default[sS]*$/, ""))
);

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const ROUNDS = 200;

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

function toGroups(bank) {
  const groups = [];
  const byNote = new Map();
  for (const q of bank) {
    const note = q && q.groupNote;
    if (!note) { groups.push([q]); continue; }
    const found = byNote.get(note);
    if (found) found.push(q);
    else { const g = [q]; byNote.set(note, g); groups.push(g); }
  }
  return groups;
}

const DRAW_ATTEMPTS = 40;

function fillGroups(groups, count) {
  const picked = [];
  for (const g of groups) {
    if (picked.length >= count) break;
    if (picked.length + g.length > count) continue;
    picked.push(...g);
  }
  return picked;
}

function drawQuestions(bank, count) {
  const groups = toGroups(bank);
  if (!count || count >= bank.length) return shuffle(groups).flat();
  let best = [];
  for (let i = 0; i < DRAW_ATTEMPTS; i++) {
    const picked = fillGroups(shuffle(groups), count);
    if (picked.length === count) return picked;
    if (picked.length > best.length) best = picked;
  }
  return best;
}

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

let log = "파일".padEnd(26) + "은행  요구  출제(최소~최대)  묶음쪼갬  중복시험지\n" + "-".repeat(78) + "\n";
let bad = 0;

for (const f of walk(PUB)) {
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  const raw = fs.readFileSync(f, "utf8");
  const bank = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);

  /*
   * 요구 문항수를 여기에 따로 적어 두면 안 된다. 예전에는 전문 25 · 일반 40
   * 으로 박아 두었는데, E01 표 3 은 전문시험을 종목마다 달리 정하고
   * (대개 20, TOFD·PAUT·CR·DR·FMC 는 30) Level III 도 기초 55 · 종목 65 다.
   * 박아 둔 값이 낡으면 검사기가 엉뚱한 것을 통과시킨다.
   * src/ExamData.jsx 하나만 보고 앱과 같은 답을 쓴다.
   */
  const [lv, a, b] = rel.split("/");
  const level = lv === "Level III" ? "Level III" : "Level II";
  const want = level === "Level III"
    ? questionCount(level, null, a)
    : questionCount(level, a, b);

  /* 조건문별 원래 묶음 크기 */
  const size = new Map();
  for (const q of bank) if (q.groupNote) size.set(q.groupNote, (size.get(q.groupNote) || 0) + 1);

  let lo = Infinity, hi = 0, split = 0;
  const seen = new Set();

  for (let r = 0; r < ROUNDS; r++) {
    const drawn = drawQuestions(bank, want);
    lo = Math.min(lo, drawn.length);
    hi = Math.max(hi, drawn.length);
    seen.add(drawn.map((q) => q.id).join(","));

    /* 뽑힌 문항 중 조건문별 개수가 원래 묶음 크기와 다르면 쪼개진 것 */
    const got = new Map();
    for (const q of drawn) if (q.groupNote) got.set(q.groupNote, (got.get(q.groupNote) || 0) + 1);
    for (const [note, n] of got) if (n !== size.get(note)) split++;
  }

  const okCount = !want || lo === Math.min(want, bank.length);
  if (!okCount || split) bad++;

  log += rel.padEnd(26)
    + String(bank.length).padStart(5)
    + String(want ?? "-").padStart(6)
    + `   ${lo}~${hi}`.padEnd(16)
    + String(split).padStart(8)
    + String(ROUNDS - seen.size).padStart(12)
    + (okCount ? "" : "   ** 문항수 미달")
    + "\n";
}

log += "-".repeat(78) + `\n${ROUNDS}회씩 추첨. 문제 있는 파일 ${bad}개\n`;
fs.writeFileSync("draw-test-out.txt", log, "utf8");
console.log(log);
