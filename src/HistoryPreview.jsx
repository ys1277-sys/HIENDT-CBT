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
import PrintExam from "./PrintExam.jsx";
import ProcedureViewer, { useManifest, availableProcedures } from "./ProcedureViewer.jsx";
import { BlankForm, BLANK_FORMS } from "./blankForms.jsx";
import { buildHistory, buildSessions, expiringSoon, eyeExpiringSoon, certLogRows } from "./history.js";

const 기록 = [
  { name: "홍길동", level: "Level II", method: "RT", subject: "General",  score: 85, total: 40, correct: 34, startedAt: "2026-03-02T09:10:00+09:00", finishedAt: "2026-03-02T10:12:00+09:00", durationSec: 3720 },
  { name: "홍길동", level: "Level II", method: "RT", subject: "Specific", score: 90, total: 20, correct: 18, startedAt: "2026-03-02T13:10:00+09:00", finishedAt: "2026-03-02T13:48:00+09:00", durationSec: 2280 },
  { name: "홍길동", level: "Level II", method: "UT", subject: "General",  score: 60, total: 40, correct: 24, startedAt: "2026-05-02T09:10:00+09:00", finishedAt: "2026-05-02T10:12:00+09:00", durationSec: 3720 },
  { name: "홍길동", level: "Level II", method: "UT", subject: "General",  score: 88, total: 40, correct: 35, startedAt: "2026-05-20T09:10:00+09:00", finishedAt: "2026-05-20T10:12:00+09:00", durationSec: 3720 },
  { name: "홍길동", level: "Level II", method: "UT", subject: "Specific", score: 95, total: 20, correct: 19, startedAt: "2026-05-20T13:10:00+09:00", finishedAt: "2026-05-20T13:48:00+09:00", durationSec: 2280 },
  { name: "김철수", level: "Level III", method: "Basic", score: 88, total: 55, correct: 48, startedAt: "2026-01-15T09:10:00+09:00", finishedAt: "2026-01-15T10:28:00+09:00", durationSec: 4680 },
  { name: "김철수", level: "Level III", method: "RT",    score: 92, total: 65, correct: 60, startedAt: "2026-02-20T09:10:00+09:00", finishedAt: "2026-02-20T10:38:00+09:00", durationSec: 5280 },
  { name: "이영희", level: "Level II", method: "PT", subject: "General",  score: 85, total: 40, correct: 34, startedAt: "2023-09-02T09:10:00+09:00", finishedAt: "2023-09-02T10:12:00+09:00", durationSec: 3720 },
  { name: "이영희", level: "Level II", method: "PT", subject: "Specific", score: 90, total: 20, correct: 18, startedAt: "2023-09-02T13:10:00+09:00", finishedAt: "2023-09-02T13:48:00+09:00", durationSec: 2280 },
  { name: "박민수", level: "Level II", method: "MT", subject: "General",  score: 75, total: 40, correct: 30, startedAt: "2026-07-02T09:10:00+09:00", finishedAt: "2026-07-02T10:12:00+09:00", durationSec: 3720 },
  { name: "박민수", level: "Level II", method: "MT", subject: "Specific", score: 80, total: 20, correct: 16, startedAt: "2026-07-02T13:10:00+09:00", finishedAt: "2026-07-02T13:48:00+09:00", durationSec: 2280 },

  /*
   * 바깥 자격으로 면제받은 두 사람 (E01 7.3.5 · 7.3.7).
   * 치르는 시험의 합격선이 80% 라 75점은 불합격이다 — 면제가 아니었다면
   * 개별 70% 를 넘으니 통과였을 점수다. 화면에서 그 차이가 보여야 한다.
   */
  { name: "정약용", level: "Level II", method: "VT", subject: "Specific", score: 75, total: 20, correct: 15, startedAt: "2026-08-03T09:10:00+09:00", finishedAt: "2026-08-03T09:48:00+09:00", durationSec: 2280 },
  { name: "강감찬", level: "Level II", method: "PT", subject: "Specific", score: 85, total: 20, correct: 17, startedAt: "2026-08-04T09:10:00+09:00", finishedAt: "2026-08-04T09:48:00+09:00", durationSec: 2280 },
];

/*
 * 발표자료 화면을 찍을 때 관리자 목록도 이 사람들로 그린다.
 *
 * 예전에는 관리자 화면만 실제 기록을 읽어 와서, 발표자료 그림에 직원
 * 이름과 점수가 그대로 실렸다. 뒤따르는 「자격 이력」 장은 이 예시로
 * 그리므로, 목록과 이력에 같은 사람이 나와 이야기도 이어진다.
 */
export const 예시기록 = 기록;

const 명부 = [
  { name: "홍길동", dept: "검사1팀", eyeExamDate: "2026-06-01", certifiedAt: "2026-03-10", "certifiedAt:UT": "2026-05-25" },
  { name: "이영희", dept: "검사2팀", eyeExamDate: "2025-04-01", certifiedAt: "2023-09-10" },

  /* 일반시험 면제 — 전문시험만 치르고 80% 여야 한다 */
  { name: "정약용", dept: "검사1팀", eyeExamDate: "2026-05-10",
    exempt: "ISO 9712 Level II", exemptNo: "ISO-9712-2-0041", exemptExpiry: "2029-06-30" },
  { name: "강감찬", dept: "검사2팀", eyeExamDate: "2026-05-10", certifiedAt: "2026-08-04",
    exempt: "ISO9712 II", exemptNo: "ISO-9712-2-0077", exemptExpiry: "2030-01-31" },
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
  /*
   * ?preview=history&only=이름  으로 한 사람만 그린다.
   *
   * 여섯 사람이 한 화면에 다 나오면 발표 자료에 넣었을 때 글씨가 작아
   * 안 읽힌다. 한 사람씩 따로 찍어 크게 보여 주려는 것이다.
   */
  const only = new URLSearchParams(window.location.search).get("only") || "";
  const recs = only ? 기록.filter(r => r.name === only) : 기록;
  const ppl  = only ? 명부.filter(p => p.name === only) : 명부;

  return (
    <History
      results={recs}
      people={ppl}
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

/* ?preview=form&code=… — 손으로 채우는 서식 한 벌 */
export const BlankFormPreview = onPaper(() => {
  const want = new URLSearchParams(window.location.search).get("code");

  /* code 를 안 주면 전부 그린다 — 한 번에 종이 넘침을 확인하려는 것이다 */
  if (!want) {
    return (
      <>
        {BLANK_FORMS.map(f => (
          <BlankForm key={f.code} code={f.code} />
        ))}
      </>
    );
  }
  return <BlankForm code={want} />;
});

/* ?preview=all — 값이 채워지는 서식 셋을 한 번에. 종이 넘침 확인용 */
export const AllFormsPreview = onPaper(() => {
  const today = new Date(2026, 7, 26);
  const h = buildHistory(기록, 명부, today);
  const sessions = buildSessions(기록, 명부);
  return (
    <>
      {sessions.slice(0, 2).map(g => (
        <PrintScoreReport key={g.key} session={g} />
      ))}
      <PrintExpirySchedule
        certRows={expiringSoon(h, today)}
        eyeRows={eyeExpiringSoon(h, today)}
        today={today}
      />
      <PrintCertLog rows={certLogRows(h)} />
    </>
  );
});

/*
 * ?preview=paper — 시험지를 종이로 뽑았을 때의 모습.
 *
 * 갑지와 문항 종이, 그리고 가운데에 옅게 깔리는 회사 로고 워터마크를
 * 화면에서 볼 수 있다. 인쇄 대화상자를 띄우지 않고도 확인할 수 있고,
 * 발표자료에 넣을 그림을 찍는 데도 쓴다 (tools/shots.cjs).
 *
 * 문항은 MT 일반 은행에서 앞의 몇 개만 가져온다 — 종이 두어 장이면
 * 갑지·머리글·워터마크가 어떻게 나오는지 다 보인다.
 */
export function PaperPreview() {
  const [qs, setQs] = React.useState(null);

  React.useEffect(() => {
    document.body.classList.add("paper-preview");
    fetch(import.meta.env.BASE_URL + "data/Level II/General/MT.json")
      .then(r => r.json())
      .then(list => setQs(list.slice(0, 6)))
      .catch(() => setQs([]));
    return () => document.body.classList.remove("paper-preview");
  }, []);

  if (!qs) return null;

  return (
    <PrintExam
      showAnswers={false}
      name=""
      level="Level II"
      method="MT"
      subject="General"
      questions={qs}
      date={new Date(2026, 11, 23).toLocaleDateString()}
    />
  );
}

/*
 * ?preview=proc — 시험 중에 펴 보는 절차서 창.
 *
 * 평소에는 문항 지시문의 절차서 이름을 눌러야 열린다. 화면을 찍거나
 * 눈으로 확인하려면 주소로 바로 열 수 있어야 한다 (tools/shots.cjs).
 *
 * 어느 절차서를 열지는 ?code= 로 고른다. 없으면 MT 절차서를 편다.
 */
export function ProcPreview() {
  const manifest = useManifest();
  const want =
    new URLSearchParams(window.location.search).get("code") || "HIE-NDT-MT-P11";

  if (!manifest) return null;

  /* 문항이 그 절차서를 부르는 것처럼 꾸며 목록을 얻는다 */
  const procs = availableProcedures(manifest, { groupNote: want });
  if (!procs.length) return null;

  return <ProcedureViewer proc={procs[0]} onClose={() => {}} />;
}
