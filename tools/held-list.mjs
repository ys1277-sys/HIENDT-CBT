/* 보류 문항을 과목별로 중복 제거해 검수용으로 뽑는다 */
import fs from "node:fs";

const target = process.argv[2];   // 예: Specific-PT
const ANS = /원본 정답: `([\s\S]*?)`/;

const files = target ? [`${target}.md`] : fs.readdirSync("held");

let all = "";
for (const f of files) {
  const p = `held/${f}`;
  if (!fs.existsSync(p)) continue;

  const md = fs.readFileSync(p, "utf8");
  const blocks = md.split(/^### /m).slice(1);

  const seen = new Set();
  const rows = [];

  for (const bl of blocks) {
    const m = ANS.exec(bl);
    const ans = (m ? m[1] : "").trim();
    const q = bl.split("\n").slice(2).join("\n").split("원본 정답")[0].trim().replace(/\s+/g, " ");
    const k = q.slice(0, 50);
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push({ q, ans });
  }

  all += `\n${"=".repeat(78)}\n### ${f.replace(".md", "")}  고유 ${rows.length}건 (원래 ${blocks.length})\n${"=".repeat(78)}\n`;
  rows.forEach((r, i) => {
    all += `\n[${i + 1}] ${r.q.slice(0, 180)}\n`;
    all += `    정답: ${r.ans.slice(0, 120)}\n`;
  });
}

fs.writeFileSync("heldlist-out.txt", all, "utf8");
console.log(all.split("\n").filter((l) => l.startsWith("### ")).join("\n"));
