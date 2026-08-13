import React, { useState } from "react";
import ProcedureViewer, {
  useManifest,
  availableProcedures,
} from "./ProcedureViewer.jsx";
import { withRange } from "./groupRange.js";

/*
 * 묶음 지시문
 *
 * 시험지에는 여러 문항에 걸치는 안내가 있다.
 *   ※ Answers to questions 1 through 4 for the materials.
 *   * The following questions (1-5) refer to HIE procedure, HIE-NDT-UT-N21 ...
 *
 * 종이 시험지는 묶음 맨 앞에 한 번만 적혀 있지만, CBT 는 한 문항씩 보여주므로
 * 해당 문항마다 함께 나와야 응시자가 조건을 알 수 있다.
 *
 * 본문과 같은 "영문\n한글" 형식을 쓴다.
 *
 * 문항 번호
 *   원본 번호는 데이터에서 떼어 뒀다. 문항을 섞어 뽑으니 원본 번호가
 *   그대로 있으면 거짓말이 된다. range 로 이번 시험지의 실제 번호를 받아
 *   그 자리에 다시 넣는다. 묶음 문항은 붙어서 움직이므로(규칙 10)
 *   늘 이어진 한 덩어리다.
 *
 * 절차서
 *   지시문에 적힌 절차서 이름을 누르면 절차서 창이 뜬다. 절차서를 넣어 두지
 *   않았으면 그냥 글자로만 나온다. 인쇄물에는 창이 없으니 절차서가 부록으로
 *   따라 붙는다(ProcedureAppendix). 그래서 showProcedure 는 화면에서만 켠다.
 */

/* 지시문 속 절차서 이름 */
const CODE = /HIE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g;

function GroupNote({ q, className = "group-note", range = "", showProcedure = false }) {
  const manifest = useManifest();
  const [open, setOpen] = useState(null);

  const raw = q && q.groupNote;
  if (!raw) return null;

  const lines = withRange(String(raw), range)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const procs = showProcedure ? availableProcedures(manifest, q) : [];

  /* 넣어 둔 절차서 이름만 누를 수 있게 만든다 */
  function render(line, key) {
    if (!procs.length) return line;

    const parts = [];
    let at = 0;

    CODE.lastIndex = 0;
    for (let m = CODE.exec(line); m; m = CODE.exec(line)) {
      const proc = procs.find((p) => p.code === m[0]);
      if (!proc) continue;

      if (m.index > at) parts.push(line.slice(at, m.index));

      parts.push(
        <button
          key={key + "-" + m.index}
          type="button"
          className="procedure-link"
          onClick={() => setOpen(proc)}
          title="절차서 보기"
        >
          {m[0]}
        </button>
      );

      at = m.index + m[0].length;
    }

    if (!parts.length) return line;
    if (at < line.length) parts.push(line.slice(at));
    return parts;
  }

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={i === 0 ? "group-note-en" : "group-note-ko"}
        >
          {render(line, i)}
        </div>
      ))}

      {open ? (
        <ProcedureViewer
          proc={open}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

export default GroupNote;
