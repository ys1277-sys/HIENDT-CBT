/*
 * 자격 이력 화면
 *
 * 응시 기록을 사람 단위로 묶어 자격 상태를 보여 준다.
 * 계산은 전부 history.js 에 있다 — 여기서는 보여 주기만 한다.
 *
 * 담는 것 (E03 8.2.1 이 요구하는 항목 가운데 CBT 가 아는 것)
 *   2) 자격인정 등급 및 방법과 기법
 *   5) 시력검사 결과의 유효 여부
 *   6) 시험지 사본 — 결과지 출력으로 갈음한다 (E03 8.2.2)
 *   7) 종합점수
 *   9) 자격인정 일자
 *  10) 자격인정 만료일자
 *
 * 나머지 — 학력·경력, 교육훈련 입증, Level Ⅲ 서명, 고용주 서명 — 은
 * CBT 가 알 수 없다. 요원 명부에 있으면 읽어 오고, 없으면 없다고 적는다.
 * 빈칸으로 두면 없는 것이 아니라 채운 것처럼 보인다.
 */
import React, { useMemo, useState } from "react";
import { BLANK_FORMS } from "./blankForms.jsx";
import {
  buildHistory, buildSessions, expiringSoon, eyeExpiringSoon, certLogRows,
  syncPayload, ymd,
  PASS_EACH, PASS_TOTAL, RETAKE_DAYS, WARN_MONTHS,
  requiredKinds,
} from "./history.js";

const STATE_TEXT = {
  valid: "유효",
  warn: `만료 ${WARN_MONTHS}개월 이내`,
  expired: "만료",
  unknown: "인증일자 없음",
};

const VERDICT_TEXT = {
  pass: "필기 합격",
  fail: "불합격",
  incomplete: "미완",
};

/* 갈래별 점수를 한 줄로 */
function ScoreLine({ unit }) {
  const kinds = requiredKinds(unit.level);

  return (
    <span className="hist-scores">
      {kinds.map((k, i) => {
        const s = unit.scores[k];
        /*
         * 합격선은 사람마다 다르다. 바깥 자격으로 면제받은 사람이 치르는
         * 시험은 80% 다 (E01 7.3.5 · 7.3.7). unit.passEach 를 그대로 쓴다.
         */
        const low = s !== null && s < (unit.passEach || PASS_EACH);
        const paper = unit.paperOnly.includes(k);
        const free = (unit.exempted || []).includes(k);

        return (
          <span key={k}>
            {i > 0 ? <span className="sep"> · </span> : null}
            <span className="kind">{k}</span>{" "}
            {free ? (
              <span className="free" title={`${unit.badge} 자격으로 면제 (E01 7.3.5·7.3.7)`}>
                면제
              </span>
            ) : s === null ? (
              <span className="none">{paper ? "종이 시행" : "미응시"}</span>
            ) : (
              <span className={low ? "low" : ""}>{s}</span>
            )}
          </span>
        );
      })}
      {unit.badge ? (
        <span className="badge" title="바깥 기관 자격 — 치르는 시험의 합격선은 80%">
          {unit.badge}
        </span>
      ) : null}
    </span>
  );
}

function PersonCard({ person }) {
  const eyeBad = person.eyeState === "expired";
  const eyeWarn = person.eyeState === "warn";

  return (
    <div className="hist-person">
      <div className="hist-person-head">
        <span className="hist-name">{person.name}</span>
        <span className="hist-dept">{person.dept || "소속 미등록"}</span>

        <span className="hist-eye">
          시력검사{" "}
          {person.eyeExpiry ? (
            <b className={eyeBad ? "bad" : eyeWarn ? "warn" : ""}>
              {ymd(person.eyeExpiry)}까지
              {eyeBad ? " (만료)" : eyeWarn ? " (임박)" : ""}
            </b>
          ) : (
            <b className="bad">기록 없음</b>
          )}
        </span>
      </div>

      <table className="hist-table">
        <thead>
          <tr>
            <th>등급 · 종목</th>
            <th>시험별 점수</th>
            <th>종합</th>
            <th>판정</th>
            <th>인증일자</th>
            <th>만료일자</th>
            <th>상태</th>
          </tr>
        </thead>

        <tbody>
          {person.units.map(u => (
            <tr key={u.key}>
              <td>
                <b>{u.level.replace("Level ", "Level ")}</b> {u.method}
              </td>

              <td><ScoreLine unit={u} /></td>

              <td className="num">{u.total === null ? "—" : u.total}</td>

              <td>
                <span className={"verdict " + u.verdict}>
                  {VERDICT_TEXT[u.verdict]}
                </span>
              </td>

              <td className="num">
                {u.certifiedAt ? ymd(u.certifiedAt) : "—"}
                {u.certifiedFrom && u.certifiedFrom !== "명부" ? (
                  <span className="guess"> 어림</span>
                ) : null}
              </td>

              <td className="num">{u.expiry ? ymd(u.expiry) : "—"}</td>

              <td>
                <span className={"state " + u.expiryState}>
                  {STATE_TEXT[u.expiryState]}
                  {u.expiryState === "warn" && u.daysLeft !== null
                    ? ` (${u.daysLeft}일)`
                    : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 확인 거리 — 규정을 어겼다고 단정하지 않고 짚어만 준다 */}
      {person.units.some(u => u.retakeIssues.length) ? (
        <div className="hist-flags">
          {person.units.flatMap(u =>
            u.retakeIssues.map((it, i) => (
              <div key={u.key + i}>
                <b>확인</b> {u.method} — 불합격 뒤 {it.gapDays}일 만에 다시 쳤습니다.
                {it.allowedFrom ? ` 규정대로면 ${ymd(it.allowedFrom)}부터입니다.` : ""}{" "}
                추가 훈련 증거가 있으면 {RETAKE_DAYS}일 이전에도 칠 수 있습니다 (E02 7.8.1).
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function History({
  results, people,
  onPrintSession, onPrintExpiry, onPrintCertLog, onPrintBlank,
  onSync, syncState,
  onBack,
}) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");

  const today = useMemo(() => new Date(), []);

  const history = useMemo(
    () => buildHistory(results || [], people || [], today),
    [results, people, today]
  );

  const soon = useMemo(() => expiringSoon(history, today), [history, today]);
  const eyeSoon = useMemo(() => eyeExpiringSoon(history, today), [history, today]);
  const certLog = useMemo(() => certLogRows(history), [history]);

  /*
   * 채점결과보고서(E02-07)는 회차 하나를 다루는 서식이다.
   * 같은 날 같은 시험을 친 사람을 한 장에 담는다.
   */
  const sessions = useMemo(
    () => buildSessions(results || [], people || []),
    [results, people]
  );

  const shown = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return history;
    return history.filter(
      p =>
        p.name.toLowerCase().includes(key) ||
        String(p.dept || "").toLowerCase().includes(key) ||
        p.units.some(u => (u.method || "").toLowerCase().includes(key))
    );
  }, [history, search]);

  const noMaster = !people || !people.length;

  return (
    <div className="hist-page">
      <style>{`
        .hist-page { padding: 24px; max-width: 1240px; margin: 0 auto;
          font-family: "맑은 고딕", Malgun Gothic, sans-serif; color: #23323c; }

        .hist-top { display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 16px; }
        .hist-top h2 { margin: 0 12px 0 0; font-size: 22px; }
        .hist-top input { flex: 1; min-width: 180px; padding: 8px 12px;
          border: 1px solid #ccd2d8; border-radius: 6px; font-size: 14px; }
        .hist-top button { padding: 8px 14px; border: 1px solid #3a6df0;
          background: #fff; color: #3a6df0; border-radius: 6px;
          font-size: 13px; cursor: pointer; white-space: nowrap; }
        .hist-top button.on { background: #3a6df0; color: #fff; }

        /* 명부가 없으면 반쪽 계산이다. 그 사실을 감추지 않는다 */
        .hist-sync { background: #1c7a4a !important; color: #fff !important;
          border-color: #1c7a4a !important; }
        .hist-sync:disabled { opacity: .6; cursor: default; }

        .hist-done { padding: 11px 14px; margin-bottom: 16px;
          background: #e6f4ec; border: 1px solid #a9d5bd; border-radius: 6px;
          font-size: 13px; line-height: 1.6; color: #14532d; }

        .hist-notice { padding: 11px 14px; margin-bottom: 16px;
          background: #f6eedd; border: 1px solid #e0c58a; border-radius: 6px;
          font-size: 13px; line-height: 1.6; color: #5c3b00; }

        .hist-person { margin-bottom: 18px; border: 1px solid #e2e4e8;
          border-radius: 8px; background: #fff; overflow: hidden; }
        .hist-person-head { display: flex; align-items: baseline; gap: 14px;
          flex-wrap: wrap; padding: 12px 16px; background: #f1f3f6;
          border-bottom: 1px solid #e2e4e8; }
        .hist-name { font-size: 16px; font-weight: 700; }
        .hist-dept { font-size: 13px; color: #6c7c87; }
        .hist-eye { margin-left: auto; font-size: 12px; color: #6c7c87; }
        .hist-eye b { font-weight: 700; color: #23323c; }
        .hist-eye b.warn { color: #b5720f; }
        .hist-eye b.bad { color: #c0392b; }

        .hist-table { width: 100%; border-collapse: collapse; }
        .hist-table th, .hist-table td { padding: 9px 12px; text-align: left;
          border-bottom: 1px solid #eceef1; font-size: 13px; vertical-align: middle; }
        .hist-table th { font-size: 11.5px; font-weight: 700; color: #55606b;
          background: #fafbfc; }
        .hist-table tr:last-child td { border-bottom: 0; }
        .hist-table .num { font-variant-numeric: tabular-nums; }
        .hist-table button { padding: 5px 10px; border: 1px solid #3a6df0;
          background: #fff; color: #3a6df0; border-radius: 5px;
          font-size: 12px; cursor: pointer; white-space: nowrap; }
        .hist-table button:hover { background: #3a6df0; color: #fff; }

        .hist-scores .kind { color: #6c7c87; }
        .hist-scores .sep { color: #c3cbd1; }
        .hist-scores .low { color: #c0392b; font-weight: 700; }
        .hist-scores .none { color: #99a5ad; font-style: italic; }

        /* 바깥 자격으로 면제받은 자리 — 미응시와 헷갈리면 안 된다 */
        .hist-scores .free { color: #0179cf; font-weight: 700; }
        .hist-scores .badge { margin-left: 8px; padding: 1px 6px;
          border: 1px solid #b9dcf3; border-radius: 99px;
          background: #e4f1fb; color: #075f9e;
          font-size: 11px; font-weight: 700; white-space: nowrap; }
        .guess { color: #99a5ad; font-size: 11px; }

        .verdict { font-weight: 700; }
        .verdict.pass { color: #1c7a4a; }
        .verdict.fail { color: #c0392b; }
        .verdict.incomplete { color: #b5720f; }

        .state.valid { color: #1c7a4a; }
        .state.warn { color: #b5720f; font-weight: 700; }
        .state.expired { color: #c0392b; font-weight: 700; }
        .state.unknown { color: #99a5ad; }

        .hist-flags { padding: 10px 16px; background: #fff8ec;
          border-top: 1px solid #f0dcb4; font-size: 12px; line-height: 1.6;
          color: #5c3b00; }
        .hist-flags b { color: #b5720f; }

        .hist-empty { padding: 30px; text-align: center; color: #6c7c87; }

        /* 응시자 이름이 길어지면 표를 밀어낸다. 넘치면 잘라 준다 */
        .hist-when { color: #6c7c87; font-size: 12px; }

        .hist-names { max-width: 220px; color: #6c7c87; font-size: 12px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .hist-soon button { padding: 5px 10px; border: 1px solid #3a6df0;
          background: #fff; color: #3a6df0; border-radius: 5px;
          font-size: 12px; cursor: pointer; white-space: nowrap; }
        .hist-soon button:hover { background: #3a6df0; color: #fff; }

        .hist-soon { width: 100%; border-collapse: collapse; background: #fff;
          border: 1px solid #e2e4e8; border-radius: 8px; overflow: hidden; }
        .hist-soon th, .hist-soon td { padding: 10px 14px; text-align: left;
          border-bottom: 1px solid #eceef1; font-size: 13px; }
        .hist-soon th { font-size: 11.5px; font-weight: 700; color: #55606b;
          background: #f1f3f6; }
        .hist-soon tr:last-child td { border-bottom: 0; }
        .hist-soon .num { font-variant-numeric: tabular-nums; }

        @media print {
          .hist-top, .hist-notice, .hist-table button { display: none; }
        }
      `}</style>

      <div className="hist-top">
        <h2>자격 이력</h2>

        <button
          type="button"
          className={tab === "list" ? "on" : ""}
          onClick={() => setTab("list")}
        >
          사람별 이력 ({history.length})
        </button>

        <button
          type="button"
          className={tab === "soon" ? "on" : ""}
          onClick={() => setTab("soon")}
        >
          만료 예정자 ({soon.length})
        </button>

        <button
          type="button"
          className={tab === "session" ? "on" : ""}
          onClick={() => setTab("session")}
        >
          회차별 채점 ({sessions.length})
        </button>

        <button
          type="button"
          className={tab === "form" ? "on" : ""}
          onClick={() => setTab("form")}
        >
          서식 ({BLANK_FORMS.length})
        </button>

        {tab === "list" ? (
          <input
            type="search"
            value={search}
            placeholder="이름 · 소속 · 종목으로 찾기"
            onChange={e => setSearch(e.target.value)}
          />
        ) : null}

        {tab === "soon" ? (
          <button
            type="button"
            onClick={() => onPrintExpiry({ certRows: soon, eyeRows: eyeSoon, today })}
          >
            E03-04 출력
          </button>
        ) : null}

        {tab === "list" ? (
          <button type="button" onClick={() => onPrintCertLog(certLog)}>
            E03-01 발급대장
          </button>
        ) : null}

        {/*
          발급대장과 만료 예정자는 이 화면이 계산한 것이다. 저장소에
          올려 두어야 기록으로 남는다 — 화면은 열 때마다 다시 계산하지만
          "2026년 8월에 누가 만료 예정이었나" 는 남겨야 알 수 있다.
        */}
        {onSync ? (
          <button
            type="button"
            className="hist-sync"
            disabled={syncState === "sending"}
            onClick={() => onSync(syncPayload(history, today))}
          >
            {syncState === "sending" ? "올리는 중…" : "기록 저장소에 올리기"}
          </button>
        ) : null}

        {onBack ? (
          <button type="button" onClick={onBack}>돌아가기</button>
        ) : null}
      </div>

      {syncState === "ok" ? (
        <div className="hist-done">
          기록 저장소에 올렸습니다. 스프레드시트의{" "}
          <b>E03-01 발급대장</b> 과 <b>E03-04 만료예정</b> 시트에서 볼 수 있습니다.
          발급일자·수령확인처럼 사람이 적은 칸은 그대로 두었습니다.
        </div>
      ) : null}

      {syncState === "failed" ? (
        <div className="hist-notice">
          <b>올리지 못했습니다.</b> 저장소 주소나 인터넷 연결을 확인해 주세요.
          올리지 못해도 화면의 값은 그대로입니다 — 이 화면은 응시 기록에서
          그때그때 계산합니다.
        </div>
      ) : null}

      {noMaster ? (
        <div className="hist-notice">
          <b>요원 명부가 없어 응시 기록만으로 냈습니다.</b> 인증일자는 필기를
          모두 채운 날로 어림했고(「어림」 표시), 시력검사·소속·학력·경력은
          비어 있습니다. 명부를 붙이면 E03 8.2.1 이 요구하는 항목까지
          채워집니다 — 만드는 법은 <code>docs/기록-저장소.md</code> 에 있습니다.
        </div>
      ) : null}

      {tab === "list" ? (
        shown.length ? (
          shown.map(p => (
            <PersonCard key={p.name} person={p} />
          ))
        ) : (
          <div className="hist-empty">해당하는 사람이 없습니다.</div>
        )
      ) : tab === "form" ? (
        <>
          <div className="hist-notice">
            <b>사람이 손으로 채우는 서식입니다.</b> CBT 가 값을 모르는 것들이라
            빈 서식으로 나옵니다. 값이 채워져 나오는 서식은 따로 있습니다 —
            채점결과보고서(E02-07)는 「회차별 채점」, 자격증 발급대장(E03-01)은
            「사람별 이력」, 만료 예정자 명단(E03-04)은 「만료 예정자」 탭입니다.
          </div>

          <table className="hist-soon">
            <thead>
              <tr>
                <th>서식 번호</th>
                <th>이 름</th>
                <th>언제 쓰나</th>
                <th>근거</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {BLANK_FORMS.map(f => (
                <tr key={f.code}>
                  <td className="num"><b>{f.code}</b></td>
                  <td>{f.name}</td>
                  <td className="hist-when">{f.when}</td>
                  <td className="num">{f.basis}</td>
                  <td>
                    <button type="button" onClick={() => onPrintBlank(f.code)}>
                      출력
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : tab === "session" ? (
        sessions.length ? (
          <table className="hist-soon">
            <thead>
              <tr>
                <th>시행일자</th>
                <th>등급</th>
                <th>시험</th>
                <th>종목</th>
                <th>문항</th>
                <th>응시</th>
                <th>합격</th>
                <th>합격률</th>
                <th>응시자</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map(g => (
                <tr key={g.key}>
                  <td className="num">{ymd(g.date) || "—"}</td>
                  <td>{g.level}</td>
                  <td>{g.kind}시험</td>
                  <td><b>{g.method}</b></td>
                  <td className="num">
                    {g.questionCount.length ? g.questionCount.join(" / ") : "—"}
                  </td>
                  <td className="num">{g.count}</td>
                  <td className="num">{g.passed}</td>
                  <td className="num">{g.rate === null ? "—" : g.rate + "%"}</td>
                  <td className="hist-names">
                    {g.rows.map(r => r.name).join(", ")}
                  </td>
                  <td>
                    <button type="button" onClick={() => onPrintSession(g)}>
                      E02-07 출력
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="hist-empty">응시 기록이 없습니다.</div>
        )
      ) : soon.length || eyeSoon.length ? (
        <>
        {eyeSoon.length ? (
          <div className="hist-notice">
            <b>시력검사 만료 예정 {eyeSoon.length}명</b> —{" "}
            {eyeSoon.map(r => `${r.name} (${ymd(r.expiry)}${r.state === "expired" ? " 만료" : ""})`).join(", ")}.
            자격이 유효해도 시력검사가 만료되면 검사업무를 볼 수 없습니다 (E01 7.3.2).
          </div>
        ) : null}

        <table className="hist-soon">
          <thead>
            <tr>
              <th>이름</th>
              <th>소속</th>
              <th>등급</th>
              <th>종목</th>
              <th>인증일자</th>
              <th>만료일자</th>
              <th>남은 기간</th>
            </tr>
          </thead>
          <tbody>
            {soon.map((r, i) => (
              <tr key={i}>
                <td><b>{r.name}</b></td>
                <td>{r.dept || "—"}</td>
                <td>{r.level}</td>
                <td>{r.method}</td>
                <td className="num">{ymd(r.certifiedAt) || "—"}</td>
                <td className="num">{ymd(r.expiry) || "—"}</td>
                <td className="num">
                  <span className={"state " + r.state}>
                    {r.state === "expired"
                      ? `만료 (${-r.daysLeft}일 지남)`
                      : `${r.daysLeft}일`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      ) : (
        <div className="hist-empty">
          {WARN_MONTHS}개월 안에 만료되는 자격도, 시력검사도 없습니다.
        </div>
      )}
    </div>
  );
}

export default History;
