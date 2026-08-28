/*
 * 원본 시험지에 있는데 문제은행에 없는 문항을 찾는다.
 *
 * hwplib 의 parseExam 이 못 읽는 짜임이 있어 문항이 조용히 빠진 적이
 * 있다. PAUT 전문은 원본 31문항인데 은행에 25문항뿐이었다.
 * 한 번 겪었으니 전 종목을 같은 방법으로 훑는다.
 *
 * 읽기는 두 가지를 다 쓴다.
 *   parseExam        보통 짜임
 *   extract-2014     보기를 2단으로 짠 짜임
 * 둘 중 더 많이 읽은 쪽을 쓴다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { extract } from "./extract-2014.mjs";
import { parseAnswerKey } from "./anskey.mjs";

const G = "D:/Visual Studio Code/원본자료/Level II 문제/Genernal(40문항)/";
const S = "D:/Visual Studio Code/원본자료/Level II 문제/Specific(25문항)/";
const T = "D:/Visual Studio Code/원본자료/Level III 문제/";

const JOBS = [
  ["일반/ECT",  "public/data/Level II/General/ECT.json",  [G+"ECTG-II(B).hwp"]],
  ["일반/MT",   "public/data/Level II/General/MT.json",   [G+"MTG-II(A).hwp", G+"MTG-II(B).hwp"]],
  ["일반/PAUT", "public/data/Level II/General/PAUT.json", [G+"PAUT General - A 20200317.hwp", G+"PAUT General - B 20200317.hwp"]],
  ["일반/PT",   "public/data/Level II/General/PT.json",   [G+"PTG-II(A).hwp", G+"PTG-II(B).hwp"]],
  ["일반/RFT",  "public/data/Level II/General/RFT.json",  [G+"RFTG-II(B).hwp"]],
  ["일반/RT",   "public/data/Level II/General/RT.json",   [G+"RTG-II(A).hwp", G+"RTG-II(B).hwp"]],
  ["일반/TOFD", "public/data/Level II/General/TOFD.json", [G+"TOFD General - A 20200317.hwp", G+"TOFD General - B 20200317.hwp"]],
  ["일반/UT",   "public/data/Level II/General/UT.json",   [G+"UTG-II(A).hwp", G+"UTG-II(B).hwp"]],
  ["일반/VT",   "public/data/Level II/General/VT.json",   [G+"VTG-llA(개정판)-2016.10.18.hwp"]],

  ["전문/ECT",  "public/data/Level II/Specific/ECT.json",  [S+"ECTS-II.hwp"]],
  ["전문/MT",   "public/data/Level II/Specific/MT.json",   [S+"MTS-II(2020)(A).hwp", S+"MTS-II(2020)(B).hwp"]],
  ["전문/PAUT", "public/data/Level II/Specific/PAUT.json", [S+"PAUTSpec-II-A-type(2014).hwp", S+"PAUTSpec-II-B-type(2014).hwp"]],
  ["전문/PT",   "public/data/Level II/Specific/PT.json",   [S+"PTS-II(2020)(A).hwp", S+"PTS-II(2020)(B).hwp"]],
  ["전문/RFT",  "public/data/Level II/Specific/RFT.json",  [S+"RFTS-II.hwp"]],
  ["전문/RT",   "public/data/Level II/Specific/RT.json",   [S+"RTS-II(2020)(A).hwp", S+"RTS-II(2020)(B).hwp"]],
  ["전문/TOFD", "public/data/Level II/Specific/TOFD.json", [S+"TOFDSpec-II-A-type(2014).hwp", S+"TOFDSpec-II-B-type(2014).hwp"]],
  ["전문/UT",   "public/data/Level II/Specific/UT.json",   [S+"UTS-II(2020)(A).hwp", S+"UTS-II(2020)(B).hwp"]],
  ["전문/VT",   "public/data/Level II/Specific/VT.json",   [S+"VTS-II(2020)(A).hwp"]],

  ["LIII/Basic","public/data/Level III/Basic.json", [T+"basic/B-III.hwp"]],
  ["LIII/MT",   "public/data/Level III/MT.json",    [T+"문항추가/MTM-III.HWP", T+"Level III(2023년 edition) - B16.34(밸브)/MTS - III(Sec.I,Ⅲ,Ⅷ,API,B31.1,B16.34용) by SYH.hwp"]],
  ["LIII/PT",   "public/data/Level III/PT.json",    [T+"문항추가/PTM-III.HWP", T+"Level III(2023년 edition) - B16.34(밸브)/PTS - III(Sec.I,Ⅲ,Ⅷ,API,B31.1,B16.34용) by SYH.hwp"]],
  ["LIII/RT",   "public/data/Level III/RT.json",    [T+"문항추가/RTM-III.HWP", T+"Level III(2023년 edition) - B16.34(밸브)/RTS - III(Sec.I,Ⅲ,Ⅷ,API,B31.1,B16.34용) by SYH.hwp"]],
  ["LIII/UT",   "public/data/Level III/UT.json",    [T+"문항추가/UTM-III.HWP", T+"Level III(2023년 edition) - B16.34(밸브)/UTS - III(Sec.I,Ⅲ,Ⅷ,API,B31.1,B16.34용) by SYH.hwp"]],
  ["LIII/VT",   "public/data/Level III/VT.json",    [T+"Level III(2023년 edition) - B16.34(밸브)/VTS-IIIB(Sec.I,Ⅲ,Ⅷ,API,B31.1,B16.34용) by SYH.hwp"]],
];

const norm = (s) => String(s).split("\n")[0]
  .replace(/^\s*\([A-Za-z][A-Za-z,\s]{0,8}\)\s*/, "")
  .replace(/[가-힣]/g, " ")
  .toLowerCase().replace(/[^a-z0-9]/g, "");

/* 원본 오타를 은행이 고쳐 둔 곳을 같은 문항으로 본다 */
function same(a, b) {
  if (!a || !b) return false;
  if (a.startsWith(b.slice(0, 34)) || b.startsWith(a.slice(0, 34))) return true;
  const n = Math.min(a.length, b.length, 90);
  let diff = 0;
  for (let i = 0, j = 0; i < n && j < n; i++, j++) {
    if (a[i] === b[j]) continue;
    if (++diff > 3) return false;
    if (a[i + 1] === b[j]) i++;
    else if (a[i] === b[j + 1]) j++;
  }
  return diff <= 3;
}

/* 두 가지 읽기 가운데 더 많이 읽은 쪽 */
function read(file) {
  let a = [];
  try {
    const { text, picAnchors } = readHwp(file);
    a = parseExam(text, picAnchors).filter((q) => q.question)
      .map((q) => ({ no: q.no, en: String(q.question), opts: (q.options || []).length }));
  } catch {}
  let b = [];
  try { b = extract(file).map((q) => ({ no: q.no, en: q.en, opts: q.opts.length })); } catch {}
  return b.length > a.length ? b : a;
}

let total = 0;
const FOUND = {};
for (const [name, bankPath, papers] of JOBS) {
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const keys = bank.map((q) => norm(q.question));

  const rows = [];
  let miss = [];
  for (const p of papers) {
    const qs = read(p);
    let key = null;
    try {
      const { text } = readHwp(p);
      key = parseAnswerKey(text, { questionCount: 40, hasOptions: () => true }).key;
    } catch {}
    const keyN = Object.keys(key || {}).length;
    rows.push(path.basename(p).slice(0, 32).padEnd(34) + "읽은 " + String(qs.length).padStart(3) +
      " / 답지 " + String(keyN).padStart(3));

    /*
     * 읽은 문항 수가 답지 수와 다르면 제대로 못 읽은 것이다. 그 시험지의
     * 결과는 믿을 수 없으므로 「빠진 문항」을 말하지 않는다.
     *
     * 실제로 Level III 시험지에서 갑지 NOTE 를 4번 문항으로 읽어
     * 「빠진 문항 96개」라는 헛말을 한 적이 있다. 못 읽었으면 못 읽었다고
     * 해야지, 못 읽은 것을 빠진 것이라고 하면 안 된다.
     */
    if (!keyN || qs.length !== keyN) {
      rows[rows.length - 1] += "   ← 못 읽음. 이 시험지는 판단하지 않는다";
      continue;
    }

    for (const q of qs) {
      const t = norm(q.en);
      if (t.length < 20) continue;
      if (keys.some((k) => same(k, t))) continue;
      if (miss.some((m) => same(norm(m.en), t))) continue;
      miss.push({ ...q, paper: path.basename(p), ans: (key || {})[q.no] });
    }
  }

  console.log("=".repeat(76));
  console.log(name + "   은행 " + bank.length + "문항");
  rows.forEach((r) => console.log("   " + r));
  if (!miss.length) { console.log("   빠진 문항 없음"); continue; }
  console.log("   ▶ 은행에 없는 문항 " + miss.length + "개");
  for (const m of miss)
    console.log("      " + m.paper.slice(0, 20).padEnd(22) + m.no + "번  보기 " + m.opts +
      "개  답 " + (m.ans ?? "-") + "   " + m.en.replace(/\s+/g, " ").slice(0, 62));
  FOUND[name] = miss;
  total += miss.length;
}
console.log("\n" + (total ? "은행에 없는 문항 " + total + "개" : "빠진 문항 없음"));

/*
 * 찾은 것을 검수용으로 적어 둔다. 자동으로 문제은행에 넣지 않는다.
 *
 * 이 시험지들은 보기를 「A. … B. …」로 문항 글 안에 이어 써 놔서
 * 기계로 가르면 보기가 물음에 붙거나 한국어가 엉뚱한 보기에 붙는다.
 * 실제로 그렇게 나왔다. 사람이 옮겨 적어야 한다.
 */
if (process.argv.includes("--write") && total) {
  fs.mkdirSync("held", { recursive: true });
  const md = [
    "# 원본에 있으나 문제은행에 없는 문항", "",
    "`tools/missing-scan.mjs` 가 찾은 것이다. 읽은 문항 수가 답지 수와 맞는",
    "시험지만 판단했다. 맞지 않는 시험지는 「못 읽음」으로 두고 건드리지 않았다.", "",
    "**자동으로 넣지 않았다.** 이 시험지들은 보기를 「A. … B. …」로 문항 글 안에",
    "이어 써 놔서, 기계로 가르면 보기가 물음에 붙거나 한국어가 엉뚱한 보기에 붙는다.",
    "해당 종목 NDE Level Ⅲ 가 옮겨 적고 정답을 확인해 넣는다. (E02 6.1.2, 6.3.1)", "",
    "---", "",
  ];
  for (const [name, list] of Object.entries(FOUND)) {
    md.push("## " + name + "  " + list.length + "문항", "");
    for (const m of list) {
      md.push("### " + m.paper + "  " + m.no + "번   원본 답지 `" + (m.ans ?? "(없음)") + "`", "");
      md.push("```");
      md.push(String(m.en).replace(/\s+/g, " ").trim());
      md.push("```", "");
    }
  }
  fs.writeFileSync("held/원본에 있으나 은행에 없는 문항.md", md.join("\n"));
  console.log("held/원본에 있으나 은행에 없는 문항.md 에 적었다");
}
