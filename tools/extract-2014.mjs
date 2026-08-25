/*
 * 2014년 판 PAUT·TOFD 전문 시험지에서 문항을 통째로 뽑는다.
 *
 * hwplib 의 parseExam 은 이 시험지를 다 못 읽는다. 보기를 2단으로 짜
 * 「a. 보기 b. 보기」가 한 줄에 붙고, 한국어도 두 보기 몫이 한 줄에
 * 붙어 나오기 때문이다.
 *
 *   3. (E)For a 7Mhz, 16element probe focused at 25mm what would be …
 *   7Mhz, 16 element 25mm 집속 프로브 사용에서 … 무엇인가?
 *   a. The near field will decrease b. The focal spot size will increase
 *   근거리 음장을 감소한다. 초점 크기가 증가한다.
 *   c. The focal spot size will decrease d. Grating lobes will be induced
 *   초점 크기가 감소한다. 격자 로브가 유도된다.
 *
 * 그래서 PAUT 전문 8문항이 문제은행에 아예 안 들어와 있었다.
 * 원본 31문항인데 은행에는 25문항뿐이었다.
 *
 * 한국어가 한 줄에 둘씩 붙은 것은 문장 끝(.)으로 가른다. 갈리지 않으면
 * 그 줄을 통째로 남겨 두고 표시한다. 사람이 봐야 한다.
 */
import fs from "node:fs";
import { readHwp } from "./hwplib.mjs";

const KO = /[가-힣]/;

export function extract(file) {
  const { text } = readHwp(file);
  const L = text.split(/\r?\n/).map((s) => s.replace(/\[\[OBJ\]\]/g, " ").replace(/\s+/g, " ").trim());

  /* 갑지를 지난 자리부터 */
  let from = 0;
  for (let i = L.length - 1; i >= 0; i--)
    if (/^(Question approved by|질문의 분류|\* The classification)/.test(L[i])) { from = i + 1; break; }

  const qs = [];
  let cur = null, slot = null;

  for (let i = from; i < L.length; i++) {
    const s = L[i];
    if (!s) continue;
    if (/^(문\s*제|해\s*답|HANKUK|Examination Series|NAME|PAGE OF|NDE Level)/.test(s)) continue;

    /*
     * 정답표에 이르면 멈춘다. 마지막 문항의 보기가 이어지는 줄로 보고
     * 정답표를 통째로 삼킨 적이 있다.
     *   ④ One for each element … PAUT GENERAL (…) 〓〓〓 Answer 1 B 11 A …
     */
    if (/〓|Answer\s*$|^\(Level [^)]*\)\s*Answer/i.test(s)) break;

    /* 문항 머리 */
    const mq = s.match(/^(\d{1,2})[.)]\s*(\([A-Za-z,\s]+\))?\s*(\S.*)$/);
    if (mq && Number(mq[1]) <= 40 &&
        ((!cur && Number(mq[1]) === 1) || (cur && Number(mq[1]) === cur.no + 1))) {
      cur = { no: Number(mq[1]), tag: (mq[2] || "").replace(/[()]/g, ""), en: mq[3], ko: "", opts: [] };
      qs.push(cur); slot = "q";
      continue;
    }
    if (!cur) continue;

    /* 보기 줄 — 한 줄에 여럿이 붙어 있을 수 있다 */
    if (/^[a-d][.)]/.test(s)) {
      const parts = s.split(/(?<=[\s.)])(?=[b-d][.)]\s*[A-Za-z])/);
      let ok = true;
      const buf = [];
      for (const p of parts) {
        const m = p.trim().match(/^([a-d])[.)]\s*(.*)$/);
        if (!m) { ok = false; break; }
        buf.push({ L: m[1], en: m[2].trim(), ko: "" });
      }
      if (ok && buf[0].L === "abcd"[cur.opts.length]) {
        cur.opts.push(...buf);
        cur.lastRun = buf.length;
        slot = "o";
        continue;
      }
    }

    /* 한국어 줄 */
    if (KO.test(s)) {
      if (slot === "q") { cur.ko += (cur.ko ? " " : "") + s; continue; }
      const run = cur.lastRun || 1;
      const tgt = cur.opts.slice(-run);
      if (run === 1) { tgt[0].ko += (tgt[0].ko ? " " : "") + s; continue; }
      /* 두 보기 몫이 한 줄에 붙은 것 — 문장 끝으로 가른다 */
      const cut = s.split(/(?<=\.)\s+/);
      if (cut.length === run) tgt.forEach((o, k) => { o.ko = cut[k].trim(); });
      else { tgt[0].ko = s; tgt[0].koMerged = true; }
      continue;
    }

    /* 이어지는 영어 */
    if (slot === "q") cur.en += " " + s;
    else if (cur.opts.length) cur.opts[cur.opts.length - 1].en += " " + s;
  }

  return qs;
}

const direct = process.argv[1] && process.argv[1].endsWith("extract-2014.mjs");
if (direct && process.argv[2]) {
  const qs = extract(process.argv[2]);
  console.log(process.argv[2].split("/").pop() + "  문항 " + qs.length);
  const bad = qs.filter((q) => q.opts.length !== 4);
  if (bad.length) console.log("  보기가 4개가 아닌 것 : " + bad.map((q) => q.no + "→" + q.opts.length).join(", "));
  const merged = qs.filter((q) => q.opts.some((o) => o.koMerged));
  if (merged.length) console.log("  한국어를 못 가른 문항 : " + merged.map((q) => q.no).join(", "));
  if (process.argv[3]) {
    const only = process.argv[3].split(",").map(Number);
    for (const q of qs.filter((x) => only.includes(x.no))) {
      console.log("\n" + q.no + ". (" + q.tag + ") " + q.en);
      console.log("   " + q.ko);
      q.opts.forEach((o) => console.log("   " + o.L + ". " + o.en + "\n      " + o.ko + (o.koMerged ? "   ← 못 가름" : "")));
    }
  }
}
