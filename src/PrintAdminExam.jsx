import React from "react";
import "./print.css";


function PrintAdminExam({

  questions = [],

  answers = {},

  name = "",
  level = "",
  method = "",
  subject = "",
  date = "",
  score = ""

}) {


  return (

    <div className="exam-paper">


      <div className="paper-header">


        <h1>
          HIENDT-CBT
        </h1>


        <h2>
          비파괴검사원 자격시험
        </h2>



        <table className="exam-info">

          <tbody>


            <tr>

              <td>
                Subject
              </td>

              <td>
                {subject}
              </td>


              <td>
                Examination Series No.
              </td>

              <td>
                {method}-{level}
              </td>


            </tr>



            <tr>

              <td>
                NAME
              </td>

              <td>
                {name}
              </td>


              <td>
                DATE
              </td>

              <td>
                {date}
              </td>


            </tr>



            <tr>

              <td>
                SCORE
              </td>

              <td>
                {score}
              </td>


              <td>
                EXAMINER
              </td>

              <td>
                
              </td>


            </tr>



          </tbody>


        </table>



      </div>





      <h2 className="paper-title">

        HIENDT-CBT 관리자 정답지

      </h2>







      {


        questions.map((q,index)=>{


          const correctIndex =
            Number(q.answer);


          const userIndex =
            Number(answers[index]);


          const answered =
            !isNaN(userIndex);


          const isCorrectAnswer =
            answered && userIndex === correctIndex;



          const questionLines =
            String(q.question || "")
            .split(/\r?\n/);





          return (


            <div

              className="question-print"

              key={index}

            >




              <h3>

                {index + 1}. {questionLines[0]}

              </h3>





              {

                questionLines[1] &&


                <div className="question-korean">

                  {questionLines[1]}

                </div>


              }







              {


                q.options.map((op,i)=>{


                  const optionLines =
                    String(op || "")
                    .split(/\r?\n/);



                  let boxClass = "number-box";



                  if(answered && i === correctIndex){


                    if(isCorrectAnswer){

                      boxClass += " box-correct";

                    }
                    else{

                      boxClass += " box-wrong";

                    }


                  }





                  return (


                    <div

                      className="option"

                      key={i}

                    >




                      <span className={boxClass}>

                        {i+1}


                      </span>






                      <div className="option-text">



                        <div className="option-en">

                          {optionLines[0]}


                        </div>





                        {

                          optionLines[1] &&


                          <div className="option-ko">

                            {optionLines[1]}


                          </div>


                        }



                      </div>




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



export default PrintAdminExam;

