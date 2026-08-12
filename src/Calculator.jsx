import { useState, useRef } from "react";
import * as math from "mathjs";

// 시험 화면에서 버튼으로 열고 닫는 공학용 계산기 팝업
const DEG = Math.PI / 180;

/*
 * mathjs 기본 동작을 시험용으로 바꾼다.
 *
 *  - 삼각함수가 라디안 기준이라 sin(30) 이 0.5 가 아니라 -0.988 이 나왔다.
 *    스넬의 법칙이나 굴절각 계산이 전부 틀리는 값이었다.
 *  - log 가 자연로그였다. dB = 20·log₁₀(A₁/A₂) 계산이 조용히 틀렸다.
 *  - ln 함수는 mathjs 에 아예 없어서 버튼을 누르면 무조건 오류였다.
 */
function buildScope(degMode) {
  const scope = {
    log: (x) => Math.log10(x),
    ln: (x) => Math.log(x),
  };

  if (degMode) {
    scope.sin = (x) => Math.sin(x * DEG);
    scope.cos = (x) => Math.cos(x * DEG);
    scope.tan = (x) => Math.tan(x * DEG);
    scope.asin = (x) => Math.asin(x) / DEG;
    scope.acos = (x) => Math.acos(x) / DEG;
    scope.atan = (x) => Math.atan(x) / DEG;
  }

  return scope;
}

export default function Calculator({ onClose }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [degMode, setDegMode] = useState(true);

  const dragInfo = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
  });

  const press = (val) => {
    setExpr((prev) => prev + val);
  };

  const calculate = () => {
    try {
      // evaluate 는 스코프를 수정하므로 매번 새로 만든다
      const value = math.evaluate(expr, buildScope(degMode));
      setResult(String(value));
    } catch (e) {
      setResult("오류");
    }
  };

  const clearAll = () => {
    setExpr("");
    setResult("");
  };

  const backspace = () => {
    setExpr((prev) => prev.slice(0, -1));
  };

  const buttons = [
    "sin(",
    "cos(",
    "tan(",
    "sqrt(",
    "log(",
    "ln(",
    "^",
    "π",
    "(",
    ")",
    "%",
    "÷",
    "7",
    "8",
    "9",
    "×",
    "4",
    "5",
    "6",
    "-",
    "1",
    "2",
    "3",
    "+",
    "0",
    ".",
    "C",
    "=",
  ];

  const handleClick = (btn) => {
    if (btn === "=") return calculate();
    if (btn === "C") return clearAll();
    if (btn === "÷") return press("/");
    if (btn === "×") return press("*");
    if (btn === "π") return press("pi");

    return press(btn);
  };

  // 헤더를 마우스로 눌러서 끌면 계산기 위치 이동
  const startDrag = (e) => {
    dragInfo.current = {
      dragging: true,
      startX: e.clientX - pos.x,
      startY: e.clientY - pos.y,
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const onDrag = (e) => {
    if (!dragInfo.current.dragging) return;

    setPos({
      x: e.clientX - dragInfo.current.startX,
      y: e.clientY - dragInfo.current.startY,
    });
  };

  const stopDrag = () => {
    dragInfo.current.dragging = false;

    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div
      className="calcw-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="calcw-box"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="calcw-header"
          onMouseDown={startDrag}
        >
          <span>
            🖩 공학용 계산기
          </span>

          <span className="calcw-header-right">
            {/* 각도 단위. NDT 계산은 도(°) 기준이 기본이다 */}
            <button
              type="button"
              className="calcw-mode"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setDegMode((v) => !v)}
              title="삼각함수 각도 단위"
            >
              {degMode ? "DEG" : "RAD"}
            </button>

            <button
              type="button"
              className="calcw-close"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClose}
            >
              ✕
            </button>
          </span>
        </div>

        <input
          className="calcw-expr"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="식을 입력하거나 버튼을 누르세요"
        />

        <div className="calcw-result">
          {result}
        </div>

        <div className="calcw-grid">
          {buttons.map((btn) => (
            <button
              key={btn}
              type="button"
              className={
                btn === "="
                  ? "calcw-btn calcw-equals"
                  : "calcw-btn"
              }
              onClick={() => handleClick(btn)}
            >
              {btn}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="calcw-backspace"
          onClick={backspace}
        >
          ← 지우기
        </button>
      </div>

      <style>{`
        .calcw-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0, 0, 0, 0.4) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
        }

        .calcw-box {
          width: 300px !important;
          background: #ffffff !important;
          border-radius: 12px !important;
          padding: 16px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
          font-family: sans-serif !important;
        }

        .calcw-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 10px !important;
          font-weight: bold !important;
          font-size: 13px !important;
          color: #111111 !important;
          cursor: move !important;
          user-select: none !important;
        }

        .calcw-header-right {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .calcw-mode {
          border: 1px solid #1a56db !important;
          background: #ffffff !important;
          color: #1a56db !important;
          font-size: 11px !important;
          font-weight: bold !important;
          padding: 3px 8px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          line-height: 1 !important;
        }

        .calcw-close {
          border: none !important;
          background: transparent !important;
          font-size: 18px !important;
          cursor: pointer !important;
          color: #111111 !important;
          line-height: 1 !important;
        }

        .calcw-expr {
          width: 100% !important;
          box-sizing: border-box !important;
          padding: 8px !important;
          font-size: 16px !important;
          margin-bottom: 6px !important;
          border: 1px solid #ccc !important;
          border-radius: 6px !important;
          color: #111111 !important;
          background: #ffffff !important;
        }

        .calcw-result {
          text-align: right !important;
          font-size: 20px !important;
          font-weight: bold !important;
          min-height: 28px !important;
          margin-bottom: 10px !important;
          color: #1a56db !important;
        }

        .calcw-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 6px !important;
        }

        .calcw-btn {
          padding: 10px 0 !important;
          font-size: 15px !important;
          border: 1px solid #ddd !important;
          border-radius: 6px !important;
          background: #f5f5f5 !important;
          color: #111111 !important;
          cursor: pointer !important;
        }

        .calcw-btn:hover {
          background: #e9e9e9 !important;
        }

        .calcw-equals {
          border: none !important;
          background: #1a56db !important;
          color: #ffffff !important;
        }

        .calcw-equals:hover {
          background: #1544ac !important;
        }

        .calcw-backspace {
          width: 100% !important;
          margin-top: 8px !important;
          padding: 8px 0 !important;
          border: 1px solid #ddd !important;
          border-radius: 6px !important;
          background: #ffffff !important;
          color: #111111 !important;
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}