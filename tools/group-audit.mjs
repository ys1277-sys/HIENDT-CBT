/*
 * 원본 시험지의 "조건문(group instruction)" 이 JSON 문항에 제대로 붙었는지 감사한다.
 *
 * 원본에서 조건문은 이런 꼴로 나온다.
 *   "The next 3 questions apply to this situation."
 *   "* The next 4 questions apply to ASME Section Ⅷ Div. 2"
 *   "Questions 46 through 65 relating to ..."
 *
 * 규칙 12: 조건문은 그 묶음의 모든 문항에 표시돼야 한다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

/* 본문 안에 조건문 문구가 그대로 섞여 있는 경우 = 분리 실패 */
const LEAK = /(\*?\s*(The\s+next|Next)\s+\w+\s+questions?\b)|(Questions?\s+\d+\s+(through|to)\s+\d+)|(apply\s+to\s+this\s+situation)|(situation\s+described\s+in\s+question\s+\d+)|(For\s+the\s+situation\s+described)/i;

let withNote = 0, total = 0;
const leaks = [], refs = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    total++;
    if (q.groupNote) withNote++;

    const t = String(q.question || "");
    if (LEAK.test(t)) {
      const hit = t.match(LEAK)[0].replace(/\s+/g, " ");
      leaks.push(`${rel} id ${q.id}  groupNote=${q.groupNote ? "있음" : "없음"}\n     [${hit}]  ${t.replace(/\s+/g, " ").slice(0, 130)}`);
    }
    /* 사라진 번호를 참조하는 문항 */
    if (/question\s+\d+/i.test(t)) refs.push(`${rel} id ${q.id}: ${t.replace(/\s+/g, " ").slice(0, 130)}`);
  }
}

let log = `전체 ${total}문항 중 groupNote 있는 것 ${withNote}건\n`;
log += `\n조건문이 본문에 섞였거나 묶음이 안 잡힌 문항 ${leaks.length}건\n` + leaks.map((s) => "  - " + s).join("\n") + "\n";
log += `\n없어진 문항 번호를 참조하는 문항 ${refs.length}건\n` + refs.map((s) => "  - " + s).join("\n") + "\n";

fs.writeFileSync("group-audit-out.txt", log, "utf8");
console.log(log);
