import React, {
  useEffect,
  useState
} from "react";

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

          throw new Error(
            "HTTP error " + res.status
          );

        }

        return res.json();

      })

      .then((data) => {

        console.log(
          "관리자 데이터:",
          data
        );


        if (
          Array.isArray(data) &&
          data.length > 0
        ) {

          console.log(
            "마지막 데이터:",
            JSON.stringify(
              data[data.length - 1],
              null,
              2
            )
          );

        }


        setResults(
          Array.isArray(data)
            ? data
            : []
        );


        setLoading(false);

      })

      .catch((err) => {

        console.log(
          "결과 불러오기 실패:",
          err
        );


        alert(
          "결과를 불러오지 못했습니다."
        );


        setLoading(false);

      });

  }, []);


  // =====================================================
  // 인쇄 실행
  // =====================================================

  useEffect(() => {

    if (!exam) {
      return;
    }


    if (!examReady) {
      return;
    }


    const timer =
      setTimeout(() => {

        window.print();

      }, 200);


    return () => {

      clearTimeout(timer);

    };

  }, [
    exam,
    examReady
  ]);


  // =====================================================
  // 시험지 출력
  // =====================================================

  function printExam(r) {

    console.log(
      "출력 데이터 확인:",
      r
    );


    console.log(
      "정답번호 확인:",
      Array.isArray(r.questions)
        ? r.questions.map(
            (q) => q.answer
          )
        : []
    );


    if (
      !Array.isArray(r.questions) ||
      r.questions.length === 0
    ) {

      alert(
        "출력할 시험 데이터가 없습니다."
      );

      return;

    }


    setExamReady(false);

    setExam(r);

  }


  // =====================================================
  // 검색
  // =====================================================

  let filteredResults =
    [...results];


  if (search) {

    filteredResults =
      filteredResults.filter(
        (r) =>
          String(
            r.name || ""
          ).includes(search)
      );

  }


  // =====================================================
  // Level 필터
  // =====================================================

  if (filterLevel) {

    filteredResults =
      filteredResults.filter(
        (r) =>
          String(
            r.level || ""
          ) === String(
            filterLevel
          )
      );

  }


  // =====================================================
  // 검사법 필터
  // =====================================================

  if (filterMethod) {

    filteredResults =
      filteredResults.filter(
        (r) =>
          String(
            r.method || ""
          ) === String(
            filterMethod
          )
      );

  }


  // =====================================================
  // 점수 정렬
  // =====================================================

  if (sortScore) {

    filteredResults.sort(
      (a, b) =>
        Number(
          b.score || 0
        ) -
        Number(
          a.score || 0
        )
    );

  }


  // =====================================================
  // Level 목록
  // =====================================================

  const levelList = [
    ...new Set(
      results
        .map(
          (r) =>
            r.level
        )
        .filter(
          Boolean
        )
    )
  ];


  // =====================================================
  // 검사법 목록
  // =====================================================

  const methodList = [
    ...new Set(
      results
        .map(
          (r) =>
            r.method
        )
        .filter(
          Boolean
        )
    )
  ];


  // =====================================================
  // RETURN
  // =====================================================

  return (

    <>

      {/* =================================================
          관리자 검색 / 필터
      ================================================= */}

      <div
        className="admin-controls"
      >

        <input
          type="text"
          placeholder="응시자 검색"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />


        <select
          value={filterLevel}
          onChange={(e) =>
            setFilterLevel(
              e.target.value
            )
          }
        >

          <option value="">
            전체 Level
          </option>


          {
            levelList.map(
              (level) => (

                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>

              )
            )
          }

        </select>


        <select
          value={filterMethod}
          onChange={(e) =>
            setFilterMethod(
              e.target.value
            )
          }
        >

          <option value="">
            전체 검사법
          </option>


          {
            methodList.map(
              (method) => (

                <option
                  key={method}
                  value={method}
                >
                  {method}
                </option>

              )
            )
          }

        </select>


        <button
          type="button"
          onClick={() =>
            setSortScore(
              (prev) =>
                !prev
            )
          }
        >

          {
            sortScore
              ? "점수순 해제"
              : "점수순 정렬"
          }

        </button>


        {
          onBack && (

            <button
              type="button"
              onClick={onBack}
            >
              돌아가기
            </button>

          )
        }

      </div>


      {/* =================================================
          결과 목록
      ================================================= */}

      {
        loading ? (

          <div>
            결과를 불러오는 중입니다...
          </div>

        ) : (

          <div
            className="admin-results"
          >

            {
              filteredResults.length === 0 ? (

                <div>
                  검색 결과가 없습니다.
                </div>

              ) : (

                filteredResults.map(
                  (
                    r,
                    index
                  ) => (

                    <div
                      key={
                        r.id || index
                      }
                      className="admin-result"
                    >

                      <div>
                        {r.name || ""}
                      </div>


                      <div>
                        {r.level || ""}
                      </div>


                      <div>
                        {r.method || ""}
                      </div>


                      <div>
                        {r.subject || ""}
                      </div>


                      <div>
                        {r.score || ""}
                      </div>


                      <div>

                        {
                          r.result ||
                          (
                            Number(
                              r.score || 0
                            ) >= 70
                              ? "PASS"
                              : "FAIL"
                          )
                        }

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          printExam(r)
                        }
                      >
                        정답지 출력
                      </button>

                    </div>

                  )
                )

              )
            }

          </div>

        )
      }


      {/* =================================================
          관리자 정답지 인쇄
      ================================================= */}

      {
        exam && (

          <PrintAdminExam

            questions={
              exam.questions || []
            }

            answers={
              exam.answers || {}
            }

            name={
              exam.name || ""
            }

            level={
              exam.level || ""
            }

            method={
              exam.method || ""
            }

            subject={
              exam.subject || ""
            }

            date={
              exam.date || ""
            }

            score={
              exam.score || ""
            }

            onReady={() => {

              setExamReady(
                true
              );

            }}

          />

        )
      }

    </>

  );

}


export default Admin;