import React, { useState } from "react";


function Home({ onStart }) {


  const [name,setName] = useState("");



  function start(){


    if(!name.trim()){

      alert("이름을 입력하세요");

      return;

    }


    if(onStart){

      onStart(name);

    }


  }




  return (

    <div className="home-container">


      <div className="home-box">


        <h1>
          KNDT-CBT
        </h1>


        <h2>
          비파괴검사 CBT 시험
        </h2>



        <input

          type="text"

          placeholder="응시자 이름"

          value={name}

          onChange={
            e=>setName(e.target.value)
          }

        />



        <button onClick={start}>

          시작

        </button>



      </div>


    </div>

  );

}


export default Home;