/*
 * 절차서 보기 창.
 *
 * 문항이 "HIE-NDT-MT-N21 (Rev.2) 절차서를 보고 풀라" 고 하는데
 * 응시자가 그 절차서를 볼 데가 없었다. 문항 옆 단추로 띄운다.
 *
 * 시험장 인쇄물을 대신하는 창이라 문항 화면을 가리지 않아야 한다.
 * 오른쪽에 붙여 두고, 옆으로 밀어 두거나 닫을 수 있게 한다.
 *
 * public/data/procedures/ 에 절차서를 안 넣어 뒀으면 단추가 안 나온다.
 */
import React, { useEffect, useState } from "react";
import { loadProcedures, pickProcedures, pageSrc } from "./procedures.js";

/* 절차서 목록은 한 번만 읽고 돌려 쓴다 */
let cache = null;

function useManifest() {
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

/*
 * 문항 하나가 가리키는 절차서 단추.
 * 여러 절차서를 가리키면 단추도 여러 개 나온다.
 */
export function ProcedureButtons({ q }) {
  const manifest = useManifest();
  const [open, setOpen] = useState(null);

  const procs = manifest ? pickProcedures(manifest, [q]) : [];
  if (!procs.length) return null;

  return (
    <>
      <div className="procedure-buttons">
        {procs.map((p) => (
          <button
            key={p.key}
            type="button"
            className="procedure-open"
            onClick={() => setOpen(p)}
          >
            절차서 보기 · {p.code}
            {p.rev ? " " + p.rev : ""}
          </button>
        ))}
      </div>

      {open ? (
        <ProcedureViewer
          proc={open}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

function ProcedureViewer({ proc, onClose }) {
  const [page, setPage] = useState(0);
  const last = proc.pages.length - 1;

  /* 시험 중에도 손이 자판에 있다. Esc 로 닫고 화살표로 넘긴다 */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, last));
      else if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
      else return;
      e.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, last]);

  return (
    <div className="procedure-viewer">
      <div className="procedure-viewer-bar">
        <span className="procedure-viewer-name">
          {proc.title}
          {proc.rev ? " " + proc.rev : ""}
        </span>

        {proc.pages.length > 1 ? (
          <span className="procedure-viewer-pager">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
            >
              ◀
            </button>

            <span className="procedure-viewer-count">
              {page + 1} / {proc.pages.length}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, last))}
              disabled={page === last}
            >
              ▶
            </button>
          </span>
        ) : null}

        <button
          type="button"
          className="procedure-viewer-close"
          onClick={onClose}
          aria-label="절차서 닫기"
        >
          ✕
        </button>
      </div>

      <div className="procedure-viewer-body">
        <img
          src={pageSrc(proc.pages[page])}
          alt={proc.code + " " + (page + 1) + "쪽"}
        />
      </div>
    </div>
  );
}

export default ProcedureViewer;
