/*
 * Level II 한글의 옮겨 적기 자국을 바로잡는다.
 *
 * ko-odd.mjs 로 찾고 문장을 하나씩 보고 사람이 가린 것만 적었다.
 *
 *  괄호 짝이 안 맞음   원본에서 줄이 잘려 여는 괄호만 남았다
 *  말줄임표            빈칸 자리인데 "....." 로 찍혔다. 밑줄로 맞춘다
 *  문장부호 앞 공백    "어떠한가 ?" -> "어떠한가?"
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

const SPOT = {
  /* 여는 괄호만 남은 것 — 닫아 준다 */
  "General/MT|12": [["(3개 선택", "(3개 선택)"]],
  "Specific/MT|12": [["(건식자분을 사용한 프로드", "(건식자분을 사용한 프로드)"]],

  /* 문장을 통째로 감싸려던 괄호 — 앞의 여는 괄호를 뗀다 */
  "General/UT|24": [["(서로 다른 매질의 경계에서", "서로 다른 매질의 경계에서"]],
  "Specific/RT|6": [["(방사성 동위원소를", "방사성 동위원소를"]],
  "Specific/VT|26": [["(원전의 가동중 검사가", "원전의 가동중 검사가"]],

  /* 앞 조각이 잘려 나가 닫는 괄호만 남은 것 */
  "Specific/UT|13": [["10% of the wall thickness)", "10% of the wall thickness"]],

  /* 빈칸 자리가 말줄임표로 찍힌 것 */
  "General/VT|14": [["측정은 .....로써", "측정은 ______로써"]],
  "General/VT|39": [["용접부 결합은 모두...", "용접부 결합은 모두 ______"]],
  "Specific/VT|3": [["적어도 .... 배", "적어도 ______ 배"]],
  "Specific/VT|23": [["적어도 ....에 대한", "적어도 ______에 대한"]],

  /* 조사가 빠지고 물음표 앞이 벌어진 것 */
  "General/PAUT|20": [["PA 프로브 어떠한가 ?", "PA 프로브는 어떠한가?"]],

  /* 붙어 버린 보기 표시 */
  "General/VT|13": [["AEvery color", "Every color"]],
};

let n = 0;
const log = [];

for (const f of walk(ROOT)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8"));
  const rel = path.relative(ROOT, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const rules = SPOT[`${rel}|${q.id}`];
    if (!rules) continue;

    const fix = (s) => {
      let t = String(s);
      for (const [from, to] of rules) {
        if (!t.includes(from)) continue;
        t = t.split(from).join(to);
        n++;
        log.push(`${rel} id ${q.id}  "${from}" -> "${to}"`);
      }
      return t;
    };

    const before = JSON.stringify([q.question, q.options]);
    q.question = fix(q.question);
    if (Array.isArray(q.options)) q.options = q.options.map(fix);
    if (JSON.stringify([q.question, q.options]) !== before) touched = true;
  }

  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`고친 곳 ${n}건\n`);
log.forEach((l) => console.log("  " + l));
console.log(APPLY ? "\n적용 완료" : "\ndry-run 입니다. 적용하려면 --apply");
