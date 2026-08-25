/*
 * 2014년 판 전문 시험지에서 문제은행에 빠진 문항을 되살린다.
 *
 * hwplib 의 parseExam 이 2단으로 짠 보기를 못 읽어, 문항을 옮길 때
 * 조용히 빠졌다. PAUT 전문은 원본이 31문항인데 은행에는 25문항뿐이었다.
 *
 * 새로 짓는 것이 아니라 원본에 있는 것을 그대로 옮긴다. 정답도 원본
 * 답지를 그대로 쓴다. 그래서 E02 6.1.2 의 「새 문항 등록」이 아니라
 * 옮기다 빠진 것을 채우는 일이다.
 *
 * 쓰임 : node tools/add-missing-2014.mjs [--dry]
 */
import fs from "node:fs";
import { extract } from "./extract-2014.mjs";
import { parseAnswerKey } from "./anskey.mjs";
import { readHwp } from "./hwplib.mjs";

const DRY = process.argv.includes("--dry");
const S = "D:/Visual Studio Code/Level II 문제/Specific(25문항)/";

const G = "D:/Visual Studio Code/Level II 문제/Genernal(40문항)/";

const JOBS = [
  ["PAUT", "Specific", "public/data/Level II/Specific/PAUT.json", S + "PAUTSpec-II-A-type(2014).hwp"],
  ["TOFD", "Specific", "public/data/Level II/Specific/TOFD.json", S + "TOFDSpec-II-A-type(2014).hwp"],
  ["PAUT", "General",  "public/data/Level II/General/PAUT.json",  G + "PAUT General - A 20200317.hwp"],
];

const norm = (s) => String(s).split("\n")[0]
  .replace(/^\s*\([A-Za-z][A-Za-z,\s]{0,8}\)\s*/, "")
  .replace(/[가-힣]/g, " ")
  .toLowerCase().replace(/[^a-z0-9]/g, "");

/* 앞 34글자가 같거나, 글자 몇 개만 다르면 같은 문항으로 본다 */
function same(a, b) {
  if (!a || !b) return false;
  if (a.startsWith(b.slice(0, 34)) || b.startsWith(a.slice(0, 34))) return true;
  const n = Math.min(a.length, b.length, 90);
  let diff = 0;
  for (let i = 0, j = 0; i < n && j < n; i++, j++) {
    if (a[i] === b[j]) continue;
    if (++diff > 3) return false;
    /* 한쪽에 글자가 하나 더 있는 경우를 넘긴다 */
    if (a[i + 1] === b[j]) i++;
    else if (a[i] === b[j + 1]) j++;
  }
  return diff <= 3;
}

for (const [method, category, bankPath, paperPath] of JOBS) {
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const keys = bank.map((q) => norm(q.question));

  const paper = paperPath.split("/").pop();
  const qs = extract(paperPath);
  const { text } = readHwp(paperPath);
  const { key } = parseAnswerKey(text, { questionCount: category === "General" ? 40 : 31, hasOptions: () => true });

  const add = [];
  for (const q of qs) {
    const t = norm(q.en);
    if (t.length < 20) continue;                       /* 한국어뿐인 문항은 건드리지 않는다 */
    if (q.opts.length !== 4) continue;                 /* 보기를 다 못 읽은 것은 넘긴다 */
    if (q.opts.some((o) => o.koMerged)) continue;
    /* 숫자나 공식뿐인 보기는 옮길 한국어가 없다. 영어 낱말이 있는데 없을 때만 넘긴다 */
    if (q.opts.some((o) => !o.ko && /[A-Za-z]{4}/.test(o.en))) continue;
    /*
     * 앞부분만 견주면 원본 오타를 은행이 고쳐 둔 곳을 못 알아본다.
     *   원본 "With which formular is it possible…"
     *   은행 "With which formula  is it possible…"
     * 글자 몇 개 차이는 같은 문항으로 본다. 아니면 있는 문항을 또 넣는다.
     */
    if (keys.some((k) => same(k, t))) continue;

    const ans = String((key || {})[q.no] || "").trim().toLowerCase();
    const idx = "abcd".indexOf(ans);
    if (idx < 0) { console.log("  ! " + method + " " + q.no + "번 답지가 글자가 아니다 : " + ans); continue; }

    add.push({ q, idx });
  }

  console.log("=".repeat(74));
  console.log(method + " " + category + "   원본 " + qs.length + "문항 / 은행 " + bank.length + "문항 / 되살릴 것 " + add.length);

  let id = Math.max(0, ...bank.map((x) => Number(x.id) || 0));
  for (const { q, idx } of add) {
    id++;
    const item = {
      id,
      level: "Level II",
      method,
      category,
      source: paper.replace(/\.hwp$/i, ""),
      question: q.en.trim() + "\n" + q.ko.trim(),
      /* 숫자·공식뿐인 보기는 옮길 한국어가 없다. 빈 줄을 달지 않는다 */
      options: q.opts.map((o) => (o.ko ? o.en.trim() + "\n" + o.ko.trim() : o.en.trim())),
      answer: idx,
      note: "원본 " + q.no + "번. 2단으로 짠 보기를 읽지 못해 옮길 때 빠져 있던 것을 되살렸다. " +
            "정답은 원본 답지 " + "abcd"[idx] + " 그대로다.",
    };
    bank.push(item);
    console.log("  + id" + id + "  (원본 " + q.no + "번, 답 " + "abcd"[idx] + ")  " + q.en.slice(0, 66));
  }

  if (add.length && !DRY) fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2) + "\n");
}
console.log("\n" + (DRY ? "[미리보기]" : "넣었다"));
