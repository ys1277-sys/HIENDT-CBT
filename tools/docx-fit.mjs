/*
 * .docx 의 표가 종이에 들어가는지 어림한다.
 *
 *   node tools/docx-fit.mjs
 *
 * 왜 필요한가
 * -----------
 * 표 한 행이 쪽 경계에서 쪼개지지 않게 cantSplit 을 걸어 두었다. 그런데
 * 어떤 행이 종이 한 쪽보다 높으면 그 행은 어디에도 못 들어가, 워드가
 * 규칙을 어기고 잘라 버리거나 빈 쪽을 만든다.
 *
 * 화면으로 볼 수 없으니 글자 수로 어림한다. 정확한 조판은 아니지만,
 * 「한 쪽을 넘길 만한 행」은 이걸로 걸러진다.
 *
 * 어림하는 법
 * -----------
 *   칸 너비(트윕) → 한 줄에 들어가는 글자 수
 *   글자 수 → 줄 수 → 줄 높이(9pt 글자에 1.35배) → 칸 높이
 *   행 높이 = 그 행에서 가장 높은 칸
 *
 * 우리말은 한 글자가 넓고 영문은 좁다. 넉넉히 잡아 한글 기준으로 센다 —
 * 못 미치는 쪽으로 어림하면 놓친다.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const DIR = "D:/Visual Studio Code/원본자료/시험규칙";
const FILES = [
  "HIE-QP-E02 필기시험 시행 규칙.docx",
  "HIE-QP-E03 자격증 발행 및 관리 규칙.docx",
];

const TW_MM = 1440 / 25.4;          /* 트윕 → mm */
const PAGE_H = 297, MARGIN = 20;
const BODY_H = PAGE_H - MARGIN * 2; /* 257mm */

/* 9pt 글자 한 줄 높이 (1.35배) */
const LINE_MM = 9 * 1.35 * 25.4 / 72;

let worst = 0;
let bad = 0;

for (const f of FILES) {
  const raw = execSync(`unzip -p "${DIR}/${f}" word/document.xml`, {
    maxBuffer: 64 * 1024 * 1024, encoding: "latin1",
  });
  const s = Buffer.from(raw, "latin1").toString("utf8");

  console.log("");
  console.log("══ " + f.replace(".docx", "") + " ══");

  const tables = [...s.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((m) => m[0]);
  const tall = [];

  tables.forEach((t, ti) => {
    const rows = [...t.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((m) => m[0]);

    rows.forEach((r, ri) => {
      const cells = [...r.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);

      let h = 0;
      let widest = "";

      for (const c of cells) {
        /* 속성 차례가 판마다 다르다 — w:type 이 앞에 오기도 한다 */
        const w = +((c.match(/<w:tcW[^/>]*\bw:w="(\d+)"/) || [0, 0])[1]);
        const text = [...c.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join("");
        if (!w) continue;

        /* 칸 안여백 좌우 90트윕씩 뺀다 */
        const mm = (w - 180) / TW_MM;
        /* 9pt 한글 한 글자 ≈ 3.2mm */
        const perLine = Math.max(1, Math.floor(mm / 3.2));

        /* <w:br/> 로 나뉜 줄도 센다 */
        const parts = c.split(/<w:br\/>/).length;
        const lines = Math.max(parts, Math.ceil(text.length / perLine));
        const ch = lines * LINE_MM + 2 * 60 / TW_MM;   /* 위아래 안여백 */

        if (ch > h) { h = ch; widest = text.slice(0, 46); }
      }

      if (h > worst) worst = h;
      if (h > BODY_H * 0.8) tall.push({ ti: ti + 1, ri: ri + 1, h, widest });
    });
  });

  console.log(`  표 ${tables.length}개 · 종이에 쓸 수 있는 높이 ${BODY_H}mm`);

  if (!tall.length) {
    console.log(`  한 쪽의 8할을 넘는 행 없음 — 모든 행이 넉넉히 들어간다`);
  } else {
    bad += tall.length;
    console.log(`  ★ 한 쪽의 8할을 넘는 행 ${tall.length}개`);
    for (const t of tall) {
      console.log(`     표${t.ti} ${t.ri}행  약 ${t.h.toFixed(0)}mm  ${t.widest}`);
    }
  }
}

console.log("");
console.log("-".repeat(66));
console.log(`가장 높은 행 약 ${worst.toFixed(0)}mm / ${BODY_H}mm`);
console.log(
  bad
    ? "★ 쪽을 넘길 수 있는 행이 있다. cantSplit 이 걸려 있어 워드가 빈 쪽을 만들 수 있다"
    : "쪽을 넘길 만한 행이 없다"
);
if (bad) process.exitCode = 1;
