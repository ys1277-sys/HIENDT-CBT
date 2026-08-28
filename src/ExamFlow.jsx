import React, { useState } from "react";
import Home from "./Home.jsx";
import Quiz from "./Quiz.jsx";
import Admin from "./Admin.jsx";

/*
 * ?shot= 으로 그 화면부터 그린다.
 *
 *   ?shot=quiz    시험 화면 (MT 일반)
 *   ?shot=admin   관리자 화면
 *
 * 발표자료에 넣을 화면 그림을 헤드리스 브라우저로 찍기 위한 것이다
 * (tools/shots.cjs). 헤드리스는 주소를 열고 바로 찍으므로, 눌러서
 * 들어가야 하는 화면은 주소로 바로 열 수 있어야 한다.
 *
 * App.jsx 의 ?preview= 와 같은 방식이다. 값이 없으면 평소대로 돈다.
 */
function shotMode() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("shot") || "";
}

function ExamFlow(){

const shot = shotMode();

const [name,setName] = useState(shot ? "홍길동" : "");

const [level,setLevel] = useState(shot ? "Level II" : "");

const [method,setMethod] = useState(shot ? "MT" : "");

const [subject,setSubject] = useState(shot ? "General" : "");

const [start,setStart] = useState(shot === "quiz");

const [admin,setAdmin] = useState(shot === "admin");



// 관리자 화면

if(admin){

return (

  <Admin

    onBack={()=>setAdmin(false)}

  />

);

}



// 시험 화면

if(start){

return (

  <Quiz

    name={name}

    level={level}

    method={method}

    subject={subject}

    onBack={()=>setStart(false)}

  />

);

}



return (

<Home


  name={name}

  setName={setName}



  level={level}

  setLevel={setLevel}



  method={method}

  setMethod={setMethod}



  subject={subject}

  setSubject={setSubject}





  onStart={()=>{


    /*
     * 응시자 이름
     *
     * 예전에는 "// 이름 확인" 주석만 있고 실제 검사가 없어서,
     * 이름을 비운 채로 시험을 볼 수 있었다. 그러면 결과가 빈 이름으로
     * 저장되어 관리자가 누구 것인지 알 수 없다.
     */
    if(!name || !name.trim()){

      alert(
        "응시자 이름을 입력하세요."
      );

      return;

    }


    // Level / 종목

    if(!level || !method){

      alert(
        "Level 과 시험종목을 선택하세요."
      );

      return;

    }


    // Level II 만 시험구분(General / Specific)을 고른다

    if(level === "Level II" && !subject){

      alert(
        "시험 구분을 선택하세요."
      );

      return;

    }


    setStart(true);


  }}








  onAdmin={()=>{



    const pw =
    prompt(
      "관리자 비밀번호"
    );





    if(
      pw === import.meta.env.VITE_ADMIN_PASSWORD
    ){

      setAdmin(true);

    }
    else{

      alert(
        "비밀번호가 틀렸습니다."
      );

    }



  }}




/>

);

}



export default ExamFlow;