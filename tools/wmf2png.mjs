/*
 * WMF 안에 든 비트맵을 꺼내 PNG 로 바꾼다.
 *
 * 절차서 hwp 에 도해가 WMF 로 들어 있다. 브라우저는 WMF 를 못 그려서
 * 그동안 통째로 뺐다. TOFD 절차서만 18장이 빠졌다.
 *
 * 그런데 열어 보니 벡터 그림이 아니었다. 레코드가 여덟아홉 개뿐이고
 * 그 가운데 DIBSTRETCHBLT 하나가 4.6MB 짜리 비트맵을 통째로 안고 있다.
 * 스캔한 그림을 WMF 껍데기에 싸 둔 것이다. 껍데기를 벗기면 된다.
 *
 * DIB 는 BMP 에서 파일 머리 14바이트만 뺀 것이라, 그 머리를 지어
 * 붙이면 bmp2png 를 그대로 쓸 수 있다.
 */
import { bmpToPng } from "./bmp2png.mjs";

/* 비트맵을 안고 있는 레코드. 값은 레코드 첫머리에서 DIB 까지의 거리 */
const CARRIES_DIB = {
  0x0b41: 26, // META_DIBSTRETCHBLT   크기4 함수2 ROP4 (2바이트 × 8)
  0x0f43: 28, // META_STRETCHDIBITS   위와 같고 ColorUsage 2바이트가 더 있다
  0x0940: 22, // META_DIBBITBLT       ROP 뒤 좌표가 여섯 개뿐이다
};

export function isWmf(buf) {
  return (
    buf.length > 22 &&
    buf[0] === 0x01 && buf[1] === 0x00 &&
    buf[2] === 0x09 && buf[3] === 0x00 &&
    buf[4] === 0x00 && buf[5] === 0x03
  );
}

/* DIB 머리가 말이 되는지 본다. 엉뚱한 자리를 잡으면 여기서 걸린다 */
function looksLikeDib(buf, at) {
  if (at + 40 > buf.length) return false;

  const headerSize = buf.readUInt32LE(at);
  if (headerSize !== 40 && headerSize !== 108 && headerSize !== 124) return false;

  const w = buf.readInt32LE(at + 4);
  const h = buf.readInt32LE(at + 8);
  if (w <= 0 || w > 20000) return false;
  if (h === 0 || Math.abs(h) > 20000) return false;

  if (buf.readUInt16LE(at + 12) !== 1) return false; // planes

  const bits = buf.readUInt16LE(at + 14);
  return [1, 4, 8, 16, 24, 32].includes(bits);
}

/*
 * DIB 앞에 BMP 파일 머리를 지어 붙인다.
 *
 *   'BM' 파일크기4 예약4 픽셀시작4
 */
function wrapAsBmp(dib) {
  const headerSize = dib.readUInt32LE(0);
  const bits = dib.readUInt16LE(14);

  let used = dib.readUInt32LE(32); // biClrUsed
  if (!used && bits <= 8) used = 1 << bits;

  const pixelAt = 14 + headerSize + used * 4;

  const head = Buffer.alloc(14);
  head[0] = 0x42; // B
  head[1] = 0x4d; // M
  head.writeUInt32LE(14 + dib.length, 2);
  head.writeUInt32LE(pixelAt, 10);

  return Buffer.concat([head, dib]);
}

/*
 * WMF 하나에서 가장 큰 비트맵을 꺼내 PNG 로 돌려준다.
 * 못 꺼내면 null.
 */
export function wmfToPng(buf) {
  if (!isWmf(buf)) return null;

  let best = null;

  /* mtHeader 는 9워드 = 18바이트 */
  let p = 18;

  while (p + 6 <= buf.length) {
    const words = buf.readUInt32LE(p);
    const fn = buf.readUInt16LE(p + 4);

    if (words < 3) break;

    const bytes = words * 2;
    if (p + bytes > buf.length) break;

    const off = CARRIES_DIB[fn];
    if (off !== undefined && looksLikeDib(buf, p + off)) {
      const dib = buf.subarray(p + off, p + bytes);
      if (!best || dib.length > best.length) best = dib;
    }

    p += bytes;
  }

  if (!best) return null;

  return bmpToPng(wrapAsBmp(best));
}

export default wmfToPng;
