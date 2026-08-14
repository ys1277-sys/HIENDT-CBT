/*
 * 묶음 지시문에 빠진 한글을 붙인다. (규칙 11)
 *
 * 원본 시험지는 지시문을 영문 한 줄, 한글 한 줄로 적는데 어떤 시험지는
 * 영문만 적어 두었다. 문항 본문과 보기는 전부 영문 다음 한글인데
 * 지시문만 영문이면 응시자가 조건을 놓친다.
 *
 * 원본에 한글이 아예 없으니 옮겨 올 데가 없다. 여기서 지어 붙인다.
 * 다른 지시문에서 쓰는 말투를 그대로 따랐다.
 *   "다음 문제는 ~ 에 언급된다" / "~ 에 따라 답하시오"
 *
 * 문항 번호는 넣지 않는다. CBT 는 문항을 섞어 뽑으니 화면에 그릴 때
 * 이번 시험지의 실제 번호가 들어간다(src/groupRange.js).
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

/* 영문 지시문 -> 붙일 한글 */
const KO = {
  "* Question pertain to requirement in B & PV Code. Sect V. 2023 Edition.":
    "(다음 문제는 ASME B & PV Code Sec.Ⅴ 2023 Edition 의 요구사항에 따라 답하시오.)",

  "* Questions pertain to visual examination equipment.":
    "(다음 문제는 육안검사 장비에 관한 것이다.)",

  "* Questions pertain to HIE-QP-E01.":
    "(다음 문제는 HIE 비파괴시험요원 자격인정 절차서[HIE-QP-E01]에 관한 것이다.)",

  "* Questions pertain to requirement in B & PV Code, Sec Ⅲ 2023 Edition.":
    "(다음 문제는 ASME B & PV Code Sec.Ⅲ 2023 Edition 의 요구사항에 따라 답하시오.)",

  "* Question pertain to requirement in ASME Section Ⅷ.":
    "(다음 문제는 ASME Sec.Ⅷ 의 요구사항에 따라 답하시오.)",

  "* Question pertain to requirement in BPVC. Sec V(Latest Edition).":
    "(다음 문제는 ASME BPVC Sec.Ⅴ 최신판의 요구사항에 따라 답하시오.)",

  "* Questions pertain to requirement in B & PV Code, Sec Ⅲ.(Latest Edition)":
    "(다음 문제는 ASME B & PV Code Sec.Ⅲ 최신판의 요구사항에 따라 답하시오.)",

  "* Questions pertain to defect type..":
    "(다음 문제는 결함의 종류에 관한 것이다.)",

  "* Questions pertain to requirement in B & PV Code, Sec.Ⅷ Div.2 (2023Ed)":
    "(다음 문제는 ASME B & PV Code Sec.Ⅷ Div.2 2023 Edition 의 요구사항에 따라 답하시오.)",
};

let n = 0;
const log = [];
const unseen = new Set(Object.keys(KO));

for (const f of walk(PUB)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8"));
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const note = q.groupNote;
    if (!note) continue;

    const ko = KO[String(note).trim()];
    if (!ko) continue;

    unseen.delete(String(note).trim());
    q.groupNote = `${String(note).trim()}\n${ko}`;
    touched = true;
    n++;
    log.push(`${rel} id ${q.id}`);
  }

  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`한글을 붙인 문항 ${n}건`);
if (unseen.size) {
  console.log(`\n사전에 있는데 은행에서 못 찾은 지시문 ${unseen.size}종`);
  unseen.forEach((s) => console.log("  " + s));
}
console.log(APPLY ? "\n적용 완료" : "\ndry-run 입니다. 적용하려면 --apply");
