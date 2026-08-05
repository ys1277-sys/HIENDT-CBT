import React from "react";
import "./print.css";


function PrintExam({

  name,
  level,
  method,
  subject,
  questions = [],
  answers = {},
  date

}) {


  return (

    <div className="print-page">


      <div className="cover">

        <h1>
          KNDT-CBT
        </h1>

        <h2>
          비파괴검사 자격시험
        </h2>

        <p>Level : {level}</p>
        <p>검사방법 : {method}</p>
        <p>시험구분 : {subject}</p>
        <p>응시자 : {name}</p>
        <p>시험일 : {date}</p>

      </div>



      <div className="page-break"></div>



      <h2 className="paper-title">
        문제지
      </h2>




      {
        questions.map((q,index)=>{


          const questionText =
          (q.question || "")
          .split(/\r?\n/);



          const correctIndex =
          Number(q.answer);



          const userIndex =
          Number(answers[index]);




          return (

            <div

              className="print-question"

              key={index}

            >



              <h3>

                {index+1}. {questionText[0]}

              </h3>



              {
                questionText[1] &&

                <p className="korean-print">

                  {questionText[1]}

                </p>

              }




              {
                q.options.map((op,i)=>{


                  const optionText =
                  op.split(/\r?\n/);



                  let className =
                  "print-option";



                  let mark="";



                  // 맞은 답
                  if(
                    i === userIndex &&
                    userIndex === correctIndex
                  ){

                    className += " correct";

                    mark="○";

                  }



                  // 틀린 답
                  if(
                    i === userIndex &&
                    userIndex !== correctIndex
                  ){

                    className += " wrong";

                    mark="×";

                  }




                  return (


                    <div

                      key={i}

                      className={className}

                    >



                      <span className="number-box">


                        {i+1}



                        {
                          mark &&

                          <span className="overlay-mark">

                            {mark}

                          </span>

                        }


                      </span>




                      <span>


                        {optionText[0]}



                        {
                          optionText[1] &&


                          <div className="print-option-ko">


                            {optionText[1]}


                          </div>


                        }


                      </span>



                    </div>


                  );


                })

              }



            </div>


          );


        })

      }



    </div>


  );


}


export default PrintExam;