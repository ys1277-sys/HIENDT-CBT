/*
 * 채점 검증
 *
 * 은행의 모든 문항에 대해
 *   1) 정답을 그대로 넣으면 맞다고 나오는가
 *   2) 정답이 아닌 답을 넣으면 틀리다고 나오는가
 *   3) 빈 답이 맞다고 나오지는 않는가
 * 를 확인한다.  UI 를 거치지 않고 src/grading.js 를 그대로 불러 쓴다.
 */
import fs from "node:fs";
import path from "node:path";
import { questionType, isCorrect, SINGLE, MULTI, TEXT } from "../src/grading.js";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

let total = 0, fail = [];
const byType = { [SINGLE]: 0, [MULTI]: 0, [TEXT]: 0 };

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    total++;
    const t = questionType(q);
    byType[t]++;

    /* 1) 정답을 넣으면 맞아야 한다 */
    const right = Array.isArray(q.answer) ? [...q.answer] : q.answer;
    if (!isCorrect(q, right)) fail.push(`${rel} id ${q.id} [${t}]: 정답을 넣었는데 틀렸다고 나옴`);

    /* 2) 정답이 아닌 답은 틀려야 한다 */
    if (t === SINGLE) {
      const wrong = (q.answer + 1) % q.options.length;
      if (isCorrect(q, wrong)) fail.push(`${rel} id ${q.id} [${t}]: 오답 ${wrong} 을 맞다고 함`);
    } else if (t === MULTI) {
      const wrong = q.answer.slice(0, Math.max(0, q.answer.length - 1));
      if (isCorrect(q, wrong)) fail.push(`${rel} id ${q.id} [${t}]: 일부만 골랐는데 맞다고 함`);
      const extra = [...q.answer, (Math.max(...q.answer) + 1) % q.options.length];
      if (new Set(extra).size !== q.answer.length && isCorrect(q, extra))
        fail.push(`${rel} id ${q.id} [${t}]: 더 골랐는데 맞다고 함`);
    }

    /* 3) 빈 답이 맞으면 안 된다 */
    for (const blank of [undefined, null, "", []]) {
      if (isCorrect(q, blank)) fail.push(`${rel} id ${q.id} [${t}]: 빈 답 ${JSON.stringify(blank)} 을 맞다고 함`);
    }
  }
}

let log = `문항 ${total}개 검사\n`;
log += `  단일선택 ${byType[SINGLE]} / 복수선택 ${byType[MULTI]} / 주관식 ${byType[TEXT]}\n\n`;
log += fail.length ? `실패 ${fail.length}건\n` + fail.map((s) => "  " + s).join("\n") + "\n"
                   : "실패 없음 — 채점 정상\n";

fs.writeFileSync("grading-test-out.txt", log, "utf8");
console.log(log.slice(0, 5000));
