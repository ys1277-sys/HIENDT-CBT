/*
 * Level II 영문 오타·문법·용어를 바로잡는다.
 *
 * typo-scan.mjs 로 후보를 뽑고 typo-context.mjs 로 문장을 하나씩 보고
 * 사람이 가린 것만 여기 적었다. 짐작으로 넣은 것은 없다.
 *
 * 용어는 비파괴검사·금속·용접 쪽 표기를 따른다.
 *   planer -> planar        면상 결함
 *   liner  -> linear        선형 지시
 *   Serch  -> Search        탐촉자(search unit)
 *   Pentameter -> Penetrameter  투과도계. 은행에서 이 표기가 표준이다
 *   incompleted penetration -> incomplete penetration  용입불량
 *
 * 철자 통일은 은행에서 많이 쓰는 쪽으로 맞춘다.
 *   focussed(3) -> focused(6), colour(3) -> color(8)
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ROOT = "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

/* 문항을 콕 집어 고치는 것. [파일, id] -> [찾을 것, 바꿀 것] 목록 */
const SPOT = {
  "General/PT|10": [["aligued", "aligned"]],
  "General/PT|19": [["casued", "caused"]],
  "General/PT|21": [["anility", "ability"]],
  "General/PT|24": [["fine liner indication", "fine linear indication"]],

  "General/RT|6": [
    ["An ACME Pentameter", "An ASME Penetrameter"],
    ["15inch", "15 inch"],
    ["50 mil thatch aluminum", "50 mil thick aluminum"],
    ["2mil Strip 어로 된 모든 금속제", "2mil 두께의 모든 금속 스트립"],
    ["투과도 계", "투과도계"],
  ],
  "General/RT|28": [["rediographs", "radiographs"]],
  "General/RT|29": [
    ["half - life", "half-life"],
    ["is 75 day,", "is 75 days,"],
    ["from mow,", "from now,"],
  ],

  "General/TOFD|5": [["thin materia", "thin material"]],
  "General/TOFD|36": [
    ["Sound attanuation", "Sound attenuation"],
    ["echo hight", "echo height"],
  ],

  "General/UT|5": [["transducer amy be caused", "transducer may be caused"]],
  "General/UT|12": [["planer flaws", "planar flaws"]],
  "General/UT|32": [["the first critical angel", "the first critical angle"]],
  "General/UT|36": [["Echo pules width", "Echo pulse width"]],

  "General/VT|4": [
    /* 빈칸이 빠져 "A is a device" 가 되었다 */
    ["A is a device", "A ______ is a device"],
    ["관찰 할 수 있는 장치는?", "관찰 할 수 있는 ______ 장치는?"],
  ],
  "General/VT|5": [["Which formular is correct", "Which formula is correct"]],
  "General/VT|32": [["Zine", "Zinc"]],
  "General/VT|41": [["absorbing theat from", "absorbing the heat from"]],

  "General/PAUT|8": [["With which formular is it", "With which formula is it"]],
  "General/PAUT|25": [["in the fare field", "in the far field"]],

  "Specific/RT|23": [["in hight and", "in height and"]],
  "Specific/UT|3": [["Serch unit", "Search unit"]],
  "Specific/UT|12": [["incompleted penetration", "incomplete penetration"]],
  "Specific/VT|9": [["bore scope", "borescope"]],
  "Specific/VT|25": [["magnifiers shoul fall", "magnifiers should fall"]],
};

/* 은행 전체에서 표기를 맞추는 것 */
const GLOBAL = [
  [/\bfocussed\b/g, "focused"],
  [/\bunfocussed\b/g, "unfocused"],
  [/\bfocussing\b/g, "focusing"],
  [/\bcolour\b/g, "color"],
  [/\bColour\b/g, "Color"],
];

let nSpot = 0, nGlobal = 0;
const log = [];

for (const f of walk(ROOT)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8"));
  const rel = path.relative(ROOT, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const key = `${rel}|${q.id}`;

    const fixText = (s) => {
      let t = String(s);

      for (const [from, to] of SPOT[key] || []) {
        if (t.includes(from)) {
          t = t.split(from).join(to);
          nSpot++;
          log.push(`${key}  "${from}" -> "${to}"`);
        }
      }

      for (const [re, to] of GLOBAL) {
        const hit = t.match(re);
        if (hit) {
          t = t.replace(re, to);
          nGlobal += hit.length;
          log.push(`${key}  ${hit[0]} -> ${to}`);
        }
      }
      return t;
    };

    const before = JSON.stringify([q.question, q.options]);

    q.question = fixText(q.question);
    if (Array.isArray(q.options)) q.options = q.options.map(fixText);

    if (JSON.stringify([q.question, q.options]) !== before) touched = true;
  }

  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`문항별 수정 ${nSpot}건 / 표기 통일 ${nGlobal}건\n`);
log.forEach((l) => console.log("  " + l));
console.log(APPLY ? "\n적용 완료" : "\ndry-run 입니다. 적용하려면 --apply");
