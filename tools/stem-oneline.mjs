/*
 * 발문의 영문과 한글이 한 줄에 붙어 있는 문항을 찾는다. (규칙 11)
 *
 *   "What is used to ...? TOFD를 수행할 때, ...?"
 *
 * 이러면 화면에서도 인쇄물에서도 번역이 영문 바로 뒤에 이어져 나온다.
 * 한글은 다음 줄로 내려가야 한다.
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;

/*
 * 한 줄에 영문과 한글이 같이 있을 때 어디서 끊을지 찾는다.
 *
 * 영문 문장이 끝나는 자리(? . :) 바로 뒤에 한글이 오는 지점을 쓴다.
 * 그런 자리가 없으면 손대지 않는다 — "ASME Sec.V 에 따르면" 처럼
 * 한 문장 안에 영문 용어가 섞인 것을 잘못 자를 수 있다.
 */
function splitPoint(line) {
  /* 한글이 처음 나오는 자리에서 거꾸로 올라가며 문장 끝 부호를 찾는다.
     "A-scan 표시로부터" 처럼 한글 앞에 영문 용어가 붙어 있어도 잡힌다. */
  const firstKo = line.search(HANGUL);
  if (firstKo < 0) return -1;

  const head0 = line.slice(0, firstKo);
  const m = [...head0.matchAll(/[?.:)]\s+/g)].pop();
  if (!m) return -1;

  const at = m.index + m[0].length;
  const head = line.slice(0, at);
  const tail = line.slice(at);

  /* 앞쪽에 영어 낱말이 충분해야 하고 */
  if ((head.match(/[A-Za-z]{2,}/g) || []).length < 3) return -1;

  /*
   * 뒤쪽은 곧 한글이 나와야 한다.
   * "Sec. Ⅷ Div.1&2 describes ... 시험편은" 처럼 약어의 마침표에서 잘리면
   * 뒤쪽이 한참 영문이라 여기서 걸러진다.
   */
  if (tail.search(HANGUL) > 30) return -1;

  return at;
}

let hits = [], skipped = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const lines = String(q.question).split("\n");
    const first = lines[0];
    if (!HANGUL.test(first)) continue;
    if ((first.match(/[A-Za-z]{2,}/g) || []).length < 3) continue;

    const at = splitPoint(first);
    if (at < 0) { skipped.push(`${rel} id ${q.id}: ${first.slice(0, 96)}`); continue; }

    const en = first.slice(0, at).trim();
    const ko = first.slice(at).trim();
    hits.push(`${rel} id ${q.id}\n   en: ${en.slice(0, 100)}\n   ko: ${ko.slice(0, 100)}`);

    lines[0] = `${en}\n${ko}`;
    q.question = lines.join("\n");
    touched = true;
  }
  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

let log = `한 줄에 붙어 있던 발문 ${hits.length}건\n\n` + hits.join("\n") + "\n";
log += `\n끊을 자리를 못 찾아 그대로 둔 것 ${skipped.length}건\n` + skipped.map((s) => "  " + s).join("\n") + "\n";
log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";

fs.writeFileSync("stem-oneline-out.txt", log, "utf8");
console.log(`한 줄 붙음 ${hits.length}건 / 판단 보류 ${skipped.length}건 -> stem-oneline-out.txt`);
