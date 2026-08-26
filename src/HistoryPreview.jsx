/*
 * 자격 이력 화면 미리보기 — 개발용
 *
 * 구글 시트에 붙지 않고도 화면을 볼 수 있게 가짜 기록으로 그린다.
 * 주소 뒤에 ?preview=history 를 붙이면 이 화면이 뜬다.
 * 배포된 앱에서도 뜨지만 읽어 오는 데이터가 없어 아무 기록도 안 나온다.
 */
import React from "react";
import History from "./History.jsx";
import PrintScoreReport from "./PrintScoreReport.jsx";
import PrintExpirySchedule from "./PrintExpirySchedule.jsx";
import PrintCertLog from "./PrintCertLog.jsx";
import { buildHistory, buildSessions, expiringSoon, eyeExpiringSoon, certLogRows } from "./history.js";

const 기록 = [
  { name: "홍길동", level: "Level II", method: "RT", subject: "General",  score: 85, total: 40, correct: 34, startedAt: "2026-03-02T09:10:00+09:00" },
  { name: "홍길동", level: "Level II", method: "RT", subject: "Specific", score: 90, total: 20, correct: 18, startedAt: "2026-03-02T13:10:00+09:00" },
  { name: "홍길동", level: "Level II", method: "UT", subject: "General",  score: 60, total: 40, correct: 24, startedAt: "2026-05-02T09:10:00+09:00" },
  { name: "홍길동", level: "Level II", method: "UT", subject: "General",  score: 88, total: 40, correct: 35, startedAt: "2026-05-20T09:10:00+09:00" },
  { name: "홍길동", level: "Level II", method: "UT", subject: "Specific", score: 95, total: 20, correct: 19, startedAt: "2026-05-20T13:10:00+09:00" },
  { name: "김철수", level: "Level III", method: "Basic", score: 88, total: 55, correct: 48, startedAt: "2026-01-15T09:10:00+09:00" },
  { name: "김철수", level: "Level III", method: "RT",    score: 92, total: 65, correct: 60, startedAt: "2026-02-20T09:10:00+09:00" },
  { name: "이영희", level: "Level II", method: "PT", subject: "General",  score: 85, total: 40, correct: 34, startedAt: "2023-09-02T09:10:00+09:00" },
  { name: "이영희", level: "Level II", method: "PT", subject: "Specific", score: 90, total: 20, correct: 18, startedAt: "2023-09-02T13:10:00+09:00" },
  { name: "박민수", level: "Level II", method: "MT", subject: "General",  score: 75, total: 40, correct: 30, startedAt: "2026-07-02T09:10:00+09:00" },
  { name: "박민수", level: "Level II", method: "MT", subject: "Specific", score: 80, total: 20, correct: 16, startedAt: "2026-07-02T13:10:00+09:00" },
];

const 명부 = [
  { name: "홍길동", dept: "검사1팀", eyeExamDate: "2026-06-01", certifiedAt: "2026-03-10", "certifiedAt:UT": "2026-05-25" },
  { name: "이영희", dept: "검사2팀", eyeExamDate: "2025-04-01", certifiedAt: "2023-09-10" },
];

/*
 * ?preview=report 로 채점결과보고서(E02-07) 한 장을 화면에 펼친다.
 * 인쇄용이라 평소에는 .print-area 가 숨겨져 있어 눈으로 볼 수 없다.
 */
export function ReportPreview() {
  const sessions = buildSessions(기록, 명부);
  const 회차 = sessions.find(s => s.method === "UT" && s.kind === "일반");

  React.useEffect(() => {
    document.body.classList.add("paper-preview");
    return () => document.body.classList.remove("paper-preview");
  }, []);

  return <PrintScoreReport session={회차} />;
}

export default function HistoryPreview() {
  return (
    <History
      results={기록}
      people={명부}
      onPrintUnit={(p, u) => console.log("채점결과보고서", p.name, u.key)}
    />
  );
}

/* 종이 위에 펼쳐 보기 위한 껍데기 */
function onPaper(node) {
  return function Wrapped() {
    React.useEffect(() => {
      document.body.classList.add("paper-preview");
      return () => document.body.classList.remove("paper-preview");
    }, []);
    return node();
  };
}

/* ?preview=expiry — 자격 만료 예정자 명단 (E03-04) */
export const ExpiryPreview = onPaper(() => {
  const today = new Date(2026, 7, 26);
  const h = buildHistory(기록, 명부, today);
  return (
    <PrintExpirySchedule
      certRows={expiringSoon(h, today)}
      eyeRows={eyeExpiringSoon(h, today)}
      today={today}
    />
  );
});

/* ?preview=certlog — 자격증 발급대장 (E03-01) */
export const CertLogPreview = onPaper(() => {
  const today = new Date(2026, 7, 26);
  const h = buildHistory(기록, 명부, today);
  return <PrintCertLog rows={certLogRows(h)} />;
});
