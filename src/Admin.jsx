import React, { useEffect, useState } from "react";
import PrintAdminExam from "./PrintAdminExam.jsx";


function Admin({ onBack }) {


  console.log("Admin 실행됨");


  const [results, setResults] = useState([]);

  const [exam, setExam] = useState(null);

  const [loading, setLoading] = useState(true);



  const [search, setSearch] = useState("");

  const [filterLevel, setFilterLevel] = useState("");

  const [filterMethod, setFilterMethod] = useState("");

  const [sortScore, setSortScore] = useState(false);





  useEffect(()=>{


    fetch(
      "https://script.google.com/macros/s/AKfycbxs_whBI5KfBxKaDreav9PL3_rHX847OdwwLtc8uwMIN9fVOAozGHdpzXmQRsa7PO6i/exec"
    )

    .then(res=>res.json())

    .then(data=>{


      console.log(
        "관리자 데이터:",
        data
      );


      console.log(
        "마지막 데이터:",
        JSON.stringify(
          data[data.length-1],
          null,
          2
        )
      );


      setResults(
        Array.isArray(data)
        ?
        data
        :
        []
      );


      setLoading(false);


    })

    .catch(err=>{


      console.log(
        "결과 불러오기 실패",
        err
      );


      alert(
        "결과를 불러오지 못했습니다."
      );


      setLoading(false);


    });



  },[]);







  function printExam(r){



    console.log(
      "출력 데이터 확인:",
      r
    );



    console.log(
      "정답번호 확인:",
      r.questions?.map(
        q=>q.answer
      )
    );



    if(
      !r.questions ||
      r.questions.length===0
    ){

      alert(
        "출력할 시험 데이터가 없습니다."
      );


      return;

    }




    setExam(r);




    setTimeout(()=>{


      window.print();


    },500);



  }







  let filteredResults=[
    ...results
  ];




  if(search){


    filteredResults =
    filteredResults.filter(r=>

      String(r.name || "")
      .includes(search)

    );


  }





  if(filterLevel){


    filteredResults =
    filteredResults.filter(r=>

      r.level===filterLevel

    );


  }






  if(filterMethod){


    filteredResults =
    filteredResults.filter(r=>

      r.method===filterMethod

    );


  }





  if(sortScore){


    filteredResults.sort(
      (a,b)=>

      Number(b.score||0)
      -
      Number(a.score||0)

    );


  }








return(


<div className="admin-container">



<h1>
HIENDT-CBT 관리자
</h1>



<button onClick={onBack}>
처음 화면으로
</button>





<h2>
응시 결과
</h2>





<div className="admin-search">



<input

type="text"

placeholder="응시자 검색"

value={search}

onChange={
e=>setSearch(e.target.value)
}

/>





<select

value={filterLevel}

onChange={
e=>setFilterLevel(e.target.value)
}

>

<option value="">
전체 Level
</option>


<option value="Level II">
Level II
</option>


<option value="Level III">
Level III
</option>


</select>







<select

value={filterMethod}

onChange={
e=>setFilterMethod(e.target.value)
}

>


<option value="">
전체 검사
</option>


<option value="ECT">
ECT
</option>


<option value="UT">
UT
</option>


<option value="MT">
MT
</option>


<option value="PT">
PT
</option>


<option value="RT">
RT
</option>


<option value="VT">
VT
</option>


</select>





<button

onClick={()=>
setSortScore(!sortScore)
}

>

{
sortScore
?
"점수순 해제"
:
"점수순 정렬"
}

</button>



</div>







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

filteredResults.map((r,index)=>(


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

{
r.result
||
(
Number(r.score)>=70
?
"PASS"
:
"FAIL"
)
}

</td>


<td>
{r.date}
</td>



<td>


<button

onClick={()=>
printExam(r)
}

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
name={exam.name}
level={exam.level}
method={exam.method}
subject={exam.subject}
date={exam.date}
score={exam.score}
/>


</div>


}





</div>


);


}


export default Admin;