/*
 * 규칙 문서(Markdown)를 Word(.docx) 로 옮긴다.
 *
 * 한글(HWP)은 이 환경에서 바로 만들 수 없다. 한글이 .docx 를 그대로 열고
 * 표도 표로 살아 들어가므로, Word 로 만들어 주면 열어서 .hwp 로 저장하면
 * 된다.
 *
 * 옮기는 것
 *   # ## ###   제목
 *   | … |      표 (머리줄 굵게, 칸 너비를 글자 수에 맞춰 나눔)
 *   > …        인용 (왼쪽에 세로줄)
 *   ```…```    글자 그대로 (고정폭)
 *   1. / -     번호 목록, 글머리표
 *   **굵게**   굵게
 *   `코드`     고정폭
 *   ---        쪽 나눔
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, convertMillimetersToTwip,
} = require("docx");

/* A4 세로. 여백 20mm */
const PAGE_W = convertMillimetersToTwip(210);
const MARGIN = convertMillimetersToTwip(20);
const BODY_W = PAGE_W - MARGIN * 2;

const FONT = "맑은 고딕";
const MONO = "D2Coding";

/* ---- 줄 안의 꾸밈 (**굵게**, `코드`) ---- */

function runs(text, opt = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;

  const push = (s, extra) => {
    if (!s) return;
    out.push(new TextRun({
      text: s,
      font: extra && extra.mono ? MONO : FONT,
      size: opt.size || 20,
      bold: (extra && extra.bold) || opt.bold || false,
      color: opt.color,
    }));
  };

  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) push(t.slice(2, -2), { bold: true });
    else push(t.slice(1, -1), { mono: true });
    last = m.index + t.length;
  }
  push(text.slice(last));

  return out.length ? out : [new TextRun({ text: "", font: FONT, size: opt.size || 20 })];
}

/* 표 칸 안에서는 <br> 을 줄바꿈으로 본다 */
function cellParas(text) {
  return String(text).split(/<br\s*\/?>/i).map((line) =>
    new Paragraph({ children: runs(line.trim(), { size: 18 }), spacing: { before: 20, after: 20 } })
  );
}

/* ---- 표 ---- */

function makeTable(rows) {
  const head = rows[0];
  const cols = head.length;

  /* 칸 너비를 글자 수에 맞춰 나눈다. 너무 좁아지지 않게 최소치를 둔다 */
  const weight = head.map((_, i) => {
    let w = 0;
    for (const r of rows) w = Math.max(w, String(r[i] || "").replace(/<br\s*\/?>/gi, " ").length);
    return Math.max(4, Math.min(w, 40));
  });
  const total = weight.reduce((a, b) => a + b, 0);
  const widths = weight.map((w) => Math.floor((BODY_W * w) / total));
  widths[cols - 1] = BODY_W - widths.slice(0, -1).reduce((a, b) => a + b, 0);

  const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const trs = rows.map((cells, ri) =>
    new TableRow({
      tableHeader: ri === 0,
      children: Array.from({ length: cols }, (_, ci) =>
        new TableCell({
          width: { size: widths[ci], type: WidthType.DXA },
          borders,
          shading: ri === 0 ? { type: ShadingType.CLEAR, fill: "EFEFEF" } : undefined,
          margins: { top: 60, bottom: 60, left: 90, right: 90 },
          children: ri === 0
            ? [new Paragraph({ children: runs(String(cells[ci] || ""), { size: 18, bold: true }) })]
            : cellParas(cells[ci] || ""),
        })
      ),
    })
  );

  return new Table({
    columnWidths: widths,
    width: { size: BODY_W, type: WidthType.DXA },
    rows: trs,
  });
}

/* ---- Markdown 읽기 ---- */

const splitRow = (line) =>
  line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((s) => s.trim());

const isSep = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

function convert(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* 쪽 나눔 */
    if (/^---+\s*$/.test(line)) {
      out.push(new Paragraph({ children: [new PageBreak()] }));
      i++;
      continue;
    }

    /* 제목 */
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(new Paragraph({
        children: runs(h[2], { size: [30, 26, 22, 20][lvl - 1], bold: true, color: "003B73" }),
        heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][lvl - 1],
        spacing: { before: lvl === 1 ? 320 : 240, after: 120 },
      }));
      i++;
      continue;
    }

    /* 글자 그대로 */
    if (/^```/.test(line)) {
      i++;
      const buf = [];
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      for (const s of buf) {
        out.push(new Paragraph({
          children: [new TextRun({ text: s || " ", font: MONO, size: 16 })],
          spacing: { before: 0, after: 0 },
          shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
        }));
      }
      out.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      continue;
    }

    /* 표 */
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const rows = [splitRow(line)];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(makeTable(rows));
      out.push(new Paragraph({ text: "", spacing: { after: 160 } }));
      continue;
    }

    /* 인용 */
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      const text = buf.join(" ").replace(/\s+/g, " ").trim();
      if (text) {
        out.push(new Paragraph({
          children: runs(text, { size: 18, color: "444444" }),
          indent: { left: 240 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: "003B73", space: 8 } },
          spacing: { before: 80, after: 160 },
        }));
      }
      continue;
    }

    /* 번호 목록 · 글머리표 */
    const li = line.match(/^(\s*)(\d+\.|[-*])\s+(.*)$/);
    if (li) {
      const deep = Math.floor(li[1].length / 2);
      const mark = /^\d/.test(li[2]) ? li[2] : "·";
      out.push(new Paragraph({
        children: runs(mark + " " + li[3]),
        indent: { left: 240 + deep * 240, hanging: 240 },
        spacing: { before: 30, after: 30 },
      }));
      i++;
      continue;
    }

    /* 빈 줄 */
    if (!line.trim()) {
      out.push(new Paragraph({ text: "", spacing: { after: 60 } }));
      i++;
      continue;
    }

    /* 보통 글. 이어지는 줄을 한 문단으로 묶는다 */
    const buf = [line];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !/^[#>|`-]/.test(lines[i]) && !/^\s*(\d+\.|[-*])\s/.test(lines[i])
    ) buf.push(lines[i++]);

    out.push(new Paragraph({
      children: runs(buf.join(" ").replace(/\s+/g, " ").trim()),
      spacing: { before: 60, after: 60, line: 300 },
      alignment: AlignmentType.JUSTIFIED,
    }));
  }

  return out;
}

/* ---- 굽기 ---- */

const files = process.argv.slice(2);
if (!files.length) {
  console.error("쓰임 : node tools/md2docx.cjs <파일.md> …");
  process.exit(1);
}

(async () => {
  for (const f of files) {
    const md = fs.readFileSync(f, "utf8");

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: FONT, size: 20 } },
        },
      },
      sections: [{
        properties: {
          page: { margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
        },
        children: convert(md),
      }],
    });

    const out = f.replace(/\.md$/i, ".docx");
    fs.writeFileSync(out, await Packer.toBuffer(doc));
    console.log("만듦  " + path.basename(out) + "  " +
      (fs.statSync(out).size / 1024).toFixed(0) + "KB");
  }
})();
