import React, { useEffect, useMemo, useState } from "react";
import Result from "./Result.jsx";
import ExamData, { questionCount } from "./ExamData.jsx";
import Calculator from "./Calculator.jsx";
import QuestionImage from "./QuestionImage.jsx";
import GroupNote from "./GroupNote.jsx";
import { groupRanges } from "./groupRange.js";
import { optionMark, optionMarkFilled } from "./optionMark.js";
import {
  questionType,
  isAnswered,
  MULTI,
  TEXT
} from "./grading.js";
import { shuffle, shuffleOptions } from "./optionShuffle.js";

/*
 * ★ 검토 모드 ★
 *
 * true  — 문제은행에 적힌 차례 그대로, 은행에 든 문항을 전부 낸다.
 *         무작위 추첨도, 순서 섞기도 하지 않는다.
 *         문항을 1번부터 차례로 훑어보며 검토할 때 쓴다.
 *
 * false — 규정 문항 수(E01 표 3)만큼 무작위로 뽑고 순서도 섞는다.
 *         실제 시험 때 쓰는 값이다.
 *
 * true 인 채로 시험을 치면 두 가지가 깨진다.
 *   1. 모두가 똑같은 시험지를 받는다 — 옆 화면을 보면 그대로 답이 된다.
 *   2. 규정 문항 수를 안 지킨다 — 40문항 시험에 48문항이 나간다.
 *
 * 그래서 이 값이 true 이면 시험 화면 맨 위에 띠가 하나 뜬다.
 * 띠가 보이는 채로 시험을 치면 안 된다.
 *
 * ★ 검토가 끝나면 false 로 되돌린다.
 */
export const DRAW_IN_ORDER = true;

/*
 * 문항을 "묶음" 단위로 나눈다.
 *
 * 같은 조건문(groupNote)을 공유하는 문항들은 한 덩어리다.
 *   "폭 ½인치, 길이 6인치인 용접부를 ... 침투탐상한 상황입니다"
 * 같은 전제는 그 묶음의 문항을 다 같이 봐야 뜻이 통하므로,
 * 섞을 때 흩어지거나 일부만 뽑혀 잘려나가면 안 된다.
 *
 * 조건문이 없는 문항은 혼자서 한 묶음이 된다.
 * 묶음 안의 순서는 원본 순서를 그대로 지킨다.
 */
function toGroups(bank) {
  const groups = [];
  const byNote = new Map();

  for (const q of bank) {
    const note = q && q.groupNote;
    if (!note) { groups.push([q]); continue; }

    const found = byNote.get(note);
    if (found) found.push(q);
    else {
      const g = [q];
      byNote.set(note, g);
      groups.push(g);
    }
  }
  return groups;
}

/*
 * 출제 목록 만들기
 *
 * JSON 은 문제은행이라 실제 출제 수보다 많이 들어 있고, A형/B형 문항이
 * 한 과목 파일에 섞여 있다. 출제할 때는 은행에서 무작위로 뽑고
 * 순서도 매번 섞는다. 같은 과목을 다시 쳐도 같은 시험지가 나오지 않는다.
 *
 * 묶음 단위로 뽑아 조건문을 공유하는 문항이 항상 함께 나오게 한다.
 * 남은 자리보다 큰 묶음은 건너뛰고 다음 묶음을 본다 —
 * 그래야 40문항/25문항을 정확히 채우면서 묶음도 쪼개지지 않는다.
 *
 * 다만 큰 묶음이 뒤쪽에 걸리면 자리가 없어 통째로 빠지고 문항 수가 모자란다.
 * (TOFD Specific 은 30문항 중 11문항이 한 묶음이라 최악의 경우 19문항까지
 *  떨어졌다.) 그래서 순서를 여러 번 다시 섞어 보고 요구 수를 정확히
 * 채우는 조합이 나오면 그걸 쓴다. 끝내 못 채우면 가장 많이 채운 것을 쓴다.
 *
 * count 가 null 이거나 은행이 그보다 적으면 있는 문항을 전부 출제한다.
 */
const DRAW_ATTEMPTS = 40;

function fillGroups(groups, count) {
  const picked = [];
  for (const g of groups) {
    if (picked.length >= count) break;
    if (picked.length + g.length > count) continue;   // 자리가 모자라면 건너뛴다
    picked.push(...g);
  }
  return picked;
}

function drawQuestions(bank, count) {

  /*
   * 검토 모드 — 은행에 적힌 차례 그대로 전부 낸다.
   * 묶음을 다시 엮지 않는다. 원본 차례가 곧 묶음 차례다.
   * 보기 자리도 안 바꾼다. 은행에 적힌 그대로여야 대조가 된다.
   */
  if (DRAW_IN_ORDER) return [...bank];

  const groups = toGroups(bank);

  /* 뽑은 문항마다 보기 자리도 바꾼다 (E02 7.3.1) */
  const draw = (list) => list.map(shuffleOptions);

  if (!count || count >= bank.length) return draw(shuffle(groups).flat());

  let best = [];
  for (let i = 0; i < DRAW_ATTEMPTS; i++) {
    const picked = fillGroups(shuffle(groups), count);
    if (picked.length === count) return draw(picked);
    if (picked.length > best.length) best = picked;
  }
  return draw(best);

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

  /*
   * 시험 시작·종료 시각. 결과지 표지의 Start / Finish 에 찍는다.
   * 문항을 다 읽어 화면에 띄운 때를 시작으로 본다.
   */
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);

  /*
   * 보기 번호는 src/optionMark.js 에서 뽑는다.
   *
   * 예전에는 여기에 배열로 박아 두었다. 넷 → 여덟로 늘려 왔는데 그때마다
   * 그 수를 넘는 문항에서 뒤쪽이 맨 숫자로 나왔다. 실제로 MT 일반 12번은
   * 보기가 열이라 답안 표기란이 "① ② ③ ④ ⑤ ⑥ ⑦ ⑧ 9 10" 으로 나왔다.
   * 글자표에서 바로 뽑으니 다시 잘리지 않는다.
   */

  /*
   * 묶음 지시문에 넣을 문항 번호. 이번 시험지에서 실제로 몇 번인지다.
   *
   * 아래에 loading·loadError·showResult 로 일찍 돌아가는 자리가 있다.
   * 훅은 그보다 위에 있어야 순서가 안 어긋난다.
   */
  /*
   * 새로 지은 문항이 몇 번부터인지.
   *
   * 지어 넣은 문항은 은행 맨 뒤에 붙어 있고 note 에 자국이 남아 있다.
   * 검토 모드 띠에 밝혀 두면 원본과 나눠 볼 수 있다.
   * 실제 시험(검토 모드가 꺼진 때)에는 안 쓴다.
   */
  const madeFrom = useMemo(() => {
    if (!DRAW_IN_ORDER) return 0;

    const at = questions.findIndex(
      (q) => q && q.note && /새로 지은 문항이다|held\/ 로 빼 두었던/.test(q.note)
    );
    return at < 0 ? 0 : at + 1;
  }, [questions]);

  const ranges =
    useMemo(
      () => groupRanges(questions),
      [questions]
    );

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

        /*
         * 주소 뒤에 빌드 값을 붙인다.
         *
         * 문항 JSON 은 파일명이 고정이라, 브라우저가 예전 것을 들고 있으면
         * 문제를 고쳐 배포해도 응시자에게는 옛 문제가 그대로 나온다.
         * 배포할 때마다 이 값이 바뀌어 새로 받아간다.
         */
        const url =
          import.meta.env.BASE_URL +
          exam.file.replace(/^\//, "") +
          "?v=" + __BUILD_ID__;

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

        /* 표 3 은 종목마다 문항 수가 달라 종목까지 넘긴다 */
        const want = questionCount(level, subject, method);

        const drawn = drawQuestions(list, want);

        console.log(
          "출제:",
          `${drawn.length}문항`,
          DRAW_IN_ORDER
            ? `★ 검토 모드 — 은행 차례 그대로 (기준 ${want || "없음"})`
            : want ? `(기준 ${want}, 은행 ${list.length})` : `(은행 전체 ${list.length})`
        );

        if (want && list.length < want) {

          console.warn(
            `문제은행이 기준보다 적습니다. ${list.length}/${want}`
          );

        }

        setQuestions(drawn);
        setCurrent(0);

        /* 문항이 화면에 뜬 때를 시험 시작으로 본다 */
        setStartedAt(new Date());
        setFinishedAt(null);

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

    /* 결과지 표지의 Finish 에 쓴다 */
    setFinishedAt(new Date());

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

        startedAt={startedAt}

        finishedAt={finishedAt}

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

        {/*
          검토 모드일 때만 뜬다. 무작위 추첨을 꺼 둔 상태로 시험을 치면
          모두가 같은 시험지를 받는다. 그 사실을 감추지 않는다.
        */}
        {DRAW_IN_ORDER ? (
          <div className="cbt-order-banner">
            검토 모드 — 문제은행 차례 그대로 {questions.length}문항을 냅니다.
            {/*
              새로 지은 문항은 은행 맨 뒤에 붙어 있다. 몇 번부터인지 밝혀
              두면 원본 문항과 지어 넣은 문항을 나눠 보기 좋다.
            */}
            {madeFrom ? (
              <>
                {" "}1~{madeFrom - 1}번이 원본 시험지,{" "}
                <b>{madeFrom}~{questions.length}번이 새로 지은 문항</b>입니다.
              </>
            ) : null}{" "}
            무작위 추첨을 꺼 두었으므로 <b>실제 시험에 쓰지 마세요.</b>
          </div>
        ) : null}

        <header className="cbt-header">

          <h1>
            HIENDT-CBT
          </h1>

          {/*
            예전에는 이름·급수·과목을 세 줄로 쌓아 머리글이 109px 이었다.
            그만큼 본문이 줄어 조금만 긴 문항이면 스크롤바가 생겼다.
            한 줄로 펴서 본문 자리를 넓힌다.
          */}
          <div className="cbt-who">

            <span>{name}</span>

            <span>{level}</span>

            <span>{method} {subject}</span>

          </div>

        </header>


        <div className="cbt-content">

          <main className="cbt-body">

            <div className="question-number">

              Question {current + 1}
              /
              {questions.length}

            </div>


            {/* 지시문의 절차서 이름을 누르면 절차서 창이 뜬다 */}
            <GroupNote
              q={q}
              range={ranges.get(q)}
              showProcedure
            />


            <div className="question-box">

              <div className="question-title">

                {/* 예전에는 배열의 첫 칸이 박혀 있어 몇 번 문항이든 ① 로 보였다 */}
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


              {/* 화면에서는 눌러 크게 볼 수 있게 한다. 인쇄 쪽은 끈다 */}
              <QuestionImage q={q} zoomable />

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


                          {/*
                            번호는 본문 밖에 둔다.
                            안에 넣으면 한글 줄이 번호 자리까지 왼쪽으로 밀려
                            "① permeability / 투자율" 이 세로로 어긋나 보인다.
                            인쇄 화면도 번호를 밖에 두고 있어 모양이 같아진다.
                          */}
                          <span className="option-number">

                            {optionMark(index)}

                          </span>


                          <div className="option-text">

                            <div className="option-en">

                              {optionEn}

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
                                        /*
                                         * 고른 보기는 속이 찬 글자로 바꾼다.
                                         *
                                         * 예전에는 배경을 동그랗게 칠했는데,
                                         * 칠한 원이 글자 ① 의 원보다 커서
                                         * 테두리 밖으로 삐져나왔다. ❶ 은 글자
                                         * 자체가 채워진 원이라 원 안에만 찬다.
                                         */
                                        (selected
                                          ? optionMarkFilled(i)
                                          : optionMark(i))
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