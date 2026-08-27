/*
 * 보기가 넷이 안 되는 문항에 오답을 채워 4지선다로 맞춘다.
 *
 *   node tools/fill-options.mjs          무엇이 바뀌는지 보여만 준다
 *   node tools/fill-options.mjs --써라    실제로 고친다
 *
 * 원본 시험지에 보기가 둘·셋뿐이거나 아예 주관식인 문항이 있다. 원본이
 * 그렇게 나온 것이지 옮기면서 잃은 것이 아니다 — 원본 hwp 를 다 확인했다.
 *
 * 오답은 뒤에 붙인다. 앞 보기의 번호가 안 밀리므로 정답 번호를 안 건드린다.
 * 화면에서는 어차피 보기 자리를 섞는다(src/optionShuffle.js).
 *
 * ★ 지어낸 오답은 문항의 note 에 남긴다. 종목 NDE Level Ⅲ 가 무엇이
 *   더해졌는지 보고 승인·수정할 수 있게 하려는 것이다. (HIE-QP-E02 6.1.2)
 *   갈래로 채운 것은 문장이 비슷비슷하니 다듬을 몫이 남아 있다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/* ─────────────────────────────────────────────
   1. 갈래로 채우는 것
   ───────────────────────────────────────────── */

/*
 * 합격·불합격 두 갈래뿐인 문항.
 *
 * 판정을 하나 더 두면 정답이 둘이 되어 버린다. 그래서 판정이 아니라
 * 「판정 방법 자체가 어긋난 말」을 오답으로 둔다. 어느 쪽이 정답이든
 * 이 둘은 늘 틀린다.
 */
const VERDICT_FILL = [
  "It shall be re-examined by another method before judging\n판정하기 전에 다른 검사법으로 재검사해야 한다",
  "The referencing code gives no acceptance criterion for this\n적용 규격에는 이 경우에 대한 합격 기준이 없다",
];

/*
 * 참·거짓 두 갈래뿐인 문항. 같은 생각으로 고른다.
 */
const TF_FILL = [
  "True only if the referencing code section permits it\n적용 규격이 허용할 때만 맞다",
  "Not addressed by the referencing code\n적용 규격에서 다루지 않는다",
];

const first = (o) => String(o).split("\n")[0].trim().toLowerCase().replace(/[.\s]+$/, "");

const isVerdict = (opts) =>
  opts.length === 2 &&
  opts.every((o) => /^(accept|reject|acceptable|unacceptable|yes|no|합격|불합격)$/.test(first(o)));

const isTrueFalse = (opts) =>
  opts.length === 2 &&
  opts.every((o) => /^(true|false|맞다|틀리다|맞음|틀림)$/.test(first(o)));

/* ─────────────────────────────────────────────
   2. 손으로 쓰는 것
   ───────────────────────────────────────────── */

/*
 * 갈래로 채우면 어색한 문항들. 까닭을 옆에 적어 둔다.
 * 다른 보기를 번호로 가리키는 말은 쓰지 않는다 — 그런 보기가 하나라도
 * 있으면 그 문항은 통째로 안 섞인다.
 */
const BY_HAND = {

  /* ── 육안검사 일반 — 보기가 셋뿐 ─────────── */

  "Level II/General/VT|19": [
    /* 루트 간격은 시방서가 정한다. 「무조건 밀착」은 그럴듯한 오답 */
    "The tightest fit the parts allow, with no root opening\n루트 간격 없이 부재가 허용하는 한 밀착시킨 상태",
  ],
  "Level II/General/VT|22": [
    /* Level Ⅲ 기초 34번에 같은 문항이 4지선다로 있다. 거기 넷째 보기를 그대로 쓴다 */
    "All occur only in weld metal\n모두 용접금속에서만 생긴다",
  ],
  "Level II/General/VT|23": [
    /* 스패터도 용접부 옆에 남지만, 녹았다 굳은 점이 아니라 튄 쇳물이다 */
    "Spatter.\n스패터",
  ],
  "Level II/General/VT|25": [
    /* 언더컷·언더필·용입부족과 같은 용접부 형상 결함 갈래 */
    "Overlap.\n오버랩",
  ],
  "Level II/General/VT|26": [
    /* 비드밑 균열·크레이터 균열과 같은 균열 갈래 */
    "A toe crack.\n토 균열",
  ],
  "Level II/General/VT|27": [
    /* 라미네이션·비드밑 균열·언더컷 옆에 둘 만한 내부 결함 */
    "A slag inclusion.\n슬래그 개재물",
  ],
  "Level II/General/VT|31": [
    /* 뒷면에 못 가는 탓이 아니라 앞면에서 생기는 결함이라 오답이다 */
    "Overlap and excessive reinforcement\n오버랩과 과도한 보강",
  ],
  "Level II/General/VT|34": [
    /* 검사 시점을 묻는 문항이라 시점을 하나 더 세운다 */
    "Inspection of the base metal before fit-up\n조립 전 모재 검사",
  ],

  /* ── 자분탐상 전문 — 자화 방법을 묻는다 ──── */

  "Level II/Specific/MT|11": [
    /* 요크·프로드와 같은 자화 방법 갈래에서 고른다 */
    "Coil\n코일",
    "Central conductor\n중심도체",
  ],

  /* ── 자분탐상 Level Ⅲ — 주관식이던 것 ───── */

  "Level III/MT|1": [
    /* ASME Sec.V T-764.1 — 비형광 1.2~2.4, 형광 0.1~0.4 mL/100 mL */
    "1.2 ml to 2.4 ml per 100 ml\n100 mL 당 1.2~2.4 mL",
    "0.1 ml to 0.4 ml per 100 ml\n100 mL 당 0.1~0.4 mL",
    "2.4 ml to 4.8 ml per 100 ml\n100 mL 당 2.4~4.8 mL",
    "10 ml to 20 ml per 100 ml\n100 mL 당 10~20 mL",
  ],
  "Level III/MT|4": [
    /* 교류 요크 10 lb, 직류·영구자석 요크 40 lb — 헷갈리기 딱 좋다 */
    "10 lb (4.5 kg)\n10 lb (4.5 kg)",
    "40 lb (18 kg)\n40 lb (18 kg)",
    "25 lb (11 kg)\n25 lb (11 kg)",
    "5 lb (2.3 kg)\n5 lb (2.3 kg)",
  ],

  /* ── 방사선투과 Level Ⅲ — 주관식이던 것 ─── */

  "Level III/RT|3": [
    /* Ug = F·t/d = 4 mm × 12.7 mm / 609.6 mm = 0.083 mm.  원본 답의 단위가 inch 로 잘못 적혀 있었다 */
    "Ug = 0.084 mm\nUg = 0.084 mm",
    "Ug = 0.042 mm\nUg = 0.042 mm",
    "Ug = 0.168 mm\nUg = 0.168 mm",
    "Ug = 0.84 mm\nUg = 0.84 mm",
  ],
  "Level III/RT|19": [
    /* 원본이 「Yes or No」 주관식이다. 균열은 어느 규격에서도 불합격이다 */
    "No\n불합격",
    "Yes\n합격",
    "It shall be re-examined by another method before judging\n판정하기 전에 다른 검사법으로 재검사해야 한다",
    "The referencing code gives no acceptance criterion for cracks\n적용 규격에는 균열에 대한 합격 기준이 없다",
  ],
  "Level III/RT|26": [
    /* ASME Sec.V T-274.1 — 125 kV 아래, 두께 1/4 in. 이하에서는 0.005 in. 납 증감지가 이점이 없다 */
    "0.005 inch\n0.005인치",
    "0.010 inch\n0.010인치",
    "0.001 inch\n0.001인치",
    "0.020 inch\n0.020인치",
  ],
};

/* ─────────────────────────────────────────────
   3. 보기 글이 깨진 것
   ───────────────────────────────────────────── */

/*
 * PT 전문 8번의 2번 보기에 그림 속 글자가 딸려 들어와 있다.
 *   "False (틀리다)\n\nA\n4/16“\n2/16“"
 * 보기는 「False / 틀리다」만 남긴다. 그림 글자는 화면에서 보기처럼
 * 읽혀 뜻이 통하지 않았다.
 */
const CLEAN = {
  "Level II/Specific/PT|8": { 1: "False\n틀리다" },
};

/*
 * 글자 사이를 빈칸으로 벌려 자리를 맞춘 자료표.
 *
 * 원본 시험지는 고정폭 글꼴이라 빈칸으로 줄을 맞췄는데, 화면 글꼴은
 * 폭이 제각각이라 그 빈칸이 그대로 남아 들쭉날쭉해 보인다. 쌍점으로 잇는다.
 */
const RESPACE = ["Level II/Specific/PAUT|25"];

/* ─────────────────────────────────────────────
   굽기
   ───────────────────────────────────────────── */

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const stamp = "(2026-08-27)";
const rule = "종목 NDE Level Ⅲ 승인 필요 — HIE-QP-E02 6.1.2";

let byHand = 0, byKind = 0, fromText = 0, cleaned = 0, respaced = 0;
const untouched = [];

for (const file of walk(ROOT)) {
  let items;
  try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(items)) continue;

  const bank = path.relative(ROOT, file).split(path.sep).join("/").replace(".json", "");
  let touched = false;

  for (const q of items) {
    const key = `${bank}|${q.id}`;
    const opts = Array.isArray(q.options) ? q.options : [];

    /* 보기 글 고치기 */
    if (CLEAN[key]) {
      for (const [i, want] of Object.entries(CLEAN[key])) {
        if (opts[i] === want) continue;
        console.log(`${bank} id${q.id} 보기${Number(i) + 1}  글을 다듬음`);
        console.log(`      전 ${JSON.stringify(opts[i])}`);
        console.log(`      후 ${JSON.stringify(want)}`);
        opts[Number(i)] = want;
        q.note = (q.note ? q.note + "\n" : "") +
          `보기 ${Number(i) + 1}번에 그림 속 글자가 딸려 들어와 있던 것을 덜어냈다 ${stamp}`;
        cleaned++;
        touched = true;
      }
    }

    /* 자료표 빈칸 */
    if (RESPACE.includes(key)) {
      const was = q.question;
      q.question = String(q.question)
        .split("\n")
        .map((l) => l.replace(/\s{2,}/g, " : ").replace(/(\s*:\s*){2,}/g, " : ").trimEnd())
        .join("\n");
      if (was !== q.question) {
        console.log(`${bank} id${q.id}  자료표의 벌어진 빈칸을 쌍점으로`);
        for (const l of q.question.split("\n")) if (l.includes(" : ")) console.log(`      ${l}`);
        respaced++;
        touched = true;
      }
    }

    if (opts.length >= 4) continue;

    /* 손으로 쓴 것이 우선 */
    if (BY_HAND[key]) {
      const add = BY_HAND[key];

      if (opts.length === 0) {
        /* 주관식이던 문항 — 첫 보기가 정답이다 */
        const wasText = q.answer;
        q.options = [...add];
        q.answer = 0;
        q.note = (q.note ? q.note + "\n" : "") +
          `원본은 주관식이고 정답이 「${wasText}」였다. 4지선다로 바꾸며 오답 ` +
          `${add.slice(1).map((o) => `「${o.split("\n")[0]}」`).join(" · ")} 을 지어 넣었다 ${stamp}. ${rule}`;
        console.log(`${bank.padEnd(22)} id${String(q.id).padStart(3)}  주관식 → 4지선다 (정답 1번 「${add[0].split("\n")[0]}」)`);
        fromText++;
      } else {
        const before = opts.length;
        opts.push(...add);
        q.note = (q.note ? q.note + "\n" : "") +
          `원본 시험지에 보기가 ${before}개뿐이어서 4지선다로 맞추려고 오답 ` +
          `${add.map((o) => `「${o.split("\n")[0]}」`).join(" · ")} 을 더했다 ${stamp}. ${rule}`;
        console.log(`${bank.padEnd(22)} id${String(q.id).padStart(3)}  보기 ${before} → ${opts.length}  (정답 ${q.answer + 1}번 그대로)`);
        for (const o of add) console.log(`      + ${o.replace("\n", " / ")}`);
        byHand++;
      }
      touched = true;
      continue;
    }

    /* 갈래로 채우기 */
    const add = isVerdict(opts) ? VERDICT_FILL : isTrueFalse(opts) ? TF_FILL : null;

    if (!add) {
      if (opts.length && opts.length < 4) untouched.push(`${bank} id${q.id}  보기 ${opts.length}개  ${opts.map((o) => first(o)).join(" | ")}`);
      continue;
    }

    const before = opts.length;
    opts.push(...add);
    q.note = (q.note ? q.note + "\n" : "") +
      `원본 시험지에 보기가 ${before}개(${isVerdict(opts.slice(0, 2)) ? "합격·불합격" : "참·거짓"})뿐이어서 ` +
      `4지선다로 맞추려고 오답 두 개를 갈래로 채웠다 ${stamp}. 문장이 다른 문항과 비슷하니 다듬을 몫이 남아 있다. ${rule}`;
    byKind++;
    touched = true;
  }

  if (touched && write) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n", "utf8");
}

console.log("");
console.log(`손으로 쓴 것        ${byHand}문항`);
console.log(`갈래로 채운 것      ${byKind}문항`);
console.log(`주관식에서 바꾼 것  ${fromText}문항`);
console.log(`보기 글을 다듬음    ${cleaned}군데`);
console.log(`자료표를 다듬음     ${respaced}문항`);

if (untouched.length) {
  console.log(`\n아직 넷이 안 되는 문항 ${untouched.length}개`);
  for (const u of untouched) console.log("   " + u);
}

console.log("");
if (!write) console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
else console.log("썼다.");
