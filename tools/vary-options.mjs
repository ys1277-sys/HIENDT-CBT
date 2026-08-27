/*
 * 갈래로 채운 오답을 문항마다 다르게 다듬는다.
 *
 *   node tools/vary-options.mjs          무엇이 바뀌는지 보여만 준다
 *   node tools/vary-options.mjs --써라    실제로 고친다
 *
 * tools/fill-options.mjs 가 합격·불합격 50문항과 참·거짓 21문항에 오답을
 * 두 개씩 채웠는데, 문항마다 같은 문장이 들어가 시험지를 여러 장 받아
 * 보면 「그 두 줄은 늘 지어낸 것」이라는 것이 눈에 띈다.
 *
 * 말투를 여럿 두고 문항마다 다른 짝을 골라 넣는다. 고르는 방법은
 * 은행 안에서 나오는 차례를 따르므로 **몇 번을 돌려도 같은 결과**가 되고,
 * 이웃한 문항끼리는 겹치지 않는다.
 *
 * 어느 것이든 지켜야 하는 것 하나 — **정답이 무엇이든 늘 틀려야 한다.**
 * 합격·불합격 문항에 「…면 합격」 같은 말을 넣으면 정답이 둘이 된다.
 * 그래서 판정이 아니라 판정하는 방법이 어긋난 말만 둔다.
 *
 * 갈아 끼울 자리는 note 에 남긴 자국으로 찾는다. 손으로 쓴 오답은
 * 자국이 다르므로 건드리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/*
 * 합격·불합격 문항에 넣을 오답.
 *
 * 「합격이다 / 불합격이다」라고 말하지 않는다. 판정을 미루거나, 엉뚱한
 * 것으로 판정하거나, 판정할 수 없다고 하는 말들이다.
 */
const VERDICT = [
  "It shall be re-examined by another method before judging\n판정하기 전에 다른 검사법으로 재검사해야 한다",
  "The referencing code gives no acceptance criterion for this\n적용 규격에는 이 경우에 대한 합격 기준이 없다",
  "It is a nonrelevant indication and need not be evaluated\n비관련지시이므로 평가하지 않는다",
  "It shall be ground out and re-examined without evaluation\n평가하지 않고 연마해 없앤 뒤 재검사한다",
  "The indication shall be recorded but not evaluated\n지시를 기록만 하고 평가하지는 않는다",
  "Acceptance is decided by the examined area, not by the indication\n지시가 아니라 검사한 면적으로 합부를 정한다",
  "It can be judged only after stress-relief heat treatment\n응력제거 열처리를 한 뒤에만 판정할 수 있다",
  "It shall be evaluated as a linear indication regardless of its shape\n모양과 상관없이 선형지시로 평가한다",
  "The edition of the referencing code must be known to judge it\n적용 규격의 판(edition)을 알아야 판정할 수 있다",
  "It can be judged only after the surface is prepared again\n표면을 다시 처리한 뒤에만 판정할 수 있다",
  "Adjacent indications shall be merged and re-measured first\n인접한 지시를 하나로 합쳐 다시 재야 한다",
  "Judgment is deferred until the next scheduled examination\n다음 정기검사 때까지 판정을 미룬다",
  "It can be judged only after the surface is cleaned and re-examined\n검사 면을 다시 세척하고 재검사해야만 판정할 수 있다",
  "The orientation of the indication must be known to judge it\n지시의 방향을 알아야 판정할 수 있다",
  "Acceptance is decided by the length of the part, not its thickness\n두께가 아니라 부재의 길이로 합부를 정한다",
  "A single indication is not evaluated\n지시가 하나뿐이면 평가하지 않는다",
  "It is judged after the manufacturer and the purchaser agree\n제작자와 발주자가 합의한 뒤에 판정한다",
  "Another examiner shall re-examine the same area before judging\n다른 검사자가 같은 부위를 다시 검사해야 판정할 수 있다",
  "This criterion applies to castings only, so it cannot be judged\n이 기준은 주조품에만 적용되므로 판정할 수 없다",
  "The indication shall be counted, not measured\n지시를 재지 않고 개수만 센다",
];

/*
 * 참·거짓 문항에 넣을 오답. 같은 생각으로 고른다.
 */
const TRUE_FALSE = [
  "True only if the referencing code section permits it\n적용 규격이 허용할 때만 맞다",
  "Not addressed by the referencing code\n적용 규격에서 다루지 않는다",
  "It depends on the certification level of the examiner\n검사자의 자격 등급에 따라 달라진다",
  "True only where the written practice says so\n사내 규정에 따로 정한 경우에만 맞다",
  "It cannot be judged from the information given\n주어진 조건만으로는 판정할 수 없다",
  "It can be judged only after re-examination\n재검사한 뒤에만 판정할 수 있다",
  "True if the purchaser approves it\n발주자가 승인하면 맞다",
  "It depends on the edition of the referencing code\n적용 규격의 판(edition)에 따라 달라진다",
  "True only where another paragraph of the code says so\n규격의 다른 항에서 정한 경우에만 맞다",
  "True if the manufacturer and the purchaser agree\n제작자와 발주자가 합의하면 맞다",
  "True only when the thickness is outside the code range\n두께가 규격 범위를 벗어날 때만 맞다",
  "True if the examination method is changed\n검사 방법을 바꾸면 맞다",
  "True only where the qualification procedure says so\n자격인정 절차서에 정한 경우에만 맞다",
  "It depends on the surface condition of the part\n부재의 표면 상태에 따라 달라진다",
];

/* fill-options.mjs 가 남긴 자국 */
const MARK = /오답 두 개를 (갈래로 채웠다|지어 넣었다)/;

/*
 * 짝 고르기.
 *
 * n 번째 문항에 (a, b) 를 준다. a 는 하나씩 밀고, b 는 걸음을 달리해 민다.
 * 한 바퀴 돌 때마다 b 를 한 칸 더 밀어 짝이 되풀이되지 않게 한다 —
 * 말투가 열둘이니 그냥 두면 열세 번째 문항이 첫 문항과 같은 짝을 받는다.
 *
 * 은행마다 다시 세고, 셈이 정해져 있어 몇 번을 돌려도 같은 결과가 된다.
 */
function pick(pool, n) {
  const a = n % pool.length;
  const b = (n * 5 + 3 + Math.floor(n / pool.length)) % pool.length;
  return [pool[a], pool[b === a ? (b + 1) % pool.length : b]];
}

/*
 * 은행마다 세는 자리를 달리 잡는다.
 *
 * 그냥 0 부터 세면 어느 은행이든 첫 문항이 같은 짝을 받는다. 은행이
 * 열 몇 개라 그 짝만 열 번 넘게 나왔다. 은행 이름에서 뽑은 수로 시작
 * 자리를 옮긴다 — 이름이 같으면 늘 같은 자리라 결과는 변하지 않는다.
 */
function seed(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 9973;
  return h;
}

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

let done = 0;
const sample = [];

for (const file of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const bank = path.relative(ROOT, file).split(path.sep).join("/").replace(".json", "");
  let n = seed(bank);
  let touched = false;

  for (const q of items) {
    if (!q.note || !MARK.test(q.note)) continue;
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;

    /* 앞 두 개가 원래 보기, 뒤 두 개가 채운 것이다 */
    const kind = /참·거짓/.test(q.note) ? TRUE_FALSE : VERDICT;
    const [a, b] = pick(kind, n++);

    q.options[2] = a;
    q.options[3] = b;

    q.note = q.note.replace(
      /오답 두 개를 갈래로 채웠다 \(2026-08-27\)\. 문장이 다른 문항과 비슷하니 다듬을 몫이 남아 있다\. /,
      "오답 두 개를 지어 넣었다 (2026-08-27). "
    );

    if (sample.length < 6) {
      sample.push(`${bank} id${q.id}\n      3. ${a.replace("\n", " / ")}\n      4. ${b.replace("\n", " / ")}`);
    }
    done++;
    touched = true;
  }

  if (touched && write) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`다듬은 문항 ${done}개\n`);
for (const s of sample) console.log("   " + s + "\n");

if (!write) console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
else console.log("썼다.");
