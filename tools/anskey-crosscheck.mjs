/*
 * 문제은행의 정답을 원본 시험지의 답지와 하나하나 맞대 본다.
 *
 * tools/verify.mjs 는 채점 경로가 성한지를 본다(만점자가 100점을 받는지).
 * 답이 원본과 같은지는 보지 않는다. 이 파일이 그것을 본다.
 *
 * 읽기는 이미 있는 것을 쓴다.
 *   hwplib.readHwp / parseExam  원본에서 문항과 보기를 뽑는다
 *   anskey.parseAnswerKey       원본 답지를 읽는다 (블록형·격자형·각주)
 *
 * 맞대는 방법
 *   번호로 짝지으면 안 된다. 은행 id 가 원본 번호와 어긋난 곳이 있다.
 *   문제 글로 짝짓고, 은행이 정답으로 고른 보기의 글이 답지가 가리키는
 *   보기와 같은지 본다. 보기 차례가 섞여 있어도 이렇게 하면 옳게 나온다.
 *
 * 헛것으로 걸리기 쉬운 것들 — 견주기 전에 걷어낸다
 *   원본 보기에 한국어가 괄호로 붙어 있다
 *     원본 "Dipping in a solvent (솔벤트 속에 집어넣는다)"
 *     은행 "Dipping in a solvent\n솔벤트 속에 집어넣는다"
 *   괄호 속 숫자가 섞인다  "Less than 45。 (45。 미만)" → lessthan4545
 *   원본 오타를 은행이 고쳐 두었다  원본 "critical angel" → 은행 "angle"
 *   보기를 부르는 이름이 다르다  원본 "Both a) and b)" → 은행 "Both 1 and 2"
 */
import fs from "node:fs";
import { readHwp, parseExam } from "./hwplib.mjs";
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

const L = "ABCDEFGHIJ";

/*
 * 로마숫자는 반드시 숫자로 바꿔 두어야 한다.
 * 그냥 지우면 「material Ⅰ could be used…」와 「material Ⅱ could be used…」가
 * 똑같아져 서로 다른 보기를 같은 것으로 본다. 실제로 이것 때문에
 * 멀쩡한 정답이 틀렸다고 나왔다.
 */
const ROMAN = { "Ⅰ":"1","Ⅱ":"2","Ⅲ":"3","Ⅳ":"4","Ⅴ":"5","Ⅵ":"6","Ⅶ":"7","Ⅷ":"8",
                "Ⅸ":"9","Ⅹ":"10","Ⅺ":"11","Ⅻ":"12",
                "ⅰ":"1","ⅱ":"2","ⅲ":"3","ⅳ":"4","ⅴ":"5","ⅵ":"6","ⅶ":"7","ⅷ":"8",
                "ⅸ":"9","ⅹ":"10","ⅺ":"11","ⅻ":"12" };

/* 견줄 때는 영어와 숫자만 남긴다 */
const norm = (s) => String(s)
  .replace(/[Ⅰ-ⅻ]/g, (c) => ROMAN[c] || c)
  /* 온도 단위도 지우면 안 된다. 「60 ℃」와 「60 ℉」가 같아져 버린다 */
  .replace(/℃|°\s*C\b/g, "degc").replace(/℉|°\s*F\b/g, "degf")
  .replace(/\([^()]*[가-힣][^()]*\)/g, " ")   /* 괄호로 붙인 한국어를 뗀다 */
  .replace(/[가-힣]/g, " ")
  .toLowerCase().replace(/[^a-z0-9]/g, "")
  .replace(/aandb/g, "1and2").replace(/aorb/g, "1or2")
  .replace(/bandc/g, "2and3").replace(/borc/g, "2or3");

/* 글자가 한둘 다를 뿐이면 같은 것으로 본다 (원본 오타를 은행이 고친 곳) */
function near(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const [s, t] = a.length >= b.length ? [a, b] : [b, a];
  if (s.length - t.length > 2 || t.length < 8) return false;
  let i = 0; while (i < t.length && s[i] === t[i]) i++;
  let j = 0; while (j < t.length - i && s[s.length - 1 - j] === t[t.length - 1 - j]) j++;
  return (s.length - i - j) <= 2;
}

/* 답지 글자를 보기 번호로.  "B,C,E" → [1,2,4] */
const letters = (v) => {
  const s = String(v).trim();
  if (!/^[A-Za-z](?:\s*[,·\/]\s*[A-Za-z]|\s+[A-Za-z](?=\s|$))*$/.test(s)) return null;
  const idx = s.split(/[,·\/\s]+/).filter(Boolean).map((c) => L.indexOf(c.toUpperCase()));
  return idx.every((i) => i >= 0) ? [...new Set(idx)].sort((a, b) => a - b) : null;
};

function loadPapers(paths) {
  const out = [];
  for (const p of paths) {
    try {
      const { text, picAnchors } = readHwp(p);
      const qs = parseExam(text, picAnchors).filter((q) => q.question);
      const byNo = new Map(qs.map((q) => [q.no, q]));
      const hasOptions = (no) => {
        const q = byNo.get(no);
        return !!(q && Array.isArray(q.options) && q.options.length >= 2);
      };
      const { key } = parseAnswerKey(text, {
        questionCount: qs.length ? Math.max(...qs.map((q) => q.no)) : 0,
        hasOptions,
      });
      out.push({ p, qs, key: key || {} });
    } catch (e) {
      out.push({ p, qs: [], key: {}, err: e.message });
    }
  }
  return out;
}

export function crosscheck(bankPath, paperPaths) {
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const papers = loadPapers(paperPaths);
  const r = { total: bank.length, ok: 0, ng: [], noPair: [], noKey: [], human: [] };

  for (const q of bank) {
    const kq = norm(String(q.question).split("\n")[0]);
    let hit = null;
    for (const pp of papers) {
      const a = pp.qs.find((x) => norm(x.question) === kq || norm(x.question).startsWith(kq)) ||
                pp.qs.find((x) => near(norm(x.question).slice(0, kq.length), kq)) ||
                (kq.length > 40 ? pp.qs.find((x) => norm(x.question).includes(kq.slice(0, 45))) : null);
      if (a) { hit = { a, pp }; break; }
    }
    if (!hit) { r.noPair.push(q); continue; }

    const raw = hit.pp.key[hit.a.n ?? hit.a.no];
    if (raw === undefined) { r.noKey.push([q, hit.a]); continue; }

    const want = letters(raw);
    const mine = (Array.isArray(q.answer) ? q.answer : [q.answer]).slice().sort((x, y) => x - y);

    if (!want) {
      /* 답지에 글로 적힌 답. 기계가 판정할 수 없다 */
      const t = norm(raw), got = mine.map((i) => norm(q.options[i])).join("");
      if (t && got && (got.includes(t.slice(0, 8)) || t.includes(got.slice(0, 8)))) r.ok++;
      else r.human.push([q, hit.a, raw]);
      continue;
    }

    /* 원본에서 보기를 못 뽑은 문항이 있다. 기계로는 판정할 수 없다 */
    const src = Array.isArray(hit.a.options) ? hit.a.options : null;
    if (!src || src.length < 2) { r.human.push([q, hit.a, raw, "원본에서 보기를 못 읽음"]); continue; }

    /*
     * 어느 보기인지 고를 때 「앞 20글자가 같으면 그것」으로 하면 안 된다.
     *   C. The near distance vision examination shall be …
     *   D. The near distance vision acuity requirement is …
     * 앞이 한참 같아 먼저 나온 C 를 골라 버린다. 앞이 같은 길이를 모두
     * 재서 가장 긴 하나만 고르고, 2등과 뚜렷이 차이 날 때만 인정한다.
     */
    const srcN = src.map((o) => norm(String(o).split("\n")[0]));
    const pos = mine.map((i) => {
      const t = norm(String(q.options[i]).split("\n")[0]);
      let k = srcN.indexOf(t);
      if (k >= 0) return k;
      k = srcN.findIndex((o) => near(o, t));
      if (k >= 0) return k;
      if (t.length < 12) return -1;

      const pre = (a, b) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n; };
      const score = srcN.map((o) => pre(o, t));
      const best = Math.max(...score);
      if (best < t.length * 0.6) return -1;
      const win = score.filter((v) => v === best).length;
      const second = Math.max(...score.filter((v) => v !== best), 0);
      if (win !== 1 || best - second < 4) return -1;
      return score.indexOf(best);
    });
    if (pos.some((x) => x < 0)) { r.human.push([q, hit.a, raw, "정답 보기를 원본에서 못 찾음"]); continue; }

    const got = [...new Set(pos)].sort((a, b) => a - b);
    if (JSON.stringify(got) === JSON.stringify(want)) r.ok++;
    else r.ng.push([q, hit.a, raw,
      "원본 " + want.map((i) => L[i]).join(",") + " → 은행 " + got.map((i) => L[i]).join(",")]);
  }
  return r;
}

const direct = process.argv[1] && process.argv[1].endsWith("anskey-crosscheck.mjs");
if (direct) {
  const detail = process.argv[2] === "--detail" ? process.argv[3] : null;

  if (detail) {
    const job = JOBS.find(([n]) => n === detail);
    if (!job) { console.error("이름을 못 찾음 : " + detail); process.exit(1); }
    const r = crosscheck(job[1], job[2]);
    console.log(detail + "  문항 " + r.total + " / 맞음 " + r.ok + " / ★다름 " + r.ng.length +
      " / 사람이 볼 것 " + r.human.length + " / 원본에없음 " + r.noPair.length + " / 답지없음 " + r.noKey.length);
    const dump = (title, list) => {
      if (!list.length) return;
      console.log("\n" + "=".repeat(72) + "\n" + title);
      for (const [q, a, raw, why] of list) {
        console.log("\n  은행 id" + q.id + " = 원본 " + (a.no ?? a.n) + "번   답지 「" + raw + "」   " + (why || ""));
        console.log("     " + String(a.question).replace(/\s+/g, " ").slice(0, 88));
        (a.options||[]).forEach((o, i) => console.log("      원본 " + L[i] + ". " + String(o).replace(/\s+/g, " ").slice(0, 62)));
        (Array.isArray(q.answer) ? q.answer : [q.answer]).forEach((i) =>
          console.log("      은행 정답 : " + String(q.options[i]).split("\n")[0].slice(0, 62)));
      }
    };
    dump("★ 답이 다른 것", r.ng);
    dump("사람이 봐야 할 것", r.human.slice(0, 12));
    process.exit(0);
  }

  let TOK = 0, TNG = 0, THU = 0, TNP = 0, TNK = 0;
  console.log("은행".padEnd(13) + "문항".padStart(5) + "맞음".padStart(6) + "★다름".padStart(7) +
    "사람이볼것".padStart(11) + "원본에없음".padStart(11) + "답지없음".padStart(9));
  console.log("-".repeat(62));
  for (const [name, bankPath, papers] of JOBS) {
    const r = crosscheck(bankPath, papers);
    TOK += r.ok; TNG += r.ng.length; THU += r.human.length; TNP += r.noPair.length; TNK += r.noKey.length;
    console.log(name.padEnd(13) + String(r.total).padStart(5) + String(r.ok).padStart(6) +
      String(r.ng.length).padStart(7) + String(r.human.length).padStart(11) +
      String(r.noPair.length).padStart(11) + String(r.noKey.length).padStart(9));
  }
  console.log("-".repeat(62));
  console.log("합계".padEnd(13) + String(TOK + TNG + THU + TNP + TNK).padStart(5) + String(TOK).padStart(6) +
    String(TNG).padStart(7) + String(THU).padStart(11) + String(TNP).padStart(11) + String(TNK).padStart(9));
  console.log("\n자세히 : node tools/anskey-crosscheck.mjs --detail 일반/PT");
}
