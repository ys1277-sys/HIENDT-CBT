import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";

const SRC = ["D:/Visual Studio Code/원본자료/Level II 문제", "D:/Visual Studio Code/원본자료/Level III 문제"];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

let out = "파일".padEnd(46) + "문항  선다  한글  그림  앵커  off  비고\n" + "-".repeat(104) + "\n";
const totals = { q: 0, opt: 0, img: 0, files: 0, noOff: 0 };

for (const root of SRC) {
  for (const f of walk(root)) {
    const short = path.relative("D:/Visual Studio Code", f).replace(/\\/g, "/")
      .replace("Level II 문제/", "II/").replace("Level III 문제/", "III/").replace(/\.hwp$/i, "");
    let line, note = "";
    try {
      const { text, images, picAnchors, binIdOffset, picCount } = readHwp(f);
      const qs = parseExam(text, picAnchors);
      const withOpt = qs.filter((q) => q.options?.length >= 2).length;
      const withKo = qs.filter((q) => q.korean).length;
      const qImg = qs.filter((q) => q.images.length).length;

      if (picCount && binIdOffset === null) { note = "!! binId 오프셋 탐지 실패"; totals.noOff++; }
      else if (qs.length === 0) note = "!! 문항 인식 실패";
      else if (withOpt === 0) note = "서술형(선택지 없음)";
      else if (withOpt < qs.length) note = `선택지없는문항 ${qs.length - withOpt}개`;

      totals.q += qs.length; totals.opt += withOpt; totals.img += images.length; totals.files++;
      line = short.slice(0, 45).padEnd(46) +
        String(qs.length).padStart(4) + String(withOpt).padStart(6) + String(withKo).padStart(6) +
        String(images.length).padStart(6) + String(qImg).padStart(6) +
        String(binIdOffset ?? "-").padStart(5) + "  " + note;
    } catch (e) {
      line = short.slice(0, 45).padEnd(46) + "  ERR " + e.message;
    }
    out += line + "\n";
  }
}

out += "-".repeat(104) + `\n합계: ${totals.files}개 파일 · 문항 ${totals.q} · 선택지있음 ${totals.opt} · 이미지 ${totals.img} · 오프셋실패 ${totals.noOff}\n`;
fs.writeFileSync("report-out.txt", out, "utf8");
console.log("ok");
