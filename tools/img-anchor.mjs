/*
 * 원본별로 "몇 번 문항에 어떤 그림이 걸리는가" 를 뽑는다.
 * 그림이 필요한 문항에 붙일 게 있는지, 앵커가 제대로 잡히는지 확인하는 용도.
 *
 *   node tools/img-anchor.mjs MTG-II(A)
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";

const ROOTS = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const want = process.argv[2];
let log = "";

for (const root of ROOTS) {
  for (const f of walk(root)) {
    const base = path.basename(f);
    if (want && !base.toLowerCase().includes(want.toLowerCase())) continue;

    let r;
    try { r = readHwp(f); } catch (e) { log += `${base}: 읽기 실패 ${e.message}\n`; continue; }

    const qs = parseExam(r.text, r.picAnchors).filter((q) => q.question);
    const withImg = qs.filter((q) => (q.images || []).length);

    log += `\n### ${base}\n`;
    log += `  그림 ${r.images.length}개  앵커 ${r.picAnchors.length}개  binId 오프셋 ${r.binIdOffset}\n`;
    log += `  그림: ` + r.images.map((i) => `${i.id}(${i.kind},${i.data.length}B)`).join(" ") + "\n";
    if (!withImg.length) { log += `  ** 어떤 문항에도 그림이 안 걸림\n`; continue; }
    for (const q of withImg) {
      log += `  Q${q.no} <- binId ${q.images.join(",")}  ${q.question.replace(/\s+/g, " ").slice(0, 62)}\n`;
    }
  }
}

fs.writeFileSync("img-anchor-out.txt", log, "utf8");
console.log(log);
