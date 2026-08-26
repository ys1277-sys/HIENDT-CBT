import React from "react";
import ExamFlow from "./ExamFlow.jsx";
import HistoryPreview from "./HistoryPreview.jsx";

function App() {
  /*
   * ?preview=history 로 자격 이력 화면만 따로 본다.
   * 구글 시트에 붙지 않고 손보기 위한 것이다. 시험 흐름과는 상관없다.
   */
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "history"
  ) {
    return <HistoryPreview />;
  }

  return (
    <ExamFlow />
  );
}

export default App;