import React, { useEffect, useState } from "react";
import PrintAdminExam from "./PrintAdminExam.jsx";


function Admin({ onBack }) {


  const [results, setResults] = useState([]);

  const [exam, setExam] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {


    fetch(
      "https://script.google.com/macros/s/AKfycbxs_whBI5KfBxKaDreav9PL3_rHX847OdwwLtc8uwMIN9fVOAozGHdpzXmQRsa7PO6i/exec"
    )

      .then(res => res.json())

      .then(data => {

        setResults(data);

        setLoading(false);

      })

      .catch(err => {

        console.log(
          "결과 불러오기 실패",
          err
        );

        alert(
          "결과를 불러오지 못했습니다."
        );

        setLoading(false);

      });


  }, []);




  function printExam(r) {


    if (
      !r.questions ||
      r.questions.length === 0
    ) {

      alert(
        "출력할 시험 데이터가 없습니다."
      );

      return;

    }



    setExam(r);



    setTimeout(() => {

      window.print();

    }, 500);


  }





  return (


    <div className="admin-container">


      <h1>
        KNDT-CBT 관리자
      </h1>



      <button onClick={onBack}>

        처음 화면으로

      </button>





      <h2>
        응시 결과
      </h2>





      {
        loading &&

        <p>
          불러오는 중...
        </p>

      }






      <table className="result-table">


        <thead>

          <tr>

            <th>성명</th>

            <th>Level</th>

            <th>검사</th>

            <th>점수</th>

            <th>결과</th>

            <th>날짜</th>

            <th>출력</th>


          </tr>

        </thead>





        <tbody>


          {

            results.map((r, index) => (


              <tr key={index}>


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



                <td>
                  {r.date}
                </td>





                <td>


                  <button

                    onClick={() => printExam(r)}

                  >

                    정답지 출력

                  </button>


                </td>




              </tr>


            ))


          }



        </tbody>



      </table>







      {

        exam &&


        <div className="print-area">


          <PrintAdminExam


            questions={exam.questions}


            answers={exam.answers}


          />


        </div>


      }





    </div>


  );


}



export default Admin;