/*
 * 문제지를 화면에 펼쳐 보여 준다.
 *
 * 왜 필요한가.
 *   아이폰(iOS Safari·Chrome)은 window.print() 가 아무 일도 안 한다.
 *   버튼을 눌러도 반응이 없는 것처럼 보인다. 종이는 다 만들어 놓고
 *   띄울 창이 없을 뿐이다.
 *
 *   그래서 인쇄창이 없는 기기에서는 만들어진 종이를 그대로 화면에
 *   펼친다. 거기서 아이폰은 공유 → 옵션 → PDF 로, 안드로이드는
 *   공유 → 인쇄로 넘기면 된다.
 *
 * 데스크톱은 예전 그대로 인쇄창이 뜬다.
 */

/*
 * 인쇄창을 곧바로 띄워도 되는 기기인지.
 *
 * 처음에는 아이폰만 가려냈는데 안드로이드도 안 된다고 한다. 기기를
 * 하나씩 짚는 것은 끝이 없다. 카카오톡·인스타 같은 앱 안 브라우저는
 * 아예 막아 두고, 삼성인터넷·웨일도 판에 따라 다르다.
 *
 * 그래서 반대로 뒤집는다. 손가락으로 쓰는 좁은 화면이면 무조건
 * 화면에 펼치고, 인쇄 단추를 같이 둔다. 되는 기기는 그 단추로
 * 인쇄창을 열면 되고, 안 되는 기기도 종이는 눈으로 볼 수 있다.
 */
export function canOpenPrintDialog() {
  const narrow =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 768px)").matches;

  const finger =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return !(narrow || finger);
}

const BAR_ID = "paper-preview-bar";

export function closePaper() {
  document.body.classList.remove("paper-preview");
  document.body.style.removeProperty("--paper-scale");
  window.removeEventListener("resize", fitPaper);

  const bar = document.getElementById(BAR_ID);
  if (bar) bar.remove();
}

/*
 * 도구 막대는 React 밖에서 만든다.
 *
 * 문제지를 그리는 곳이 결과지·문제은행·관리자 셋이라, 각각의 그리기
 * 나무에 끼워 넣으면 같은 것을 세 번 손봐야 한다. 화면에 얹기만 하는
 * 막대라 여기서 한 번만 만든다.
 */
function makeBar() {
  if (document.getElementById(BAR_ID)) return;

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.className = "paper-bar";

  const hint = document.createElement("span");
  hint.className = "paper-bar-hint";
  hint.textContent = "인쇄가 안 되면 공유 → PDF 로 저장하세요";

  const right = document.createElement("span");
  right.className = "paper-bar-btns";

  /* 되는 기기는 이걸로 인쇄창을 연다. 안 되는 기기는 눌러도 그대로다 */
  const print = document.createElement("button");
  print.type = "button";
  print.className = "paper-bar-print";
  print.textContent = "인쇄";
  print.addEventListener("click", () => window.print());

  const close = document.createElement("button");
  close.type = "button";
  close.className = "paper-bar-close";
  close.textContent = "닫기";
  close.addEventListener("click", closePaper);

  right.appendChild(print);
  right.appendChild(close);

  bar.appendChild(hint);
  bar.appendChild(right);
  document.body.appendChild(bar);
}

/*
 * 문제지가 다 만들어졌을 때 부른다.
 * 인쇄창이 되는 기기면 띄우고, 안 되면 화면에 펼친다.
 */
/* 종이 190mm 는 718px 쯤 된다. 그림자 자리까지 조금 얹어 740 으로 나눈다 */
const PAPER_PX = 740;

function fitPaper() {
  const w = document.documentElement.clientWidth;
  const scale = Math.min(1, w / PAPER_PX);

  document.body.style.setProperty("--paper-scale", String(scale));
}

export function openPaper() {
  if (canOpenPrintDialog()) {
    window.print();
    return;
  }

  document.body.classList.add("paper-preview");
  makeBar();
  fitPaper();

  /* 가로로 눕히면 폭이 달라진다 */
  window.addEventListener("resize", fitPaper);

  window.scrollTo(0, 0);
}

export default openPaper;
