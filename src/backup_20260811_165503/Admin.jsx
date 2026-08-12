import React, { useEffect, useState } from "react";
import PrintAdminExam from "./PrintAdminExam.jsx";

function Admin({ onBack }) {
  console.log("Admin 실행됨");

  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examReady, setExamReady] = useState(false);

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [sortScore, setSortScore] = useState(false);

  // =====================================================
  // Google Sheet 결과 불러오기
  // =====================================================
  useEffect(() => {
    fetch(
      "https://script.google.com/macros/s/AKfycbxs_whBI5KfBxKaDreav9PL3_rHX847OdwwLtc8uwMIN9fVOAozGHdpzXmQRsa7PO6i/exec"
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("HTTP error " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log("관리자 데이터:", data);

        if (Array.isArray(data) && data.length > 0) {
          console.log(
            "마지막 데이터:",
            JSON.stringify(data[data.length - 1], null, 2)
          );
        }

        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("결과 불러오기 실패:", err);
        alert("결과를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  // =====================================================
  // 인쇄 실행
  // =====================================================
  useEffect(() => {
    if (!exam) return;
    if (!examReady) return;

    const timer = setTimeout(() => {
      window.print();
    }, 200);

    return () => clearTimeout(timer);
  }, [exam, examReady]);

  // =====================================================
  // 시험지 출력
  // =====================================================
  function printExam(r) {
    console.log("출력 데이터 확인:", r);
    console.log(
      "정답번호 확인:",
      Array.isArray(r.questions) ? r.questions.map((q) => q.answer) : []
    );

    if (!Array.isArray(r.questions) || r.questions.length === 0) {
      alert("출력할 시험 데이터가 없습니다.");
      return;
    }

    setExamReady(false);
    setExam(r);
  }

  // =====================================================
  // 검색 / 필터
  // =====================================================
  let filteredResults = [...results];

  if (search) {
    filteredResults = filteredResults.filter((r) =>
      String(r.name || "").includes(search)
    );
  }

  if (filterLevel) {
    filteredResults = filteredResults.filter(
      (r) => String(r.level || "") === String(filterLevel)
    );
  }

  if (filterMethod) {
    filteredResults = filteredResults.filter(
      (r) => String(r.method || "") === String(filterMethod)
    );
  }

  // =====================================================
  // 정렬 (기본: 최신순 / 토글 시: 점수순)
  // =====================================================
  filteredResults.sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0).getTime();
    const dateB = new Date(b.date || b.timestamp || 0).getTime();
    return dateB - dateA; // 최신이 위로
  });

  if (sortScore) {
    filteredResults.sort(
      (a, b) => Number(b.score || 0) - Number(a.score || 0)
    );
  }

  // =====================================================
  // Level / 검사법 목록
  // =====================================================
  const levelList = [
    ...new Set(results.map((r) => r.level).filter(Boolean)),
  ];

  const methodList = [
    ...new Set(results.map((r) => r.method).filter(Boolean)),
  ];

  // =====================================================
  // RETURN
  // =====================================================
  return (
    <>
      <style>{`
        .admin-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px;
          box-sizing: border-box;
        }

        .admin-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: #f7f8fa;
          border: 1px solid #e2e4e8;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .admin-controls input[type="text"],
        .admin-controls select {
          padding: 8px 10px;
          border: 1px solid #d0d3d8;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
        }

        .admin-controls button {
          padding: 8px 14px;
          border: 1px solid #3a6df0;
          background: #3a6df0;
          color: #fff;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .admin-controls button:hover {
          background: #2f5bd0;
        }

        .admin-results {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-result {
          display: grid;
          grid-template-columns: 1.2fr 0.7fr 0.9fr 1fr 0.6fr 0.7fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border: 1px solid #e2e4e8;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .admin-result > div {
          overflow-wrap: break-word;
          font-size: 14px;
        }

        .admin-result button {
          padding: 6px 12px;
          border: 1px solid #3a6df0;
          background: #fff;
          color: #3a6df0;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-result button:hover {
          background: #3a6df0;
          color: #fff;
        }

        @media (max-width: 720px) {
          .admin-result {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="admin-wrap">
        {/* =================================================
            관리자 검색 / 필터
        ================================================= */}
        <div className="admin-controls">
          <input
            type="text"
            placeholder="응시자 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">전체 Level</option>
            {levelList.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="">전체 검사법</option>
            {methodList.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setSortScore((prev) => !prev)}>
            {sortScore ? "최신순으로" : "점수순 정렬"}
          </button>

          {onBack && (
            <button type="button" onClick={onBack}>
              돌아가기
            </button>
          )}
        </div>

        {/* =================================================
            결과 목록
        ================================================= */}
        {loading ? (
          <div>결과를 불러오는 중입니다...</div>
        ) : (
          <div className="admin-results">
            {filteredResults.length === 0 ? (
              <div>검색 결과가 없습니다.</div>
            ) : (
              filteredResults.map((r, index) => (
                <div key={r.id || index} className="admin-result">
                  <div>{r.name || ""}</div>
                  <div>{r.level || ""}</div>
                  <div>{r.method || ""}</div>
                  <div>{r.subject || ""}</div>
                  <div>{r.score || ""}</div>
                  <div>
                    {r.result ||
                      (Number(r.score || 0) >= 70 ? "PASS" : "FAIL")}
                  </div>
                  <button type="button" onClick={() => printExam(r)}>
                    정답지 출력
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================================
            관리자 정답지 인쇄
        ================================================= */}
        {exam && (
          <PrintAdminExam
            questions={exam.questions || []}
            answers={exam.answers || {}}
            name={exam.name || ""}
            level={exam.level || ""}
            method={exam.method || ""}
            subject={exam.subject || ""}
            date={exam.date || ""}
            score={exam.score || ""}
            onReady={() => {
              setExamReady(true);
            }}
          />
        )}
      </div>
    </>
  );
}

export default Admin;