/*
 * 그림 레코드에서 BinData 번호가 실제로 몇 번째 바이트에 들어 있는지 살펴본다.
 *
 * hwplib 은 오프셋 71 을 쓰는데, 그 값으로 읽으면 어떤 원본에서는 모든
 * 레코드가 같은 번호(머리말 로고)로 읽힌다. 오프셋을 훑어 보면서
 * "유효한 번호가 나오면서 서로 다른 값이 섞여 나오는" 자리를 찾는다.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import cfb from "cfb";
import { inflate, magic } from "./hwplib.mjs";

const F = process.argv[2] || "D:/Visual Studio Code/Level II 문제/Genernal(40문항)/MTG-II(A).hwp";

const doc = cfb.read(fs.readFileSync(F), { type: "buffer" });
const paths = doc.FullPaths;

/* BinData 목록 */
const images = [];
doc.FileIndex.forEach((e, i) => {
  const full = paths[i] || "";
  if (!/\/BinData\/BIN\w+/i.test(full) || !e.content || !e.content.length) return;
  const stem = path.basename(full).replace(/\.[^.]+$/, "");
  const binId = parseInt(stem.replace(/^BIN/i, ""), 16);
  const data = inflate(Buffer.from(e.content));
  images.push({ stem, binId, kind: magic(data), size: data.length });
});
const valid = new Set(images.map((i) => i.binId));

/* BodyText 에서 그림 레코드(HWPTAG_SHAPE_COMPONENT_PICTURE = 85) 모으기 */
const PIC = 85;
const recs = [];
doc.FileIndex.forEach((e, i) => {
  const full = paths[i] || "";
  if (!/BodyText\/Section/i.test(full) || !e.content) return;
  let buf;
  try { buf = zlib.inflateRawSync(Buffer.from(e.content)); }
  catch { buf = Buffer.from(e.content); }

  let p = 0;
  while (p + 4 <= buf.length) {
    const h = buf.readUInt32LE(p);
    const tag = h & 0x3ff;
    let size = (h >> 20) & 0xfff;
    p += 4;
    if (size === 0xfff) { size = buf.readUInt32LE(p); p += 4; }
    if (tag === PIC) recs.push(buf.slice(p, p + size));
    p += size;
  }
});

let log = `${path.basename(F)}\n`;
log += `BinData: ${images.map((i) => `${i.stem}=${i.binId}(${i.kind},${i.size}B)`).join(" ")}\n`;
log += `그림 레코드 ${recs.length}개\n\n`;

log += "오프셋  읽힌 값들 (유효한 것만)\n" + "-".repeat(60) + "\n";
for (let off = 56; off <= 96; off += 1) {
  const vals = recs.map((r) => (off + 2 <= r.length ? r.readUInt16LE(off) : null));
  if (vals.some((v) => v === null)) continue;
  const allValid = vals.every((v) => valid.has(v));
  if (!allValid) continue;
  const uniq = [...new Set(vals)];
  log += `${String(off).padStart(4)}    ${vals.join(",")}   서로 다른 값 ${uniq.length}종\n`;
}

fs.writeFileSync("offset-probe-out.txt", log, "utf8");
console.log(log);
