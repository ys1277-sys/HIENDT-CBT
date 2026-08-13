/*
 * 원본 HWP 에 박힌 그림을 전부 꺼내 PNG/JPG 로 저장한다.
 * 앵커 위치를 못 믿을 때 사람이 직접 보고 문항에 붙이기 위한 도구.
 *
 *   node tools/img-dump.mjs <파일이름조각> <출력폴더>
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";
import { toWebImage } from "./img.mjs";

const ROOTS = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const want = process.argv[2];
const outDir = process.argv[3] || "imgdump";
if (!want) { console.log("사용법: node tools/img-dump.mjs <파일이름조각> [출력폴더]"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

let log = "";
for (const root of ROOTS) {
  for (const f of walk(root)) {
    const base = path.basename(f, path.extname(f));
    if (!base.toLowerCase().includes(want.toLowerCase())) continue;

    const { images } = readHwp(f);
    log += `\n### ${base}  그림 ${images.length}개\n`;
    for (const im of images) {
      const stem = `${base.replace(/[^\w가-힣.-]+/g, "_")}_${im.id}`;
      let web;
      try { web = toWebImage(im.data, im.kind); }
      catch (e) { log += `   ${im.id}: 변환 실패 ${e.message}\n`; continue; }
      if (!web) { log += `   ${im.id}: 변환 불가 (${im.kind})\n`; continue; }

      const name = `${stem}.${web.ext}`;
      fs.writeFileSync(path.join(outDir, name), web.data);
      log += `   ${name}  (원본 ${im.kind}, ${im.data.length}B -> ${web.data.length}B)\n`;
    }
  }
}
console.log(log || `"${want}" 에 맞는 파일 없음`);
