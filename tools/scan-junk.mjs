/*
 * 파싱이 무너진 문항을 찾는다.
 *   A. 선택지가 비정상적으로 긴 것  (뒤 문항이나 답지가 통째로 흡수됨)
 *   B. 본문이 비정상적으로 짧은 것  (본문이 날아가고 껍데기만 남음)
 *   C. 선택지 안에 "다음 문항 번호" 나 "해답" 표가 들어간 것
 *   D. 완전히 같은 문항이 한 파일에 두 번 들어간 것
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

const JUNK = /해\s*답|ANSWER\s*SHEET|SPECIFIC\s*\(|GENERAL\s*\(|^\s*\d{1,2}\.\s+[A-Z].{40,}\?/im;
/* 로마숫자는 남긴다 — "(Ⅰ)" 과 "(Ⅱ)" 는 서로 다른 문항이다 */
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9가-힣ⅰ-ⅹⅠ-Ⅹ]+/g, "");

let A = [], B = [], C = [], D = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  const seen = new Map();
  for (const q of items) {
    const en = String(q.question).split("\n")[0].trim();
    const opts = (q.options || []).map(String);

    const longest = Math.max(0, ...opts.map((o) => o.length));
    if (longest > 260) A.push(`${rel} id ${q.id}  최장 선택지 ${longest}자`);
    if (en.replace(/[^\w가-힣]/g, "").length < 12) B.push(`${rel} id ${q.id}  본문 "${en}"`);
    if (opts.some((o) => JUNK.test(o))) C.push(`${rel} id ${q.id}`);

    const k = norm(en) + "|" + opts.map(norm).join("|");
    if (en && seen.has(k)) D.push(`${rel} id ${seen.get(k)} 와 id ${q.id} 가 동일`);
    else seen.set(k, q.id);
  }
}

let log = "";
log += `A. 선택지가 비정상적으로 긴 것   ${A.length}건\n` + A.map((s) => "   " + s).join("\n") + "\n\n";
log += `B. 본문이 날아간 것             ${B.length}건\n` + B.map((s) => "   " + s).join("\n") + "\n\n";
log += `C. 선택지에 답지/후속문항 혼입   ${C.length}건\n` + C.map((s) => "   " + s).join("\n") + "\n\n";
log += `D. 같은 파일 내 중복             ${D.length}건\n` + D.map((s) => "   " + s).join("\n") + "\n";

fs.writeFileSync("scan-junk-out.txt", log, "utf8");
console.log(log);
