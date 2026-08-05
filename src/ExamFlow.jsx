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






  if(admin){

    return (

      <Admin

        onBack={()=>setAdmin(false)}

      />

    );

  }







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


        if(!name.trim()){

          alert("이름을 입력하세요");

          return;

        }



        if(!level || !method || !subject){

          alert("시험 정보를 선택하세요");

          return;

        }



        setStart(true);


      }}




      onAdmin={()=>{


        const pw = prompt("관리자 비밀번호");


        if(

          pw === import.meta.env.VITE_ADMIN_PASSWORD

        ){

          setAdmin(true);

        }

        else{

          alert("비밀번호가 틀렸습니다.");

        }


      }}


    />


  );


}



export default ExamFlow;