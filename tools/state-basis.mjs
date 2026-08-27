/*
 * 판정 기준이 안 적힌 문항에 근거 규격을 문제문에 밝힌다.
 *
 *   node tools/state-basis.mjs          무엇이 바뀌는지 보여만 준다
 *   node tools/state-basis.mjs --써라    실제로 고친다
 *
 * 「비형광 자분탐상에서 검사면의 최소 조도는?」만 물으면 어느 규격을
 * 잣대로 삼는지 알 수 없어 답이 애매해진다. 규격마다 값이 다를 수 있고,
 * 응시자가 다른 규격을 떠올리면 맞는 답을 두고도 틀린다.
 *
 * 문제문 끝에 「(ASME Sec.V Art.7 기준)」처럼 잣대를 밝혀 답이 하나로
 * 정해지게 한다. 영문 줄과 우리말 줄에 함께 붙인다.
 *
 * note 에 적어 둔 근거에서 규격 이름을 읽어 온다. 손으로 다시 적지
 * 않으므로 근거와 문제문이 어긋날 일이 없다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/* 이미 잣대가 적혀 있으면 건드리지 않는다 */
const HAS_BASIS = /ASME|API|AWS|ASTM|SNT-TC|B31|B16|기준\)|Ref\.|HIE-NDT|HIE-QP/i;

/* note 의 「근거 : ASME Sec.V Art.7 T-777.1 · HIE-NDT-MT-P11 4.3.2 …」에서 규격을 뽑는다 */
function basisOf(note) {
  /*
   * 「ASME Sec.V Art.7」까지만 쓴다. 뒤에 붙은 조항 번호(T-777.1)와 회사
   * 절차서 번호는 안 밝힌다 — 조항까지 적으면 답을 알려 주는 꼴이 되고,
   * 일반시험은 회사 절차서를 몰라도 풀 수 있어야 한다.
   *
   * 처음에는 「근거 :」 뒤를 잘라 찾았는데, 마침표를 안 넘는 규칙에
   * 걸려 「ASME Sec」 에서 끊겼다. note 전체에서 곧바로 찾는다.
   */
  const code = String(note || "").match(
    /ASME\s+Sec\.\s*[VIX]+(?:\s*Art\.\s*\d+)?|SNT-TC-1A|API\s+\d+[A-Z]?|AWS\s+D\d+\.\d+/i
  );
  return code ? code[0].replace(/\s+/g, " ") : null;
}

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

let done = 0, skipped = 0;

for (const file of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const bank = path.relative(ROOT, file).split(path.sep).join("/").replace(".json", "");
  let touched = false;

  for (const q of items) {
    /* 새로 지은 문항만 본다. 원본 문항의 글은 건드리지 않는다 */
    if (!q.note || !/새로 지은 문항이다/.test(q.note)) continue;

    if (HAS_BASIS.test(q.question)) { skipped++; continue; }

    const code = basisOf(q.note);
    if (!code) { skipped++; continue; }

    const [en, ko] = String(q.question).split("\n");
    q.question = `${en} (Ref. : ${code})\n${ko} (${code} 기준)`;

    console.log(`${bank} id${q.id}`);
    console.log(`   ${ko}`);
    console.log(`   → ${ko} (${code} 기준)`);
    done++;
    touched = true;
  }

  if (touched && write) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`\n잣대를 밝힌 문항 ${done}개 · 이미 있거나 규격 근거가 아닌 것 ${skipped}개`);
if (!write) console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
else console.log("썼다.");
