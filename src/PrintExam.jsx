import React, {
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import "./print.css";
import logo from "./logo.png";
import QuestionImage, { questionImages } from "./QuestionImage.jsx";
import GroupNote from "./GroupNote.jsx";
import ProcedureAppendix, { useProcedures } from "./ProcedureAppendix.jsx";
import { groupRanges } from "./groupRange.js";
import {
  questionType,
  isCorrectOption,
  isChosenOption,
  TEXT
} from "./grading.js";

const EMPTY_ANSWERS = {};

/* 표지의 Start / Finish 는 시:분 까지만 적는다 */
function clockText(t) {
  const d = t instanceof Date ? t : new Date(t);
  if (Number.isNaN(d.getTime())) return "__________";

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh} : ${mm}`;
}

function PrintExam({
  questions = [],
  answers = EMPTY_ANSWERS,

  /*
   * 정답·오답을 색으로 칠할지.
   *
   * 시험을 친 뒤 뽑는 결과지(Result)는 켠다. 정답은 파랑, 응시자가 잘못 고른
   * 것은 빨강으로 나온다.
   * 응시자에게 나눠 줄 백지 문제지(문제은행 출력)는 꺼야 한다.
   */
  showAnswers = true,

  name = "",
  level = "",
  method = "",
  subject = "",
  date = "",

  /*
   * 표지의 Start / Finish / SCORE.
   *
   * 시험을 친 뒤 뽑는 결과지는 이 값을 아니까 채운다.
   * 문제은행 출력은 응시자에게 나눠 줄 백지라 넘기지 않고, 그때는
   * 예전처럼 빈 줄이 찍힌다.
   */
  startedAt = null,
  finishedAt = null,
  score = "",

  onReady
}) {

  /*
   * 보기 번호. 시험 화면과 같은 ①②③④ 를 쓴다.
   *
   * 예전에는 넷까지만 두고 나머지를 "" 로 처리해, 보기가 다섯 이상인 문항은
   * 5·6번 번호가 빈칸으로 인쇄됐다. (VT General 에 그런 문항이 있다)
   * 여덟까지 채우고 그보다 많으면 숫자로 떨어뜨린다.
   */
  const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  const optionNumber = (i) => CIRCLED[i] || String(i + 1);

  const [questionPages, setQuestionPages] =
    useState([]);

  /*
   * 뽑힌 문항이 가리키는 절차서. 문제지 뒤에 부록으로 붙는다.
   *
   * 종이 시험지에는 절차서 창이 없으니 자동으로 따라 붙어야 한다.
   * 절차서를 안 넣어 뒀으면 빈 목록이라 아무것도 안 붙는다.
   */
  const appendix =
    useProcedures(questions);

  /* 묶음 지시문에 넣을 문항 번호 — 이 시험지에서 실제로 몇 번인지다 */
  const ranges =
    useMemo(
      () => groupRanges(questions),
      [questions]
    );

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

    onReadyRef.current =
      onReady;

  }, [
    onReady
  ]);


  /*
   * 새 문제 묶음이 들어오면 빗장을 푼다.
   * 출력 버튼을 다시 눌렀을 때 인쇄창이 안 뜨면 안 된다.
   * 이 훅은 아래 분할 훅보다 먼저 있어야 순서가 맞는다.
   */
  useLayoutEffect(() => {

    firedRef.current = false;

  }, [
    questions
  ]);


  /* =========================================================
     문제 페이지 자동 분할
     ========================================================= */

  useLayoutEffect(() => {

    measuredRef.current = false;


    if (
      !questions ||
      questions.length === 0
    ) {

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


    if (
      questionElements.length === 0
    ) {
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
          setImagesTick(
            tick => tick + 1
          );
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


    /*
      실제 PAPER 높이 276mm

      머리글
        재어 보면 33.6mm 다. 33 으로 두면 0.6mm 가 모자란다.

      안전 여유
        2mm 로는 모자란다. 화면에서 재면 한 쪽이 274.4mm 로 1.6mm 를
        남기고 딱 들어가는데, 실제 인쇄는 글꼴 힌팅과 줄높이 반올림이
        달라 그만큼이 쉽게 넘친다. .print-paper 가 overflow:hidden 이라
        넘친 만큼이 소리 없이 잘려 나가고, 보기 ③④ 가 사라진 채로
        인쇄된다. 다음 쪽에도 안 나온다.

        쪽수가 한두 장 늘더라도 잘리지 않는 쪽이 낫다.
    */

    const PAGE_HEIGHT =
      276 * MM;

    const HEADER_HEIGHT_MM =
      34;

    const headerHeight =
      HEADER_HEIGHT_MM * MM;

    const SAFETY =
      8 * MM;

    const availableHeight =
      PAGE_HEIGHT -
      headerHeight -
      SAFETY;


    const pages = [];

    let currentPage = [];

    let currentHeight = 0;


    /*
     * 문항 사이 여백까지 세어야 한다.
     *
     * getBoundingClientRect 는 바깥 여백을 안 센다. .question-print 는
     * margin-bottom 이 25px 이라 한 쪽에 세 문항이면 75px(약 20mm)이
     * 통째로 빠진다. 그만큼 넘쳐도 계산상으로는 들어가는 것으로 나오고,
     * .print-paper 가 overflow:hidden 이라 넘친 만큼 잘려 나간다.
     * 보기 ③④ 가 사라진 채로 인쇄되고 다음 쪽에도 안 나온다.
     */
    const outerHeight = (element) => {
      const inner =
        element.querySelector(".question-print") || element;

      const cs = window.getComputedStyle(inner);

      return (
        element.getBoundingClientRect().height +
        (parseFloat(cs.marginTop) || 0) +
        (parseFloat(cs.marginBottom) || 0)
      );
    };


    questionElements.forEach(
      (
        element,
        index
      ) => {

        const height =
          outerHeight(element);


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
    imagesTick
  ]);


  /*
    반드시 questionPages가 실제 DOM에
    반영된 후 onReady 실행.
  */

  useLayoutEffect(() => {

    if (
      !measuredRef.current
    ) {
      return;
    }


    if (
      questions.length > 0 &&
      questionPages.length === 0
    ) {
      return;
    }


    /*
     * 절차서 부록을 다 읽기 전에 인쇄창이 뜨면 부록이 빈 종이로 나간다.
     */
    if (
      !appendix.ready
    ) {
      return;
    }


    /*
     * onReady 는 한 번만 부른다.
     *
     * 예전에는 questionPages 가 다시 계산될 때마다 불렸다. 문제은행
     * 출력을 한 번 하고 나면 이 컴포넌트가 붙어 있는 채로 남는데,
     * 그 상태에서 시험종목이나 시험 구분을 고르면 다시 렌더링되면서
     * 페이지가 재계산되고, 고르기만 했는데 인쇄창이 떴다.
     */
    if (
      firedRef.current
    ) {
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


  /* =========================================================
     HEADER
     ========================================================= */

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


  /* =========================================================
     QUESTION
     ========================================================= */

  function Question({
    q,
    index,
    /*
     * 묶음 지시문을 찍을지.
     *
     * 측정 영역은 늘 켜 둔다. 쪽을 나누기 전에는 어느 문항이 쪽 맨 위에
     * 올지 알 수 없어, 안 찍는 것으로 재면 그 문항이 쪽 머리로 밀렸을 때
     * 지시문 높이만큼 넘쳐 잘린다. 넉넉히 재고 찍을 때만 고른다.
     */
    showNote = true
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

        {/* 번호는 이 시험지에서 실제로 몇 번인지를 넣는다 */}
        {showNote ? <GroupNote q={q} range={ranges.get(q)} /> : null}


        <div
          className="question-title"
        >

          <span
            className="question-num"
          >

            {index + 1}.

          </span>



          {/*
            영문과 한글을 같은 칸에 넣는다.
            한글을 번호와 형제로 두면 번호 자리까지 왼쪽으로 밀려
            영문 줄과 세로가 어긋난다.
          */}
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


        {/*
          그림이 있으면 보기를 왼쪽, 그림을 오른쪽에 나란히 둔다.
          위아래로 쌓으면 문항 하나가 한 쪽을 넘겨 아래쪽 보기가 잘려 나갔다.
          그림이 없으면 감싸지 않아 보기가 폭을 다 쓴다.
        */}
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


              /* 복수정답(배열)도 함께 처리한다 */
              const optCorrect =
                showAnswers &&
                isCorrectOption(q, i);

              const optChosen =
                showAnswers &&
                isChosenOption(rawUserAnswer, i);


              let circleClass =
                "option-circle";


              /*
               * 응시자가 고른 보기에만 색을 칠한다.
               *
               * 예전에는 정답 보기를 늘 파랗게 칠했다. 그래서 응시자가
               * 손도 안 댄 문항까지 파란 표시가 찍혀 맞은 것처럼 보였다.
               * 고른 것이 맞으면 파랑, 틀리면 빨강. 안 고른 보기는 그대로.
               */
              if (optChosen && optCorrect) {

                circleClass +=
                  " box-correct";

              }


              if (optChosen && !optCorrect) {

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
          /*
           * 주관식 — 선택지가 없는 문항.
           * 시험지로 쓸 때는 답 쓰는 칸, 채점본에서는 정답과 응시자 답을 같이 보여준다.
           */
          isText && (

            <div className="answer-written">

              {
                showAnswers && answers && rawUserAnswer !== undefined ? (

                  <>
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
                  </>

                ) : (

                  <div className="written-blank" />

                )
              }

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


  /* =========================================================
     RETURN
     ========================================================= */

  return (

    <>

      {/* =====================================================
          측정 영역
          ===================================================== */}

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


      {/* =====================================================
          실제 인쇄 영역
          ===================================================== */}

      <div
        className="print-area"
      >


        {/* ===================================================
            PAGE 1
            =================================================== */}

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

              {/*
                시험을 친 뒤 뽑는 결과지는 아는 값을 채워 넣는다.
                문제은행 출력은 나눠 줄 백지라 빈 줄로 둔다.
              */}
              <span>
                Start : {startedAt ? clockText(startedAt) : "__________"}
              </span>

              <span>
                Finish : {finishedAt ? clockText(finishedAt) : "__________"}
              </span>

            </div>


            <div
              className="cover-row"
            >

              <span>
                SCORE {score === "" || score === undefined || score === null
                  ? "____________________"
                  : score}
              </span>

              <span>
                EXAMINER ________________
              </span>

            </div>


            {/* =================================================
                NOTE
                1 / 2 / 3만 존재
                ================================================= */}

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


        {/* ===================================================
            QUESTION PAGES
            =================================================== */}

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


                          /*
                           * 묶음 지시문은 묶음 맨 앞에 한 번만 찍는다.
                           *
                           * 화면은 한 문항씩 보여주니 문항마다 나와야 하지만,
                           * 종이는 문항이 이어져 나오므로 1~6번 위에 여섯 번
                           * 되풀이할 까닭이 없다. 원본 시험지도 한 번만 찍는다.
                           *
                           * 다만 묶음이 쪽을 넘어가면 다음 쪽 맨 위에는 다시
                           * 찍는다. 안 그러면 뒷쪽만 보는 사람은 어느 절차서를
                           * 보고 풀어야 하는지 알 수 없다.
                           */
                          const showNote =
                            questionIndex === 0 ||
                            pageQuestions[questionIndex - 1].groupNote !==
                              q.groupNote;


                          return (

                            <Question
                              key={
                                "question-" +
                                pageIndex +
                                "-" +
                                questionIndex
                              }

                              q={q}

                              showNote={showNote}

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


        {/* ===================================================
            절차서 부록
            문항이 가리키는 절차서를 문제지 뒤에 붙인다.
            절차서를 안 넣어 뒀으면 아무것도 안 나온다.
            =================================================== */}

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

export default PrintExam;

