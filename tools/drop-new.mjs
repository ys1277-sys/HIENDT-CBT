/*
 * 새로 지은 문항을 은행에서 도로 뺀다.
 *
 *   node tools/drop-new.mjs                      무엇이 빠지는지 보여만 준다
 *   node tools/drop-new.mjs --써라                모든 은행에서 뺀다
 *   node tools/drop-new.mjs "Level II/General/MT" --써라   한 은행만
 *
 * 2026-08-27 에 은행이 규정 출제 수와 같아 회차마다 같은 문항이 나가던
 * 것을 늘리려고 문항을 지어 넣었다(HIE-QP-E02 6.1.3). 사용자가 도로
 * 무르라고 하면 이것으로 뺀다.
 *
 * 무엇을 빼는가
 * -------------
 * 지어 넣은 문항은 note 에 「새로 지은 문항이다」 자국이 남아 있다.
 * 그 자국이 있는 것만 뺀다. 원본 시험지에서 온 문항은 자국이 달라
 * 건드리지 않는다.
 *
 * held/ 에서 되돌린 9문항(note 에 「held/ 로 빼 두었던 문항」)과,
 * 원본 문항에 오답만 채운 것(note 에 「오답 두 개를 지어 넣었다」)은
 * 여기서 안 뺀다. 그것들은 원본에 뿌리가 있는 문항이다.
 * 그것까지 무르려면 --held 와 --오답 을 붙인다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const args = process.argv.slice(2);
const write = args.includes("--써라");
const alsoHeld = args.includes("--held");
const alsoFilled = args.includes("--오답");
const only = args.find((a) => !a.startsWith("--"));

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const isMade = (q) => q.note && /새로 지은 문항이다/.test(q.note);
const isHeld = (q) => q.note && /held\/ 로 빼 두었던 문항/.test(q.note);

let dropped = 0, unfilled = 0;
const report = [];

for (const file of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const bank = path.relative(ROOT, file).split(path.sep).join("/").replace(".json", "");
  if (only && bank !== only) continue;

  const before = items.length;
  let kept = items.filter((q) => !(isMade(q) || (alsoHeld && isHeld(q))));

  /*
   * 원본 문항에 채워 넣은 오답을 도로 뺀다.
   *
   * note 에 「원본 시험지에 보기가 N개뿐이어서」라고 적어 두었으니
   * 그 N 을 읽어 앞에서 N 개만 남긴다. 오답은 늘 뒤에 붙였으므로
   * 정답 번호는 그대로 살아 있다.
   */
  if (alsoFilled) {
    for (const q of kept) {
      const m = String(q.note || "").match(/원본 시험지에 보기가 (\d+)개/);
      if (!m || !Array.isArray(q.options)) continue;

      const n = Number(m[1]);
      if (q.options.length <= n) continue;
      if (q.answer >= n) continue;   /* 정답이 채운 보기 안에 있으면 못 되돌린다 */

      q.options = q.options.slice(0, n);
      q.note = String(q.note).split("\n").filter((l) => !/원본 시험지에 보기가 \d+개/.test(l)).join("\n");
      if (!q.note.trim()) delete q.note;
      unfilled++;
    }
  }

  const n = before - kept.length;
  if (n || unfilled) {
    report.push(`${bank.padEnd(26)} ${before} → ${kept.length}문항${n ? `  (뺀 것 ${n})` : ""}`);
    dropped += n;
  }

  if (write && (n || unfilled)) {
    fs.writeFileSync(file, JSON.stringify(kept, null, 2) + "\n", "utf8");
  }
}

console.log(report.join("\n") || "뺄 것이 없다");
console.log("");
console.log(`뺀 문항 ${dropped}개` + (alsoFilled ? ` · 되돌린 오답 ${unfilled}군데` : ""));

if (!alsoHeld) console.log("held/ 에서 되돌린 9문항은 그대로 두었다. 함께 빼려면 --held 를 붙인다.");
if (!alsoFilled) console.log("원본 문항에 채운 오답은 그대로 두었다. 함께 되돌리려면 --오답 을 붙인다.");

if (!write) console.log("\n보여만 준 것이다. 실제로 빼려면 --써라 를 붙인다.");
else console.log("\n썼다. node tools/verify.mjs 로 확인할 것.");
