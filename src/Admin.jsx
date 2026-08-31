import React, { useEffect, useState } from "react";
import PrintAdminExam from "./PrintAdminExam.jsx";
import PrintScoreReport from "./PrintScoreReport.jsx";
import PrintExpirySchedule from "./PrintExpirySchedule.jsx";
import PrintCertLog from "./PrintCertLog.jsx";
import { BlankForm } from "./blankForms.jsx";
import History from "./History.jsx";
import { openPaper } from "./paperPreview.js";
/* 발표자료 화면을 찍을 때만 쓰는 예시 기록 — 아래 SHOT_MODE 참고 */
import { 예시기록 } from "./HistoryPreview.jsx";

/*
 * 기록 저장소.
 *
 * 스프레드시트 하나가 규칙이 정한 기록 한 벌이다 — 시트 하나가 서식
 * 하나다 (E02 7.10.3, E03 9.0). 응시 결과는 Result.jsx 가 보내고,
 * 발급대장·만료 예정자는 이력 화면에서 올린다.
 *
 * 주소는 Apps Script 배포에 매인다. 2026-08-26 에 새로 배포하면서
 * 바뀌었다 — 예전 주소(AKfycbxs_…)는 예전 코드가 도는 배포라 쓰면 안 된다.
 * 만드는 법은 docs/기록-저장소.md 에 있다.
 */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxos_9mG8dlc9a6ccSDZJr8O8vrxuAxITYa8VNX8jJmiNld8jJ-FYBtfUaPJU3EGlL1/exec";

/*
 * 발표자료 화면을 찍는 중인가 (tools/shots.cjs 가 ?shot=admin 으로 연다).
 * 이때는 실제 기록을 읽지 않는다 — 아래 결과 불러오기 참고.
 */
const SHOT_MODE =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("shot") === "admin";

/*
 * 응시 시작 ~ 종료를 한 칸에 적는다.
 *
 * 같은 날 안에서 끝나는 것이 보통이므로 날짜는 한 번만 쓴다.
 * 기록에 startedAt 이 없는 옛 응시분은 저장 시각(date)이라도 보여 준다.
 */
function two(n) {
  return String(n).padStart(2, "0");
}

function examSpan(r) {
  const s = r.startedAt ? new Date(r.startedAt) : null;
  const f = r.finishedAt ? new Date(r.finishedAt) : null;

  if (!s || Number.isNaN(s.getTime())) {
    /* 시작 시각을 안 남기던 때의 기록 */
    return r.date ? String(r.date) + "  (저장 시각)" : "—";
  }

  const day = `${s.getFullYear()}-${two(s.getMonth() + 1)}-${two(s.getDate())}`;
  const from = `${two(s.getHours())}:${two(s.getMinutes())}`;

  if (!f || Number.isNaN(f.getTime())) return `${day} ${from} ~`;

  const to = `${two(f.getHours())}:${two(f.getMinutes())}`;
  const sameDay = s.toDateString() === f.toDateString();

  return sameDay
    ? `${day} ${from} ~ ${to}`
    : `${day} ${from} ~ ${two(f.getMonth() + 1)}-${two(f.getDate())} ${to}`;
}

/*
 * 소요 시간. E01 은 필기시험을 2시간 이내로 정한다 (7.3.3, 7.3.4).
 * 넘긴 것은 눈에 띄게 별을 붙인다.
 */
function duration(r) {
  const sec = Number(r.durationSec);
  if (!Number.isFinite(sec) || sec <= 0) return "—";

  const m = Math.round(sec / 60);
  const text = m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;

  return m > 120 ? text + " ★" : text;
}

function Admin({ onBack }) {
  console.log("Admin 실행됨");

  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examReady, setExamReady] = useState(false);

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [sortScore, setSortScore] = useState(false);

  /* 응시 기록 목록 / 자격 이력 */
  const [view, setView] = useState("results");

  /*
   * 요원 명부.
   *
   * 응시 기록만으로는 E03 8.2.1 이 요구하는 항목을 채울 수 없다 —
   * 시력검사일, 소속, 자격인정 일자는 시험을 쳐서 나오는 값이 아니다.
   * 같은 스프레드시트의 "요원" 시트에서 읽어 온다.
   *
   * 없어도 된다. 그때는 응시 기록만으로 낼 수 있는 데까지만 내고
   * 이력 화면이 그 사실을 밝힌다.
   */
  const [people, setPeople] = useState([]);

  /*
   * 인쇄할 서식. { kind, data } 하나만 들고 있는다.
   * 둘을 동시에 그리면 인쇄물에 두 서식이 겹쳐 나간다.
   */
  const [report, setReport] = useState(null);
  const [reportReady, setReportReady] = useState(false);

  function printForm(kind, data) {
    setReportReady(false);
    setReport({ kind, data });
  }

  /*
   * 기록 저장소에 올리기.
   *
   * 발급대장(E03-01)과 만료 예정자(E03-04)는 이력 화면이 계산한 값이다.
   * 화면은 열 때마다 다시 계산하지만, "2026년 8월에 누가 만료 예정이었나"
   * 는 그때 올려 둬야 남는다 (E02 7.10 기록).
   *
   * 저장소는 사람이 적은 칸(발급일자·수령확인·통보일자)을 건드리지 않는다.
   * (docs/Code.gs 의 upsert)
   */
  const [syncState, setSyncState] = useState("");

  function sendSync(payload) {
    setSyncState("sending");

    fetch(SHEET_URL, { method: "POST", body: JSON.stringify(payload) })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then((text) => {
        console.log("기록 저장소 갱신:", text);
        setSyncState("ok");
      })
      .catch((err) => {
        console.error("기록 저장소 갱신 실패:", err);
        setSyncState("failed");
      });
  }

  // =====================================================
  // Google Sheet 결과 불러오기
  // =====================================================
  useEffect(() => {

    /*
     * 발표자료 화면을 찍을 때(?shot=admin)는 실제 기록 대신 예시를 쓴다.
     *
     * 예전에는 이 화면만 구글 시트를 그대로 읽어 와서, 발표자료 그림에
     * 직원 이름과 불합격 점수가 그대로 실렸다. 뒤따르는 「자격 이력」
     * 장들은 예시로 그리므로 사람도 서로 맞지 않았다.
     */
    if (SHOT_MODE) {
      setResults(예시기록);
      setLoading(false);
      return;
    }

    fetch(SHEET_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error("HTTP error " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log("관리자 데이터:", data);

        if (Array.isArray(data) && data.length > 0) {
          console.log(
            "마지막 데이터:",
            JSON.stringify(data[data.length - 1], null, 2)
          );
        }

        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("결과 불러오기 실패:", err);
        alert("결과를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  /*
   * 요원 명부를 읽는다.
   *
   * 아직 시트를 안 만들었으면 실패한다. 그것이 정상이므로 조용히
   * 빈 명부로 둔다. 여기서 alert 를 띄우면 명부를 안 쓰는 사람에게
   * 매번 경고가 뜬다.
   */
  useEffect(() => {
    fetch(SHEET_URL + "?sheet=people")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setPeople(data);
          console.log("요원 명부:", data.length + "명");
        }
      })
      .catch(() => {
        console.log("요원 명부 없음 — 응시 기록만으로 이력을 냅니다");
      });
  }, []);

  /* 채점결과보고서가 다 그려지면 인쇄한다 */
  useEffect(() => {
    if (!report || !reportReady) return;

    const timer = setTimeout(() => openPaper(), 200);
    return () => clearTimeout(timer);
  }, [report, reportReady]);

  // =====================================================
  // 인쇄 실행
  // =====================================================
  useEffect(() => {
    if (!exam) return;
    if (!examReady) return;

    const timer = setTimeout(() => {
      openPaper();
    }, 200);

    return () => clearTimeout(timer);
  }, [exam, examReady]);

  // =====================================================
  // 시험지 출력
  // =====================================================
  function printExam(r) {
    console.log("출력 데이터 확인:", r);
    console.log(
      "정답번호 확인:",
      Array.isArray(r.questions) ? r.questions.map((q) => q.answer) : []
    );

    if (!Array.isArray(r.questions) || r.questions.length === 0) {
      alert("출력할 시험 데이터가 없습니다.");
      return;
    }

    setExamReady(false);
    setExam(r);
  }

  // =====================================================
  // 검색 / 필터
  // =====================================================
  let filteredResults = [...results];

  if (search) {
    filteredResults = filteredResults.filter((r) =>
      String(r.name || "").includes(search)
    );
  }

  if (filterLevel) {
    filteredResults = filteredResults.filter(
      (r) => String(r.level || "") === String(filterLevel)
    );
  }

  if (filterMethod) {
    filteredResults = filteredResults.filter(
      (r) => String(r.method || "") === String(filterMethod)
    );
  }

  // =====================================================
  // 정렬 (기본: 최신순 / 토글 시: 점수순)
  // =====================================================
  /*
   * date 는 "2026. 8. 12. 오후 3:04:12" 같은 로케일 문자열이라 new Date() 로
   * 되파싱되지 않는다(Invalid Date -> NaN). 예전에는 이걸 먼저 보는 바람에
   * 비교값이 늘 NaN 이 되어 최신순 정렬이 전혀 동작하지 않았다.
   * ISO 형식인 timestamp 를 우선한다.
   */
  const timeOf = (r) => {
    const t = new Date(r.timestamp || 0).getTime();
    if (Number.isFinite(t) && t > 0) return t;
    const d = new Date(r.date || 0).getTime();
    return Number.isFinite(d) ? d : 0;
  };

  filteredResults.sort((a, b) => timeOf(b) - timeOf(a)); // 최신이 위로

  if (sortScore) {
    filteredResults.sort(
      (a, b) => Number(b.score || 0) - Number(a.score || 0)
    );
  }

  // =====================================================
  // Level / 검사법 목록
  // =====================================================
  const levelList = [
    ...new Set(results.map((r) => r.level).filter(Boolean)),
  ];

  const methodList = [
    ...new Set(results.map((r) => r.method).filter(Boolean)),
  ];

  // =====================================================
  // RETURN
  // =====================================================
  return (
    <>
      <style>{`
        .admin-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px;
          box-sizing: border-box;
        }

        .admin-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: #f7f8fa;
          border: 1px solid #e2e4e8;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .admin-controls input[type="text"],
        .admin-controls select {
          padding: 8px 10px;
          border: 1px solid #d0d3d8;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
        }

        .admin-controls button {
          padding: 8px 14px;
          border: 1px solid #3a6df0;
          background: #3a6df0;
          color: #fff;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .admin-controls button:hover {
          background: #2f5bd0;
        }

        .admin-results {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /*
         * 한 줄에 담는 값은 E02 7.7.7 이 정한 것이다 —
         * 이름·등급·종목·구분, 응시 시작과 종료 시각, 점수와 정답 문항 수.
         * 문항별 응답 내역은 「결과지 출력」으로 본다.
         */
        .admin-result {
          display: grid;
          grid-template-columns:
            1fr 0.66fr 0.7fr 0.8fr 1.7fr 0.62fr 0.7fr 0.55fr 0.62fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border: 1px solid #e2e4e8;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .admin-result > div {
          overflow-wrap: break-word;
          font-size: 14px;
        }

        /* 머리행. 어느 칸이 무슨 값인지 없이는 읽히지 않는다 */
        .admin-result.is-head {
          padding: 8px 16px;
          background: #f1f3f6;
          border-color: #dcdfe4;
          box-shadow: none;
        }

        .admin-result.is-head > div {
          font-size: 12px;
          font-weight: 700;
          color: #55606b;
        }

        /* 시각·소요시간은 숫자가 줄 맞아야 읽기 쉽다 */
        .admin-result .num {
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          color: #55606b;
        }

        .admin-result .fail {
          color: #c0392b;
          font-weight: 700;
        }

        .admin-result .pass {
          color: #1c7a4a;
          font-weight: 700;
        }

        .admin-result button {
          padding: 6px 12px;
          border: 1px solid #3a6df0;
          background: #fff;
          color: #3a6df0;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-result button:hover {
          background: #3a6df0;
          color: #fff;
        }

        @media (max-width: 720px) {
          .admin-result {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/*
        자격 이력 화면.
        응시 기록 목록이 "무슨 시험을 쳤나" 라면 이쪽은 "이 사람 자격이
        지금 어떤가" 다. E02 7.10 · E03 6.0 이 요구하는 쪽이다.
      */}
      {view === "history" ? (
        <History
          results={results}
          people={people}
          onBack={() => setView("results")}
          onPrintSession={(session) => printForm("E02-07", session)}
          onPrintExpiry={(data) => printForm("E03-04", data)}
          onPrintCertLog={(rows) => printForm("E03-01", rows)}
          onPrintBlank={(code) => printForm("blank", code)}
          onSync={sendSync}
          syncState={syncState}
        />
      ) : null}

      {report && report.kind === "E02-07" ? (
        <PrintScoreReport
          session={report.data}
          onReady={() => setReportReady(true)}
        />
      ) : null}

      {report && report.kind === "E03-04" ? (
        <PrintExpirySchedule
          certRows={report.data.certRows}
          eyeRows={report.data.eyeRows}
          today={report.data.today}
          onReady={() => setReportReady(true)}
        />
      ) : null}

      {report && report.kind === "E03-01" ? (
        <PrintCertLog
          rows={report.data}
          onReady={() => setReportReady(true)}
        />
      ) : null}

      {report && report.kind === "blank" ? (
        <BlankForm
          code={report.data}
          onReady={() => setReportReady(true)}
        />
      ) : null}

      <div className="admin-wrap" hidden={view === "history"}>
        {/* =================================================
            관리자 검색 / 필터
        ================================================= */}
        <div className="admin-controls">
          <button type="button" onClick={() => setView("history")}>
            자격 이력
          </button>

          <input
            type="text"
            placeholder="응시자 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">전체 Level</option>
            {levelList.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="">전체 검사법</option>
            {methodList.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setSortScore((prev) => !prev)}>
            {sortScore ? "최신순으로" : "점수순 정렬"}
          </button>

          {onBack && (
            <button type="button" onClick={onBack}>
              돌아가기
            </button>
          )}
        </div>

        {/* =================================================
            결과 목록
        ================================================= */}
        {loading ? (
          <div>결과를 불러오는 중입니다...</div>
        ) : (
          <div className="admin-results">
            {filteredResults.length === 0 ? (
              <div>검색 결과가 없습니다.</div>
            ) : (
              <>
                <div className="admin-result is-head">
                  <div>이름</div>
                  <div>등급</div>
                  <div>종목</div>
                  <div>구분</div>
                  <div>응시 시작 ~ 종료</div>
                  <div>소요</div>
                  <div>정답</div>
                  <div>점수</div>
                  <div>결과</div>
                  <div />
                </div>

                {filteredResults.map((r, index) => {
                  const pass =
                    r.result
                      ? /합격|PASS/i.test(r.result) && !/불합격|FAIL/i.test(r.result)
                      : Number(r.score || 0) >= 70;

                  return (
                    <div key={r.id || index} className="admin-result">
                      <div>{r.name || ""}</div>
                      <div>{r.level || ""}</div>
                      <div>{r.method || ""}</div>
                      <div>{r.subject || ""}</div>
                      <div className="num">{examSpan(r)}</div>
                      <div className="num">{duration(r)}</div>
                      <div className="num">
                        {r.correct === undefined || r.correct === ""
                          ? "—"
                          : `${r.correct} / ${r.total || "?"}`}
                      </div>
                      <div className="num">{r.score === undefined ? "" : r.score}</div>
                      <div className={pass ? "pass" : "fail"}>
                        {r.result || (pass ? "합격" : "불합격")}
                      </div>
                      <button type="button" onClick={() => printExam(r)}>
                        결과지 출력
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* =================================================
            관리자 정답지 인쇄
        ================================================= */}
        {exam && (
          <PrintAdminExam
            questions={exam.questions || []}
            answers={exam.answers || {}}
            name={exam.name || ""}
            level={exam.level || ""}
            method={exam.method || ""}
            subject={exam.subject || ""}
            date={exam.date || ""}
            score={exam.score || ""}
            onReady={() => {
              setExamReady(true);
            }}
          />
        )}
      </div>
    </>
  );
}

export default Admin;