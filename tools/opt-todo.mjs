/*
 * 한 문항 안에서 한글이 빠진 보기만 뽑는다. (규칙 11)
 *
 * 같은 문항의 다른 보기에는 한글이 있는데 이 보기만 없는 경우다.
 * 원본 시험지에도 한글이 없는 보기라 새로 번역해야 한다.
 *
 * 숫자·기호·규격명만 있는 보기는 번역할 내용이 없어 뺀다.
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
const NO_TRANSLATE =
  /^(ASME|ASTM|API|ISO|EN\b|SNT-TC|CP-\d|ACCP|SE-|SA-|HIE-|AWS|ANSI|Article|Appendix|Level\s+[IVX]+)/i;

const freq = new Map();
let n = 0;

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);

  for (const q of items) {
    const opts = q.options || [];
    if (opts.length < 2) continue;

    /* 다른 보기에는 한글이 있는데 이 보기만 없는 경우 */
    const withKo = opts.filter((o) => HANGUL.test(String(o))).length;
    if (withKo === 0 || withKo === opts.length) continue;

    for (const o of opts) {
      const t = String(o).trim();
      if (HANGUL.test(t)) continue;
      if ((t.match(/[A-Za-z]{3,}/g) || []).length < 1) continue;
      if (NO_TRANSLATE.test(t)) continue;
      freq.set(t, (freq.get(t) || 0) + 1);
      n++;
    }
  }
}

const rows = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
let out = `번역이 필요한 보기 ${n}개 / 고유 ${rows.length}종\n\n`;
rows.forEach(([s, c]) => (out += `${c}\t${s}\n`));

fs.writeFileSync("opt-todo-out.txt", out, "utf8");
console.log(out.split("\n")[0]);
