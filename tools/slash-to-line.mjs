/*
 * "영문 / 한글" 처럼 한 줄에 슬래시로 붙여 놓은 선택지를 두 줄로 나눈다. (규칙 11)
 *
 * 복구·변환하면서 만든 문항 일부가 줄바꿈 대신 " / " 를 썼다.
 * 다른 문항은 모두 "영문\n한글" 이라 표시가 들쭉날쭉하다.
 *
 * "MS-5800-R / Multi-View" 처럼 양쪽이 다 영문인 것은 건드리지 않는다.
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

let n = 0, log = "";
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    if (!Array.isArray(q.options)) continue;
    q.options = q.options.map((o, i) => {
      const s = String(o);
      if (s.includes("\n")) return o;                 // 이미 줄이 나뉘어 있음

      const at = s.indexOf(" / ");
      if (at < 0) return o;

      const left = s.slice(0, at).trim();
      const right = s.slice(at + 3).trim();
      if (!left || !right) return o;

      /* 한쪽만 한글이어야 "영문 / 한글" 짝이다 */
      const lk = HANGUL.test(left), rk = HANGUL.test(right);
      if (lk === rk) return o;

      const en = lk ? right : left;
      const ko = lk ? left : right;
      log += `${rel} id ${q.id} 선택지${i + 1}\n   ${en}\n   ${ko}\n`;
      n++; touched = true;
      return `${en}\n${ko}`;
    });
  }
  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

log = `슬래시를 줄바꿈으로 바꾼 선택지 ${n}건\n\n` + log;
log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";
fs.writeFileSync("slash-to-line-out.txt", log, "utf8");
console.log(log.slice(0, 4000));
