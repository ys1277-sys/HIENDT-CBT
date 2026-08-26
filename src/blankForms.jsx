/*
 * 사람이 손으로 채우는 서식들
 *
 * E02·E03 의 EXHIBIT 가운데 CBT 가 값을 모르는 것들이다. 시험을 치기
 * 전에 쓰거나(시행계획서·감독 관리사항), 시험과 상관없이 쓰거나
 * (재발급 신청서·자격종료 기록), 사람이 그 자리에서 적는 것들이다.
 *
 * 값은 못 채우지만 서식은 옮겨 둔다. 규칙 문서를 열어 그 부분만 찾아
 * 인쇄하는 것보다 여기서 바로 뽑는 편이 낫다 — 서식 번호가 붙어 있고
 * 늘 최신이다.
 *
 * 값을 채우는 서식은 따로 있다.
 *   E02-07  채점결과보고서        PrintScoreReport.jsx
 *   E03-01  자격증 발급대장        PrintCertLog.jsx
 *   E03-04  자격 만료 예정자 명단  PrintExpirySchedule.jsx
 */
import React from "react";
import { Box, ControlRow, FormHead, SignFooter } from "./formParts.jsx";

/* ─────────────────────────────────────────────
   조각
   ───────────────────────────────────────────── */

/* 빈 줄 여러 개. 손으로 적을 자리다 */
function rows(n, render) {
  return Array.from({ length: n }, (_, i) => render(i));
}

/* 「NDE Level Ⅰ □일반 □전문」 꼴의 시험 구분 표 */
function KindTable() {
  return (
    <table className="rp-form">
      <tbody>
        <tr>
          <th>NDE Level Ⅰ</th>
          <td><Box>일반시험</Box><Box>전문시험</Box></td>
        </tr>
        <tr>
          <th>NDE Level Ⅱ</th>
          <td><Box>일반시험</Box><Box>전문시험</Box></td>
        </tr>
        <tr>
          <th>NDE Level Ⅲ</th>
          <td><Box>기초시험</Box><Box>종목시험</Box><Box>전문시험</Box></td>
        </tr>
        <tr>
          <th>종 목</th>
          <td>
            {["RT", "UT", "MT", "PT", "VT", "ECT", "RFT"].map(m => (
              <Box key={m}>{m}</Box>
            ))}
          </td>
        </tr>
        <tr>
          <th>기 법</th>
          <td>
            <Box>TOFD</Box><Box>PAUT</Box>
            <span className="rp-hint">
              (UT Level Ⅱ 선수 자격 필요 — E02 5.1.3)
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* 시험 구분 · 시행일자 · 장소 · 회차 — 여러 서식이 머리에 두는 표 */
function SessionHead({ place = true }) {
  return (
    <table className="rp-form">
      <tbody>
        <tr>
          <th>시험 구분</th>
          <td />
          <th>시행일자</th>
          <td>년      월      일</td>
        </tr>
        {place ? (
          <tr>
            <th>시험장소</th>
            <td />
            <th>회 차</th>
            <td>제        회</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

/* 소속 · 성명 · 서명 세 칸짜리 확인표 */
function SignTable({ title, who, date = false }) {
  return (
    <table className="rp-grid rp-people">
      <thead>
        <tr>
          <th className="p1">{title || "구 분"}</th>
          <th>소속 및 직위</th>
          <th className="p3">성 명</th>
          <th className="p4">서 명</th>
          {date ? <th className="p5">일 자</th> : null}
        </tr>
      </thead>
      <tbody>
        {who.map((w, i) => (
          <tr key={i} className="rp-tall">
            <td>{w}</td>
            <td />
            <td />
            <td />
            {date ? <td /> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Paper({ children }) {
  return <div className="print-paper rp-paper">{children}</div>;
}

/* ─────────────────────────────────────────────
   E02-01  필기시험 시행계획서 및 응시자 명단
   ───────────────────────────────────────────── */

function E0201() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="필기시험 시행계획서 및 응시자 명단"
        titleEn="WRITTEN EXAMINATION PLAN AND CANDIDATE LIST"
        code="HIE-QP-E02-01"
      />

      <div className="rp-sec">1. 시험 구분</div>
      <KindTable />

      <div className="rp-sec">2. 시행 개요</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>시행일자</th>
            <td>년      월      일</td>
            <th>회 차</th>
            <td>제        회</td>
          </tr>
          <tr>
            <th>시험시간</th>
            <td>:      ~      :      (      시간 이내)</td>
            <th>시험장소</th>
            <td />
          </tr>
          <tr>
            <th>시행방식</th>
            <td><Box>CBT</Box><Box>시험지 출력(종이)</Box></td>
            <th>단말 대수</th>
            <td>대  (예비      대)</td>
          </tr>
          <tr>
            <th>제공 참고자료</th>
            <td colSpan={3}>
              <Box>A 없음</Box>
              <Box>B 없음(2시간)</Box>
              <Box>C 표·그래프·적용 절차서</Box>
              <Box>D 식·표·코드</Box>
              <Box>E 식·표</Box>
              <span className="rp-hint">(E02 5.3.2 의 유형)</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">3. 감독</div>
      <SignTable who={["시험감독책임자", "시험감독자", "시험감독자"]} />

      <div className="rp-sec">4. 응시자 명단</div>
      <table className="rp-grid rp-cand">
        <thead>
          <tr>
            <th className="n1">NO</th>
            <th className="n2">성 명</th>
            <th className="n3">사 번</th>
            <th className="n4">소 속</th>
            <th className="n5">등급</th>
            <th className="n6">종목·기법</th>
            <th className="n7">구분</th>
            <th className="n8">시력검사<br />만료일</th>
            <th className="n9">UT Lv.Ⅱ<br />선수 자격</th>
            <th className="n10">응시 구분</th>
            <th className="n11">비 고</th>
          </tr>
        </thead>
        <tbody>
          {rows(10, i => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              <td /><td /><td /><td /><td /><td /><td />
              <td className="c rp-done"><Box>해당없음</Box><Box>확인</Box></td>
              <td className="c rp-done"><Box>신규</Box><Box>재자격</Box></td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-line">응시 인원 :            명</div>

      <div className="rp-quote">
        응시 자격과 시력검사 유효 여부는 HIE-QP-E01 7.1, 7.3.2 에 따라
        확인한다. <b>TOFD·PAUT·FMC 기법</b>에 응시하려면 UT Level Ⅱ 자격이
        유효해야 하며, 자격증 발급대장(HIE-QP-E03-01)으로 확인한다. (E02 7.2.3)
      </div>

      <SignFooter
        roles={[["작 성 자", "NDE Level Ⅲ / QA"], ["승 인 자", "대표 NDE Level Ⅲ"]]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E02-02  필기시험 감독 관리사항
   ───────────────────────────────────────────── */

const PREP = [
  ["시험 일반", "시험 종목·등급, 시험시간, 시험 장소"],
  ["응시자 명단", "본인 확인용 (E02-01)"],
  ["CBT 단말", "대수와 접속 상태, 예비 단말"],
  ["시험지 (종이 시행)", "응시 인원 + 2부, 답안지, 봉인 용품"],
  ["시험장 안내문", "게시용"],
  ["좌석 배치", "옆 사람 화면·답안이 보이지 않을 것"],
  ["제공 참고자료", "E02 5.3 의 유형에 따름"],
  ["필기구·식수", ""],
  ["시험 조건", "소음·조도·온도가 시험에 지장이 없을 것"],
];

const TIMELINE = [
  ["시험 30분 전", "시험장 안내문 부착, 좌석 배치, 단말 점검", ""],
  ["시험 10분 전", "응시자 입실 완료, 인원 및 좌석 확인", ""],
  ["시험 직전", "신분증 대조, 유의사항 공지, 소지품 별도 보관", "E02-03"],
  ["시험 시작", "CBT 접속·시작 / 종이는 시험지 배부 후 문항 수·인쇄 상태 확인", ""],
  ["시험 중", "감독, 질문 접수, 남은 시간 알림 (30분·10분·5분 전)", ""],
  ["시험 종료", "CBT 제출 확인 / 종이는 답안지 회수 및 인원 대조", ""],
  ["종료 후", "결과지 출력·인계 / 종이는 시험지 봉인 및 잔여분 폐기", "E02-04"],
];

function E0202() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="필기시험 감독 관리사항"
        titleEn="WRITTEN EXAMINATION PROCTORING CHECKLIST"
        code="HIE-QP-E02-02"
      />

      <SessionHead />

      <div className="rp-sec">1. 시험 전날 준비 확인</div>
      <table className="rp-grid rp-check">
        <thead>
          <tr>
            <th className="k1">확인</th>
            <th className="k2">항 목</th>
            <th>내 용</th>
          </tr>
        </thead>
        <tbody>
          {PREP.map(([item, desc]) => (
            <tr key={item}>
              <td className="c"><Box /></td>
              <td>{item}</td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-sec">2. 시험 당일 시간 운영</div>
      <table className="rp-grid rp-check">
        <thead>
          <tr>
            <th className="k1">확인</th>
            <th className="k2">시 점</th>
            <th>시 행 내 용</th>
            <th className="k4">비 고</th>
          </tr>
        </thead>
        <tbody>
          {TIMELINE.map(([when, what, memo]) => (
            <tr key={when}>
              <td className="c"><Box /></td>
              <td>{when}</td>
              <td>{what}</td>
              <td className="c">{memo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-sec">3. 특이사항 (전산 장애, 시험 중단, 부정행위 등)</div>
      <table className="rp-grid rp-check">
        <thead>
          <tr>
            <th className="k2">시 각</th>
            <th>내 용</th>
            <th className="k4">조 치</th>
          </tr>
        </thead>
        <tbody>
          {rows(2, i => (
            <tr key={i} className="rp-tall"><td /><td /><td /></tr>
          ))}
        </tbody>
      </table>

      <div className="rp-sec">4. 감독자 확인</div>
      <SignTable who={["시험감독책임자", "시험감독자"]} />

      <div className="rp-sec">5. 인계 확인 (E02 7.5.4 에 따른 결과지·답안지 인계)</div>
      <SignTable
        date
        who={["인계자 (시험감독책임자)", "인수자 (NDE Level Ⅲ / QA)"]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E02-03  응시자 유의사항  (두 장)
   ───────────────────────────────────────────── */

const RULES = [
  "신분증(주민등록증, 운전면허증, 여권, 사원증)을 지참한다. 미소지자는 응시할 수 없다.",
  "휴대전화와 전자 통신기기는 시험장에 반입하지 않는다. 부득이 소지한 경우 전원을 끄고 별도 보관한다.",
  "개인 소지품은 지정된 곳에 따로 둔다.",
  "지정된 좌석에 앉는다.",
  "질문이 있으면 손을 든다. 문항의 뜻에 대한 질문에만 답하며 정답은 알려 주지 않는다.",
  "계산이 필요한 문항은 CBT 화면의 계산기를 쓴다. 별도 계산기를 반입하지 않는다.",
  "시험지를 출력하여 종이로 치를 때에는 지워지지 않는 흑색 볼펜 또는 잉크로 기록한다. 적색 잉크와 수정액은 쓸 수 없다.",
  "시험문제와 정답, 개인별 답안은 공개되지 않는다.",
];

const CHEATS = [
  "제공되지 않은 자료를 시험 중에 이용하는 행위 (현장 적발 및 사후 적발 포함)",
  "대리 응시",
  "답안 미제출 (종이 시행)",
  "시험문제를 옮겨 적거나 전자기기로 기록하여 시험장 밖으로 가지고 나가는 행위",
  "다른 응시자의 화면이나 답안을 보는 행위, 보여 주는 행위",
  "그 밖에 부정행위로 볼 수 있는 행위",
];

const PENALTY = [
  "해당 시험은 0점으로 처리한다.",
  "대표 NDE Level Ⅲ 는 사안에 따라 1년 이내의 기간 동안 회사가 시행하는 자격시험에 응시할 수 없도록 할 수 있다.",
  "감독자의 주의를 받고도 따르지 않으면 퇴실을 명할 수 있으며 이 경우에도 0점으로 처리한다.",
];

function E0203() {
  return (
    <>
      <Paper>
        <ControlRow />
        <FormHead
          title="응시자 유의사항"
          titleEn="NOTICE TO CANDIDATES"
          code="HIE-QP-E02-03"
          page={1}
          pageCount={2}
        />

        <SessionHead place={false} />

        <div className="rp-sec">1. 시험 안내</div>
        <table className="rp-form">
          <tbody>
            <tr>
              <th>시험시간</th>
              <td>:      ~      :      (      시간 이내)</td>
            </tr>
            <tr>
              <th>제공 참고자료</th>
              <td />
            </tr>
            <tr>
              <th>합격기준</th>
              <td>
                각 시험 <b>70% 이상</b>, 종합 <b>80% 이상</b>
                <span className="rp-hint">(HIE-QP-E01 7.4.5)</span>
              </td>
            </tr>
            <tr>
              <th>결과 통보</th>
              <td />
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">2. 응시자가 지켜야 할 사항</div>
        <ol className="rp-list">
          {RULES.map(t => <li key={t}>{t}</li>)}
        </ol>

        <div className="rp-sec">3. 부정행위로 보는 행위 (HIE-QP-E02 7.6.1)</div>
        <ol className="rp-list">
          {CHEATS.map(t => <li key={t}>{t}</li>)}
        </ol>

        <div className="rp-sec">4. 부정행위자 처리</div>
        <ol className="rp-list">
          {PENALTY.map(t => <li key={t}>{t}</li>)}
        </ol>

        <div className="rp-sec">5. 시험 조건에 대한 요청</div>
        <div className="rp-body">
          시험 조건이 받아들이기 어려운 수준으로 나빠지는 경우 감독자에게
          정상화를 요구할 수 있다.
        </div>
      </Paper>

      <Paper>
        <FormHead
          title="응시자 유의사항"
          titleEn="NOTICE TO CANDIDATES"
          code="HIE-QP-E02-03"
          page={2}
          pageCount={2}
        />

        <div className="rp-confirm">
          위 사항을 공지받고 이해하였음을 확인합니다.
        </div>

        <table className="rp-grid rp-sig2">
          <thead>
            <tr>
              <th className="s1">NO</th>
              <th className="s2">성 명</th>
              <th className="s3">서 명</th>
              <th className="s1">NO</th>
              <th className="s2">성 명</th>
              <th className="s3">서 명</th>
            </tr>
          </thead>
          <tbody>
            {rows(5, i => (
              <tr key={i} className="rp-tall">
                <td className="c">{i + 1}</td>
                <td /><td />
                <td className="c">{i + 6}</td>
                <td /><td />
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </>
  );
}

/* ─────────────────────────────────────────────
   E02-04  시험문제 폐기 대장
   ───────────────────────────────────────────── */

function E0204() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="시험문제 폐기 대장"
        titleEn="EXAMINATION PAPER DISPOSAL LOG"
        code="HIE-QP-E02-04"
      />

      <div className="rp-quote">
        시험지를 출력하여 <b>종이로 시행한 경우에만</b> 작성한다.
        (HIE-QP-E02 7.5.4)
      </div>

      <table className="rp-grid rp-disp">
        <thead>
          <tr>
            <th className="d1">NO</th>
            <th className="d2">시험명 (회차)</th>
            <th className="d3">시행일</th>
            <th className="d3">폐기일</th>
            <th className="d4">폐기<br />부수</th>
            <th className="d5">폐기 방법</th>
            <th className="d6">입회자<br />(성명 / 서명)</th>
            <th className="d6">시험감독책임자<br />(성명 / 서명)</th>
          </tr>
        </thead>
        <tbody>
          {rows(5, i => (
            <tr key={i} className="rp-tall">
              <td className="c">{i + 1}</td>
              <td /><td /><td /><td />
              <td className="c rp-done"><Box>파쇄</Box><Box>소각</Box></td>
              <td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-quote">
        시험 관련 기록은 임의로 폐기하지 않는다. 폐기할 때에는 대표 NDE
        Level Ⅲ 의 승인을 받고 폐기 일자·승인 기록·폐기 대상 기록명·폐기
        방법을 기록으로 남긴다. (HIE-QP-E02 7.10.4)
      </div>

      <SignFooter
        roles={[["작 성 자", "시험감독책임자"], ["확 인 자", "대표 NDE Level Ⅲ"]]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E02-05  부정행위 처리 기록
   ───────────────────────────────────────────── */

function E0205() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="부정행위 처리 기록"
        titleEn="EXAMINATION MISCONDUCT REPORT"
        code="HIE-QP-E02-05"
      />

      <SessionHead />

      <div className="rp-sec">1. 대상자</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>성 명</th><td /><th>사 번</th><td />
          </tr>
          <tr>
            <th>소 속</th><td /><th>응시 등급·종목</th><td />
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">2. 적발 내용</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>적발 시각</th>
            <td />
          </tr>
          <tr>
            <th>해당 행위</th>
            <td>
              <Box>1) 제공되지 않은 자료 이용</Box>
              <Box>2) 대리 응시</Box>
              <Box>3) 답안 미제출</Box>
              <br />
              <Box>4) 시험문제 반출</Box>
              <Box>5) 다른 응시자의 답안 열람</Box>
              <Box>6) 기타</Box>
            </td>
          </tr>
          <tr className="rp-tall2">
            <th>구체적 사실</th>
            <td />
          </tr>
          <tr className="rp-tall2">
            <th>확보한 증거</th>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">3. 조치</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>시험 처리</th>
            <td><Box>0점 처리</Box><Box>퇴실 조치</Box></td>
          </tr>
          <tr>
            <th>응시 제한</th>
            <td>
              <Box>없음</Box>
              <Box>제한</Box>
              <span className="rp-hint">
                (         개월 —          년      월      일까지)
              </span>
            </td>
          </tr>
          <tr className="rp-tall2">
            <th>대표 NDE Level Ⅲ<br />판단</th>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="rp-quote">
        해당 시험은 <b>0점</b>으로 처리하며, 대표 NDE Level Ⅲ 는 사안에 따라
        <b> 1년 이내</b>의 기간 동안 응시를 제한할 수 있다.
        (HIE-QP-E02 7.6.3, 7.6.4)
      </div>

      <div className="rp-sec">4. 확인</div>
      <SignTable
        who={["적발 감독자", "시험감독책임자", "입회 감독자", "대표 NDE Level Ⅲ"]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E02-06  문제은행 접근 기록
   ───────────────────────────────────────────── */

function E0206() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="문제은행 접근 기록"
        titleEn="QUESTION BANK ACCESS LOG"
        code="HIE-QP-E02-06"
      />

      <div className="rp-quote">
        대표 NDE Level Ⅲ 가 <b>지정한 사람만</b> 접근할 수 있다.
        (HIE-QP-E02 6.4.3)
      </div>

      <table className="rp-grid rp-access">
        <thead>
          <tr>
            <th className="a1">NO</th>
            <th className="a2">접근일</th>
            <th className="a3">시각<br />(시작 ~ 종료)</th>
            <th className="a4">접근자<br />(성명 / 서명)</th>
            <th className="a5">접근 목적</th>
            <th className="a6">대상 종목·등급</th>
            <th className="a7">작업 내용</th>
            <th className="a8">승인자</th>
          </tr>
        </thead>
        <tbody>
          {rows(5, i => (
            <tr key={i} className="rp-tall">
              <td className="c">{i + 1}</td>
              <td />
              <td className="c">~</td>
              <td />
              <td className="c rp-done">
                <Box>조회</Box><Box>등록</Box><Box>수정</Box>
                <Box>삭제</Box><Box>백업</Box>
              </td>
              <td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-sec">백업 기록</div>
      <table className="rp-grid rp-backup">
        <thead>
          <tr>
            <th className="b1">NO</th>
            <th className="b2">백업일</th>
            <th>대 상</th>
            <th>저장 위치</th>
            <th className="b3">담당자</th>
            <th className="b3">확 인</th>
          </tr>
        </thead>
        <tbody>
          {rows(2, i => (
            <tr key={i} className="rp-tall">
              <td className="c">{i + 1}</td>
              <td /><td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-quote">
        보안 관련 위험 요소는 <b>연 1회 이상</b> 점검한다. (HIE-QP-E02 6.4.2)
      </div>

      <SignFooter
        roles={[["작 성 자", "NDE Level Ⅲ / QA"], ["확 인 자", "대표 NDE Level Ⅲ"]]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E03-02  자격증 재발급 신청서
   ───────────────────────────────────────────── */

function E0302() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="자격증 재발급 신청서"
        titleEn="APPLICATION FOR CERTIFICATE REISSUE"
        code="HIE-QP-E03-02"
      />

      <table className="rp-form">
        <tbody>
          <tr>
            <th>접수일자</th>
            <td>년      월      일</td>
            <th>접수번호</th>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">1. 신청인</div>
      <table className="rp-form">
        <tbody>
          <tr><th>성 명</th><td /><th>사 번</th><td /></tr>
          <tr><th>소 속</th><td /><th>연락처</th><td /></tr>
        </tbody>
      </table>

      <div className="rp-sec">2. 재발급 대상</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>구 분</th>
            <td><Box>자격증</Box><Box>ID 카드</Box></td>
          </tr>
          <tr>
            <th>등 급</th>
            <td>
              <Box>NDE Level Ⅰ</Box><Box>Ⅱ</Box><Box>Ⅲ</Box>
            </td>
          </tr>
          <tr><th>종목·기법</th><td /></tr>
          <tr><th>최초 인증 일자</th><td>년      월      일</td></tr>
          <tr><th>만료 일자</th><td>년      월      일</td></tr>
        </tbody>
      </table>

      <div className="rp-sec">3. 신청 사유</div>
      <table className="rp-form">
        <tbody>
          <tr>
            <th>사 유</th>
            <td>
              <Box>분실</Box><Box>훼손</Box>
              <Box>기재사항 변경</Box><Box>기타</Box>
            </td>
          </tr>
          <tr className="rp-tall2">
            <th>구체적 사유</th>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="rp-sec">4. 첨부</div>
      <table className="rp-grid rp-check">
        <tbody>
          <tr>
            <td className="c k1"><Box /></td>
            <td>훼손된 자격증 (훼손인 경우)</td>
          </tr>
          <tr>
            <td className="c k1"><Box /></td>
            <td>기재사항 변경을 증명하는 서류 (변경인 경우)</td>
          </tr>
        </tbody>
      </table>

      <div className="rp-apply">
        <div>위와 같이 자격증 재발급을 신청합니다.</div>
        <div className="rp-apply-date">년          월          일</div>
        <div className="rp-apply-sign">신청인 :                              (서명 또는 인)</div>
        <div className="rp-apply-to">한국공업엔지니어링㈜ 대표 NDE Level Ⅲ 귀중</div>
      </div>

      <div className="rp-quote">
        재발급하는 자격증의 <b>인증 일자와 만료 일자는 최초 발행한 것과 같다.</b>
        재발급으로 유효기간이 연장되지 않는다. (HIE-QP-E03 5.5.3)
      </div>

      <SignFooter
        roles={[["작 성 자", "NDE Level Ⅲ / QA"], ["승 인 자", "대표 NDE Level Ⅲ"]]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E03-03  자격증 재발급 대장
   ───────────────────────────────────────────── */

function E0303() {
  return (
    <Paper>
      <ControlRow />
      <FormHead
        title="자격증 재발급 대장"
        titleEn="CERTIFICATE REISSUE LOG"
        code="HIE-QP-E03-03"
      />

      <table className="rp-grid rp-reissue">
        <thead>
          <tr>
            <th className="r1">NO</th>
            <th className="r2">재발급<br />일자</th>
            <th className="r3">성 명</th>
            <th className="r3">사 번</th>
            <th className="r4">등급</th>
            <th className="r5">종목·기법</th>
            <th className="r6">재발급 사유</th>
            <th className="r2">최초 인증<br />일자</th>
            <th className="r2">만료 일자</th>
            <th className="r5">승인자</th>
            <th className="r4">수령<br />확인</th>
          </tr>
        </thead>
        <tbody>
          {rows(5, i => (
            <tr key={i} className="rp-tall">
              <td className="c">{i + 1}</td>
              <td /><td /><td /><td /><td />
              <td className="c rp-done">
                <Box>분실</Box><Box>훼손</Box><Box>변경</Box><Box>기타</Box>
              </td>
              <td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rp-quote">
        재발급하는 자격증의 <b>인증 일자와 만료 일자는 최초 발행한 것과 같다.</b>
        재발급으로 유효기간이 연장되지 않는다. (HIE-QP-E03 5.5.3)
      </div>

      <SignFooter
        roles={[["작 성 자", "NDE Level Ⅲ / QA"], ["확 인 자", "대표 NDE Level Ⅲ"]]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   E03-05  자격종료 · 복권 기록  (두 장)
   ───────────────────────────────────────────── */

const REINSTATE = [
  ["1) 자격인정 요원의 기록이 유지되고 있을 것", "(E01 7.6.6)"],
  ["2) 자격인정 기간이 자격종료 기간 동안 만기되지 않았을 것", ""],
  ["3) 자격종료 6개월 이내에 복권될 것", ""],
];

const RETEST = [
  "1) 이전 자격인정 증거가 있을 것",
  "2) 자격종료 6개월 이내에 자격인정을 받은 분야에서 근무하고 있을 것",
  "3) 자격종료 6개월 이내에 재자격인정 받을 것",
  "4) 위 1)~3)을 만족하지 않는 경우 — NDE Level Ⅲ 가 규정한 추가 훈련을 받을 것",
];

function E0305() {
  return (
    <Paper>
        <ControlRow />
        <FormHead
          title="자격종료 · 복권 기록"
          titleEn="TERMINATION AND REINSTATEMENT RECORD"
          code="HIE-QP-E03-05"
        />

        <div className="rp-sec">1. 대상자</div>
        <table className="rp-form">
          <tbody>
            <tr><th>성 명</th><td /><th>사 번</th><td /></tr>
            <tr><th>소 속</th><td /><th>등급·종목</th><td /></tr>
            <tr>
              <th>인증 일자</th><td>년      월      일</td>
              <th>만료 일자</th><td>년      월      일</td>
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">2. 자격종료</div>
        <table className="rp-form">
          <tbody>
            <tr>
              <th>종료 일자</th>
              <td>년      월      일</td>
            </tr>
            <tr>
              <th>종료 사유</th>
              <td>
                <Box>고용 종료 (E01 7.10.1)</Box><br />
                <Box>6개월 이상 해당 검사방법 미종사 (E01 7.10.2)</Box><br />
                <Box>기타</Box>
              </td>
            </tr>
            <tr className="rp-tall2">
              <th>구체적 사유</th>
              <td />
            </tr>
            <tr>
              <th>자격증 회수</th>
              <td>
                <Box>회수</Box><Box>미회수</Box>
                <span className="rp-hint">(사유 :                              )</span>
              </td>
            </tr>
            <tr>
              <th>ID 카드 회수</th>
              <td>
                <Box>회수</Box><Box>미회수</Box>
                <span className="rp-hint">(사유 :                              )</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">
          3. 복권 — 아래 세 가지를 모두 만족할 때 새로운 시험 없이 복권한다. (E01 7.11)
        </div>
        <table className="rp-grid rp-check">
          <thead>
            <tr>
              <th className="k1">확인</th>
              <th>조 건</th>
              <th className="k5">확인 내용</th>
            </tr>
          </thead>
          <tbody>
            {REINSTATE.map(([cond, ref]) => (
              <tr key={cond} className="rp-tall">
                <td className="c"><Box /></td>
                <td>{cond} <span className="rp-hint">{ref}</span></td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <table className="rp-form">
          <tbody>
            <tr>
              <th>복권 일자</th>
              <td>년      월      일</td>
            </tr>
            <tr>
              <th>판 정</th>
              <td>
                <Box>복권 (시험 없음)</Box>
                <Box>복권 불가 → 재자격 시험 시행</Box>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">
          4. 재자격 시험 — 복권 조건을 만족하지 못한 경우 (E01 7.10.3)
        </div>
        <table className="rp-grid rp-check">
          <thead>
            <tr>
              <th className="k1">확인</th>
              <th>조 건</th>
            </tr>
          </thead>
          <tbody>
            {RETEST.map(t => (
              <tr key={t} className="rp-tall">
                <td className="c"><Box /></td>
                <td>{t}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="rp-form">
          <tbody>
            <tr>
              <th>시행할 시험</th>
              <td>
                <Box>일반</Box><Box>전문</Box><Box>기초</Box>
                <Box>종목</Box><Box>실기</Box><Box>실증</Box>
              </td>
            </tr>
            <tr>
              <th>추가 훈련</th>
              <td>
                <Box>불요</Box><Box>필요</Box>
                <span className="rp-hint">(내용 :                                        )</span>
              </td>
            </tr>
            <tr>
              <th>시험 회차</th>
              <td>제        회  (        년      월      일)</td>
            </tr>
          </tbody>
        </table>

        <div className="rp-sec">5. 확인</div>
        <SignFooter
          roles={[
            ["작 성 자", "NDE Level Ⅲ / QA"],
            ["검 토 자", "대표 NDE Level Ⅲ"],
            ["승 인 자", "대표이사"],
        ]}
      />
    </Paper>
  );
}

/* ─────────────────────────────────────────────
   목록
   ───────────────────────────────────────────── */

export const BLANK_FORMS = [
  {
    code: "HIE-QP-E02-01",
    name: "필기시험 시행계획서 및 응시자 명단",
    when: "시험일 7일 전까지. 장소·단말·감독자와 응시자 명단을 적는다",
    basis: "E02 7.1.2",
    render: () => <E0201 />,
  },
  {
    code: "HIE-QP-E02-02",
    name: "필기시험 감독 관리사항",
    when: "시험 전날 준비 확인부터 종료 후 인계까지",
    basis: "E02 7.4.2",
    render: () => <E0202 />,
  },
  {
    code: "HIE-QP-E02-03",
    name: "응시자 유의사항",
    when: "시험 직전에 공지하고 응시자 서명을 받는다",
    basis: "E02 7.4.5",
    render: () => <E0203 />,
  },
  {
    code: "HIE-QP-E02-04",
    name: "시험문제 폐기 대장",
    when: "시험지를 출력해 종이로 시행한 경우에만",
    basis: "E02 7.5.4",
    render: () => <E0204 />,
  },
  {
    code: "HIE-QP-E02-05",
    name: "부정행위 처리 기록",
    when: "부정행위를 적발했을 때",
    basis: "E02 7.6",
    render: () => <E0205 />,
  },
  {
    code: "HIE-QP-E02-06",
    name: "문제은행 접근 기록",
    when: "문제은행에 접근할 때마다. 접근일·목적·접근자를 남긴다",
    basis: "E02 6.4.3",
    render: () => <E0206 />,
  },
  {
    code: "HIE-QP-E03-02",
    name: "자격증 재발급 신청서",
    when: "자격증을 잃어버리거나 훼손했을 때 본인이 낸다",
    basis: "E03 5.5.1",
    render: () => <E0302 />,
  },
  {
    code: "HIE-QP-E03-03",
    name: "자격증 재발급 대장",
    when: "재발급한 사유를 남긴다",
    basis: "E03 5.5.2",
    render: () => <E0303 />,
  },
  {
    code: "HIE-QP-E03-05",
    name: "자격종료 · 복권 기록",
    when: "고용 종료나 6개월 이상 미종사로 자격이 끝났을 때",
    basis: "E03 7.0",
    render: () => <E0305 />,
  },
];

/* 인쇄용 껍데기 */
export function BlankForm({ code, onReady }) {
  const form = BLANK_FORMS.find(f => f.code === code);

  React.useEffect(() => {
    if (onReady) onReady();
  }, [onReady, code]);

  if (!form) return null;

  return <div className="print-area">{form.render()}</div>;
}
