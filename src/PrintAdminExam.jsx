import React, {
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";
import QuestionImage from "./QuestionImage.jsx";
import GroupNote from "./GroupNote.jsx";
import {
  questionType,
  isCorrectOption,
  isChosenOption,
  TEXT
} from "./grading.js";

const EMPTY_ANSWERS = {};

function PrintAdminExam({
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

  /*
   * 도해 이미지가 아직 로딩 중이면 문항 높이가 0에 가깝게 측정되어
   * 페이지 분할이 어긋난다. 이미지가 다 뜬 뒤 이 값을 올려
   * 측정을 다시 돌린다.
   */
  const [imagesTick, setImagesTick] =
    useState(0);


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


    /* 아직 로딩이 끝나지 않은 도해가 있으면 다 뜰 때까지 측정을 미룬다.
       complete 인데 깨진 이미지는 load 가 다시 오지 않으므로 기다리지 않는다. */
    const pending =
      Array.from(
        container.querySelectorAll("img")
      ).filter(
        img => !img.complete
      );


    if (pending.length > 0) {

      let left = pending.length;

      const onSettled = () => {

        left -= 1;

        if (left <= 0) {
          setImagesTick(tick => tick + 1);
        }

      };

      pending.forEach(img => {
        img.addEventListener("load", onSettled, { once: true });
        img.addEventListener("error", onSettled, { once: true });
      });

      return () => {
        pending.forEach(img => {
          img.removeEventListener("load", onSettled);
          img.removeEventListener("error", onSettled);
        });
      };

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
    score,
    imagesTick
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


  /* =====================================================
     QUESTION
     ===================================================== */

  function Question({
    q,
    index
  }) {

    const rawUserAnswer =
      answers
        ? answers[index]
        : undefined;


    const isText =
      questionType(q) === TEXT;


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

        <GroupNote q={q} />


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


        <QuestionImage q={q} />


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


              /* 정답 표시는 복수정답(배열)도 함께 처리한다 */
              const optCorrect =
                isCorrectOption(q, i);

              const optChosen =
                isChosenOption(rawUserAnswer, i);


              if (optCorrect) {

                circleClass +=
                  " box-correct";

              }


              if (
                optChosen &&
                !optCorrect
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


        {
          /* 주관식 — 응시자가 쓴 답과 정답을 나란히 보여준다 */
          isText && (

            <div className="answer-written">

              <div className="written-line">
                <span className="written-label">응시자 답</span>
                <span className="written-value">
                  {
                    typeof rawUserAnswer === "string" &&
                    rawUserAnswer.trim() !== ""
                      ? rawUserAnswer
                      : "-"
                  }
                </span>
              </div>

              <div className="written-line">
                <span className="written-label">정답</span>
                <span className="written-value written-correct">
                  {String(q.answer ?? "-")}
                </span>
              </div>

            </div>

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
                SCORE : {score || ""}
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
