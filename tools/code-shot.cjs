/*
 * 코드와 문제은행을 VS Code 처럼 그려 그림으로 만든다.
 *
 *   node tools/code-shot.cjs
 *
 * 「AI 가 해 줬다」가 아니라 「VS Code 를 열어 직접 짰다」를 보여 주는
 * 그림이다. 실제 파일에서 읽어 온다 — 꾸며 낸 화면이 아니다.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

/* 보여 줄 것 — 파일, 몇 줄부터, 몇 줄, 제목 */
const VIEWS = [
  {
    out: "15-code.png",
    file: "src/ExamData.jsx",
    from: 14, lines: 30,
    tab: "ExamData.jsx",
    tree: ["src", "  ExamData.jsx", "  Quiz.jsx", "  Result.jsx", "  history.js",
           "  optionShuffle.js", "  print.css", "public/data", "tools"],
    cap: "출제 문항 수 — HIE-QP-E01 표 3 을 그대로 옮긴 자리",
  },
  {
    out: "16-bank.png",
    file: "public/data/Level II/General/MT.json",
    from: 1, lines: 32,
    tab: "MT.json",
    tree: ["public/data", "  Level II", "    General", "      MT.json", "      PT.json",
           "      RT.json", "      UT.json", "    Specific", "  Level III", "  procedures"],
    cap: "문제은행 — 사람이 읽을 수 있는 글로 두었다",
  },
];

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* 아주 얕은 색칠 — 주석·글자·숫자·열쇳말만 */
function paint(line) {
  let s = esc(line);
  s = s.replace(/(\/\*.*?\*\/|\/\/.*$)/g, '<i class="c">$1</i>');
  if (/<i class="c">/.test(s)) return s;
  s = s.replace(/(&quot;|")([^"]*?)\1/g, '<i class="s">$1$2$1</i>');
  s = s.replace(/\b(const|let|export|function|return|if|else|import|from|default)\b/g, '<i class="k">$1</i>');
  s = s.replace(/(?<![\w.])(\d+)(?![\w])/g, '<i class="n">$1</i>');
  return s;
}

for (const v of VIEWS) {
  const all = fs.readFileSync(v.file, "utf8").split(/\r?\n/);
  const body = all.slice(v.from - 1, v.from - 1 + v.lines);

  const html = `<meta charset="utf-8">
<style>
  body{margin:0;background:#1e1e1e;font-family:Consolas,"D2Coding",monospace;color:#d4d4d4}
  .bar{background:#323233;height:30px;display:flex;align-items:center;padding:0 12px;
       font-family:"맑은 고딕";font-size:12px;color:#cccccc;gap:8px}
  .dot{width:11px;height:11px;border-radius:50%}
  .wrap{display:flex;height:calc(100% - 30px)}
  .tree{width:190px;background:#252526;padding:10px 0;font-family:"맑은 고딕";font-size:12.5px;color:#cccccc}
  .tree div{padding:2.5px 14px;white-space:pre}
  .tree div.on{background:#37373d;color:#fff}
  .main{flex:1;display:flex;flex-direction:column}
  .tab{background:#2d2d2d;height:34px;display:flex;align-items:center}
  .tab span{background:#1e1e1e;height:34px;display:flex;align-items:center;padding:0 16px;
            font-family:"맑은 고딕";font-size:12.5px;color:#ffffff;border-top:1px solid #0179cf}
  .code{padding:10px 0;font-size:13px;line-height:1.55;overflow:hidden}
  .ln{display:flex}
  .ln b{width:52px;text-align:right;padding-right:16px;color:#858585;font-weight:400;flex:none}
  .ln u{text-decoration:none;white-space:pre}
  .c{color:#6a9955;font-style:normal}
  .s{color:#ce9178;font-style:normal}
  .k{color:#569cd6;font-style:normal}
  .n{color:#b5cea8;font-style:normal}
  .cap{background:#0179cf;color:#fff;font-family:"맑은 고딕";font-size:13px;
       padding:7px 14px}
</style>
<div class="bar">
  <span class="dot" style="background:#ff5f57"></span>
  <span class="dot" style="background:#febc2e"></span>
  <span class="dot" style="background:#28c840"></span>
  <span style="margin-left:10px">${esc(v.file)} — HIENDT-CBT — Visual Studio Code</span>
</div>
<div class="wrap">
  <div class="tree">
    ${v.tree.map(t => `<div class="${t.trim() === v.tab ? "on" : ""}">${esc(t)}</div>`).join("")}
  </div>
  <div class="main">
    <div class="tab"><span>${esc(v.tab)}</span></div>
    <div class="code">
      ${body.map((l, i) => `<div class="ln"><b>${v.from + i}</b><u>${paint(l)}</u></div>`).join("")}
    </div>
  </div>
</div>
<div class="cap">${esc(v.cap)}</div>`;

  const tmp = path.resolve("docs/shots/_code.html");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, html, "utf8");

  const out = path.resolve("docs/shots", v.out);
  try {
    execSync(
      `"${CHROME}" --headless=new --disable-gpu --hide-scrollbars ` +
      `--virtual-time-budget=2500 --window-size=1240,820 ` +
      `--screenshot="${out}" "file:///${tmp.replace(/\\/g, "/")}"`,
      { stdio: "pipe", timeout: 60000 }
    );
  } catch (e) { /* 잡소리 */ }

  fs.unlinkSync(tmp);
  console.log(
    fs.existsSync(out)
      ? `  ○  ${v.out.padEnd(14)} ${(fs.statSync(out).size / 1024).toFixed(0)}KB   ${v.file}`
      : `  ✗  ${v.out}`
  );
}
