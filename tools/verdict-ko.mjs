/*
 * 「Yes」 「Accept」 처럼 우리말이 없는 판정 보기에 우리말을 붙인다.
 *
 *   node tools/verdict-ko.mjs          무엇이 바뀌는지 보여만 준다
 *   node tools/verdict-ko.mjs --써라    실제로 고친다
 *
 * Level Ⅲ 은행 세 편은 합격·불합격 보기를 영문으로만 두었다. 4지선다로
 * 맞추며 채운 3·4번 보기에는 우리말이 붙어 있어, 한 문항 안에서 앞 둘은
 * 영문뿐이고 뒤 둘은 영문·우리말인 꼴이 되었다.
 *
 * 판정을 나타내는 말이라 옮길 말이 정해져 있다. 뜻이 달라질 여지가 없다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/* 영문 그대로 → 붙일 우리말 */
const KO = {
  "yes": "합격",
  "no": "불합격",
  "accept": "합격",
  "reject": "불합격",
  "acceptable": "합격",
  "unacceptable": "불합격",
  "true": "맞다",
  "false": "틀리다",
};

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

let n = 0;
const shown = new Set();

for (const file of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const bank = path.relative(ROOT, file).split(path.sep).join("/").replace(".json", "");
  let touched = false;

  for (const q of items) {
    if (!Array.isArray(q.options)) continue;

    q.options = q.options.map((o) => {
      const s = String(o);
      if (/[가-힣]/.test(s)) return o;

      const ko = KO[s.trim().toLowerCase().replace(/[.\s]+$/, "")];
      if (!ko) return o;

      n++;
      touched = true;
      const line = `${bank}  「${s.trim()}」 → 「${s.trim()} / ${ko}」`;
      if (!shown.has(line)) { console.log("   " + line); shown.add(line); }
      return `${s.trim()}\n${ko}`;
    });
  }

  if (touched && write) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log(`\n우리말을 붙인 보기 ${n}개`);
if (!write) console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
else console.log("썼다.");
