/*
 * 채점결과보고서 — HIE-QP-E02-07
 *
 * E02 7.7.6 「채점이 끝나면 채점결과보고서(HIE-QP-E02-07)를 작성하여
 * 결과지와 함께 NDE Level Ⅲ / QA 에게 인계한다」
 *
 * 자격 단위 하나(등급 + 종목)에 대해 한 장을 낸다. 시험별 점수와
 * 종합점수, 판정, 인증·만료일자를 싣고 아래에 확인·승인 서명란을 둔다.
 *
 * 서명란을 비워 두는 것이 맞다. 채점은 CBT 가 하지만 확인은 대표
 * NDE Level Ⅲ 가 하고(E02 7.7.2), 합격 승인도 사람이 한다(7.9.2).
 * 시스템이 미리 채워 두면 승인이 있었던 것처럼 보인다.
 */
import React from "react";
import {
  ymd, requiredKinds, PASS_EACH, PASS_TOTAL,
} from "./history.js";

const VERDICT = {
  pass: "필기 합격",
  fail: "불합격",
  incomplete: "판정 보류 (시험 미완)",
};

function PrintScoreReport({ person, unit, onReady }) {
  React.useEffect(() => {
    if (onReady) onReady();
  }, [onReady]);

  if (!person || !unit) return null;

  const kinds = requiredKinds(unit.level);

  return (
    <div className="print-area">
      <div className="print-paper report-paper">

        <div className="report-head">
          <div className="report-title">
            채점결과보고서
            <span>WRITTEN EXAMINATION SCORE REPORT</span>
          </div>
          <div className="report-code">HIE-QP-E02-07</div>
        </div>

        <table className="report-who">
          <tbody>
            <tr>
              <th>성명</th>
              <td>{person.name}</td>
              <th>소속</th>
              <td>{person.dept || ""}</td>
            </tr>
            <tr>
              <th>자격 등급</th>
              <td>{unit.level}</td>
              <th>종목 · 기법</th>
              <td>{unit.method}</td>
            </tr>
            <tr>
              <th>시력검사 만료</th>
              <td>{person.eyeExpiry ? ymd(person.eyeExpiry) : ""}</td>
              <th>발행일</th>
              <td>{ymd(new Date())}</td>
            </tr>
          </tbody>
        </table>

        <div className="report-section">1. 시험별 채점 결과</div>

        <table className="report-grid">
          <thead>
            <tr>
              <th>시험</th>
              <th>응시일</th>
              <th>문항</th>
              <th>정답</th>
              <th>점수</th>
              <th>합격선</th>
              <th>판정</th>
            </tr>
          </thead>
          <tbody>
            {kinds.map(k => {
              const rec = unit.kinds[k];
              const s = unit.scores[k];
              const paper = unit.paperOnly.includes(k);

              return (
                <tr key={k}>
                  <td>{k}시험</td>
                  <td>{rec ? ymd(rec.startedAt || rec.timestamp || rec.date) : ""}</td>
                  <td>{rec && rec.total !== undefined ? rec.total : ""}</td>
                  <td>{rec && rec.correct !== undefined ? rec.correct : ""}</td>
                  <td className="strong">{s === null ? "" : s}</td>
                  <td>{PASS_EACH}%</td>
                  <td>
                    {s === null
                      ? paper ? "종이 시행 (E02 5.2.3)" : "미응시"
                      : s >= PASS_EACH ? "합격" : "불합격"}
                  </td>
                </tr>
              );
            })}

            <tr className="report-total">
              <td colSpan={4}>종합점수 (단순 평균, E01 7.4.4)</td>
              <td className="strong">{unit.total === null ? "" : unit.total}</td>
              <td>{PASS_TOTAL}%</td>
              <td className="strong">{VERDICT[unit.verdict]}</td>
            </tr>
          </tbody>
        </table>

        <div className="report-note">
          합격기준 — 개별 시험 {PASS_EACH}% 이상, 종합 {PASS_TOTAL}% 이상
          (E01 7.4.5). 이 보고서는 <b>필기시험</b>만 다룬다. 자격 취득에는
          실기시험이 따로 필요하며(E01 7.3.1), 최종 승인은 대표 NDE Level Ⅲ
          가 한다(E02 7.9.2).
          {unit.paperOnly.length ? (
            <> Level Ⅲ 전문시험은 아직 CBT 에 없어 종이로 시행하므로 그 점수는
            따로 적어 넣는다(E02 5.2.3).</>
          ) : null}
        </div>

        <div className="report-section">2. 자격 유효기간</div>

        <table className="report-who">
          <tbody>
            <tr>
              <th>자격인정 일자</th>
              <td>
                {unit.certifiedAt ? ymd(unit.certifiedAt) : ""}
                {unit.certifiedFrom && unit.certifiedFrom !== "명부" ? (
                  <span className="report-guess"> (필기 완료일로 어림 — 확정 필요)</span>
                ) : null}
              </td>
              <th>만료 일자</th>
              <td>{unit.expiry ? ymd(unit.expiry) : ""}</td>
            </tr>
          </tbody>
        </table>

        <div className="report-note">
          재자격인정 주기는 NDE Level Ⅰ·Ⅱ 3년, NDE Level Ⅲ 5년이며 자격은
          만료되는 달의 마지막 날에 만료된다(E03 6.1.1). 만료 3개월 전까지
          본인과 소속 부서에 알린다(E03 6.2.1).
        </div>

        {unit.retakeIssues.length ? (
          <>
            <div className="report-section">3. 확인 사항</div>
            <div className="report-note">
              {unit.retakeIssues.map((it, i) => (
                <div key={i}>
                  · 불합격 뒤 {it.gapDays}일 만에 재응시했다. 규정은 30일 경과
                  후를 원칙으로 하되, 추가 훈련 또는 교육을 받은 증거를
                  제출하면 그 이전에도 재시험을 볼 수 있다(E01 7.5, E02 7.8.1).
                  증거 유무를 확인할 것.
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="report-sign">
          <div>
            <span className="report-sign-label">채점 확인<br />해당 종목 NDE Level Ⅲ</span>
            <span className="report-sign-box" />
            <span className="report-sign-date">일자</span>
          </div>
          <div>
            <span className="report-sign-label">합격 승인<br />대표 NDE Level Ⅲ</span>
            <span className="report-sign-box" />
            <span className="report-sign-date">일자</span>
          </div>
          <div>
            <span className="report-sign-label">인계 확인<br />NDE Level Ⅲ / QA</span>
            <span className="report-sign-box" />
            <span className="report-sign-date">일자</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PrintScoreReport;
