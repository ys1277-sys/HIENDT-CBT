/*
 * 원본 시험지(.hwp) 안의 정답표를 읽는다.
 *
 * 표 생김새가 파일마다 다르다. 둘 다 다룬다.
 *
 *   가) 번호와 답이 열마다 짝을 이룬 것        나) 번호 줄과 해답 줄이 갈린 것
 *       [1][D][11][D][21][D][31][C]              [문제][1][2][3]…
 *       [2][C][12][B][22][A][32][D]              [해답][B][D][C]…
 *
 * 답이 늘 한 글자인 것도 아니다. 「B,C,E」처럼 복수정답도 있고
 * 「합격」, 「분무 침적 솔질」처럼 글로 적힌 것도 있다. 손대지 않고
 * 있는 그대로 담는다. 판단은 맞대 보는 쪽에서 한다.
 */
import { readRich } from "./hwprich.mjs";

const cellText = (blocks) => {
  const o = [];
  (function w(bs){for(const b of bs){
    if(b.t==="p") o.push(String(b.s).replace(/\s+/g," ").trim());
    else if(b.t==="table") for(const r of b.grid) for(const c of r) if(c&&c!=="covered") w(c.blocks);
  }})(blocks);
  return o.filter(Boolean).join(" ").trim();
};

export function paperLines(file) {
  const doc = readRich(file);
  const L = [];
  (function w(bs){for(const b of bs){
    if(b.t==="p") L.push(String(b.s).replace(/\s+/g," ").trim());
    else if(b.t==="table") for(const r of b.grid) for(const c of r) if(c&&c!=="covered") w(c.blocks);
  }})(doc.blocks);
  return L;
}

const grids = (doc) => {
  const out = [];
  (function walk(bs){for(const b of bs){
    if(b.t==="table"){
      out.push(b.grid.map((r) => r.map((c) => (c && c !== "covered") ? cellText(c.blocks) : "")));
      for(const r of b.grid) for(const c of r) if(c&&c!=="covered") walk(c.blocks);
    }
  }})(doc.blocks);
  return out;
};

const isNum = (s) => /^\d{1,2}$/.test(String(s).trim());

export function paperKey(file) {
  const doc = readRich(file);
  const key = {};

  for (const g of grids(doc)) {
    /* 나) 번호 줄 다음에 해답 줄 */
    for (let r = 0; r + 1 < g.length; r++) {
      const a = g[r], b = g[r + 1];
      const nums = a.filter(isNum).length;
      if (nums < 3) continue;
      for (let c = 0; c < a.length && c < b.length; c++) {
        if (!isNum(a[c])) continue;
        const v = String(b[c] || "").trim();
        if (v) key[Number(a[c])] = v;
      }
    }

    /* 가) 열마다 번호와 답이 짝 */
    for (const row of g) {
      for (let c = 0; c + 1 < row.length; c += 2) {
        if (!isNum(row[c])) continue;
        const v = String(row[c + 1] || "").trim();
        if (v && !isNum(v)) key[Number(row[c])] = v;
      }
    }
  }
  return Object.keys(key).length ? key : null;
}

const direct = process.argv[1] && process.argv[1].endsWith("paper-key.mjs");

if (direct && process.argv[2]) {
  for (const f of process.argv.slice(2)) {
    const k = paperKey(f);
    const name = f.split("/").pop();
    if (!k) { console.log(name.padEnd(46) + "  정답표 못 읽음"); continue; }
    const ns = Object.keys(k).map(Number).sort((a, b) => a - b);
    const max = ns[ns.length - 1];
    const gap = [];
    for (let i = 1; i <= max; i++) if (!k[i]) gap.push(i);
    const odd = ns.filter((n) => !/^[A-Ea-e]$/.test(k[n]));
    console.log(name.padEnd(46) + "  " + String(ns.length).padStart(3) + "개  1~" + max +
      (gap.length ? "  빠짐 " + gap.join(",") : "") +
      (odd.length ? "  홑글자 아님 " + odd.map((n) => n + ":" + k[n].slice(0, 12)).join(" ") : ""));
  }
}
