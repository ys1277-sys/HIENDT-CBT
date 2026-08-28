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
 *   > …        인용 (왼쪽에 세로줄). 빈 > 줄로 문단을 나눈다
 *   ```…```    글자 그대로 (고정폭)
 *   1. / -     번호 목록, 글머리표
 *   **굵게**   굵게
 *   `코드`     고정폭
 *   ---        쪽 나눔
 *   <br>       줄바꿈
 *   &nbsp;     줄바꿈 없는 빈칸
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, convertMillimetersToTwip,
  Footer, PageNumber, NumberFormat,
} = require("docx");

/* A4 세로. 여백 20mm */
const PAGE_W = convertMillimetersToTwip(210);
const MARGIN = convertMillimetersToTwip(20);
const BODY_W = PAGE_W - MARGIN * 2;

const FONT = "맑은 고딕";
const MONO = "D2Coding";

/*
 * HTML 기호를 글자로 되돌린다.
 *
 * Markdown 표는 칸 안에서 줄을 바꾸거나 사이를 벌릴 방법이 없어 &nbsp; 와
 * <br> 을 쓴다. 그대로 두면 Word 에 "&nbsp;" 라는 글자가 그대로 찍힌다.
 * &nbsp; 는 줄바꿈 없는 빈칸(U+00A0)으로 바꾼다.
 */
function unesc(s) {
  return String(s == null ? "" : s)
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/* <br> 로 나뉜 줄들 */
function brLines(s) {
  return unesc(s).split(/<br\s*\/?>/i).map((x) => x.trim());
}

/* ---- 줄 안의 꾸밈 (**굵게**, `코드`) ---- */

function runs(raw, opt) {
  const o = opt || {};
  const text = unesc(raw);
  const out = [];

  const push = (s, kind) => {
    if (!s) return;
    out.push(new TextRun({
      text: s,
      font: kind === "mono" ? MONO : FONT,
      size: o.size || 20,
      bold: kind === "bold" || o.bold || false,
      color: o.color,
    }));
  };

  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;

  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) push(t.slice(2, -2), "bold");
    else push(t.slice(1, -1), "mono");
    last = m.index + t.length;
  }
  push(text.slice(last));

  return out.length ? out : [new TextRun({ text: "", font: FONT, size: o.size || 20 })];
}

/*
 * 표 칸. <br> 이 있으면 줄을 나눈다.
 *
 * 예전에는 본문 칸만 나누고 머리줄은 안 나눠, 머리줄에 "<br>" 이 글자로
 * 찍혔다 ("시각<br>(시작 ~ 종료)").
 */
function cellParas(text, opt) {
  const o = opt || {};
  return brLines(text).map((line) =>
    new Paragraph({
      children: runs(line, { size: 18, bold: o.bold }),
      spacing: { before: 20, after: 20 },
    })
  );
}

/* ---- 표 ---- */

function makeTable(rows) {
  const cols = rows[0].length;

  /* 칸 너비를 글자 수에 맞춰 나눈다. 너무 좁아지지 않게 최소치를 둔다 */
  const weight = rows[0].map((_, i) => {
    let w = 0;
    for (const r of rows) {
      const longest = brLines(r[i] || "").reduce((a, x) => Math.max(a, x.length), 0);
      w = Math.max(w, longest);
    }
    return Math.max(4, Math.min(w, 40));
  });

  const total = weight.reduce((a, b) => a + b, 0);
  const widths = weight.map((w) => Math.floor((BODY_W * w) / total));
  widths[cols - 1] = BODY_W - widths.slice(0, -1).reduce((a, b) => a + b, 0);

  const line = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
  const borders = { top: line, bottom: line, left: line, right: line };

  const trs = rows.map((cells, ri) =>
    new TableRow({
      tableHeader: ri === 0,
      children: Array.from({ length: cols }, (_, ci) =>
        new TableCell({
          width: { size: widths[ci], type: WidthType.DXA },
          borders,
          shading: ri === 0 ? { type: ShadingType.CLEAR, fill: "EFEFEF" } : undefined,
          margins: { top: 60, bottom: 60, left: 90, right: 90 },
          children: cellParas(cells[ci], { bold: ri === 0 }),
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
          children: [new TextRun({ text: unesc(s) || " ", font: MONO, size: 16 })],
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

    /*
     * 인용.
     *
     * 빈 "> " 줄이 문단을 나눈다. 예전에는 전부 한 줄로 이어 붙여
     * "이 규칙에 대하여 이 규칙은 …" 처럼 제목과 본문이 붙어 버렸다.
     */
    if (/^>\s?/.test(line)) {
      const raw = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        raw.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }

      const paras = [];
      let cur = [];
      for (const s of raw) {
        if (!s.trim()) { if (cur.length) { paras.push(cur); cur = []; } }
        else cur.push(s);
      }
      if (cur.length) paras.push(cur);

      const border = {
        left: { style: BorderStyle.SINGLE, size: 12, color: "003B73", space: 8 },
      };

      paras.forEach((p, k) => {
        const text = p.join(" ").replace(/\s+/g, " ").trim();
        for (const sub of brLines(text)) {
          out.push(new Paragraph({
            children: runs(sub, { size: 18, color: "444444" }),
            indent: { left: 240 },
            border,
            spacing: {
              before: k === 0 ? 80 : 40,
              after: k === paras.length - 1 ? 160 : 40,
              line: 280,
            },
          }));
        }
      });
      continue;
    }

    /* 번호 목록 · 글머리표 */
    const li = line.match(/^(\s*)(\d+\.|[-*])\s+(.*)$/);
    if (li) {
      /*
       * 이어지는 줄을 한 항목으로 묶는다. 보통 글과 인용구는 묶고
       * 있었는데 목록만 빠져 있었다. 묶지 않으면
       *
       *   3. … 관리번호를 부여하고 **분리하여
       *      채점**한다.
       *
       * 처럼 굵게 표시가 줄 끝에서 짝을 잃어, Word 로 옮길 때
       * ** 가 글자 그대로 찍혔다.
       */
      const buf = [li[3]];
      i++;
      while (
        i < lines.length && lines[i].trim() &&
        !/^[#>|`]/.test(lines[i]) && !/^---+\s*$/.test(lines[i]) &&
        !/^\s*(\d+\.|[-*])\s/.test(lines[i])
      ) buf.push(lines[i++].trim());

      const deep = Math.floor(li[1].length / 2);
      const mark = /^\d/.test(li[2]) ? li[2] : "·";
      const body = (mark + " " + buf.join(" ")).replace(/\s+/g, " ").trim();

      for (const sub of brLines(body)) {
        out.push(new Paragraph({
          children: runs(sub),
          indent: { left: 240 + deep * 240, hanging: 240 },
          spacing: { before: 30, after: 30 },
        }));
      }
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

    const body = buf.join(" ").replace(/\s+/g, " ").trim();

    for (const sub of brLines(body)) {
      out.push(new Paragraph({
        children: runs(sub),
        spacing: { before: 60, after: 60, line: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    }
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

    /*
     * 바닥글 — 문서번호와 「n / 전체」.
     *
     * 관리본 문서에 쪽 번호가 없으면 한 장이 빠져도 모른다. 상위
     * 절차서 HIE-QP-E01 도 머리글에 "Page of 37" 을 단다. 여기서는
     * 본문 표가 종이 폭을 꽉 채우므로 머리글 대신 바닥글에 둔다.
     *
     * 문서번호는 원고 머리의 표에서 읽는다. 못 찾으면 파일 이름에서
     * 딴다 — 빈 채로 내보내지 않는다.
     */
    const docNo =
      (md.match(/^\|\s*Document No\.?\s*\|\s*([A-Za-z0-9-]+)\s*\|/mi) || [])[1] ||
      (path.basename(f).match(/HIE-[A-Za-z0-9-]+/) || [])[0] ||
      "";

    const footer = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: docNo ? docNo + "      " : "", font: FONT, size: 16, color: "555555" }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "555555" }),
            new TextRun({ text: " / ", font: FONT, size: 16, color: "555555" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "555555" }),
          ],
        }),
      ],
    });

    const doc = new Document({
      styles: { default: { document: { run: { font: FONT, size: 20 } } } },
      sections: [{
        properties: {
          page: {
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
            pageNumbers: { formatType: NumberFormat.DECIMAL },
          },
        },
        footers: { default: footer },
        children: convert(md),
      }],
    });

    const out = f.replace(/\.md$/i, ".docx");
    fs.writeFileSync(out, await Packer.toBuffer(doc));
    console.log("만듦  " + path.basename(out) + "  " +
      (fs.statSync(out).size / 1024).toFixed(0) + "KB");
  }
})();
