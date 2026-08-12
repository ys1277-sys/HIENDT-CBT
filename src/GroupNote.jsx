import React from "react";

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
 */
function GroupNote({ q, className = "group-note" }) {
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
    </div>
  );
}

export default GroupNote;
