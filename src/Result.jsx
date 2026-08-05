import React, { useEffect, useRef, useState } from "react";
import PrintExam from "./PrintExam.jsx";


function Result({

  name,
  level,
  method,
  subject,
  questions = [],
  answers = {},
  onBack

}) {


  const sent = useRef(false);

  const [print,setPrint] = useState(false);



  let correct = 0;



  questions.forEach((q,index)=>{


    const userAnswer =
      Number(answers[index]);


    const correctAnswer =
      Number(q.answer);



    console.log(
      "채점확인",
      index + 1,
      "선택:",
      userAnswer,
      "정답:",
      correctAnswer
    );



    if(userAnswer === correctAnswer){

      correct++;

    }


  });



  const total = questions.length;



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





  useEffect(()=>{


    if(sent.current) return;


    sent.current = true;



    const fullData = {


      name,

      level,

      method,

      subject,


      total,

      correct,

      score,

      result,


      date:

        new Date()
        .toLocaleString(),



      questions,

      answers



    };





    // ======================
    // local 저장
    // ======================


    localStorage.setItem(

      "lastExam",

      JSON.stringify(fullData)

    );





    const old =

      JSON.parse(

        localStorage.getItem("results")

        ||

        "[]"

      );



    old.push(fullData);



    localStorage.setItem(

      "results",

      JSON.stringify(old)

    );







    // ======================
    // Google Sheet 저장
    // ======================


    fetch(

      "https://script.google.com/macros/s/AKfycbxs_whBI5KfBxKaDreav9PL3_rHX847OdwwLtc8uwMIN9fVOAozGHdpzXmQRsa7PO6i/exec",

      {

        method:"POST",

        body:JSON.stringify(fullData)

      }

    )


    .then(res=>res.text())


    .then(data=>{


      console.log(
        "Google 저장 완료",
        data
      );


    })


    .catch(err=>{


      console.log(
        "Google 저장 실패",
        err
      );


    });





  },[]);







  useEffect(()=>{


    if(!print) return;



    const timer =

      setTimeout(()=>{


        window.print();


      },300);




    return ()=>clearTimeout(timer);



  },[print]);







  return (


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




        <p>
          정답 : {correct} / {total}
        </p>




        <button

          onClick={()=>setPrint(true)}

        >

          문제지 출력

        </button>




        <button

          onClick={onBack}

        >

          처음 화면

        </button>




      </div>






      {


        print &&


        <div className="print-area">


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


          />


        </div>


      }



    </div>


  );


}



export default Result;