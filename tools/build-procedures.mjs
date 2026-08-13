/*
 * 절차서 hwp 를 앱이 읽을 수 있는 꼴로 바꾼다.
 *
 * D:/Visual Studio Code/절차서/*.hwp 를 읽어
 * public/data/procedures/ 에 문서 json 과 그림을 쓰고 index.json 을 갱신한다.
 *
 * 왜 그림이 아니라 글인가
 * ----------------------
 * hwp 를 쪽 그림으로 뜨려면 한글 프로그램이 있어야 한다. 대신 본문 글을
 * 그대로 뽑아 문서로 만든다. 응시자가 절차서에서 찾는 것은 수치와
 * 기준이라 글이 핵심이고, 글이면 화면에서 찾기도 훨씬 낫다.
 *
 * 그림 자리
 * ---------
 * 본문의 [[OBJ]] 마커에는 표도 섞여 있어(OBJ 수 > 그림 수) 몇 번째
 * 마커가 몇 번째 그림인지 못 가린다. 자리를 억지로 맞추면 엉뚱한 데
 * 붙으니, 그림은 문서 끝에 차례대로 모아 둔다.
 *
 * 표지와 결재란
 * -------------
 * 앞쪽 표지·개정이력·결재란은 칸이 하나씩 줄로 떨어져 나와 읽기 어렵다.
 * 본문(1.0 SCOPE)부터 싣고, 표지에서 뽑은 문서번호·개정·제목만 머리에 둔다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";
import { bmpToPng } from "./bmp2png.mjs";

const SRC = "D:/Visual Studio Code/절차서";
const OUT = "D:/Visual Studio Code/HIENDT-CBT/public/data/procedures";

/*
 * 문항이 가리키는 이름과 절차서 문서번호가 다른 것이 있다.
 * 여기서 손으로 이어 준다. 왼쪽이 문항이 쓰는 이름이다.
 *
 *  HIE-NDT-P11  TOFD 문항이 이 이름으로 부른다. 실제 문서는 TOFD-U09 다.
 */
const ALIAS = {
  "HIE-NDT-TOFD-U09": ["HIE-NDT-P11"],
};

/* 브라우저가 못 그리는 형식은 뺀다. pcx 는 못 그리고 bin 은 정체 불명이다 */
const DRAWABLE = new Set(["jpg", "png", "gif", "bmp"]);
const EXT = { jpg: "jpg", png: "png", gif: "gif", bmp: "bmp" };

const clean = (s) =>
  String(s).replace(/\[\[OBJ\]\]/g, " ").replace(/\u0000/g, "").replace(/\s+/g, " ").trim();

/* "HIE - NDT - MT - P11" -> "HIE-NDT-MT-P11" */
const tightCode = (s) => clean(s).replace(/\s*-\s*/g, "-").toUpperCase();

/* 표지에서 문서번호·개정·제목을 읽는다 */
function readCover(lines) {
  const out = { code: "", rev: "", date: "", subject: "" };

  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const l = clean(lines[i]);
    if (!l) continue;

    if (!out.code && /^Document\s*No\.?$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).map(clean).find(Boolean);
      if (next && /HIE/i.test(next)) out.code = tightCode(next);
    }
    if (!out.rev && /^Revision\s*No\.?/i.test(l)) {
      const m = l.match(/Revision\s*No\.?\s*(\d+)/i);
      if (m) out.rev = `Rev.${m[1]}`;
      else {
        const next = lines.slice(i + 1, i + 4).map(clean).find(Boolean);
        if (next && /^\d+$/.test(next)) out.rev = `Rev.${next}`;
      }
    }
    if (!out.date && /^Revision\s*Date$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).map(clean).find(Boolean);
      if (next && /\d{4}/.test(next)) out.date = next;
    }
    if (!out.subject && /^Subject$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).map(clean).find(Boolean);
      if (next) out.subject = next;
    }
  }
  return out;
}

/* 본문 시작 자리. "1.0 SCOPE" 또는 "1.0 개요" */
function bodyStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*1\.0\s+(SCOPE|개요)/i.test(clean(lines[i]))) return i;
  }
  return 0;
}

/* 제목 줄인지. "1.0 SCOPE" "4.1.1 Wet Particles" */
const isHeading = (l) => /^\d{1,2}\.\d{1,2}(\.\d{1,2})?\s+\S/.test(l) && l.length < 90;

function toBlocks(lines) {
  const blocks = [];

  for (const raw of lines) {
    const l = clean(raw);
    if (!l) continue;
    if (/^HIE Form No\./i.test(l)) continue;

    const level = isHeading(l) ? (l.match(/^\d{1,2}\.\d{1,2}\.\d{1,2}/) ? 3 : 2) : 0;
    blocks.push(level ? { t: "h", level, s: l } : { t: "p", s: l });
  }
  return blocks;
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
    doc = readHwp(file);
  } catch (e) {
    report.push(`${name}: 읽기 실패 — ${e.message}`);
    continue;
  }

  const lines = doc.text.split("\n");
  const cover = readCover(lines);
  const code = cover.code || path.parse(name).name.toUpperCase();

  const start = bodyStart(lines);
  const blocks = toBlocks(lines.slice(start));

  /* 그림을 내보낸다 */
  const figures = [];
  let n = 0;
  for (const im of doc.images) {
    if (!DRAWABLE.has(im.kind)) continue;

    let data = im.data;
    let ext = EXT[im.kind];

    /*
     * hwp 안의 BMP 는 압축이 하나도 안 돼 있다. 절차서 9편에서
     * 79장이 80MB 였다. 그대로 두면 절차서를 열 때마다 그만큼
     * 내려받는다. PNG 로 바꾼다.
     */
    if (im.kind === "bmp") {
      const png = bmpToPng(im.data);
      if (png) {
        shrunk += im.data.length - png.length;
        data = png;
        ext = "png";
      } else {
        failed.push(`${code} 그림 ${n + 1}: BMP 를 못 바꿈 (그대로 둠)`);
      }
    }

    n++;
    const fname = `${code}_fig${n}.${ext}`;
    fs.writeFileSync(path.join(OUT, fname), data);
    figures.push(fname);
  }

  const payload = {
    code,
    title: cover.subject || code,
    rev: cover.rev,
    date: cover.date,
    source: name,
    blocks,
    figures,
  };

  fs.writeFileSync(
    path.join(OUT, `${code}.json`),
    JSON.stringify(payload, null, 2) + "\n",
    "utf8"
  );

  const entry = {
    title: cover.subject || code,
    rev: cover.rev,
    doc: `${code}.json`,
  };

  table[code] = entry;
  for (const alias of ALIAS[code] || []) table[alias] = { ...entry };

  report.push(
    `${name.padEnd(16)} -> ${code.padEnd(20)} ${(cover.rev || "").padEnd(6)}` +
      ` 본문 ${String(blocks.length).padStart(4)}덩이  그림 ${String(figures.length).padStart(2)}장` +
      ((ALIAS[code] || []).length ? `  (별칭: ${ALIAS[code].join(", ")})` : "")
  );
}

/* index.json 을 다시 쓴다 */
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
