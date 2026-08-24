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
 * 절차서 도해.
 *
 * 원본에 2573x1819 짜리 스캔본이 들어 있다. 그대로 두면 한 장이 창을
 * 다 덮어 앞뒤 글이 안 보인다. 높이를 묶어 두고 누르면 키운다.
 */
function Figure({ src, logo = false, stamp = false }) {
  const [zoom, setZoom] = useState(false);

  /*
   * 표지 표의 회사 로고는 아주 작게, 개정이력 표의 서명 도장은
   * 절반으로 둔다. 둘 다 도해가 아니라 서식 장식이라 제 크기로 두면
   * 칸을 혼자 다 차지한다.
   */
  const kind = logo ? " is-logo" : stamp ? " is-stamp" : "";
  const cls = "procw-fig" + kind + (zoom ? " zoomed" : "");

  return (
    <img
      className={cls}
      src={pageSrc(src)}
      alt=""
      loading="lazy"
      title={zoom ? "눌러서 줄이기" : "눌러서 키우기"}
      onClick={() => setZoom((v) => !v)}
    />
  );
}

/*
 * 덩이 하나를 그린다.
 *
 * 원본 hwp 의 표·그림 차례를 그대로 옮긴 것이라 표 안에 또 덩이가 들어 있다.
 * 스스로를 다시 부른다.
 */
function Block({ b }) {
  if (b.t === "h") {
    return <h4 className={b.level === 3 ? "procw-h3" : "procw-h2"}>{b.s}</h4>;
  }

  if (b.t === "img") return <Figure src={b.src} logo={b.logo} stamp={b.stamp} />;

  if (b.t === "table") {
    return (
      <div className="procw-tablewrap">
        <table className="procw-table">
          <tbody>
            {b.grid.map((row, r) => (
              <tr key={r}>
                {row.map((c, q) =>
                  !c || c === "covered" ? (
                    c === "covered" ? null : <td key={q} />
                  ) : (
                    <td
                      key={q}
                      colSpan={c.colSpan > 1 ? c.colSpan : undefined}
                      rowSpan={c.rowSpan > 1 ? c.rowSpan : undefined}
                    >
                      {c.blocks.map((inner, i) => (
                        <Block key={i} b={inner} />
                      ))}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p>{b.s}</p>;
}

/*
 * 본문 문서.
 *
 * 원본 hwp 를 표·그림까지 그대로 옮긴 것이다. 원본 본문은 1줄 2칸 표에
 * 왼쪽 영문, 오른쪽 한글로 담겨 있어 그대로 두면 영문을 다 읽은 뒤에야
 * 한글이 나온다. 빌드 때 항목 번호로 갈라 1.0 영문 다음 1.0 한글 순으로
 * 엮어 뒀다.
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

  /*
   * 찾기는 표 안까지 본다. 합격기준이 표에 들어 있어 표를 빼면
   * 정작 찾고 싶은 값이 안 걸린다.
   */
  const blocks = useMemo(() => {
    const all = (doc && doc.blocks) || [];
    const key = find.trim().toLowerCase();
    if (!key) return all;

    const hasText = (b) => {
      if (b.t === "table") {
        return b.grid.some((row) =>
          row.some((c) => c && c !== "covered" && c.blocks.some(hasText))
        );
      }
      return String(b.s || "").toLowerCase().includes(key);
    };

    return all.filter(hasText);
  }, [doc, find]);

  if (!doc) return <div className="procw-loading">절차서를 읽는 중…</div>;

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
        {blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}

        {!blocks.length ? (
          <p className="procw-empty">찾는 말이 없습니다.</p>
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
        {/*
          문항이 부른 이름과 실제로 열린 문서가 다를 수 있다.
          MT-N21 을 부른 문항에 MT 절차서를 열어 주는 식이다.
          어느 문서를 보고 있는지 문서번호로 밝힌다.
        */}
        <span className="procw-name">
          📄 {proc.titleKo || proc.title}
          {proc.rev ? " " + proc.rev : ""}
          <span className="procw-code">{proc.docCode || proc.code}</span>
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
