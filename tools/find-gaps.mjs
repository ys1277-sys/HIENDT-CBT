/*
 * 원본 시험지에는 있는데 JSON 은행에 없는 문항을 찾는다.
 *
 * 파서가 앞 문항의 선택지 안으로 빨아들여버린 문항들이 있어
 * 은행이 요구 문항수에 못 미치고 있다. 그것들을 되살리는 게 목적이다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAnswerKey } from "./anskey.mjs";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const SRC = "D:/Visual Studio Code/Level II 문제";

/* 은행 -> 원본 파일들 */
const MAP = {
  "General/PAUT": ["Genernal(40문항)/PAUT General - A 20200317.hwp", "Genernal(40문항)/PAUT General - B 20200317.hwp"],
  "General/RT": ["Genernal(40문항)/RTG-II(A).hwp", "Genernal(40문항)/RTG-II(B).hwp"],
  "General/TOFD": ["Genernal(40문항)/TOFD General - A 20200317.hwp", "Genernal(40문항)/TOFD General - B 20200317.hwp"],
  "Specific/PT": ["Specific(25문항)/PTS-II(2020)(A).hwp", "Specific(25문항)/PTS-II(2020)(B).hwp"],
  "Specific/RT": ["Specific(25문항)/RTS-II(2020)(A).hwp", "Specific(25문항)/RTS-II(2020)(B).hwp"],
  "Specific/MT": ["Specific(25문항)/MTS-II(2020)(A).hwp", "Specific(25문항)/MTS-II(2020)(B).hwp"],
  "Specific/UT": ["Specific(25문항)/UTS-II(2020)(A).hwp", "Specific(25문항)/UTS-II(2020)(B).hwp"],
  "Specific/PAUT": ["Specific(25문항)/PAUTSpec-II-A-type(2014).hwp", "Specific(25문항)/PAUTSpec-II-B-type(2014).hwp"],
  "Specific/TOFD": ["Specific(25문항)/TOFDSpec-II-A-type(2014).hwp", "Specific(25문항)/TOFDSpec-II-B-type(2014).hwp"],
};

/* 출제자용 분류 태그는 JSON 에서 이미 뺐으므로 원본에서도 빼고 비교한다 */
const TAG = /^\s*[(（]\s*[EPTSA](\s*[,，]\s*[EPTSA])*\s*[)）]\s*/;
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
/* 앞머리 45자가 같으면 같은 문항으로 본다 */
const sig = (s) => norm(String(s).split("\n")[0].replace(TAG, "")).slice(0, 45);

let log = "";
let grand = 0;

for (const [bank, files] of Object.entries(MAP)) {
  const raw = fs.readFileSync(`${PUB}/Level II/${bank}.json`, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const have = new Set(items.map((q) => sig(q.question)).filter((s) => s.length >= 12));

  const missing = [];
  for (const rf of files) {
    const f = path.join(SRC, rf);
    let text, picAnchors;
    try { ({ text, picAnchors } = readHwp(f)); } catch { continue; }

    const qs = parseExam(text, picAnchors).filter((q) => q.question);
    if (!qs.length) continue;
    const byNo = new Map(qs.map((q) => [q.no, q]));
    let key = {};
    try {
      ({ key } = parseAnswerKey(text, {
        questionCount: Math.max(...qs.map((q) => q.no)),
        hasOptions: (no) => {
          const q = byNo.get(no);
          return !!(q && Array.isArray(q.options) && q.options.length >= 2);
        },
      }));
    } catch { /* 답지 없으면 빈 채로 */ }

    for (const q of qs) {
      const s = sig(q.question);
      if (s.length < 12 || have.has(s)) continue;
      have.add(s);   /* A/B 양쪽에 같은 게 있으면 한 번만 */
      missing.push({ src: path.basename(rf), no: q.no, q, ans: key[q.no] });
    }
  }

  if (!missing.length) continue;
  grand += missing.length;
  log += `\n${"=".repeat(76)}\n### Level II/${bank}  현재 ${items.length}문항, 원본에만 있는 것 ${missing.length}건\n`;
  for (const m of missing) {
    log += `\n[${m.src} Q${m.no}]  답지: ${JSON.stringify(m.ans)}  선택지 ${(m.q.options || []).length}개\n`;
    log += `${String(m.q.question).replace(/\s+/g, " ").slice(0, 300)}\n`;
    (m.q.options || []).forEach((o, i) =>
      (log += `   ${"abcde"[i]}. ${String(o).replace(/\s+/g, " ").slice(0, 190)}\n`));
  }
}

log = `원본에만 있는 문항 합계 ${grand}건\n` + log;
fs.writeFileSync("find-gaps-out.txt", log, "utf8");
console.log(log.slice(0, 400));
