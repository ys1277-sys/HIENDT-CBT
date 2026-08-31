/*
 * 세는 문제인데 보기에 단위가 없는 것을 찾는다.
 *
 *   node tools/unit-check.mjs
 *
 * 「몇 개인가?」를 묻는데 보기가 「1 2 3 4」 로만 되어 있으면 우리말로는
 * 말이 안 된다. 「1개 2개 3개 4개」 여야 한다. 영문은 How many … 뒤에
 * 숫자만 와도 되지만 한글은 셈숱씨(수량 단위)를 붙여야 한다.
 *
 * 묻는 말에서 무엇을 세는지 읽어 내어, 붙일 단위까지 함께 알려 준다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";

/* 세는 것을 묻는 말 */
const ASK = /(몇\s*[가-힣]{0,3}(?:인가|입니까|이어야|가\s|을\s|는\s|\?)|how\s+many|how\s+much|number\s+of|최소\s*몇|적어도\s*몇)/i;

/* 보기가 맨 숫자인가 — 「3」 「3.5」 「3~4」 「3 또는 4」 */
const BARE = /^[\s]*[0-9]+(?:\s*[.,][0-9]+)?(?:\s*[~\-]\s*[0-9]+)?[\s]*$/;

/*
 * 무엇을 세는지에 따라 붙일 단위.
 * 위에 있는 것부터 맞춰 본다 — 좁은 것을 먼저 둔다.
 */
const UNIT = [
  [/시험편|시편|test\s*piece|specimen/i, "개"],
  [/불연속|discontinuit/i, "개"],
  [/문제|문항|question/i, "문항"],
  [/시간|hour/i, "시간"],
  [/일\b|day/i, "일"],
  [/개월|month/i, "개월"],
  [/년|year/i, "년"],
  [/퍼센트|percent|%/i, "%"],
  [/배\b|times/i, "배"],
  [/단계|step/i, "단계"],
  [/갈래|종류|type|kind/i, "가지"],
  [/사람|인원|personnel|candidate/i, "명"],
  [/층|layer|pass/i, "층"],
  [/방향|direction/i, "방향"],
  [/개\b|piece|item|number/i, "개"],
];

function unitFor(q) {
  const s = String(q.question || "");
  for (const [re, u] of UNIT) if (re.test(s)) return u;
  return "개";
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

let hit = 0;
for (const file of walk(ROOT).sort()) {
  let list;
  try { list = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(list) || !list[0] || !list[0].question) continue;

  const bad = [];
  for (const q of list) {
    const opts = q.options || [];
    if (opts.length < 2) continue;

    /* 우리말 줄만 본다 — 보기는 「영문↵한글」 꼴이다 */
    const ko = opts.map((o) => String(o).split("\n").pop().trim());
    if (!ko.every((o) => BARE.test(o))) continue;
    if (!ASK.test(String(q.question))) continue;

    bad.push({ q, ko });
  }

  if (!bad.length) continue;
  console.log("\n══ " + file.replace(ROOT + path.sep, "").replace(/\\/g, "/") + " ══");
  for (const { q, ko } of bad) {
    hit++;
    const u = unitFor(q);
    console.log("  [" + String(q.id).padStart(3) + "] " + String(q.question).replace(/\s+/g, " ").slice(0, 96));
    console.log("        지금 " + ko.join(" · ") + "   →   " + ko.map((o) => o + u).join(" · "));
  }
}

console.log("\n" + "─".repeat(70));
console.log(hit ? "단위가 빠진 보기 " + hit + "문항" : "단위가 빠진 보기 없음");
