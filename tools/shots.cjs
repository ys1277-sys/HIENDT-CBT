/*
 * 발표자료에 넣을 화면 그림을 찍는다.
 *
 *   node tools/shots.cjs          (dev 서버가 떠 있어야 한다)
 *
 * 회사 연말발표 양식은 거의 모든 장에 그림이 하나씩 들어간다. 손으로
 * 그린 흉내가 아니라 실제로 도는 화면을 찍어 넣는다.
 *
 * 헤드리스 크롬의 --screenshot 은 페이지를 열고 바로 찍는다. 화면을
 * 눌러 다음 단계로 넘어간 모습은 못 찍는다. 그래서 미리 눌러 둔 상태를
 * 주소로 열 수 있게 ?shot= 을 붙여 연다 — src/main.jsx 가 이 값을 보고
 * 그 화면부터 그린다.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5173/HIENDT-CBT/";
const OUT = path.resolve(process.argv[2] || "docs/shots");

/* 찍을 화면 — 이름, 주소 뒤에 붙일 것, 창 크기 */
const SHOTS = [
  ["01-home",     "",                              [1440, 900]],
  ["02-quiz",     "?shot=quiz",                    [1440, 900]],
  ["03-calc",     "?shot=calc",                    [1440, 900]],
  ["04-result",   "?shot=result",                  [1440, 980]],
  ["05-admin",    "?shot=admin",                   [1440, 900]],
  ["06-history",  "?preview=history",              [1440, 980]],
  ["07-expiry",   "?preview=expiry",               [1180, 1000]],
  ["08-report",   "?preview=report",               [1180, 1000]],
  ["09-form",     "?preview=form&code=HIE-QP-E02-01", [1180, 1000]],
  ["10-certlog",  "?preview=certlog",              [1180, 1000]],
  ["11-paper",    "?preview=paper",                [1180, 1000]],
  ["12-forms",    "?preview=form",                 [1180, 1000]],
];

fs.mkdirSync(OUT, { recursive: true });

for (const [name, q, [w, h]] of SHOTS) {
  const file = path.join(OUT, name + ".png");
  const url = BASE + q;
  try {
    execSync(
      `"${CHROME}" --headless=new --disable-gpu --hide-scrollbars ` +
      `--virtual-time-budget=6000 --window-size=${w},${h} ` +
      `--screenshot="${file}" "${url}"`,
      { stdio: "pipe", timeout: 60000 }
    );
  } catch (e) { /* 크롬이 종료하며 내는 잡소리는 흘린다 */ }

  const ok = fs.existsSync(file) && fs.statSync(file).size > 4000;
  console.log(
    `  ${ok ? "○" : "✗"}  ${name.padEnd(12)} ` +
    (ok ? `${(fs.statSync(file).size / 1024).toFixed(0)}KB` : "못 찍음") +
    `   ${q || "(첫 화면)"}`
  );
}

console.log("");
console.log(`${OUT} 에 넣었다`);
