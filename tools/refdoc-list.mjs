/*
 * 문항이 "이 문서를 보고 풀라" 고 가리키는 자료 목록.
 *
 * 이 중 HIE 절차서는 원본 시험지 폴더에 파일이 없다.
 * 시험장에서 따로 나눠 주는 인쇄물로 보인다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

/* 지시문에서 자료 이름을 뽑는다 */
const DOC =
  /HIE-[A-Za-z0-9-]+(?:\s*\(\s*(?:Rev|rev)\.?\s*\d+\s*\))?|HIE-QP-[A-Za-z0-9]+|ASME\s+(?:Code\s+)?(?:B&PV\s+)?(?:Sec(?:tion)?\.?\s*[ⅠⅡⅢⅣⅤⅥⅦⅧIVX]+[^,.;()]*|B\s*16\.34|B\s*31\.1)|API\s*[0-9A-Za-z]+|ASTM\s*[A-Za-z]?\d+|BPVC[^,.;()]*/g;

const found = new Map();

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    if (!q.groupNote) continue;
    const en = String(q.groupNote).split("\n")[0];
    for (const m of en.match(DOC) || []) {
      const name = m.replace(/\s+/g, " ").trim();
      const got = found.get(name) || { n: 0, where: new Set() };
      got.n++;
      got.where.add(rel);
      found.set(name, got);
    }
  }
}

const rows = [...found.entries()].sort((a, b) => b[1].n - a[1].n);
let out = `문항이 가리키는 자료 ${rows.length}종\n\n`;
out += "문항수  자료                                        어느 과목\n";
out += "-".repeat(96) + "\n";
for (const [name, v] of rows) {
  out += `${String(v.n).padStart(5)}  ${name.padEnd(42)}  ${[...v.where].join(", ")}\n`;
}

fs.writeFileSync("refdoc-list-out.txt", out, "utf8");
console.log(out);
