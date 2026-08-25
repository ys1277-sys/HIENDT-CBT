/*
 * 원본 시험지(.hwp)에서 문항과 보기를 뽑는다.
 *
 * 갑지의 NOTE 도 「1. 2. 3.」로 시작해 문항처럼 보인다. 보기(a.)가
 * 뒤따르는 「1.」을 진짜 시작으로 삼는다.
 */
import { readRich } from "./hwprich.mjs";

export function parsePaper(file) {
  const doc = readRich(file);
  const L = [];
  (function w(bs){for(const b of bs){
    if(b.t==="p") L.push(String(b.s).replace(/\s+/g," ").trim());
    else if(b.t==="table") for(const r of b.grid) for(const c of r) if(c&&c!=="covered") w(c.blocks);
  }})(doc.blocks);

  /* 보기가 뒤따르는 「1.」 찾기 */
  let start = -1;
  for (let i = 0; i < L.length; i++) {
    if (!/^1\.\s/.test(L[i])) continue;
    if (L.slice(i + 1, i + 14).some((s) => /^a\.\s/.test(s))) { start = i; break; }
  }
  if (start < 0) throw new Error("문항 시작을 못 찾음 : " + file);

  const qs = [];
  let cur = null, slot = null;

  for (const s of L.slice(start)) {
    if (!s) continue;
    /* 쪽 머리글은 건너뛴다 */
    if (/^(HANKUK|Examination Series|NAME|PAGE OF|_{5,}|NDE Level|SCORE|Start :|Question approved)/.test(s)) continue;

    const mq = s.match(/^(\d{1,2})\.\s+(.*)$/);
    const mo = s.match(/^([a-d])\.\s*(.*)$/);

    if (mq && cur === null && Number(mq[1]) === 1) {
      cur = { n: 1, en: mq[2], ko: "", opts: [] }; qs.push(cur); slot = "q"; continue;
    }
    if (mq && cur && Number(mq[1]) === cur.n + 1) {
      cur = { n: cur.n + 1, en: mq[2], ko: "", opts: [] }; qs.push(cur); slot = "q"; continue;
    }
    if (!cur) continue;

    /*
     * 2단으로 짠 시험지는 「a. … b. …」가 한 줄에 붙어 나온다.
     * 다음 보기 글자 앞에서 끊는다.
     */
    if (mo && cur.opts.length < 4) {
      const parts = s.split(/(?<=\s)(?=[b-d]\.\s*[A-Za-z0-9(])/);
      let okAll = true;
      const buf = [];
      for (const part of parts) {
        const m2 = part.trim().match(/^([a-d])\.\s*(.*)$/);
        if (!m2) { okAll = false; break; }
        buf.push(m2);
      }
      if (okAll && buf[0][1] === "abcd"[cur.opts.length]) {
        for (const m2 of buf) cur.opts.push({ L: m2[1], en: m2[2].trim(), ko: "" });
        slot = "o"; continue;
      }
    }

    const tgt = slot === "q" ? cur : cur.opts[cur.opts.length - 1];
    if (!tgt) continue;
    if (/[가-힣]/.test(s)) tgt.ko += (tgt.ko ? " " : "") + s;
    else tgt.en += " " + s;
  }
  return qs;
}

/* 이 파일을 바로 실행했을 때만 아래를 돈다. import 될 때는 돌지 않는다 */
const direct = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("parse-paper.mjs");

if (direct && process.argv[2]) {
  const qs = parsePaper(process.argv[2]);
  console.log(process.argv[2].split("/").pop());
  console.log("  문항 " + qs.length + "개");
  const bad = qs.filter((q) => q.opts.length !== 4);
  console.log("  보기가 4개가 아닌 것 : " + (bad.map((q) => q.n + "→" + q.opts.length).join(", ") || "없음"));
  if (process.argv[3] === "-v")
    for (const q of qs) {
      console.log("\n" + q.n + ". " + q.en.slice(0, 90));
      q.opts.forEach((o) => console.log("   " + o.L + ". " + o.en.slice(0, 74)));
    }
}
