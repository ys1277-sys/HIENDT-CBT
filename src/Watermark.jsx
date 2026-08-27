/*
 * 시험지 워터마크 — 종이 한가운데에 회사 로고를 연하게 깐다.
 *
 * 세 가지 출력에 다 들어간다.
 *   문제지 출력            PrintQuestion.jsx
 *   시험 보고 답안지 출력   PrintExam.jsx
 *   관리자 모드 출력        PrintAdminExam.jsx
 *
 * 배경이미지(background-image)로 하지 않는다. 브라우저 인쇄 설정에
 * 「배경 그래픽」이 꺼져 있으면 그냥 안 찍히기 때문이다. 진짜 <img> 는
 * 그 설정과 상관없이 찍힌다.
 *
 * 글을 가리면 안 되므로 z-index 를 -1 로 둔다. 종이의 흰 바탕 위,
 * 모든 글 아래에 깔린다. (.print-paper 가 z-index:0 으로 쌓임 맥락을
 * 만들어 두어 종이 밖으로 빠지지 않는다 — src/print.css)
 */
import React from "react";
import logo from "./logo.svg";

function Watermark() {
  return <img className="paper-watermark" src={logo} alt="" aria-hidden="true" />;
}

export default Watermark;
