/*
 * 규칙 5로 선택지를 1.2.3.4 로 바꿨는데, 선택지 본문이 아직 a)/b)/B/C 를
 * 가리키는 것이 남아 있는지 찾는다.  ("Both a) and b)", "a mixture of B and C")
 * 이런 건 응시자가 어느 보기를 말하는지 알 수 없다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const REF = [
  /\b(answers?|both|either)\s+[a-e]\s*\)/i,
  /\b[a-e]\s*\)\s*(and|or)\s+[a-e]\s*\)/i,
  /\b(mixture|combination)\s+of\s+[A-E]\s+(and|or)\s+[A-E]\b/i,
  /\b(both|either)\s+[A-E]\s+(and|or)\s+[A-E]\b/,
  /\banswers?\s+[A-E]\s+(and|or)\s+[A-E]\b/i,
];

let n = 0, log = "";
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    (q.options || []).forEach((o, i) => {
      const s = String(o);
      if (!REF.some((re) => re.test(s))) return;
      n++;
      log += `${rel} id ${q.id} 선택지 ${i + 1}${i === q.answer ? " (정답)" : ""}: ${s.replace(/\s+/g, " ").slice(0, 100)}\n`;
    });
  }
}
log = `보기 문자를 가리키는 선택지 ${n}건\n\n` + log;
fs.writeFileSync("stale-refs-out.txt", log, "utf8");
console.log(log);
