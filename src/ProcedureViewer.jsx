/*
 * 절차서 보기 창.
 *
 * 문항이 "HIE-NDT-UT-N21 (Rev.2) 절차서를 보고 풀라" 고 하는데
 * 응시자가 그 절차서를 볼 데가 없었다. 지시문에 적힌 절차서 이름을
 * 누르면 뜬다.
 *
 * 계산기와 같은 꼴로 만든다. 머리를 끌어 옮길 수 있고, 문항 위에
 * 떠 있되 가리면 옆으로 치울 수 있다.
 *
 * 종이 시험지에는 이 창이 없으니 절차서가 부록으로 따라 붙는다.
 * (ProcedureAppendix)
 *
 * public/data/procedures/ 에 절차서를 안 넣어 뒀으면 이름이 그냥
 * 글자로만 나오고 눌리지 않는다.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadProcedures, pickProcedures, pageSrc, loadDoc } from "./procedures.js";

/* 절차서 목록은 한 번만 읽고 돌려 쓴다 */
let cache = null;

export function useManifest() {
  const [manifest, setManifest] = useState(cache);

  useEffect(() => {
    if (cache) return;

    let alive = true;
    loadProcedures().then((m) => {
      cache = m || { procedures: {} };
      if (alive) setManifest(cache);
    });

    return () => {
      alive = false;
    };
  }, []);

  return manifest;
}

/* 이 문항이 가리키는 절차서 가운데 실제로 넣어 둔 것 */
export function availableProcedures(manifest, q) {
  return manifest ? pickProcedures(manifest, [q]) : [];
}

/*
 * 본문 문서.
 *
 * hwp 에서 뽑은 글이라 원본 쪽 모양은 아니다. 대신 찾기 칸으로
 * 바로 짚을 수 있어 시험 중에는 이 편이 낫다.
 */
function ProcedureDoc({ file }) {
  const [doc, setDoc] = useState(null);
  const [find, setFind] = useState("");

  useEffect(() => {
    let alive = true;
    setDoc(null);
    loadDoc(file).then((d) => {
      if (alive) setDoc(d || { blocks: [], figures: [] });
    });
    return () => {
      alive = false;
    };
  }, [file]);

  const blocks = useMemo(() => {
    const all = (doc && doc.blocks) || [];
    const key = find.trim().toLowerCase();
    if (!key) return all;
    return all.filter((b) => String(b.s).toLowerCase().includes(key));
  }, [doc, find]);

  if (!doc) return <div className="procw-loading">절차서를 읽는 중…</div>;

  const figures = doc.figures || [];

  return (
    <>
      <div className="procw-find">
        <input
          type="search"
          value={find}
          placeholder="절차서 안에서 찾기"
          onChange={(e) => setFind(e.target.value)}
        />

        {find.trim() ? (
          <span className="procw-found">{blocks.length}군데</span>
        ) : null}
      </div>

      <div className="procw-doc">
        {blocks.map((b, i) =>
          b.t === "h" ? (
            <h4
              key={i}
              className={b.level === 3 ? "procw-h3" : "procw-h2"}
            >
              {b.s}
            </h4>
          ) : (
            <p key={i}>{b.s}</p>
          )
        )}

        {!blocks.length ? (
          <p className="procw-empty">찾는 말이 없습니다.</p>
        ) : null}

        {/*
          그림은 본문 어느 자리에 붙는지 원본에서 알아낼 수 없어
          (표도 같은 마커를 쓴다) 끝에 차례대로 모아 둔다.
        */}
        {!find.trim() && figures.length ? (
          <div className="procw-figures">
            <h4 className="procw-h2">그림 / Figures</h4>

            {figures.map((f, i) => (
              <figure key={f}>
                <img src={pageSrc(f)} alt={`그림 ${i + 1}`} loading="lazy" />
                <figcaption>그림 {i + 1}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function ProcedureViewer({ proc, onClose }) {
  const [page, setPage] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const drag = useRef({ on: false, x: 0, y: 0 });
  const last = proc.pages.length - 1;

  /* 시험 중에도 손이 자판에 있다. Esc 로 닫고 화살표로 넘긴다 */
  useEffect(() => {
    function onKey(e) {
      /* 찾기 칸에 글자를 치는 중이면 가로채면 안 된다 */
      const typing =
        e.target &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

      if (e.key === "Escape") onClose();
      else if (typing) return;
      else if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, last));
      else if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
      else return;
      e.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, last]);

  /* 머리를 끌어 옮긴다 — 계산기와 같다 */
  const onMove = (e) => {
    if (!drag.current.on) return;
    setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };

  const stop = () => {
    drag.current.on = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", stop);
  };

  const start = (e) => {
    drag.current = { on: true, x: e.clientX - pos.x, y: e.clientY - pos.y };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
  };

  return (
    <div
      className="procw-box"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="procw-header"
        onMouseDown={start}
      >
        <span className="procw-name">
          📄 {proc.title}
          {proc.rev ? " " + proc.rev : ""}
        </span>

        <span className="procw-header-right">
          {!proc.doc && proc.pages.length > 1 ? (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                aria-label="이전 쪽"
              >
                ◀
              </button>

              <span className="procw-count">
                {page + 1} / {proc.pages.length}
              </span>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setPage((p) => Math.min(p + 1, last))}
                disabled={page === last}
                aria-label="다음 쪽"
              >
                ▶
              </button>
            </>
          ) : null}

          <button
            type="button"
            className="procw-close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="절차서 닫기"
          >
            ✕
          </button>
        </span>
      </div>

      <div className={proc.doc ? "procw-body is-doc" : "procw-body"}>
        {proc.doc ? (
          <ProcedureDoc file={proc.doc} />
        ) : (
          <img
            src={pageSrc(proc.pages[page])}
            alt={proc.code + " " + (page + 1) + "쪽"}
          />
        )}
      </div>
    </div>
  );
}

export default ProcedureViewer;
