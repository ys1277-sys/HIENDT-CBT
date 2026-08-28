/*
 * 원본에서 사라진 문항이 문제은행에 남아 있는지 본다.
 *
 * 사용자가 시험지에서 답안지 뒤에 붙어 있던 것들을 지웠다. 문제은행에
 * 그때 딸려 들어온 문항이 남아 있으면 이제는 시험에 안 나와야 한다.
 *
 * src-compare.mjs 는 원본 -> 문제은행 방향이라 이것을 못 본다.
 * 여기서는 문제은행 -> 원본 방향으로 훑는다.
 *
 * 사람이 봐야 할 목록을 만드는 도구다. 스스로 지우지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAutoNum } from "./parse-autonum.mjs";

const SRC = "D:/Visual Studio Code/원본자료/Level II 문제";
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";

const AUTONUM = /ECTG-II|RFTG-II|ECTS-II|RFTS-II/;

const walkH = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walkH(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const walkJ = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walkJ(p) : p.endsWith(".json") ? [p] : [];
  });

/* 영문 낱자만 남긴다 */
const bare = (s) =>
  String(s)
    .split("\n")[0]
    .replace(/\[\[OBJ\]\]/g, " ")
    .replace(/^\s*[A-E][.)]\s+/, " ")
    .replace(/[(（][^)）]*[가-힣][^)）]*[)）]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/* 원본에 있는 발문 열쇠를 모은다 */
const src = new Set();

for (const f of walkH(SRC)) {
  const name = path.basename(f);
  let list = [];

  try {
    if (AUTONUM.test(name)) {
      list = parseAutoNum(f).map((q) => ({ question: q.stem.join(" ") }));
    } else {
      const { text, picAnchors } = readHwp(f);
      list = parseExam(text, picAnchors);
    }
  } catch {
    continue;
  }

  for (const q of list) {
    const k = bare(q.question).slice(0, 50);
    if (k.length > 15) src.add(k);
  }

  /*
   * 파서가 발문을 접힌 줄대로 자르기도 한다. 원본 글 전체를 통으로도
   * 담아 두고, 문제은행 발문이 그 안에 들어 있는지도 본다.
   */
}

/* 원본 글 전체 */
let allText = "";
for (const f of walkH(SRC)) {
  try {
    allText += " " + readHwp(f).text;
  } catch { }
}
const allBare = allText
  .replace(/\[\[OBJ\]\]/g, " ")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const orphan = [];
let total = 0;

for (const f of walkJ(PUB)) {
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity)) {
    total++;
    const k = bare(q.question).slice(0, 50);
    if (k.length <= 15) continue;

    if (src.has(k)) continue;
    /* 파서가 놓쳤어도 원본 글 안에 있으면 살아 있는 문항이다 */
    if (allBare.includes(k)) continue;

    orphan.push({ rel, id: q.id, en: String(q.question).split("\n")[0] });
  }
}

let out = `문제은행 ${total}문항 가운데 원본에서 못 찾은 문항 ${orphan.length}건\n`;
out += `\n원본을 지우셨다면 이 문항들이 지울 대상일 수 있습니다.\n`;
out += `파서가 못 읽은 것일 수도 있으니 하나씩 보고 가려야 합니다.\n\n`;

for (const o of orphan) out += `${o.rel} id ${o.id}\n  ${o.en.slice(0, 110)}\n`;

fs.writeFileSync("orphan-check-out.txt", out, "utf8");
console.log(out.split("\n")[0]);
