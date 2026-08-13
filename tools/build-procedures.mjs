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

/* 브라우저가 못 그리는 형식은 뺀다. pcx 는 못 그리고 bin 은 정체 불명이다 */
const DRAWABLE = new Set(["jpg", "png", "gif", "bmp"]);
const EXT = { jpg: "jpg", png: "png", gif: "gif", bmp: "bmp" };

const HANGUL = /[가-힣]/;
const LATIN = /[A-Za-z]/;

/* 항목 번호. "1.0 SCOPE" "4.2.1 Application" */
const SECTION = /^(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)[\s.]/;

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
  const out = { code: "", rev: "", date: "", subject: "" };

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
    if (!out.subject && /^Subject$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).find(Boolean);
      if (next) out.subject = next;
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

  const koBy = new Map();
  for (const s of koSec) if (s.key && !koBy.has(s.key)) koBy.set(s.key, s);

  const out = [];
  const used = new Set();

  for (const s of enSec) {
    out.push(...s.blocks);
    const k = koBy.get(s.key);
    if (k && !used.has(s.key)) {
      used.add(s.key);
      out.push(...k.blocks);
    }
  }

  /* 짝을 못 찾은 한글 항목은 뒤에 붙인다 */
  for (const s of koSec) {
    if (s.key && used.has(s.key)) continue;
    if (!s.key && out.length) continue;
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

function isHeading(s) {
  const m = s.match(SECTION);
  if (!m) return false;

  /* 1.0 2.0 처럼 큰 항목 */
  if (/^\d{1,2}\.0(?:[\s.]|$)/.test(s)) return true;

  return s.length <= 55 && !ENDS_SENTENCE.test(s);
}

function markHeadings(blocks) {
  return blocks.map((b) => {
    if (b.t !== "p" || !isHeading(b.s)) return b;
    const key = b.s.match(SECTION)[1];
    return { t: "h", level: key.split(".").length >= 3 ? 3 : 2, s: b.s };
  });
}

/* ---- 굽기 ---- */

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const table = {};
const report = [];
const failed = [];
let shrunk = 0;

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
    if (!DRAWABLE.has(im.kind)) continue;

    let data = im.data;
    let ext = EXT[im.kind];

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

  const blocks = markHeadings(convert(doc.blocks));

  const payload = {
    code,
    title: cover.subject || code,
    rev: cover.rev,
    date: cover.date,
    source: name,
    blocks,
  };

  fs.writeFileSync(path.join(OUT, `${code}.json`), JSON.stringify(payload) + "\n", "utf8");

  const entry = { title: cover.subject || code, rev: cover.rev, doc: `${code}.json` };
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
if (failed.length) console.log("\n" + failed.join("\n"));
