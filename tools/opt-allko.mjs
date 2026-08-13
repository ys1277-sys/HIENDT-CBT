/*
 * 보기가 통째로 한글만인 문항을 찾는다. (규칙 11)
 *
 * opt-mixed 는 한 문항 안에서 보기끼리 구성이 다른 경우만 잡는다.
 * 네 보기가 모두 한글만이면 그 안에서는 일관돼 보여 빠져나간다.
 * 발문도 같이 본다.
 *
 * 숫자·기호만 있는 보기(예: "50%")는 영문이 있을 리 없어 뺀다.
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
const LATIN = /[A-Za-z]{3,}/;

let out = "";
let nOpt = 0, nStem = 0;

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const stem = String(q.question || "");
    if (HANGUL.test(stem) && !LATIN.test(stem)) {
      nStem++;
      out += `\n[발문] ${rel} id ${q.id}\n   ${stem.replace(/\n/g, " / ").slice(0, 110)}\n`;
    }

    const opts = (q.options || []).map(String);
    if (opts.length < 2) continue;

    /* 번역할 영문이 있을 법한 보기만 센다 */
    const meaty = opts.filter((o) => HANGUL.test(o));
    if (meaty.length !== opts.length) continue;
    if (opts.some((o) => LATIN.test(o))) continue;

    nOpt++;
    out += `\n[보기] ${rel} id ${q.id}  정답 ${q.answer + 1}번\n`;
    opts.forEach((o, i) => (out += `   ${i + 1}. ${o.replace(/\n/g, " / ").slice(0, 100)}\n`));
  }
}

const head = `영문 없이 한글만인 발문 ${nStem}건 / 보기묶음 ${nOpt}건\n`;
fs.writeFileSync("opt-allko-out.txt", head + out, "utf8");
console.log(head);
