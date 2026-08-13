/*
 * 규칙 11: 문항과 선택지 모두 영문 아래 줄에 한글이 있어야 한다.
 * 한글이 없는 선택지가 몇 개인지 파일별로 센다.
 *
 * 숫자·기호만 있는 선택지(1/16 in., 40 dB, True 등)는 번역할 것이 없으므로 뺀다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const hasKo = (s) => /[가-힣]/.test(String(s));
/* 영문 낱말이 2개 이상이어야 "번역할 문장" 으로 본다 */
const needsKo = (s) => {
  const t = String(s).trim();
  if (hasKo(t)) return false;
  const words = t.match(/[A-Za-z]{3,}/g) || [];
  return words.length >= 2;
};

const rows = [];
let total = 0, need = 0;

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  let t = 0, n = 0;
  for (const q of items) for (const o of q.options || []) { t++; if (needsKo(o)) n++; }
  total += t; need += n;
  if (n) rows.push({ rel, t, n });
}

let log = "파일".padEnd(26) + "번역필요 / 전체 선택지\n" + "-".repeat(52) + "\n";
rows.sort((a, b) => b.n - a.n).forEach((r) =>
  (log += `${r.rel.padEnd(26)}${String(r.n).padStart(6)} / ${r.t}\n`));
log += "-".repeat(52) + `\n합계 ${need} / ${total}\n`;

fs.writeFileSync("opt-scan-out.txt", log, "utf8");
console.log(log);
