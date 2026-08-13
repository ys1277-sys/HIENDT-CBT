/*
 * A형/B형을 합치면서 그대로 남은 중복 문항을 제거한다. (규칙 8)
 * 지금은 같은 문항이 한 은행에 최대 4번까지 들어 있어,
 * 25문항을 뽑으면 같은 문제가 여러 번 나온다.
 *
 * 사본이 여럿일 때는 "덜 깨진" 것을 남긴다.
 *   - 선택지 개수가 4개에 가까울수록 좋다
 *   - 답지나 뒤 문항이 흘러든 것은 나쁘다
 *   - 선택지가 지나치게 긴 것은 나쁘다
 *   - 한글 번역이 있으면 좋다
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

const JUNK = /해\s*답|ANSWER\s*SHEET|SPECIFIC\s*\(|GENERAL\s*\(/i;
/*
 * 로마숫자(Ⅰ Ⅱ …)는 남긴다.
 * "What is (Ⅰ)?" 와 "What is (Ⅱ)?" 는 조건문을 공유하는 별개 문항인데
 * 이걸 지워버리면 두 문항이 같은 것으로 보여 하나가 사라진다.
 */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣ⅰ-ⅹⅠ-Ⅹ]+/g, "");

/*
 * 같은 문항인지 판정하는 열쇠.
 * 본문만 보면 안 된다 — "다음 불연속의 명칭은?" 처럼 본문이 같고
 * 이미지와 선택지만 다른 별개 문항이 있다. 셋을 다 봐야 한다.
 */
const key = (q) => {
  const stem = norm(String(q.question).split("\n")[0]);
  const img = norm(JSON.stringify(q.image || q.images || ""));
  const opts = (q.options || []).map((o) => norm(o).slice(0, 40)).sort().join("|");
  return `${stem}##${img}##${opts}`;
};

/* 클수록 좋은 사본 */
function score(q) {
  const opts = (q.options || []).map(String);
  let s = 0;
  s += opts.length >= 2 && opts.length <= 5 ? 40 - Math.abs(4 - opts.length) * 8 : 0;
  if (opts.some((o) => JUNK.test(o))) s -= 60;
  const longest = Math.max(0, ...opts.map((o) => o.length));
  if (longest > 260) s -= 30;
  else if (longest > 140) s -= 8;
  if (/[가-힣]/.test(String(q.question))) s += 15;
  if (opts.every((o) => /[가-힣]/.test(o))) s += 5;
  if (q.image || q.images) s += 10;
  if (q.groupNote) s += 5;
  return s;
}

let log = "";
let removedTotal = 0;

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  /* RFT 처럼 배열이 중첩된 파일이 있어 평탄화해서 다룬다 */
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  const groups = new Map();
  for (const q of parsed) {
    const k = key(q);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(q);
  }

  const kept = [];
  const dropped = [];
  for (const [, copies] of groups) {
    if (copies.length === 1) { kept.push(copies[0]); continue; }
    const best = copies.reduce((a, b) => (score(b) > score(a) ? b : a));
    kept.push(best);
    copies.filter((c) => c !== best).forEach((c) => dropped.push({ q: c, best }));
  }
  if (!dropped.length) continue;

  kept.sort((a, b) => a.id - b.id);
  removedTotal += dropped.length;
  log += `\n${rel}  ${parsed.length} -> ${kept.length}  (${dropped.length}건 제거)\n`;
  for (const d of dropped) {
    log += `   id ${d.q.id} 제거 (id ${d.best.id} 남김, 점수 ${score(d.q)} < ${score(d.best)})`;
    log += `  ${String(d.q.question).split("\n")[0].slice(0, 60)}\n`;
  }

  if (APPLY) fs.writeFileSync(f, JSON.stringify(kept, null, 2) + "\n", "utf8");
}

log = `중복 제거 합계 ${removedTotal}건\n` + log + (APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n");
fs.writeFileSync("dedup-out.txt", log, "utf8");
console.log(log);
