/*
 * 문제은행을 원본 시험지와 통째로 맞대 본다.
 *
 * 번호로 짝지으면 안 된다. 은행 번호가 원본과 어긋나 있을 수 있다.
 * 문제 글로 짝짓고, 은행이 정답으로 고른 보기의 글이 원본 정답표가
 * 가리키는 보기와 같은지 본다. 보기 차례가 섞여 있어도 옳게 나온다.
 *
 * 원본 정답이 글자가 아닐 때가 있다.
 *   「B,C,E」  복수정답      → 은행 정답이 배열이어야 한다
 *   「합격」   답을 글로 적음 → 은행이 고른 보기의 글과 견준다
 */
import fs from "node:fs";
import { parsePaper } from "./parse-paper.mjs";
import { paperKey } from "./paper-key.mjs";

const G = "D:/Visual Studio Code/Level II 문제/Genernal(40문항)/";
const S = "D:/Visual Studio Code/Level II 문제/Specific(25문항)/";
const T = "D:/Visual Studio Code/Level III 문제/";

export const JOBS = [
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

const L = "ABCDEFGHIJ";

/*
 * 견줄 때는 영어와 숫자만 본다.
 *
 * 원본은 보기 안에 한국어를 괄호로 붙여 놓은 것이 많다.
 *   원본 : "Dipping in a solvent (솔벤트 속에 집어넣는다)"
 *   은행 : "Dipping in a solvent\n솔벤트 속에 집어넣는다"
 * 한국어까지 견주면 같은 보기인데도 다르다고 나온다.
 *
 * 원본은 보기를 a·b·c·d 로 부르고 화면은 ①②③④ 로 부른다.
 * 「Both a) and b)」와 「Both 1 and 2」는 같은 뜻이므로 맞춰 둔다.
 */
export const norm = (s) => String(s).split("\n")[0]
  /* 괄호 안에 한국어가 든 덩이는 통째로 뗀다. 그 안의 숫자까지 섞이면
     「Less than 45。 (45。 미만)」이 「lessthan4545」가 되어 어긋난다 */
  .replace(/\([^()]*[가-힣][^()]*\)/g, " ")
  .toLowerCase().replace(/[^a-z0-9]/g, "")
  .replace(/aandb/g, "1and2").replace(/aorb/g, "1or2")
  .replace(/bandc/g, "2and3").replace(/borc/g, "2or3");

/*
 * 원본에 오타가 있고 은행이 고쳐 둔 곳이 있다.
 *   원본 "the first critical angel"  →  은행 "the first critical angle"
 * 글자가 한둘 다를 뿐이면 같은 보기로 본다.
 */
export function near(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const [s, t] = a.length >= b.length ? [a, b] : [b, a];
  if (s.length - t.length > 2) return false;
  if (s.length < 8) return false;
  /* 앞뒤로 같은 만큼을 걷어내고 남은 길이가 짧으면 같은 것으로 본다 */
  let i = 0; while (i < t.length && s[i] === t[i]) i++;
  let j = 0; while (j < t.length - i && s[s.length-1-j] === t[t.length-1-j]) j++;
  return (s.length - i - j) <= 2;
}

/* 원본 정답 글자를 번호로. 「B,C,E」 → [1,2,4] */
const letters = (v) => {
  const m = String(v).toUpperCase().match(/\b[A-J]\b/g);
  if (!m) return null;
  const idx = m.map((c) => L.indexOf(c));
  return idx.every((i) => i >= 0) ? [...new Set(idx)].sort((a, b) => a - b) : null;
};

export function verify(bankPath, paperPaths) {
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const papers = [];
  for (const p of paperPaths) {
    let qs = [], key = null;
    try { qs = parsePaper(p); } catch (e) { }
    try { key = paperKey(p); } catch (e) { }
    papers.push({ p, qs, key });
  }

  const res = { ok: 0, ng: [], noPair: [], noKey: [], total: bank.length };

  for (const q of bank) {
    const kq = norm(q.question);
    let hit = null;
    for (const pp of papers) {
      const a = pp.qs.find((x) => norm(x.en) === kq) ||
                pp.qs.find((x) => near(norm(x.en), kq)) ||
                pp.qs.find((x) => norm(x.en).startsWith(kq.slice(0, 55)) && kq.length > 40) ||
                pp.qs.find((x) => kq.startsWith(norm(x.en).slice(0, 55)) && norm(x.en).length > 40);
      if (a) { hit = { a, pp }; break; }
    }
    if (!hit) { res.noPair.push(q); continue; }

    const raw = hit.pp.key ? hit.pp.key[hit.a.n] : null;
    if (!raw) { res.noKey.push([q, hit.a]); continue; }

    const mine = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort((a, b) => a - b);
    const want = letters(raw);

    if (want) {
      /* 은행이 고른 보기의 글이 원본에서 몇 번째인가 */
      const pos = mine.map((i) => {
        const t = norm(q.options[i]);
        let k = hit.a.opts.findIndex((o) => norm(o.en) === t);
        if (k < 0) k = hit.a.opts.findIndex((o) => near(norm(o.en), t));
        if (k < 0) k = hit.a.opts.findIndex((o) => norm(o.en).slice(0, 22) === t.slice(0, 22) && t.length > 12);
        return k;
      });
      if (pos.some((x) => x < 0)) { res.ng.push([q, hit.a, raw, "정답 보기를 원본에서 못 찾음"]); continue; }
      const got = [...new Set(pos)].sort((a, b) => a - b);
      if (JSON.stringify(got) === JSON.stringify(want)) res.ok++;
      else res.ng.push([q, hit.a, raw,
        "원본 " + want.map((i) => L[i]).join(",") + " → 은행 " + got.map((i) => L[i]).join(",")]);
    } else {
      /* 글로 적힌 답 — 은행이 고른 보기의 글과 견준다 */
      const t = norm(raw);
      const mineTxt = mine.map((i) => norm(q.options[i])).join("");
      if (mineTxt.includes(t.slice(0, 8)) || t.includes(mineTxt.slice(0, 8))) res.ok++;
      else res.ng.push([q, hit.a, raw, "원본 정답이 글로 적혀 있다 — 사람이 봐야 한다"]);
    }
  }
  return res;
}

const direct = process.argv[1] && process.argv[1].endsWith("verify-bank.mjs");
if (direct) {
  const only = process.argv[2];
  let TOK = 0, TNG = 0, TNP = 0, TNK = 0;
  console.log("은행".padEnd(13) + "문항".padStart(5) + "맞음".padStart(6) + "다름".padStart(6) +
    "원본에없음".padStart(11) + "정답표없음".padStart(11));
  for (const [name, bankPath, papers] of JOBS) {
    if (only && !name.includes(only)) continue;
    const r = verify(bankPath, papers);
    TOK += r.ok; TNG += r.ng.length; TNP += r.noPair.length; TNK += r.noKey.length;
    console.log(name.padEnd(13) + String(r.total).padStart(5) + String(r.ok).padStart(6) +
      String(r.ng.length).padStart(6) + String(r.noPair.length).padStart(11) + String(r.noKey.length).padStart(11));
  }
  console.log("-".repeat(52));
  console.log("합계".padEnd(13) + String(TOK+TNG+TNP+TNK).padStart(5) + String(TOK).padStart(6) +
    String(TNG).padStart(6) + String(TNP).padStart(11) + String(TNK).padStart(11));
}

/* 자세히 보기 : node tools/verify-bank.mjs --detail 일반/PT */
if (direct && process.argv[2] === "--detail") {
  const want = process.argv[3];
  const job = JOBS.find(([n]) => n === want);
  if (!job) { console.error("이름을 못 찾음 : " + want); process.exit(1); }
  const r = verify(job[1], job[2]);
  console.log(want + "  문항 " + r.total + " / 맞음 " + r.ok + " / 다름 " + r.ng.length +
    " / 원본에없음 " + r.noPair.length);
  const LL = "ABCDEFGHIJ";
  for (const [q, a, raw, why] of r.ng.slice(0, Number(process.argv[4] || 6))) {
    console.log("\n  은행 id" + q.id + " = 원본 " + a.n + "번   " + why + "   (원본 정답 " + raw + ")");
    console.log("     원본 물음 : " + a.en.slice(0, 86));
    console.log("     은행 물음 : " + String(q.question).split("\n")[0].slice(0, 86));
    a.opts.forEach((o, i) => console.log("      원본 " + LL[i] + ". " + o.en.slice(0, 66)));
    q.options.forEach((o, i) => console.log("      은행 " + LL[i] + ". " + String(o).split("\n")[0].slice(0, 66)));
    console.log("      은행이 고른 것 : " + (Array.isArray(q.answer) ? q.answer : [q.answer]).map((i) => LL[i]).join(","));
  }
}
