/*
 * 한 문항 안에서 보기마다 언어 구성이 다른 것을 찾는다. (규칙 11)
 *
 *   ① 시험편 양쪽에서 접근 가능한 경우 ...        <- 한글만
 *   ③ No qualification block is needed ...
 *      장비가 정확히 교정되어 있으면 ...           <- 영문+한글
 *
 * 응시자 눈에는 보기마다 형식이 달라 보인다.
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
const LATIN = /[A-Za-z]{3,}/;

/* 보기 하나의 구성: both / ko / en / plain(숫자·기호) */
function shape(o) {
  const t = String(o).trim();
  const ko = HANGUL.test(t);
  const en = LATIN.test(t);
  if (ko && en) return "both";
  if (ko) return "ko";
  if (en) return "en";
  return "plain";
}

let hits = [];
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const opts = q.options || [];
    if (opts.length < 2) continue;

    const shapes = opts.map(shape).filter((s) => s !== "plain");
    const kinds = new Set(shapes);
    /* both 와 ko 가 섞여 있으면 형식이 어긋난 것 */
    if (!(kinds.has("both") && (kinds.has("ko") || kinds.has("en")))) continue;

    hits.push(
      `${rel} id ${q.id}  정답 ${Array.isArray(q.answer) ? q.answer.map(n => n + 1).join(",") : q.answer + 1}번\n` +
      opts.map((o, i) => `   ${i + 1}[${shape(o)}] ${String(o).replace(/\n/g, " / ").slice(0, 88)}`).join("\n")
    );
  }
}

const log = `보기마다 언어 구성이 다른 문항 ${hits.length}건\n\n` + hits.join("\n\n") + "\n";
fs.writeFileSync("opt-mixed-out.txt", log, "utf8");
console.log(`${hits.length}건 -> opt-mixed-out.txt`);
