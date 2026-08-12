import React, { useEffect, useState } from "react";
import Result from "./Result.jsx";
import ExamData, { questionCount } from "./ExamData.jsx";
import Calculator from "./Calculator.jsx";
import QuestionImage from "./QuestionImage.jsx";
import {
  questionType,
  isAnswered,
  MULTI,
  TEXT
} from "./grading.js";

/*
 * 출제 목록 만들기
 *
 * JSON 은 문제은행이라 실제 출제 수보다 많이 들어 있고, A형/B형 문항이
 * 한 과목 파일에 섞여 있다. 출제할 때는 은행에서 무작위로 뽑고
 * 순서도 매번 섞는다. 같은 과목을 다시 쳐도 같은 시험지가 나오지 않는다.
 *
 * count 가 null 이거나 은행이 그보다 적으면 있는 문항을 전부 출제한다.
 */
function drawQuestions(bank, count) {

  const shuffled = [...bank];

  // Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return count && count < shuffled.length
    ? shuffled.slice(0, count)
    : shuffled;

}


function Quiz({
  name,
  level,
  method,
  subject,
  onBack
}) {

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  /*
   * "불러오는 중" 과 "못 불러옴" 을 구분한다.
   * 예전에는 questions.length === 0 하나로 두 상태를 같이 표현해서,
   * 불러오기에 실패하면 로딩 화면에 갇혀 새로고침 말고는 방법이 없었다.
   */
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const numberCircle = [
    "①",
    "②",
    "③",
    "④"
  ];

  useEffect(() => {

    let cancelled = false;

    async function loadQuestions() {

      setLoading(true);
      setLoadError("");

      try {

        let exam;

        if (level === "Level II") {

          exam =
            ExamData?.[level]?.[subject]?.[method];

        }

        if (level === "Level III") {

          exam =
            ExamData?.[level]?.[method];

        }

        console.log(
          "시험 데이터:",
          exam
        );

        if (!exam) {

          throw new Error(
            `시험 데이터를 찾을 수 없습니다. (${level} / ${method} ${subject})`
          );

        }

        const url =
          import.meta.env.BASE_URL +
          exam.file.replace(/^\//, "");

        console.log(
          "JSON URL:",
          url
        );

        const res =
          await fetch(url);

        /*
         * fetch 는 404 에 예외를 던지지 않는다.
         * GitHub Pages 는 없는 파일에 404 HTML 을 주기 때문에
         * 이 검사가 없으면 res.json() 이 깨지면서 원인을 알 수 없게 된다.
         */
        if (!res.ok) {

          throw new Error(
            `문제 파일을 불러오지 못했습니다. (HTTP ${res.status})\n${exam.file}`
          );

        }

        const data =
          await res.json();

        let list = [];

        if (Array.isArray(data)) {

          list = data;

        }
        else if (
          Array.isArray(data.questions)
        ) {

          list = data.questions;

        }

        list =
          list.flat();

        list =
          list.filter(
            q =>
              Array.isArray(q.options)
          );

        console.log(
          "문제 수:",
          list.length
        );

        if (cancelled) return;

        if (list.length === 0) {

          throw new Error(
            `출제할 문제가 없습니다.\n${exam.file}`
          );

        }

        const want = questionCount(level, subject);

        const drawn = drawQuestions(list, want);

        console.log(
          "출제:",
          `${drawn.length}문항`,
          want ? `(기준 ${want}, 은행 ${list.length})` : `(은행 전체 ${list.length})`
        );

        if (want && list.length < want) {

          console.warn(
            `문제은행이 기준보다 적습니다. ${list.length}/${want}`
          );

        }

        setQuestions(drawn);
        setCurrent(0);

      }
      catch (err) {

        console.error(err);

        if (!cancelled) {
          setQuestions([]);
          setLoadError(err.message || "문제를 불러오지 못했습니다.");
        }

      }
      finally {

        if (!cancelled) setLoading(false);

      }

    }

    loadQuestions();

    // 시험 종목이 바뀌면 먼저 시작한 요청의 결과는 버린다
    return () => { cancelled = true; };

  }, [
    level,
    subject,
    method
  ]);


  /*
   * 답 저장 형태는 문항 종류에 따라 다르다.
   *   단일선택 -> 숫자, 복수선택 -> 숫자 배열, 주관식 -> 문자열
   */
  function setAnswerFor(qIndex, value) {

    setAnswers(prev => ({

      ...prev,

      [qIndex]: value

    }));

  }


  // 복수정답 문항: 같은 선택지를 다시 누르면 해제
  function toggleAnswerFor(qIndex, optIndex) {

    setAnswers(prev => {

      const cur =
        Array.isArray(prev[qIndex])
          ? prev[qIndex]
          : [];

      const next =
        cur.includes(optIndex)
          ? cur.filter(v => v !== optIndex)
          : [...cur, optIndex].sort((a, b) => a - b);

      return {
        ...prev,
        [qIndex]: next
      };

    });

  }


  // 답안 표기란에서 고를 때는 그 문항으로 이동도 같이 한다
  function pickFromSheet(qIndex, optIndex) {

    const q = questions[qIndex];

    if (questionType(q) === MULTI) toggleAnswerFor(qIndex, optIndex);
    else setAnswerFor(qIndex, optIndex);

    setCurrent(qIndex);

  }


  // 종료하면 입력한 답이 모두 사라지므로 한 번 확인한다
  function exitExam() {

    const answered =
      questions.filter(
        (q, index) => isAnswered(q, answers[index])
      ).length;

    if (answered > 0) {

      const ok =
        window.confirm(
          `입력한 답 ${answered}개가 사라집니다. 시험을 종료할까요?`
        );

      if (!ok) return;

    }

    onBack();

  }


  function submitExam() {

    const unanswered =
      questions.filter(
        (q, index) =>
          !isAnswered(q, answers[index])
      );

    if (unanswered.length > 0) {

      const ok =
        window.confirm(
          `풀지 않은 문제가 ${unanswered.length}개 있습니다. 그래도 제출하시겠습니까?`
        );

      if (!ok) return;

    }

    setShowResult(true);

  }


  if (loading) {

    return (

      <div className="cbt-page">

        <div className="cbt-container">

          문제 불러오는 중...

        </div>

      </div>

    );

  }


  if (loadError || questions.length === 0) {

    return (

      <div className="cbt-page">

        <div className="cbt-container">

          <div className="load-error">

            <h2>문제를 불러오지 못했습니다</h2>

            <p>{loadError || "출제할 문제가 없습니다."}</p>

            <button onClick={onBack}>

              처음 화면으로

            </button>

          </div>

        </div>

      </div>

    );

  }


  if (showResult) {

    return (

      <Result

        name={name}

        level={level}

        method={method}

        subject={subject}

        questions={questions}

        answers={answers}

        onBack={onBack}

      />

    );

  }


  /*
   * current 가 범위를 벗어나면 q 가 undefined 가 되어 바로 아래에서 크래시한다.
   * 문제 목록이 바뀌는 순간을 방어한다.
   */
  const q =
    questions[current] || questions[0];


  const qType = questionType(q);

  const userAnswer = answers[current];


  const questionLines =
    String(
      q.question || ""
    )
      .split(/\r?\n/)
      .filter(
        line =>
          line.trim() !== ""
      );


  const questionEn =
    questionLines[0] || "";


  const questionKo =
    questionLines
      .slice(1)
      .join(" ")
      .trim();


  return (

    <div className="cbt-page">

      <div className="cbt-container">

        <header className="cbt-header">

          <h1>
            HIENDT-CBT
          </h1>

          <div>

            {name}<br />

            {level}<br />

            {method} {subject}

          </div>

        </header>


        <div className="cbt-content">

          <main className="cbt-body">

            <div className="question-number">

              Question {current + 1}
              /
              {questions.length}

            </div>


            <div className="question-box">

              <div className="question-title">

                {/* 예전에는 numberCircle[0] 이 박혀 있어 몇 번 문항이든 ① 로 보였다 */}
                <span className="question-num">

                  {current + 1}.

                </span>


                <div className="question-text-wrap">

                  <div className="english-question">

                    {questionEn}

                  </div>


                  {
                    questionKo && (

                      <div className="korean-question">

                        {questionKo}

                      </div>

                    )
                  }

                </div>

              </div>


              <QuestionImage q={q} />

            </div>


            <div className="answer-box">

              {

                qType === TEXT ? (

                  /* 주관식 — 원본이 서술형인 ECT / RFT Specific 문항 */
                  <div className="answer-text">

                    <label htmlFor="answer-text-input">
                      답을 입력하세요
                    </label>

                    <textarea

                      id="answer-text-input"

                      rows={3}

                      value={
                        typeof userAnswer === "string"
                          ? userAnswer
                          : ""
                      }

                      onChange={e =>
                        setAnswerFor(current, e.target.value)
                      }

                      placeholder="예) Slag"

                    />

                  </div>

                ) : (

                  q.options.map(
                    (item, index) => {

                      const optionLines =
                        String(item || "")
                          .split(/\r?\n/)
                          .filter(
                            line =>
                              line.trim() !== ""
                          );

                      const optionEn =
                        optionLines[0] || "";

                      const optionKo =
                        optionLines
                          .slice(1)
                          .join(" ")
                          .trim();


                      const chosen =
                        qType === MULTI
                          ? Array.isArray(userAnswer) &&
                            userAnswer.includes(index)
                          : userAnswer === index;


                      return (

                        <label

                          key={index}

                          className={
                            chosen
                              ? "answer selected"
                              : "answer"
                          }

                        >

                          <input

                            type={
                              qType === MULTI
                                ? "checkbox"
                                : "radio"
                            }

                            checked={chosen}

                            onChange={() =>
                              qType === MULTI
                                ? toggleAnswerFor(current, index)
                                : setAnswerFor(current, index)
                            }

                          />


                          <div className="option-text">

                            <div className="option-en">

                              <span className="option-number">

                                {numberCircle[index] || index + 1}

                              </span>

                              <span>
                                {optionEn}
                              </span>

                            </div>


                            {
                              optionKo && (

                                <div className="option-ko">

                                  {optionKo}

                                </div>

                              )
                            }

                          </div>

                        </label>

                      );

                    }
                  )

                )

              }


              {
                qType === MULTI && (

                  <div className="answer-hint">

                    정답이 여러 개인 문항입니다. 해당하는 것을 모두 고르세요.

                  </div>

                )
              }

            </div>


            <div className="control">

              <button
                onClick={() =>
                  setShowCalc(true)
                }
              >

                계산기

              </button>


              <button

                disabled={
                  current === 0
                }

                onClick={() =>
                  setCurrent(
                    current - 1
                  )
                }

              >

                이전

              </button>


              {
                current <
                questions.length - 1

                  ?

                  <button

                    onClick={() =>
                      setCurrent(
                        current + 1
                      )
                    }

                  >

                    다음

                  </button>

                  :

                  <button
                    onClick={submitExam}
                  >

                    제출

                  </button>
              }


              <button
                onClick={exitExam}
              >

                종료

              </button>

            </div>

          </main>


          <aside className="answer-sheet">

            <div className="answer-sheet-title">

              답안 표기란

            </div>


            <div className="answer-sheet-list">

              {
                questions.map(
                  (
                    qItem,
                    qIndex
                  ) => {

                    const rowType = questionType(qItem);

                    const rowAnswer = answers[qIndex];

                    return (

                      <div

                        key={qIndex}

                        className={
                          qIndex === current
                            ? "answer-sheet-row current"
                            : "answer-sheet-row"
                        }

                      >

                        {/* 문항 번호. 예전에는 ①②③④ 배열을 그대로 써서
                            5번부터 빈칸이 됐다. */}
                        <span className="row-number">

                          {qIndex + 1}

                        </span>


                        <span className="row-options">

                          {

                            rowType === TEXT ? (

                              <button

                                type="button"

                                className={
                                  typeof rowAnswer === "string" &&
                                  rowAnswer.trim() !== ""
                                    ? "option-written selected"
                                    : "option-written"
                                }

                                onClick={() => setCurrent(qIndex)}

                              >

                                주관식

                              </button>

                            ) : (

                              qItem.options.map(
                                (
                                  op,
                                  i
                                ) => {

                                  const selected =
                                    rowType === MULTI
                                      ? Array.isArray(rowAnswer) &&
                                        rowAnswer.includes(i)
                                      : rowAnswer === i;

                                  return (

                                    <button

                                      key={i}

                                      type="button"

                                      className={
                                        selected
                                          ? "option-circle selected"
                                          : "option-circle"
                                      }

                                      onClick={() =>
                                        pickFromSheet(
                                          qIndex,
                                          i
                                        )
                                      }

                                    >

                                      {
                                        numberCircle[i] || i + 1
                                      }

                                    </button>

                                  );

                                }
                              )

                            )

                          }

                        </span>

                      </div>

                    );

                  }
                )
              }

            </div>

          </aside>

        </div>

      </div>


      {
        showCalc && (

          <Calculator

            onClose={() =>
              setShowCalc(false)
            }

          />

        )
      }

    </div>

  );

}

export default Quiz;