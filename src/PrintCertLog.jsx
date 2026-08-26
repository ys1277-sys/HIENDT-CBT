/*
 * 자격증 발급대장 — HIE-QP-E03-01
 *
 * E03 5.4.1 「자격증과 ID 카드의 발행은 자격증 발급대장으로 관리한다」
 *
 * 여기 오르는 것은 **발급 대상 후보**다. 자격증은 필기만으로 나가지
 * 않는다 — 실기시험이 남아 있고(E01 7.3.1) 대표 NDE Level Ⅲ 의 승인이
 * 있어야 한다(E02 7.9.2). 그래서 필기를 통과하고 인증일자가 잡힌 자격만
 * 줄로 뽑아 두고, 실제 발급 여부는 사람이 채운다.
 *
 * 채운다  — 성명·사번·소속·등급·종목·인증일자·만료일자
 * 비운다  — 발급일자, 발급구분(신규/재자격), 수령확인, 서명
 *
 * 발급일자를 비우는 것이 중요하다. 시스템은 자격증을 실제로 언제
 * 내줬는지 모른다. 날짜를 찍어 두면 발급한 것처럼 보인다.
 */
import React from "react";
import { ymd } from "./history.js";
import { Box, ControlRow, FormHead, SignFooter, padRows } from "./formParts.jsx";

/* 서식이 두는 줄 수 */
const ROWS_PER_PAGE = 10;

function LogPage({ rows, pageNo, pageCount, last }) {
  const startNo = (pageNo - 1) * ROWS_PER_PAGE;

  return (
    <div className="print-paper rp-paper">

      <ControlRow />

      <FormHead
        title="자격증 발급대장"
        titleEn="CERTIFICATE ISSUE LOG"
        code="HIE-QP-E03-01"
        page={pageNo}
        pageCount={pageCount}
      />

      <table className="rp-form">
        <tbody>
          <tr>
            <th>구 분</th>
            <td>
              <Box>자격증</Box>
              <Box>ID 카드</Box>
              <Box>기타 증명서</Box>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="rp-grid rp-log">
        <thead>
          <tr>
            <th className="g1">NO</th>
            <th className="g2">발급<br />일자</th>
            <th className="g3">성 명</th>
            <th className="g4">사 번</th>
            <th className="g5">소 속</th>
            <th className="g6">등급</th>
            <th className="g7">종목·기법</th>
            <th className="g8">인증 일자</th>
            <th className="g9">만료 일자</th>
            <th className="g10">발급<br />구분</th>
            <th className="g11">수령<br />확인</th>
            <th className="g12">비 고</th>
          </tr>
        </thead>
        <tbody>
          {padRows(rows, ROWS_PER_PAGE).map((r, i) => (
            <tr key={i}>
              <td className="c">{startNo + i + 1}</td>
              <td />
              <td>{r ? r.name : ""}</td>
              <td>{r ? r.empNo || "" : ""}</td>
              <td>{r ? r.dept || "" : ""}</td>
              <td className="c">{r ? r.level.replace("Level ", "") : ""}</td>
              <td className="c">{r ? r.method : ""}</td>
              <td className="c">
                {r ? ymd(r.certifiedAt) : ""}
                {r && r.guessed ? <span className="rp-over"> 어림</span> : null}
              </td>
              <td className="c">{r ? ymd(r.expiry) : ""}</td>
              <td className="c rp-issue">
                <Box>신규</Box>
                <Box>재자격</Box>
              </td>
              <td />
              <td className="rp-memo">
                {/* UT 선수 자격이 없는 TOFD·PAUT 는 발행하면 안 된다 */}
                {r && r.needsUT && !r.utOk ? "UT Level Ⅱ 미인증" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {last ? (
        <>
          <div className="rp-quote">
            만료 일자는 <b>만료되는 달의 마지막 날</b>로 적는다.
            (HIE-QP-E01 7.9.2) 최대 재자격인정 주기는 Level Ⅰ·Ⅱ 3년,
            Level Ⅲ 5년이다. <b>TOFD·PAUT·FMC 기법</b>은 UT Level Ⅱ 자격이
            인증된 사람에게만 발행하며, UT Level Ⅱ 가 종료·만료되면 함께
            효력을 잃는다. (HIE-QP-E03 5.1.5)
          </div>

          <SignFooter
            roles={[
              ["작 성 자", "NDE Level Ⅲ / QA"],
              ["검 토 자", "대표 NDE Level Ⅲ"],
              ["승 인 자", "대표이사"],
            ]}
          />
        </>
      ) : null}
    </div>
  );
}

function PrintCertLog({ rows, onReady }) {
  React.useEffect(() => {
    if (onReady) onReady();
  }, [onReady, rows]);

  if (!rows) return null;

  const pages = [];
  for (let i = 0; i < Math.max(rows.length, 1); i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <div className="print-area">
      {pages.map((chunk, i) => (
        <LogPage
          key={i}
          rows={chunk}
          pageNo={i + 1}
          pageCount={pages.length}
          last={i === pages.length - 1}
        />
      ))}
    </div>
  );
}

export default PrintCertLog;
