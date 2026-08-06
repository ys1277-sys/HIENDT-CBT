import React from "react";
import "./print.css";


function PrintAdminExam({

questions=[]

}){


return (

<div className="exam-paper">


<h2 className="paper-title">
HIENDT-CBT 관리자 정답지
</h2>



{

questions.map((q,index)=>{


const correct =
Number(q.answer);



return (

<div
className="question-print"
key={index}
>


<h3>

{index+1}. {q.question.split(/\r?\n/)[0]}

</h3>



{

q.options.map((op,i)=>{


let mark="";

let markClass="";


if(i===correct){

mark="○";

markClass="blue-mark";

}



return (

<div
className="option"
key={i}
>


<span className={markClass}>

{mark}

</span>


<span>

{i+1}. {op.split(/\r?\n/)[0]}

</span>


</div>

);


})


}



</div>


);


})


}



</div>


);


}


export default PrintAdminExam;