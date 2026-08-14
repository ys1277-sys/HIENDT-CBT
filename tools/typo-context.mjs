/*
 * 오타 후보를 문장과 함께 보여준다.
 *
 * typo-scan.mjs 가 뽑은 낱말은 문맥이 있어야 오타인지 아닌지 가릴 수 있다.
 *   "bevel angel of 30" -> angel 은 angle 오타가 맞다
 *   "amplitudes"        -> 그냥 복수형이라 놔둔다
 *
 * 사람이 봐야 할 목록을 만드는 도구다. 스스로 고치지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";
const LIST = process.argv[3]; // 볼 낱말을 쉼표로. 없으면 아래 기본 목록

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const want = new Set(
  (LIST || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
);

for (const f of walk(ROOT)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);
  const rel = path.relative(ROOT, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const texts = [
      ["발문", String(q.question || "")],
      ...(q.options || []).map((o, i) => [`보기${i + 1}`, String(o)]),
    ];

    for (const [tag, t] of texts) {
      for (const line of t.split("\n")) {
        if (/[가-힣]/.test(line)) continue;

        for (const w of line.match(/[A-Za-z][A-Za-z'-]{2,}/g) || []) {
          if (!want.has(w.toLowerCase())) continue;
          console.log(`${rel} id ${q.id} ${tag}  [${w}]`);
          console.log(`    ${line.trim().slice(0, 140)}`);
        }
      }
    }
  }
}
