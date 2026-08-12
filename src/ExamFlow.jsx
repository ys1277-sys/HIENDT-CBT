import React, { useState } from "react";
import Home from "./Home.jsx";
import Quiz from "./Quiz.jsx";
import Admin from "./Admin.jsx";

function ExamFlow(){

const [name,setName] = useState("");

const [level,setLevel] = useState("");

const [method,setMethod] = useState("");

const [subject,setSubject] = useState("");

const [start,setStart] = useState(false);

const [admin,setAdmin] = useState(false);



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