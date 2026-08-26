import React from "react";
import ExamFlow from "./ExamFlow.jsx";
import HistoryPreview, { ReportPreview, ExpiryPreview, CertLogPreview, BlankFormPreview, AllFormsPreview } from "./HistoryPreview.jsx";

function App() {
  /*
   * ?preview=history  자격 이력 화면
   * ?preview=report   채점결과보고서(E02-07)
   * ?preview=expiry   자격 만료 예정자 명단(E03-04)
   * ?preview=certlog  자격증 발급대장(E03-01)
   * ?preview=form&code=HIE-QP-E02-01  손으로 채우는 서식
   *
   * 구글 시트에 붙지 않고 화면을 손보기 위한 것이다.
   * 보고서는 인쇄용이라 평소에는 숨겨져 있어 이렇게 해야 눈으로 볼 수 있다.
   */
  const preview =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("preview")
      : "";

  if (preview === "history") return <HistoryPreview />;
  if (preview === "report") return <ReportPreview />;
  if (preview === "expiry") return <ExpiryPreview />;
  if (preview === "certlog") return <CertLogPreview />;
  if (preview === "form") return <BlankFormPreview />;
  if (preview === "all") return <AllFormsPreview />;

  return (
    <ExamFlow />
  );
}

export default App;