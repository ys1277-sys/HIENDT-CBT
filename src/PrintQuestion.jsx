import React, {
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";

function PrintQuestion({
  questions = [],

  name = "",
  level = "",
  method = "",
  subject = "",
  date = "",

  onReady
}) {

  /* 보기 번호 — PrintExam 과 같다 */
  const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  const optionNumber = (i) => CIRCLED[i] || String(i + 1);

  const [questionPages, setQuestionPages] =
    useState([]);

  const measureRef =
    useRef(null);

  const onReadyRef =
    useRef(onReady);

  const measuredRef =
    useRef(false);

  /* onReady 를 이미 불렀는지 */
  const firedRef =
    useRef(false);


  useLayoutEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);


  /*
   * 새 문제 묶음이 들어오면 빗장을 푼다.
   * 이 훅은 아래 분할 훅보다 먼저 있어야 순서가 맞는다.
   */
  useLayoutEffect(() => {
    firedRef.current = false;
  }, [questions]);


  /* =====================================================
     문제 페이지 자동 분할
     ===================================================== */

  useLayoutEffect(() => {

    measuredRef.current = false;

    if (!questions || questions.length === 0) {

      setQuestionPages([]);

      measuredRef.current = true;

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


    if (questionElements.length === 0) {
      return;
    }


    const MM =
      3.7795275591;

    const PAGE_HEIGHT =
      276 * MM;

    const HEADER_HEIGHT_MM =
      33;

    const headerHeight =
      HEADER_HEIGHT_MM * MM;

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


        currentPage.push(index);

        currentHeight += height;

      }
    );


    if (currentPage.length > 0) {

      pages.push(
        currentPage
      );

    }


    const result =
      pages.map(
        page =>
          page.map(
            index =>
              questions[index]
          )
      );


    setQuestionPages(result);

    measuredRef.current = true;

  }, [
    questions,
    name,
    level,
    method,
    subject,
    date
  ]);


  /*
    문제은행출력이 멈추던 원인:
    기존 PrintQuestion.jsx는 onReady를 아예 받지도,
    호출하지도 않아서 상위 컴포넌트가 "준비 완료" 신호를
    영원히 못 받고 멈춰있었음. 아래에서 해결.
  */

  useLayoutEffect(() => {

    if (!measuredRef.current) {
      return;
    }

    if (
      questions.length > 0 &&
      questionPages.length === 0
    ) {
      return;
    }


    /* onReady 는 한 번만 부른다 — PrintExam 과 같은 이유다 */
    if (firedRef.current) {
      return;
    }

    firedRef.current = true;


    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        if (onReadyRef.current) {

          onReadyRef.current();

        }

      });

    });

  }, [
    questionPages,
    questions.length
  ]);


  const totalPages =
    questionPages.length + 1;


  /* =====================================================
     HEADER
     ===================================================== */

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
              className="col-name"
            />

            <col
              className="col-level"
            />

            <col
              className="col-page"
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
                {subject || ""} Question Bank

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


  /* =====================================================
     QUESTION
     (문제은행 출력이므로 정답/오답 표시 없이 보기만 표시)
     ===================================================== */

  function Question({
    q,
    index
  }) {

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


          {/* 번호는 왼쪽 칸, 영문·한글은 오른쪽 칸 — PrintExam 과 같다 */}
          <span
            className="question-stem"
          >

            <span
              className="question-text-wrap"
            >

              {
                questionLines[0] || ""
              }

            </span>


            {
              questionLines[1] && (

                <span
                  className="question-ko"
                >

                  {
                    questionLines[1]
                  }

                </span>

              )
            }

          </span>

        </div>


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


              return (

                <div
                  className="option"
                  key={i}
                >

                  <span
                    className="option-circle"
                  >

                    {
                      optionNumber(i)
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


  /* =====================================================
     RETURN
     ===================================================== */

  return (

    <>

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
                    "measure-" +
                    index
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


      <div
        className="print-area"
      >

        {
          questionPages.map(
            (
              pageQuestions,
              pageIndex
            ) => {

              const pageNumber =
                pageIndex + 1;


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

export default PrintQuestion;