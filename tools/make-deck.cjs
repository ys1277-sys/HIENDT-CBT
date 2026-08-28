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
   1  표지 — 양식 1장 그대로
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
  sub(s, "종이 시험지로 하던 일");

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
   3  무엇을 만들었나 — 첫 화면
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "WHAT");
  sub(s, "브라우저로 여는 사내 시험 시스템");

  shot(s, "01-home.png", 0.62, 1.62, 7.4, 4.7);

  const R = [
    ["설치가 없다", "주소만 알면 어느 컴퓨터에서든 열린다"],
    ["로그인이 없다", "이름·등급·종목을 고르면 바로 시작"],
    ["사내망이 아니어도 된다", "현장·출장지에서도 응시할 수 있다"],
    ["종이도 그대로", "단말이 모자라면 시험지를 출력해 쓴다"],
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

  s.addText("Level Ⅱ 일반·전문 9종목, Level Ⅲ 기초·종목 — 필기시험 전 구간", {
    x: 0.62, y: 6.45, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: MUT,
  });

  page(s);
  s.addNotes("이 화면이 전부입니다. 이름 넣고 종목 고르면 시험이 시작됩니다.");
}

/* ══════════════════════════════════════════
   4  시험 화면
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "시험 화면");
  sub(s, "영문 원문과 우리말을 함께 보여줍니다");

  shot(s, "02-quiz.png", 1.55, 1.55, 10.7, 4.75);

  const NOTE = [
    ["Question 1/40", "규정이 정한 문항 수만큼만 뽑는다"],
    ["답안 표기란", "지금까지 고른 답을 한눈에"],
    ["계산기", "화면 안에서 열고 닫는다"],
  ];
  NOTE.forEach((n, i) => {
    const x = 1.55 + i * 3.62;
    s.addText(n[0], {
      x, y: 6.45, w: 3.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: BLU,
    });
    s.addText(n[1], {
      x, y: 6.75, w: 3.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUT,
    });
  });

  page(s);
  s.addNotes("원본 시험지가 영문이라 그대로 두고 아래에 우리말을 붙였습니다.");
}

/* ══════════════════════════════════════════
   5  회차마다 다른 시험지
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "회차마다 다른 시험지");
  sub(s, "HIE-QP-E02 7.3.1 — 문항과 보기 순서를 회차마다 바꾼다");

  /* 큰 숫자 하나로 못 박는다 */
  s.addShape(p.ShapeType.rect, {
    x: 0.62, y: 1.65, w: 12.55, h: 2.05,
    fill: { color: "F2F8FD" }, line: { color: BLU, width: 1 },
  });
  s.addText("4,200,000,000,000,000", {
    x: 0.62, y: 1.78, w: 12.55, h: 1.05, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 54, bold: true, color: BLU, align: "center",
  });
  s.addText("MT 일반시험 한 종목에서 나올 수 있는 시험지 조합의 수 (60문항 중 40문항)", {
    x: 0.62, y: 2.88, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 16, color: INK, align: "center",
  });
  s.addText("여기에 보기 순서까지 섞습니다. 같은 시험지가 두 번 나올 일이 없습니다.", {
    x: 0.62, y: 3.25, w: 12.55, h: 0.35, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, color: MUT, align: "center",
  });

  const C = [
    ["1,369", "문항", "원본 1,110 + 보강 259"],
    ["139", "묶어 둔 보기", "「위 모두 정답」처럼 자리를\n옮기면 안 되는 것"],
    ["219,200", "회 확인", "보기를 섞어도 채점이\n그대로인지 돌려 봤다"],
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
   6  채점이 사라졌다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "채점이 사라졌다");
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
   7  자격 이력 — 사람 단위로
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "자격을 놓치지 않는다");
  sub(s, "응시 기록을 사람 단위로 묶어 만료까지 봅니다");

  shot(s, "06-history.png", 0.62, 1.5, 12.55, 4.35);

  const P = [
    ["만료 3개월 전", "명단이 자동으로 나온다 (E03 6.2.1)"],
    ["시력검사 1년", "자격이 살아 있어도 시력이 만료되면 잡힌다"],
    ["재시험 30일", "규정보다 일찍 친 것을 찾아낸다 (E01 7.5)"],
    ["바깥 자격 면제", "ASNT·ISO 9712 소지자는 합격선이 80%"],
  ];
  const cw = (12.55 - 0.35 * 3) / 4;
  P.forEach((t, i) => {
    const x = 0.62 + i * (cw + 0.35);
    s.addText(t[0], {
      x, y: 6.05, w: cw, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: RED,
    });
    s.addText(t[1], {
      x, y: 6.38, w: cw, h: 0.6, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: INK, lineSpacing: 17,
    });
  });

  page(s);
  s.addNotes("자격이 만료된 사람이 검사하면 고객 감사에서 바로 지적됩니다. 그걸 사람이 기억하지 않아도 됩니다.");
}

/* ══════════════════════════════════════════
   8  서식이 저절로 채워진다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "서식이 저절로 채워진다");
  sub(s, "규정이 요구하는 기록 12종을 구글 시트가 받습니다");

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
   9  빈 서식도 바로 뽑는다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "빈 서식도 바로 뽑는다");
  sub(s, "규칙 문서를 열어 그 부분만 인쇄할 필요가 없습니다");

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
   10  어떻게 굴러가나
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "어떻게 굴러가나");
  sub(s, "사람이 손대는 자리는 첫 칸과 마지막 칸뿐입니다");

  const N = [
    ["고친다", "VS Code 에서 문항·출제 수·절차서를", "사람"],
    ["올린다", "검사를 돌리고 GitHub 에 올린다", "사람"],
    ["배포된다", "GitHub 이 스스로 빌드해 웹에  2~3분", "자동"],
    ["푼다", "응시자가 주소로 들어와 시험을 친다", "응시자"],
    ["쌓인다", "제출하면 구글 시트에 한 줄이 붙는다", "자동"],
    ["확인한다", "관리자 화면에서 결과와 이력을 본다", "관리자"],
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

  s.addText("서버를 따로 두지 않았습니다. 화면은 GitHub Pages, 기록은 구글 시트 — 둘 다 회사가 이미 쓰는 것이라 유지비가 들지 않습니다.", {
    x: 0.62, y: 6.55, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("가운데 셋은 손대지 않아도 굴러갑니다.");
}

/* ══════════════════════════════════════════
   11  옮기다 찾아낸 것
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "옮기다 찾아낸 것");
  sub(s, "규정을 한 줄씩 다시 읽어야 했습니다. 그러다 드러났습니다");

  const FIND = [
    ["TOFD · PAUT 전문시험이 규정보다 5문항 적게 나갔다",
     "전 종목을 일반 40 · 전문 25로 못 박아 두었는데 E01 표 3은 종목마다 다르다"],
    ["Level Ⅲ 종목시험이 104문항으로 나갔다",
     "은행 전체가 나갔다. 시험시간 2시간에 문항당 69초였다"],
    ["원본 시험지에 오타와 잘못된 정답이 있었다",
     "영문 오타 14가지 · 잘못된 정답 4건 · 겹친 보기 1건 · 절차서 번호 오기 3건"],
    ["계산기가 조용히 틀린 값을 냈다",
     "sin(30)이 라디안이라 −0.988, log가 자연로그라 dB 계산이 전부 틀렸다"],
  ];

  FIND.forEach((f, i) => {
    const y = 1.72 + i * 1.28;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 1.1,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.rect, {
      x: 11.85, y: y + 0.3, w: 1.0, h: 0.44,
      fill: { color: "E8F7EE" }, line: { color: OK, width: 1 },
    });
    s.addText("고침", {
      x: 11.85, y: y + 0.3, w: 1.0, h: 0.44, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: OK,
      align: "center", valign: "middle",
    });
    s.addText(f[0], {
      x: 0.95, y: y + 0.14, w: 10.7, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 18, bold: true, color: RED,
    });
    s.addText(f[1], {
      x: 0.95, y: y + 0.58, w: 10.7, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13.5, color: MUT,
    });
  });

  page(s);
  s.addNotes("옮기지 않았으면 몰랐을 것들입니다. 첫 번째는 감사 지적 대상입니다.");
}

/* ══════════════════════════════════════════
   12  규정을 그대로 옮겼다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "규정을 그대로 옮겼다");
  sub(s, "임의로 정한 숫자가 하나도 없습니다");

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
  s.addText("원문과 값까지 기계가 대조합니다", {
    x: 1.0, y: 5.05, w: 11.8, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 19, bold: true, color: BLU,
  });
  s.addText("HIE-QP-E01 한글 원본을 읽어, 규칙 문서(E02·E03)와 프로그램이 같은 값을 쓰는지 확인합니다.\n" +
            "잣대 19가지 + 표 3의 12종목. E01 조항 32개를 모두 받아 적었고, 인용 101군데를 원문과 하나씩 맞췄습니다.", {
    x: 1.0, y: 5.5, w: 11.8, h: 0.95, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, color: INK, lineSpacing: 22,
  });

  page(s);
  s.addNotes("규정이 바뀌면 그 자리를 찾아 고치면 됩니다.");
}

/* ══════════════════════════════════════════
   13  스스로 검사한다
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "스스로 검사한다");
  sub(s, "사람이 눈으로 보는 대신 검사를 프로그램으로 만들었습니다");

  const CHK = [
    ["채점", "은행 24개 1,369문항"],
    ["보기 섞기", "219,200회 돌려 확인"],
    ["겹친 보기", "한 문항에 같은 보기"],
    ["이력 · 만료", "116건의 시험값"],
    ["규정 대조", "E01 원문과 값까지"],
    ["철자 · 받침", "규칙 문서 두 건"],
    ["표가 종이에", "쪽을 넘기는 행"],
    ["겹치는 조항", "같은 말을 두 번"],
  ];

  const cw = (12.55 - 0.35 * 3) / 4;
  CHK.forEach((c, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.62 + col * (cw + 0.35);
    const y = 1.85 + row * 1.85;
    s.addShape(p.ShapeType.rect, {
      x, y, w: cw, h: 1.55, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: x + 0.28, y: y + 0.26, w: 0.38, h: 0.38, fill: { color: OK },
    });
    s.addText("✓", {
      x: x + 0.28, y: y + 0.26, w: 0.38, h: 0.38, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(c[0], {
      x: x + 0.76, y: y + 0.26, w: cw - 1.0, h: 0.38, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: INK, valign: "middle",
    });
    s.addText(c[1], {
      x: x + 0.28, y: y + 0.82, w: cw - 0.56, h: 0.55, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: MUT, lineSpacing: 18,
    });
  });

  s.addText("검사 15가지가 모두 통과합니다. 위는 그 가운데 여덟 가지 — 문항을 하나라도 손대면 다시 돌립니다.", {
    x: 0.62, y: 5.72, w: 12.55, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: BLU,
  });

  page(s);
  s.addNotes("검사를 사람이 아니라 프로그램이 합니다.");
}

/* ══════════════════════════════════════════
   14  남은 일
   ══════════════════════════════════════════ */
{
  const s = p.addSlide();
  banner(s, "남은 일");
  sub(s, "솔직하게 말씀드립니다");

  const L = [
    ["검토 모드를 시행 모드로 바꿔야 한다",
     "지금은 은행 문항이 전부 보이게 해 두었습니다. 실제 시험 전에 무작위 출제로 바꿉니다.", true],
    ["Level Ⅲ VT 는 여유 문항이 없다",
     "규정 65문항에 은행도 65문항이라 회차마다 같은 문항이 나갑니다.", false],
    ["Level Ⅲ 전문시험은 아직 종이다",
     "규정이 종이로 시행하도록 정하고 있습니다 (E02 5.2.3). 옮기려면 규정부터 고쳐야 합니다.", false],
    ["관리자 비밀번호를 제대로 막아야 한다",
     "지금은 화면 쪽에 들어 있어 마음먹으면 들여다볼 수 있습니다.", false],
    ["실기시험과 실증은 다루지 않는다",
     "필기 결과만으로 합격 처리하지 않도록 화면에 밝혀 적습니다 (E01 7.3.1).", false],
  ];

  L.forEach((l, i) => {
    const y = 1.72 + i * 1.02;
    s.addShape(p.ShapeType.rect, {
      x: 0.62, y, w: 12.55, h: 0.88,
      fill: { color: l[2] ? "FFF2F2" : "FFFFFF" },
      line: { color: l[2] ? RED : LINE, width: 1 },
    });
    s.addShape(p.ShapeType.ellipse, {
      x: 0.9, y: y + 0.22, w: 0.42, h: 0.42, fill: { color: l[2] ? RED : "808080" },
    });
    s.addText(String(i + 1), {
      x: 0.9, y: y + 0.22, w: 0.42, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(l[0], {
      x: 1.45, y: y + 0.08, w: 8.2, h: 0.38, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 17, bold: true, color: l[2] ? RED : INK,
    });
    if (l[2]) {
      s.addText("시행 전 필수", {
        x: 11.6, y: y + 0.24, w: 1.4, h: 0.36, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 13, bold: true, color: RED, align: "right",
      });
    }
    s.addText(l[1], {
      x: 1.45, y: y + 0.46, w: 11.4, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, color: MUT,
    });
  });

  page(s);
  s.addNotes("첫 번째는 실제 시험을 치기 전에 반드시 바꿔야 합니다.");
}

/* ══════════════════════════════════════════
   15  감사합니다 — 양식 3장 그대로
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
