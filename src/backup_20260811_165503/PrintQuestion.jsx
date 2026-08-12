```javascriptreact
import React from "react";
import "./print.css";

function PrintQuestion({

  name,
  level,
  method,
  subject,
  questions = []

}) {



  return (

    <div className="page">


      <h1>
        HIENDT-CBT 시험 문제지
      </h1>





      <div className="print-info">


        <p>
          성명 : {name}
        </p>


        <p>
          Level : {level}
        </p>


        <p>
          검사 : {method} {subject}
        </p>


      </div>





      <hr />






      {

      questions.map((q,index)=>{



        const qText =
typeof q.question === "string"
? q.question.split("\n").filter(line => line.trim() !== "")
: [];




        return (



        <div

          className="question"

          key={q.id || index}

        >




          <h3>


            {index + 1}. {qText[0]}


          </h3>






          <p className="korean">


            {qText[1] || ""}


          </p>







          <div className="options">



          {


          Array.isArray(q.options) &&


          q.options.map((op,i)=>{



            const optionText =
typeof op === "string"
? op.split("\n").filter(line => line.trim() !== "")
: op;




            return (



            <div

              className="option"

              key={i}

            >




              <strong>

                {i+1}.

              </strong>

              {" "}



              {

              optionText[0]

              }



              <br/>





              <span>


                {

                optionText[1]

                || ""

                }


              </span>




            </div>



            );



          })


          }




          </div>






        </div>



        );



      })


      }





    </div>


  );


}



export default PrintQuestion;
```