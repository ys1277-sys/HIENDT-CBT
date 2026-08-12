import React, {
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";

const EMPTY_ANSWERS = {};

function PrintResultExam({
  questions = [],
  answers = EMPTY_ANSWERS,

  name = "",
  level = "",
  method = "",
  subject = "",
  date = "",
  score = "",

  onReady
}) {

  const numberCircle = [
    "1",
    "2",
    "3",
    "4"
  ];

  const [questionPages, setQuestionPages] =
    useState([]);

  const measureRef =
    useRef(null);

  const onReadyRef =
    useRef(onReady);

  const measuredRef =
    useRef(false);


  useLayoutEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);


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


    if (
      currentPage.length > 0
    ) {

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
    answers,
    name,
    level,
    method,
    subject,
    date,
    score
  ]);


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
                {subject || ""} Examination Result

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
     (수험자용: 정답 비공개, 내가 고른 답만 O/X 표시)
     ===================================================== */

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

              let mark =
                numberCircle[i] || "";


              if (
                i === user &&
                user === correct
              ) {

                circleClass +=
                  " box-correct";

                mark = "O";

              }


              if (
                i === user &&
                user !== correct
              ) {

                circleClass +=
                  " box-wrong";

                mark = "X";

              }


              return (

                <div
                  className="option"
                  key={i}
                >

                  <span
                    className={circleClass}
                  >

                    {mark}

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
                NAME : {name || ""}
              </span>

              <span>
                DATE : {date || ""}
              </span>

            </div>


            <div
              className="cover-row"
            >

              <span>
                SCORE : {score || ""}
              </span>

            </div>


            <div
              className="note"
            >

              <b>
                NOTE :
              </b>


              <p>

                1. 본인이 선택한 답안만 O(정답) / X(오답)로 표시됩니다.

                <br />

                정답 자체는 공개되지 않습니다.

              </p>

            </div>

          </div>

        </div>


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

export default PrintResultExam;
