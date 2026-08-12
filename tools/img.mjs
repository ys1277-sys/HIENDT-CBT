/*
 * BMP / PCX -> PNG 변환 (외부 도구 없이 Node 내장 zlib 만 사용)
 * HWP 에 박혀 있는 도해가 대부분 BMP 나 PCX 라서 필요하다.
 */
import zlib from "node:zlib";

/* ---------------- PNG 인코더 ---------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** rgb: width*height*3 바이트 */
export function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type: truecolor
  ihdr[10] = 0;  // deflate
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // no interlace

  // 각 스캔라인 앞에 필터 바이트(0) 를 붙인다
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------------- BMP 디코더 ---------------- */

export function bmpToRgb(b) {
  if (b.length < 54 || b[0] !== 0x42 || b[1] !== 0x4d) throw new Error("BMP 아님");

  const offBits = b.readUInt32LE(10);
  const dibSize = b.readUInt32LE(14);
  const width = b.readInt32LE(18);
  let height = b.readInt32LE(22);
  const bpp = b.readUInt16LE(28);
  const compression = b.readUInt32LE(30);

  if (compression !== 0) throw new Error(`BMP 압축(${compression}) 미지원`);

  const bottomUp = height > 0;
  height = Math.abs(height);

  // 팔레트
  let palette = null;
  if (bpp <= 8) {
    let n = b.readUInt32LE(46) || 1 << bpp;
    const start = 14 + dibSize;
    palette = [];
    for (let i = 0; i < n; i++) {
      const o = start + i * 4;
      palette.push([b[o + 2], b[o + 1], b[o]]); // BGRA -> RGB
    }
  }

  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const out = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const srcY = bottomUp ? height - 1 - y : y;
    const row = offBits + srcY * rowSize;

    for (let x = 0; x < width; x++) {
      let r, g, bl;

      if (bpp === 24 || bpp === 32) {
        const o = row + x * (bpp / 8);
        bl = b[o]; g = b[o + 1]; r = b[o + 2];
      } else if (bpp === 8) {
        const p = palette[b[row + x]] || [0, 0, 0];
        [r, g, bl] = p;
      } else if (bpp === 4) {
        const byte = b[row + (x >> 1)];
        const idx = x & 1 ? byte & 0x0f : byte >> 4;
        [r, g, bl] = palette[idx] || [0, 0, 0];
      } else if (bpp === 1) {
        const byte = b[row + (x >> 3)];
        const idx = (byte >> (7 - (x & 7))) & 1;
        [r, g, bl] = palette[idx] || [0, 0, 0];
      } else {
        throw new Error(`BMP ${bpp}bpp 미지원`);
      }

      const o = (y * width + x) * 3;
      out[o] = r; out[o + 1] = g; out[o + 2] = bl;
    }
  }

  return { width, height, rgb: out };
}

/* ---------------- PCX 디코더 ---------------- */

export function pcxToRgb(b) {
  if (b[0] !== 0x0a) throw new Error("PCX 아님");

  const xmin = b.readUInt16LE(4), ymin = b.readUInt16LE(6);
  const xmax = b.readUInt16LE(8), ymax = b.readUInt16LE(10);
  const bpp = b[3];
  const planes = b[65];
  const bytesPerLine = b.readUInt16LE(66);

  const width = xmax - xmin + 1;
  const height = ymax - ymin + 1;
  const total = bytesPerLine * planes * height;

  // RLE 해제
  const raw = Buffer.alloc(total);
  let p = 128, o = 0;
  while (o < total && p < b.length) {
    const v = b[p++];
    if ((v & 0xc0) === 0xc0) {
      const n = v & 0x3f;
      const val = b[p++];
      for (let i = 0; i < n && o < total; i++) raw[o++] = val;
    } else raw[o++] = v;
  }

  // 팔레트: 8bit 1plane 이면 파일 끝 769바이트(0x0C + RGB 256개)
  let palette = null;
  if (bpp === 8 && planes === 1) {
    const tail = b.length - 769;
    if (tail > 0 && b[tail] === 0x0c) {
      palette = [];
      for (let i = 0; i < 256; i++) palette.push([b[tail + 1 + i * 3], b[tail + 2 + i * 3], b[tail + 3 + i * 3]]);
    }
  }
  if (!palette) {
    // 헤더의 16색 팔레트
    palette = [];
    for (let i = 0; i < 16; i++) palette.push([b[16 + i * 3], b[17 + i * 3], b[18 + i * 3]]);
  }

  const out = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const line = y * bytesPerLine * planes;

    for (let x = 0; x < width; x++) {
      let r, g, bl;

      if (planes === 3) {
        r = raw[line + x];
        g = raw[line + bytesPerLine + x];
        bl = raw[line + bytesPerLine * 2 + x];
      } else if (bpp === 8 && planes === 1) {
        [r, g, bl] = palette[raw[line + x]] || [0, 0, 0];
      } else if (bpp === 1) {
        // 플레인별 비트를 모아 팔레트 인덱스를 만든다
        let idx = 0;
        for (let pl = 0; pl < planes; pl++) {
          const byte = raw[line + pl * bytesPerLine + (x >> 3)];
          idx |= ((byte >> (7 - (x & 7))) & 1) << pl;
        }
        [r, g, bl] = palette[idx] || [0, 0, 0];
      } else {
        throw new Error(`PCX ${bpp}bpp/${planes}plane 미지원`);
      }

      const oo = (y * width + x) * 3;
      out[oo] = r; out[oo + 1] = g; out[oo + 2] = bl;
    }
  }

  return { width, height, rgb: out };
}

/** BMP/PCX 는 PNG 로 바꾸고, 이미 PNG/JPG 면 그대로 돌려준다. */
export function toWebImage(data, kind) {
  if (kind === "png" || kind === "jpg" || kind === "gif") return { ext: kind, data };
  const dec = kind === "bmp" ? bmpToRgb(data) : kind === "pcx" ? pcxToRgb(data) : null;
  if (!dec) throw new Error(`${kind} 변환 미지원`);
  return { ext: "png", data: encodePng(dec.width, dec.height, dec.rgb), width: dec.width, height: dec.height };
}
