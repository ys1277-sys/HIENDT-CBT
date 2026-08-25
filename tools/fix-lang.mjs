/*
 * 문제은행의 글을 다듬는다.
 *
 *  1) 줄 앞뒤에 남은 공백. 영어 줄 다음 한국어 줄이 " 다양한 깊이…" 처럼
 *     한 칸 들여 쓴 것이 337군데 있었다. 화면에서 보기마다 들여쓰기가
 *     달라 보인다.
 *  2) 영어와 한국어가 한 줄에 엉킨 문제. 줄이 나뉘지 않아 화면에
 *     "…should have the same TOFD 적용에서 사용되는…" 으로 이어 나온다.
 *  3) 오타.
 *
 * 뜻을 바꾸는 손질은 하지 않는다. 정답도 건드리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

/* 한 줄에 엉킨 문제 — 나눌 자리를 손으로 짚는다 */
const SPLIT = {
  "public/data/Level II/General/TOFD.json|13": [
    "Probes used in TOFD applications are used as a “pair” and should have the same TOFD 적용에서 사용되는 프로브는 ‘쌍’으로 사용되며 무엇이 같아야만 하는가?",
    "Probes used in TOFD applications are used as a “pair” and should have the same ______.\nTOFD 적용에서 사용되는 프로브는 ‘쌍’으로 사용되며 무엇이 같아야만 하는가?",
  ],
  "public/data/Level II/Specific/PAUT.json|8": [
    "Dynamic Depth Focusing is 동적 깊이 focusing은?",
    "Dynamic Depth Focusing is ______.\n동적 깊이 집속(Dynamic Depth Focusing)은 무엇인가?",
  ],
  "public/data/Level II/Specific/PAUT.json|20": [
    "Phased array UT instrument shall meet the requirement of amplitude control linearity .- PAUT 장비는 어떤 것에 대한 증폭 직선성의 요구사항을 만족해야 하는가?",
    "Phased array UT instrument shall meet the requirement of amplitude control linearity for ______.\nPAUT 장비는 어떤 것에 대한 증폭 직선성의 요구사항을 만족해야 하는가?",
  ],
};

/* 오타. 앞뒤를 함께 적어 엉뚱한 곳이 바뀌지 않게 한다 */
const TYPO = [
  ["methode", "method", "methode → method"],
  ["댐핑과 라이징 타임", "댐핑과 링 타임", "ring-time 은 라이징(rising)이 아니라 링(ring)"],
  ["분활된 각 소자", "분할된 각 소자", "분활 → 분할"],
  ["검사 할 때", "검사할 때", "검사 할 → 검사할"],
];

/* 줄마다 앞뒤 공백을 떼되 줄 사이 짜임은 지킨다 */
const tidy = (s) => String(s).split("\n").map((l) => l.replace(/\s+$/, "").replace(/^[ \t]+/, "")).join("\n").trim();

let ws = 0, sp = 0;
const typoHit = [];

for (const r of ["public/data/Level II/General", "public/data/Level II/Specific", "public/data/Level III"]) {
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json"))) {
    const p = r + "/" + f;
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    let touched = false;

    for (const q of j) {
      /* 2) 엉킨 줄 나누기 */
      const k = p + "|" + q.id;
      if (SPLIT[k]) {
        const [from, to] = SPLIT[k];
        if (String(q.question) === from) {
          q.question = to; touched = true; sp++;
          console.log("나눔  " + p.split("/").slice(-2).join("/") + " id" + q.id);
          console.log("   전 : " + JSON.stringify(from).slice(0, 100));
          console.log("   후 : " + JSON.stringify(to).slice(0, 110));
        } else console.error("  ! 글이 달라 못 나눔 " + k);
      }

      /* 3) 오타 */
      const fix = (s) => {
        let t = String(s);
        for (const [a, b, why] of TYPO)
          if (t.includes(a)) { t = t.split(a).join(b); typoHit.push(why + "  " + p.split("/").pop() + " id" + q.id); }
        return t;
      };
      const q0 = q.question, o0 = JSON.stringify(q.options);
      q.question = fix(q.question);
      q.options = (q.options || []).map(fix);

      /* 1) 공백 */
      const q1 = tidy(q.question);
      const o1 = (q.options || []).map(tidy);
      if (q1 !== q.question || JSON.stringify(o1) !== JSON.stringify(q.options)) ws++;
      q.question = q1; q.options = o1;

      if (q0 !== q.question || o0 !== JSON.stringify(q.options)) touched = true;
    }
    if (touched && !DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  }
}

console.log("\n오타 고침");
[...new Set(typoHit)].forEach((s) => console.log("   " + s));
console.log("\n" + (DRY ? "[미리보기] " : "") + "공백 다듬은 문항 " + ws + " / 줄 나눈 문항 " + sp);
