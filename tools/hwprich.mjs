/*
 * HWP 5.0 을 표·그림까지 살려서 읽는다.
 *
 * hwplib.mjs 는 본문 글만 뽑는다. 절차서는 그것으로는 못 읽는다.
 *
 *  - 본문 전체가 1줄 2칸 표 안에 들어 있다. 왼쪽 칸이 영문, 오른쪽 칸이
 *    한글이다. 글만 뽑으면 영문이 통째로 나온 뒤 한글이 통째로 나온다.
 *  - 개정이력·결재란·합격기준이 표다. 칸을 줄로 풀면 "2" "2024.01.02"
 *    "H. H. KIM" 같은 조각으로 흩어진다.
 *  - 그림을 BinData 차례로 꺼내면 문서에 놓인 차례와 다르다.
 *
 * 레코드 나무
 * -----------
 * 레코드 머리에 깊이가 들어 있다. 깊이로 나무를 세우면 구조가 그대로 산다.
 *
 *   PARA_HEADER              문단
 *     PARA_TEXT              글
 *     CTRL_HEADER "tbl "     표
 *       TABLE                줄 수, 칸 수
 *       LIST_HEADER          칸 하나
 *       PARA_HEADER          그 칸 안의 문단
 *       PARA_HEADER
 *       LIST_HEADER          다음 칸
 *       PARA_HEADER
 *     CTRL_HEADER "gso "     그리기 개체
 *       SHAPE_COMPONENT
 *         SHAPE_COMPONENT_PICTURE   그림. BinData 번호가 들어 있다
 *
 * 칸의 문단은 LIST_HEADER 의 자식이 아니라 형제다. 깊이가 같아서
 * 자식으로 찾으면 칸이 전부 비어 나온다. 다음 LIST_HEADER 가 나올
 * 때까지 이어지는 PARA_HEADER 가 그 칸의 내용이다.
 */
import zlib from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire("file:///D:/Visual Studio Code/HIENDT-CBT/package.json");
const CFB = require("cfb");

/*
 * 태그 번호는 HWPTAG_BEGIN(0x010 = 16) 에서 센다.
 * TABLE 은 BEGIN+61 = 77 이다. 73 은 PAGE_DEF 라 표가 하나도 안 잡힌다.
 */
const PARA_HEADER = 66;  // BEGIN+50
const PARA_TEXT = 67;    // BEGIN+51
const CTRL_HEADER = 71;  // BEGIN+55
const LIST_HEADER = 72;  // BEGIN+56
const TABLE = 77;        // BEGIN+61
const PICTURE = 85;      // BEGIN+69
const BIN_DATA = 18;     // BEGIN+2  DocInfo 의 그림 목록

const OBJ_CTRL = 11;
const TAB = 9;
const CHAR_2B = new Set([0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31]);

const inflate = (b) => {
  try { return zlib.inflateRawSync(b); } catch { }
  try { return zlib.inflateSync(b); } catch { }
  return b;
};

export function magic(b) {
  if (b.length < 8) return "bin";
  if (b[0] === 0x89 && b[1] === 0x50) return "png";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b[0] === 0x42 && b[1] === 0x4d) return "bmp";
  if (b[0] === 0x47 && b[1] === 0x49) return "gif";
  if (b[0] === 0x0a && b[1] <= 5) return "pcx";
  if (b.readUInt32LE(0) === 0x9ac6cdd7) return "wmf";
  if (b.length > 44 && b.readUInt32LE(0) === 1 && b.readUInt32LE(40) === 0x464d4520) return "emf";
  return "bin";
}

/* 레코드 머리 32비트: 태그 10, 깊이 10, 크기 12 */
function records(buf) {
  const out = [];
  for (let p = 0; p + 4 <= buf.length;) {
    const v = buf.readUInt32LE(p);
    p += 4;
    let size = (v >> 20) & 0xfff;
    if (size === 0xfff) { size = buf.readUInt32LE(p); p += 4; }
    if (p + size > buf.length) break;
    out.push({ tag: v & 0x3ff, level: (v >> 10) & 0x3ff, d: buf.subarray(p, p + size) });
    p += size;
  }
  return out;
}

/* 깊이로 나무를 세운다 */
function tree(recs) {
  const root = { tag: -1, level: -1, children: [] };
  const stack = [root];

  for (const r of recs) {
    while (stack.length > r.level + 1) stack.pop();
    const node = { tag: r.tag, level: r.level, d: r.d, children: [] };
    (stack[stack.length - 1] || root).children.push(node);
    stack.push(node);
  }
  return root;
}

function paraText(d) {
  let s = "";
  for (let i = 0; i + 1 < d.length;) {
    const c = d.readUInt16LE(i);
    if (c >= 32) { s += String.fromCharCode(c); i += 2; }
    else if (CHAR_2B.has(c)) { if (c === 10 || c === 13) s += "\n"; i += 2; }
    /*
     * 탭(9)도 16바이트를 차지하는 제어문자다. 그냥 건너뛰면 앞뒤 글자가
     * 붙어 "ASME Sec. I2023 Edition" 처럼 나온다. 자리를 남긴다.
     */
    else { if (c === TAB) s += "\t"; i += 16; }
  }
  return s.replace(/\u0000/g, "");
}

/* CTRL_HEADER 의 ctrlId. 4바이트가 뒤집혀 담긴다 */
function ctrlId(d) {
  if (d.length < 4) return "";
  return String.fromCharCode(d[3], d[2], d[1], d[0]);
}

/* 나무 아래에서 그림 레코드를 찾는다 */
function findPictures(node, out) {
  if (node.tag === PICTURE) out.push(node);
  for (const c of node.children) findPictures(c, out);
  return out;
}

/*
 * 그림 레코드 안에서 BinData 번호가 놓인 자리를 찾는다.
 * 스펙대로 세면 68 인데 실제 파일은 71 이었다. 한 값으로 못 박지 않고
 * 모든 그림이 실제 있는 BinData 를 가리키는 자리를 고른다.
 */
function findBinIdOffset(picDatas, validIds) {
  let best = null;

  for (let off = 40; off <= 100; off++) {
    const ids = [];
    for (const d of picDatas) {
      if (d.length < off + 2) { ids.length = 0; break; }
      ids.push(d.readUInt16LE(off));
    }
    if (!ids.length) continue;

    /*
     * 전부 맞을 것을 요구하면 안 된다. 지운 그림의 레코드가 남아 있어
     * 없는 BinData 를 가리키는 문서가 있다(RFT 가 그렇다). 그러면 어느
     * 자리에서도 조건을 못 채워 그림이 하나도 안 붙는다.
     * 맞는 개수가 가장 많은 자리를 고르고, 안 맞는 것만 버린다.
     */
    const hit = ids.filter((i) => validIds.has(i)).length;
    if (hit < ids.length * 0.6) continue;

    const distinct = new Set(ids.filter((i) => validIds.has(i))).size;
    if (!best || hit > best.hit || (hit === best.hit && distinct > best.distinct)) {
      best = { off, hit, distinct };
    }
  }
  return best ? best.off : null;
}

/*
 * 칸 주소가 리스트 헤더 어디에 있는지는 문서마다 조금씩 다르다.
 * 줄·칸 수 안에 들어오는 자리를 골라 쓴다.
 */
function findCellOffset(cellDatas, rows, cols) {
  for (const off of [8, 10, 6, 12]) {
    let ok = cellDatas.length > 0;
    for (const d of cellDatas) {
      if (d.length < off + 8) { ok = false; break; }
      const col = d.readUInt16LE(off);
      const row = d.readUInt16LE(off + 2);
      const cs = d.readUInt16LE(off + 4);
      const rs = d.readUInt16LE(off + 6);
      if (col >= cols || row >= rows || cs < 1 || rs < 1 || col + cs > cols || row + rs > rows) {
        ok = false;
        break;
      }
    }
    if (ok) return off;
  }
  return null;
}

/* ---- 나무를 덩이로 옮긴다 ---- */

function makeReader(binIdOf) {
  /* 문단 묶음(PARA_HEADER 들)을 덩이 배열로 */
  function readParas(nodes) {
    const blocks = [];

    for (const p of nodes) {
      if (p.tag !== PARA_HEADER) continue;

      for (const c of p.children) {
        if (c.tag === PARA_TEXT) {
          for (const line of paraText(c.d).split("\n")) {
            const s = line.replace(/[ \t]+/g, " ").trim();
            if (s) blocks.push({ t: "p", s });
          }
          continue;
        }

        if (c.tag !== CTRL_HEADER) continue;
        const id = ctrlId(c.d);

        if (id === "tbl ") {
          const tbl = readTable(c);
          if (tbl) blocks.push(tbl);
          continue;
        }

        /* 그리기 개체 안의 그림 */
        for (const pic of findPictures(c, [])) {
          const binId = binIdOf(pic.d);
          if (binId != null) blocks.push({ t: "img", binId });
        }

        /* 글상자처럼 개체가 문단을 품기도 한다 */
        const inner = readParas(c.children);
        for (const b of inner) blocks.push(b);
      }
    }
    return blocks;
  }

  /* LIST_HEADER 하나와 그 뒤에 이어지는 PARA_HEADER 들을 한 칸으로 묶는다 */
  function groupCells(children) {
    const cells = [];
    let cur = null;

    for (const ch of children) {
      if (ch.tag === LIST_HEADER) {
        cur = { d: ch.d, paras: [] };
        cells.push(cur);
      } else if (ch.tag === PARA_HEADER && cur) {
        cur.paras.push(ch);
      }
    }
    return cells;
  }

  function readTable(ctrl) {
    const tnode = ctrl.children.find((c) => c.tag === TABLE);
    if (!tnode || tnode.d.length < 8) return null;

    const rows = tnode.d.readUInt16LE(4);
    const cols = tnode.d.readUInt16LE(6);
    if (!rows || !cols || rows > 300 || cols > 60) return null;

    const cells = groupCells(ctrl.children);
    if (!cells.length) return null;

    const off = findCellOffset(cells.map((c) => c.d), rows, cols);
    if (off === null) return null;

    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (const c of cells) {
      const col = c.d.readUInt16LE(off);
      const row = c.d.readUInt16LE(off + 2);
      const colSpan = c.d.readUInt16LE(off + 4);
      const rowSpan = c.d.readUInt16LE(off + 6);

      grid[row][col] = { colSpan, rowSpan, blocks: readParas(c.paras) };

      for (let r = row; r < row + rowSpan; r++) {
        for (let q = col; q < col + colSpan; q++) {
          if (r === row && q === col) continue;
          grid[r][q] = "covered";
        }
      }
    }

    return { t: "table", rows, cols, grid };
  }

  return readParas;
}

/*
 * DocInfo 의 BINDATA 목록을 읽는다.
 * 돌려주는 배열의 n 번째 값이 목록 n+1 번이 가리키는 저장소 번호다.
 * 못 읽으면 빈 배열. 그때는 저장소 이름을 그대로 쓴다.
 */
function readBinList(cfb, flags) {
  const out = [];

  const entry = CFB.find(cfb, "DocInfo");
  if (!entry || !entry.content || !entry.content.length) return out;

  let di = Buffer.from(entry.content);
  if (flags & 1) {
    try { di = inflate(di); } catch { return out; }
  }

  for (const r of records(di)) {
    if (r.tag !== BIN_DATA) continue;

    const d = r.d;
    if (d.length < 2) { out.push(-1); continue; }

    const type = d.readUInt16LE(0) & 0x0f;

    /* 0 은 바깥 파일을 걸어 둔 것이라 저장소가 없다. 자리는 지켜야 한다 */
    if (type === 0) { out.push(-1); continue; }
    if (d.length < 4) { out.push(-1); continue; }

    out.push(d.readUInt16LE(2));
  }

  return out;
}

export function readRich(file) {
  const cfb = CFB.read(file, { type: "file" });
  const flags = Buffer.from(CFB.find(cfb, "FileHeader").content).readUInt32LE(36);
  if (flags & 2) throw new Error("암호화된 문서");

  /*
   * BinData.
   *
   * 그림 레코드가 들고 있는 번호는 저장소 이름(BIN0036)이 아니라
   * DocInfo 에 적힌 목록에서 몇 번째냐다. 둘은 보통 같지만 늘 같지는
   * 않다. 그림을 넣었다 지웠다 하면 어긋난다.
   *
   *   TOFD  목록 1 → BIN0040,  목록 36 → BIN0035 …  40장이 한 칸씩 밀림
   *   UT    35장, RFT 6장이 어긋남
   *
   * 이름으로 읽었더니 표지 로고 자리에 교정시험편 도해가 들어가는 식으로
   * TOFD 는 그림이 통째로 어긋나 있었다. 목록을 읽어 짝지운다.
   */
  const storageOf = readBinList(cfb, flags);

  const byStorage = new Map();
  const seen = new Set();

  cfb.FullPaths.forEach((full, i) => {
    const e = cfb.FileIndex[i];
    if (!e || e.type !== 2 || !e.content.length) return;
    if (!/\/BinData\/BIN\w+/i.test(full)) return;

    const stem = e.name.replace(/\.\w+$/, "");
    const storage = parseInt(stem.replace(/^BIN/i, ""), 16);
    if (seen.has(storage)) return;
    seen.add(storage);

    const data = inflate(Buffer.from(e.content));
    byStorage.set(storage, { id: stem, storage, kind: magic(data), data });
  });

  /*
   * binId 는 목록에서의 자리다. 목록을 못 읽으면 예전처럼 이름을 쓴다.
   * 목록에 없는 저장소도 버리지 않고 제 이름으로 담아 둔다.
   */
  const images = [];
  const used = new Set();

  storageOf.forEach((storage, idx) => {
    const im = byStorage.get(storage);
    if (!im) return;
    used.add(storage);
    images.push({ ...im, binId: idx + 1 });
  });

  /* 그림 레코드가 부를 수 있는 번호 — 목록에 든 자리만이다 */
  const listIds = new Set(images.map((i) => i.binId));

  /*
   * 목록에 없는 저장소.
   *
   * 그림을 넣었다 지운 자리가 이렇게 남는다. 저장소 이름을 그대로 번호로
   * 쓰면 목록 자리 번호와 겹친다.
   *
   *   UT 절차서 목록은 35칸인데 BIN0022·BIN0023 이 목록에 없다.
   *   0x22 = 34, 0x23 = 35 라 목록 34·35번(BIN0020·BIN0021)을 덮어썼고,
   *   746x419 짜리 도해 자리에 308x112 서명 도장이 떴다.
   *
   * 목록 뒤로 밀어 둔다. 어차피 본문이 부르지 않는 그림이라 파일로만
   * 남고 문서에는 안 붙는다.
   */
  let extra = storageOf.length;

  for (const [storage, im] of byStorage) {
    if (used.has(storage)) continue;
    images.push({ ...im, binId: ++extra });
  }

  /* 본문 */
  const roots = [];
  for (const e of cfb.FileIndex) {
    if (!/^Section\d+$/.test(e.name || "")) continue;
    let raw = Buffer.from(e.content);
    if (flags & 1) raw = inflate(raw);
    roots.push(tree(records(raw)));
  }

  /* 그림 번호 자리를 먼저 정한다 */
  const picDatas = roots.flatMap((r) => findPictures(r, []).map((p) => p.d));

  /*
   * 목록을 읽었으면 목록 자리 번호만 받는다. 목록을 못 읽었으면
   * 예전처럼 저장소 이름을 번호로 삼는다.
   */
  const validIds = listIds.size ? listIds : new Set(images.map((i) => i.binId));
  const off = picDatas.length ? findBinIdOffset(picDatas, validIds) : null;

  const binIdOf = (d) => {
    if (off === null || d.length < off + 2) return null;
    const id = d.readUInt16LE(off);
    return validIds.has(id) ? id : null;
  };

  const readParas = makeReader(binIdOf);
  const blocks = roots.flatMap((r) => readParas(r.children));

  return { blocks, images, binIdOffset: off };
}
