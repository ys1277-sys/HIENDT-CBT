/*
 * 자격 이력 계산
 *
 * 응시 기록(구글 시트)에서 사람 단위 이력을 만든다. 화면이나 React 를
 * 모르는 순수 계산만 둔다 — 규정을 옮긴 자리이므로 값으로 검증할 수
 * 있어야 한다. (tools/history-test.mjs)
 *
 * 옮긴 규정
 *   E01 7.4.4   종합점수는 요구되는 시험 결과의 단순 평균치
 *   E01 7.4.5   개별 70% 이상, 종합 80% 이상
 *   E01 7.5     불합격 재시험은 30일 경과 후
 *   E03 6.1.1   재자격 주기 Level Ⅰ·Ⅱ 3년, Level Ⅲ 5년.
 *               자격은 만료되는 달의 마지막 날에 만료된다
 *   E03 6.1.2   시력검사는 검사일로부터 1년 뒤 만료 월의 마지막 날에 만료
 *   E03 6.2.1   만료 3개월 전까지 본인과 소속 부서에 알린다
 *
 * 이 계산이 판정하는 것은 필기시험뿐이다.
 * 자격 취득에는 실기시험도 필요하고(E01 7.3.1), Level Ⅲ 전문시험은
 * 아직 종이로 시행하므로(E02 5.2.3) 여기에 점수가 들어오지 않는다.
 * 그래서 결과에 missing 을 함께 돌려주고, 화면은 그것을 밝혀 적는다.
 */

export const PASS_EACH = 70;         /* 개별 시험 합격선 (%) */
export const PASS_TOTAL = 80;        /* 종합 합격선 (%) */
export const RETAKE_DAYS = 30;       /* 불합격 후 재시험까지 */
export const WARN_MONTHS = 3;        /* 만료 예고 */
export const EYE_YEARS = 1;          /* 시력검사 유효기간 */

/* 재자격 주기 (년) */
export const RECERT_YEARS = {
  "Level I": 3,
  "Level II": 3,
  "Level III": 5,
};

/* ─────────────────────────────────────────────
   날짜
   ───────────────────────────────────────────── */

export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;

  const s = String(v).trim();

  /*
   * "2026-08-26" 처럼 시각이 없는 날짜는 그 달력 날짜를 뜻한다.
   * new Date("2026-08-26") 은 이것을 UTC 자정으로 읽어 우리 시간으로
   * 오전 9시가 된다. 시간대가 UTC 보다 뒤인 곳에서는 아예 전날이 된다.
   * 만료일 비교가 하루씩 어긋나므로 그냥 그 날짜로 만든다.
   */
  const ymdOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymdOnly) {
    return new Date(Number(ymdOnly[1]), Number(ymdOnly[2]) - 1, Number(ymdOnly[3]));
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* 시각을 뺀 날짜만. 만료 비교는 하루 단위로 한다 */
function dayNum(d) {
  const x = toDate(d);
  return x ? Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) : null;
}

/* 그 달의 마지막 날 */
export function endOfMonth(d) {
  const x = toDate(d);
  if (!x) return null;
  return new Date(x.getFullYear(), x.getMonth() + 1, 0);
}

/*
 * 만료일.
 *
 * "만료되는 달의 마지막 날에 만료" (E03 6.1.1) 이므로 날짜를 더한 뒤
 * 그 달의 말일로 민다. 2월 29일에 인증한 3년 자격은 2월 28일이 아니라
 * 2월 말일이 되고, 윤년이면 29일이 된다.
 */
export function addYearsToEndOfMonth(d, years) {
  const x = toDate(d);
  if (!x || !Number.isFinite(years)) return null;
  return new Date(x.getFullYear() + years, x.getMonth() + 1, 0);
}

/* 자격 만료일 */
export function certExpiry(level, certifiedAt) {
  const years = RECERT_YEARS[level];
  if (!years) return null;
  return addYearsToEndOfMonth(certifiedAt, years);
}

/* 시력검사 만료일 */
export function eyeExpiry(examDate) {
  return addYearsToEndOfMonth(examDate, EYE_YEARS);
}

/* 남은 날수. 만료일 당일은 0 이고 아직 유효하다 */
export function daysLeft(expiry, today = new Date()) {
  const a = dayNum(expiry);
  const b = dayNum(today);
  if (a === null || b === null) return null;

  return Math.round((a - b) / 86400000);
}

/*
 * 만료 상태.
 *   valid    유효
 *   warn     만료 3개월 이내 — 본인과 소속 부서에 알려야 한다
 *   expired  만료
 *   unknown  인증일자를 모른다 (요원 명부에 없다)
 */
export function expiryState(expiry, today = new Date()) {
  const e = toDate(expiry);
  if (!e) return "unknown";

  const left = daysLeft(e, today);
  if (left === null) return "unknown";
  if (left < 0) return "expired";

  /*
   * 만료 3개월 전부터 알린다 (E03 6.2.1). 3개월은 날수가 고정이 아니라
   * 달로 세므로 오늘에서 석 달 뒤 날짜를 만들어 견준다.
   * 시각이 섞이면 하루가 어긋나니 날짜끼리만 견준다.
   */
  const t = toDate(today);
  const warnFrom = new Date(t.getFullYear(), t.getMonth() + WARN_MONTHS, t.getDate());

  return dayNum(e) <= dayNum(warnFrom) ? "warn" : "valid";
}

/* ─────────────────────────────────────────────
   시험의 갈래
   ───────────────────────────────────────────── */

/*
 * 응시 기록 하나가 어떤 시험인지.
 *
 * Level Ⅱ 는 subject 가 General / Specific 이고 method 가 종목이다.
 * Level Ⅲ 는 subject 가 없고 method 가 Basic(기초) 또는 종목이다.
 *   (src/ExamData.jsx)
 */
export function examKind(rec) {
  if (!rec) return "";

  if (rec.level === "Level III") {
    return String(rec.method) === "Basic" ? "기초" : "종목";
  }

  const s = String(rec.subject || "");
  if (/^general$/i.test(s)) return "일반";
  if (/^specific$/i.test(s)) return "전문";
  return "";
}

/*
 * 이 기록이 속한 자격 단위.
 *
 * 자격은 등급 + 종목으로 하나다. Level Ⅱ RT 자격은 일반시험과
 * 전문시험을 함께 봐야 하나로 판정된다.
 *
 * Level Ⅲ 기초시험은 종목이 없다 — 한 번 붙으면 그 등급의 모든 종목에
 * 함께 쓰인다. 그래서 자격 단위에 넣지 않고 따로 들고 있다가
 * 종목마다 얹는다.
 */
export function unitKey(rec) {
  if (!rec) return "";
  if (examKind(rec) === "기초") return "";
  return `${rec.level}/${rec.method}`;
}

/* 그 등급의 필기시험이 무엇 무엇인지 */
export function requiredKinds(level) {
  return level === "Level III"
    ? ["기초", "종목", "전문"]
    : ["일반", "전문"];
}

/* ─────────────────────────────────────────────
   바깥 기관 자격에 따른 면제 (E01 7.3.5 · 7.3.7)

   유효한 ASNT NDE Level Ⅲ 또는 ISO 9712 Level Ⅲ 를 가진 사람은
   기초시험과 종목시험을 만족한 것으로 본다. ISO 9712 Level Ⅱ 를 가진
   사람은 일반시험을 만족한 것으로 본다. (E01 7.3.7 은 실기시험도 함께
   면제하지만 실기는 CBT 밖이라 여기서 다루지 않는다.)

   면제받은 사람이 실제로 치르는 시험은 합격선이 80% 다. 개별 70% 가
   아니다 — 이것을 놓치면 70점 받은 ASNT Level Ⅲ 소지자가 합격으로
   나온다. (HIE-QP-E02 5.1.5 · 7.7.4)

   면제는 종목마다 따진다. 요원 명부에 이렇게 적는다.

     exempt:Level III/UT   등급 + 종목
     exempt:UT             종목만
     exempt                그 사람의 기본값

   값은 자격 이름이다 — "ASNT III", "ISO9712 III", "ISO9712 II".
   ───────────────────────────────────────────── */

export const PASS_EXEMPT = 80;       /* 면제자가 치르는 시험의 합격선 (%) */

/* 적어 넣은 자격 이름을 갈래로 읽는다. 띄어쓰기나 대소문자는 안 따진다 */
export function exemptBadge(v) {
  const s = String(v == null ? "" : v).replace(/\s|-|_/g, "").toUpperCase();
  if (!s) return null;

  const three = /(III|Ⅲ|LEVEL3|LV3|L3)/.test(s);
  const two = /(II|Ⅱ|LEVEL2|LV2|L2)/.test(s) && !three;

  if (/ASNT/.test(s) && three) return "ASNT III";
  if (/(ISO9712|ISO)/.test(s) && three) return "ISO9712 III";
  if (/(ISO9712|ISO)/.test(s) && two) return "ISO9712 II";
  return null;
}

/* 그 사람이 이 등급·종목에서 내세운 바깥 자격 */
export function exemptOf(person, level, method) {
  const p = person || {};
  return (
    exemptBadge(p[`exempt:${level}/${method}`]) ||
    exemptBadge(p[`exempt:${method}`]) ||
    exemptBadge(p.exempt)
  );
}

/* 그 자격이 면제해 주는 필기시험 갈래 */
export function exemptKinds(level, badge) {
  if (!badge) return [];

  if (level === "Level III" && (badge === "ASNT III" || badge === "ISO9712 III")) {
    return ["기초", "종목"];        /* E01 7.3.5 — 전문시험은 그대로 친다 */
  }
  if (level === "Level II" && badge === "ISO9712 II") {
    return ["일반"];                /* E01 7.3.7 — 전문시험은 그대로 친다 */
  }
  return [];
}

/*
 * CBT 에 실려 있지 않아 점수가 들어올 수 없는 시험.
 * Level Ⅲ 전문시험은 시험지를 출력해 종이로 시행한다 (E02 5.2.3).
 */
export function isPaperOnly(level, kind) {
  return level === "Level III" && kind === "전문";
}

export function scoreOf(rec) {
  const n = Number(rec && rec.score);
  return Number.isFinite(n) ? n : null;
}

export function takenAt(rec) {
  return toDate(rec && (rec.startedAt || rec.timestamp || rec.date));
}

/* ─────────────────────────────────────────────
   응시 기록 묶기
   ───────────────────────────────────────────── */

/*
 * 같은 시험을 여러 번 친 경우 어느 것을 쓰는가.
 *
 * 합격한 것이 있으면 그 가운데 가장 이른 것을 쓴다 — 자격은 붙은
 * 날부터다. 다 떨어졌으면 가장 나중 것을 쓴다. 지금 상태를 보여야 한다.
 */
export function pickAttempt(list) {
  const tried = list.filter(Boolean);
  if (!tried.length) return null;

  const byTime = [...tried].sort((a, b) => {
    const x = takenAt(a), y = takenAt(b);
    return (x ? x.getTime() : 0) - (y ? y.getTime() : 0);
  });

  const passed = byTime.filter(r => (scoreOf(r) ?? -1) >= PASS_EACH);
  return passed.length ? passed[0] : byTime[byTime.length - 1];
}

/*
 * 재응시가 규정을 지켰는지 (E01 7.5 · E02 7.8.1).
 *
 * 불합격한 뒤 30일이 지나기 전에 다시 친 것을 찾는다. 추가 훈련 증거를
 * 내면 30일 이전에도 칠 수 있으므로 이것만으로 위반이라 단정하지 않는다.
 * 확인할 거리로 내놓는다.
 */
export function retakeIssues(list) {
  const byTime = [...list].filter(Boolean).sort((a, b) => {
    const x = takenAt(a), y = takenAt(b);
    return (x ? x.getTime() : 0) - (y ? y.getTime() : 0);
  });

  const out = [];

  for (let i = 1; i < byTime.length; i++) {
    const prev = byTime[i - 1];
    const cur = byTime[i];

    if ((scoreOf(prev) ?? 0) >= PASS_EACH) continue;   /* 붙었으면 볼 것 없다 */

    const gap = daysLeft(takenAt(cur), takenAt(prev));
    if (gap === null || gap >= RETAKE_DAYS) continue;

    out.push({
      prev,
      cur,
      gapDays: gap,
      /* 추가 훈련 증거 없이라면 이 날부터 칠 수 있었다 */
      allowedFrom: (() => {
        const p = takenAt(prev);
        if (!p) return null;
        const d = new Date(p);
        d.setDate(d.getDate() + RETAKE_DAYS);
        return d;
      })(),
    });
  }
  return out;
}

/* ─────────────────────────────────────────────
   자격 단위 판정
   ───────────────────────────────────────────── */

/*
 * 종합점수 — 요구되는 시험 결과의 단순 평균치 (E01 7.4.4).
 * 점수가 들어온 시험만으로 낸다. 빠진 시험은 missing 으로 따로 알린다.
 */
export function average(scores) {
  const ok = scores.filter(n => Number.isFinite(n));
  if (!ok.length) return null;
  return Math.round((ok.reduce((a, b) => a + b, 0) / ok.length) * 10) / 10;
}

/*
 * 자격 단위 하나를 판정한다.
 *
 * 돌려주는 값
 *   kinds      갈래별로 고른 응시 기록
 *   scores     갈래별 점수
 *   missing    점수가 없는 갈래
 *   paperOnly  CBT 에 없어 종이로 치는 갈래 (missing 에도 들어간다)
 *   belowEach  70% 에 못 미친 갈래
 *   total      필기 종합점수 (단순 평균)
 *   verdict    pass | fail | incomplete
 *   passedAt   필기를 모두 채운 가장 나중 응시일 (자격 인증일의 후보)
 *
 * verdict 가 pass 라도 자격 취득이 확정된 것은 아니다. 실기시험이
 * 남아 있고(E01 7.3.1) 대표 NDE Level Ⅲ 의 승인이 있어야 한다(E02 7.9.2).
 */
export function judgeUnit(level, byKind, badge = null) {
  /*
   * 바깥 자격으로 면제받은 갈래는 「요구되는 시험」에서 뺀다.
   * E01 7.4.4 의 종합점수는 요구되는 시험의 평균이므로, 면제된 것은
   * 평균에도 안 들어간다.
   */
  const exempted = exemptKinds(level, badge);
  const all = requiredKinds(level);
  const need = all.filter(k => !exempted.includes(k));

  /* 면제받은 사람이 치르는 시험은 80% 다 (E01 7.3.5 · 7.3.7) */
  const passEach = exempted.length ? PASS_EXEMPT : PASS_EACH;
  const passTotal = exempted.length ? PASS_EXEMPT : PASS_TOTAL;

  const kinds = {};
  const scores = {};
  const missing = [];
  const paperOnly = [];
  const belowEach = [];

  for (const kind of all) {
    const rec = byKind[kind] || null;
    kinds[kind] = rec;

    /* 면제된 갈래는 점수를 안 본다. 안 쳤다고 흠잡지도 않는다 */
    if (exempted.includes(kind)) {
      scores[kind] = null;
      continue;
    }

    const s = rec ? scoreOf(rec) : null;
    scores[kind] = s;

    if (s === null) {
      missing.push(kind);
      if (isPaperOnly(level, kind)) paperOnly.push(kind);
      continue;
    }
    if (s < passEach) belowEach.push(kind);
  }

  const total = average(need.map(k => scores[k]));

  let verdict;
  if (belowEach.length) verdict = "fail";
  else if (missing.length) verdict = "incomplete";
  else verdict = total !== null && total >= passTotal ? "pass" : "fail";

  /* 필기를 다 채운 날 — 가장 나중에 친 시험의 날짜 */
  let passedAt = null;
  if (verdict === "pass") {
    for (const k of need) {
      const d = takenAt(kinds[k]);
      if (d && (!passedAt || d > passedAt)) passedAt = d;
    }
  }

  return {
    kinds, scores, missing, paperOnly, belowEach, total, verdict, passedAt,
    /* 화면과 서식이 「왜 안 쳤는지」를 밝혀 적을 수 있게 함께 돌려준다 */
    badge, exempted, passEach, passTotal,
  };
}

/* ─────────────────────────────────────────────
   사람 단위 이력
   ───────────────────────────────────────────── */

function nameKey(v) {
  return String(v == null ? "" : v).trim().replace(/\s+/g, " ");
}

/*
 * 응시 기록을 사람 → 자격 단위로 묶는다.
 *
 * people 은 요원 명부다 (시력검사일, 인증일자, 소속 …). 없어도 된다 —
 * 그때는 응시 기록만으로 낼 수 있는 것까지만 낸다.
 */
export function buildHistory(records, people = [], today = new Date()) {
  const master = new Map();
  for (const p of people || []) {
    const k = nameKey(p && p.name);
    if (k) master.set(k, p);
  }

  const byPerson = new Map();

  for (const rec of records || []) {
    const k = nameKey(rec && rec.name);
    if (!k) continue;

    if (!byPerson.has(k)) {
      byPerson.set(k, { name: k, person: master.get(k) || null, all: [] });
    }
    byPerson.get(k).all.push(rec);
  }

  const out = [];

  for (const entry of byPerson.values()) {
    /* 갈래별 응시를 모은다. 기초시험은 등급 단위라 따로 둔다 */
    const attempts = new Map();          /* unitKey -> kind -> [rec] */
    const basic = [];

    for (const rec of entry.all) {
      const kind = examKind(rec);
      if (!kind) continue;

      if (kind === "기초") { basic.push(rec); continue; }

      const u = unitKey(rec);
      if (!attempts.has(u)) attempts.set(u, new Map());

      const byKind = attempts.get(u);
      if (!byKind.has(kind)) byKind.set(kind, []);
      byKind.get(kind).push(rec);
    }

    const units = [];

    for (const [key, byKind] of attempts) {
      const [level, method] = key.split("/");

      const picked = {};
      for (const [kind, list] of byKind) picked[kind] = pickAttempt(list);

      /* 기초시험은 그 등급의 모든 종목에 함께 쓰인다 */
      if (level === "Level III") picked["기초"] = pickAttempt(basic);

      /* 바깥 자격은 종목마다 다를 수 있다 (E01 7.3.5 · 7.3.7) */
      const badge = exemptOf(entry.person, level, method);

      const judged = judgeUnit(level, picked, badge);

      /*
       * 인증일자는 명부가 우선이다. 없으면 필기를 다 채운 날로 어림한다.
       *
       * 한 사람이 등급마다 다른 종목을 갖는다. Level Ⅲ 는 ET 만,
       * Level Ⅱ 는 UT·PAUT·TOFD 인 식이다. 종목만으로 찾으면 그 둘이
       * 같은 날로 뭉뚱그려진다. 등급까지 붙인 칸을 먼저 본다.
       *
       *   certifiedAt:Level III/ET   등급 + 종목
       *   certifiedAt:ET             종목만
       *   certifiedAt                그 사람의 기본값
       */
      const p = entry.person || {};
      const certifiedAt =
        toDate(p[`certifiedAt:${level}/${method}`]) ||
        toDate(p[`certifiedAt:${method}`]) ||
        toDate(p.certifiedAt) ||
        judged.passedAt;

      const expiry = certExpiry(level, certifiedAt);

      const issues = [];
      for (const [, list] of byKind) issues.push(...retakeIssues(list));
      if (level === "Level III") issues.push(...retakeIssues(basic));

      units.push({
        key,
        level,
        method,
        ...judged,
        certifiedAt,
        certifiedFrom:
          toDate(p[`certifiedAt:${level}/${method}`]) ||
          toDate(p[`certifiedAt:${method}`]) ||
          toDate(p.certifiedAt)
            ? "명부"
            : judged.passedAt ? "필기 완료일(어림)" : "",
        expiry,
        expiryState: expiryState(expiry, today),
        daysLeft: daysLeft(expiry, today),
        retakeIssues: issues,
        attemptCount: entry.all.filter(r => unitKey(r) === key).length,
      });
    }

    units.sort((a, b) =>
      a.level === b.level ? a.method.localeCompare(b.method) : a.level.localeCompare(b.level)
    );

    const p = entry.person || {};
    const eye = eyeExpiry(p.eyeExamDate);

    out.push({
      name: entry.name,
      person: entry.person,
      dept: p.dept || "",
      eyeExamDate: toDate(p.eyeExamDate),
      eyeExpiry: eye,
      eyeState: expiryState(eye, today),
      units,
      records: entry.all,
      lastExamAt: entry.all
        .map(takenAt)
        .filter(Boolean)
        .sort((a, b) => b - a)[0] || null,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return out;
}

/*
 * 만료 예정자 명단 (E03-04).
 * 만료 3개월 이내이거나 이미 만료된 자격만 추린다 (E03 6.2.1).
 */
export function expiringSoon(history, today = new Date()) {
  const rows = [];

  for (const person of history) {
    for (const u of person.units) {
      if (u.expiryState !== "warn" && u.expiryState !== "expired") continue;
      if (u.verdict !== "pass") continue;

      rows.push({
        name: person.name,
        dept: person.dept,
        level: u.level,
        method: u.method,
        certifiedAt: u.certifiedAt,
        expiry: u.expiry,
        daysLeft: u.daysLeft,
        state: u.expiryState,
      });
    }
  }

  rows.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  return rows;
}

/* 화면·인쇄에서 같은 꼴로 쓰기 위한 날짜 표기 */
export function ymd(d) {
  const x = toDate(d);
  if (!x) return "";
  const two = n => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${two(x.getMonth() + 1)}-${two(x.getDate())}`;
}

/* ─────────────────────────────────────────────
   회차
   ───────────────────────────────────────────── */

/*
 * 응시 기록을 회차로 묶는다.
 *
 * 채점결과보고서(E02-07)는 사람 한 명이 아니라 회차 하나를 다룬다.
 * 「시험 구분 · 종목 · 시행일자」가 머리에 오고 그 아래에 응시자가
 * 줄줄이 붙는 서식이다. 같은 날 같은 시험을 친 사람을 한 장에 담는다.
 */
export function sessionKey(rec) {
  const day = ymd(takenAt(rec));
  return [day, rec.level, rec.method, rec.subject || ""].join("|");
}

export function buildSessions(records, people = []) {
  const master = new Map();
  for (const p of people || []) {
    const k = nameKey(p && p.name);
    if (k) master.set(k, p);
  }

  const groups = new Map();

  for (const rec of records || []) {
    if (!rec || !nameKey(rec.name)) continue;

    const key = sessionKey(rec);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: takenAt(rec),
        level: rec.level || "",
        method: rec.method || "",
        subject: rec.subject || "",
        kind: examKind(rec),
        rows: [],
      });
    }
    groups.get(key).rows.push(rec);
  }

  const out = [];

  for (const g of groups.values()) {
    /* 같은 회차 안은 이름순 — 명단처럼 읽힌다 */
    g.rows.sort((a, b) => nameKey(a.name).localeCompare(nameKey(b.name), "ko"));

    const rows = g.rows.map(r => {
      const p = master.get(nameKey(r.name)) || {};
      const s = scoreOf(r);

      return {
        name: nameKey(r.name),
        empNo: p.empNo || "",
        total: r.total,
        correct: r.correct,
        score: s,
        pass: s !== null && s >= PASS_EACH,
      };
    });

    const passed = rows.filter(r => r.pass).length;

    out.push({
      ...g,
      rows,
      count: rows.length,
      passed,
      rate: rows.length ? Math.round((passed / rows.length) * 1000) / 10 : null,
      /* 출제 문항 수는 회차 안에서 같아야 한다. 다르면 뒤에 붙여 밝힌다 */
      questionCount: [...new Set(rows.map(r => r.total).filter(n => n != null))],
    });
  }

  out.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0));
  return out;
}

/*
 * 시력검사 만료 예정자 (E03-04 의 2번 표).
 *
 * 자격이 유효해도 시력검사가 만료되면 검사업무를 볼 수 없다 (E01 7.3.2).
 * 자격 만료와 따로 관리해야 하므로 따로 추린다.
 */
export function eyeExpiringSoon(history, today = new Date()) {
  const rows = [];

  for (const person of history) {
    if (!person.eyeExamDate) continue;
    if (person.eyeState !== "warn" && person.eyeState !== "expired") continue;

    rows.push({
      name: person.name,
      empNo: (person.person && person.person.empNo) || "",
      dept: person.dept,
      examDate: person.eyeExamDate,
      expiry: person.eyeExpiry,
      daysLeft: daysLeft(person.eyeExpiry, today),
      state: person.eyeState,
    });
  }

  rows.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  return rows;
}

/*
 * 자격증 발급대장에 오를 줄 (E03-01).
 *
 * 자격증은 필기만으로 나가지 않는다. 실기시험과 대표 NDE Level Ⅲ 의
 * 승인이 있어야 한다 (E01 7.3.1, E02 7.9.2). 그래서 여기 담는 것은
 * "발급 대상 후보" 다 — 필기를 통과하고 인증일자가 잡힌 자격.
 *
 * 발급일자와 수령확인은 비운다. 실제로 발급한 날을 시스템이 알 수 없다.
 */
export function certLogRows(history) {
  const rows = [];

  for (const person of history) {
    for (const u of person.units) {
      if (u.verdict !== "pass") continue;
      if (!u.certifiedAt) continue;

      rows.push({
        name: person.name,
        empNo: (person.person && person.person.empNo) || "",
        dept: person.dept,
        level: u.level,
        method: u.method,
        certifiedAt: u.certifiedAt,
        expiry: u.expiry,
        /* 명부에서 얻지 못해 필기 완료일로 어림한 것은 밝혀 둔다 */
        guessed: u.certifiedFrom !== "명부",
        /*
         * TOFD · PAUT 는 UT Level Ⅱ 가 인증되어 있어야 발행한다.
         * UT 가 종료·만료되면 함께 효력을 잃는다 (E03 5.1.5).
         */
        needsUT: /^(TOFD|PAUT|FMC)$/i.test(u.method),
        utOk: person.units.some(
          v => v.method === "UT" && v.level === u.level && v.verdict === "pass"
        ),
      });
    }
  }

  rows.sort((a, b) => {
    const d = (a.certifiedAt?.getTime() ?? 0) - (b.certifiedAt?.getTime() ?? 0);
    return d || a.name.localeCompare(b.name, "ko");
  });

  return rows;
}

/*
 * 기록 저장소에 올릴 꾸러미.
 *
 * 발급대장(E03-01)과 만료 예정자(E03-04)는 응시 결과에서 바로 나오지
 * 않는다 — 종합점수 판정, 만료일 계산, 요원 명부가 함께 있어야 한다.
 * 그 계산은 여기서만 하고 저장소는 받은 줄을 얹기만 한다.
 * 같은 계산을 Apps Script 에도 두면 언젠가 둘이 어긋난다.
 *
 * 열쇠(key)는 저장소가 같은 줄을 다시 찾는 데 쓴다. 사람이 적어 둔
 * 칸(발급일자·수령확인·통보일자)을 지우지 않고 갱신하기 위한 것이다.
 */
export function syncPayload(history, today = new Date()) {
  const asOf = ymd(today);

  const certLog = certLogRows(history).map(r => ({
    key: `${r.name}|${r.level}|${r.method}`,
    name: r.name,
    empNo: r.empNo,
    dept: r.dept,
    level: r.level,
    method: r.method,
    certifiedAt: ymd(r.certifiedAt),
    expiry: ymd(r.expiry),
    guessed: r.guessed,
    needsUT: r.needsUT,
    utOk: r.utOk,
  }));

  /* 자격 만료와 시력검사 만료를 한 목록에 담되 구분을 붙인다 */
  const expiry = [
    ...expiringSoon(history, today).map(r => ({
      key: `${asOf}|자격|${r.name}|${r.level}|${r.method}`,
      asOf,
      kind: "자격",
      name: r.name,
      empNo: (history.find(p => p.name === r.name)?.person || {}).empNo || "",
      dept: r.dept,
      level: r.level,
      method: r.method,
      certifiedAt: ymd(r.certifiedAt),
      expiry: ymd(r.expiry),
      daysLeft: r.daysLeft,
      state: r.state,
    })),

    ...eyeExpiringSoon(history, today).map(r => ({
      key: `${asOf}|시력|${r.name}`,
      asOf,
      kind: "시력검사",
      name: r.name,
      empNo: r.empNo,
      dept: r.dept,
      level: "",
      method: "",
      certifiedAt: ymd(r.examDate),
      expiry: ymd(r.expiry),
      daysLeft: r.daysLeft,
      state: r.state,
    })),
  ];

  return { type: "sync", asOf, certLog, expiry };
}
