import React from "react";
import "./print.css";


function PrintResultExam({

questions=[],
answers={}

}){


const numberCircle=[
"①",
"②",
"③",
"④"
];


return(

<div className="exam-paper">


<h2 className="paper-title">

HIENDT-CBT 채점 결과

</h2>



{

questions.map((q,index)=>{


const correct =
Number(q.answer);


const selected =
Number(answers[index]);



return(


<div

className="question-print"

key={index}

>


<h3>
  {index+1}. {q.question.split("\n")[0]}
</h3>

{
  q.question.split("\n")[1] &&
  <p className="korean-print">
    {q.question.split("\n")[1]}
  </p>
}



{

q.options.map((op,i)=>{


let cls="answer-circle";


if(i===correct){

cls += " correct-circle";

}


if(
i===selected &&
selected!==correct
){

cls += " wrong-circle";

}



return(

<div

className="option"

key={i}

>


<span className={cls}>

{numberCircle[i]}

</span>


<div className="option-text">

  <div>{op.split("\n")[0]}</div>

  {
    op.split("\n")[1] &&
    <div className="print-option-ko">
      {op.split("\n")[1]}
    </div>
  }

</div>


</div>


)


})


}



</div>


)


})


}



</div>


)


}


export default PrintResultExam;