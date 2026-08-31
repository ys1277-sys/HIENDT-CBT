/*
 * VS Code 창을 세 칸(파일 목록 · 글 고치는 곳 · 아래 명령 칸)으로 그린다.
 *
 * 발표자료 ①-2 는 「창이 여러 칸으로 나뉜다」고 말하는데, 지금 쓰는
 * 그림(15-code.png)은 칸이 둘뿐이라 말과 그림이 어긋났다.
 *
 * 글도 명령 결과도 실제 파일과 실제 출력에서 가져온다. 꾸며 내지 않는다.
 */
const path = require("node:path");
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(ROOT, "docs/shots/17-vscode.png");

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* 얕은 색칠 — 주석 · 글자 · 숫자 · 열쇳말 */
function paint(line) {
  let h = esc(line);
  h = h.replace(/(\/\*[\s\S]*|^\s*\*.*|\/\/.*)/, '<i class="c">$1</i>');
  if (!/class="c"/.test(h)) {
    h = h.replace(/("[^"]*")/g, '<i class="s">$1</i>');
    h = h.replace(/\b(export|const|function|return|if|let|new|import|from)\b/g, '<i class="k">$1</i>');
    h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<i class="n">$1</i>');
  }
  return h || " ";
}

/* 실제 파일에서 — 시험시간을 정해 둔 자리 */
const FROM = 38, N = 22;
const src = fs.readFileSync(path.join(ROOT, "src/Quiz.jsx"), "utf8")
  .split(/\r?\n/).slice(FROM - 1, FROM - 1 + N);

/* 실제 명령 출력에서 */
let term;
try {
  term = execSync("node tools/verify.mjs", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/).filter(Boolean).slice(-5);
} catch (e) {
  term = ["(검사 도구를 못 돌렸다)"];
}

const TREE = [
  ["src", 0], ["ExamData.jsx", 1], ["Quiz.jsx", 1], ["history.js", 1],
  ["Admin.jsx", 1], ["print.css", 1],
  ["public/data", 0], ["tools", 0], ["docs", 0],
];

const html = `<!doctype html><meta charset="utf-8">
<style>
  html,body{height:100%}
  body{margin:0;background:#1e1e1e;color:#d4d4d4;
       font-family:Consolas,"D2Coding",monospace}
  .bar{background:#323233;height:30px;display:flex;align-items:center;padding:0 12px;
       font-family:"맑은 고딕";font-size:12px;color:#ccc;gap:8px}
  .dot{width:11px;height:11px;border-radius:50%}
  .wrap{display:flex;height:calc(100% - 30px)}
  .tree{width:196px;background:#252526;padding:8px 0;flex:none;
        font-family:"맑은 고딕";font-size:12.5px;color:#ccc}
  .tree div{padding:3px 14px;white-space:pre}
  .tree div.d{color:#9cdcfe}
  .tree div.on{background:#37373d;color:#fff}
  .main{flex:1;display:flex;flex-direction:column;min-width:0}
  .tab{background:#2d2d2d;height:34px;display:flex;align-items:center;flex:none}
  .tab span{background:#1e1e1e;height:34px;display:flex;align-items:center;padding:0 16px;
            font-family:"맑은 고딕";font-size:12.5px;color:#fff;border-top:1px solid #0166b3}
  .code{flex:1;padding:8px 0;font-size:13px;line-height:1.5;overflow:hidden}
  .ln{display:flex}
  .ln b{width:50px;text-align:right;padding-right:14px;color:#858585;font-weight:400;flex:none}
  .ln u{text-decoration:none;white-space:pre}
  .c{color:#6a9955;font-style:normal}
  .s{color:#ce9178;font-style:normal}
  .k{color:#569cd6;font-style:normal}
  .n{color:#b5cea8;font-style:normal}
  .term{height:172px;background:#181818;border-top:1px solid #3c3c3c;flex:none;
        display:flex;flex-direction:column}
  .thead{height:28px;display:flex;align-items:center;gap:16px;padding:0 14px;
         font-family:"맑은 고딕";font-size:11.5px;color:#9a9a9a}
  .thead b{color:#fff;font-weight:600;border-bottom:1px solid #0166b3;padding-bottom:5px}
  .tbody{padding:4px 14px;font-size:12.5px;line-height:1.62;white-space:pre}
  .p{color:#4ec9b0}
  .ok{color:#89d185}
</style>
<div class="bar">
  <span class="dot" style="background:#ff5f57"></span>
  <span class="dot" style="background:#febc2e"></span>
  <span class="dot" style="background:#28c840"></span>
  <span style="margin-left:10px">src/Quiz.jsx — HIENDT-CBT — Visual Studio Code</span>
</div>
<div class="wrap">
  <div class="tree">
    ${TREE.map(([t, d]) =>
      `<div class="${d ? "" : "d"} ${t === "Quiz.jsx" ? "on" : ""}">${" ".repeat(d * 2)}${esc(t)}</div>`
    ).join("")}
  </div>
  <div class="main">
    <div class="tab"><span>Quiz.jsx</span></div>
    <div class="code">
      ${src.map((l, i) => `<div class="ln"><b>${FROM + i}</b><u>${paint(l)}</u></div>`).join("")}
    </div>
    <div class="term">
      <div class="thead"><b>터미널</b><span>문제</span><span>출력</span><span>디버그 콘솔</span></div>
      <div class="tbody"><span class="p">PS D:\\Visual Studio Code\\HIENDT-CBT&gt;</span> node tools/verify.mjs
${term.map((l) => (/전체 통과/.test(l) ? `<span class="ok">${esc(l)}</span>` : esc(l))).join("\n")}</div>
    </div>
  </div>
</div>`;

const tmp = path.join(ROOT, "docs/shots/_vs.html");
fs.writeFileSync(tmp, html, "utf8");

try {
  execSync(
    `"${CHROME}" --headless=new --disable-gpu --hide-scrollbars ` +
    `--virtual-time-budget=2500 --window-size=1240,780 ` +
    `--screenshot="${OUT}" "file:///${tmp.replace(/\\/g, "/")}"`,
    { stdio: "pipe", timeout: 60000 }
  );
} catch (e) { /* 잡소리 */ }

fs.unlinkSync(tmp);
console.log(fs.existsSync(OUT)
  ? "○  17-vscode.png  " + (fs.statSync(OUT).size / 1024).toFixed(0) + "KB"
  : "✗  못 찍었다");
