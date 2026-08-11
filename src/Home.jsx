import React, { useState } from "react";
import PrintExam from "./PrintExam.jsx";

function Home({

name,
setName,

level,
setLevel,

method,
setMethod,

subject,
setSubject,

onStart,
onAdmin

}) {

const [questions,setQuestions] = useState(null);



const methodList =

level === "Level III"

?

[
"Basic",
"MT",
"PT",
"RT",
"UT",
"VT"
]

:

[
"ECT",
"UT",
"MT",
"PT",
"RT",
"VT",
"PAUT",
"RFT",
"TOFD"
];



async function printBank(){

try{


  if(
    !level ||
    !method ||
    (level==="Level II" && !subject)
  ){

    alert(
      "먼저 Level, 시험종목, 시험구분을 선택하세요."
    );

    return;

  }




  let file;




  if(level==="Level II"){

    file =
      `data/${level}/${subject}/${method}.json`;

  }




  if(level==="Level III"){

    file =
      `data/${level}/${method}.json`;

  }





  console.log(
    "문제 파일:",
    file
  );





  const res =
    await fetch(

      import.meta.env.BASE_URL +
      file.replace(/^\//,"")

    );





  if(!res.ok){

    alert(
      "문제 파일이 없습니다.\n\n"+file
    );

    return;

  }





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
    list.filter(
      q=>Array.isArray(q.options)
    );





  if(list.length===0){

    alert(
      "문제 데이터가 없습니다."
    );

    return;

  }





  setQuestions(list);


  /*
   * =====================================================
   * window.print() 는 더 이상 setTimeout으로 호출하지 않는다.
   *
   * PrintExam 내부에서 문제 페이지 분할/렌더링이
   * 실제로 끝난 시점에 onReady 콜백이 호출되고,
   * 그 콜백 안에서 window.print()를 실행한다.
   * =====================================================
   */





}
catch(err){


  console.error(err);


  alert(
    "문제 불러오기 실패\n\n"+
    err.message
  );


}

}



return (

<div className="home-container">


  <div className="home-box">


    <h1>
      HIENDT-CBT
    </h1>


    <h2>
      비파괴검사 자격시험
    </h2>





    <input

      type="text"

      placeholder="응시자 이름"

      value={name}

      onChange={
        e=>setName(e.target.value)
      }

    />





    <h3>
      Level 선택
    </h3>





    <button

      className={
        level==="Level II"
        ?
        "active"
        :
        ""
      }


      onClick={()=>{

        setLevel("Level II");

        setMethod("");

        setSubject("");

      }}

    >

      Level II

    </button>





    <button


      className={
        level==="Level III"
        ?
        "active"
        :
        ""
      }



      onClick={()=>{


        setLevel("Level III");

        setMethod("");

        setSubject("");


      }}


    >

      Level III

    </button>





    <h3>
      시험종목
    </h3>




    <select

      key={level}

      value={method}

      onChange={
        e=>setMethod(e.target.value)
      }

    >


      <option value="">
        선택
      </option>



      {

        methodList.map(item=>(

          <option

            key={item}

            value={item}

          >

            {item}

          </option>


        ))

      }


    </select>





    {

      level==="Level II" &&

      <>

        <h3>
          시험 구분
        </h3>


        <select

          value={subject}

          onChange={
            e=>setSubject(e.target.value)
          }

        >


          <option value="">
            선택
          </option>


          <option value="General">
            General
          </option>


          <option value="Specific">
            Specific
          </option>


        </select>


      </>

    }





    <button

      onClick={onStart}

    >

      시험 시작

    </button>





    <button

      onClick={printBank}

    >

      문제은행 출력

    </button>





    <button

      onClick={onAdmin}

    >

      관리자

    </button>





  </div>





  {

    questions &&


    <PrintExam


      name="HIENDT-CBT 문제은행"


      level={level}


      method={method}


      subject={subject}


      questions={questions}


      date={

        new Date()

        .toLocaleDateString()

      }


      onReady={

        () => window.print()

      }


    />


  }





</div>

);

}

export default Home;
