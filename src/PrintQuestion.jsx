import React from "react";
import "./print.css";

function PrintQuestion({
  name,
  level,
  method,
  subject,
  questions
}) {


  return (

    <div className="exam-paper">


      <div className="cover">


        <h1>
          KNDT-CBT 문제지
        </h1>


        <table className="result-table">

          <tbody>

            <tr>
              <td>성명</td>
              <td>{name || "　　　　　　　　"}</td>
            </tr>

            <tr>
              <td>Level</td>
              <td>{level}</td>
            </tr>

            <tr>
              <td>검사방법</td>
              <td>{method}</td>
            </tr>

            <tr>
              <td>시험종목</td>
              <td>{subject}</td>
            </tr>


          </tbody>

        </table>


      </div>



      <div className="page-break"></div>




      <h2 className="paper-title">
        KNDT-CBT 시험 문제
      </h2>



      {
         (questions || []).map((q,index)=>{


          const split =
            (q.question || "").split(/\r?\n/);


          const en =
            split[0] || "";


          const ko =
            split.slice(1).join(" ");



          return (


            <div
              className="question-print"
              key={index}
            >


              <h3>
                {index+1}. {en}
              </h3>


              {
                ko &&
                <p>
                  {ko}
                </p>
              }




              {
                 (q.options || q.options_ko || []).map((item,i)=>{


                  const option =
                    typeof item === "string"
                    ? item.replace(/^[A-Da-d]\.\s*/,"")
                    : "";


                  return (

                    <div
                      className="option"
                      key={i}
                    >

                      <span className="number">
                        {i+1}
                      </span>

                      <span className="text">
                        {option}
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


export default PrintQuestion;