import React, { useEffect, useRef } from "react";


function Result({

  name,
  level,
  method,
  subject,
  questions,
  answers,
  onBack

}) {


  const sent = useRef(false);



  let correct = 0;


  questions.forEach((q,index)=>{

    if(answers[index] === q.answer){

      correct++;

    }

  });



  const total = questions.length;


  const score = total === 0

    ? 0

    : Math.round((correct / total) * 100);



  const result = score >= 70 ? "합격" : "불합격";






  useEffect(()=>{


    if(sent.current) return;


    sent.current = true;



    const data = {

      name,

      level,

      method,

      subject,

      total,

      correct,

      score,

      result,

      date: new Date().toLocaleString()

    };




    fetch(

      "https://script.google.com/macros/s/AKfycbxs_whBI5KfBxKaDreav9PL3_rHX847OdwwLtc8uwMIN9fVOAozGHdpzXmQRsa7PO6i/exec",

      {

        method: "POST",

        mode: "no-cors",

        body: JSON.stringify(data)

      }

    )

    .catch(err =>

      console.log("결과 전송 실패:", err)

    );







    const old = JSON.parse(

      localStorage.getItem("results") || "[]"

    );



    old.push(data);



    localStorage.setItem(

      "results",

      JSON.stringify(old)

    );





  },[]);









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




        <button onClick={onBack}>

          처음 화면

        </button>




      </div>


    </div>


  );


}


export default Result;