/*
 * 연말 기술발표 자료를 만든다.
 *
 *   node tools/shots.cjs      먼저 화면을 찍고
 *   node tools/make-deck.cjs  그 다음 이것
 *
 * 회사 양식을 따른다
 * -------------------
 * \\192.168.0.123\기술부\...\24년기술발표 양식-R1.pptx 를 그대로 잰 값이다.
 *
 *   화면      13.78 x 7.5 인치
 *   바탕      흰색
 *   글꼴      맑은 고딕
 *   표지      제목을 화면 한가운데 크게(59pt, 빨강), 아래에 Made by · 날짜
 *   본문      제목 배너가 위쪽 전폭을 지난다 (y 0.07, 56pt, 빨강, 가운데)
 *   쪽번호    오른쪽 아래 (9.88, 7.10)
 *   끝장      「감사합니다.」 77pt 가운데
 *
 * 앞선 발표들(이주경·선승우)을 보니 거의 모든 장에 그림이 하나씩 들어간다.
 * 손으로 그린 흉내가 아니라 실제로 도는 화면을 찍어 넣는다 (tools/shots.cjs).
 */
const pptx = require("pptxgenjs");
const fs = require("node:fs");
const path = require("node:path");

/* ── 회사 양식에서 잰 값 ─────────────────── */
const W = 13.78, H = 7.5;
const F = "맑은 고딕";
const RED = "FF0000";      /* 제목 */
const BLU = "0070C0";      /* 본문 강조 — 앞선 발표들이 쓰는 파랑 */
const INK = "000000";
const MUT = "595959";
const LINE = "BFBFBF";
const OK = "00B050";       /* 이주경 발표가 쓰는 초록 */
const WARN = "BF8F00";     /* 눈여겨볼 것 — 어긋났다고 단정하지 않는 자리 */

const SHOT = "docs/shots";
const has = (f) => fs.existsSync(path.join(SHOT, f));
const img = (f) => path.join(SHOT, f);

const p = new pptx();
p.defineLayout({ name: "HIE", width: W, height: H });
p.layout = "HIE";
p.author = "";
p.company = "(주)한국공업엔지니어링";
p.title = "사내 NDT 자격 필기시험 CBT 구축";

let no = 0;

/* 쪽번호 — 양식과 같은 자리 */
function page(s) {
  no++;
  s.addText(String(no), {
    x: 9.88, y: 7.10, w: 3.22, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: MUT, align: "right",
  });
}

/* 본문 장의 제목 배너 — 양식 2장을 그대로 옮긴 것 */
function banner(s, title) {
  s.addText(title, {
    x: -1.36, y: 0.07, w: 16.54, h: 0.95, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 34, bold: true, color: RED,
    align: "center", valign: "middle",
  });
}

/* 배너 아래 소제목 */
function sub(s, t, y = 1.05) {
  s.addText(t, {
    x: 0.55, y, w: W - 1.1, h: 0.42, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 19, bold: true, color: BLU,
  });
}

/* 화면 그림을 상자에 맞춰 넣는다. 비율은 지킨다 */
function shot(s, file, x, y, w, h) {
  if (!has(file)) return false;
  s.addImage({
    path: img(file), x, y, w, h,
    sizing: { type: "contain", w, h },
  });
  s.addShape(p.ShapeType.rect, {
    x, y, w, h, fill: { type: "none" }, line: { color: LINE, width: 0.75 },
  });
  return true;
}

/* 글머리 한 줄 */
function bullet(s, t, x, y, w, size = 15, color = INK) {
  s.addText(t, {
    x, y, w, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: size, color, valign: "middle",
  });
}

/* ══════════════════════════════════════════
    1  표지
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  s.addText("사내 NDT 자격 필기시험\nCBT 구축", {
    x: 0.11, y: 0.13, w: 13.56, h: 6.0, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 54, bold: true, color: RED,
    align: "center", valign: "middle", lineSpacing: 68,
  });
  /* 발표자 이름과 날짜는 발표하는 사람이 채운다 — 양식도 「Mady by 000」이다 */
  s.addText("Made by ○○○\n2026.12.__.", {
    x: 0.49, y: 6.30, w: 6.29, h: 0.9, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, color: INK, lineSpacing: 24,
  });
  page(s);
  s.addNotes("사내 NDT 자격 필기시험을 CBT 로 옮긴 결과를 보고드립니다.");
}

/* ══════════════════════════════════════════
    2  왜 만들었나
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "WHY");
  sub(s, "시험 한 번 치는 데 사람이 하던 일 여섯 가지");

  const OLD = [
    ["문항을 고르고 한글로 시험지를 만든다", "회차마다 처음부터"],
    ["인쇄하고 응시자 수만큼 복사한다", "남은 시험지는 폐기 대장에"],
    ["정답지를 옆에 놓고 한 장씩 채점한다", "사람이 하므로 틀릴 수 있다"],
    ["점수를 계산해 성적표에 옮겨 적는다", "종합점수는 계산기로"],
    ["파일철에 보관한다", "찾으려면 뒤져야 한다"],
    ["자격 만료를 달력에 적어 두고 챙긴다", "놓치면 자격 없이 검사한 것이 된다"],
  ];

  OLD.forEach((o, i) => {
    const y = 1.72 + i * 0.72;
    s.addShape(p.ShapeType.ellipse, {
      x: 0.62, y: y + 0.06, w: 0.34, h: 0.34, fill: { color: RED },
    });
    s.addText(String(i + 1), {
      x: 0.62, y: y + 0.06, w: 0.34, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(o[0], {
      x: 1.12, y, w: 7.2, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 18, bold: true, color: INK, valign: "middle",
    });
    s.addText(o[1], {
      x: 8.4, y, w: 4.8, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, color: MUT, valign: "middle",
    });
  });

  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 6.15, w: 12.55, h: 0.72,
    fill: { color: "FFF2F2" }, line: { color: RED, width: 1 },
  });
  s.addText("문제은행에 든 문항이 규정 출제 수와 똑같아, 회차마다 같은 문제가 그대로 나갔습니다.", {
    x: 0.9, y: 6.15, w: 12.0, h: 0.72, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 17, bold: true, color: RED, valign: "middle",
  });

  page(s);
  s.addNotes("여섯 가지가 모두 사람 손이었습니다. 마지막 줄이 가장 큰 문제였습니다.");
}

/* ══════════════════════════════════════════
    1  한 장으로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "그래서 이걸 만들었습니다");
  sub(s, "3주 동안, 사 온 것 없이, 유지비 없이");

  /* 큰 숫자 여섯 — 이 발표에서 기억에 남길 것들 */
  const BIG = [
    ["1,369", "문항", "종이 시험지를 전부 옮겨 담고\n규정 수보다 넉넉히 채웠다"],
    ["4,200조", "가지 시험지", "같은 시험을 두 번 쳐도\n문제가 다르다"],
    ["32", "개 조항", "자격인정 규정의 시험 관련 조항을\n하나도 빠짐없이 옮겼다"],
    ["15", "가지 자동 검사", "고칠 때마다 어디가 틀어졌는지\n프로그램이 스스로 찾는다"],
    ["20만", "줄", "3주 동안 고친 양.\nVS Code 로 직접 짰다"],
    ["0", "원", "서버를 사지 않았다.\n유지비가 들지 않는다"],
  ];

  const cw = (12.55 - 0.42 * 2) / 3;
  const ch = 2.25;

  BIG.forEach((b, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.62 + col * (cw + 0.42);
    const y = 1.72 + row * (ch + 0.42);

    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: ch,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addText(b[0], {
      x: x + 0.15, y: y + 0.28, w: cw - 0.3, h: 0.92, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 46, bold: true, color: RED, align: "center",
    });
    s.addText(b[1], {
      x: x + 0.15, y: y + 1.2, w: cw - 0.3, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK, align: "center",
    });
    s.addText(b[2], {
      x: x + 0.15, y: y + 1.6, w: cw - 0.3, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, align: "center", lineSpacing: 17,
    });
  });

  s.addText("그리고 옮기는 동안, 규정과 어긋나 있던 것 셋을 찾아 바로잡았습니다.", {
    x: 0.62, y: 6.9, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("이 여섯 개만 기억하셔도 됩니다. 뒤에서 하나씩 보여 드리겠습니다.");
}

/* ══════════════════════════════════════════
    3  응시자 ① 첫 화면
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "응시자 화면 ①  시작");
  sub(s, "인터넷 창만 열면 되는 시험 시스템입니다");

  shot(s, "01-home.png", 0.62, 1.62, 7.4, 4.7);

  const R = [
    ["설치가 없다", "주소만 알면 어느 컴퓨터에서든 열린다"],
    ["로그인이 없다", "이름·등급·종목을 고르면 바로 시작"],
    ["회사 밖에서도 된다", "현장이나 출장지에서 노트북으로 칠 수 있다"],
    ["종이 시험도 된다", "컴퓨터가 모자라면 시험지를 뽑아 쓴다"],
  ];
  R.forEach((r, i) => {
    const y = 1.85 + i * 1.15;
    s.addText(r[0], {
      x: 8.35, y, w: 4.8, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 20, bold: true, color: BLU,
    });
    s.addText(r[1], {
      x: 8.35, y: y + 0.42, w: 4.8, h: 0.55, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14.5, color: INK, lineSpacing: 20,
    });
  });

  s.addText("RT·UT·MT·PT·VT·ECT·RFT·TOFD·PAUT 아홉 종목의 일반시험과 전문시험, 그리고 Level Ⅲ 시험까지 다 들어 있습니다.", {
    x: 0.62, y: 6.45, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: MUT,
  });

  page(s);
  s.addNotes("이 화면이 전부입니다. 이름 넣고 종목 고르면 시험이 시작됩니다.");
}

/* ══════════════════════════════════════════
    4  응시자 ② 시험 화면
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "응시자 화면 ②  문제 풀기");
  sub(s, "영문 원문과 우리말을 함께 보여줍니다");

  shot(s, "02-quiz.png", 0.62, 1.52, 7.55, 5.15);

  /* 화면에 실제로 찍혀 있는 것들을 하나씩 풀어 준다 */
  const PART = [
    ["Question 1/40",
     "규정이 정한 40문항만 나온다. 문제은행에\n60문항이 들어 있어도 그중에서 40개만 뽑는다."],
    ["영문 문항 + 우리말",
     "원본 시험지가 영문이라 그대로 두고 아래에\n우리말을 붙였다. 보기도 두 줄로 같이 보여준다."],
    ["보기 번호 ①②③④",
     "보기 차례를 시험마다 섞는다. 다만 「위 모두\n정답」 같은 것은 자리를 옮기면 말이 안 되므로 묶어 둔다."],
    ["답안 표기란",
     "지금까지 고른 답이 오른쪽에 쭉 보인다.\n번호를 눌러 그 문항으로 바로 건너뛴다."],
    ["계산기 · 이전 · 다음 · 종료",
     "계산기는 화면 안에서 열고 닫는다.\n종료를 누르면 입력한 답이 사라진다고 먼저 알린다."],
    ["제출",
     "안 푼 문제가 있으면 「풀지 않은 문제가 N개\n있습니다」 하고 한 번 더 묻는다."],
  ];

  PART.forEach((t, i) => {
    const y = 1.55 + i * 0.87;
    s.addShape(p.ShapeType.ellipse, {
      x: 8.35, y: y + 0.04, w: 0.3, h: 0.3, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 8.35, y: y + 0.04, w: 0.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(t[0], {
      x: 8.75, y, w: 4.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: INK,
    });
    s.addText(t[1], {
      x: 8.75, y: y + 0.3, w: 4.4, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: MUT, lineSpacing: 15,
    });
  });

  s.addText("문제는 세 가지 — 넷 중 하나 고르기, 맞는 것 모두 고르기, 답을 직접 써 넣기.", {
    x: 0.62, y: 6.82, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("보기가 두세 개뿐이던 86문항도 모두 넷으로 맞췄습니다. 찍어서 맞힐 확률이 종목마다 다르면 안 되니까요.");
}

/* ══════════════════════════════════════════
    5  응시자 ③ 절차서
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "응시자 화면 ③  검사절차서");
  sub(s, "전문시험은 장비와 검사 절차를 묻습니다. 그래서 회사 검사절차서를 보며 풀 수 있게 했습니다");

  shot(s, "14-proc.png", 0.62, 1.52, 8.3, 5.15);

  const PROC = [
    ["10종", "MT·PT·RT·UT·VT·ECT·RFT·TOFD·PAUT 검사절차서와 자격인정 규정"],
    ["179장", "한글 파일에서 뽑아 그대로 옮긴 그림"],
    ["찾기", "절차서 안에서 낱말을 넣으면 그 자리로 간다"],
    ["문제에서 바로", "문제에 적힌 절차서 이름을 누르면 열린다"],
  ];

  PROC.forEach((t, i) => {
    const y = 1.6 + i * 1.15;
    s.addText(t[0], {
      x: 9.2, y, w: 3.98, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 22, bold: true, color: BLU,
    });
    s.addText(t[1], {
      x: 9.2, y: y + 0.44, w: 3.98, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: INK, lineSpacing: 18,
    });
  });

  s.addShape(p.ShapeType.rect, {
    x: 9.2, y: 6.15, w: 3.98, h: 0.52,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("사무실로 찾으러 가지 않는다", {
    x: 9.2, y: 6.15, w: 3.98, h: 0.52, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
    align: "center", valign: "middle",
  });

  s.addText("표지 양식이 문서마다 제각각이던 것을 하나로 맞추고, 기계 번역투 58군데를 다시 썼습니다.", {
    x: 0.62, y: 6.82, w: 8.3, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: MUT,
  });

  page(s);
  s.addNotes("현장에서도 같은 화면에서 검사절차서를 펴 볼 수 있습니다. 사무실로 찾으러 가지 않아도 됩니다.");
}

/* ══════════════════════════════════════════
    6  응시자 ④ 결과
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "응시자 화면 ④  결과");
  sub(s, "제출과 동시에 점수가 나옵니다");

  shot(s, "04-result.png", 0.62, 1.6, 7.5, 4.6);

  const R = [
    ["사람이 채점하지 않는다", "정답지 대조도, 점수 계산도 없다.\n같은 시험은 언제 채점해도 같은 점수다."],
    ["종합점수를 자동으로", "요구되는 시험의 단순 평균.\n개별 70% · 종합 80% (E01 7.4.4·7.4.5)"],
    ["틀린 문항과 근거를 함께", "시험이 그대로 교육이 된다."],
  ];
  R.forEach((r, i) => {
    const y = 1.85 + i * 1.55;
    s.addText(r[0], {
      x: 8.45, y, w: 4.7, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 19, bold: true, color: BLU,
    });
    s.addText(r[1], {
      x: 8.45, y: y + 0.44, w: 4.7, h: 0.9, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, color: INK, lineSpacing: 20,
    });
  });

  page(s);
  s.addNotes("채점 실수가 자격 시험에서 나오면 되돌리기 어렵습니다.");
}

/* ══════════════════════════════════════════
    7  관리자 ① 결과 목록
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "관리자 화면 ①  누가 몇 점");
  sub(s, "누가 언제 무슨 시험을 쳐서 몇 점을 받았는지 한자리에서 봅니다");

  shot(s, "05-admin.png", 0.62, 1.52, 8.0, 5.15);

  const COL = [
    ["이름 · 등급 · 종목 · 구분", "어느 시험을 쳤는지"],
    ["응시 시작 ~ 종료 · 소요", "시험시간을 지켰는지 나중에 확인할 수 있다"],
    ["정답 / 출제 · 점수", "16 / 27 처럼 몇 문항 중 몇 개인지 함께"],
    ["결과", "합격 · 불합격을 색으로 가른다"],
    ["결과지 출력", "그 회차의 채점결과보고서(E02-07)를 뽑는다"],
    ["자격 이력", "사람 단위로 묶어 보는 화면으로 넘어간다"],
  ];

  COL.forEach((c, i) => {
    const y = 1.6 + i * 0.86;
    s.addShape(p.ShapeType.ellipse, {
      x: 8.85, y: y + 0.04, w: 0.3, h: 0.3, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 8.85, y: y + 0.04, w: 0.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(c[0], {
      x: 9.25, y, w: 3.9, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: INK,
    });
    s.addText(c[1], {
      x: 9.25, y: y + 0.32, w: 3.9, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: MUT, lineSpacing: 15,
    });
  });

  s.addText("이름으로 찾거나 등급·검사법으로 거를 수 있습니다. 응시 기록은 구글 시트에 쌓이므로 어느 컴퓨터에서 봐도 같습니다.", {
    x: 0.62, y: 6.82, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("화면에 보이는 이름은 예시입니다.");
}

/* ══════════════════════════════════════════
    1  관리자 화면 ②  자격 이력 — 무엇을 보나
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "관리자 화면 ②  자격 이력");
  sub(s, "사람 한 명이 친 시험을 전부 묶어, 자격이 지금 어떤지 판정합니다");

  shot(s, "06-history.png", 0.62, 1.5, 8.5, 4.6);

  const WHAT = [
    ["시험별 점수", "그 사람이 친 시험을 등급·종목별로 모은다"],
    ["종합", "요구되는 시험의 평균 — 규정이 정한 방식 그대로"],
    ["판정", "합격 · 불합격 · 미완을 가른다"],
    ["인증일자 · 만료일자", "언제까지 유효한지"],
    ["상태", "유효 · 만료 임박 · 만료를 색으로"],
  ];

  WHAT.forEach((t, i) => {
    const y = 1.6 + i * 0.9;
    s.addShape(p.ShapeType.ellipse, {
      x: 9.35, y: y + 0.04, w: 0.3, h: 0.3, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 9.35, y: y + 0.04, w: 0.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(t[0], {
      x: 9.75, y, w: 3.43, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: INK,
    });
    s.addText(t[1], {
      x: 9.75, y: y + 0.32, w: 3.43, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: MUT, lineSpacing: 15,
    });
  });

  s.addText("여섯 사람이 각각 다른 경우입니다. 한 줄씩 보겠습니다.", {
    x: 0.62, y: 6.3, w: 8.5, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("이 한 화면이 자격 판정을 다 합니다. 다음 장부터 한 사람씩 뜯어 보겠습니다.");
}

/* ══════════════════════════════════════════
    2  자격 이력 ②  점수 판정
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "자격 이력 ②  점수를 어떻게 판정하나");
  sub(s, "개별 시험은 70% 이상, 전 과목 평균은 80% 이상이어야 합니다");

  /* 박민수 — 개별은 통과인데 종합에서 걸린다 */
  shot(s, "21-박민수.png", 0.62, 1.5, 12.55, 2.15);
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 3.75, w: 12.55, h: 0.95,
    fill: { color: "FFF2F2" }, line: { color: RED, width: 1 },
  });
  s.addText("일반 75 · 전문 80  →  평균 77.5  →  불합격", {
    x: 0.95, y: 3.85, w: 6.5, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 17, bold: true, color: RED,
  });
  s.addText("두 시험 다 70%를 넘겼습니다. 그런데 평균이 80%에 못 미쳐 불합격입니다.\n한 과목만 잘 봐서는 자격이 나오지 않습니다.", {
    x: 0.95, y: 4.2, w: 11.9, h: 0.5, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: INK, lineSpacing: 17,
  });

  /* 김철수 — 점수가 다 있는데도 판정을 미룬다 */
  shot(s, "20-김철수.png", 0.62, 4.9, 12.55, 1.55);
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 6.5, w: 12.55, h: 0.72,
    fill: { color: "FFFBF2" }, line: { color: WARN, width: 1 },
  });
  s.addText("기초 88 · 종목 92 · 전문 「종이 시행」  →  미완", {
    x: 0.95, y: 6.55, w: 6.5, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: WARN,
  });
  s.addText("Level Ⅲ 전문시험은 아직 종이로 칩니다. 점수가 안 들어오니 임의로 합격시키지 않고 「미완」으로 둡니다.", {
    x: 0.95, y: 6.86, w: 11.9, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: INK,
  });

  page(s);
  s.addNotes("빠진 시험이 있으면 무엇이 빠졌는지 적어 보여줍니다. 사람이 착각해서 합격시킬 일이 없습니다.");
}

/* ══════════════════════════════════════════
    3  자격 이력 ③  만료
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "자격 이력 ③  만료를 먼저 알려 준다");
  sub(s, "자격이 만료된 사람이 검사를 나가면 고객 감사에서 바로 지적됩니다");

  shot(s, "22-이영희.png", 0.62, 1.5, 12.55, 2.15);

  const M = [
    ["자격 만료", "2026-09-30", "만료되는 달의 마지막 날에 끝난다.\nLevel Ⅱ 는 3년, Level Ⅲ 는 5년마다 다시 받는다."],
    ["지금 상태", "만료 33일 전", "3개월 안에 드는 순간 색이 바뀐다.\n명단을 뽑아 본인과 소속 부서에 알린다."],
    ["시력검사", "2026-04-30 만료", "자격이 살아 있어도 시력검사가 만료되면 잡힌다.\n검사일로부터 1년이다."],
  ];

  const cw = (12.55 - 0.4 * 2) / 3;
  M.forEach((m, i) => {
    const x = 0.62 + i * (cw + 0.4);
    s.addShape(p.ShapeType.rect, {
      x, y: 3.9, w: cw, h: 2.1,
      fill: { color: i === 1 ? "FFF2F2" : "FFFFFF" },
      line: { color: i === 1 ? RED : LINE, width: 1 },
    });
    s.addText(m[0], {
      x: x + 0.25, y: 4.1, w: cw - 0.5, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: MUT,
    });
    s.addText(m[1], {
      x: x + 0.25, y: 4.45, w: cw - 0.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 23, bold: true, color: i === 1 ? RED : INK,
    });
    s.addText(m[2], {
      x: x + 0.25, y: 5.05, w: cw - 0.5, h: 0.85, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: INK, lineSpacing: 18,
    });
  });

  s.addText("예전에는 달력에 적어 두고 사람이 챙겼습니다. 이제 명단이 저절로 나옵니다.", {
    x: 0.62, y: 6.25, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("자격 만료를 놓치는 것이 가장 큰 위험이었습니다.");
}

/* ══════════════════════════════════════════
    4  자격 이력 ④  바깥 자격 면제
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "자격 이력 ④  바깥 자격이 있으면");
  sub(s, "ASNT·ISO 9712 자격이 있으면 일부 시험을 면제받습니다. 대신 합격선이 80%입니다");

  s.addText("같은 ISO 9712 Level Ⅱ 소지자, 같은 전문시험 — 점수만 다릅니다", {
    x: 0.62, y: 1.5, w: 12.55, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: MUT,
  });

  /* 정약용 75 → 불합격 */
  shot(s, "23-정약용.png", 0.62, 1.92, 12.55, 1.95);
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 3.95, w: 12.55, h: 0.72,
    fill: { color: "FFF2F2" }, line: { color: RED, width: 1 },
  });
  s.addText("전문 75  →  불합격", {
    x: 0.95, y: 4.0, w: 3.2, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, bold: true, color: RED,
  });
  s.addText("면제받지 않았다면 개별 70%를 넘겨 통과였을 점수입니다. 면제자는 80%가 기준입니다.", {
    x: 4.3, y: 4.02, w: 8.6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: INK,
  });
  s.addText("일반시험은 「면제」로 뜨고, 옆에 ISO9712 II 표가 붙습니다. 미응시와 헷갈리지 않게 색을 달리했습니다.", {
    x: 0.95, y: 4.33, w: 11.9, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: MUT,
  });

  /* 강감찬 85 → 합격 */
  shot(s, "24-강감찬.png", 0.62, 4.85, 12.55, 1.95);
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 6.88, w: 12.55, h: 0.42,
    fill: { color: "F2FBF5" }, line: { color: OK, width: 1 },
  });
  s.addText("전문 85  →  필기 합격 · 만료일 2029-08-31 이 저절로 잡힙니다", {
    x: 0.95, y: 6.88, w: 11.9, h: 0.42, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: OK, valign: "middle",
  });

  page(s);
  s.addNotes("이 10점 차이를 사람이 판정하면 놓치기 쉽습니다. 면제자인 줄 모르고 70%로 보면 그대로 잘못 합격시킵니다.");
}

/* ══════════════════════════════════════════
    5  자격 이력 ⑤  규정 위반
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "자격 이력 ⑤  규정에 어긋난 것을 잡는다");
  sub(s, "불합격한 뒤 30일이 지나야 다시 칠 수 있습니다");

  shot(s, "25-홍길동.png", 0.62, 1.5, 12.55, 3.3);

  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 5.0, w: 12.55, h: 1.05,
    fill: { color: "FFFBF2" }, line: { color: WARN, width: 1 },
  });
  s.addText("확인  UT — 불합격 뒤 18일 만에 다시 쳤습니다. 규정대로면 2026-06-01부터입니다.", {
    x: 0.95, y: 5.12, w: 11.9, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, bold: true, color: WARN,
  });
  s.addText("추가 훈련 증거가 있으면 30일 이전에도 칠 수 있습니다. 그런 경우인지 사람이 확인하라고 알려 줍니다.", {
    x: 0.95, y: 5.5, w: 11.9, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: INK,
  });

  const NOTE = [
    ["UT 일반 60점 → 불합격", "2026-05-02"],
    ["다시 침 88점 → 합격", "2026-05-20   18일 뒤"],
  ];
  NOTE.forEach((n, i) => {
    const x = 0.62 + i * 6.5;
    s.addText(n[0], {
      x, y: 6.3, w: 6.2, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: INK,
    });
    s.addText(n[1], {
      x, y: 6.6, w: 6.2, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: i === 1 ? RED : MUT,
    });
  });

  s.addText("사람이 날짜를 세지 않아도 프로그램이 먼저 짚어 줍니다.", {
    x: 0.62, y: 6.95, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("이런 것이 나중에 감사에서 나오면 곤란합니다. 그때그때 잡습니다.");
}

/* ══════════════════════════════════════════
    9  관리자 ③ 서식이 채워진다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "관리자 화면 ③  서식이 저절로");
  sub(s, "규정이 남기라는 기록 12가지가 구글 스프레드시트에 저절로 쌓입니다");

  shot(s, "08-report.png", 0.62, 1.5, 5.9, 4.9);
  shot(s, "07-expiry.png", 6.75, 1.5, 5.9, 4.9);

  s.addText("E02-07  채점결과보고서", {
    x: 0.62, y: 6.5, w: 5.9, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU, align: "center",
  });
  s.addText("제출할 때마다 회차를 다시 세어 갱신", {
    x: 0.62, y: 6.82, w: 5.9, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: MUT, align: "center",
  });
  s.addText("E03-04  자격 만료 예정자 명단", {
    x: 6.75, y: 6.5, w: 5.9, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU, align: "center",
  });
  s.addText("기준일자마다 한 벌씩 쌓인다", {
    x: 6.75, y: 6.82, w: 5.9, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: MUT, align: "center",
  });

  page(s);
  s.addNotes("감사 때 바로 뽑아 낼 수 있습니다. 기록은 퇴사 후 5년 보존입니다.");
}

/* ══════════════════════════════════════════
    1  관리자 ④ 빈 서식
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "관리자 화면 ④  빈 서식");
  sub(s, "사람이 손으로 채우는 서식 아홉 가지도 화면에서 바로 뽑습니다");

  shot(s, "09-form.png", 3.9, 1.5, 6.0, 5.0);

  const L = [
    "E02-01  시행계획서 및 응시자 명단",
    "E02-02  감독 관리사항",
    "E02-03  응시자 유의사항",
    "E02-04  시험문제 폐기 대장",
    "E02-05  부정행위 처리 기록",
    "E02-06  문제은행 접근 기록",
    "E03-02  자격증 재발급 신청서",
    "E03-03  자격증 재발급 대장",
    "E03-05  자격종료 · 복권 기록",
  ];
  L.forEach((t, i) => {
    bullet(s, "· " + t, 0.62, 1.72 + i * 0.44, 3.2, 13.5);
  });

  s.addText("9종", {
    x: 0.62, y: 5.9, w: 3.2, h: 0.6, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 40, bold: true, color: RED,
  });
  s.addText("서식 번호가 붙어 있고\n늘 최신입니다", {
    x: 0.62, y: 6.5, w: 3.2, h: 0.6, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: MUT, lineSpacing: 18,
  });

  s.addText("바깥 기관 자격으로 면제받는 사람을 적는 칸을\nE02-01 에 새로 냈습니다 (E01 7.3.5 · 7.3.7)", {
    x: 10.1, y: 2.2, w: 3.1, h: 0.9, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: INK, lineSpacing: 19,
  });

  page(s);
  s.addNotes("서식은 사람이 손으로 채우는 것이지만, 양식을 찾아 헤맬 일은 없앴습니다.");
}

/* ══════════════════════════════════════════
    2  관리자 ⑤ 종이 시험
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "관리자 화면 ⑤  종이 시험");
  sub(s, "컴퓨터가 모자라거나 정전일 때는 시험지를 뽑아 종이로 칩니다");

  shot(s, "11-paper.png", 0.62, 1.52, 6.4, 5.15);

  const PAPER = [
    ["머리글", "회사 로고와 이름, 시험 종목, NDE Level,\n쪽 번호가 모든 장에 붙는다"],
    ["갑지", "NAME · DATE · Start · Finish · SCORE ·\nEXAMINER 기입란과 NOTE"],
    ["NOTE", "그 시험에 제공되는 참고자료를 밝힌다.\n다섯 유형으로 나눠 두었다 (E02 5.3.2)"],
    ["워터마크", "회사 로고를 가운데에 옅게 깐다.\n글씨를 가리지 않는 농도로 맞췄다"],
    ["Approved by", "대표 NDE Level Ⅲ 승인란 (E01 7.4.1)"],
  ];

  PAPER.forEach((t, i) => {
    const y = 1.6 + i * 1.02;
    s.addShape(p.ShapeType.ellipse, {
      x: 7.25, y: y + 0.05, w: 0.32, h: 0.32, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 7.25, y: y + 0.05, w: 0.32, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(t[0], {
      x: 7.68, y, w: 5.5, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: INK,
    });
    s.addText(t[1], {
      x: 7.68, y: y + 0.34, w: 5.5, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, lineSpacing: 17,
    });
  });

  s.addText("출력은 세 가지 — 시험지(백지) · 응시자가 푼 답안지 · 정답과 근거가 함께 나오는 관리자용.", {
    x: 0.62, y: 6.82, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("종이로 시행하면 폐기 대장(E02-04)도 함께 뽑습니다.");
}

/* ══════════════════════════════════════════
    3  만든 방법 ① VS Code
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ①  직접 짰다");
  sub(s, "사 온 프로그램이 아닙니다. VS Code 를 열어 한 줄씩 직접 짰습니다");

  shot(s, "15-code.png", 0.62, 1.52, 7.6, 5.05);

  const MADE = [
    ["11,027", "줄", "시험 보는 화면, 채점, 자격 이력, 인쇄"],
    ["18,300", "줄", "도구 131개 — 한글 시험지를 옮기고 틀린 데를 찾는다"],
    ["2,100", "줄", "종이에 뽑을 때의 모양 — 시험지·답안지·서식"],
    ["1,709", "줄", "필기시험 시행 규칙과 자격증 관리 규칙"],
  ];

  MADE.forEach((m, i) => {
    const y = 1.6 + i * 0.92;
    s.addText(m[0], {
      x: 8.5, y, w: 1.85, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 26, bold: true, color: BLU, align: "right",
    });
    s.addText(m[1], {
      x: 10.4, y: y + 0.16, w: 0.5, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, color: MUT,
    });
    s.addText(m[2], {
      x: 8.5, y: y + 0.5, w: 4.68, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: INK,
    });
  });

  s.addShape(p.ShapeType.rect, {
    x: 8.5, y: 5.35, w: 4.68, h: 1.3,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  /*
   * 커밋 수(207)를 내세우면 실제로 한 일보다 작아 보인다. 한 번 올릴
   * 때마다 수십 번 고치고 돌려 본다. 고친 줄 수가 실상에 가깝다.
   */
  s.addText("20만 줄을 고쳤습니다", {
    x: 8.78, y: 5.5, w: 4.2, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, bold: true, color: BLU,
  });
  s.addText("2026년 7월 23일부터 8월 28일까지 3주 동안,\n고쳐서 올린 것만 207번. 그 사이 수천 번 고쳤습니다.", {
    x: 8.78, y: 5.88, w: 4.2, h: 0.65, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: INK, lineSpacing: 17,
  });

  s.addText("위 화면은 실제 파일입니다. 숫자 하나하나 옆에 「이건 규정 몇 조에서 온 값이다」를 적어 두었습니다.", {
    x: 0.62, y: 6.78, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("사서 쓴 것이 아니라 우리 규정에 맞춰 직접 짠 것입니다. 그래서 규정이 바뀌면 우리가 고칠 수 있습니다.");
}

/* ══════════════════════════════════════════
    3-2  만든 방법 ①-2  VS Code 로 한 일
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ①-2  VS Code 로 한 일");
  sub(s, "글만 쓰는 프로그램이 아닙니다. 고치고 · 돌려 보고 · 되돌리는 일을 한자리에서 합니다");

  /*
   * 임원분들은 VS Code 가 무엇인지 모르신다. 「편집기」라고만 하면
   * 메모장처럼 들린다. 무엇을 어떻게 했는지를 일로 풀어 적는다.
   * 힘들었다는 말은 넣지 않는다 — 숫자가 대신 말한다.
   */
  const WORK = [
    ["파일 452개를 한 화면에",
     "화면 왼쪽에 파일이 나무처럼 펼쳐집니다. 시험 화면 · 문제은행 · 규칙\n" +
     "문서 · 도구가 다 한 창에 있어, 오가며 고칠 수 있습니다."],
    ["고치면 그 자리에서 바뀝니다",
     "저장하는 순간 옆에 띄워 둔 시험 화면이 다시 그려집니다. 「고쳤으니\n" +
     "다시 켜 보자」가 없습니다. 하루에도 수백 번 눈으로 확인했습니다."],
    ["452개에서 한 번에 찾아 바꿉니다",
     "「Level 2」를 「Level Ⅱ」로 바꾸는 일 하나에도 파일 수십 개가 걸립니다.\n" +
     "한 곳만 빠뜨리면 그 시험만 이름이 다르게 나갑니다."],
    ["터미널이 안에 붙어 있습니다",
     "만든 검사 도구를 창을 옮기지 않고 그 자리에서 돌립니다.\n" +
     "고친다 → 검사한다 → 다시 고친다 가 한 화면에서 끝납니다."],
    ["잘못 고쳐도 되돌립니다",
     "고친 것을 215번 나눠 저장해 두었습니다. 무엇을 왜 고쳤는지 함께\n" +
     "적어 두어, 어디서 어긋났는지 되짚어 찾아 들어갈 수 있습니다."],
  ];

  WORK.forEach((w, i) => {
    const y = 1.62 + i * 1.06;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 0.94,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: 0.92, y: y + 0.25, w: 0.44, h: 0.44, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 0.92, y: y + 0.25, w: 0.44, h: 0.44, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(w[0], {
      x: 1.5, y: y + 0.1, w: 4.6, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK,
    });
    s.addText(w[1], {
      x: 1.5, y: y + 0.44, w: 11.4, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, lineSpacing: 17,
    });
  });

  s.addText("사람이 다 기억할 수 없는 일을 프로그램이 대신 붙들어 줍니다. 그래서 혼자서도 끝까지 갈 수 있었습니다.", {
    x: 0.62, y: 6.95, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("VS Code 는 마이크로소프트가 무료로 내놓은 것입니다. 사는 데 든 돈이 없습니다.");
}

/* ══════════════════════════════════════════
    3-3  만든 방법 ①-3  한 벌을 옮기는 데
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ①-3  한 벌을 옮기는 데");
  sub(s, "「한글 시험지를 옮겼습니다」 한 줄이 실제로는 이런 일이었습니다");

  /*
   * 고생했다고 말하는 대신, 실제로 무슨 일이 있었는지를 그대로 적는다.
   * 읽는 분이 스스로 「간단한 일이 아니었구나」 하게 두는 편이 낫다.
   */
  const STORY = [
    ["1", "답지가 세 가지 꼴이었습니다",
     "49벌을 열어 보니 답을 적어 둔 모양이 제각각이었습니다. 표로 묶은 것,\n" +
     "칸을 그린 것, 아래에 각주로 단 것. 읽어 내는 도구를 세 번 다시 짰습니다.",
     "47 / 49 자동"],
    ["2", "번호가 서로 어긋나 있었습니다",
     "원본 시험지의 번호와 문제은행의 번호가 맞지 않는 데가 있었습니다.\n" +
     "번호로 짝지으면 엉뚱한 답이 붙습니다. 문제 글로 짝지어 맞췄습니다.",
     "1,369문항"],
    ["3", "같은 문제가 두 벌에 걸쳐 있었습니다",
     "원본이 A형·B형으로 나뉘어 있어 합치면 겹칩니다. 겹친 것을 찾아내는\n" +
     "도구를 따로 만들어 훑었습니다.",
     "은행 24개"],
    ["4", "답을 그대로 믿지 않았습니다",
     "원본에 적힌 답을 옮기기만 하면 원본의 잘못까지 따라옵니다.\n" +
     "직접 풀어 맞대 보았고, 그러다 영문 오타 14가지를 찾았습니다.",
     "오타 14가지"],
  ];

  STORY.forEach((t, i) => {
    const y = 1.66 + i * 1.30;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 1.18,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addText(t[0], {
      x: 0.9, y: y + 0.3, w: 0.6, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 30, bold: true, color: LINE, align: "center",
    });
    s.addText(t[1], {
      x: 1.62, y: y + 0.16, w: 7.4, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK,
    });
    s.addText(t[2], {
      x: 1.62, y: y + 0.56, w: 9.3, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, lineSpacing: 17,
    });
    s.addText(t[3], {
      x: 11.05, y: y + 0.38, w: 1.9, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: RED,
      align: "center", valign: "middle",
    });
  });

  s.addText("옮겨 담는 일이 아니라 맞대어 보는 일이었습니다. 그래서 지금 은행에 든 답은 원본보다 앞서 있습니다.", {
    x: 0.62, y: 6.95, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("문제은행이 원본보다 앞서 있습니다. 원본을 고칠 때 이 은행을 근거로 쓰시면 됩니다.");
}

/* ══════════════════════════════════════════
    4  만든 방법 ②  절차서를 코드로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ②  규정을 코드로");
  sub(s, "자격인정 규정을 펴 놓고, 조항 하나하나가 프로그램의 어느 자리가 될지 정했습니다");

  /*
   * 규정 → 프로그램. 어느 조항이 어느 파일의 어느 값이 되었는지.
   * 전부 실제로 있는 파일과 이름이다.
   */
  const MAP = [
    ["E01 표 3", "종목마다 몇 문제를 낼지", "ExamData.jsx", "QUESTION_COUNT"],
    ["E01 7.3.4", "Level Ⅲ 기초 55 · 종목 65", "ExamData.jsx", "Level III"],
    ["E01 7.4.4", "종합점수는 단순 평균", "history.js", "average()"],
    ["E01 7.4.5", "개별 70% · 종합 80%", "history.js", "PASS_EACH / PASS_TOTAL"],
    ["E01 7.5", "재시험은 30일 지나서", "history.js", "RETAKE_DAYS"],
    ["E01 7.9.2", "재자격 Ⅰ·Ⅱ 3년 · Ⅲ 5년", "history.js", "RECERT_YEARS"],
    ["E01 7.3.2", "시력검사는 1년", "history.js", "EYE_YEARS"],
    ["E01 7.3.5·7.3.7", "바깥 자격이 있으면 면제", "history.js", "exemptKinds()"],
    ["E03 6.2.1", "만료 3개월 전에 알린다", "history.js", "WARN_MONTHS"],
    ["E02 7.3.1", "보기 차례를 시험마다 섞는다", "optionShuffle.js", "shuffleOptions()"],
    ["E02 5.3.2", "시험지 NOTE 다섯 유형", "examNote.js", "examNote()"],
    ["E02 8.0", "빈 서식 아홉 가지", "blankForms.jsx", "BLANK_FORMS"],
  ];

  const rh = 0.42;
  const y0 = 1.62;

  /* 머리줄 */
  ["규정 조항", "무엇을 정하나", "어느 파일", "어느 값"].forEach((h, i) => {
    const x = [0.62, 2.85, 7.55, 10.0][i];
    const w = [2.2, 4.65, 2.4, 3.18][i];
    s.addShape(p.ShapeType.rect, {
      x, y: y0, w, h: rh,
      fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
    });
    s.addText(h, {
      x: x + 0.12, y: y0, w: w - 0.24, h: rh, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: BLU, valign: "middle",
    });
  });

  MAP.forEach((r, i) => {
    const y = y0 + rh + i * rh;
    if (i % 2 === 0) {
      s.addShape(p.ShapeType.rect, {
        x: 0.62, y, w: 12.56, h: rh,
        fill: { color: "F9F9F9" }, line: { color: "F9F9F9", width: 0 },
      });
    }
    [[0.62, 2.2, r[0], 12.5, RED, true],
     [2.85, 4.65, r[1], 13, INK, false],
     [7.55, 2.4, r[2], 12, MUT, false],
     [10.0, 3.18, r[3], 12, BLU, false]].forEach(([x, w, t, sz, col, bold]) => {
      s.addText(t, {
        x: x + 0.12, y, w: w - 0.24, h: rh, isTextBox: true, margin: 0,
        fontFace: F, fontSize: sz, color: col, bold, valign: "middle",
      });
    });
  });

  s.addText("숫자를 코드 안에 그냥 적어 두지 않았습니다. 이름을 붙여 한자리에 모으고, 그 옆에 「이건 규정 몇 조에서 온 값이다」를 적었습니다.", {
    x: 0.62, y: 6.9, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("규정이 개정되면 이 표를 보고 그 자리만 고치면 됩니다. 프로그램 전체를 뒤질 필요가 없습니다.");
}

/* ══════════════════════════════════════════
    5  만든 방법 ③  어떤 차례로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ③  어떤 차례로");
  sub(s, "규정을 먼저 읽고, 시험지를 옮기고, 그 다음에 화면을 만들었습니다");

  const STEP = [
    ["규정을 먼저 읽었다",
     "자격인정 규정(HIE-QP-E01)를 처음부터 끝까지 읽고, 시험에 관한 조항을 뽑아 표로\n" +
     "만들었습니다. 어느 값이 어디서 오는지 먼저 정리한 것입니다.",
     "7월"],
    ["종이 시험지를 옮겨 담았다",
     "한글 시험지 49개를 프로그램이 읽을 수 있는 꼴로 바꿨습니다. 그림 28장도 함께\n" +
     "뽑아 냈습니다. 옮긴 뒤 원본과 한 문제씩 맞춰 봤습니다.",
     "7~8월"],
    ["규칙 문서를 새로 썼다",
     "규정만 있고 시행 규칙이 없었습니다. 필기시험 시행 규칙(E02)과 자격증\n" +
     "발행·관리 규칙(E03)을 지어, 조항마다 E01 어디서 왔는지 달았습니다.",
     "8월"],
    ["화면과 채점을 만들었다",
     "시험 화면, 채점, 자격 이력, 인쇄까지. 규정 값은 앞에서 정리한 표를 그대로\n" +
     "옮겨 넣었습니다.",
     "8월"],
    ["검사를 만들어 붙였다",
     "고칠 때마다 사람이 다 확인할 수 없어, 확인하는 일 자체를 프로그램으로\n" +
     "만들었습니다. 지금 열다섯 가지가 돕니다.",
     "8월"],
  ];

  STEP.forEach((t, i) => {
    const y = 1.62 + i * 1.06;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 0.94,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: 0.92, y: y + 0.25, w: 0.44, h: 0.44, fill: { color: BLU },
    });
    s.addText(String(i + 1), {
      x: 0.92, y: y + 0.25, w: 0.44, h: 0.44, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(t[0], {
      x: 1.5, y: y + 0.1, w: 5.2, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 18, bold: true, color: INK,
    });
    s.addText(t[2], {
      x: 11.9, y: y + 0.14, w: 1.0, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: RED, align: "right",
    });
    s.addText(t[1], {
      x: 1.5, y: y + 0.44, w: 10.2, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, lineSpacing: 17,
    });
  });

  s.addText("화면부터 만들지 않았습니다. 규정을 먼저 읽고 값을 정리한 뒤에 만들었기 때문에, 나중에 뜯어고칠 일이 없었습니다.", {
    x: 0.62, y: 6.95, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("규정을 먼저 읽은 것이 가장 큰 차이였습니다. TOFD·PAUT 문항 수가 어긋난 것도 그때 찾았습니다.");
}

/* ══════════════════════════════════════════
    6  만든 방법 ② 문제은행
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ④  문제은행");
  sub(s, "종이 시험지를 한 문제씩 옮겨 담고, 규정이 요구하는 수보다 넉넉히 채웠습니다");

  const BANK = [
    ["Level Ⅱ 일반", "9종목", "528", "한 종목에 60문제씩. 시험에는 40문제만 나간다"],
    ["Level Ⅱ 전문", "9종목", "274", "한 종목에 26~45문제. 시험에는 20~30문제"],
    ["Level Ⅲ", "기초 + 5종목", "567", "기초 85, 종목 65~107문제씩"],
  ];

  BANK.forEach((b, i) => {
    const y = 1.68 + i * 1.28;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 8.6, h: 1.1,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addText(b[0], {
      x: 0.95, y: y + 0.14, w: 3.0, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 19, bold: true, color: INK,
    });
    s.addText(b[1], {
      x: 3.95, y: y + 0.2, w: 1.6, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13.5, color: MUT,
    });
    s.addText(b[2], {
      x: 5.5, y: y + 0.1, w: 1.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 26, bold: true, color: BLU, align: "right",
    });
    s.addText("문항", {
      x: 7.05, y: y + 0.26, w: 0.7, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: MUT,
    });
    s.addText(b[3], {
      x: 0.95, y: y + 0.6, w: 8.0, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT,
    });
  });

  shot(s, "16-bank.png", 9.55, 1.68, 3.62, 2.4);

  s.addShape(p.ShapeType.rect, {
    x: 9.55, y: 4.2, w: 3.62, h: 1.38,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("1,369", {
    x: 9.55, y: 4.3, w: 3.62, h: 0.72, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 34, bold: true, color: BLU, align: "center",
  });
  s.addText("문항 · 은행 24개", {
    x: 9.55, y: 5.02, w: 3.62, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: INK, align: "center",
  });
  s.addText("원본 시험지    1,110\n새로 지어 채움     259", {
    x: 9.85, y: 3.6, w: 3.0, h: 0.7, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: MUT, align: "center",
  });
  s.addText("그림이 들어가는 문제 28개.", {
    x: 9.55, y: 9.9, w: 3.0, h: 1.05, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: MUT, lineSpacing: 16,
  });

  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 5.72, w: 12.55, h: 1.15,
    fill: { color: "FFF2F2" }, line: { color: RED, width: 1 },
  });
  s.addText("원본 시험지에서 찾아 바로잡은 것", {
    x: 0.95, y: 5.85, w: 6.0, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: RED,
  });
  s.addText("영문 오타 14가지 (Mamgetic → Magnetic 등)   ·   잘못된 정답 4건   ·   겹친 보기 1건   ·   " +
            "검사절차서 번호 오기 3건   ·   보기가 2~3개뿐이던 86문항을 4지선다로", {
    x: 0.95, y: 6.22, w: 11.9, h: 0.5, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: INK,
  });

  page(s);
  s.addNotes("규정 수와 은행 수가 같으면 뽑을 것이 없어 같은 문제가 나갑니다. 그래서 넉넉히 채웠습니다.");
}

/* ══════════════════════════════════════════
    7  만든 방법 ③ 문제가 다르다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ⑤  문제가 매번 다르다");
  sub(s, "문제와 보기 차례를 시험마다 바꿉니다 — 규정이 그렇게 하라고 정하고 있습니다");

  /* 큰 숫자 하나로 못 박는다 */
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 1.65, w: 12.55, h: 2.05,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("4,200,000,000,000,000", {
    x: 0.62, y: 1.78, w: 12.55, h: 1.05, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 54, bold: true, color: BLU, align: "center",
  });
  s.addText("MT 일반시험 하나에서 만들 수 있는 서로 다른 시험지의 가짓수 — 4,200조 가지", {
    x: 0.62, y: 2.88, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, color: INK, align: "center",
  });
  s.addText("60문제 중에 40개를 뽑는 방법이 이만큼입니다. 여기에 보기 차례까지 섞으니, 같은 시험지가 두 번 나올 일이 없습니다.", {
    x: 0.62, y: 3.25, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, color: MUT, align: "center",
  });

  const C = [
    ["1,369", "문항", "원본 1,110 + 보강 259"],
    ["139", "안 섞는 보기", "「위 모두 정답」처럼 자리를\n옮기면 말이 안 되는 것"],
    ["219,200", "번 돌려 봤다", "보기를 섞어도 채점이\n어긋나지 않는지 확인"],
  ];
  const cw = (12.55 - 0.5 * 2) / 3;
  C.forEach((c, i) => {
    const x = 0.62 + i * (cw + 0.5);
    s.addShape(p.ShapeType.rect, {
      x, y: 4.0, w: cw, h: 2.2, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addText(c[0], {
      x: x + 0.15, y: 4.2, w: cw - 0.3, h: 0.75, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 34, bold: true, color: RED, align: "center",
    });
    s.addText(c[1], {
      x: x + 0.15, y: 4.98, w: cw - 0.3, h: 0.35, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: INK, align: "center",
    });
    s.addText(c[2], {
      x: x + 0.15, y: 5.38, w: cw - 0.3, h: 0.7, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, align: "center", lineSpacing: 17,
    });
  });

  page(s);
  s.addNotes("문제 유출을 걱정하지 않아도 됩니다. 조합이 사실상 무한합니다.");
}

/* ══════════════════════════════════════════
    8  만든 방법 ④ 규정
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ⑥  규정을 그대로");
  sub(s, "프로그램 안의 숫자는 전부 규정에서 가져온 것입니다. 제가 정한 것이 없습니다");

  const rows = [
    ["E01 표 3", "종목별 필기시험 최소 문제 수"],
    ["E01 7.3.4", "Level Ⅲ 기초 55 · 종목 65 · 전문 20"],
    ["E01 7.4.4 · 7.4.5", "종합은 단순 평균 · 개별 70% 종합 80%"],
    ["E01 7.3.5 · 7.3.7", "ASNT · ISO 9712 소지자 시험 면제, 합격선 80%"],
    ["E01 7.5", "불합격 재시험은 30일 경과 후"],
    ["E01 7.9.2", "재자격 Level Ⅰ·Ⅱ 3년 · Level Ⅲ 5년"],
  ];

  const cw = (12.55 - 0.42) / 2;
  rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.62 + col * (cw + 0.42);
    const y = 1.72 + row * 1.0;
    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: 0.84, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addText(r[0], {
      x: x + 0.25, y: y + 0.08, w: cw - 0.5, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: RED,
    });
    s.addText(r[1], {
      x: x + 0.25, y: y + 0.42, w: cw - 0.5, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, color: INK,
    });
  });

  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 4.9, w: 12.55, h: 1.75,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("규정 원본과 프로그램을 기계가 맞춰 봅니다", {
    x: 1.0, y: 5.05, w: 11.8, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 19, bold: true, color: BLU,
  });
  s.addText("자격인정 규정(HIE-QP-E01)의 한글 파일을 프로그램이 직접 읽습니다. 거기 적힌 숫자와\n" +
            "우리 시행 규칙, 그리고 시험 프로그램이 같은 값을 쓰는지 19가지 잣대로 맞춰 봅니다.\n" +
            "규정을 인용한 101군데를 원문과 한 줄씩 대조했습니다.", {
    x: 1.0, y: 5.5, w: 11.8, h: 0.95, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: INK, lineSpacing: 22,
  });

  page(s);
  s.addNotes("규정이 바뀌면 그 자리를 찾아 고치면 됩니다.");
}

/* ══════════════════════════════════════════
    9  만든 방법 ⑤ 검사
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ⑦  스스로 검사");
  sub(s, "문제를 하나라도 고치면, 어디가 틀어졌는지 프로그램이 스스로 찾아냅니다");

  const CHK = [
    ["채점", "은행 24개 1,369문항"],
    ["보기 섞기", "219,200회 돌려 확인"],
    ["겹친 보기", "한 문항에 같은 보기"],
    ["이력 · 만료", "날짜 계산 116가지를 미리 맞춰 둠"],
    ["규정 대조", "규정 원본과 숫자가 같은지"],
    ["철자 · 받침", "규칙 문서 두 건"],
    ["표가 종이에", "쪽을 넘기는 행"],
    ["겹치는 조항", "같은 말을 두 번"],
  ];

  shot(s, "13-checks.png", 0.62, 1.52, 7.3, 4.7);

  const cw = (12.55 - 7.3 - 0.4 - 0.3) / 2;
  CHK.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 8.32 + col * (cw + 0.3);
    const y = 1.55 + row * 1.3;
    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: 1.15, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: x + 0.2, y: y + 0.18, w: 0.32, h: 0.32, fill: { color: OK },
    });
    s.addText("✓", {
      x: x + 0.2, y: y + 0.18, w: 0.32, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(c[0], {
      x: x + 0.6, y: y + 0.18, w: cw - 0.8, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: INK, valign: "middle",
    });
    s.addText(c[1], {
      x: x + 0.2, y: y + 0.58, w: cw - 0.4, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: MUT, lineSpacing: 18,
    });
  });

  s.addText("왼쪽은 방금 돌린 결과입니다. 열다섯 가지가 모두 통과합니다 — 문제를 손댈 때마다 다시 돌립니다.", {
    x: 0.62, y: 6.42, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("왼쪽은 방금 돌린 결과입니다. 꾸며 낸 화면이 아닙니다.");
}

/* ══════════════════════════════════════════
    2  만든 방법 ⑥ 굴러가는 법
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "만든 방법 ⑧  어떻게 굴러가나");
  sub(s, "고친 것이 응시자 화면까지 어떻게 가는지, 푼 결과가 어디에 쌓이는지");

  const N = [
    ["고친다", "내 컴퓨터에서 문제나 규정 값을 고친다", "사람"],
    ["올린다", "틀린 데가 없는지 검사하고 인터넷에 올린다", "사람"],
    ["반영된다", "올리면 저절로 웹사이트에 붙는다 — 2~3분", "자동"],
    ["푼다", "응시자가 주소를 열어 시험을 친다", "응시자"],
    ["쌓인다", "제출하면 구글 스프레드시트에 한 줄이 쌓인다", "자동"],
    ["확인한다", "관리자가 결과와 자격 이력을 본다", "관리자"],
  ];

  const cw = (12.55 - 0.42 * 2) / 3;
  N.forEach((n, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.62 + col * (cw + 0.42);
    const y = 1.75 + row * 2.35;
    const auto = n[2] === "자동";

    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: 2.0,
      fill: { color: auto ? "F2FBF5" : "FFFFFF" },
      line: { color: auto ? OK : LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: x + 0.28, y: y + 0.28, w: 0.44, h: 0.44,
      fill: { color: auto ? OK : RED },
    });
    s.addText(String(i + 1), {
      x: x + 0.28, y: y + 0.28, w: 0.44, h: 0.44, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(n[0], {
      x: x + 0.85, y: y + 0.28, w: cw - 1.1, h: 0.44, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 21, bold: true, color: INK, valign: "middle",
    });
    s.addText(n[1], {
      x: x + 0.28, y: y + 0.9, w: cw - 0.56, h: 0.66, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13.5, color: MUT, lineSpacing: 19,
    });
    s.addText(n[2], {
      x: x + 0.28, y: y + 1.55, w: 1.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: auto ? OK : RED,
    });
    if (col < 2) {
      s.addText("▶", {
        x: x + cw + 0.04, y: y + 0.8, w: 0.34, h: 0.4, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 13, color: LINE, align: "center",
      });
    }
  });

  s.addText("서버를 따로 사지 않았습니다. 화면은 깃허브가 공짜로 띄워 주고, 기록은 회사가 이미 쓰는 구글 스프레드시트에 쌓입니다.", {
    x: 0.62, y: 6.55, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("가운데 셋은 손대지 않아도 굴러갑니다.");
}

/* ══════════════════════════════════════════
    3  찾아낸 것 ①
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "찾아낸 것 — 규정과 어긋나 있던 것");
  sub(s, "옮기려면 규정을 한 줄씩 다시 읽어야 했습니다. 그러다 드러난 것들입니다");

  const GAP = [
    ["TOFD · PAUT 전문시험이 5문항 적게 나갔다",
     "전 종목을 일반 40 · 전문 25로 못 박아 두었다.",
     "E01 표 3은 종목마다 다르다 — TOFD·PAUT·CR·DR·FMC 는 전문 30문항"],
    ["Level Ⅲ 종목시험이 104문항으로 나갔다",
     "출제 수를 정하지 않아 은행 전체가 나갔다.",
     "규정은 65문항, 시험시간 2시간 — 104문항이면 한 문항에 69초"],
    ["회차마다 같은 문제가 나갔다",
     "은행에 든 문항이 규정 출제 수와 똑같았다.",
     "뽑을 것이 없으니 있는 문항이 전부 나간다"],
  ];

  GAP.forEach((g, i) => {
    const y = 1.7 + i * 1.55;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 1.34,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.rect, {
      x: 11.75, y: y + 0.42, w: 1.1, h: 0.48,
      fill: { color: "E8F7EE" }, line: { color: OK, width: 1 },
    });
    s.addText("고침", {
      x: 11.75, y: y + 0.42, w: 1.1, h: 0.48, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: OK,
      align: "center", valign: "middle",
    });
    s.addText(g[0], {
      x: 0.95, y: y + 0.14, w: 10.6, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 19, bold: true, color: RED,
    });
    s.addText(g[1], {
      x: 0.95, y: y + 0.58, w: 10.6, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, color: INK,
    });
    s.addText("→ " + g[2], {
      x: 0.95, y: y + 0.9, w: 10.6, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: BLU,
    });
  });

  s.addText("원본 시험지에서도 영문 오타 14가지 · 잘못된 정답 4건 · 겹친 보기 1건 · 검사절차서 번호 오기 3건을 찾아 바로잡았습니다.", {
    x: 0.62, y: 6.5, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("첫 번째는 고객 감사에서 지적될 수 있는 것이었습니다. 옮기지 않았으면 몰랐습니다.");
}

/* ══════════════════════════════════════════
    4  앞으로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "앞으로");
  sub(s, "바로 할 수 있는 것과, 규정부터 고쳐야 하는 것을 나눴습니다");

  const NOW = [
    ["시험 준비 상태로 바꾸기", "지금은 검토하려고 문제가 전부 보이게 해 두었다. 무작위로 나오게 바꾼다", "시험 전"],
    ["Level Ⅲ VT 문제 더 짓기", "규정이 65문제인데 은행에도 65문제뿐이라 늘 같은 시험이 나간다", "올해 안"],
    ["관리자 비밀번호 옮기기", "지금은 프로그램 안에 들어 있어 마음먹으면 볼 수 있다", "올해 안"],
    ["요원 명부 시력검사일 채우기", "비어 있으면 시력 만료를 계산할 수 없다", "바로"],
  ];
  const LATER = [
    ["Level Ⅲ 전문시험도 컴퓨터로", "규정이 종이로 치도록 정하고 있어 규정부터 고쳐야 한다"],
    ["실기시험과 실증", "이 프로그램은 필기시험만 다룬다"],
  ];

  s.addText("지금 할 것", {
    x: 0.62, y: 1.62, w: 7.6, h: 0.38, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 20, bold: true, color: RED,
  });
  NOW.forEach((n, i) => {
    const y = 2.1 + i * 1.12;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 7.6, h: 0.98,
      fill: { color: i === 0 ? "FFF2F2" : "FFFFFF" },
      line: { color: i === 0 ? RED : LINE, width: 1 },
    });
    s.addText(n[0], {
      x: 0.9, y: y + 0.12, w: 5.5, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: i === 0 ? RED : INK,
    });
    s.addText(n[2], {
      x: 6.5, y: y + 0.14, w: 1.5, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: i === 0 ? RED : BLU, align: "right",
    });
    s.addText(n[1], {
      x: 0.9, y: y + 0.5, w: 7.0, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT,
    });
  });

  s.addText("규정을 손봐야 되는 것", {
    x: 8.55, y: 1.62, w: 4.6, h: 0.38, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 20, bold: true, color: MUT,
  });
  LATER.forEach((l, i) => {
    const y = 2.1 + i * 1.35;
    s.addShape(p.ShapeType.rect, {
      x: 8.55, y, w: 4.62, h: 1.2,
      fill: { color: "F7F7F7" }, line: { color: LINE, width: 1 },
    });
    s.addText(l[0], {
      x: 8.82, y: y + 0.15, w: 4.1, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: INK,
    });
    s.addText(l[1], {
      x: 8.82, y: y + 0.58, w: 4.1, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: MUT, lineSpacing: 16,
    });
  });

  s.addShape(p.ShapeType.rect, {
    x: 8.55, y: 4.95, w: 4.62, h: 1.6,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("유지비", {
    x: 8.82, y: 5.1, w: 4.1, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU,
  });
  s.addText("0 원", {
    x: 8.82, y: 5.42, w: 4.1, h: 0.6, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 36, bold: true, color: BLU,
  });
  s.addText("GitHub Pages + 구글 시트\n둘 다 회사가 이미 쓰는 것", {
    x: 8.82, y: 6.0, w: 4.1, h: 0.5, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11.5, color: MUT, lineSpacing: 15,
  });

  s.addText("첫 줄 — 실제 시험을 치기 전에 반드시 바꿔야 합니다.", {
    x: 0.62, y: 6.72, w: 7.6, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: RED,
  });

  page(s);
  s.addNotes("검토 모드는 지금 켜져 있습니다. 시험 전에 끄면 됩니다 — 한 줄만 바꾸면 됩니다.");
}

/* ══════════════════════════════════════════
    5  맺음 — 한 문장으로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();

  s.addText("규정을 사람이 기억하는 대신,\n프로그램이 지키게 했습니다.", {
    x: 0.62, y: 1.9, w: 12.55, h: 2.1, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 42, bold: true, color: RED,
    align: "center", valign: "middle", lineSpacing: 60,
  });

  const END = [
    ["시험 한 번에 사람이 하던 일", "10 단계  →  3 단계"],
    ["같은 시험을 두 번 쳐도", "문제가 다르다"],
    ["자격 만료·시력 만료", "프로그램이 먼저 알려 준다"],
    ["규정이 바뀌면", "그 자리만 고치면 된다"],
  ];

  const cw = (12.55 - 0.4 * 3) / 4;
  END.forEach((e, i) => {
    const x = 0.62 + i * (cw + 0.4);
    s.addShape(p.ShapeType.rect, {
      x, y: 4.4, w: cw, h: 1.5,
      fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
    });
    s.addText(e[0], {
      x: x + 0.15, y: 4.6, w: cw - 0.3, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT, align: "center", lineSpacing: 17,
    });
    s.addText(e[1], {
      x: x + 0.15, y: 5.15, w: cw - 0.3, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: BLU,
      align: "center", valign: "middle",
    });
  });

  s.addText("값 하나하나가 규정 어느 조항에서 왔는지 적혀 있습니다. 사 온 프로그램이 아니라 우리가 만든 것이라, 우리가 고칠 수 있습니다.", {
    x: 0.62, y: 6.2, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: INK, align: "center",
  });

  page(s);
  s.addNotes("이 한 문장이 이 발표의 전부입니다.");
}

/* ══════════════════════════════════════════
    6  감사합니다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  s.addText("감사합니다.", {
    x: 3.31, y: 2.93, w: 9.09, h: 1.41, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 66, bold: true, color: INK, align: "center", valign: "middle",
  });
  page(s);
  s.addNotes("질문 받겠습니다.");
}

const OUT = "docs/발표자료-CBT-2026-08.pptx";
p.writeFile({ fileName: OUT }).then(() => {
  console.log(`만듦  ${OUT}  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB  ${no}장`);
});
