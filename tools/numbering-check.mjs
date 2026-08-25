/*
 * 조항 번호가 건너뛰거나 겹치지 않는지 본다.
 * 최초 제정본이라 번호 하나만 어긋나도 인용이 통째로 어긋난다.
 */
import fs from "node:fs";

const F = ["docs/HIE-QP-E02 필기시험 시행 규칙.md",
           "docs/HIE-QP-E03 자격증 발행 및 관리 규칙.md"];
let bad = 0;

for (const f of F) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const seen = [];
  let inExhibit = false;

  lines.forEach((l, i) => {
    if (/^# (EXHIBIT|Attachment)/i.test(l)) inExhibit = true;
    if (/^## \d\.\d SCOPE/.test(l)) inExhibit = false;
    if (inExhibit) return;
    const m = l.match(/^(?:#{2,4}\s*)?(\d{1,2}(?:\.\d{1,2}){1,2})\s/);
    if (m && !m[1].endsWith(".0")) seen.push([m[1], i + 1]);
  });

  console.log("=".repeat(70));
  console.log(f.split("/").pop() + "  —  조항 " + seen.length + "개");

  /* 겹치는 번호 */
  const cnt = new Map();
  for (const [c] of seen) cnt.set(c, (cnt.get(c) || 0) + 1);
  for (const [c, k] of cnt) if (k > 1) {
    console.log("  ▶ 겹침  " + c + "  (" + k + "번) — " +
      seen.filter(([x]) => x === c).map(([, n]) => n + "줄").join(", "));
    bad++;
  }

  /* 건너뛴 번호 : 같은 부모 아래에서 1 씩 늘어야 한다 */
  const byParent = new Map();
  for (const [c, ln] of seen) {
    const p = c.slice(0, c.lastIndexOf("."));
    const last = Number(c.slice(c.lastIndexOf(".") + 1));
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push([last, ln, c]);
  }
  for (const [p, arr] of byParent) {
    const nums = [...new Set(arr.map((x) => x[0]))].sort((a, b) => a - b);
    if (nums[0] !== 1) { console.log("  ▶ " + p + " 아래가 " + nums[0] + " 부터 시작"); bad++; }
    for (let k = 1; k < nums.length; k++)
      if (nums[k] !== nums[k - 1] + 1) {
        console.log("  ▶ 건너뜀  " + p + "." + nums[k - 1] + " 다음이 " + p + "." + nums[k]);
        bad++;
      }
  }
  console.log();
}
console.log(bad ? "살펴볼 곳 " + bad + "군데" : "조항 번호가 이어진다");
