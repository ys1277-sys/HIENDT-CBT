/*
 * 자격 이력 화면 미리보기 — 개발용
 *
 * 구글 시트에 붙지 않고도 화면을 볼 수 있게 가짜 기록으로 그린다.
 * 주소 뒤에 ?preview=history 를 붙이면 이 화면이 뜬다.
 * 배포된 앱에서도 뜨지만 읽어 오는 데이터가 없어 아무 기록도 안 나온다.
 */
import React from "react";
import History from "./History.jsx";

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

export default function HistoryPreview() {
  return (
    <History
      results={기록}
      people={명부}
      onPrintUnit={(p, u) => console.log("채점결과보고서", p.name, u.key)}
    />
  );
}
