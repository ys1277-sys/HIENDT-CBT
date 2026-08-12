/* 한글 번역이 없는 문제를 과목별로 뽑는다 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const hasKo = (s) => /[가-힣]/.test(String(s || ""));

let total = 0;
const rows = [];
let dump = "";

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const need = items.filter((q) => !hasKo(q.question));
  if (!need.length) continue;

  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  total += need.length;
  rows.push({ rel, n: need.length, all: items.length });

  dump += `\n${"=".repeat(76)}\n### ${rel}  ${need.length}/${items.length}\n${"=".repeat(76)}\n`;
  need.forEach((q, i) => {
    dump += `\n[${i + 1}] id=${q.id}\n${String(q.question).replace(/\s+/g, " ").slice(0, 170)}\n`;
  });
}

let log = "파일".padEnd(28) + "번역필요 / 전체\n" + "-".repeat(46) + "\n";
rows.sort((a, b) => b.n - a.n).forEach((r) => (log += `${r.rel.padEnd(28)} ${String(r.n).padStart(4)} / ${r.all}\n`));
log += "-".repeat(46) + `\n합계 ${total}건\n`;

fs.writeFileSync("untranslated-out.txt", log + dump, "utf8");
console.log(log);
