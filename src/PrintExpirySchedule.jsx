/*
 * 자격 만료 예정자 명단 — HIE-QP-E03-04
 *
 * E03 6.2.1 「NDE Level Ⅲ / QA 는 자격증 발급대장을 바탕으로 만료 예정자
 * 명단을 관리하고, 만료 3개월 전까지 본인과 소속 부서에 알린다」
 *
 * E03 8.0 EXHIBIT 4 의 서식을 옮긴다. 표가 둘이다.
 *   1. 자격 만료 예정자
 *   2. 시력검사 만료 예정자   — 자격이 유효해도 시력이 만료되면 못 한다
 *
 * 채운다  — 성명·사번·소속·등급·종목·인증일자·만료일자, 기준일자, 대상 기간
 * 비운다  — 통보 일자, 재자격 시험 회차, 처리, 재검사 예정일, 서명
 *
 * 통보 일자를 비우는 것이 중요하다. 알렸는지 아닌지는 사람이 하는 일이고,
 * 시스템이 날짜를 찍어 두면 알린 것처럼 보인다.
 */
import React from "react";
import { ymd, WARN_MONTHS } from "./history.js";
import { Box, ControlRow, FormHead, SignFooter, padRows } from "./formParts.jsx";

/* 서식이 두는 줄 수 */
const CERT_ROWS = 5;
const EYE_ROWS = 3;

/* 대상 기간 — 기준일부터 3개월 뒤까지 */
function periodText(today) {
  const to = new Date(today.getFullYear(), today.getMonth() + WARN_MONTHS, 1);
  const two = n => String(n).padStart(2, "0");

  return (
    `${today.getFullYear()}년 ${two(today.getMonth() + 1)}월 ~ ` +
    `${to.getFullYear()}년 ${two(to.getMonth() + 1)}월`
  );
}

function PrintExpirySchedule({ certRows, eyeRows, today, onReady }) {
  React.useEffect(() => {
    if (onReady) onReady();
  }, [onReady, certRows, eyeRows]);

  if (!certRows || !eyeRows) return null;

  const day = today || new Date();

  return (
    <div className="print-area">
      <div className="print-paper rp-paper">

        <ControlRow />

        <FormHead
          title="자격 만료 예정자 명단"
          titleEn="CERTIFICATE EXPIRY SCHEDULE"
          code="HIE-QP-E03-04"
        />

        <table className="rp-form">
          <tbody>
            <tr>
              <th>기준일자</th>
              <td>{ymd(day)}</td>
              <th>대상 기간</th>
              <td>{periodText(day)}</td>
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">1. 자격 만료 예정자</div>

        <table className="rp-grid rp-sched">
          <thead>
            <tr>
              <th className="c1">NO</th>
              <th className="c2">성 명</th>
              <th className="c3">사 번</th>
              <th className="c4">소 속</th>
              <th className="c5">등급</th>
              <th className="c6">종목·기법</th>
              <th className="c7">인증 일자</th>
              <th className="c8">만료 일자</th>
              <th className="c9">통보<br />일자</th>
              <th className="c10">재자격<br />시험 회차</th>
              <th className="c11">처 리</th>
            </tr>
          </thead>
          <tbody>
            {padRows(certRows, CERT_ROWS).map((r, i) => (
              <tr key={i}>
                <td className="c">{i + 1}</td>
                <td>{r ? r.name : ""}</td>
                <td>{r ? r.empNo || "" : ""}</td>
                <td>{r ? r.dept || "" : ""}</td>
                <td className="c">{r ? r.level.replace("Level ", "") : ""}</td>
                <td className="c">{r ? r.method : ""}</td>
                <td className="c">{r ? ymd(r.certifiedAt) : ""}</td>
                <td className="c b">
                  {r ? ymd(r.expiry) : ""}
                  {r && r.state === "expired" ? (
                    <span className="rp-over"> 만료</span>
                  ) : null}
                </td>
                <td />
                <td />
                <td className="c rp-done">
                  <Box>완료</Box>
                  <Box>예정</Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rp-sec">2. 시력검사 만료 예정자</div>

        <table className="rp-grid rp-eye">
          <thead>
            <tr>
              <th className="e1">NO</th>
              <th className="e2">성 명</th>
              <th className="e3">사 번</th>
              <th className="e4">최근 검사일</th>
              <th className="e5">만 료 일</th>
              <th className="e6">재검사 예정일</th>
              <th className="e7">처 리</th>
            </tr>
          </thead>
          <tbody>
            {padRows(eyeRows, EYE_ROWS).map((r, i) => (
              <tr key={i}>
                <td className="c">{i + 1}</td>
                <td>{r ? r.name : ""}</td>
                <td>{r ? r.empNo || "" : ""}</td>
                <td className="c">{r ? ymd(r.examDate) : ""}</td>
                <td className="c b">
                  {r ? ymd(r.expiry) : ""}
                  {r && r.state === "expired" ? (
                    <span className="rp-over"> 만료</span>
                  ) : null}
                </td>
                <td />
                <td className="c">
                  <Box>완료</Box>
                  <Box>예정</Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rp-quote">
          만료 <b>{WARN_MONTHS}개월 전까지</b> 본인과 소속 부서에 알린다.
          (HIE-QP-E03 6.2.1) 시력검사는 검사일로부터 <b>1년 뒤 만료 월의
          마지막 날</b>에 만료된다. (HIE-QP-E01 7.3.2) 만료 예정자는
          연간 시험 시행계획에 재자격 대상자로 반영한다. (HIE-QP-E03 6.2.2)
        </div>

        <SignFooter
          roles={[
            ["작 성 자", "NDE Level Ⅲ / QA"],
            ["확 인 자", "대표 NDE Level Ⅲ"],
          ]}
        />
      </div>
    </div>
  );
}

export default PrintExpirySchedule;
