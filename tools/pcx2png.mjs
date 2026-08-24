/*
 * PCX 를 PNG 으로 바꾼다.
 *
 * 절차서 hwp 아홉 편에 PCX 가 열한 장 들어 있다. 브라우저가 못 그려서
 * 그동안 뺐다. 200x230 짜리 1비트 그림으로, 문서마다 같은 것이 들어 있다.
 *
 * PCX 는 짜임이 단순하다.
 *   머리 128바이트, 그 뒤로 줄마다 RLE 로 눌린 그림판이 이어진다.
 *   RLE 는 위 두 비트가 11 이면 아래 여섯 비트가 되풀이 횟수고
 *   다음 한 바이트가 되풀이할 값이다.
 */
import zlib from "node:zlib";

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
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // 필터 없음
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 한 색에 8비트
  ihdr[9] = 2;  // 참색(RGB)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function isPcx(buf) {
  return buf.length > 128 && buf[0] === 0x0a && buf[2] === 0x01;
}

export function pcxToPng(buf) {
  if (!isPcx(buf)) return null;

  const bitsPerPixel = buf[3];
  const xmin = buf.readUInt16LE(4);
  const ymin = buf.readUInt16LE(6);
  const xmax = buf.readUInt16LE(8);
  const ymax = buf.readUInt16LE(10);
  const planes = buf[65];
  const bytesPerLine = buf.readUInt16LE(66);

  const width = xmax - xmin + 1;
  const height = ymax - ymin + 1;

  if (width <= 0 || height <= 0 || width > 20000 || height > 20000) return null;
  if (planes < 1 || planes > 4) return null;

  /* 줄마다 planes 개의 판이 이어진다 */
  const lineBytes = bytesPerLine * planes;
  const plane = Buffer.alloc(lineBytes * height);

  let p = 128;
  let out = 0;

  while (out < plane.length && p < buf.length) {
    const b = buf[p++];

    if ((b & 0xc0) === 0xc0) {
      const run = b & 0x3f;
      if (p >= buf.length) break;
      const v = buf[p++];
      for (let i = 0; i < run && out < plane.length; i++) plane[out++] = v;
    } else {
      plane[out++] = b;
    }
  }

  /* 팔레트 */
  let pal;

  if (bitsPerPixel === 8 && planes === 1) {
    /* 256색은 파일 끝 769바이트에 팔레트가 붙는다. 첫 바이트는 0x0c */
    const at = buf.length - 769;
    if (at > 0 && buf[at] === 0x0c) {
      pal = buf.subarray(at + 1, at + 769);
    } else {
      pal = Buffer.alloc(768);
      for (let i = 0; i < 256; i++) { pal[i * 3] = i; pal[i * 3 + 1] = i; pal[i * 3 + 2] = i; }
    }
  } else {
    /* 16색까지는 머리 16번째 바이트부터 48바이트가 팔레트다 */
    pal = Buffer.alloc(768);
    buf.copy(pal, 0, 16, 64);

    /*
     * 1비트 그림은 팔레트가 검정 두 칸으로 비어 있는 것이 흔하다.
     * 그러면 온통 검정으로 나온다. 흑백으로 돌린다.
     */
    if (bitsPerPixel === 1 && planes === 1) {
      const filled = pal[0] || pal[1] || pal[2] || pal[3] || pal[4] || pal[5];
      if (!filled) {
        pal[0] = pal[1] = pal[2] = 255; // 0 = 흰색
        pal[3] = pal[4] = pal[5] = 0;   // 1 = 검정
      }
    }
  }

  const rgb = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const row = y * lineBytes;

    for (let x = 0; x < width; x++) {
      let idx = 0;

      for (let pl = 0; pl < planes; pl++) {
        const at = row + pl * bytesPerLine;
        let bit;

        if (bitsPerPixel === 1) {
          bit = (plane[at + (x >> 3)] >> (7 - (x & 7))) & 1;
        } else if (bitsPerPixel === 4) {
          const byte = plane[at + (x >> 1)];
          bit = x & 1 ? byte & 0x0f : byte >> 4;
        } else {
          bit = plane[at + x];
        }

        idx |= bit << pl;
      }

      const o = (y * width + x) * 3;

      if (bitsPerPixel === 8 && planes === 3) {
        /* 참색 PCX 는 판이 R G B 다 */
        rgb[o] = plane[row + 0 * bytesPerLine + x];
        rgb[o + 1] = plane[row + 1 * bytesPerLine + x];
        rgb[o + 2] = plane[row + 2 * bytesPerLine + x];
      } else {
        rgb[o] = pal[idx * 3];
        rgb[o + 1] = pal[idx * 3 + 1];
        rgb[o + 2] = pal[idx * 3 + 2];
      }
    }
  }

  return writePng(width, height, rgb);
}

export default pcxToPng;
