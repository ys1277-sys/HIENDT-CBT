/*
 * 채점결과보고서 — HIE-QP-E02-07
 *
 * E02 8.0 EXHIBIT 7 의 서식을 그대로 옮긴다. 처음에는 사람 한 명씩 한
 * 장을 냈는데 서식을 안 보고 만든 것이었다. 실제 서식은 회차 하나에
 * 응시자를 줄줄이 담는 명단 꼴이다.
 *
 *   1. 시험 구분     등급 · 갈래 · 종목 · 시행일자 · 회차
 *   2. 채점         채점일자 · 장소 · 시행 방식 · 출제 문항 수
 *   3. 채점결과     응시자별 점수와 판정, 그리고 집계
 *   4. 이의 제기 및 처리
 *   5. 확인         채점자 · 확인자 · 대표 NDE Level Ⅲ
 *
 * 아는 것만 채운다.
 *   채운다  — 등급, 갈래, 종목, 시행일자, 시행 방식(CBT), 문항 수,
 *            응시자 이름·사번·정답 수·점수·판정, 집계
 *   비운다  — 관리 번호, 회차, 채점 장소, 이의 제기, 확인 서명
 *
 * 서명란을 비우는 것이 맞다. 채점은 CBT 가 해도 확인과 승인은 사람이
 * 한다 (E02 7.7.2, 7.9.2). 시스템이 채우면 승인이 있었던 것처럼 보인다.
 */
import React from "react";
import { ymd, PASS_EACH, PASS_TOTAL } from "./history.js";

/* 서식이 한 장에 두는 줄 수 */
const ROWS_PER_PAGE = 10;

function Box({ on, children }) {
  return (
    <span className="rp-box">
      <span className="rp-mark">{on ? "■" : "□"}</span>
      {children}
    </span>
  );
}

/*
 * 「1. 시험 구분」 — 등급마다 갈래를 늘어놓고 해당하는 것만 채운다.
 *
 * 서식의 등급 이름은 "NDE Level Ⅱ" 이고 응시 기록의 값은 "Level II" 다.
 * 로마자도 다르고(Ⅱ vs II) 앞의 NDE 도 없다. 그대로 견주면 어느 칸도
 * 안 채워진다 — 실제로 그렇게 나갔다. 기록의 값을 따로 받아 견준다.
 */
function KindRow({ label, level, kinds, session }) {
  const here = session.level === level;

  return (
    <tr>
      <th>{label}</th>
      <td>
        {kinds.map(k => (
          <Box key={k} on={here && session.kind === k}>
            {k}시험
          </Box>
        ))}
      </td>
    </tr>
  );
}

function ReportPage({ session, rows, pageNo, pageCount, last }) {
  /* 서식은 열 줄짜리 표다. 모자라면 빈 줄로 채워 손으로 적을 수 있게 둔다 */
  const filled = [...rows];
  while (filled.length < ROWS_PER_PAGE) filled.push(null);

  const startNo = (pageNo - 1) * ROWS_PER_PAGE;

  return (
    <div className="print-paper rp-paper">

      <table className="rp-control">
        <tbody>
          <tr>
            <td>
              <Box>관리본</Box>
              <Box>비관리본</Box>
              <span className="rp-en">Controlled Copy For Reference</span>
            </td>
            <td className="rp-ctrl-no">관리 번호 :</td>
          </tr>
        </tbody>
      </table>

      <div className="rp-head">
        <div className="rp-title">
          채점결과보고서
          <span>EXAMINATION RESULT REPORT</span>
        </div>
        <div className="rp-code">
          HIE-QP-E02-07
          {pageCount > 1 ? (
            <span className="rp-page">{pageNo} / {pageCount}</span>
          ) : null}
        </div>
      </div>

      <div className="rp-sec">1. 시험 구분</div>

      <table className="rp-form">
        <tbody>
          <KindRow
            label="NDE Level Ⅰ" level="Level I"
            kinds={["일반", "전문"]} session={session}
          />
          <KindRow
            label="NDE Level Ⅱ" level="Level II"
            kinds={["일반", "전문"]} session={session}
          />
          <KindRow
            label="NDE Level Ⅲ" level="Level III"
            kinds={["기초", "종목", "전문"]} session={session}
          />
          <tr>
            <th>종 목</th>
            <td>{session.method}</td>
          </tr>
          <tr>
            <th>시행일자</th>
            <td>
              {session.date ? ymd(session.date) : "년    월    일"}
              <span className="rp-round">회차 : 제       회</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">2. 채점</div>

      <table className="rp-form">
        <tbody>
          <tr>
            <th>채점일자</th>
            <td>{session.date ? ymd(session.date) : ""}</td>
            <th>장 소</th>
            <td />
          </tr>
          <tr>
            <th>시행 방식</th>
            <td>
              <Box on>CBT 자동 채점</Box>
              <Box>종이 (1차·2차 채점)</Box>
            </td>
            <th>출제 문항 수</th>
            <td>
              {session.questionCount.length === 1
                ? `${session.questionCount[0]} 문항`
                : session.questionCount.length
                  ? `${session.questionCount.join(" / ")} 문항`
                  : "문항"}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">3. 채점결과</div>

      <table className="rp-grid">
        <thead>
          <tr>
            <th className="w-no">NO</th>
            <th className="w-name">성 명</th>
            <th className="w-emp">사 번</th>
            <th className="w-num">출제<br />문항</th>
            <th className="w-num">정답<br />문항</th>
            <th className="w-num">점수<br />(%)</th>
            <th className="w-judge">판 정</th>
            <th>비 고</th>
          </tr>
        </thead>
        <tbody>
          {filled.map((r, i) => (
            <tr key={i}>
              <td className="c">{startNo + i + 1}</td>
              <td>{r ? r.name : ""}</td>
              <td>{r ? r.empNo : ""}</td>
              <td className="c">{r && r.total != null ? r.total : ""}</td>
              <td className="c">{r && r.correct != null ? r.correct : ""}</td>
              <td className="c b">{r && r.score != null ? r.score : ""}</td>
              <td className="c">
                <Box on={!!r && r.pass}>합격</Box>
                <Box on={!!r && !r.pass}>불합격</Box>
              </td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>

      {last ? (
        <>
          <table className="rp-form rp-sum">
            <tbody>
              <tr>
                <th>채점 대상자 수</th>
                <td className="c b">{session.count} 명</td>
                <th>합격자 수</th>
                <td className="c b">{session.passed} 명</td>
                <th>합격률</th>
                <td className="c b">{session.rate === null ? "" : session.rate} %</td>
              </tr>
            </tbody>
          </table>

          <div className="rp-quote">
            개별 시험의 합격 점수는 <b>{PASS_EACH}% 이상</b>이며, 자격부여를 위한
            종합 합격 점수는 <b>{PASS_TOTAL}% 이상</b>이다. 종합점수는 요구되는
            시험 결과의 <b>단순 평균치</b>로 한다. (HIE-QP-E01 7.4.4, 7.4.5)
          </div>

          <div className="rp-sec">4. 이의 제기 및 처리</div>

          <table className="rp-grid">
            <thead>
              <tr>
                <th className="w-qno">문항 번호</th>
                <th>이의 내용</th>
                <th>검토 결과</th>
                <th className="w-apply">반영 여부</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map(i => (
                <tr key={i}>
                  <td />
                  <td />
                  <td />
                  <td className="c">
                    <Box>반영</Box>
                    <Box>미반영</Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rp-sec">5. 확인</div>

          <table className="rp-grid">
            <thead>
              <tr>
                <th className="w-who">구 분</th>
                <th>소속 및 직위</th>
                <th className="w-name">성 명</th>
                <th className="w-sign">서 명</th>
              </tr>
            </thead>
            <tbody>
              {[
                "채점자 (해당 종목 NDE Level Ⅲ)",
                "확인자",
                "대표 NDE Level Ⅲ",
              ].map(who => (
                <tr key={who} className="rp-signrow">
                  <td>{who}</td>
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}

function PrintScoreReport({ session, onReady }) {
  React.useEffect(() => {
    if (onReady) onReady();
  }, [onReady, session]);

  if (!session) return null;

  /* 열 줄씩 나눈다. 집계와 확인란은 마지막 장에만 붙는다 */
  const pages = [];
  for (let i = 0; i < Math.max(session.rows.length, 1); i += ROWS_PER_PAGE) {
    pages.push(session.rows.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <div className="print-area">
      {pages.map((rows, i) => (
        <ReportPage
          key={i}
          session={session}
          rows={rows}
          pageNo={i + 1}
          pageCount={pages.length}
          last={i === pages.length - 1}
        />
      ))}
    </div>
  );
}

export default PrintScoreReport;
