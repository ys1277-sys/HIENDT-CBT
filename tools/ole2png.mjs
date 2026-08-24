/*
 * OLE 개체 안에 든 그림을 꺼내 PNG 로 바꾼다.
 *
 * 절차서 세 곳에서 그림이 OLE 개체로 박혀 있다. 한글에서 다른 프로그램의
 * 그림을 붙여 넣으면 이렇게 된다. 겉은 복합 파일(d0 cf 11 e0)이고
 * 속에 진짜 그림이 들어 있다.
 *
 *   Ole10Native   길이 4바이트 뒤에 원본이 그대로 (UT 두 장은 BMP)
 *   OlePres000    화면에 보여 줄 그림. CF_METAFILEPICT 면 WMF 가 들었다
 */
import CFB from "cfb";
import { bmpToPng } from "./bmp2png.mjs";
import { wmfToPng, isWmf } from "./wmf2png.mjs";
import { pcxToPng, isPcx } from "./pcx2png.mjs";

const CFB_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

export function isOle(buf) {
  return oleStart(buf) >= 0;
}

/*
 * 복합 파일이 어디서 시작하는지.
 * hwp 는 앞에 길이 몇 바이트를 붙여 두기도 해서 곧바로 0번이 아니다.
 * 앞머리만 훑는다. 본문 한가운데서 우연히 맞는 것을 잡지 않으려는 것이다.
 */
function oleStart(buf) {
  const at = buf.subarray(0, 64).indexOf(CFB_MAGIC);
  return at;
}

/* 이미 브라우저가 그리는 것이면 그대로 쓴다 */
function asIs(b) {
  if (b.length < 8) return null;
  if (b[0] === 0x89 && b[1] === 0x50) return { ext: "png", data: b };
  if (b[0] === 0xff && b[1] === 0xd8) return { ext: "jpg", data: b };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: "gif", data: b };
  return null;
}

/* 바꿔야 그리는 것이면 바꾼다 */
function convert(b) {
  if (b.length < 8) return null;

  const plain = asIs(b);
  if (plain) return plain;

  if (b[0] === 0x42 && b[1] === 0x4d) {
    const png = bmpToPng(b);
    return png ? { ext: "png", data: png } : null;
  }

  if (isWmf(b)) {
    const png = wmfToPng(b);
    return png ? { ext: "png", data: png } : null;
  }

  if (isPcx(b)) {
    const png = pcxToPng(b);
    return png ? { ext: "png", data: png } : null;
  }

  return null;
}

/*
 * OlePres 는 머리 뒤에 그림이 온다. 머리 길이가 판마다 조금씩 달라
  * 자리를 세는 대신 그림 표식을 찾는다.
 */
function fromPres(b) {
  const wmfAt = b.indexOf(Buffer.from([0x01, 0x00, 0x09, 0x00, 0x00, 0x03]));
  if (wmfAt >= 0 && wmfAt < 4096) {
    const png = wmfToPng(b.subarray(wmfAt));
    if (png) return { ext: "png", data: png };
  }

  const bmpAt = b.indexOf(Buffer.from([0x42, 0x4d]));
  if (bmpAt >= 0 && bmpAt < 4096) {
    const png = bmpToPng(b.subarray(bmpAt));
    if (png) return { ext: "png", data: png };
  }

  return null;
}

/*
 * OLE 개체에서 그림을 꺼낸다. 못 꺼내면 null.
 * 돌려주는 값은 { ext, data }.
 */
export function oleToImage(buf) {
  const at = oleStart(buf);
  if (at < 0) return null;

  let cfb;
  try {
    cfb = CFB.read(buf.subarray(at), { type: "buffer" });
  } catch {
    return null;
  }

  /* 원본이 그대로 든 곳을 먼저 본다. 화면용보다 낫다 */
  let pres = null;

  for (let i = 0; i < cfb.FullPaths.length; i++) {
    const e = cfb.FileIndex[i];
    if (!e || e.type !== 2 || !e.content || !e.content.length) continue;

    const name = String(cfb.FullPaths[i]).split("/").pop();
    const b = Buffer.from(e.content);

    if (/^\x01?Ole10Native$/.test(name)) {
      /* 길이 4바이트를 떼고 본다. 안 떼도 되는 판이 있어 둘 다 해 본다 */
      const got = convert(b.subarray(4)) || convert(b);
      if (got) return got;
    }

    if (/^\x02?OlePres\d*$/.test(name) && !pres) pres = b;
  }

  return pres ? fromPres(pres) : null;
}

export default oleToImage;
