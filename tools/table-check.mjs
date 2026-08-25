/*
 * 표의 칸 수가 머리글과 맞는지 본다.
 * Markdown 은 칸이 모자라도 그냥 넘어가지만 Word·한글로 옮기면
 * 표가 어긋나 보인다.
 */
import fs from "node:fs";

const F = ["docs/HIE-QP-E02 필기시험 시행 규칙.md",
           "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md"];

const cells = (l) => l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").length;

let bad = 0;
for (const f of F) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("=".repeat(70));
  console.log(f.split("/").pop());

  let head = null, headLn = 0, code = false, tables = 0;
  lines.forEach((l, i) => {
    if (/^```/.test(l)) { code = !code; return; }
    if (code) return;

    if (!/^\s*\|/.test(l)) { head = null; return; }

    /* 구분선이면 바로 앞줄이 머리글이다 */
    /* 구분선에는 - 가 반드시 있다. 「| | |」 을 구분선으로 보면 안 된다 */
    if (/^\s*\|[\s:|-]+\|\s*$/.test(l) && l.includes("-")) {
      head = cells(lines[i - 1]); headLn = i; tables++;
      if (cells(l) !== head) {
        console.log(`  ▶ ${i + 1}줄  구분선 ${cells(l)}칸 ≠ 머리글 ${head}칸`);
        bad++;
      }
      return;
    }
    if (head === null) return;
    const c = cells(l);
    if (c !== head) {
      console.log(`  ▶ ${i + 1}줄  ${c}칸 ≠ 머리글 ${head}칸 (머리글 ${headLn}줄)`);
      console.log(`        ${l.trim().slice(0, 78)}`);
      bad++;
    }
  });
  console.log(`  표 ${tables}개`);
  console.log();
}
console.log(bad ? "살펴볼 곳 " + bad + "군데" : "표의 칸 수가 모두 맞는다");
