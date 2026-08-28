/*
 * 검사 도구를 돌려 그 결과를 그림 한 장으로 만든다.
 *
 *   node tools/check-shot.cjs
 *
 * 발표에서 「검사가 다 통과합니다」라고 말로 하는 것과, 실제로 돌린
 * 화면을 보여 주는 것은 무게가 다르다. 지어낸 그림이 아니라 지금
 * 돌린 결과다.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve("docs/shots/13-checks.png");

/* 돌릴 것 — 이름, 명령, 결과에서 뽑아 보여 줄 줄 */
const RUN = [
  ["verify",          "채점이 성립하는가"],
  ["shuffle-test",    "보기를 섞어도 채점이 그대로인가"],
  ["dup-option",      "한 문항에 같은 보기가 있는가"],
  ["history-test",    "이력·만료 계산이 규정대로인가"],
  ["e01-crosscheck",  "E01 원문과 값이 맞는가"],
  ["doc-proof",       "철자·받침·띄어쓰기"],
  ["docx-fit",        "표가 종이에 들어가는가"],
  ["dup-clause",      "같은 말을 두 번 하는가"],
  ["xref-check",      "가리키는 조항이 있는가"],
  ["numbering-check", "조항 번호가 이어지는가"],
  ["table-check",     "표의 칸 수가 맞는가"],
  ["josa-check",      "떨어진 조사가 있는가"],
  ["term-check",      "낱말이 섞여 쓰이는가"],
  ["proc-proof",      "절차서에 말투가 섞였는가"],
  ["rule-check",      "E02·E03 조항 참조"],
];

const rows = [];
for (const [tool, what] of RUN) {
  let out = "", ok = true;
  try {
    out = execSync(`node tools/${tool}.mjs`, { encoding: "utf8", maxBuffer: 9e7 });
  } catch (e) {
    out = String(e.stdout || "");
    ok = false;
  }
  /* 마지막 뜻있는 줄이 결론이다 */
  const last = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean).pop() || "";
  rows.push({ tool, what, ok, last: last.slice(0, 46) });
  process.stdout.write(`  ${ok ? "○" : "✗"}  ${tool}\n`);
}

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const html = `<meta charset="utf-8">
<style>
  body{margin:0;background:#0e1a24;font-family:Consolas,"D2Coding","맑은 고딕",monospace;padding:26px 30px}
  h1{margin:0 0 4px;font-size:19px;color:#cfe3f2;font-weight:700;letter-spacing:.02em}
  .sub{color:#6f8ba3;font-size:13px;margin-bottom:18px}
  table{border-collapse:collapse;width:100%}
  td{padding:5.5px 8px;font-size:14px;vertical-align:middle;white-space:nowrap}
  .m{color:#6fd39b;font-weight:700;width:22px}
  .t{color:#cfe3f2;font-weight:700;width:210px}
  .w{color:#6f8ba3}
  .r{color:#6fd39b;text-align:right}
  .foot{margin-top:16px;color:#6cb8ee;font-size:14px;font-weight:700}
</style>
<h1>$ 검사 15가지</h1>
<div class="sub">문항이나 규칙 문서를 고칠 때마다 돌린다</div>
<table>
${rows.map(r => `<tr>
  <td class="m">${r.ok ? "✓" : "✗"}</td>
  <td class="t">node tools/${esc(r.tool)}</td>
  <td class="w">${esc(r.what)}</td>
  <td class="r">${esc(r.last)}</td>
</tr>`).join("\n")}
</table>
<div class="foot">${rows.filter(r => r.ok).length} / ${rows.length} 통과</div>`;

const tmp = path.resolve("docs/shots/_checks.html");
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, html, "utf8");

try {
  execSync(
    `"${CHROME}" --headless=new --disable-gpu --hide-scrollbars ` +
    `--virtual-time-budget=3000 --window-size=1180,760 ` +
    `--screenshot="${OUT}" "file:///${tmp.replace(/\\/g, "/")}"`,
    { stdio: "pipe", timeout: 60000 }
  );
} catch (e) { /* 크롬이 종료하며 내는 잡소리 */ }

fs.unlinkSync(tmp);

console.log("");
console.log(
  fs.existsSync(OUT)
    ? `만듦  ${OUT}  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`
    : "★ 못 만들었다"
);
