import React, { useEffect, useRef, useState } from "react";
import PrintExam from "./PrintExam.jsx";
import { openPaper } from "./paperPreview.js";
import { isCorrect, questionType, TEXT } from "./grading.js";


function Result({

  name,
  level,
  method,
  subject,
  questions = [],
  answers = {},

  /* 결과지 표지의 Start / Finish 에 찍는다 */
  startedAt = null,
  finishedAt = null,

  onBack

}) {


  const sent = useRef(false);

  const [print,setPrint] = useState(false);

  /*
   * 결과 전송 상태.
   * 예전에는 실패해도 콘솔에만 찍혀서, 응시자는 정상 제출된 줄 알고 나가고
   * 관리자 화면에는 그 기록이 없었다. 화면에 드러내고 재전송할 수 있게 한다.
   */
  const [sendState,setSendState] = useState("sending");   // sending | ok | failed
  const [sendError,setSendError] = useState("");



  let correct = 0;



  questions.forEach((q,index)=>{


    /*
     * 채점 규칙은 grading.js 한 곳에만 둔다.
     * 단일선택 / 복수선택 / 주관식을 모두 여기서 처리한다.
     */
    const ok =
      isCorrect(q, answers[index]);



    console.log(
      "채점확인",
      index + 1,
      "유형:",
      questionType(q),
      "선택:",
      answers[index],
      "정답:",
      q.answer,
      ok ? "O" : "X"
    );



    if(ok){

      correct++;

    }


  });



  const total = questions.length;


  const textCount =
    questions.filter(
      q => questionType(q) === TEXT
    ).length;



  const score =

    total === 0

    ?

    0

    :

    Math.round(
      (correct / total) * 100
    );




  const result =

    score >= 70

    ?

    "합격"

    :

    "불합격";





  const SHEET_URL =
    "https://script.google.com/macros/s/AKfycbwLEqjVHiKD9D5HHs4IWhgQj25wvXb5qt7r4vKJ1_oq33orPXc_Tfdt3t6Z6aw3ogw3/exec";


  function buildRecord() {

    const now = new Date();

    return {

      /*
       * 저장소가 이 값으로 무엇을 하는 요청인지 가른다.
       * (docs/Code.gs 의 doPost)
       */
      type: "exam",

      name,

      level,

      method,

      subject,


      total,

      correct,

      score,

      result,


      /*
       * date 는 사람이 읽는 값이라 로케일 문자열이지만,
       * "2026. 8. 12. 오후 3:04:12" 는 new Date() 로 되파싱되지 않는다.
       * 관리자 화면의 최신순 정렬이 이것 때문에 동작하지 않았으므로
       * 정렬용 timestamp 를 따로 넣는다.
       */
      date: now.toLocaleString(),

      timestamp: now.toISOString(),


      /*
       * 응시 시작·종료 시각.
       *
       * E02 7.7.7 이 "관리자 화면에서 응시 시작과 종료 시각을 확인할 수
       * 있다" 고 못 박고 있는데, 여태 기록에 담기지 않아 확인할 방법이
       * 없었다. timestamp 는 결과지가 뜬 시각이라 시험을 언제 시작했는지
       * 알려 주지 못한다.
       *
       * 시작은 문항이 화면에 뜬 때, 종료는 제출을 누른 때다 (Quiz.jsx).
       * 소요 시간은 E01 이 정한 2시간을 넘겼는지 보는 데 쓴다.
       */
      startedAt: startedAt ? startedAt.toISOString() : "",

      finishedAt: finishedAt ? finishedAt.toISOString() : "",

      durationSec:
        startedAt && finishedAt
          ? Math.round((finishedAt - startedAt) / 1000)
          : "",


      questions,

      answers

    };

  }


  // 로컬 보관. 전송이 실패해도 기록이 남아 있도록 한다.
  function saveLocally(record) {

    try {

      localStorage.setItem("lastExam", JSON.stringify(record));

      const old =
        JSON.parse(localStorage.getItem("results") || "[]");

      old.push(record);

      // 무한히 쌓이면 저장 한도에 걸린다. 최근 것만 남긴다.
      const trimmed = old.slice(-30);

      localStorage.setItem("results", JSON.stringify(trimmed));

    }
    catch (err) {

      // 저장 한도 초과 등. 서버 전송까지 막지는 않는다.
      console.warn("로컬 저장 실패", err);

    }

  }


  function sendToSheet(record) {

    setSendState("sending");
    setSendError("");

    return fetch(SHEET_URL, {

      method: "POST",

      body: JSON.stringify(record)

    })
      .then(res => {

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        return res.text();

      })
      .then(data => {

        console.log("Google 저장 완료", data);

        setSendState("ok");

      })
      .catch(err => {

        console.error("Google 저장 실패", err);

        setSendState("failed");
        setSendError(err.message || String(err));

      });

  }


  useEffect(()=>{


    if(sent.current) return;


    sent.current = true;



    const fullData = buildRecord();





    saveLocally(fullData);

    sendToSheet(fullData);


  },[]);







  /*
   * =====================================================
   * window.print() 는 더 이상 setTimeout으로 호출하지 않는다.
   *
   * print 상태가 true가 되면 아래에서 PrintExam이 렌더링되고,
   * PrintExam 내부에서 문제 페이지 분할/렌더링이
   * 실제로 끝난 시점에 onReady 콜백이 호출되어
   * 그 안에서 window.print()가 실행된다.
   *
   * =====================================================
   * 중요 (수정됨)
   *
   * PrintExam(.print-area)이 #root의 "직계 자식"이어야
   * print.css의
   *   #root > *:not(.print-area) { display: none !important; }
   * 규칙이 정상 동작한다.
   *
   * 기존에는 home-container div 안에 PrintExam이 있어서
   * #root의 직계 자식은 home-container 하나뿐이었고,
   * 그 규칙이 home-container 자체를 숨겨버려
   * 그 안의 print-area까지 같이 사라지는 문제가 있었다.
   *
   * 그래서 아래처럼 <> Fragment로 감싸서
   * home-container와 PrintExam을 형제(sibling)로 분리했다.
   * =====================================================
   */







  return (

    <>


      <div className="home-container">


        <div className="home-box">



          <h1>
            시험 결과
          </h1>



          <h2>
            {name} 님
          </h2>



          <hr/>




          <p>
            Level : {level}
          </p>



          <p>
            시험 : {method} {subject}
          </p>




          <h2>
            점수 : {score}점
          </h2>




          <h2>
            {result}
          </h2>


          {/* 시험지 규정: 과락 70%, 자격 취득은 종합 80% 이상 */}
          <p className="result-criteria">

            과락 기준 70% (자격 취득에는 전 과목 종합 80% 이상이 필요합니다)

          </p>




          <p>
            정답 : {correct} / {total}
          </p>



          {
            /*
             * 주관식은 입력한 글자를 정답과 맞춰 자동 채점한다.
             * 표현이 조금만 달라도 오답으로 떨어지므로 관리자 확인이 필요하다.
             */
            textCount > 0 && (

              <p className="result-note">

                주관식 {textCount}문항이 포함되어 있습니다.
                자동 채점 결과가 실제와 다를 수 있으니 관리자 확인이 필요합니다.

              </p>

            )
          }




          {/* 결과 전송 상태 — 실패를 응시자·감독자가 바로 알 수 있어야 한다 */}
          {
            sendState === "sending" && (
              <p className="send-status sending">결과 저장 중...</p>
            )
          }

          {
            sendState === "ok" && (
              <p className="send-status ok">결과가 저장되었습니다.</p>
            )
          }

          {
            sendState === "failed" && (

              <div className="send-status failed">

                <p>
                  결과 저장에 실패했습니다. ({sendError})
                  <br />
                  이 화면을 닫기 전에 다시 시도해 주세요.
                </p>

                <button
                  onClick={() => sendToSheet(buildRecord())}
                >
                  다시 저장
                </button>

              </div>

            )
          }




          <button

            /*
             * 이미 만들어 뒀으면 다시 펼치기만 한다.
             * setPrint(true) 는 이미 true 면 아무 일도 안 해서,
             * 화면에 펼친 문제지를 닫은 뒤 다시 누르면 반응이 없었다.
             */
            onClick={() => (print ? openPaper() : setPrint(true))}

          >

            문제지 출력

          </button>




          <button

            onClick={onBack}

          >

            처음 화면

          </button>




        </div>


      </div>




      {


        print &&


        <PrintExam


          name={name}


          level={level}


          method={method}


          subject={subject}


          questions={questions}


          answers={answers}


          date={

            new Date()
            .toLocaleDateString()

          }


          startedAt={startedAt}


          finishedAt={finishedAt}


          score={`${score}점  (${correct} / ${total})`}


          onReady={

            /* 아이폰은 인쇄창이 없다. 그때는 화면에 펼친다 */
            () => openPaper()

          }


        />


      }



    </>


  );


}



export default Result;