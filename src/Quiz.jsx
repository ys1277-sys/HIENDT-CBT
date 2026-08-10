import React, { useEffect, useState } from "react";
import Result from "./Result.jsx";
import ExamData from "./ExamData.jsx";
import Calculator from "./Calculator.jsx";


function Quiz({
  name,
  level,
  method,
  subject,
  onBack
}) {


  const [questions,setQuestions] = useState([]);
  const [current,setCurrent] = useState(0);
  const [answers,setAnswers] = useState({});
  const [showResult,setShowResult] = useState(false);
  const [showCalc, setShowCalc] = useState(false);



  useEffect(()=>{


    async function loadQuestions(){


      try{


      let exam;


if(level === "Level II"){

  exam =
  ExamData?.[level]?.[subject]?.[method];

}


if(level === "Level III"){

  exam =
  ExamData?.[level]?.[method];

}


        console.log(
          "시험 데이터:",
          exam
        );



        if(!exam){

          alert(
            "시험 데이터를 찾을 수 없습니다."
          );

          return;

        }




const url =
import.meta.env.BASE_URL +
exam.file.replace(/^\//,"");


console.log(
  "JSON URL:",
  url
);


const res =
await fetch(url);


        const data =
        await res.json();



        let list=[];



        if(Array.isArray(data)){

          list=data;

        }
        else if(Array.isArray(data.questions)){

          list=data.questions;

        }



        list =
        list.flat();



        list =
        list.filter(
          q=>Array.isArray(q.options)
        );



        console.log(
          "문제 수:",
          list.length
        );



        setQuestions(list);



      }
      catch(err){


        console.error(err);


        alert(
          "문제를 불러오지 못했습니다."
        );


      }


    }



    loadQuestions();


  },[
    level,
    subject,
    method
  ]);







  function selectAnswer(index){


    setAnswers(prev=>({

      ...prev,

      [current]:index

    }));


  }







  function selectAnswerFor(qIndex,optIndex){


    setAnswers(prev=>({

      ...prev,

      [qIndex]:optIndex

    }));


    setCurrent(qIndex);


  }







  function submitExam(){


    const unanswered =
    questions.filter(
      (_,index)=>
      answers[index]===undefined
    );



    if(unanswered.length>0){


      const ok = window.confirm(
        `풀지 않은 문제가 ${unanswered.length}개 있습니다. 그래도 제출하시겠습니까?`
      );

      if(!ok) return;


    }




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







  const q =
  questions[current];



  const question =
  (q.question || "")
  .split(/\r?\n/);



  const questionEn =
  question[0];



  const questionKo =
  question.slice(1)
  .join(" ")
  .trim();



  const answeredCount =
  Object.keys(answers).length;







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





        <div className="cbt-content">



        <main className="cbt-body">



          <div className="question-number">

            Question {current+1}
            /
            {questions.length}

          </div>






          <div className="question-box">


            <div className="english-question question-title">
              <span className="question-num">{current+1}.</span>
              <span className="question-text-wrap">{questionEn}</span>
            </div>



            {
              questionKo &&

              <div className="korean-question">

                {questionKo}

              </div>

            }


          </div>







          <div className="answer-box">



          {
            q.options.map((item,index)=>{


              const option =
              item.split(/\r?\n/);



              return (


                <label

                  key={index}

                  className={
                    answers[current]===index
                    ?
                    "answer selected"
                    :
                    "answer"
                  }

                >



                  <input

                    type="radio"

                    checked={
                      answers[current]===index
                    }

                    onChange={()=>selectAnswer(index)}

                  />





                  <div className="option-text">


                    <div className="option-en">

                      {index+1}. {option[0]}

                    </div>



                    {
                      option[1] &&

                      <div className="option-ko">

                        {option[1]}

                      </div>

                    }


                  </div>



                </label>


              );


            })
          }



          </div>







          <div className="control">


            <button

              onClick={() => setShowCalc(true)}

            >

              계산기

            </button>



            <button

              disabled={current===0}

              onClick={()=>
                setCurrent(current-1)
              }

            >

              이전

            </button>






            {
              current < questions.length - 1

              ?

              <button

                onClick={()=>
                  setCurrent(current+1)
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

              onClick={onBack}

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

              questions.map((qItem,qIndex)=>{


                return (

                  <div

                    key={qIndex}

                    className={

                      qIndex===current
                      ?
                      "answer-sheet-row current"
                      :
                      "answer-sheet-row"

                    }

                  >


                    <span className="row-number">

                      {qIndex+1}

                    </span>



                    <span className="row-options">


                      {

                        qItem.options.map((op,i)=>{


                          const selected =
                          answers[qIndex]===i;


                          return (

                            <button

                              key={i}

                              type="button"

                              className={

                                selected
                                ?
                                "option-circle selected"
                                :
                                "option-circle"

                              }

                              onClick={()=>
                                selectAnswerFor(qIndex,i)
                              }

                            >

                              {i+1}

                            </button>

                          );


                        })

                      }


                    </span>


                  </div>


                );


              })

            }


          </div>


        </aside>




        </div>



      </div>



      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}



    </div>

  );


}


export default Quiz;
