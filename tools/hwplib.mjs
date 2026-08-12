/*
 * HWP 5.0 읽기 + 시험지 파서 (공용 모듈)
 *
 * 본문 텍스트를 뽑을 때 확장 제어문자 11(그리기 개체/표)을 만나면
 * [[OBJ]] 마커를 남긴다. 이미지가 몇 번 문항에 붙어 있는지 알아내려면
 * 이 위치 정보가 필요하다.
 */
import zlib from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire("file:///D:/Visual Studio Code/HIENDT-CBT/package.json");
const CFB = require("cfb");

const PARA_TEXT = 67;
const CHAR_2B = new Set([0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31]);
const OBJ_CTRL = 11; // 그리기 개체 / 표

export const inflate = (b) => {
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

function paraText(d) {
  let s = "";
  for (let i = 0; i + 1 < d.length;) {
    const c = d.readUInt16LE(i);
    if (c >= 32) { s += String.fromCharCode(c); i += 2; }
    else if (CHAR_2B.has(c)) { if (c === 10 || c === 13) s += "\n"; i += 2; }
    else { if (c === OBJ_CTRL) s += "[[OBJ]]"; i += 16; }
  }
  return s;
}

function records(buf) {
  const out = [];
  for (let p = 0; p + 4 <= buf.length;) {
    const v = buf.readUInt32LE(p); p += 4;
    let size = (v >> 20) & 0xfff;
    if (size === 0xfff) { size = buf.readUInt32LE(p); p += 4; }
    if (p + size > buf.length) break;
    out.push([v & 0x3ff, buf.subarray(p, p + size)]);
    p += size;
  }
  return out;
}

const PIC_TAG = 85; // HWPTAG_SHAPE_COMPONENT_PICTURE

/*
 * 그림 레코드 안에서 BinItem ID(UINT16LE)가 놓인 오프셋을 찾는다.
 * 스펙상 고정 길이 필드를 더하면 68이 나오지만 실제 파일은 71이었다.
 * 한 값으로 못 박지 않고, "모든 그림 레코드가 실제 존재하는 BinData 를
 * 가리키는" 오프셋을 골라낸다. 후보가 여럿이면 가장 많은 서로 다른 ID를
 * 만들어내는 쪽을 쓴다 (모두 같은 값이 나오는 우연한 오프셋 배제).
 */
function findBinIdOffset(picRecords, validIds) {
  let best = null;
  for (let off = 40; off <= 100; off++) {
    const ids = [];
    for (const d of picRecords) {
      if (d.length < off + 2) { ids.length = 0; break; }
      ids.push(d.readUInt16LE(off));
    }
    if (!ids.length || !ids.every((i) => validIds.has(i))) continue;
    const distinct = new Set(ids).size;
    if (!best || distinct > best.distinct) best = { off, distinct };
  }
  return best?.off ?? null;
}

export function readHwp(file) {
  const cfb = CFB.read(file, { type: "file" });
  const flags = Buffer.from(CFB.find(cfb, "FileHeader").content).readUInt32LE(36);
  if (flags & 2) throw new Error("암호화된 문서");

  let text = "";
  const picRaw = []; // { pos, data }

  for (const e of cfb.FileIndex) {
    if (!/^Section\d+$/.test(e.name || "")) continue;
    let raw = Buffer.from(e.content);
    if (flags & 1) raw = inflate(raw);
    for (const [tag, d] of records(raw)) {
      if (tag === PARA_TEXT) text += paraText(d) + "\n";
      else if (tag === PIC_TAG) picRaw.push({ pos: text.length, data: d });
    }
  }

  /*
   * 삽입 이미지는 BinData 저장소 아래 것만 쓴다.
   * 같은 stem 이 두 번 나오는 문서가 있는데(BIN0004.bmp 와 BIN0004.jpg),
   * 뒤엣것이 앞엣것을 덮어쓰면 엉뚱한 그림이 붙는다. 먼저 나온 것을 유지한다.
   */
  const images = [];
  const seenBinId = new Set();

  cfb.FullPaths.forEach((full, i) => {
    const e = cfb.FileIndex[i];
    if (!e || e.type !== 2 || !e.content.length) return;
    if (!/\/BinData\/BIN\w+/i.test(full)) return;

    const stem = e.name.replace(/\.\w+$/, "");
    // BIN0001 -> binId 1 (BinData 항목 이름은 BIN + 16진수 4자리)
    const binId = parseInt(stem.replace(/^BIN/i, ""), 16);
    if (seenBinId.has(binId)) return;
    seenBinId.add(binId);

    const data = inflate(Buffer.from(e.content));
    images.push({ id: stem, binId, kind: magic(data), data });
  });

  const validIds = new Set(images.map((i) => i.binId));
  const off = picRaw.length ? findBinIdOffset(picRaw.map((p) => p.data), validIds) : null;
  const picAnchors = off === null ? [] : picRaw.map((p) => ({ pos: p.pos, binId: p.data.readUInt16LE(off) }));

  return { text, images, picAnchors, binIdOffset: off, picCount: picRaw.length };
}

/* ------------------------------------------------------------------ */
/* 시험지 파서                                                          */
/* ------------------------------------------------------------------ */

// 시험지 머리말(응시자 정보 + NOTE 1~5)을 잘라낸다.
// NOTE 항목이 "1." ~ "5." 로 시작해 문항 번호와 헷갈리기 때문에 반드시 필요하다.
function stripHeader(text) {
  const m = /(?:Question\s+)?approved\s+by[\s\S]{0,200}?NDE\s*Level\s*[ⅢIII]+/i.exec(text);
  if (m) return m.index + m[0].length;
  const n = /Completed\s+within[^\n]*\n/i.exec(text);
  return n ? n.index + n[0].length : 0;
}

const clean = (s) => s.replace(/[ \t\u00a0]+/g, " ").replace(/\s+$/g, "").trim();

/*
 * 선택지 라벨(A. B. C. … 또는 a. b. c. …)을 찾아 순서대로 이어지는 것만 남긴다.
 * 한 줄에 두 개씩 있어도, 문제 문장에 이어 붙어 있어도(B-III 형식) 처리된다.
 * 본문 속 우연한 "a." 오검출은 "반드시 A부터 순서대로" 조건으로 걸러진다.
 */
function optionMarks(block) {
  /*
   * A~J 까지 본다. 자분탐상 General 에 10지선다가 있어서
   * H 까지만 보면 I, J 가 앞 선택지에 붙어버린다.
   *
   * 마침표 뒤 공백도 필수가 아니다. "c.A ultrasonic probe..." 처럼
   * 붙여 쓴 시험지가 있다.
   */
  /*
   * 마크 앞에 무엇이 오든 인정한다.
   * "A. 13 mm (0.5 in.)B. 18 mm (0.7 in.)" 처럼 괄호 뒤에 바로 붙여 쓴
   * 시험지가 있어서, 앞에 공백이나 여는 괄호를 요구하면 절반을 놓친다.
   * 단어 속 오검출은 "A 부터 순서대로" 조건이 걸러준다.
   */
  const marks = [...block.matchAll(/(?:^|[^A-Za-z0-9])([A-Ja-j])[.)][ \t]*(?=\S)/g)];
  if (marks.length < 2) return null;

  /*
   * 선택지가 2단으로 배치된 시험지가 많다.
   *
   *     a.  0.5 MHz            c.  2.25 MHz
   *     b.  1   MHz            d.  5    MHz
   *
   * 이 경우 문서상 순서는 a, c, b, d 다.
   * "a 다음엔 b" 로 훑으면 c 에서 끊기므로,
   * 글자별 첫 등장만 모아 a 부터 끊김 없이 이어지는 구간을 취한다.
   */
  const firstByLetter = new Map();
  for (const m of marks) {
    const idx = m[1].toUpperCase().charCodeAt(0) - 65;
    if (!firstByLetter.has(idx)) firstByLetter.set(idx, m);
  }

  const kept = [];
  for (let i = 0; firstByLetter.has(i); i++) kept.push(firstByLetter.get(i));

  /*
   * 원본 시험지에 라벨이 잘못 붙은 문항이 있다.
   *   A. …  B. …  D. …  D. …      (C 가 없고 D 가 두 번)
   * 글자 순서로만 보면 A, B 에서 끊겨 선택지 절반을 잃는다.
   *
   * 이럴 때만 문서에 나온 순서를 그대로 쓴다.
   * 문장 속의 "a. " 를 잘못 집지 않도록, 줄 첫머리에 있는 마크만 인정한다.
   */
  const atLineStart = (m) => {
    const nl = block.lastIndexOf("\n", m.index);
    return /^[\s(]*$/.test(block.slice(nl + 1, m.index + (m[0][0] === "\n" ? 1 : 0)));
  };

  const leading = marks.filter(atLineStart);

  if (leading.length > kept.length && leading.length >= 3 && leading.length <= 10) {
    return leading;
  }

  /*
   * 라벨이 어긋난 문항이 한 줄에 이어져 있는 경우.
   *   A. 15 R/h  B. 1000 R/h  C. 1 R/Min  C. 10 mR/d     (D 가 없고 C 가 두 번)
   * 줄 첫머리 조건으로는 걸러지지 않으므로,
   * "A 부터 시작해 글자가 뒤로 가지 않는" 연속 구간을 그대로 쓴다.
   */
  const firstA = marks.findIndex((m) => /^[Aa]$/.test(m[1]));
  if (firstA >= 0) {
    const run = [marks[firstA]];
    let last = 0;
    for (let i = firstA + 1; i < marks.length; i++) {
      const idx = marks[i][1].toUpperCase().charCodeAt(0) - 65;
      if (idx < last) break;          // 글자가 뒤로 가면 다음 문항이다
      run.push(marks[i]);
      last = idx;
    }
    if (run.length > kept.length && run.length >= 3 && run.length <= 10) return run;
  }

  return kept.length >= 2 ? kept : null;
}

/*
 * 문항 하나의 본문에서 영문/한글/선택지를 분리한다.
 * 한글 번역은 통째로 괄호에 싸인 줄이거나, 괄호 없는 한글 줄로 들어있다.
 */
function parseBody(body) {
  const objCount = (body.match(/\[\[OBJ\]\]/g) || []).length;
  body = body.replace(/\[\[OBJ\]\]/g, " ");

  const marks = optionMarks(body);

  /*
   * marks 는 글자순(a,b,c,d)이지만 본문에서의 위치는 뒤섞여 있을 수 있다.
   * 각 선택지의 본문 범위는 "문서상 바로 다음 선택지" 까지다.
   */
  let head = body;
  let options = null;

  if (marks) {
    const docOrder = [...marks].sort((x, y) => x.index - y.index);
    const nextIndex = new Map();
    docOrder.forEach((m, i) => {
      nextIndex.set(m, i + 1 < docOrder.length ? docOrder[i + 1].index : body.length);
    });

    head = body.slice(0, docOrder[0].index);
    options = marks.map(m =>
      clean(body.slice(m.index + m[0].length, nextIndex.get(m)))
    );
  }

  const lines = head.split("\n").map(clean).filter(Boolean);
  const ko = [], en = [];

  for (const l of lines) {
    // 통째로 괄호에 싸인 줄 = 한글 번역
    if (/^\(.*\)$/s.test(l) && /[가-힣]/.test(l)) { ko.push(l.slice(1, -1).trim()); continue; }

    // 영문 없이 한글만 있는 줄
    if (/[가-힣]/.test(l) && !/[A-Za-z]{4}/.test(l)) { ko.push(l); continue; }

    /*
     * 한 줄에 영문과 한글이 같이 있는 형태.
     *   Filters used at the port of the X-ray tube: (엑스선관의 필터는?)
     * 시험지 절반가량이 이렇게 되어 있어서, 괄호 부분을 떼어내지 않으면
     * "한글 번역이 없는 문항" 으로 잘못 잡힌다.
     */
    const m = /^([\s\S]*?)\s*\(([^()]*[가-힣][^()]*)\)\s*$/.exec(l);
    if (m && /[A-Za-z]{4}/.test(m[1])) {
      en.push(m[1].trim());
      ko.push(m[2].trim());
      continue;
    }

    /*
     * 괄호 없이 영문 뒤에 한글이 바로 붙는 형태도 많다.
     *   What is not an advantage of TOFD? TOFD의 장점이 아닌 것은?
     *   What is another name for the S-scan? S-scan의 다른 이름은?
     *
     * 한글 부분이 영문 약어로 시작하는 경우가 많아 "한글로 시작하는 곳" 으로는
     * 나눌 수 없다. 문장 끝(? . :) 자리마다 잘라보고
     * 앞은 한글이 전혀 없고 뒤에는 한글이 있는 지점을 경계로 삼는다.
     */
    let split = -1;
    for (const m of l.matchAll(/[?.:]\s+/g)) {
      const at = m.index + m[0].length;
      const left = l.slice(0, at), right = l.slice(at);
      if (/[A-Za-z]{4}/.test(left) && !/[가-힣]/.test(left) && /[가-힣]/.test(right)) {
        split = at;
        break;
      }
    }
    if (split > 0) {
      en.push(l.slice(0, split).trim());
      ko.push(l.slice(split).trim());
      continue;
    }

    en.push(l);
  }

  return { question: clean(en.join(" ")), korean: clean(ko.join(" ")), options, objCount };
}

export function parseExam(text, picAnchors = []) {
  const offset = stripHeader(text);
  const body = text.slice(offset);

  /*
   * 줄 첫머리의 문항 번호. 시험지마다 표기가 제각각이라 넓게 잡는다.
   *   "1. text"  "24.The"(공백없음)  "5.(T)A"  "2  Certain"(마침표없음)
   * 그림 앵커가 번호 앞에 붙는 경우도 있다 ([[OBJ]]6. …).
   */
  /*
   * 마침표나 괄호가 있으면 뒤에 무엇이 오든 문항으로 본다.
   * 예전에는 "숫자로 시작하면 안 됨" 조건을 걸어서
   *   21. 2mm crack found on welds ...
   *   24. 1/8 in. round indications ...
   * 처럼 본문이 치수로 시작하는 문항을 통째로 놓쳤다.
   * 구분자가 공백뿐일 때만(마침표 없음) 숫자 시작을 배제한다 — "10  mm" 오검출 방지.
   */
  const marks = [...body.matchAll(
    /(?:^|\n)[ \t]*(?:\[\[OBJ\]\][ \t]*)*(\d{1,2})(?:[.)][ \t]*(?=\S)|[ \t]{2,}(?=[^\s\d]))/g
  )];

  /*
   * 번호가 늘어나는 것만 채택해 본문 속 숫자 오검출을 걸러낸다.
   * 다만 한 문항의 번호를 놓쳤을 때 그 뒤가 통째로 날아가지 않도록
   * 2칸까지의 건너뜀은 허용한다.
   */
  const kept = [];
  let expect = 1;
  for (const m of marks) {
    const n = Number(m[1]);
    if (n >= expect && n <= expect + 2) { kept.push(m); expect = n + 1; }
  }

  return kept.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < kept.length ? kept[i + 1].index : body.length;
    // 이 문항 구간에 걸린 그림들 (picAnchors 위치는 원본 text 기준)
    const images = picAnchors
      .filter((a) => a.pos - offset > start && a.pos - offset <= end)
      .map((a) => a.binId);
    return { no: Number(m[1]), images, ...parseBody(body.slice(start, end)) };
  });
}
