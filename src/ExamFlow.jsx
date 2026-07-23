import React, { useState } from "react";
import Quiz from "./Quiz.jsx";
import Admin from "./Admin.jsx";

function ExamFlow() {

  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [method, setMethod] = useState("");
  const [subject, setSubject] = useState("");

  const [start, setStart] = useState(false);
  const [admin, setAdmin] = useState(false);

  if (admin) {
    return (
      <Admin
        onBack={() => setAdmin(false)}
      />
    );
  }

  if (start) {
    return (
      <Quiz
        name={name}
        level={level}
        method={method}
        subject={subject}
        onBack={() => setStart(false)}
      />
    );
  }

  return (
    <div className="home-container">

      <div className="home-box">

        <h1>KNDT-CBT</h1>

        <h2>비파괴검사 CBT 시험</h2>

        <input
          type="text"
          placeholder="응시자 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <h3>Level 선택</h3>

        <button
          className={level === "Level II" ? "active" : ""}
          onClick={() => {
            setLevel("Level II");
            setMethod("");
            setSubject("");
          }}
        >
          Level II
        </button>

        <button
          className={level === "Level III" ? "active" : ""}
          onClick={() => {
            setLevel("Level III");
            setMethod("");
            setSubject("");
          }}
        >
          Level III
        </button>

        <h3>검사 방법</h3>

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">선택</option>

          {level === "Level II" && (
            <>
              <option value="ECT">ECT</option>
              <option value="UT">UT</option>
              <option value="MT">MT</option>
              <option value="PT">PT</option>
              <option value="RT">RT</option>
              <option value="VT">VT</option>
              <option value="PAUT">PAUT</option>
              <option value="RFT">RFT</option>
              <option value="TOFD">TOFD</option>
            </>
          )}

          {level === "Level III" && (
            <>
              <option value="Basic">Basic</option>
              <option value="UT">UT</option>
              <option value="RT">RT</option>
              <option value="MT">MT</option>
              <option value="PT">PT</option>
              <option value="VT">VT</option>
            </>
          )}

        </select>

        <h3>시험 구분</h3>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">선택</option>

          {level === "Level II" && (
            <>
              <option value="General">General</option>
              <option value="Specific">Specific</option>
            </>
          )}

          {level === "Level III" && (
            <option value="Specific">Specific</option>
          )}

        </select>

        <button
          onClick={() => {

            if (!name.trim()) {
              alert("이름을 입력하세요");
              return;
            }

            if (!level || !method || !subject) {
              alert("시험 정보를 선택하세요");
              return;
            }

            setStart(true);

          }}
        >
          시험 시작
        </button>

        <button
          onClick={() => {

            const pw = prompt("관리자 비밀번호");

            console.log("입력값:", pw);
            console.log("환경변수:", import.meta.env.VITE_ADMIN_PASSWORD);

            if (pw === import.meta.env.VITE_ADMIN_PASSWORD) {
              setAdmin(true);
            } else {
              alert("비밀번호가 틀렸습니다.");
            }

          }}
        >
          관리자
        </button>

      </div>

    </div>
  );
}

export default ExamFlow;