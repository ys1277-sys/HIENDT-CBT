/*
 * 은행의 정답을 원본 시험지의 정답표와 맞대 본다.
 *
 * 번호로 짝지으면 안 된다. 은행 번호가 원본과 어긋나 있을 수 있다.
 * 문제 글로 짝짓고, 정답으로 고른 보기의 글이 원본 정답표가 가리키는
 * 보기와 같은지 본다. 보기 차례가 섞여 있어도 이렇게 하면 옳게 나온다.
 *
 * 쓰임 : node tools/answerkey-check.mjs <은행.json> <원본.hwp> "D C B D …"
 */
import fs from "node:fs";
import { parsePaper } from "./parse-paper.mjs";

const [bankPath, paperPath, keyStr] = process.argv.slice(2);
if (!bankPath || !paperPath || !keyStr) {
  console.error('쓰임 : node tools/answerkey-check.mjs <은행.json> <원본.hwp> "D C B …"');
  process.exit(1);
}

const KEY = keyStr.trim().split(/\s+/);
const L = "ABCDE";
/*
 * 원본은 보기를 a·b·c·d 로 부르고 화면은 ①②③④ 로 부른다. 그래서
 * 「Both a) and b)」가 은행에서는 「Both 1 and 2」로 적혀 있다. 같은
 * 뜻이므로 견주기 전에 한 꼴로 맞춘다.
 */
const k = (s) =>
  String(s).split("\n")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
    .replace(/aandb/g, "1and2").replace(/aorb/g, "1or2")
    .replace(/bandc/g, "2and3").replace(/borc/g, "2or3");

const paper = parsePaper(paperPath);
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

console.log("원본 " + paper.length + "문항 / 은행 " + bank.length + "문항 / 정답표 " + KEY.length + "개\n");

let ok = 0; const ng = [], noPair = [];
const used = new Set();

for (const q of bank) {
  const kq = k(q.question);
  const a = paper.find((x) => k(x.en) === kq) ||
            paper.find((x) => !used.has(x.n) && (k(x.en).startsWith(kq.slice(0, 60)) || kq.startsWith(k(x.en).slice(0, 60))));
  if (!a) { noPair.push(q.id); continue; }
  used.add(a.n);

  const idx = Array.isArray(q.answer) ? q.answer[0] : q.answer;
  const txt = k(q.options[idx]);
  let pos = a.opts.findIndex((o) => k(o.en) === txt);
  if (pos < 0) pos = a.opts.findIndex((o) => k(o.en).slice(0, 20) === txt.slice(0, 20));
  if (pos < 0) { ng.push([q, a, "정답 보기를 원본에서 못 찾음"]); continue; }

  if (L[pos] === KEY[a.n - 1]) ok++;
  else ng.push([q, a, "원본 " + KEY[a.n - 1] + " → 은행 " + L[pos]]);
}

console.log("맞는 것 " + ok + " / 살펴볼 것 " + ng.length +
  (noPair.length ? " / 원본에서 못 찾은 은행 문항 " + noPair.join(",") : ""));
const left = paper.filter((x) => !used.has(x.n)).map((x) => x.n);
if (left.length) console.log("은행에 없는 원본 번호 : " + left.join(","));

for (const [q, a, why] of ng) {
  console.log("\n  은행 id" + q.id + " = 원본 " + a.n + "번   " + why);
  console.log("     " + a.en.slice(0, 84));
  a.opts.forEach((o, i) => console.log("      " + (L[i] === KEY[a.n - 1] ? "원본▶" : "     ") + L[i] + ". " + o.en.slice(0, 62)));
  console.log("      은행 정답 : " + String(q.options[Array.isArray(q.answer) ? q.answer[0] : q.answer]).split("\n")[0].slice(0, 62));
}
