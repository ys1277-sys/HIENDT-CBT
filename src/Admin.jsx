```jsx
import React, { useEffect, useState } from "react";
import PrintExam from "./PrintExam.jsx";
import PrintQuestion from "./PrintQuestion.jsx";


function Admin({onBack}){


  const [results,setResults] = useState([]);

  const [exam,setExam] = useState(null);

  const [questionPrint,setQuestionPrint] = useState(false);




  useEffect(()=>{


    const data = JSON.parse(

      localStorage.getItem("results") || "[]"

    );


    setResults(data);


  },[]);






  function loadPrint(){


    const data = localStorage.getItem("lastExam");



    if(!data){

      alert("출력할 시험 데이터가 없습니다.");

      return;

    }


    setQuestionPrint(false);

    setExam(JSON.parse(data));


  }






  function loadQuestionPrint(){


    const data = localStorage.getItem("lastExam");



    if(!data){

      alert("출력할 시험 데이터가 없습니다.");

      return;

    }


    setQuestionPrint(true);

    setExam(JSON.parse(data));


  }







  return(


    <div className="home-container">


      <div className="home-box">


        <h1>
          KNDT-CBT 관리자
        </h1>





        <button onClick={loadPrint}>

          답안지 출력

        </button>





        <button onClick={loadQuestionPrint}>

          문제지 출력

        </button>





        <button onClick={onBack}>

          돌아가기

        </button>





        <h2>
          응시 결과
        </h2>






        {
          results.length===0

          ?

          <p>
            저장된 결과가 없습니다.
          </p>


          :


          <table className="result-table">


            <thead>

              <tr>

                <th>이름</th>

                <th>Level</th>

                <th>시험</th>

                <th>점수</th>

                <th>결과</th>

              </tr>

            </thead>




            <tbody>


            {

              results.map((r,i)=>(


                <tr key={i}>


                  <td>
                    {r.name}
                  </td>


                  <td>
                    {r.level}
                  </td>


                  <td>
                    {r.method} {r.subject}
                  </td>


                  <td>
                    {r.score}
                  </td>


                  <td>
                    {r.result}
                  </td>


                </tr>


              ))

            }


            </tbody>


          </table>


        }








        {
          exam && !questionPrint &&


          <div>


            <PrintExam


              name={exam.name}

              level={exam.level}

              method={exam.method}

              subject={exam.subject}

              questions={exam.questions}

              answers={exam.answers}

              date={exam.date}


            />


          </div>

        }








        {
          questionPrint && exam &&


          <div>


            <PrintQuestion


              name={exam.name}

              level={exam.level}

              method={exam.method}

              subject={exam.subject}

              questions={exam.questions}


            />


          </div>

        }





      </div>


    </div>


  );


}


export default Admin;
```
