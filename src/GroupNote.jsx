import React from "react";
import { ProcedureButtons } from "./ProcedureViewer.jsx";

/*
 * 묶음 지시문
 *
 * 시험지에는 여러 문항에 걸치는 안내가 있다.
 *   ※ Answers to questions 1 through 4 for the materials.
 *   * The following questions (9-20) refer to HIE procedure HIE-NDT-ET-P11 ...
 *
 * 종이 시험지는 묶음 맨 앞에 한 번만 적혀 있지만, CBT 는 한 문항씩 보여주므로
 * 해당 문항마다 함께 나와야 응시자가 조건을 알 수 있다.
 *
 * 본문과 같은 "영문\n한글" 형식을 쓴다.
 *
 * 지시문이 가리키는 절차서를 넣어 뒀으면 여는 단추도 같이 나온다.
 * 인쇄물에는 단추 대신 절차서가 부록으로 붙으므로(ProcedureAppendix)
 * showProcedure 를 꺼서 뺀다.
 */
function GroupNote({ q, className = "group-note", showProcedure = false }) {
  const raw = q && q.groupNote;

  if (!raw) return null;

  const lines = String(raw)
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className={className}>
      {
        lines.map((line, i) => (
          <div
            key={i}
            className={i === 0 ? "group-note-en" : "group-note-ko"}
          >
            {line}
          </div>
        ))
      }

      {showProcedure ? <ProcedureButtons q={q} /> : null}
    </div>
  );
}

export default GroupNote;
