import React, {
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";


function PrintAdminExam({

  questions = [],
  answers = {},

  name = "",
  level = "",
  method = "",
  subject = "",
  date = "",
  score = "",

  onReady

}) {


  const numberCircle = [
    "①",
    "②",
    "③",
    "④"
  ];


  const [questionPages, setQuestionPages] =
    useState([]);


  const measureRef =
    useRef(null);


  const onReadyRef =
    useRef(onReady);


  useLayoutEffect(() => {

    onReadyRef.current =
      onReady;

  }, [onReady]);


  /*
   * =====================================================
   * 문제 페이지 자동 분할
   *
   * 중요
   *
   * 측정 영역은 실제 인쇄 영역과 완전히 분리한다.
   * =====================================================
   */

  useLayoutEffect(() => {

    if (
      !questions ||
      questions.length === 0
    ) {

      setQuestionPages([]);

      requestAnimationFrame(() => {

        if (
          onReadyRef.current
        ) {

          onReadyRef.current();

        }

      });

      return;

    }


    const container =
      measureRef.current;


    if (!container) {

      return;

    }


    const questionElements =
      Array.from(
        container.querySelectorAll(
          ".measure-question"
        )
      );


    if (
      questionElements.length === 0
    ) {

      return;

    }


    /*
     * ===================================================
     * A4 실제 인쇄 영역
     *
     * A4 = 210mm x 297mm
     *
     * @page margin = 10mm
     *
     * 실제 영역 = 190mm x 277mm
     * ===================================================
     */

    const MM =
      3.7795275591;


    const PAGE_HEIGHT =
      277 * MM;


    /*
     * ===================================================
     * Header
     *
     * 9 + 9 + 9 = 27mm
     *
     * Header 아래 공간 = 6mm
     *
     * 총 = 33mm
     * ===================================================
     */

    const HEADER_HEIGHT_MM =
      33;


    const headerHeight =
      HEADER_HEIGHT_MM * MM;


    /*
     * ===================================================
     * 출력 오차 방지
     * ===================================================
     */

    const SAFETY =
      2 * MM;


    const availableHeight =
      PAGE_HEIGHT -
      headerHeight -
      SAFETY;


    const pages = [];

    let currentPage = [];

    let currentHeight = 0;


    questionElements.forEach(
      (
        element,
        index
      ) => {

        const height =
          element.getBoundingClientRect()
            .height;


        if (
          currentPage.length > 0 &&
          currentHeight + height >
            availableHeight
        ) {

          pages.push(
            currentPage
          );

          currentPage = [];

          currentHeight = 0;

        }


        currentPage.push(
          index
        );

        currentHeight +=
          height;

      }
    );


    if (
      currentPage.length > 0
    ) {

      pages.push(
        currentPage
      );

    }


    /*
     * ===================================================
     * index 배열 → 실제 questions
     * ===================================================
     */

    const result =
      pages.map(
        page =>
          page.map(
            index =>
              questions[index]
          )
      );


    setQuestionPages(
      result
    );


    /*
     * ===================================================
     * React DOM 반영 후 출력 준비
     * ===================================================
     */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        if (
          onReadyRef.current
        ) {

          onReadyRef.current();

        }

      });

    });


  }, [
    questions,
    answers,
    name,
    level,
    method,
    subject,
    date,
    score
  ]);


  /*
   * =====================================================
   * 전체 페이지
   *
   * 표지 1페이지
   * + 문제 페이지
   * =====================================================
   */

  const totalPages =
    questionPages.length + 1;


  /*
   * =====================================================
   * HEADER
   * =====================================================
   */

  function Header({
    page
  }) {

    return (

      <div
        className="print-header"
      >

        <table
          className="doc-header-table"
        >

          <colgroup>

            <col
              style={{
                width: "58%"
              }}
            />

            <col
              style={{
                width: "21%"
              }}
            />

            <col
              style={{
                width: "21%"
              }}
            />

          </colgroup>


          <tbody>

            <tr>

              <td
                className="dh-brand"
                rowSpan="2"
              >

                <div
                  className="dh-brand-inner"
                >

                  <img
                    src={logo}
                    alt="HANKUK"
                    className="dh-logo-img"
                  />


                  <div
                    className="dh-company"
                  >

                    <span
                      className="dh-company-main"
                    >
                      HANKUK
                    </span>


                    <span
                      className="dh-company-sub"
                    >
                      INDUSTRIAL ENGINEERING
                    </span>

                  </div>

                </div>

              </td>


              <td
                className="dh-series"
                colSpan="2"
              >

                Examination Series No.{" "}

                {method || ""}

              </td>

            </tr>


            <tr>

              <td
                className="dh-title"
                colSpan="2"
              >

                {method || ""}{" "}

                {subject || ""} Examination Questions

              </td>

            </tr>


            <tr>

              <td
                className="dh-name"
              >

                NAME : {name || ""}

              </td>


              <td
                className="dh-level-cell"
              >

                NDE {level || ""}

              </td>


              <td
                className="dh-page-cell"
              >

                PAGE {page} OF {totalPages}

              </td>

            </tr>

          </tbody>

        </table>


        <div
          className="print-header-space"
        />

      </div>

    );

  }


  /*
   * =====================================================
   * QUESTION
   * =====================================================
   */

  function Question({
    q,
    index
  }) {


    const correct =
      Number(
        q && q.answer
      );


    const rawUserAnswer =
      answers
        ? answers[index]
        : undefined;


    const user =
      rawUserAnswer === undefined ||
      rawUserAnswer === null ||
      rawUserAnswer === ""
        ? -1
        : Number(
            rawUserAnswer
          );


    const questionLines =
      String(
        q && q.question
          ? q.question
          : ""
      )
        .split(/\r?\n/)
        .filter(
          line =>
            line.trim() !== ""
        );


    return (

      <div
        className="question-print"
      >


        <div
          className="question-title"
        >

          <span
            className="question-num"
          >

            {index + 1}.

          </span>

          {" "}

          <span
            className="question-text-wrap"
          >

            {
              questionLines[0] || ""
            }

          </span>

        </div>


        {
          questionLines[1] && (

            <div
              className="question-ko"
            >

              {
                questionLines[1]
              }

            </div>

          )
        }


        {
          Array.isArray(
            q && q.options
          ) &&

          q.options.map(
            (
              op,
              i
            ) => {


              const optionLines =
                String(
                  op || ""
                )
                  .split(/\r?\n/)
                  .filter(
                    line =>
                      line.trim() !== ""
                  );


              let circleClass =
                "option-circle";


              if (
                i === correct
              ) {

                circleClass +=
                  " box-correct";

              }


              if (
                i === user &&
                i !== correct
              ) {

                circleClass +=
                  " box-wrong";

              }


              return (

                <div
                  className="option"
                  key={i}
                >

                  <span
                    className={circleClass}
                  >

                    {
                      numberCircle[i] || ""
                    }

                  </span>


                  <div
                    className="option-text"
                  >

                    <div
                      className="option-en"
                    >

                      {
                        optionLines[0] || ""
                      }

                    </div>


                    {
                      optionLines[1] && (

                        <div
                          className="option-ko"
                        >

                          {
                            optionLines[1]
                          }

                        </div>

                      )
                    }

                  </div>

                </div>

              );

            }
          )
        }

      </div>

    );

  }


  /*
   * =====================================================
   * RETURN
   * =====================================================
   */

  return (

    <>


      {/* =================================================
          측정 전용 영역

          중요:
          실제 인쇄 영역과 완전히 분리한다.
          ================================================= */}

      <div
        ref={measureRef}
        className="print-measure-area"
        aria-hidden="true"
      >

        <div
          className="measure-questions"
        >

          {
            questions.map(
              (
                q,
                index
              ) => (

                <div
                  className="measure-question"
                  key={
                    "measure-" + index
                  }
                >

                  <Question
                    q={q}
                    index={index}
                  />

                </div>

              )
            )
          }

        </div>

      </div>


      {/* =================================================
          실제 인쇄 영역
          ================================================= */}

      <div
        className="print-area"
      >


        {/* =================================================
            PAGE 1
            표지
            ================================================= */}

        <div
          className="print-paper cover-paper"
        >

          <Header
            page={1}
          />


          <div
            className="cover"
          >

            <h2>

              {method || ""}{" "}

              {
                subject
                  ? subject.toUpperCase()
                  : ""
              }

            </h2>


            <div
              className="cover-row"
            >

              <span>
                NAME ______________________
              </span>

              <span>
                DATE ______________________
              </span>

            </div>


            <div
              className="cover-row"
            >

              <span>
                Start : __________
              </span>

              <span>
                Finish : __________
              </span>

            </div>


            <div
              className="cover-row"
            >

              <span>
                SCORE ____________________
              </span>

              <span>
                EXAMINER ________________
              </span>

            </div>


            <div
              className="note"
            >

              <b>
                NOTE :
              </b>


              <p>

                1. This is closed book examination.
                No reference material may be used during examination.

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


            <div
              className="approved"
            >

              Approved by __________________

              <br />

              NDE Level Ⅲ

            </div>

          </div>

        </div>


        {/* =================================================
            PAGE 2 ~
            문제지
            ================================================= */}

        {
          questionPages.map(
            (
              pageQuestions,
              pageIndex
            ) => {


              const pageNumber =
                pageIndex + 2;


              return (

                <div
                  className="print-paper question-paper"
                  key={
                    "question-page-" +
                    pageIndex
                  }
                >


                  <Header
                    page={pageNumber}
                  />


                  <div
                    className="questions-content"
                  >

                    {
                      pageQuestions.map(
                        (
                          q,
                          questionIndex
                        ) => {


                          const realIndex =
                            questions.findIndex(
                              item =>
                                item === q
                            );


                          return (

                            <Question
                              key={
                                "question-" +
                                pageIndex +
                                "-" +
                                questionIndex
                              }

                              q={q}

                              index={
                                realIndex >= 0
                                  ? realIndex
                                  : questionIndex
                              }

                            />

                          );

                        }
                      )
                    }

                  </div>

                </div>

              );

            }
          )
        }

      </div>

    </>

  );

}


export default PrintAdminExam;