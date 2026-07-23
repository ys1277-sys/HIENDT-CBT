import React from "react";
import "./print.css";


function PrintExam({

  name,
  level,
  method,
  subject,
  questions,
  answers,
  score,
  correct,
  total,
  result,
  date

}) {


return (

<div className="exam-paper">


{/* =====================
    시험 결과표
===================== */}


<div className="cover">


<h1>
KNDT-CBT 시험 결과표
</h1>



<table className="result-table">

<tbody>

<tr>
<td>응시자</td>
<td>{name}</td>
</tr>


<tr>
<td>시험일</td>
<td>{date || new Date().toLocaleDateString()}</td>
</tr>


<tr>
<td>Level</td>
<td>{level}</td>
</tr>


<tr>
<td>검사방법</td>
<td>{method}</td>
</tr>


<tr>
<td>시험종목</td>
<td>{subject}</td>
</tr>


<tr>
<td>총 문항</td>
<td>{total}</td>
</tr>


<tr>
<td>정답</td>
<td>{correct}</td>
</tr>


<tr>
<td>점수</td>
<td>{score} 점</td>
</tr>


<tr>
<td>결과</td>
<td>{result}</td>
</tr>


</tbody>

</table>


</div>





<div className="page-break"></div>






{/* =====================
    문제지
===================== */}



<h2 className="paper-title">
KNDT-CBT 시험지
</h2>




{

questions.map((q,index)=>{


const selected =
answers?.[index];



return(


<div

className="question-print"

key={index}

>


<h3>

{index+1}. {q.question_ko}

</h3>




{

q.options_ko.map((item,i)=>{


const answer =
i === q.answer;



const wrong =
i === selected &&
selected !== q.answer;




return(


<div

className="option"

key={i}

>



<span

className={

answer

?

"number answer"

:

wrong

?

"number wrong"

:

"number"

}

>

{i+1}

</span>



<span className="text">

{item}

</span>



</div>


)



})

}



</div>


)


})


}



</div>


);


}


export default PrintExam;