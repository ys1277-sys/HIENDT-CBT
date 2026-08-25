/*
 * 규칙 문서의 철자·맞춤법·띄어쓰기를 훑는다.
 *
 * 자주 틀리는 것과 우리 문서에서 흔들리기 쉬운 표기를 모아 두고
 * 걸리는 자리를 짚어 준다. 기계가 잡을 수 있는 것만 잡는다.
 */
import fs from "node:fs";

const RULES = [
  /* 맞춤법 */
  [/되\s*여/g, "되어"],
  [/되서\b/g, "되어서"],
  [/할\s*수있/g, "할 수 있"],
  [/[^수]있읍니다/g, "있습니다"],
  [/오랫만/g, "오랜만"],
  [/않되/g, "안 되"],
  [/[^않]되요\b/g, "돼요"],
  [/몇일/g, "며칠"],
  [/틀리다(?=\s*(면|고)\b)/g, "다르다 (‘틀리다’는 옳지 않다는 뜻)"],
  [/갯수/g, "개수"],
  [/촛점/g, "초점"],
  [/싯가/g, "시가"],
  [/댓가/g, "대가"],
  [/일찌기/g, "일찍이"],
  [/역활/g, "역할"],
  [/어떻해/g, "어떡해"],
  [/왠만/g, "웬만"],
  [/금새/g, "금세"],
  [/한웅큼/g, "한 움큼"],

  /* 문서에서 흔들리기 쉬운 표기 */
  [/비 파괴/g, "비파괴"],
  [/시험 지(?![가-힣])/g, "시험지"],
  [/자격 인정서/g, "자격인정서"],
  [/문제 은행/g, "문제은행"],
  [/시험 감독자/g, "시험감독자"],
  [/합격 기준/g, "합격기준 (또는 ‘합격 기준’ 으로 통일)"],

  /* 겹말 */
  [/역전\s*앞/g, "역 앞"],
  [/미리\s*예/g, "미리 (또는 ‘예-’ 하나만)"],
  [/다시\s*재/g, "다시 (또는 ‘재-’ 하나만)"],
  [/각각의\s*각/g, "각각"],

  /* 어색한 번역투 */
  [/에\s*의하여\s*수행/g, "이(가) 수행"],
  [/되어지/g, "되"],
  [/불리워/g, "불려"],
  [/보여지/g, "보이"],
  [/생각되어/g, "생각되"],
];

/* 같은 뜻인데 표기가 흔들리면 알려 준다 */
const PAIRS = [
  ["자격인정", "자격 인정"],
  ["자격인증", "자격 인증"],
  ["재자격인정", "재자격 인정"],
  ["검사요원", "검사 요원"],
  ["비파괴검사요원", "비파괴검사 요원"],
  ["시험감독책임자", "시험 감독 책임자"],
  ["문제은행", "문제 은행"],
  ["기재사항", "기재 사항"],
  ["요구사항", "요구 사항"],
  ["유효기간", "유효 기간"],
  ["시행계획", "시행 계획"],
  ["발급대장", "발급 대장"],
];

const files = process.argv.slice(2);
let total = 0;

for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const hits = [];

  lines.forEach((line, i) => {
    for (const [re, fix] of RULES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        hits.push({ n: i + 1, bad: m[0].trim(), fix, line: line.trim() });
        if (!re.global) break;
      }
    }
  });

  console.log("=".repeat(72));
  console.log(f.split("/").pop());

  if (hits.length) {
    console.log(`\n  ▶ 맞춤법 ${hits.length}건`);
    for (const h of hits) {
      console.log(`    ${String(h.n).padStart(4)}줄  「${h.bad}」 → ${h.fix}`);
      console.log(`          ${h.line.slice(0, 84)}`);
    }
    total += hits.length;
  } else {
    console.log("\n  맞춤법 걸린 것 없음");
  }

  /* 표기 흔들림 */
  const body = lines.join("\n");
  const wob = [];
  for (const [a, b] of PAIRS) {
    const ca = (body.match(new RegExp(a, "g")) || []).length;
    const cb = (body.match(new RegExp(b.replace(/ /g, "\s"), "g")) || []).length - ca;
    if (ca > 0 && cb > 0) wob.push([a, ca, b, cb]);
  }

  if (wob.length) {
    console.log(`\n  ▶ 표기가 흔들리는 말 ${wob.length}가지`);
    for (const [a, ca, b, cb] of wob) {
      console.log(`    「${a}」 ${ca}번  vs  「${b}」 ${cb}번`);
    }
    total += wob.length;
  } else {
    console.log("  표기 흔들림 없음");
  }
  console.log();
}

console.log(total ? `모두 ${total}건 살펴볼 것` : "걸린 것 없음");
