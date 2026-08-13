/* 번역이 필요한 선택지를 고유 문구별로 빈도순으로 뽑는다.  node opt-uniq.mjs "Level III/VT" */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const only = process.argv[2];

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const needsKo = (s) => {
  const t = String(s).trim();
  if (/[가-힣]/.test(t)) return false;
  return (t.match(/[A-Za-z]{3,}/g) || []).length >= 2;
};

const freq = new Map();
let n = 0;
for (const f of walk(PUB)) {
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  if (only && !rel.startsWith(only)) continue;
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  for (const q of items) for (const o of q.options || []) {
    if (!needsKo(o)) continue;
    const s = String(o).replace(/\s+/g, " ").trim();
    freq.set(s, (freq.get(s) || 0) + 1);
    n++;
  }
}

const rows = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
let out = `${only || "전체"} — 선택지 ${n}건 / 고유 ${rows.length}종\n\n`;
rows.forEach(([s, c]) => (out += `${c}\t${s}\n`));
fs.writeFileSync("opt-uniq-out.txt", out, "utf8");
console.log(out.split("\n").slice(0, 2).join("\n"));
