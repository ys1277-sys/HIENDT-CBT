import React, { useState } from "react";
import PrintExam from "./PrintExam.jsx";
import ExamData from "./ExamData.jsx";

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




  /*
   * 파일 경로는 ExamData 한 곳에만 둔다.
   * 예전에는 여기서 경로를 직접 조립해서, ExamData 를 고쳐도
   * 문제은행 출력만 옛 경로를 가리키는 일이 생길 수 있었다.
   */
  const exam =
    level === "Level II"
      ? ExamData?.[level]?.[subject]?.[method]
      : ExamData?.[level]?.[method];


  if(!exam){

    alert(
      `시험 데이터를 찾을 수 없습니다.\n\n${level} / ${method} ${subject || ""}`
    );

    return;

  }


  const file = exam.file;


  console.log(
    "문제 파일:",
    file
  );





  /* 문항 JSON 은 파일명이 고정이라 빌드 값을 붙여야 캐시가 안 남는다 */
  const res =
    await fetch(

      import.meta.env.BASE_URL +
      file.replace(/^\//,"") +
      "?v=" + __BUILD_ID__

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

  <>


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


    </div>


    {/*
      문제은행 출력은 응시자에게 나눠 줄 백지 문제지다.
      showAnswers 를 끄지 않으면 정답이 파랑으로 칠해져 나간다.
      (Result 의 문제지 출력은 채점 결과지라 켠 채로 둔다)
    */}
    {

      questions &&


      <PrintExam


        showAnswers={false}


        name={name}


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


  </>

);

}

export default Home;
