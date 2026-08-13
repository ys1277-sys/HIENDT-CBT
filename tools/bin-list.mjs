/*
 * 원본 HWP 안에 박혀 있는 그림(BinData) 목록을 뽑는다.
 * 그림이 필요한 문항에 붙일 게 실제로 있는지 확인하는 용도.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import cfb from "cfb";

const ROOTS = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

/* 앞 몇 바이트로 형식을 알아본다 */
function kind(buf) {
  if (buf[0] === 0x42 && buf[1] === 0x4d) return "BMP";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "PNG";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "JPG";
  if (buf[0] === 0x0a) return "PCX";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "GIF";
  return `?${buf[0].toString(16)}${buf[1].toString(16)}`;
}

let log = "파일".padEnd(52) + "그림 수  형식\n" + "-".repeat(80) + "\n";
let grand = 0;

for (const root of ROOTS) {
  for (const f of walk(root)) {
    let doc;
    try { doc = cfb.read(fs.readFileSync(f), { type: "buffer" }); } catch { continue; }

    const bins = doc.FileIndex.filter((e) => {
      const p = doc.FullPaths[doc.FileIndex.indexOf(e)] || "";
      return /BinData/i.test(p) && e.content && e.content.length;
    });
    if (!bins.length) continue;

    const kinds = {};
    for (const e of bins) {
      const raw = Buffer.from(e.content);
      let buf = raw;
      /* BinData 는 보통 raw deflate 로 눌려 있다 */
      try { buf = zlib.inflateRawSync(raw); } catch {
        try { buf = zlib.inflateSync(raw); } catch { /* 그대로 */ }
      }
      if (buf.length < 4) continue;
      const k = kind(buf);
      kinds[k] = (kinds[k] || 0) + 1;
    }
    grand += bins.length;
    log += `${path.basename(f).padEnd(52)}${String(bins.length).padStart(5)}   `
      + Object.entries(kinds).map(([k, n]) => `${k}×${n}`).join(" ") + "\n";
  }
}

log += "-".repeat(80) + `\n원본에 박혀 있는 그림 합계 ${grand}개\n`;
fs.writeFileSync("bin-list-out.txt", log, "utf8");
console.log(log);
