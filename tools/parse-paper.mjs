/*
 * 원본 시험지(.hwp)에서 문항과 보기를 뽑는다.
 *
 * 시험지마다 짜임이 다르다.
 *   가) 「1. 물음」 뒤에 「a. 보기」        (TOFD, PAUT)
 *   나) 번호 없이 물음 뒤에 「A. 보기 B. 보기」  (ECT, PT, RT, UT …)
 *       한글 자동번호가 글로 딸려 나오지 않아 번호가 통째로 없다.
 *   다) 보기 둘이 한 줄에 붙은 2단 편집
 *   라) 첫 보기의 「A.」가 빠진 것  「95% B. 175% C. 50%」
 *
 * 번호가 없으면 나온 차례대로 1번부터 매긴다. 원본 정답표도 차례대로
 * 매겨져 있으므로 이렇게 해야 짝이 맞는다.
 */
import { readRich } from "./hwprich.mjs";

const HEAD = /^(HANKUK|Examination Series|NAME\s*[::]|PAGE OF|_{5,}|NDE Level|SCORE|Start\s*[::]|Question approved|Approved by|NOTE\s*[::]|〓|Answer$|문제$|해답$)/i;
const KO = /[가-힣]/;

/* 「a. …」 또는 「A. …」로 시작하는 줄인가 */
const optHead = (s) => s.match(/^([a-dA-D])[.)]\s*(.*)$/);

/* 한 줄에 여러 보기가 붙어 있으면 가른다 */
function splitOpts(s) {
  const parts = s.split(/(?<=[\s)])(?=[b-dB-D][.)]\s*\S)/);
  const out = [];
  for (const p of parts) {
    const m = p.trim().match(/^([a-dA-D])[.)]\s*(.*)$/);
    if (!m) return null;
    out.push({ L: m[1].toLowerCase(), en: m[2].trim() });
  }
  return out.length ? out : null;
}

export function parsePaper(file) {
  const doc = readRich(file);
  const L = [];
  (function w(bs){for(const b of bs){
    if(b.t==="p") L.push(String(b.s).replace(/\s+/g," ").trim());
    else if(b.t==="table") for(const r of b.grid) for(const c of r) if(c&&c!=="covered") w(c.blocks);
  }})(doc.blocks);

  /*
   * 갑지의 NOTE 도 「1. 2. 3.」로 시작해 문항처럼 보인다. 갑지는
   * 「Question approved by / Approved by」로 끝나므로 그 뒤부터 읽는다.
   */
  let from = 0;
  for (let i = L.length - 1; i >= 0; i--) {
    if (/^(Question approved by|Approved by)/i.test(L[i].trim())) { from = i + 1; break; }
  }
  if (from === 0) {
    const note = L.findIndex((s) => /^NOTE\s*[::]/i.test(s.trim()));
    if (note >= 0) from = note + 1;
  }

  const qs = [];
  let cur = null, slot = null, numbered = false;

  for (const raw of L.slice(from)) {
    const s = raw.trim();
    if (!s || HEAD.test(s)) continue;
    /* 정답표에 이르면 멈춘다 */
    if (/^(문제|해답)$/.test(s)) break;

    /* 가) 번호가 붙은 물음 */
    const mq = s.match(/^(\d{1,2})[.)]\s+(.+)$/);
    if (mq && /[A-Za-z]{3}/.test(mq[2]) && !optHead(mq[2])) {
      const n = Number(mq[1]);
      if ((!cur && n === 1) || (cur && n === cur.n + 1)) {
        cur = { n, en: mq[2], ko: "", opts: [] }; qs.push(cur); slot = "q"; numbered = true; continue;
      }
    }

    /* 보기 줄 */
    if (cur && cur.opts.length < 10) {
      const parts = splitOpts(s);
      if (parts && parts[0].L === "abcdefghij"[cur.opts.length]) {
        for (const p of parts) cur.opts.push({ L: p.L, en: p.en, ko: "" });
        slot = "o"; continue;
      }
      /* 라) 첫 보기의 글자가 빠진 것 — 「95% B. 175% …」 */
      if (cur.opts.length === 0 && /(?<=[\s)])[bB][.)]\s*\S/.test(s)) {
        const i = s.search(/(?<=[\s)])[bB][.)]\s*\S/);
        const rest = splitOpts(s.slice(i));
        if (rest && rest[0].L === "b") {
          cur.opts.push({ L: "a", en: s.slice(0, i).trim(), ko: "" });
          for (const p of rest) cur.opts.push({ L: p.L, en: p.en, ko: "" });
          slot = "o"; continue;
        }
      }
    }

    /* 나) 번호 없는 물음 — 보기를 채운 뒤 나오는 영어 줄이 다음 물음이다 */
    if (!numbered && /[A-Za-z]{4}/.test(s) && !KO.test(s.slice(0, 12)) &&
        (!cur || cur.opts.length >= 2)) {
      cur = { n: qs.length + 1, en: s, ko: "", opts: [] }; qs.push(cur); slot = "q"; continue;
    }

    if (!cur) continue;
    const tgt = slot === "q" ? cur : cur.opts[cur.opts.length - 1];
    if (!tgt) continue;
    if (KO.test(s)) tgt.ko += (tgt.ko ? " " : "") + s;
    else tgt.en += " " + s;
  }

  return qs;
}

const direct = process.argv[1] && process.argv[1].endsWith("parse-paper.mjs");

if (direct && process.argv[2]) {
  for (const f of process.argv.slice(2).filter((x) => x !== "-v")) {
    const qs = parsePaper(f);
    const bad = qs.filter((q) => q.opts.length < 2);
    console.log(f.split("/").pop().padEnd(46) + "  문항 " + String(qs.length).padStart(3) +
      (bad.length ? "  보기가 모자란 것 " + bad.map((q) => q.n).join(",") : ""));
    if (process.argv.includes("-v"))
      for (const q of qs) {
        console.log("\n" + q.n + ". " + q.en.slice(0, 88));
        q.opts.forEach((o) => console.log("   " + o.L + ". " + o.en.slice(0, 72)));
      }
  }
}
