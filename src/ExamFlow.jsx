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



        // 이름 확인

        if(!level || !method){

 alert("시험 정보를 선택하세요");

 return;

}


if(level==="Level II" && !subject){

 alert("시험 구분을 선택하세요");

 return;

}





        // Level / 종목 확인

        if(!level || !method){

          alert(
            "시험 정보를 선택하세요."
          );

          return;

        }





        // Level II만 시험구분 확인

        if(
          level === "Level II" &&
          !subject
        ){

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