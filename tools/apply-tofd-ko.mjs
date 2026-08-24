/*
 * TOFD 한글을 영문 줄과 짝지어 tofd-ko.json 으로 굳힌다.
 *
 * tofd-ko.mjs 는 한글만 차례대로 담고 있다. 영문 원문을 거기에 또
 * 적어 두면 원본이 조금만 바뀌어도 둘이 어긋난다. 그래서 굽기 전에
 * 원본에서 영문 줄을 다시 뽑아 차례로 짝지운다.
 *
 * 줄 수가 안 맞으면 멈춘다. 한 줄이 밀리면 문단마다 엉뚱한 한글이
 * 붙어 버리는데, 그건 눈으로 보기 전에는 잘 안 보인다.
 */
import fs from "node:fs";
import { readRich } from "./hwprich.mjs";
import { KO } from "./tofd-ko.mjs";

const SRC = "D:/Visual Studio Code/절차서/p11-2-TOFD.hwp";
const OUT = "D:/Visual Studio Code/HIENDT-CBT/tools/tofd-ko.json";

const HANGUL = /[가-힣]/;

/* 굽는 쪽과 같은 잣대로 영문 줄을 고른다 */
export function bodyLines(blocks) {
  const out = [];

  for (const b of blocks) {
    if (b.t !== "p" && b.t !== "h") continue;

    const s = String(b.s || "").replace(/\s+/g, " ").trim();
    if (!s) continue;
    if (HANGUL.test(s)) continue;
    if (!/[A-Za-z]{3}/.test(s)) continue;

    out.push(s);
  }

  return [...new Set(out)];
}

const doc = readRich(SRC);
const en = bodyLines(doc.blocks);

if (en.length !== KO.length) {
  console.error(`영문 ${en.length}줄 인데 한글은 ${KO.length}줄이다. 짝이 안 맞는다.`);

  const n = Math.min(en.length, KO.length);
  for (let i = 0; i < n; i++) {
    /* 어디서부터 밀렸는지 짚어 준다 */
    if (KO[i] === "" || KO[i].length > 4) continue;
  }
  console.error(`  영문 마지막: ${en[en.length - 1]}`);
  console.error(`  한글 마지막: ${KO[KO.length - 1]}`);
  process.exit(1);
}

const map = {};
let n = 0;

for (let i = 0; i < en.length; i++) {
  const ko = KO[i].trim();
  if (!ko) continue;
  map[en[i]] = ko;
  n++;
}

fs.writeFileSync(OUT, JSON.stringify(map, null, 1) + "\n", "utf8");
console.log(`영문 ${en.length}줄 가운데 ${n}줄에 한글을 붙였다. (규격 번호·수식 등 ${en.length - n}줄은 그대로 둔다)`);
