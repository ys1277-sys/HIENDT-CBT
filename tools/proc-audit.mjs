/*
 * 절차서가 원본 그대로 옮겨졌는지 본다.
 *
 * 원본 hwp 를 다시 읽어, 굽는 과정을 거치지 않은 값과 굽힌 json 을
 * 맞대 본다. build-procedures.mjs 를 다시 부르지 않는다. 그러면
 * 같은 실수를 두 번 해 놓고 맞다고 할 뿐이다.
 *
 * 무엇을 보는가
 *   1. 글    원본 문단이 하나도 안 빠졌는가
 *   2. 차례  원본 차례가 뒤집히지 않았는가
 *   3. 그림  몇 장이 실렸고 몇 장이 빠졌는가, 왜 빠졌는가
 *   4. 자리  그림이 원본에서 붙어 있던 글 옆에 그대로 있는가
 *   5. 표    표 개수와 칸 수가 맞는가
 *
 * 4번이 핵심이다. 본문 2칸 표를 항목별로 엮어 펴기 때문에 그림이
 * 딸려 움직인다. 엮은 뒤에도 제자리인지 봐야 한다.
 */
import fs from "node:fs";
import path from "node:path";
import { readRich } from "./hwprich.mjs";
import { pcxToPng, isPcx } from "./pcx2png.mjs";
import { wmfToPng, isWmf } from "./wmf2png.mjs";
import { oleToImage, isOle } from "./ole2png.mjs";

/*
 * 원본에 없던 한글을 일부러 붙인 절차서.
 * 그 한글은 "원본에 없는 글" 로 세면 안 된다.
 */
const KO_FILE = { "p11-2-TOFD.hwp": "tofd-ko.json" };

function readKo(name) {
  const f = KO_FILE[name];
  if (!f) return null;
  try {
    return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
  } catch {
    return null;
  }
}

const SRC = "D:/Visual Studio Code/원본자료/절차서";
const OUT = "D:/Visual Studio Code/HIENDT-CBT/public/data/procedures";

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

/* ---- 원본 훑기 ---- */

/*
 * 덩이 나무를 납작하게 편다.
 * 표 안쪽까지 들어가되, 원본에 놓인 차례를 그대로 지킨다.
 */
function walkSrc(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "p") {
      const s = norm(b.s);
      if (s) out.push({ k: "p", s });
    } else if (b.t === "img") {
      out.push({ k: "img", binId: b.binId });
    } else if (b.t === "table") {
      out.push({ k: "table", rows: b.rows, cols: b.cols });
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") walkSrc(c.blocks, out);
        }
      }
    }
  }
  return out;
}

/* ---- 구운 json 훑기 ---- */

function walkOut(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "p" || b.t === "h") {
      const s = norm(b.s);
      if (s) out.push({ k: "p", s });
    } else if (b.t === "img") {
      out.push({ k: "img", src: b.src });
    } else if (b.t === "table") {
      out.push({ k: "table", rows: b.rows, cols: b.cols });
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") walkOut(c.blocks, out);
        }
      }
    }
  }
  return out;
}

/*
 * 그림이 기대고 있는 글.
 * 바로 앞과 바로 뒤의 글 한 줄씩을 딴다. 자리가 그대로면 이 둘도 같다.
 */
function anchors(seq, i) {
  let before = "";
  let after = "";
  for (let k = i - 1; k >= 0; k--) if (seq[k].k === "p") { before = seq[k].s; break; }
  for (let k = i + 1; k < seq.length; k++) if (seq[k].k === "p") { after = seq[k].s; break; }
  return { before, after };
}

/* png·jpg 머리에서 크기를 읽는다. build 쪽과 같은 잣대여야 한다 */
function pixelSize(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i + 9 < buf.length;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      }
      const len = buf.readUInt16BE(i + 2);
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return [0, 0];
}

/* ---- 문서 하나 ---- */

const DRAWABLE = new Set(["jpg", "png", "gif", "bmp"]);
const MIN_SIDE = 40;

function audit(name) {
  const file = path.join(SRC, name);
  const doc = readRich(file);

  /* 어느 json 으로 갔는지는 source 로 되짚는다 */
  const jsons = fs.readdirSync(OUT).filter((f) => f.endsWith(".json") && f !== "index.json");
  let built = null;
  let code = "";
  for (const j of jsons) {
    const d = JSON.parse(fs.readFileSync(path.join(OUT, j), "utf8"));
    if (d.source === name) { built = d; code = d.code; break; }
  }
  if (!built) return { name, err: "구운 json 을 못 찾음" };

  const src = walkSrc(doc.blocks);
  const out = walkOut(built.blocks);

  /* 1. 글 빠짐 */
  const outText = new Set(out.filter((x) => x.k === "p").map((x) => x.s));
  const srcText = src.filter((x) => x.k === "p").map((x) => x.s);
  const missing = [...new Set(srcText.filter((s) => !outText.has(s)))];

  /* 덤으로 붙은 글 — 원본에 없는 것이 들어갔나 */
  const koMap = readKo(name) || {};
  const koAdded = new Set(Object.values(koMap).map(norm));

  const srcSet = new Set(srcText);
  const added = [...new Set(
    out
      .filter((x) => x.k === "p")
      .map((x) => x.s)
      .filter((s) => !srcSet.has(s) && !koAdded.has(s))
  )];

  /*
   * 2. 차례.
   * 본문은 항목별로 엮느라 영문·한글 차례가 섞인다. 그래서 통째로
   * 견주지 않고, 원본에 있던 글이 구운 것에서도 서로 같은 앞뒤를
   * 지키는지 가장 긴 공통 차례로 잰다.
   */
  const outSeq = out.filter((x) => x.k === "p").map((x) => x.s);
  const keep = lcsLen(srcText.filter((s) => outText.has(s)), outSeq);

  /* 3. 그림 */
  /* 굽는 쪽과 같은 잣대로 본다. 바꿔서 실을 수 있으면 뺀 것이 아니다 */
  const imgs = doc.images.map((im) => {
    const [w, h] = pixelSize(im.data);
    let why = "";

    if (!DRAWABLE.has(im.kind)) {
      const 살릴수있나 =
        (isPcx(im.data) && pcxToPng(im.data)) ||
        (isWmf(im.data) && wmfToPng(im.data)) ||
        (isOle(im.data) && oleToImage(im.data));
      if (!살릴수있나) why = `${im.kind} 를 못 바꿈`;
    } else if (im.kind !== "bmp" && w && h && (w < MIN_SIDE || h < MIN_SIDE)) {
      why = `${w}x${h} 로 너무 작음`;
    }

    return { binId: im.binId, kind: im.kind, w, h, why };
  });

  const srcImgs = src.filter((x) => x.k === "img");
  const outImgs = out.filter((x) => x.k === "img");

  /* 파일로 나간 그림 */
  const onDisk = fs.readdirSync(OUT).filter((f) => f.startsWith(code + "_"));

  /* 4. 그림 자리 */
  const moved = [];

  /*
   * 같은 그림이 영문 칸과 한글 칸에 두 번 놓인다. 도해를 양쪽에
   * 똑같이 그려 둔 것이다. 그래서 binId 하나에 기댄 글이 여럿이다.
   * 앞엣것만 기억해 두면 뒤엣것이 죄다 "옮겨졌다"고 나온다.
   */
  const srcAnchor = new Map();
  src.forEach((x, i) => {
    if (x.k !== "img") return;
    if (!srcAnchor.has(x.binId)) srcAnchor.set(x.binId, []);
    srcAnchor.get(x.binId).push(anchors(src, i));
  });

  out.forEach((x, i) => {
    if (x.k !== "img") return;
    const m = String(x.src).match(/_(\d+)\.\w+$/);
    if (!m) return;
    const binId = Number(m[1]);
    const list = srcAnchor.get(binId);
    if (!list || !list.length) return;
    const b = anchors(out, i);

    /*
     * 원본에 놓였던 자리 가운데 하나와 앞이나 뒤가 맞으면 제자리다.
     * 한글을 붙인 절차서는 설명 줄과 그림 사이에 한글이 끼므로,
     * 그 한글도 같은 자리로 쳐 준다.
     */
    const same = (x, y) => x && (x === y || norm(koMap[x] || "") === y);

    const ok = list.some(
      (a) => same(a.before, b.before) || same(a.after, b.after)
    );
    if (!ok) {
      moved.push({
        binId,
        원본앞: list.map((a) => a.before.slice(0, 40)).join(" | "),
        구운앞: b.before.slice(0, 45),
      });
    }
  });

  /* 5. 표 */
  const srcTables = src.filter((x) => x.k === "table");
  const outTables = out.filter((x) => x.k === "table");

  return {
    name,
    code,
    rev: built.rev,
    글: { 원본: srcText.length, 구움: outSeq.length, 빠짐: missing, 덤: added, 차례유지: keep },
    그림: {
      원본: doc.images.length,
      실림: outImgs.length,
      본문에놓인원본: srcImgs.length,
      파일: onDisk.length,
      뺀것: imgs.filter((i) => i.why),
      옮겨짐: moved,
    },
    표: { 원본: srcTables.length, 구움: outTables.length },
  };
}

/* 가장 긴 공통 차례의 길이 */
function lcsLen(a, b) {
  const idx = new Map();
  b.forEach((s, i) => {
    if (!idx.has(s)) idx.set(s, []);
    idx.get(s).push(i);
  });

  const tails = [];
  for (const s of a) {
    const list = idx.get(s);
    if (!list) continue;
    for (let k = list.length - 1; k >= 0; k--) {
      const v = list[k];
      let lo = 0, hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] < v) lo = mid + 1; else hi = mid;
      }
      tails[lo] = v;
    }
  }
  return tails.length;
}

/* ---- 돌리기 ---- */

const only = process.argv[2];
const files = fs.readdirSync(SRC).filter((f) => /\.hwp$/i.test(f) && (!only || f.includes(only)));

console.log("절차서", files.length, "편\n");

let bad = 0;

for (const f of files) {
  let r;
  try { r = audit(f); } catch (e) { console.log(`${f}\n  읽기 실패 — ${e.message}\n`); bad++; continue; }
  if (r.err) { console.log(`${f}\n  ${r.err}\n`); bad++; continue; }

  const t = r.글;
  const g = r.그림;

  const 문제 =
    t.빠짐.length || t.덤.length || g.옮겨짐.length ||
    r.표.원본 !== r.표.구움 ||
    t.차례유지 !== Math.min(t.원본, t.구움) - (t.원본 - t.차례유지 > 0 ? 0 : 0);

  console.log("─".repeat(74));
  console.log(`${f}  →  ${r.code}  ${r.rev || ""}`);
  console.log(`  글    원본 ${t.원본}줄 / 구움 ${t.구움}줄  빠짐 ${t.빠짐.length}  덤 ${t.덤.length}  차례유지 ${t.차례유지}`);
  console.log(`  그림  원본 ${g.원본}장  본문에 놓인 것 ${g.본문에놓인원본}  실림 ${g.실림}  파일 ${g.파일}  뺀 것 ${g.뺀것.length}  자리 바뀜 ${g.옮겨짐.length}`);
  console.log(`  표    원본 ${r.표.원본}  구움 ${r.표.구움}`);

  if (t.빠짐.length) {
    console.log(`  ▶ 빠진 글 ${t.빠짐.length}줄`);
    t.빠짐.slice(0, 8).forEach((s) => console.log(`      ${s.slice(0, 90)}`));
    if (t.빠짐.length > 8) console.log(`      … 외 ${t.빠짐.length - 8}줄`);
    bad++;
  }
  if (t.덤.length) {
    console.log(`  ▶ 원본에 없는 글 ${t.덤.length}줄`);
    t.덤.slice(0, 5).forEach((s) => console.log(`      ${s.slice(0, 90)}`));
    bad++;
  }
  if (g.뺀것.length) {
    console.log(`  ▶ 뺀 그림 ${g.뺀것.length}장`);
    g.뺀것.slice(0, 8).forEach((i) => console.log(`      binId ${i.binId}  ${i.why}`));
    if (g.뺀것.length > 8) console.log(`      … 외 ${g.뺀것.length - 8}장`);
  }
  if (g.옮겨짐.length) {
    console.log(`  ▶ 자리가 바뀐 그림 ${g.옮겨짐.length}장`);
    g.옮겨짐.slice(0, 8).forEach((m) =>
      console.log(`      binId ${m.binId}\n        원본 앞: ${m.원본앞}\n        구움 앞: ${m.구운앞}`));
    bad++;
  }
  if (r.표.원본 !== r.표.구움) {
    console.log(`  ▶ 표 개수가 다름 (본문 2칸 표를 펴면 하나 줄어드는 것이 정상)`);
  }
  console.log();
}

console.log(bad === 0 ? "어긋난 곳 없음" : `살펴볼 곳 ${bad}건`);
