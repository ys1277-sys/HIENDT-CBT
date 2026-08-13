/*
 * BMP 를 PNG 로 바꾼다.
 *
 * hwp 에 박힌 그림 가운데 BMP 가 압축이 하나도 안 된 채로 들어 있다.
 * 절차서 9편에서 BMP 79장이 80MB 였다. 그대로 배포하면 응시자가
 * 절차서를 열 때마다 그만큼을 내려받는다.
 *
 * 바깥 라이브러리 없이 Node 의 zlib 만 쓴다.
 * BI_RGB 무압축 24·32비트와 팔레트 8·4·1비트를 다룬다.
 * 그 밖의 꼴(RLE 압축 등)은 건드리지 않고 그대로 둔다.
 */
import zlib from "node:zlib";

/* ---- PNG 쓰기 ---- */

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
  len.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

/* pixels 는 위에서 아래로, 한 점당 3바이트(RGB) */
function writePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 비트 깊이
  ihdr[9] = 2;  // 트루컬러
  ihdr[10] = 0; // 압축
  ihdr[11] = 0; // 거르기
  ihdr[12] = 0; // 훑기

  /* 줄마다 거르기 바이트 0 을 앞에 붙인다 */
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

/* ---- BMP 읽기 ---- */

export function bmpToPng(buf) {
  if (buf.length < 54 || buf[0] !== 0x42 || buf[1] !== 0x4d) return null;

  const dataOffset = buf.readUInt32LE(10);
  const headerSize = buf.readUInt32LE(14);
  if (headerSize < 40) return null;

  const width = buf.readInt32LE(18);
  let height = buf.readInt32LE(22);
  const planes = buf.readUInt16LE(26);
  const bits = buf.readUInt16LE(28);
  const compression = buf.readUInt32LE(30);

  if (planes !== 1 || compression !== 0) return null;
  if (width <= 0 || width > 20000 || height === 0) return null;

  /* 높이가 음수면 위에서 아래로 담긴 것이다 */
  const topDown = height < 0;
  height = Math.abs(height);
  if (height > 20000) return null;

  /* 팔레트 */
  let palette = null;
  if (bits <= 8) {
    let used = buf.readUInt32LE(46);
    if (!used) used = 1 << bits;
    const at = 14 + headerSize;
    if (at + used * 4 > buf.length) return null;

    palette = new Uint8Array(used * 3);
    for (let i = 0; i < used; i++) {
      palette[i * 3] = buf[at + i * 4 + 2];     // R
      palette[i * 3 + 1] = buf[at + i * 4 + 1]; // G
      palette[i * 3 + 2] = buf[at + i * 4];     // B
    }
  } else if (bits !== 24 && bits !== 32) {
    return null;
  }

  /* BMP 는 줄 길이를 4바이트에 맞춘다 */
  const srcStride = Math.floor((bits * width + 31) / 32) * 4;
  if (dataOffset + srcStride * height > buf.length) return null;

  const rgb = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    const src = dataOffset + srcY * srcStride;
    let dst = y * width * 3;

    for (let x = 0; x < width; x++) {
      let r, g, b;

      if (bits === 24 || bits === 32) {
        const at = src + x * (bits / 8);
        b = buf[at];
        g = buf[at + 1];
        r = buf[at + 2];
      } else {
        let idx;
        if (bits === 8) idx = buf[src + x];
        else if (bits === 4) idx = (buf[src + (x >> 1)] >> (x & 1 ? 0 : 4)) & 0x0f;
        else idx = (buf[src + (x >> 3)] >> (7 - (x & 7))) & 1;

        const p = idx * 3;
        if (p + 2 >= palette.length) { r = g = b = 0; }
        else { r = palette[p]; g = palette[p + 1]; b = palette[p + 2]; }
      }

      rgb[dst++] = r;
      rgb[dst++] = g;
      rgb[dst++] = b;
    }
  }

  return writePng(width, height, rgb);
}
