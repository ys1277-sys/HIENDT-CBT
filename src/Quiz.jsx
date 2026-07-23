import React, { useEffect, useState } from "react";
import Result from "./Result.jsx";
import ExamData from "./ExamData.jsx";

console.log("Quiz.jsx 실행됨");


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



  useEffect(()=>{


    async function load(){


      try{


        const exam =
          ExamData[level]?.[subject]?.[method];


        if(!exam){

          alert("시험 데이터를 찾을 수 없습니다.");
          return;

        }



        const res = await fetch(exam.file);

        const data = await res.json();



        if(Array.isArray(data)){

          setQuestions(data);

        }

        else if(Array.isArray(data.questions)){

          setQuestions(data.questions);

        }

        else{

          alert("문제 형식이 올바르지 않습니다.");

        }



      }catch(err){

        console.log(err);

        alert("문제를 불러오지 못했습니다.");

      }


    }



    load();


  },[level,subject,method]);






  function selectAnswer(index){


    setAnswers(prev=>({

      ...prev,

      [current]:index

    }));


  }







  function submitExam(){


    localStorage.setItem(

      "lastExam",

      JSON.stringify({

        name,

        level,

        method,

        subject,

        questions,

        answers,

        date:new Date().toLocaleString()

      })

    );


    setShowResult(true);


  }








  if(questions.length===0){


    return (

      <div className="cbt-page">

        <div className="cbt-container">

          문제 불러오는 중...

        </div>

      </div>

    );


  }








  if(showResult){


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






  const q = questions[current];





  // ==========================
  // 문제 영어 / 한글 분리
  // ==========================


  const questionSplit =

    (q.question || "").split(/\r?\n/);



  const questionEn =

    questionSplit[0]?.trim() || "";



  const questionKo =

    questionSplit.slice(1)

    .join(" ")

    .trim();







  const options =

    q.options ||

    [];





  return (

    <div className="cbt-page">


      <div className="cbt-container">



        <header className="cbt-header">


          <h1>

            KNDT-CBT

          </h1>



          <div>

            {name}<br/>

            {level}<br/>

            {method} {subject}

          </div>


        </header>





        <main className="cbt-body">



          <div className="question-number">


            Question {current+1} / {questions.length}


          </div>






          <div className="question-box">


            <div className="english-question">


              {current+1}. {questionEn}


            </div>





            {

              questionKo &&

              <div className="korean-question">

                {questionKo}

              </div>

            }



          </div>





          <div className="answer-box">

            {options.map((item,index)=>{


              // JSON: "영문\n한글" 구조 처리

              const cleanOption =

                typeof item === "string"

                ? item.replace(/^[A-Da-d]\.\s*/,"")

                : "";



              const optionSplit =

                cleanOption.split(/\r?\n/);



              const optionEn =

                optionSplit[0]?.trim() || "";



              const optionKo =

                optionSplit.slice(1)

                .join(" ")

                .trim();





              return (


                <label


                  key={index}


                  className={

                    answers[current] === index

                    ? "answer selected"

                    : "answer"

                  }


                >



                  <input


                    type="radio"


                    checked={answers[current] === index}


                    onChange={()=>selectAnswer(index)}


                  />





                  <span className="option-text">



                    <div className="option-en">


                      {index + 1}. {optionEn}


                    </div>





                    {

                      optionKo &&


                      <div className="option-ko">


                        {optionKo}


                      </div>


                    }



                  </span>



                </label>



              );


            })}



          </div>









          <div className="control">



            <button


              disabled={current===0}


              onClick={()=>setCurrent(current-1)}


            >


              이전


            </button>






            {


              current < questions.length-1


              ?


              <button


                onClick={()=>setCurrent(current+1)}


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







            <button onClick={onBack}>


              종료


            </button>



          </div>







        </main>



      </div>



    </div>


  );


}



export default Quiz;