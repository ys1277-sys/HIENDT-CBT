import React, {
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";
import QuestionImage, { questionImages } from "./QuestionImage.jsx";
import GroupNote from "./GroupNote.jsx";
import ProcedureAppendix, { useProcedures } from "./ProcedureAppendix.jsx";
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

  /* 보기 번호 — PrintExam 과 같다 */
  const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  const optionNumber = (i) => CIRCLED[i] || String(i + 1);

  const [questionPages, setQuestionPages] =
    useState([]);

  /* 문항이 가리키는 절차서 — PrintExam 과 같다 */
  const appendix =
    useProcedures(questions);

  const measureRef =
    useRef(null);

  const onReadyRef =
    useRef(onReady);

  const measuredRef =
    useRef(false);

  /* onReady 를 이미 불렀는지 */
  const firedRef =
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


    /* 절차서 부록을 다 읽기 전에 인쇄하면 부록이 빈 종이로 나간다 */
    if (!appendix.ready) {
      return;
    }


    /* onReady 는 한 번만 부른다 — PrintExam 과 같은 이유다 */
    if (firedRef.current) {
      return;
    }

    firedRef.current = true;


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
    questions.length,
    appendix.ready
  ]);


  const totalPages =
    questionPages.length +
    1 +
    appendix.procs.reduce((n, p) => n + p.pages.length, 0);


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


        {/* 보기는 왼쪽, 그림은 오른쪽 — PrintExam 과 같은 배치 */}
        <div
          className={
            questionImages(q).length
              ? "question-body has-figure"
              : "question-body"
          }
        >

        <div className="question-options">

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


        {/* 그림은 보기 오른쪽 */}
        <QuestionImage q={q} />

        </div>

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


        {/* 절차서 부록 — PrintExam 과 같다 */}

        <ProcedureAppendix
          procs={appendix.procs}
          onPageSettled={appendix.onPageSettled}
          startPage={questionPages.length + 2}
          header={Header}
        />

      </div>

    </>

  );
}

export default PrintAdminExam;
