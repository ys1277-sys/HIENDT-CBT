/*
 * 절차서 hwp 를 앱이 읽을 수 있는 꼴로 바꾼다.
 *
 * D:/Visual Studio Code/절차서/*.hwp 를 읽어
 * public/data/procedures/ 에 문서 json 과 그림을 쓰고 index.json 을 갱신한다.
 *
 * 원본 그대로 옮긴다
 * ------------------
 * 표는 표로, 그림은 문서에 놓인 차례대로 싣는다. 글만 뽑으면
 * 개정이력·결재란이 "2" "2024.01.02" "H. H. KIM" 같은 조각으로 흩어지고
 * 합격기준 표도 못 읽는다.
 *
 * 영문 다음 한글
 * --------------
 * 원본 본문은 1줄 2칸 표다. 왼쪽 칸이 영문 전체, 오른쪽 칸이 한글 전체다.
 * 그대로 두면 영문을 다 읽은 뒤에야 한글이 나오고, 2.0 REFERENCES 같은
 * 항목이 두 번 나오는 것처럼 보인다.
 *
 * 항목 번호로 갈라 1.0 영문 다음 1.0 한글, 2.0 영문 다음 2.0 한글로 엮는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readRich } from "./hwprich.mjs";
import { bmpToPng } from "./bmp2png.mjs";
import { pcxToPng, isPcx } from "./pcx2png.mjs";
import { wmfToPng, isWmf } from "./wmf2png.mjs";
import { oleToImage, isOle } from "./ole2png.mjs";

const SRC = "D:/Visual Studio Code/절차서";
const OUT = "D:/Visual Studio Code/HIENDT-CBT/public/data/procedures";

/*
 * 문서번호에서 과목을 못 읽는 것만 손으로 이어 준다.
 * 왼쪽이 우리가 가진 문서번호, 오른쪽이 문항이 부르는 이름이다.
 *
 * 나머지는 앱이 과목으로 찾는다(src/procedures.js). 문항은 ASME Sec.Ⅲ
 * 용(N21), Sec.Ⅷ 용(P11), API 6A 용(P6A) 을 따로 부르는데, 우리가 받은
 * 것은 과목마다 한 편씩이다. 갈래를 따지면 MT 는 14문항 가운데 5문항만
 * 열린다. 과목만 맞으면 그것을 연다.
 */
const ALIAS = {
  "HIE-NDT-TOFD-U09": ["HIE-NDT-P11"],
};

/* 브라우저가 그대로 그리는 형식. 나머지는 아래에서 바꿔 싣는다 */
const DRAWABLE = new Set(["jpg", "png", "gif", "bmp"]);
const EXT = { jpg: "jpg", png: "png", gif: "gif", bmp: "bmp" };

/*
 * 너무 작은 그림은 뺀다.
 *
 * 글머리표나 서명 도장 조각이 15x22 같은 크기로 들어 있다. 본문에 끼면
 * 뜻 없는 얼룩으로만 보인다. 도해는 이보다 훨씬 크다.
 */
const MIN_SIDE = 40;

/*
 * 원본이 영문뿐인 절차서에 붙일 한글.
 *
 * TOFD 는 본문 508줄 가운데 한글이 19줄뿐이고 그것도 표지·결재란이다.
 * 다른 절차서와 달리 영문·한글 2칸 짜임이 아예 없어 엮을 것이 없다.
 * 그래서 없던 한글을 지어 붙인다. tools/tofd-ko.mjs 가 원문이고
 * tools/apply-tofd-ko.mjs 가 영문 줄과 짝지어 이 파일을 만든다.
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

/*
 * 영문 줄 다음에 한글 줄을 끼운다. 다른 절차서와 같은 모양이 된다.
 * 제목이면 한글도 제목으로 둔다. 한쪽만 굵으면 짝이 어긋나 보인다.
 */
function weaveKo(blocks, ko) {
  const out = [];

  for (const b of blocks) {
    out.push(b);

    if (b.t !== "p" && b.t !== "h") continue;

    const s = String(b.s || "").replace(/\s+/g, " ").trim();
    const t = ko[s];
    if (t) out.push({ ...b, s: t });
  }

  return out;
}

/*
 * 표지 로고가 두 번 나오는 것을 한 번으로 줄인다.
 *
 * 표지 첫머리 표 안에 회사 로고가 들어 있는데, 그 로고가 표 밖에도
 * 한 번 더 딸려 나온다. 절차서를 열면 로고만 덩그러니 뜬 뒤 표지가
 * 나오고 거기에 또 로고가 있다. 일곱 편이 다 그렇다.
 *
 * 맨 앞 덩이가 그림이고 바로 뒤 표 안에 같은 그림이 있을 때만 뺀다.
 * 본문 도해는 건드리지 않는다.
 */
function dropLooseCoverLogo(blocks) {
  if (blocks.length < 2) return blocks;
  if (blocks[0].t !== "img" || blocks[1].t !== "table") return blocks;

  const src = blocks[0].src;
  let found = false;

  (function look(bs) {
    for (const b of bs) {
      if (b.t === "img" && b.src === src) { found = true; return; }
      if (b.t !== "table") continue;
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") look(c.blocks);
        }
      }
    }
  })([blocks[1]]);

  return found ? blocks.slice(1) : blocks;
}

/* PNG·JPG 머리에서 크기를 읽는다 */
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

const HANGUL = /[가-힣]/;
const LATIN = /[A-Za-z]/;

/*
 * 항목 번호. "1.0 SCOPE" "4.2.1 Application" "6.11.1.2 …"
 *
 * 예전에는 세 자리까지만 봤다. 그러면 6.11.1.1 6.11.1.2 6.11.1.3 이
 * 모두 열쇠 6.11.1 로 뭉개져, 영문과 한글을 짝지을 때 첫 것만 남고
 * 나머지가 사라졌다. 네 자리까지 본다.
 */
const SECTION = /^(\d{1,2}\.\d{1,2}(?:\.\d{1,2}){0,2})[\s.]/;

/* ---- 표지에서 문서 정보 읽기 ---- */

/* 덩이 나무를 글로 눌러 본다. 표지 읽기에만 쓴다 */
function flatten(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "p") out.push(b.s);
    else if (b.t === "table") {
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") flatten(c.blocks, out);
        }
      }
    }
  }
  return out;
}

function readCover(lines) {
  const out = { code: "", rev: "", date: "", subject: "", subjectKo: "" };

  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    const l = lines[i];

    if (!out.code && /^Document\s*No\.?$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).find((s) => /HIE/i.test(s));
      if (next) out.code = next.replace(/\s*-\s*/g, "-").replace(/\s+/g, "").toUpperCase();
    }
    if (!out.rev) {
      const m = l.match(/^Revision\s*No\.?\s*(\d+)/i);
      if (m) out.rev = `Rev.${m[1]}`;
      else if (/^Revision\s*No\.?$/i.test(l)) {
        const next = lines.slice(i + 1, i + 4).find((s) => /^\d+$/.test(s));
        if (next) out.rev = `Rev.${next}`;
      }
    }
    if (!out.date && /^Revision\s*Date/i.test(l)) {
      const m = l.match(/(\d{4}\s*[.\-]\s*\d{1,2}\s*[.\-]\s*\d{1,2})/);
      if (m) out.date = m[1];
      else {
        const next = lines.slice(i + 1, i + 4).find((s) => /\d{4}\s*[.\-]/.test(s));
        if (next) out.date = next;
      }
    }
    /*
     * 제목은 표 칸 안에서 줄이 나뉜다.
     *   Subject
     *   NDE Personnel Qualification and
     *   Certification Procedure
     * 첫 줄만 쓰면 "NDE Personnel Qualification and" 로 잘린다.
     */
    if (!out.subject && /^Subject$/i.test(l)) {
      const parts = [];
      for (let k = i + 1; k < Math.min(i + 6, lines.length); k++) {
        const s = lines[k];
        if (!s) continue;
        if (/^(Issued|Dep'?t\.?|Page\b|TABLE OF CONTENTS)/i.test(s)) break;
        if (HANGUL.test(s)) break;
        parts.push(s);
      }
      if (parts.length) out.subject = parts.join(" ");
    }

    /* 한글 제목은 결재란 아래에 따로 있다 */
    if (!out.subjectKo && /(절차서|지침서)\s*$/.test(l) && l.length <= 40) {
      out.subjectKo = l;
    }
  }
  return out;
}

/* ---- 영문 다음 한글로 엮기 ---- */

function splitSections(blocks) {
  const out = [];
  let cur = { key: "", blocks: [] };
  out.push(cur);

  for (const b of blocks) {
    const m = b.t === "p" && b.s.match(SECTION);
    if (m) {
      cur = { key: m[1], blocks: [] };
      out.push(cur);
    }
    cur.blocks.push(b);
  }
  return out.filter((s) => s.blocks.length);
}

const glyphCount = (blocks, re) =>
  flatten(blocks).join(" ").split("").filter((c) => re.test(c)).length;

/*
 * 1줄 2칸 표에서 왼쪽이 영문, 오른쪽이 한글이면 항목별로 엮는다.
 * 짝이 안 맞는 항목은 있는 대로 이어 붙인다.
 */
function weave(table) {
  if (table.rows !== 1 || table.cols !== 2) return null;

  const left = table.grid[0][0];
  const right = table.grid[0][1];
  if (!left || left === "covered" || !right || right === "covered") return null;

  const en = left.blocks;
  const ko = right.blocks;
  if (en.length < 3 || ko.length < 3) return null;

  /* 왼쪽은 영문이 많고 오른쪽은 한글이 많아야 한다 */
  if (glyphCount(en, LATIN) < glyphCount(en, HANGUL)) return null;
  if (glyphCount(ko, HANGUL) < glyphCount(ko, LATIN)) return null;

  const enSec = splitSections(en);
  const koSec = splitSections(ko);
  if (enSec.length < 2) return null;

  /*
   * 한글 항목을 열쇠별로 줄 세운다.
   *
   * 예전에는 열쇠 하나에 한 항목만 담아, 같은 번호가 두 번 나오면
   * 뒤엣것이 통째로 사라졌다. 줄로 담아 앞에서부터 하나씩 꺼낸다.
   */
  const koQueue = new Map();
  for (const s of koSec) {
    if (!s.key) continue;
    if (!koQueue.has(s.key)) koQueue.set(s.key, []);
    koQueue.get(s.key).push(s);
  }

  const taken = new Set();
  const out = [];

  /*
   * 머리.
   *
   * 본문은 쪽마다 2칸 표로 나뉘어 있어, 한글 칸이 앞 쪽에서 이어지는
   * 줄로 시작할 때가 있다. 그 줄에는 항목 번호가 없다. 예전에는
   * 이것을 통째로 버려 "(d) 검사 결과" 같은 줄이 사라졌다.
   * 영문 머리 다음에 그대로 놓는다.
   */
  let i = 0;

  if (enSec[0] && !enSec[0].key) {
    out.push(...enSec[0].blocks);
    i = 1;
  }

  for (const s of koSec) {
    if (s.key) break;
    out.push(...s.blocks);
    taken.add(s);
  }

  for (; i < enSec.length; i++) {
    const s = enSec[i];
    out.push(...s.blocks);

    const q = koQueue.get(s.key);
    if (q && q.length) {
      const k = q.shift();
      taken.add(k);
      out.push(...k.blocks);
    }
  }

  /*
   * 짝을 못 찾은 한글은 원본 차례 그대로 뒤에 붙인다.
   *
   * 한글이 "5.7.2항에 기술된" 처럼 쓰고 영문이 "5.7.2 Except as" 로
   * 쓰면 열쇠가 어긋난다. 자리는 조금 밀려도 글은 살린다.
   */
  for (const s of koSec) {
    if (taken.has(s)) continue;
    out.push(...s.blocks);
  }

  return out;
}

/*
 * 제목 줄에 표시를 단다.
 *
 * 번호가 붙었다고 다 제목이 아니다. 이 절차서는 본문 문단에도 번호를 단다.
 *
 *   1.0 SCOPE                                        <- 제목
 *   1.1 This procedure is to govern the continuous …  <- 본문
 *   4.1 Examination Medium                            <- 제목
 *
 * 길이로만 가르면 안 된다. 같은 1.2 인데 영문은 길어서 본문, 한글은
 * 짧아서 제목이 되어 한쪽만 굵고 파랗게 나왔다.
 *
 * 가름
 *   N.0 은 언제나 제목이다 (1.0 SCOPE, 2.0 REFERENCES)
 *   그 밖에는 짧고 문장으로 끝나지 않아야 제목이다
 */
const ENDS_SENTENCE = /[.。]\s*$|다\.?\s*$|[,、]\s*$/;

/*
 * 한 자리 항목. "1. Scope" "10. DOCUMENTATION"
 *
 * TOFD 절차서는 1.0 이 아니라 1. 로 번호를 단다. 두 자리만 보다가
 * 제목을 하나도 못 잡아, 그 문서만 굵은 줄 없이 밋밋했다.
 * 뒤에 반드시 빈칸과 글자가 와야 한다. 그래야 "2.25 MHz" 같은
 * 숫자를 제목으로 잘못 잡지 않는다.
 */
const ONE_LEVEL = /^(\d{1,2})\.\s+\S/;

function sectionKey(s) {
  const m = s.match(SECTION);
  if (m) return m[1];

  const one = s.match(ONE_LEVEL);
  return one ? one[1] : null;
}

function isHeading(s) {
  const key = sectionKey(s);
  if (!key) return false;

  /* 1.0 2.0 처럼 큰 항목 */
  if (/^\d{1,2}\.0(?:[\s.]|$)/.test(s)) return true;

  return s.length <= 55 && !ENDS_SENTENCE.test(s);
}

function markHeadings(blocks) {
  return blocks.map((b) => {
    if (b.t !== "p" || !isHeading(b.s)) return b;
    const key = sectionKey(b.s);
    return { t: "h", level: key.split(".").length >= 3 ? 3 : 2, s: b.s };
  });
}

/* ---- 굽기 ---- */

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const table = {};
const report = [];
const failed = [];
let shrunk = 0;
let tiny = 0;
let rescued = 0;

for (const name of fs.readdirSync(SRC).filter((f) => /\.hwp$/i.test(f))) {
  const file = path.join(SRC, name);

  let doc;
  try {
    doc = readRich(file);
  } catch (e) {
    report.push(`${name}: 읽기 실패 — ${e.message}`);
    continue;
  }

  const cover = readCover(flatten(doc.blocks));
  const code = cover.code || path.parse(name).name.toUpperCase();

  /* 그림을 내보낸다. 파일 이름은 BinData 번호로 건다 */
  const figures = [];
  const srcOf = new Map();

  for (const im of doc.images) {
    let data = im.data;
    let ext = EXT[im.kind];

    /*
     * 브라우저가 못 그리는 형식은 바꿔 싣는다.
     *
     * 예전에는 통째로 뺐다. 그래서 TOFD 절차서만 도해 18장이 비었다.
     * 열어 보니 되살릴 수 있는 것들이었다.
     *
     *   PCX 11장   표지 로고. 아홉 문서에 같은 것이 들어 있다
     *   WMF 18장   벡터가 아니라 스캔 그림을 WMF 껍데기에 싼 것
     *   OLE  3장   다른 프로그램에서 붙여 넣은 그림. 속에 BMP·WMF
     */
    if (!DRAWABLE.has(im.kind)) {
      let got = null;

      if (isPcx(im.data)) {
        const png = pcxToPng(im.data);
        if (png) got = { ext: "png", data: png };
      } else if (isWmf(im.data)) {
        const png = wmfToPng(im.data);
        if (png) got = { ext: "png", data: png };
      } else if (isOle(im.data)) {
        got = oleToImage(im.data);
      }

      if (!got) {
        failed.push(`${code} binId ${im.binId}: ${im.kind} 를 못 바꿈 (뺌)`);
        continue;
      }

      shrunk += Math.max(0, im.data.length - got.data.length);
      rescued++;
      data = got.data;
      ext = got.ext;
    }

    /*
     * hwp 안의 BMP 는 압축이 하나도 안 돼 있다. 절차서 9편에서
     * 79장이 80MB 였다. PNG 로 바꾼다.
     */
    if (im.kind === "bmp") {
      const png = bmpToPng(im.data);
      if (png) {
        shrunk += im.data.length - png.length;
        data = png;
        ext = "png";
      } else {
        failed.push(`${code} binId ${im.binId}: BMP 를 못 바꿈 (그대로 둠)`);
      }
    }

    /* 글머리표·도장 조각은 본문에 얼룩으로만 보인다 */
    const [w, h] = pixelSize(data);
    if (w && h && (w < MIN_SIDE || h < MIN_SIDE)) {
      tiny++;
      continue;
    }

    const fname = `${code}_${im.binId}.${ext}`;
    fs.writeFileSync(path.join(OUT, fname), data);
    srcOf.set(im.binId, fname);
    figures.push(fname);
  }

  /* 덩이를 다듬는다 */
  let woven = 0;

  function convert(blocks) {
    const out = [];

    for (const b of blocks) {
      if (b.t === "p") { out.push(b); continue; }

      if (b.t === "img") {
        const src = srcOf.get(b.binId);
        if (src) out.push({ t: "img", src });
        continue;
      }

      if (b.t !== "table") continue;

      /* 본문이 담긴 2칸 표는 항목별로 엮어 편다 */
      const w = weave(b);
      if (w) {
        woven++;
        out.push(...markHeadings(convert(w)));
        continue;
      }

      out.push({
        t: "table",
        rows: b.rows,
        cols: b.cols,
        grid: b.grid.map((row) =>
          row.map((c) =>
            !c || c === "covered" ? c : { colSpan: c.colSpan, rowSpan: c.rowSpan, blocks: convert(c.blocks) }
          )
        ),
      });
    }
    return out;
  }

  let blocks = dropLooseCoverLogo(markHeadings(convert(doc.blocks)));

  const ko = readKo(name);
  if (ko) blocks = weaveKo(blocks, ko);

  const payload = {
    code,
    title: cover.subject || code,
    titleKo: cover.subjectKo,
    rev: cover.rev,
    date: cover.date,
    source: name,
    blocks,
  };

  fs.writeFileSync(path.join(OUT, `${code}.json`), JSON.stringify(payload) + "\n", "utf8");

  const entry = {
    title: cover.subject || code,
    titleKo: cover.subjectKo,
    rev: cover.rev,
    doc: `${code}.json`,
  };
  table[code] = entry;
  for (const alias of ALIAS[code] || []) table[alias] = { ...entry };

  const tables = blocks.filter((b) => b.t === "table").length;
  const imgs = blocks.filter((b) => b.t === "img").length;

  report.push(
    `${name.padEnd(16)} -> ${code.padEnd(20)} ${(cover.rev || "").padEnd(6)}` +
      ` 덩이 ${String(blocks.length).padStart(4)}  표 ${String(tables).padStart(2)}` +
      `  그림 ${String(imgs).padStart(2)}/${String(figures.length).padStart(2)}  엮음 ${woven}` +
      ((ALIAS[code] || []).length ? `  (별칭: ${ALIAS[code].join(", ")})` : "")
  );
}

const manifest = {
  _읽어보기:
    "tools/build-procedures.mjs 가 만든 파일입니다. 손으로 고치지 말고 절차서 hwp 를 고친 뒤 다시 돌리세요.",
  procedures: table,
};

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(report.join("\n"));
console.log(`\n등록한 이름 ${Object.keys(table).length}개`);
if (shrunk) console.log(`BMP 를 PNG 로 바꿔 ${(shrunk / 1048576).toFixed(1)} MB 를 줄였다`);
if (tiny) console.log(`너무 작아 뺀 그림 ${tiny}장 (글머리표·도장 조각)`);
if (rescued) console.log(`PCX·WMF·OLE 에서 되살린 그림 ${rescued}장`);
if (failed.length) console.log("\n" + failed.join("\n"));
