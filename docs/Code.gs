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
 *   2) 함수 목록에서 setup 을 골라 한 번 실행 (시트와 머리행을 만든다)
 *   3) 배포 → 배포 관리 → 기존 배포 편집 → 새 버전  (주소가 유지된다)
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
