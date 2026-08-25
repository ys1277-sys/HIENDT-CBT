/*
 * 절차서 부록.
 *
 * 문항 지시문은 "HIE-NDT-MT-N21 (Rev.2) 절차서를 보고 풀라" 고만 하는데,
 * 그 절차서는 시험장에서 따로 나눠 주는 인쇄물이라 앱에 없다.
 * public/data/procedures/ 에 넣어 두면 문제지 뒤에 부록으로 붙는다.
 *
 * 절차서를 안 넣은 상태가 정상이다. 그때는 부록 없이 인쇄된다.
 */
import React, { useEffect, useState } from "react";
import { loadProcedures, pickProcedures, pageSrc } from "./procedures.js";

/*
 * 문제은행·관리자 출력에 절차서를 부록으로 붙일지.
 *
 * 지금은 보류다. 절차서 파일을 갖춘 뒤 true 로 바꾸면 그때부터 붙는다.
 * 화면의 절차서 창은 이 값과 상관없이 그대로 동작한다.
 */
export const PRINT_APPENDIX = false;

/*
 * 뽑힌 문항이 가리키는 절차서를 읽어 온다.
 *
 * 돌려주는 값
 *   procs  붙일 절차서 목록
 *   ready  인쇄해도 되는지. 목록을 읽고 쪽 그림까지 다 뜬 뒤에 true 가 된다.
 *
 * ready 를 안 기다리면 그림이 뜨기 전에 인쇄창이 떠서 부록이 빈 종이로 나간다.
 */
export function useProcedures(questions) {
  const [procs, setProcs] = useState(null);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    /* 보류 중이면 읽지도 않는다. 인쇄가 절차서를 기다리지 않게 한다 */
    if (!PRINT_APPENDIX) {
      setProcs([]);
      setLoaded(0);
      return;
    }

    let alive = true;

    setProcs(null);
    setLoaded(0);

    loadProcedures().then((manifest) => {
      if (!alive) return;
      setProcs(pickProcedures(manifest, questions));
    });

    return () => {
      alive = false;
    };
  }, [questions]);

  const total =
    procs === null
      ? 0
      : procs.reduce((n, p) => n + p.pages.length, 0);

  return {
    procs: procs || [],
    ready: procs !== null && loaded >= total,
    onPageSettled: () => setLoaded((n) => n + 1),
  };
}

/*
 * 부록 쪽들.
 *
 * 한 쪽에 한 장씩. 절차서 원본 판형이 제각각이라 종이에 맞춰 늘리지 않고
 * 비율을 지킨 채 가운데 놓는다.
 */
function ProcedureAppendix({ procs, onPageSettled, startPage = 1, header }) {
  if (!procs.length) return null;

  let page = startPage;

  return (
    <>
      {procs.map((proc) =>
        proc.pages.map((file, i) => {
          const pageNumber = page++;

          return (
            <div
              className="print-paper procedure-paper"
              key={proc.key + "-" + i}
            >
              {header ? header({ page: pageNumber }) : null}

              <div className="procedure-title">
                <span className="procedure-label">부록 / Appendix</span>

                <span className="procedure-name">
                  {proc.title}
                  {proc.rev ? " " + proc.rev : ""}
                </span>

                {/*
                  실제로 붙는 문서의 번호를 찍는다. 문항이 부른 이름(code)을
                  찍으면 P11 문서에 N21 이라고 적히는 꼴이 된다.
                */}
                <span className="procedure-code">
                  {proc.docCode || proc.code}
                  {proc.pages.length > 1
                    ? ` (${i + 1}/${proc.pages.length})`
                    : ""}
                </span>
              </div>

              {/*
                부른 절차서가 없어 같은 종목의 다른 절차서를 붙인 경우.
                ASME Sec.Ⅲ 용(N21)과 Sec.Ⅷ 용(P11)은 값이 다를 수 있다.
              */}
              {proc.code && proc.docCode && proc.code !== proc.docCode ? (
                <div className="procedure-swap">
                  ※ 문항이 가리킨 {proc.code} 는 등록되어 있지 않아 같은 종목의{" "}
                  {proc.docCode} 를 붙였습니다. 값이 다를 수 있습니다.
                </div>
              ) : null}

              <div className="procedure-sheet">
                <img
                  src={pageSrc(file)}
                  alt={proc.code + " " + (i + 1) + "쪽"}
                  /* 그림이 못 떠도 인쇄는 진행돼야 한다 */
                  onLoad={onPageSettled}
                  onError={onPageSettled}
                />
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

export default ProcedureAppendix;
