/*
 * 원본 시험지에서 한 문항을 찾아 보기까지 그대로 보여 준다.
 *
 *   node tools/find-opt.mjs "찾을 말" <hwp> [<hwp> …]
 */
import { readHwp } from "./hwplib.mjs";

const needle = process.argv[2];
const files = process.argv.slice(3);

for (const f of files) {
  let text;
  try {
    const r = readHwp(f);
    text = Array.isArray(r) ? r : (r.lines || r.text || r);
  } catch (e) {
    console.log(f + "  읽기 실패 : " + e.message);
    continue;
  }

  const lines = Array.isArray(text) ? text.map(String) : String(text).split(/\r?\n/);
  const i = lines.findIndex(t => t.toLowerCase().includes(needle.toLowerCase()));

  console.log("══ " + f.split(/[\/]/).pop() + " ══");
  if (i < 0) { console.log("   못 찾음"); continue; }

  lines.slice(i, i + 9).forEach(t => {
    const s = String(t).trim();
    if (s) console.log("   " + s.slice(0, 110));
  });
  console.log("");
}
