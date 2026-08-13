/*
 * 한글 번역이 영문과 어긋나는 곳을 찾는다. (규칙 3)
 *
 * 오역을 기계로 다 잡을 수는 없다. 대신 "뜻이 뒤집히는" 세 가지만 본다.
 *
 *   1) 부정어 불일치 — 영문에 not/never 가 있는데 한글에 없거나 그 반대
 *   2) 수치 불일치   — 영문에 나온 숫자가 한글에 없거나 다른 숫자가 있음
 *   3) 증감 방향 불일치 — increase/decrease 와 증가/감소 가 어긋남
 *
 * 문항 본문과 선택지를 모두 본다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;

/* 영문과 한글을 나눈다 — 한글이 처음 나오는 줄부터가 번역 */
function split(s) {
  const lines = String(s).split("\n").map((l) => l.trim()).filter(Boolean);
  const at = lines.findIndex((l) => HANGUL.test(l));
  if (at <= 0) return null;
  return { en: lines.slice(0, at).join(" "), ko: lines.slice(at).join(" ") };
}

const EN_NEG = new RegExp(
  [
    "\\b(not|never|cannot|can't|don't|doesn't|won't|without|neither|nor|none|nothing|no)\\b",
    "\\b(except|exclude[sd]?|excluding|free of|absence|fail(s|ed|ure)?|prohibit(ed|s)?|forbidden)\\b",
    "\\bun(acceptable|desirable|necessary|likely|able|even|suitable)\\b",
    "\\bin(correct|adequate|complete|sufficient|accurate|valid)\\b",
    "\\bnon-?\\w+",
    "\\b(rejectable|reject(s|ed)?|unacceptable)\\b",
    "\\w+less\\b",
    "\\bir(relevant|regular)\\w*",
  ].join("|"),
  "i"
);
const KO_NEG =
  /않|없|아니|못하|못한|못할|불합격|불가|비관련|제외|아닌|말아|틀린|틀리|거짓|금지|실패|배제|부족|미달|불량|부적/;

const EN_UP = /\b(increase[sd]?|increasing|higher|greater|larger|longer|more|maximum|rise[sd]?)\b/i;
const EN_DN = /\b(decrease[sd]?|decreasing|lower|smaller|shorter|less|fewer|minimum|reduce[sd]?|reducing)\b/i;
const KO_UP = /증가|커진|크게|높아|높은|최대|길어|많아|늘어|상승/;
const KO_DN = /감소|작아|작게|낮아|낮은|최소|짧아|적어|줄어|하강/;

const nums = (s) =>
  (s.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g) || [])
    .map((n) => n.replace(/\s+/g, ""))
    .filter((n) => n !== "1" && n !== "2" && n !== "3" && n !== "4");

let neg = [], dir = [], num = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  const check = (where, s) => {
    const p = split(s);
    if (!p || p.en.length < 12) return;

    const eN = EN_NEG.test(p.en), kN = KO_NEG.test(p.ko);
    if (eN !== kN) neg.push(`${rel} ${where}\n   en: ${p.en.slice(0, 108)}\n   ko: ${p.ko.slice(0, 108)}`);

    const eU = EN_UP.test(p.en), eD = EN_DN.test(p.en);
    const kU = KO_UP.test(p.ko), kD = KO_DN.test(p.ko);
    if ((eU && !eD && kD && !kU) || (eD && !eU && kU && !kD))
      dir.push(`${rel} ${where}\n   en: ${p.en.slice(0, 108)}\n   ko: ${p.ko.slice(0, 108)}`);

    const eNums = nums(p.en), kNums = nums(p.ko);
    const missing = eNums.filter((n) => !kNums.includes(n));
    if (eNums.length && missing.length === eNums.length && kNums.length)
      num.push(`${rel} ${where}  영문 ${eNums.join(",")} / 한글 ${kNums.join(",")}\n   en: ${p.en.slice(0, 96)}\n   ko: ${p.ko.slice(0, 96)}`);
  };

  /*
   * 발문만 본다. 그것도 "not / except / is wrong" 처럼 발문 자체가 부정형인 것만.
   * 여기서 한글이 긍정형이면 응시자가 정반대 보기를 고르게 되므로 치명적이다.
   * 선택지까지 넣으면 "lack of fusion / 융합불량" 같은 게 쏟아져 쓸모가 없다.
   */
  const STEM_NEG =
    /\b(is|are|would be)\s+not\b|\bnot\s+(a|an|be|considered|true|correct|recommended|required|acceptable|used|include|likely)\b|\bwhich\s+.{0,24}\bnot\b|\bexcept\b|\bwrong\b|\bincorrect\b|\bfalse\b|\bmay not\b|\bcannot\b/i;
  const KO_STEM_NEG = /않|아닌|아니|틀린|틀리|없는|없다|못|거짓|제외|불가|힘든|말라|말아/;

  for (const q of items) {
    const p = split(q.question);
    if (!p || !STEM_NEG.test(p.en) || KO_STEM_NEG.test(p.ko)) continue;
    neg.push(`${rel} id ${q.id}\n   en: ${p.en.slice(0, 118)}\n   ko: ${p.ko.slice(0, 118)}`);
  }
}

let log = "";
log += `1. 부정어 불일치   ${neg.length}건\n\n` + neg.join("\n") + "\n\n";
log += `2. 증감 방향 불일치 ${dir.length}건\n\n` + dir.join("\n") + "\n\n";
log += `3. 수치 불일치     ${num.length}건\n\n` + num.join("\n") + "\n";

fs.writeFileSync("ko-mismatch-out.txt", log, "utf8");
console.log(`부정어 ${neg.length} / 증감 ${dir.length} / 수치 ${num.length}  -> ko-mismatch-out.txt`);
