/*
 * 발표자료를 만든다 — 한쇼·파워포인트에서 열어 고칠 수 있는 .pptx.
 *
 *   node tools/make-deck.cjs
 *
 * 왜 pptx 인가
 * ------------
 * 앞서 HTML 과 PDF 로 두 번 드렸는데 둘 다 발표자가 손댈 수 없는 것이었다.
 * 발표자료는 발표하는 사람이 고쳐 가며 쓰는 것이다. 열어서 글자를 바꾸고
 * 장을 빼고 순서를 옮길 수 있어야 한다.
 *
 * 무엇을 지키나
 * -------------
 *   한 장에 한 가지만 말한다. 읽는 문서가 아니라 보는 화면이다.
 *   글꼴은 맑은 고딕 하나로 간다. 이 컴퓨터에도 발표장 컴퓨터에도 있다.
 *   숫자는 전부 코드와 규정에서 뽑은 것이다. 지어낸 값이 없다.
 *   제목 밑줄과 색 띠는 쓰지 않는다.
 */
const pptx = require("pptxgenjs");

/* ── 색 ──────────────────────────────────────
   회사 파랑을 축으로 삼는다. 로고·워터마크·화면·문서가 모두 이 색이라
   발표자료만 다른 색을 쓰면 따로 논다. 짙은 남빛을 바탕으로 깔아
   파랑이 살아나게 한다. ────────────────────── */
const INK   = "0B2C46";   /* 짙은 남빛 — 표지와 간지 바탕 */
const BLUE  = "0179CF";   /* 회사 파랑 — 강조 */
const DEEP  = "075F9E";   /* 회사 진파랑 */
const TINT  = "E8F2FA";   /* 아주 옅은 파랑 — 상자 바탕 */
const WHITE = "FFFFFF";
const MUTE  = "5A6B7A";   /* 흐린 글씨 */
const LINE  = "D6E3EF";
const OK    = "1A7F4B";
const WARN  = "B4690E";

const F = "맑은 고딕";

const W = 13.333, H = 7.5;
const M = 0.7;                 /* 바깥 여백 */
const CW = W - M * 2;          /* 쓸 수 있는 폭 */

const p = new pptx();
p.layout = "LAYOUT_WIDE";
p.author = "(주)한국공업엔지니어링";
p.company = "(주)한국공업엔지니어링";
p.title = "사내 NDT 자격 필기시험 CBT";

/* ── 되풀이하는 조각 ──────────────────────── */

/* 흰 바탕 장의 제목. 밑줄은 긋지 않는다 */
function head(s, title, sub) {
  s.addText(title, {
    x: M, y: 0.52, w: CW, h: 0.75, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 34, bold: true, color: INK,
  });
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.3, w: CW, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, color: MUTE,
    });
  }
}

/* 번호 동그라미 — 이 발표자료의 되풀이 무늬 */
function circle(s, n, x, y, d = 0.44, fill = DEEP, fg = WHITE) {
  s.addShape(p.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: fill },
  });
  s.addText(String(n), {
    x, y, w: d, h: d, isTextBox: true, margin: 0,
    fontFace: F, fontSize: d > 0.5 ? 16 : 13, bold: true,
    color: fg, align: "center", valign: "middle",
  });
}

/* 옅은 바탕 상자 */
function card(s, x, y, w, h, fill = TINT) {
  s.addShape(p.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill }, line: { color: LINE, width: 0.75 },
  });
}

/* 쪽 번호 */
let pageNo = 0;
function foot(s) {
  pageNo++;
  s.addText(String(pageNo), {
    x: W - M - 0.6, y: H - 0.52, w: 0.6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10, color: MUTE, align: "right",
  });
}

/* ══════════════════════════════════════════
   1  표지
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  s.background = { color: INK };

  s.addText("사내 NDT 자격 필기시험", {
    x: M, y: 2.25, w: CW, h: 0.62, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 24, color: "8FC4E8",
  });
  s.addText("종이로 치던 시험을\n프로그램으로", {
    x: M, y: 2.85, w: CW, h: 2.0, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 54, bold: true, color: WHITE, lineSpacing: 62,
  });

  s.addShape(p.ShapeType.line, {
    x: M, y: 5.35, w: 3.2, h: 0, line: { color: BLUE, width: 3 },
  });

  s.addText("(주)한국공업엔지니어링      2026. 08", {
    x: M, y: 5.6, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: "9DB4C7",
  });
  s.addNotes("사내 NDT 자격 필기시험을 CBT 로 옮긴 결과를 보고드립니다.");
}

/* ══════════════════════════════════════════
   2  시험 한 번에 드는 일 — 10단계 vs 3단계
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "시험 한 번 치는 데 드는 일", "같은 시험 하나를 놓고, 예전과 지금");

  const OLD = [
    "문항을 고른다", "시험지를 편집한다", "인쇄하고 복사한다",
    "답안지를 만든다", "배포하고 회수한다", "한 장씩 채점한다",
    "점수를 계산한다", "성적표에 옮겨 적는다", "파일철에 보관한다",
    "남은 시험지를 폐기한다",
  ];
  const NEW = ["이름·등급·종목을 고른다", "응시자가 화면에서 푼다", "제출하면 채점된다"];

  const colW = 5.7;
  const x2 = M + colW + 0.7;

  /* 예전 */
  card(s, M, 1.95, colW, 4.55, "F4F4F3");
  s.addText("예전  종이", {
    x: M + 0.35, y: 2.15, w: colW - 0.7, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 17, bold: true, color: "6B7280",
  });
  OLD.forEach((t, i) => {
    s.addText(`${String(i + 1).padStart(2, "0")}   ${t}`, {
      x: M + 0.35, y: 2.62 + i * 0.36, w: colW - 0.7, h: 0.32,
      isTextBox: true, margin: 0, fontFace: F, fontSize: 13, color: "4A5158",
    });
  });
  s.addText("사람이 하는 일  10 단계", {
    x: M + 0.35, y: 6.05, w: colW - 0.7, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: "6B7280",
  });

  /* 지금 */
  card(s, x2, 1.95, colW, 4.55, TINT);
  s.addText("지금  프로그램", {
    x: x2 + 0.35, y: 2.15, w: colW - 0.7, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 17, bold: true, color: DEEP,
  });
  NEW.forEach((t, i) => {
    circle(s, i + 1, x2 + 0.35, 2.68 + i * 0.62, 0.38);
    s.addText(t, {
      x: x2 + 0.88, y: 2.68 + i * 0.62, w: colW - 1.3, h: 0.38,
      isTextBox: true, margin: 0, fontFace: F, fontSize: 15, bold: true,
      color: INK, valign: "middle",
    });
  });
  s.addText("시험지 만들기 · 복사 · 채점 · 점수 계산 · 성적 정리 · 보관은\n프로그램이 합니다. 종이가 필요하면 그때 출력합니다.", {
    x: x2 + 0.35, y: 4.75, w: colW - 0.7, h: 0.9, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: "33495C", lineSpacing: 20,
  });
  s.addText("사람이 하는 일   3 단계", {
    x: x2 + 0.35, y: 6.05, w: colW - 0.7, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: DEEP,
  });

  foot(s);
  s.addNotes("열 단계가 세 단계로 줄었습니다. 가운데 일곱 가지는 프로그램이 대신합니다.");
}

/* ══════════════════════════════════════════
   3  숫자
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "한눈에", "필기시험 전 구간을 다룹니다");

  const N = [
    ["1,369", "문항", "은행 24개"],
    ["9", "종목", "RT UT MT PT VT\nECT RFT TOFD PAUT"],
    ["10", "절차서", "그림 179장\n앱에서 바로 열람"],
    ["9", "빈 서식", "E02 6종 · E03 3종"],
    ["15", "자동 검사", "고칠 때마다\n스스로 확인"],
  ];

  const cw = (CW - 0.4 * 4) / 5;
  N.forEach((n, i) => {
    const x = M + i * (cw + 0.4);
    card(s, x, 2.15, cw, 3.5, WHITE);
    s.addText(n[0], {
      x: x + 0.2, y: 2.5, w: cw - 0.4, h: 1.05, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 46, bold: true, color: BLUE, align: "center",
    });
    s.addText(n[1], {
      x: x + 0.2, y: 3.62, w: cw - 0.4, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK, align: "center",
    });
    s.addText(n[2], {
      x: x + 0.15, y: 4.1, w: cw - 0.3, h: 1.2, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: MUTE, align: "center", lineSpacing: 16,
    });
  });

  s.addText("Level Ⅱ 일반·전문, Level Ⅲ 기초·종목까지. Level Ⅲ 전문시험은 규정상 아직 종이로 시행합니다.", {
    x: M, y: 5.95, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: MUTE,
  });
  foot(s);
  s.addNotes("문항은 원본 시험지 1,110개에 259개를 더한 것입니다.");
}

/* ══════════════════════════════════════════
   4  손이 가던 자리 — 전 → 후
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "손이 가던 자리", "여덟 가지가 사라졌습니다");

  const ROW = [
    ["시험지", "매번 편집·인쇄·복사", "화면에서 고르면 그 자리에서"],
    ["채점", "정답지 대조, 사람 손", "제출하면 즉시, 실수 없음"],
    ["종합점수", "계산기로 평균 계산", "규정대로 자동 계산"],
    ["성적 통보", "성적표 작성·전달", "끝나는 즉시 화면에 해설까지"],
    ["기록 보관", "파일철, 찾으려면 뒤져야", "사람별로 이력이 쌓임"],
    ["자격 만료", "달력에 적어 두고 챙김", "3개월 전 명단이 자동으로"],
    ["절차서", "사무실로 찾으러 감", "같은 화면에서 바로 열람"],
    ["계산기", "따로 챙겨 옴", "화면 안에 공학용 계산기"],
  ];

  const y0 = 2.05, rh = 0.55;
  const c1 = 1.5, c2 = 4.3, c3 = 0.5;

  ROW.forEach((r, i) => {
    const y = y0 + i * rh;
    if (i % 2 === 0) {
      s.addShape(p.ShapeType.rect, {
        x: M, y, w: CW, h: rh - 0.05, fill: { color: "F7FAFD" }, line: { color: "F7FAFD" },
      });
    }
    s.addText(r[0], {
      x: M + 0.15, y, w: c1, h: rh - 0.05, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: INK, valign: "middle",
    });
    s.addText(r[1], {
      x: M + 0.15 + c1, y, w: c2, h: rh - 0.05, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: "8A9099", valign: "middle",
    });
    s.addText("→", {
      x: M + 0.15 + c1 + c2, y, w: c3, h: rh - 0.05, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: BLUE, valign: "middle", align: "center",
    });
    s.addText(r[2], {
      x: M + 0.15 + c1 + c2 + c3, y, w: CW - c1 - c2 - c3 - 0.3, h: rh - 0.05,
      isTextBox: true, margin: 0, fontFace: F, fontSize: 13, bold: true,
      color: INK, valign: "middle",
    });
  });

  foot(s);
  s.addNotes("왼쪽이 예전, 오른쪽이 지금입니다.");
}

/* ══════════════════════════════════════════
   5  응시자는 이렇게 씁니다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "응시자는 이렇게 씁니다", "설치도 로그인도 없습니다. 주소 하나면 됩니다");

  const STEP = [
    ["이름·등급·종목", "고르면 그 자리에서\n시험이 만들어집니다"],
    ["시험", "문항과 보기 순서가\n회차마다 다릅니다"],
    ["계산기", "화면 안에서\n열고 닫습니다"],
    ["제출", "바로 채점됩니다"],
    ["결과·해설", "틀린 문항과 근거를\n함께 봅니다"],
  ];

  const cw = (CW - 0.35 * 4) / 5;
  STEP.forEach((t, i) => {
    const x = M + i * (cw + 0.35);
    card(s, x, 2.2, cw, 2.5, WHITE);
    circle(s, i + 1, x + cw / 2 - 0.26, 2.48, 0.52, BLUE);
    s.addText(t[0], {
      x: x + 0.12, y: 3.15, w: cw - 0.24, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: INK, align: "center",
    });
    s.addText(t[1], {
      x: x + 0.12, y: 3.6, w: cw - 0.24, h: 0.9, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: MUTE, align: "center", lineSpacing: 16,
    });
    if (i < 4) {
      s.addText("›", {
        x: x + cw + 0.05, y: 3.2, w: 0.25, h: 0.4, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 20, bold: true, color: LINE, align: "center",
      });
    }
  });

  card(s, M, 5.0, CW, 1.55, TINT);
  s.addText("계산기 — 조용히 틀리던 것을 고쳤습니다", {
    x: M + 0.35, y: 5.18, w: CW - 0.7, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: DEEP,
  });
  s.addText([
    { text: "sin(30)", options: { bold: true } },
    { text: " 이 0.5가 아니라 −0.988 — 라디안 기준이었습니다.      " },
    { text: "log", options: { bold: true } },
    { text: " 가 자연로그였습니다 — dB 계산이 전부 틀렸습니다.      " },
    { text: "ln", options: { bold: true } },
    { text: " 은 누르면 오류였습니다." },
  ], {
    x: M + 0.35, y: 5.6, w: CW - 0.7, h: 0.8, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: "33495C", lineSpacing: 19,
  });

  foot(s);
  s.addNotes("굴절각이나 dB 계산이 조용히 틀리고 있었습니다. 셋 다 바로잡고 도 모드를 기본으로 두었습니다.");
}

/* ══════════════════════════════════════════
   6  어떻게 굴러가나
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "한 바퀴가 이렇게 돕니다", "사람이 손대는 자리는 첫 칸과 마지막 칸뿐입니다");

  const NODE = [
    ["고친다", "VS Code 에서 문항·출제 수·절차서를", "사람"],
    ["올린다", "검사를 돌리고 GitHub 에 올립니다", "사람"],
    ["배포된다", "GitHub 이 스스로 빌드해 웹에  2~3분", "자동"],
    ["접속해 푼다", "응시자가 주소로 들어와 시험을 칩니다", "응시자"],
    ["쌓인다", "제출하면 구글 시트에 한 줄이 붙습니다", "자동"],
    ["확인한다", "관리자 모드에서 결과와 이력을 봅니다", "관리자"],
  ];

  const cw = (CW - 0.35 * 2) / 3;
  NODE.forEach((n, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (cw + 0.35);
    const y = 2.15 + row * 2.15;

    card(s, x, y, cw, 1.85, WHITE);
    circle(s, i + 1, x + 0.25, y + 0.25, 0.42, i === 2 || i === 4 ? OK : DEEP);
    s.addText(n[0], {
      x: x + 0.78, y: y + 0.25, w: cw - 1.0, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK, valign: "middle",
    });
    s.addText(n[1], {
      x: x + 0.25, y: y + 0.82, w: cw - 0.5, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: MUTE, lineSpacing: 17,
    });
    s.addText(n[2], {
      x: x + 0.25, y: y + 1.42, w: 1.0, h: 0.28, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, bold: true,
      color: n[2] === "자동" ? OK : DEEP,
    });
    if (col < 2) {
      s.addText("→", {
        x: x + cw + 0.02, y: y + 0.7, w: 0.31, h: 0.4, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 16, bold: true, color: BLUE, align: "center",
      });
    }
  });

  s.addText("서버를 따로 두지 않았습니다. 화면은 GitHub Pages, 기록은 구글 시트가 맡습니다 — 둘 다 회사가 이미 쓰는 것이라 유지비가 들지 않습니다.", {
    x: M, y: 6.55, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: MUTE,
  });
  foot(s);
  s.addNotes("가운데 셋은 사람이 손대지 않아도 굴러갑니다.");
}

/* ══════════════════════════════════════════
   7  채점 — 문턱 두 개
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "문턱은 두 개입니다", "HIE-QP-E01 7.4.4 · 7.4.5");

  const bars = [
    ["개별 시험 — 과락", 70, "각 시험 70% 이상"],
    ["종합 — 자격 취득", 80, "전 과목 단순 평균 80% 이상"],
  ];

  bars.forEach((b, i) => {
    const y = 2.3 + i * 1.5;
    s.addText(b[0], {
      x: M, y, w: 5.0, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK,
    });
    s.addText(b[2], {
      x: M + 5.0, y: y + 0.05, w: 5.0, h: 0.35, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUTE,
    });

    const bw = CW, bh = 0.5, by = y + 0.5;
    s.addShape(p.ShapeType.rect, {
      x: M, y: by, w: bw, h: bh, fill: { color: "F1F6FB" }, line: { color: LINE, width: 0.75 },
    });
    s.addShape(p.ShapeType.rect, {
      x: M, y: by, w: bw * (b[1] / 100), h: bh,
      fill: { color: BLUE, transparency: 82 }, line: { color: "FFFFFF", width: 0 },
    });
    s.addShape(p.ShapeType.rect, {
      x: M + bw * (b[1] / 100) - 0.015, y: by - 0.12, w: 0.03, h: bh + 0.24,
      fill: { color: BLUE }, line: { color: BLUE, width: 0 },
    });
    s.addText(`${b[1]}%`, {
      x: M + bw * (b[1] / 100) - 0.5, y: by + bh + 0.14, w: 1.0, h: 0.3,
      isTextBox: true, margin: 0, fontFace: F, fontSize: 14, bold: true,
      color: DEEP, align: "center",
    });
  });

  card(s, M, 5.5, CW / 2 - 0.2, 1.2, TINT);
  s.addText("재시험", {
    x: M + 0.3, y: 5.68, w: 3.0, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: DEEP,
  });
  s.addText("불합격하면 30일이 지나야 다시 칠 수 있습니다.\n추가 훈련 증거를 내면 앞당길 수 있습니다.", {
    x: M + 0.3, y: 6.03, w: CW / 2 - 0.8, h: 0.6, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: "33495C", lineSpacing: 17,
  });

  card(s, M + CW / 2 + 0.2, 5.5, CW / 2 - 0.2, 1.2, "FBF0E2");
  s.addText("여기서 판정하지 않는 것", {
    x: M + CW / 2 + 0.5, y: 5.68, w: 4.0, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: WARN,
  });
  s.addText("필기시험만 판정합니다. 실기시험과 Level Ⅲ 전문시험은\n들어오지 않으며, 빠진 것을 화면에 적어 보여줍니다.", {
    x: M + CW / 2 + 0.5, y: 6.03, w: CW / 2 - 0.8, h: 0.6, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: "33495C", lineSpacing: 17,
  });

  foot(s);
  s.addNotes("한 과목 붙었다고 자격이 나오는 것이 아닙니다. 화면에도 그렇게 적어 두었습니다.");
}

/* ══════════════════════════════════════════
   8  자격은 프로그램이 챙깁니다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "자격은 프로그램이 챙깁니다", "응시 기록을 사람 단위로 묶어 만료까지 봅니다");

  const R = [
    ["재자격 주기", "Level Ⅰ·Ⅱ 3년 · Level Ⅲ 5년\n만료되는 달의 마지막 날에 만료", "E03 6.1.1"],
    ["시력검사", "검사일로부터 1년 뒤\n만료 월의 마지막 날", "E03 6.1.2"],
    ["만료 통보", "만료 3개월 전까지\n본인과 소속 부서에", "E03 6.2.1"],
  ];

  const cw = (CW - 0.4 * 2) / 3;
  R.forEach((r, i) => {
    const x = M + i * (cw + 0.4);
    card(s, x, 2.2, cw, 2.35, WHITE);
    s.addText(r[0], {
      x: x + 0.3, y: 2.45, w: cw - 0.6, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 18, bold: true, color: DEEP,
    });
    s.addText(r[1], {
      x: x + 0.3, y: 2.95, w: cw - 0.6, h: 1.0, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13.5, color: INK, lineSpacing: 20,
    });
    s.addText(r[2], {
      x: x + 0.3, y: 4.08, w: cw - 0.6, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: MUTE,
    });
  });

  card(s, M, 4.85, CW, 1.7, TINT);
  s.addText("바로 뽑는 것", {
    x: M + 0.35, y: 5.05, w: 4.0, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: DEEP,
  });
  ["E03-04  자격 만료 예정자 명단", "E03-01  자격증 발급대장", "E02-07  채점결과보고서", "빈 서식 9종"].forEach((t, i) => {
    s.addText(t, {
      x: M + 0.35 + i * 3.0, y: 5.5, w: 2.9, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: "33495C",
    });
  });
  s.addText("날짜 계산은 116건의 시험값으로 확인합니다 — 윤년, 말일, 월 넘김까지.", {
    x: M + 0.35, y: 5.95, w: CW - 0.7, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: MUTE,
  });

  foot(s);
  s.addNotes("만료를 사람이 기억하지 않아도 됩니다.");
}

/* ══════════════════════════════════════════
   9  규정을 그대로 옮겼습니다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "규정을 그대로 옮겼습니다", "임의로 정한 숫자가 하나도 없습니다");

  const rows = [
    ["E01 표 3", "종목별 필기시험 최소 문제 수"],
    ["E01 7.4.4 · 7.4.5", "종합은 단순 평균 · 개별 70% 종합 80%"],
    ["E01 7.5", "불합격 재시험은 30일 경과 후"],
    ["E01 7.3.4", "Level Ⅲ 기초 55 · 종목 65 · 전문 20"],
    ["E01 7.3.5 · 7.3.7", "ASNT·ISO 9712 소지자 시험 면제"],
    ["E01 7.9.2", "재자격 Ⅰ·Ⅱ 3년, Ⅲ 5년"],
  ];

  const cw = (CW - 0.4) / 2;
  rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (cw + 0.4);
    const y = 2.2 + row * 0.95;
    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: 0.8, fill: { color: "F7FAFD" }, line: { color: LINE, width: 0.75 },
    });
    s.addText(r[0], {
      x: x + 0.25, y: y + 0.1, w: cw - 0.5, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: BLUE,
    });
    s.addText(r[1], {
      x: x + 0.25, y: y + 0.4, w: cw - 0.5, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: INK,
    });
  });

  card(s, M, 5.35, CW, 1.2, INK);
  s.addText("원문과 값까지 대조합니다", {
    x: M + 0.4, y: 5.55, w: 5.5, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: WHITE,
  });
  s.addText("E01 한글 원본을 읽어 규칙 문서와 프로그램이 같은 값을 쓰는지 기계가 확인합니다.\n잣대 19가지 + 표 3 의 12종목. E01 조항 32개를 모두 받아 적었습니다.", {
    x: M + 0.4, y: 5.92, w: CW - 0.8, h: 0.55, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: "BBD5EA", lineSpacing: 17,
  });

  foot(s);
  s.addNotes("규정이 바뀌면 그 자리를 찾아 고치면 됩니다.");
}

/* ══════════════════════════════════════════
   10  옮기다 찾은 것
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "옮기다 찾아낸 것", "규정을 한 줄씩 다시 읽어야 했습니다. 그러다 드러났습니다");

  const FOUND = [
    ["규정보다 적게 나가던 시험", "전 종목을 일반 40 · 전문 25로 못 박아 두어\nTOFD·PAUT 전문시험이 5문항 적게 나갔습니다.", "고침"],
    ["104문항짜리 Level Ⅲ 시험", "은행 전체가 나가 시험시간 2시간에\n문항당 69초였습니다.", "고침"],
    ["회차마다 같은 문제", "은행이 규정 출제 수와 같아 뽑을 것이\n없었습니다.", "고침"],
    ["원본 시험지의 오류", "영문 오타 14가지 · 잘못된 정답 4건\n겹친 보기 1건 · 절차서 번호 오기 3건", "고침"],
  ];

  const cw = (CW - 0.4) / 2;
  FOUND.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (cw + 0.4);
    const y = 2.15 + row * 2.15;
    card(s, x, y, cw, 1.9, WHITE);
    s.addText(f[0], {
      x: x + 0.3, y: y + 0.25, w: cw - 1.2, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: INK,
    });
    s.addShape(p.ShapeType.roundRect, {
      x: x + cw - 0.95, y: y + 0.28, w: 0.65, h: 0.32, rectRadius: 0.16,
      fill: { color: "E6F4EC" }, line: { color: OK, width: 0.75 },
    });
    s.addText(f[2], {
      x: x + cw - 0.95, y: y + 0.28, w: 0.65, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, bold: true, color: OK,
      align: "center", valign: "middle",
    });
    s.addText(f[1], {
      x: x + 0.3, y: y + 0.78, w: cw - 0.6, h: 0.9, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUTE, lineSpacing: 18,
    });
  });

  s.addText("문항을 1,110개에서 1,369개로 늘려 회차마다 다른 시험지가 나가게 했습니다.", {
    x: M, y: 6.5, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: MUTE,
  });
  foot(s);
  s.addNotes("옮기지 않았으면 몰랐을 것들입니다.");
}

/* ══════════════════════════════════════════
   11  스스로 검사합니다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "고칠 때마다 스스로 검사합니다", "사람이 눈으로 보는 대신 검사를 프로그램으로 만들었습니다");

  const CHK = [
    ["채점", "은행 24개 1,369문항"],
    ["보기 섞기", "219,200회 돌려 확인"],
    ["겹친 보기", "한 문항에 같은 보기"],
    ["이력·만료", "116건의 시험값"],
    ["규정 대조", "E01 원문과 값까지"],
    ["철자·받침", "규칙 문서 두 건"],
    ["표가 종이에", "쪽을 넘기는 행"],
    ["겹치는 조항", "같은 말을 두 번"],
  ];

  const cw = (CW - 0.3 * 3) / 4;
  CHK.forEach((c, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = M + col * (cw + 0.3);
    const y = 2.25 + row * 1.75;
    card(s, x, y, cw, 1.45, WHITE);
    s.addText("○", {
      x: x + 0.25, y: y + 0.22, w: 0.35, h: 0.35, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: OK, valign: "middle",
    });
    s.addText(c[0], {
      x: x + 0.62, y: y + 0.22, w: cw - 0.85, h: 0.35, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: INK, valign: "middle",
    });
    s.addText(c[1], {
      x: x + 0.25, y: y + 0.72, w: cw - 0.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: MUTE, lineSpacing: 16,
    });
  });

  s.addText("검사 15가지가 모두 통과합니다. 위는 그 가운데 여덟 가지입니다.", {
    x: M, y: 5.85, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: DEEP,
  });
  foot(s);
  s.addNotes("검사를 사람이 아니라 프로그램이 합니다.");
}

/* ══════════════════════════════════════════
   12  남은 일
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  head(s, "아직 남은 것", "솔직하게 말씀드립니다");

  const LEFT = [
    ["검토 모드를 시행 모드로", "지금은 은행 문항이 전부 보이게 해 두었습니다.\n실제 시험 전에 무작위 출제로 바꿉니다.", true],
    ["Level Ⅲ VT 여유 문항", "규정 65문항에 은행도 65문항이라\n회차마다 같은 문항이 나갑니다.", false],
    ["Level Ⅲ 전문시험", "규정이 종이로 시행하도록 정하고 있습니다.\n옮기려면 규정부터 고쳐야 합니다.", false],
    ["관리자 비밀번호", "지금은 화면 쪽에 들어 있어\n마음먹으면 들여다볼 수 있습니다.", false],
  ];

  LEFT.forEach((l, i) => {
    const y = 2.2 + i * 1.1;
    s.addShape(p.ShapeType.rect, {
      x: M, y, w: CW, h: 0.95,
      fill: { color: l[2] ? "FBF0E2" : "F7FAFD" },
      line: { color: l[2] ? WARN : LINE, width: 0.75 },
    });
    circle(s, i + 1, M + 0.3, y + 0.26, 0.42, l[2] ? WARN : DEEP);
    s.addText(l[0], {
      x: M + 0.9, y: y + 0.13, w: 4.5, h: 0.35, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: INK,
    });
    if (l[2]) {
      s.addText("시행 전 필수", {
        x: M + 5.4, y: y + 0.15, w: 1.4, h: 0.3, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 11, bold: true, color: WARN,
      });
    }
    s.addText(l[1], {
      x: M + 0.9, y: y + 0.5, w: CW - 1.4, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: MUTE, lineSpacing: 16,
    });
  });

  s.addText("실기시험과 실증은 이 시스템이 다루지 않습니다. 필기 결과만으로 합격 처리하지 않도록 화면에 밝혀 적습니다.", {
    x: M, y: 6.75, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: MUTE,
  });
  foot(s);
  s.addNotes("첫 번째는 실제 시험을 치기 전에 반드시 바꿔야 합니다.");
}

/* ══════════════════════════════════════════
   13  맺음
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  s.background = { color: INK };

  s.addText("규정을 사람이 기억하는 대신,\n프로그램이 지키게 했습니다.", {
    x: M, y: 2.5, w: CW - 1.5, h: 2.0, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 38, bold: true, color: WHITE, lineSpacing: 52,
  });

  s.addShape(p.ShapeType.line, {
    x: M, y: 4.85, w: 3.2, h: 0, line: { color: BLUE, width: 3 },
  });

  s.addText("값 하나하나가 어느 조항에서 왔는지 적혀 있습니다.\n규정이 바뀌면 그 자리를 찾아 고치면 됩니다.", {
    x: M, y: 5.1, w: CW - 1.5, h: 0.9, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, color: "9DB4C7", lineSpacing: 24,
  });

  s.addNotes("질문 받겠습니다.");
}

const OUT = "발표자료-CBT-2026-08.pptx";
p.writeFile({ fileName: OUT }).then(() => {
  const fs = require("fs");
  console.log(`만듦  ${OUT}  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB  ${pageNo + 2}장`);
});
