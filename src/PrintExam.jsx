import React from "react";
import logo from "./logo.png";
import "./print.css";

function PrintExam({
  name,
  level,
  method,
  subject,
  questions = [],
  answers = {},
  date
}) {
  const numberCircle = ["①", "②", "③", "④"];

  const levelText = level
    ? level.replace("Level ", "")
    : "";

  return (
    <div className="print-area">

      <table className="print-layout">
        <thead>
          <tr>
            <td className="print-header-cell">

              {/* 상단 날짜 / HIENDT-CBT */}
              <div className="print-top-line">
                <span className="print-date">
                  {date || ""}
                </span>

                <span className="print-system-title">
                  HIENDT-CBT
                </span>
              </div>


              {/* =========================
                  시험지 상단 고정 헤더
                 ========================= */}
              <table className="doc-header-table">
                <tbody>

                  {/* 1행 */}
                  <tr>

                    <td
                      className="dh-brand"
                      rowSpan="2"
                    >
                      <div className="dh-brand-inner">

                        <img
                          src={logo}
                          alt="HANKUK"
                          className="dh-logo-img"
                        />

                        <div className="dh-company">
                          <span className="dh-company-main">
                            HANKUK
                          </span>

                          <span className="dh-company-sub">
                            INDUSTRIAL ENGINEERING
                          </span>
                        </div>

                      </div>
                    </td>


                    <td
                      className="dh-series"
                    >
                      Examination Series No. {method}
                    </td>

                  </tr>


                  {/* 2행 */}
                  <tr>

                    <td className="dh-title">
                      {method} {subject} Examination Questions
                    </td>

                  </tr>


                  {/* 3행 */}
                  <tr>

                    <td className="dh-name">
                      NAME : {name || ""}
                    </td>

                    <td className="dh-bottom-right">

                      <div className="dh-level">
                        NDE Level {levelText}
                      </div>

                      <div className="dh-page">
                        PAGE 1 OF 7
                      </div>

                    </td>

                  </tr>

                </tbody>
              </table>

            </td>
          </tr>
        </thead>


        <tbody>
          <tr>
            <td>

              {/* =========================
                  표지
                 ========================= */}

              <div className="cover-content">

                <h2 className="cover-title">
                  {method} {subject ? subject.toUpperCase() : ""}
                </h2>


                <div className="cover-field-row">
                  <span>
                    NAME {name || ""}
                  </span>

                  <span>
                    DATE {date || ""}
                  </span>
                </div>


                <div className="cover-field-row">
                  <span>
                    Start :
                  </span>

                  <span>
                    Finish :
                  </span>
                </div>


                <div className="cover-field-row">
                  <span>
                    SCORE
                  </span>

                  <span>
                    EXAMINER
                  </span>
                </div>


                <div className="cover-note">

                  <p>
                    NOTE :
                  </p>

                  <p>
                    1. This is closed book examination. No reference
                    material may be used during examination.
                    <br />
                    시험도중 서적을 참고할 수 없음
                  </p>

                  <p>
                    2. Questions about the intent of examination question
                    will be answered during the examination.
                    <br />
                    문제에 대한 질문에 한해서 답변함
                  </p>

                  <p>
                    3. This examination must be completed in ink or
                    ball-point pen.
                    <br />
                    답변은 볼펜 또는 잉크로 기록할 것
                  </p>

                  <p>
                    4. Examination administered for qualification shall
                    result in a composite grade of at least 80%, with no
                    individual examination having a grade less than 70%.
                    <br />
                    과락은 70%이며 합격선은 80%임.
                  </p>

                </div>


                <p className="cover-approved">
                  Approved by ______________________
                </p>

                <p className="cover-approved-sub">
                  NDE Level Ⅲ
                </p>

              </div>


              {/* =========================
                  문제지
                 ========================= */}

              <div className="questions-content">

                {questions.map((q, index) => {

                  const questionText = String(
                    q.question || ""
                  )
                    .split(/\r?\n/)
                    .filter(
                      (line) => line.trim() !== ""
                    );


                  return (
                    <div
                      className="print-question"
                      key={index}
                    >

                      <h3>
                        {index + 1}. {questionText[0]}
                      </h3>


                      {questionText[1] && (
                        <div className="question-korean">
                          {questionText[1]}
                        </div>
                      )}


                      {Array.isArray(q.options) &&
                        q.options.map((op, i) => {

                          const optionText = String(
                            op || ""
                          )
                            .split(/\r?\n/)
                            .filter(
                              (line) => line.trim() !== ""
                            );


                          return (
                            <div
                              className="option"
                              key={i}
                            >

                              <span className="number-box">
                                {numberCircle[i]}
                              </span>


                              <div className="option-text">

                                <span className="option-en">
                                  {optionText[0]}
                                </span>


                                {optionText[1] && (
                                  <span className="option-ko">
                                    {optionText[1]}
                                  </span>
                                )}

                              </div>

                            </div>
                          );

                        })}

                    </div>
                  );

                })}

              </div>

            </td>
          </tr>
        </tbody>

      </table>

    </div>
  );
}

export default PrintExam;