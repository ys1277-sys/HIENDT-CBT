/*
 * HIENDT 자격시험 기록 저장소
 * ─────────────────────────────────────────────────────────────
 * 스프레드시트 하나를 규칙이 정한 기록 한 벌로 쓴다.
 * 시트 하나가 서식 하나다.
 *
 *   E02 7.10.3   이 규칙에 따라 남기는 기록
 *   E03 9.0      자격증 발행 및 관리 규칙의 양식
 *   E02 7.10.1   퇴사 후 5년 보존 — 이 스크립트는 아무것도 지우지 않는다
 *   E02 7.10.4   폐기는 대표 NDE Level Ⅲ 승인을 받아 사람이 한다
 *
 * 쓰는 법
 *   1) 스프레드시트 → 확장 프로그램 → Apps Script → 이 파일을 통째로 붙여넣기
 *   2) Ctrl+S 로 저장
 *   3) 배포 → 배포 관리 → 기존 배포 편집 → 새 버전  (주소가 유지된다)
 *
 * 시트는 저절로 만들어진다. 첫 요청이 들어올 때 한 번 훑어 없는 시트를
 * 만들고 빠진 머리행을 붙인다. 편집기에서 setup 을 눌러 미리 만들어
 * 두어도 되고, 배포 주소에 ?do=setup 을 붙여 열어도 된다.
 *
 * 주고받는 것
 *   POST {type:"exam", …}                응시 결과 한 건
 *   POST {type:"sync", certLog, expiry}  발급대장 후보와 만료 예정자 갱신
 *   GET  ?sheet=people                   요원 명부
 *   GET  ?sheet=<시트이름>                그 시트를 통째로
 *   GET                                  응시기록 (예전과 같다)
 */

/* ─────────────────────────────────────────────
   시트 구성
   ───────────────────────────────────────────── */

var SHEETS = {
  exam: {
    name: "응시기록",
    head: [
      "timestamp", "date", "startedAt", "finishedAt", "durationSec",
      "name", "level", "method", "subject", "kind",
      "total", "correct", "score", "result",
      "questions", "answers",
    ],
  },

  /* HIE-QP-E02-07 채점결과보고서 — 회차 하나가 한 줄 */
  score: {
    name: "E02-07 채점결과",
    head: [
      "회차키", "시행일자", "등급", "시험", "종목",
      "출제문항", "응시인원", "합격자", "합격률", "응시자",
      "갱신시각",
      /* 아래는 사람이 채운다 */
      "회차번호", "채점장소", "확인자", "승인자", "승인일자", "비고",
    ],
    keyCol: "회차키",
    /* CBT 가 채우는 칸. 나머지는 손대지 않는다 */
    own: ["회차키", "시행일자", "등급", "시험", "종목",
          "출제문항", "응시인원", "합격자", "합격률", "응시자", "갱신시각"],
  },

  /* HIE-QP-E03-01 자격증 발급대장 */
  cert: {
    name: "E03-01 발급대장",
    head: [
      "키", "성명", "사번", "소속", "등급", "종목",
      "인증일자", "만료일자", "인증일자출처", "UT선수자격", "갱신시각",
      /* 아래는 사람이 채운다 */
      "발급일자", "발급구분", "수령확인", "비고",
    ],
    keyCol: "키",
    own: ["키", "성명", "사번", "소속", "등급", "종목",
          "인증일자", "만료일자", "인증일자출처", "UT선수자격", "갱신시각"],
  },

  /* HIE-QP-E03-04 자격 만료 예정자 명단 — 기준일자마다 한 벌 */
  expiry: {
    name: "E03-04 만료예정",
    head: [
      "키", "기준일자", "구분", "성명", "사번", "소속",
      "등급", "종목", "인증일자", "만료일자", "남은일수", "상태", "갱신시각",
      /* 아래는 사람이 채운다 */
      "통보일자", "재자격회차", "처리",
    ],
    keyCol: "키",
    own: ["키", "기준일자", "구분", "성명", "사번", "소속",
          "등급", "종목", "인증일자", "만료일자", "남은일수", "상태", "갱신시각"],
  },

  /* 요원 명부 — 시험으로는 나오지 않는 값들 (E03 8.2.1) */
  people: {
    name: "요원",
    head: [
      "name", "dept", "empNo", "eyeExamDate", "certifiedAt",
      "hiredAt", "terminatedAt", "education", "experience", "training",
      "approvedBy", "employerSign",
    ],
  },
};

/* 사람이 손으로 채우는 기록. 머리행만 만들어 둔다 */
var MANUAL = [
  { name: "E02-01 시행계획", head: [
    "시행일자", "회차", "등급", "시험", "종목", "기법",
    "시험시간", "시험장소", "시행방식", "단말대수", "제공참고자료",
    "시험감독책임자", "시험감독자", "응시인원", "작성자", "승인자", "승인일자",
  ]},
  { name: "E02-02 감독", head: [
    "시행일자", "회차", "시험구분", "시험장소",
    "전날준비확인", "당일운영확인", "특이사항",
    "시험감독책임자", "시험감독자", "인계자", "인수자", "인계일자",
  ]},
  { name: "E02-04 폐기대장", head: [
    "시험명(회차)", "시행일", "폐기일", "폐기부수", "폐기방법",
    "입회자", "시험감독책임자", "승인자",
  ]},
  { name: "E02-05 부정행위", head: [
    "시행일자", "회차", "시험구분", "시험장소",
    "성명", "사번", "소속", "응시등급종목",
    "적발시각", "해당행위", "구체적사실", "확보한증거",
    "시험처리", "응시제한", "제한만료일", "대표판단",
    "적발감독자", "시험감독책임자", "입회감독자", "대표NDELevel3",
  ]},
  { name: "E02-06 은행접근", head: [
    "접근일", "시작시각", "종료시각", "접근자", "접근목적",
    "대상종목등급", "작업내용", "승인자",
  ]},
  { name: "E03-03 재발급", head: [
    "재발급일자", "성명", "사번", "등급", "종목", "재발급사유",
    "최초인증일자", "만료일자", "승인자", "수령확인",
  ]},
  { name: "E03-05 자격종료", head: [
    "성명", "사번", "소속", "등급종목", "인증일자", "만료일자",
    "종료일자", "종료사유", "구체적사유", "자격증회수", "ID카드회수",
    "복권조건1", "복권조건2", "복권조건3", "복권일자", "판정",
    "재자격시험", "추가훈련", "시험회차",
    "작성자", "검토자", "승인자",
  ]},
];

/*
 * 응시자 유의사항 서명본(E02-03)은 종이에 손으로 서명받는 것이라
 * 시트로 관리하지 않는다. 스캔하여 회차별로 보관한다.
 */

/* ─────────────────────────────────────────────
   한 번 실행 — 시트와 머리행 만들기
   ───────────────────────────────────────────── */

/*
 * 시트가 갖춰졌는지 훑는다.
 *
 * 처음에는 편집기에서 setup 을 눌러 만들게 했는데, 붙여넣고 저장하기
 * 전에는 함수 목록이 갱신되지 않아 setup 이 안 보인다. 사람 손을 타는
 * 단계는 빼는 편이 낫다. 첫 요청 때 저절로 만든다.
 *
 * 다 만들었는지는 맨 마지막 시트가 있는지로 본다.
 *
 * 스크립트 속성(PropertiesService)에 표시를 남기는 편이 깔끔하지만
 * 그것은 예전 스크립트에 없던 권한이라, 배포한 뒤 권한을 다시 받아야
 * 한다. 그 자리에서 또 막힌다. 시트를 보는 것은 이미 있는 권한이다.
 */
var LAST_SHEET = "E03-05 자격종료";

function ensureAll(force) {
  if (!force && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LAST_SHEET)) {
    return;
  }
  setup();
}

function setup() {
  var made = [];

  for (var key in SHEETS) {
    if (ensure(SHEETS[key].name, SHEETS[key].head)) made.push(SHEETS[key].name);
  }
  for (var i = 0; i < MANUAL.length; i++) {
    if (ensure(MANUAL[i].name, MANUAL[i].head)) made.push(MANUAL[i].name);
  }

  var msg = made.length
    ? "만든 시트 : " + made.join(", ")
    : "이미 다 있습니다. 머리행만 확인했습니다.";

  Logger.log(msg);
  return msg;
}

/*
 * 시트가 없으면 만들고, 머리행에 빠진 칸이 있으면 뒤에 붙인다.
 * 이미 있는 칸은 옮기지도 지우지도 않는다 — 사람이 적어 둔 값이 어긋난다.
 */
function ensure(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  var created = false;

  if (!sheet) {
    sheet = ss.insertSheet(name);
    created = true;
  }

  var now = headerOf(sheet);
  var add = [];

  for (var i = 0; i < head.length; i++) {
    if (now.indexOf(head[i]) === -1) add.push(head[i]);
  }

  if (add.length) {
    var all = now.concat(add);
    sheet.getRange(1, 1, 1, all.length).setValues([all]);
    sheet.getRange(1, 1, 1, all.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return created;
}

/* ─────────────────────────────────────────────
   받기
   ───────────────────────────────────────────── */

function doPost(e) {
  try {
    ensureAll(false);

    var body = JSON.parse(e.postData.contents);

    if (body.type === "sync") return json(sync(body));

    /* type 이 없으면 예전처럼 응시 결과로 본다 */
    return json(saveExam(body));
  }
  catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/*
 * 응시 결과 한 건.
 *
 *   1) 응시기록에 한 줄 붙인다
 *   2) 그 회차의 채점결과(E02-07) 줄을 다시 센다
 *
 * 회차는 「시행일 + 등급 + 종목 + 구분」이다. 같은 날 같은 시험을 친
 * 사람은 한 회차로 묶인다 (E02 EXHIBIT 7 의 서식이 그렇다).
 */
function saveExam(rec) {
  var sheet = sheetOf(SHEETS.exam.name, true);
  var head = headerOf(sheet);

  rec.kind = kindOf(rec);

  /* 머리행에 없는 칸이 들어오면 뒤에 만들어 준다 */
  var add = [];
  for (var k in rec) if (head.indexOf(k) === -1) add.push(k);
  if (add.length) {
    head = head.concat(add);
    sheet.getRange(1, 1, 1, head.length).setValues([head]);
  }

  sheet.appendRow(head.map(function (name) {
    var v = rec[name];
    if (v === undefined || v === null) return "";
    return (typeof v === "object") ? JSON.stringify(v) : v;
  }));

  var key = sessionKey(rec);
  restatSession(key);

  return { ok: true, saved: "응시기록", session: key };
}

/*
 * 그 회차를 응시기록에서 다시 세어 E02-07 줄을 갱신한다.
 *
 * 다시 세는 이유 — 응시자가 한 사람씩 제출하므로 회차가 끝나기 전에는
 * 인원과 합격률이 계속 바뀐다. 매번 처음부터 세면 늘 맞는다.
 */
function restatSession(key) {
  var rows = readSheet(SHEETS.exam.name, false).filter(function (r) {
    return sessionKey(r) === key;
  });
  if (!rows.length) return;

  var first = rows[0];
  var passed = rows.filter(function (r) { return Number(r.score) >= 70; }).length;

  var counts = {};
  rows.forEach(function (r) { if (r.total) counts[r.total] = 1; });

  upsert(SHEETS.score, {
    "회차키": key,
    "시행일자": dayOf(first),
    "등급": first.level,
    "시험": kindOf(first) + "시험",
    "종목": first.method,
    "출제문항": Object.keys(counts).join(" / "),
    "응시인원": rows.length,
    "합격자": passed,
    "합격률": Math.round((passed / rows.length) * 1000) / 10,
    "응시자": rows.map(function (r) { return r.name; }).sort().join(", "),
    "갱신시각": stamp(),
  });
}

/*
 * 발급대장 후보와 만료 예정자를 갱신한다.
 *
 * 이 둘은 응시 결과에서 바로 나오지 않는다 — 종합점수, 만료일 계산,
 * 요원 명부가 함께 있어야 한다. 그 계산은 앱(src/history.js)이 하고
 * 여기서는 받은 줄을 그대로 얹는다. 계산을 두 곳에 두면 어긋난다.
 *
 * 사람이 적어 둔 칸(발급일자·수령확인·통보일자·처리)은 건드리지 않는다.
 */
function sync(body) {
  var n = 0;

  (body.certLog || []).forEach(function (r) {
    upsert(SHEETS.cert, {
      "키": r.key,
      "성명": r.name,
      "사번": r.empNo || "",
      "소속": r.dept || "",
      "등급": r.level,
      "종목": r.method,
      "인증일자": r.certifiedAt || "",
      "만료일자": r.expiry || "",
      "인증일자출처": r.guessed ? "필기 완료일(어림)" : "요원 명부",
      "UT선수자격": r.needsUT ? (r.utOk ? "확인" : "미인증") : "해당없음",
      "갱신시각": stamp(),
    });
    n++;
  });

  (body.expiry || []).forEach(function (r) {
    upsert(SHEETS.expiry, {
      "키": r.key,
      "기준일자": r.asOf,
      "구분": r.kind,
      "성명": r.name,
      "사번": r.empNo || "",
      "소속": r.dept || "",
      "등급": r.level || "",
      "종목": r.method || "",
      "인증일자": r.certifiedAt || "",
      "만료일자": r.expiry || "",
      "남은일수": r.daysLeft,
      "상태": r.state === "expired" ? "만료" : "만료 임박",
      "갱신시각": stamp(),
    });
    n++;
  });

  return { ok: true, updated: n };
}

/* ─────────────────────────────────────────────
   주기
   ───────────────────────────────────────────── */

function doGet(e) {
  var todo = (e && e.parameter && e.parameter.do) || "";

  /* 시트를 실수로 지웠거나 머리행을 바꿨을 때 다시 훑는다 */
  if (todo === "setup") return json({ ok: true, message: setup() });
  if (todo === "migrate") return json(migrate(e.parameter.from));
  if (todo === "clear") return json(clearExams(e.parameter.confirm));
  if (todo === "tidy") return json(tidyAll());

  ensureAll(false);

  var which = (e && e.parameter && e.parameter.sheet) || "";

  if (which === "people") return json(readSheet(SHEETS.people.name, false));
  if (which === "sheets") return json(sheetList());

  if (which) {
    /* 시트 이름을 그대로 받는다. E02-07 채점결과 같은 것 */
    return json(readSheet(which, false));
  }

  return json(readSheet(SHEETS.exam.name, true));
}

function sheetList() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) {
    return { name: s.getName(), rows: Math.max(0, s.getLastRow() - 1) };
  });
}

/* ─────────────────────────────────────────────
   보기 좋게 다듬기
   ───────────────────────────────────────────── */

/*
 * 칸 너비.
 *
 * 자동 맞춤(autoResizeColumns)만 쓰면 questions·answers 처럼 JSON 이
 * 통째로 든 칸이 수천 픽셀로 늘어나 시트를 가로로 밀어 버린다.
 * 칸 이름마다 알맞은 너비를 정해 두고, 모르는 이름은 기본값을 준다.
 */
var WIDTH = {
  /* 사람 */
  name: 90, 성명: 90, 응시자: 260,
  dept: 90, 소속: 90, role: 70, 직책: 70,
  empNo: 100, 사번: 100,

  /* 시험 */
  level: 80, 등급: 70, method: 70, 종목: 70,
  subject: 80, kind: 60, 시험: 80, 구분: 60,
  total: 60, correct: 60, score: 60, result: 70,
  출제문항: 80, 응시인원: 70, 합격자: 60, 합격률: 60,

  /* 때 */
  timestamp: 150, date: 150, startedAt: 150, finishedAt: 150,
  durationSec: 80, 갱신시각: 130,
  시행일자: 95, 인증일자: 95, 만료일자: 95, 기준일자: 95,
  발급일자: 95, 승인일자: 95, 통보일자: 95, 접근일: 95,
  eyeExamDate: 105, certifiedAt: 105, hiredAt: 105, terminatedAt: 105,

  /* 긴 글 */
  education: 200, experience: 110, training: 240,
  questions: 120, answers: 120,
  회차키: 200, 키: 180,
  비고: 160, 구체적사유: 240, 특이사항: 240,
};

var WIDTH_DEFAULT = 110;

/*
 * questions·answers 는 문항 전체가 JSON 으로 들어 있다. 좁혀 두고
 * 줄바꿈을 꺼서 한 줄로 잘라 보여 준다 — 펼치면 한 칸이 화면을 덮는다.
 */
var CLIP = ["questions", "answers", "회차키", "키"];

function tidy(name) {
  var sheet = sheetOf(name, false);
  if (!sheet) return null;

  var cols = sheet.getLastColumn();
  var rows = sheet.getLastRow();
  if (cols < 1) return null;

  var head = headerOf(sheet);

  /* 머리행 — 굵게, 가운데, 회색 바탕, 고정 */
  var top = sheet.getRange(1, 1, 1, cols);
  top.setFontWeight("bold")
     .setHorizontalAlignment("center")
     .setVerticalAlignment("middle")
     .setBackground("#eceff1");

  sheet.setFrozenRows(1);

  /* 성명이 첫 칸이면 옆으로 밀어도 따라오게 고정한다 */
  if (head[0] === "name" || head[0] === "성명") sheet.setFrozenColumns(1);

  for (var i = 0; i < cols; i++) {
    var key = head[i] || "";
    var w = WIDTH[key];

    /* certifiedAt:Level II/UT 처럼 붙는 이름 */
    if (!w && key.indexOf("certifiedAt:") === 0) w = 105;

    sheet.setColumnWidth(i + 1, w || WIDTH_DEFAULT);

    if (rows > 1) {
      var body = sheet.getRange(2, i + 1, rows - 1, 1);
      body.setVerticalAlignment("middle");

      /* 긴 JSON 은 잘라 보여 주고, 나머지는 접어서 다 보이게 */
      body.setWrap(CLIP.indexOf(key) === -1);
    }
  }

  return { name: name, cols: cols, rows: Math.max(0, rows - 1) };
}

function tidyAll() {
  ensureAll(false);

  var done = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var all = ss.getSheets();

  for (var i = 0; i < all.length; i++) {
    var r = tidy(all[i].getName());
    if (r) done.push(r);
  }

  return {
    ok: true,
    tidied: done,
    message: done.length + "개 시트를 다듬었습니다 — 칸 너비, 머리행 고정, 줄바꿈.",
  };
}

/* ─────────────────────────────────────────────
   시험 삼아 친 기록 비우기
   ───────────────────────────────────────────── */

/*
 * 응시기록과 그 집계를 비운다.
 *
 * 기록은 임의로 폐기하지 않는 것이 원칙이다 (E02 7.10.4). 그래서
 * 그냥 부르면 무엇을 지울지 세어만 주고 멈춘다. 정말 지우려면
 * ?do=clear&confirm=yes 로 뜻을 밝혀야 한다.
 *
 * 머리행은 남긴다. 다시 만들 필요 없이 바로 쓸 수 있어야 한다.
 * 요원 명부와 사람이 채우는 서식 시트는 건드리지 않는다.
 */
var CLEARABLE = ["응시기록", "E02-07 채점결과", "E03-01 발급대장",
                 "E03-04 만료예정", "시트1"];

function clearExams(confirm) {
  var found = [];

  for (var i = 0; i < CLEARABLE.length; i++) {
    var sheet = sheetOf(CLEARABLE[i], false);
    if (!sheet) continue;

    /* 시트1 은 예전 스크립트가 쓰던 것이라 머리행이 없다 */
    var keepHead = CLEARABLE[i] !== "시트1";
    var rows = sheet.getLastRow() - (keepHead ? 1 : 0);
    if (rows > 0) found.push({ name: CLEARABLE[i], rows: rows, keepHead: keepHead });
  }

  if (String(confirm) !== "yes") {
    return {
      ok: false,
      willDelete: found,
      message: "지울 줄 : " +
        (found.length
          ? found.map(function (f) { return f.name + " " + f.rows + "줄"; }).join(", ")
          : "없습니다") +
        ". 정말 지우려면 ?do=clear&confirm=yes 로 다시 부르세요. " +
        "요원 명부와 사람이 채우는 서식 시트는 건드리지 않습니다.",
    };
  }

  for (var j = 0; j < found.length; j++) {
    var sh = sheetOf(found[j].name, false);
    var from = found[j].keepHead ? 2 : 1;
    sh.deleteRows(from, found[j].rows);
  }

  return {
    ok: true,
    deleted: found,
    message: found.length
      ? found.map(function (f) { return f.name + " " + f.rows + "줄"; }).join(", ") + " 을 지웠습니다."
      : "지울 것이 없습니다.",
  };
}

/* ─────────────────────────────────────────────
   예전 기록 옮기기
   ───────────────────────────────────────────── */

/*
 * 예전 스크립트가 쓰던 시트의 줄을 응시기록으로 옮긴다.
 *
 * 예전 시트에는 머리행이 없다. 칸 차례가 곧 뜻이었다.
 *   A 응시일시  B 성명  C 등급  D 종목  E 구분  F 점수  G 결과
 *   H 문항(JSON)  I 답(JSON)
 *
 * 손으로 옮기면 칸이 밀린다. 여기서 차례대로 읽어 이름 붙은 칸에 넣는다.
 * 옮긴 뒤 회차 집계(E02-07)까지 다시 센다.
 *
 * 원본 시트는 지우지 않는다. 기록은 임의로 폐기하지 않는다 (E02 7.10.4).
 */
var OLD_COLS = ["date", "name", "level", "method", "subject",
                "score", "result", "questions", "answers"];

function migrate(from) {
  var srcName = from || "시트1";
  var src = sheetOf(srcName, false);

  if (!src) return { ok: false, error: srcName + " 시트가 없습니다" };

  ensureAll(false);
  var dest = sheetOf(SHEETS.exam.name, true);

  if (dest.getLastRow() > 1) {
    return {
      ok: false,
      error: "응시기록에 이미 " + (dest.getLastRow() - 1) +
             "줄이 있습니다. 두 번 옮기지 않으려고 멈춥니다.",
    };
  }

  var rows = src.getLastRow();
  var cols = Math.min(src.getLastColumn(), OLD_COLS.length);
  if (rows < 1 || cols < 1) return { ok: false, error: srcName + " 이 비어 있습니다" };

  var body = src.getRange(1, 1, rows, cols).getValues();
  var head = headerOf(dest);
  var out = [];
  var keys = {};
  var skipped = 0;

  for (var i = 0; i < body.length; i++) {
    var rec = {};
    for (var c = 0; c < cols; c++) rec[OLD_COLS[c]] = body[i][c];

    /* 머리행이 섞여 있으면 건너뛴다 */
    if (String(rec.date).trim() === "date") { skipped++; continue; }
    if (String(rec.name).trim() === "" && String(rec.level).trim() === "") { skipped++; continue; }

    /*
     * 예전 date 는 "2026. 7. 23. 오후 1:01:56" 꼴이라 new Date() 로
     * 되파싱되지 않는다. 그대로 두면 회차가 "2026. 7. 2" 로 잘려 엉킨다.
     * ISO 로 풀어 timestamp·startedAt 에 넣는다.
     */
    var iso = parseKoreanTime(rec.date);
    rec.timestamp = iso;
    rec.startedAt = iso;
    rec.kind = kindOf(rec);

    out.push(head.map(function (name) {
      var v = rec[name];
      if (v === undefined || v === null) return "";
      return (typeof v === "object") ? JSON.stringify(v) : v;
    }));

    var k = sessionKey(rec);
    if (k) keys[k] = 1;
  }

  if (!out.length) return { ok: false, error: "옮길 줄이 없습니다" };

  dest.getRange(dest.getLastRow() + 1, 1, out.length, head.length).setValues(out);

  /* 회차 집계를 채운다 */
  var sessions = 0;
  for (var key in keys) { restatSession(key); sessions++; }

  return {
    ok: true,
    from: srcName,
    moved: out.length,
    skipped: skipped,
    sessions: sessions,
    message: srcName + " 의 " + out.length + "줄을 응시기록으로 옮기고 회차 " +
             sessions + "개를 집계했습니다. 원본은 그대로 두었습니다.",
  };
}

/*
 * "2026. 7. 23. 오후 1:01:56" → "2026-07-23T13:01:56+09:00"
 * 한국어 로케일 문자열이라 Date 가 못 읽는다. 직접 뜯는다.
 */
function parseKoreanTime(v) {
  if (v instanceof Date) return v.toISOString();

  var s = String(v == null ? "" : v).trim();
  if (!s) return "";

  var m = s.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2}):?(\d{2})?/
  );
  if (!m) {
    var d = new Date(s);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }

  var hour = Number(m[5]);
  if (m[4] === "오후" && hour < 12) hour += 12;
  if (m[4] === "오전" && hour === 12) hour = 0;

  var p = function (x) { return String(x).padStart(2, "0"); };

  return m[1] + "-" + p(m[2]) + "-" + p(m[3]) + "T" +
         p(hour) + ":" + m[6] + ":" + p(m[7] || 0) + "+09:00";
}

/* ─────────────────────────────────────────────
   손
   ───────────────────────────────────────────── */

/*
 * 열쇠가 같은 줄이 있으면 그 줄의 「CBT 가 채우는 칸」만 고치고,
 * 없으면 새 줄을 붙인다. 사람이 적은 칸은 그대로 둔다.
 */
function upsert(conf, values) {
  var sheet = sheetOf(conf.name, true);
  ensure(conf.name, conf.head);

  var head = headerOf(sheet);
  var keyIdx = head.indexOf(conf.keyCol);
  if (keyIdx < 0) return;

  var last = sheet.getLastRow();
  var found = 0;

  if (last >= 2) {
    var keys = sheet.getRange(2, keyIdx + 1, last - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(values[conf.keyCol])) { found = i + 2; break; }
    }
  }

  if (!found) {
    var row = head.map(function (h) {
      return values[h] === undefined ? "" : values[h];
    });
    sheet.appendRow(row);
    return;
  }

  /* 있는 줄이면 CBT 가 맡은 칸만 덮어쓴다 */
  for (var j = 0; j < head.length; j++) {
    var name = head[j];
    if (conf.own.indexOf(name) === -1) continue;
    if (values[name] === undefined) continue;
    sheet.getRange(found, j + 1).setValue(values[name]);
  }
}

/* 회차 열쇠 — 시행일 + 등급 + 종목 + 구분 */
function sessionKey(r) {
  return [dayOf(r), r.level, r.method, r.subject || ""].join("|");
}

function dayOf(r) {
  var v = r.startedAt || r.timestamp || r.date;
  if (!v) return "";

  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);

  return Utilities.formatDate(d, tz(), "yyyy-MM-dd");
}

/* 일반 / 전문 / 기초 / 종목 — src/history.js 의 examKind 와 같은 규칙 */
function kindOf(r) {
  if (r.level === "Level III") return r.method === "Basic" ? "기초" : "종목";
  var s = String(r.subject || "").toLowerCase();
  if (s === "general") return "일반";
  if (s === "specific") return "전문";
  return "";
}

function tz() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function stamp() {
  return Utilities.formatDate(new Date(), tz(), "yyyy-MM-dd HH:mm");
}

function sheetOf(name, create) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet && create) sheet = ss.insertSheet(name);
  return sheet;
}

function headerOf(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (v) { return String(v).trim(); });
}

/*
 * 시트를 객체 목록으로 읽는다.
 *
 * 날짜 칸은 구글이 Date 로 바꿔 두는데 그대로 주면 시간대가 섞여
 * 만료일이 하루씩 어긋난다. 시각이 없으면 yyyy-MM-dd 로 맞춘다.
 */
function readSheet(name, parseJson) {
  var sheet = sheetOf(name, false);
  if (!sheet) return [];

  var rows = sheet.getLastRow();
  var cols = sheet.getLastColumn();
  if (rows < 2 || cols < 1) return [];

  var head = headerOf(sheet);
  var body = sheet.getRange(2, 1, rows - 1, cols).getValues();
  var zone = tz();

  return body.map(function (row) {
    var out = {};

    head.forEach(function (key, i) {
      if (!key) return;
      var v = row[i];

      if (v instanceof Date) {
        var hasTime = v.getHours() || v.getMinutes() || v.getSeconds();
        out[key] = hasTime
          ? v.toISOString()
          : Utilities.formatDate(v, zone, "yyyy-MM-dd");
        return;
      }

      if (parseJson && (key === "questions" || key === "answers")) {
        try { out[key] = JSON.parse(v); } catch (err) { out[key] = v; }
        return;
      }

      out[key] = v;
    });

    return out;
  }).filter(function (r) {
    /* 아주 빈 줄만 버린다 */
    return Object.keys(r).some(function (k) {
      return String(r[k] === undefined ? "" : r[k]).trim() !== "";
    });
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
