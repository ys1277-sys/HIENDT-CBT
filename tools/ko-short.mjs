/*
 * 한글 발문이 영문에 비해 지나치게 짧은 문항을 찾는다. (규칙 3)
 *
 * VT General 31 처럼 영문의 전제("뒷면에 접근할 수 없을 때")가 번역에서
 * 통째로 빠지면 전혀 다른 질문이 된다. 한글은 원래 영문보다 짧지만,
 * 너무 짧으면 내용이 빠진 것을 의심할 만하다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;
const RATIO = 0.33;   /* 한글이 영문 길이의 이 비율보다 짧으면 의심 */
const MIN_EN = 60;    /* 짧은 발문은 비율이 흔들려 대상에서 뺀다 */

function split(s) {
  const lines = String(s).split("\n").map((l) => l.trim()).filter(Boolean);
  const at = lines.findIndex((l) => HANGUL.test(l));
  if (at <= 0) return null;
  return { en: lines.slice(0, at).join(" "), ko: lines.slice(at).join(" ") };
}

const rows = [];
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const p = split(q.question);
    if (!p || p.en.length < MIN_EN) continue;
    const r = p.ko.length / p.en.length;
    if (r >= RATIO) continue;
    rows.push({ rel, id: q.id, r, en: p.en, ko: p.ko });
  }
}

rows.sort((a, b) => a.r - b.r);
let log = `한글 발문이 영문보다 지나치게 짧은 문항 ${rows.length}건\n\n`;
for (const x of rows) {
  log += `${x.rel} id ${x.id}  (영문 ${x.en.length}자 / 한글 ${x.ko.length}자, ${(x.r * 100).toFixed(0)}%)\n`;
  log += `   en: ${x.en.slice(0, 130)}\n   ko: ${x.ko.slice(0, 130)}\n`;
}
fs.writeFileSync("ko-short-out.txt", log, "utf8");
console.log(log.slice(0, 7000));
