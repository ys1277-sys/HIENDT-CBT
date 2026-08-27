/*
 * 절차서 머리글 — 열 편이 같은 꼴로 뜬다.
 *
 * 원본 hwp 는 표지를 「4줄 6칸 표」에 담고 있는데 칸 나눔이 절차서마다
 * 조금씩 다르다. ECT 절차서는 그 앞에 표제지가 한 장 더 있고, UT 는
 * 목차가 표지보다 앞에 나오고, E01 은 로고 칸이 비어 있다. 그대로
 * 옮기면 열 편이 열 가지 꼴로 뜬다.
 *
 * 그래서 표지 표는 빌드 때 걷어내고(tools/build-procedures.mjs 의
 * stripCover) 거기 적힌 값만 index.json 으로 넘겨받아 여기서 다시 그린다.
 * 어느 절차서를 열어도 자리가 같다.
 *
 * 문서번호와 개정번호는 나중에 바뀐다. 값이 비어도 자리가 무너지지
 * 않게 있는 것만 찍는다.
 */
import React from "react";
import logo from "./logo.svg";

/* 「2024. 01. 02」 「2024.01.02」 「2012. 8. 16」 을 한 꼴로 */
function tidyDate(s) {
  const m = String(s || "").match(/(\d{4})\s*[.\-]\s*(\d{1,2})\s*[.\-]\s*(\d{1,2})/);
  if (!m) return String(s || "");

  const two = (n) => String(n).padStart(2, "0");
  return `${m[1]}. ${two(m[2])}. ${two(m[3])}.`;
}

/*
 * 「기술부 TECH Dep't」 에서 우리말만 남긴다. 영문 부서명까지 찍으면
 * 한 줄이 넘쳐 다음 줄로 밀린다.
 */
function tidyDept(s) {
  const t = String(s || "").trim();
  const ko = t.match(/[가-힣]+/);
  return ko ? ko[0] : t;
}

function ProcedureHead({ proc }) {
  if (!proc) return null;

  const meta = [
    proc.docCode || proc.code,
    proc.rev,
    tidyDate(proc.date),
    tidyDept(proc.dept),
    proc.sheets ? `${proc.sheets}쪽` : "",
  ].filter(Boolean);

  return (
    <header className="prochead">

      <div className="prochead-brand">
        <img className="prochead-logo" src={logo} alt="" />
        <span className="prochead-company">
          HANKUK INDUSTRIAL ENGINEERING CO., LTD.
        </span>
      </div>

      <h2 className="prochead-title">{proc.title}</h2>
      {proc.titleKo ? (
        <p className="prochead-title-ko">{proc.titleKo}</p>
      ) : null}

      <dl className="prochead-meta">
        {meta.map((v, i) => (
          <dd key={i}>{v}</dd>
        ))}
      </dl>

      {/*
        문항이 부른 이름과 실제로 열린 문서가 다를 때 둘을 나란히 밝힌다.
        ASME Sec.Ⅲ 용(N21)과 Sec.Ⅷ 용(P11)은 값이 다를 수 있어, 어느
        문서를 보고 있는지 응시자가 알아야 한다.
      */}
      {proc.code && proc.docCode && proc.code !== proc.docCode ? (
        <p className="prochead-swap">
          문항 지시문 <b>{proc.code}</b> · 지금 열린 절차서{" "}
          <b>{proc.docCode}</b>
        </p>
      ) : null}

    </header>
  );
}

export default ProcedureHead;
