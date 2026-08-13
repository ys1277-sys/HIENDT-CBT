/*
 * 영문과 한글이 짝을 이루지 않는 곳을 찾는다. (규칙 11)
 *
 *   A. 영문만 있고 한글이 없는 것
 *   B. 한글만 있고 영문이 없는 것
 *
 * 숫자·기호·규격명(ASME Sec Ⅲ. NB 2500)처럼 번역할 것이 없는 항목은 뺀다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;
const words = (s) => (String(s).match(/[A-Za-z]{3,}/g) || []).length;

/* 번역할 내용이 없는 것 — 규격명, 장비명, 숫자·단위만 있는 것 */
const NO_TRANSLATE =
  /^(ASME|ASTM|API|ISO|EN|SNT-TC|CP-\d|ACCP|SE-|SA-|HIE-|AWS|ANSI|Article|Level\s+[IVX]+)|^[\d\s.,%×x/+\-–~()°μ㎜mmcinlbkVMHzdBLuxA-Z]+$/i;

let onlyEn = [], onlyKo = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  const check = (where, s) => {
    const t = String(s).trim();
    if (!t) return;
    const hasKo = HANGUL.test(t);
    /* "oscillator 발진기" 처럼 영어 낱말이 하나뿐인 보기도 많다 */
    const hasEn = /[A-Za-z]/.test(t);

    if (hasEn && !hasKo) {
      if (NO_TRANSLATE.test(t)) return;
      /* 숫자·기호만 있는 것은 번역할 내용이 없다 */
      if (words(t) < 1) return;
      onlyEn.push(`${rel} ${where}: ${t.replace(/\s+/g, " ").slice(0, 100)}`);
    }
    if (hasKo && !hasEn) {
      /* 원본 자체가 한글로만 낸 문항이 있어 참고용으로만 센다 */
      onlyKo.push(`${rel} ${where}: ${t.replace(/\s+/g, " ").slice(0, 100)}`);
    }
  };

  for (const q of items) {
    /* 발문은 여러 줄이다. 첫 줄만 보면 한글이 있는 둘째 줄을 놓친다 */
    check(`id ${q.id} 본문`, q.question);
    (q.options || []).forEach((o, i) => check(`id ${q.id} 선택지${i + 1}`, o));
  }
}

let log = `A. 영문만 있고 한글이 없는 것  ${onlyEn.length}건\n\n` + onlyEn.join("\n") + "\n\n";
log += `B. 한글만 있고 영문이 없는 것  ${onlyKo.length}건\n\n` + onlyKo.join("\n") + "\n";

fs.writeFileSync("lang-balance-out.txt", log, "utf8");
console.log(`영문만 ${onlyEn.length}건 / 한글만 ${onlyKo.length}건 -> lang-balance-out.txt`);
