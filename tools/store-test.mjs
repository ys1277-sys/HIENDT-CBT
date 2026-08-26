/*
 * 기록 저장소 검사 — docs/Code.gs
 *
 *   node tools/store-test.mjs
 *
 * docs/Code.gs 를 가짜 스프레드시트 위에서 돌려 본다.
 *
 * Apps Script 는 구글 서버에서만 도는 것이라 여기서 붙여 보기 전에는
 * 확인할 방법이 없다. 시트를 흉내 내는 최소한의 껍데기를 만들어
 * setup · doPost · doGet 이 규칙대로 쌓는지 값으로 본다.
 */
import fs from "node:fs";

/* ── 가짜 스프레드시트 ─────────────────────── */
class Sheet {
  constructor(name) { this.name = name; this.rows = []; }
  getName() { return this.name; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows.reduce((m, r) => Math.max(m, r.length), 0); }
  appendRow(r) { this.rows.push([...r]); }
  deleteRows(from, count) { this.rows.splice(from - 1, count); }
  setFrozenRows() {}
  getRange(r, c, nr = 1, nc = 1) {
    const sh = this;
    return {
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const row = sh.rows[r - 1 + i] || [];
          out.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? ""));
        }
        return out;
      },
      setValues(v) {
        for (let i = 0; i < v.length; i++) {
          const row = sh.rows[r - 1 + i] || (sh.rows[r - 1 + i] = []);
          for (let j = 0; j < v[i].length; j++) row[c - 1 + j] = v[i][j];
        }
      },
      setValue(v) {
        const row = sh.rows[r - 1] || (sh.rows[r - 1] = []);
        row[c - 1] = v;
      },
      setFontWeight() { return this; },
    };
  }
}

const sheets = new Map();
globalThis.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: n => sheets.get(n) || null,
    insertSheet: n => { const s = new Sheet(n); sheets.set(n, s); return s; },
    getSheets: () => [...sheets.values()],
    getSpreadsheetTimeZone: () => "Asia/Seoul",
  }),
};
globalThis.Utilities = {
  formatDate: (d, tz, fmt) => {
    const p = n => String(n).padStart(2, "0");
    const s = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return fmt.includes("HH") ? `${s} ${p(d.getHours())}:${p(d.getMinutes())}` : s;
  },
};
globalThis.ContentService = {
  MimeType: { JSON: "json" },
  createTextOutput: t => ({ setMimeType: () => t }),
};
globalThis.Logger = { log: () => {} };


/* ── 스크립트 싣기 ─────────────────────────── */
const src = fs.readFileSync(new URL("../docs/Code.gs", import.meta.url), "utf8");
new Function(src + "\nglobalThis.__gs = {setup, doPost, doGet, sheetList, clearExams};")();
const gs = globalThis.__gs;

const post = o => JSON.parse(gs.doPost({ postData: { contents: JSON.stringify(o) } }));
const get = q => JSON.parse(gs.doGet({ parameter: q || {} }));

/* ── 1. setup 을 안 눌러도 저절로 만들어지는가 ── */
console.log("[setup 을 누르지 않고 첫 요청]");
console.log("  요청 전   시트 " + sheets.size + "개");
get();
console.log("  GET 뒤    시트 " + sheets.size + "개");
console.log("  " + [...sheets.keys()].join(", "));

/* 두 번째 요청은 다시 훑지 않아야 한다 */
const before = sheets.size;
get();
console.log("  두 번째 GET 뒤 시트 " + sheets.size + "개" +
            (sheets.size === before ? " — 다시 훑지 않음" : " — 또 훑었다") + "\n");

/* ── 2. 응시 결과 세 건 (같은 회차 둘 + 다른 회차 하나) ── */
const exam = (name, method, subject, score, day) => ({
  type: "exam", name, level: "Level II", method, subject,
  total: subject === "General" ? 40 : 20,
  correct: Math.round(score * (subject === "General" ? 40 : 20) / 100),
  score, result: score >= 70 ? "합격" : "불합격",
  startedAt: `${day}T09:10:00+09:00`, finishedAt: `${day}T10:30:00+09:00`,
  durationSec: 4800, timestamp: `${day}T10:31:00+09:00`, date: day,
  questions: [{ id: 1 }], answers: { 0: 1 },
});

console.log("[응시 결과 넣기]");
for (const r of [
  exam("홍길동", "UT", "General", 88, "2026-05-20"),
  exam("김철수", "UT", "General", 65, "2026-05-20"),
  exam("박민수", "PT", "Specific", 80, "2026-06-11"),
]) console.log("  " + JSON.stringify(post(r)));

/* ── 3. sync ───────────────────────────────── */
console.log("\n[발급대장·만료예정 올리기]");
console.log("  " + JSON.stringify(post({
  type: "sync", asOf: "2026-08-26",
  certLog: [{
    key: "홍길동|Level II|UT", name: "홍길동", empNo: "2021-014", dept: "검사1팀",
    level: "Level II", method: "UT", certifiedAt: "2026-05-25", expiry: "2029-05-31",
    guessed: false, needsUT: false, utOk: false,
  }],
  expiry: [{
    key: "2026-08-26|자격|이영희|Level II|PT", asOf: "2026-08-26", kind: "자격",
    name: "이영희", empNo: "2019-003", dept: "검사2팀",
    level: "Level II", method: "PT", certifiedAt: "2023-09-10",
    expiry: "2026-09-30", daysLeft: 35, state: "warn",
  }],
})));

/* ── 4. 사람이 적은 칸을 지키는가 ───────────── */
const cert = sheets.get("E03-01 발급대장");
const ch = cert.rows[0];
cert.rows[1][ch.indexOf("발급일자")] = "2026-06-01";
cert.rows[1][ch.indexOf("수령확인")] = "홍길동";

console.log("\n[사람이 적은 칸을 지키는가]");
console.log("  사람이 적음  발급일자=2026-06-01  수령확인=홍길동");
post({
  type: "sync",
  certLog: [{
    key: "홍길동|Level II|UT", name: "홍길동", empNo: "2021-014", dept: "검사1팀",
    level: "Level II", method: "UT", certifiedAt: "2026-05-25", expiry: "2029-05-31",
    guessed: false, needsUT: false, utOk: false,
  }],
});
console.log("  다시 올린 뒤  발급일자=" + cert.rows[1][ch.indexOf("발급일자")] +
            "  수령확인=" + cert.rows[1][ch.indexOf("수령확인")] +
            "  (줄 수 " + (cert.rows.length - 1) + ")");

/* ── 5. 회차 집계 ──────────────────────────── */
console.log("\n[E02-07 채점결과]");
for (const r of get({ sheet: "E02-07 채점결과" })) {
  console.log(`  ${r["시행일자"]} ${r["등급"]} ${r["종목"]} ${r["시험"]}` +
              ` | 문항 ${r["출제문항"]} | 응시 ${r["응시인원"]} 합격 ${r["합격자"]}` +
              ` (${r["합격률"]}%) | ${r["응시자"]}`);
}

console.log("\n[시트 현황]");
for (const s of gs.sheetList()) console.log(`  ${s.name.padEnd(18)} ${s.rows}줄`);

/* ── 6. 예전 시트 옮기기 ─────────────────────── */
console.log("\n[예전 「시트1」 옮기기]");

/* 예전 스크립트가 남긴 꼴 그대로 — 머리행 없음, 아홉 칸 */
const old = new Sheet("시트1");
sheets.set("시트1", old);
[
  ["2026. 7. 23. 오후 1:01:56", "김가", "Level II", "RFT", "General", 9, "불합격", "[]", "{}"],
  ["2026. 7. 23. 오후 1:28:31", "이나", "Level II", "ECT", "General", 3, "불합격", "[]", "{}"],
  ["2026. 7. 23. 오후 1:38:07", "박다", "Level II", "ECT", "Specific", 0, "불합격", "[]", "{}"],
  ["2026. 7. 24. 오전 10:40:16", "최라", "Level II", "ECT", "General", 75, "합격", "[]", "{}"],
  ["", "", "", "", "", "", "", "", ""],
].forEach(r => old.appendRow(r));

/* 이미 응시기록에 줄이 있으면 멈춰야 한다 */
console.log("  줄이 있는 채로 : " + JSON.parse(gs.doGet({ parameter: { do: "migrate" } })).error);

/* 비우고 다시 */
const dest = sheets.get("응시기록");
const keepHead = dest.rows[0];
dest.rows = [keepHead];
sheets.get("E02-07 채점결과").rows = [sheets.get("E02-07 채점결과").rows[0]];

const res = JSON.parse(gs.doGet({ parameter: { do: "migrate" } }));
console.log("  " + res.message);

const moved = get();
console.log("\n  옮긴 줄");
for (const r of moved) {
  console.log(`    ${r.timestamp}  ${r.name}  ${r.level} ${r.method} ${r.subject}` +
              `  ${r.kind}  ${r.score}점  ${r.result}`);
}

console.log("\n  회차 집계");
for (const r of get({ sheet: "E02-07 채점결과" })) {
  console.log(`    ${r["시행일자"]}  ${r["종목"]} ${r["시험"]}  응시 ${r["응시인원"]}` +
              `  합격 ${r["합격자"]} (${r["합격률"]}%)  ${r["응시자"]}`);
}

console.log("\n  원본 「시트1」 " + old.rows.length + "줄 — 그대로 있음");

/* 요원 명부에 한 줄 — 비우기가 이걸 건드리지 않아야 한다 */
sheets.get("요원").appendRow(["홍길동", "검사1팀"]);

/* ── 7. 시험 삼아 친 기록 비우기 ─────────────── */
console.log("\n[비우기 — 뜻을 밝히기 전에는 세어만 준다]");

const dry = JSON.parse(gs.doGet({ parameter: { do: "clear" } }));
console.log("  " + dry.message);
console.log("  결과 : " + (dry.ok ? "★ 지워 버렸다" : "안 지웠다 (맞음)"));

const wasThere = gs.sheetList().filter(s => s.rows).map(s => `${s.name} ${s.rows}`).join(", ");
console.log("\n  비우기 전 : " + wasThere);

console.log("\n[정말 비우기 — confirm=yes]");
const done = JSON.parse(gs.doGet({ parameter: { do: "clear", confirm: "yes" } }));
console.log("  " + done.message);

const after = gs.sheetList().filter(s => s.rows).map(s => `${s.name} ${s.rows}`).join(", ");
console.log("\n  비운 뒤   : " + (after || "전부 비었음"));

const head = sheets.get("응시기록").rows[0] || [];
console.log("\n  응시기록 머리행 " + head.length + "칸 " + (head.length ? "남음 (맞음)" : "★ 사라졌다"));
/* 머리행 1 + 넣어 둔 1 = 2 줄이 그대로 있어야 한다 */
console.log("  요원 명부 " + sheets.get("요원").rows.length + "줄 " +
            (sheets.get("요원").rows.length === 2 ? "그대로 (맞음)" : "★ 건드렸다"));
