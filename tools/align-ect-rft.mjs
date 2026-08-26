/*
 * ECT 와 RFT 가 나눠 쓰는 문항의 표현을 원본 시험지에 맞춘다.
 *
 *   node tools/align-ect-rft.mjs        무엇이 바뀌는지 보여만 준다
 *   node tools/align-ect-rft.mjs --써라  실제로 고친다
 *
 * 두 은행은 와전류 이론 24문항을 함께 쓴다. 옮겨 담는 과정에서 한글이
 * 조금씩 달라졌고(선형성/직선성, 반자성/반자성체 …) ECT id19 는 보기
 * 하나가 통째로 잘려 있었다.
 *
 * 어느 쪽이 옳은지는 원본 시험지(ECTG-II(B).hwp)가 정한다. 원본에 한글이
 * 있으면 그대로 쓰고, 원본이 영문만 두었으면 둘 중 더 간결한 쪽으로
 * 맞춘다. 영문과 정답 번호는 건드리지 않는다.
 */
import fs from "node:fs";

const E = "public/data/Level II/General/ECT.json";
const R = "public/data/Level II/General/RFT.json";

/*
 * 고칠 자리.  id → 보기번호(0-based) → 넣을 값
 *
 * 원본에 적힌 한글을 그대로 옮겼다. 출처를 주석에 남긴다.
 */
const FIX = {
  7: {                                     /* 불연속의 주 평면과 … */
    0: "coplanar with the major plane of the discontinuity\n불연속의 주 평면과 동일면상",
    1: "perpendicular to the major plane of the discontinuity\n불연속의 주 평면과 수직",
    2: "parallel to the major plane of the discontinuity\n불연속의 주 평면과 평행",
  },
  12: {                                    /* linearity(직선성) */
    1: "linearity\n직선성",
  },
  13: {                                    /* 원본은 어미 없이 짧게 */
    0: "decrease\n감소",
    1: "increase\n증가",
    2: "remains the same\n동일하게 유지",
    3: "could do any of the above\n위의 어떠한 것도 가능",
  },
  16: {                                    /* 원본에 한글 없음 — 짧은 쪽 */
    1: "symbol σ\n기호 σ",
  },
  19: {                                    /* ★ ECT 에서 보기 하나가 잘려 있던 문항 */
    0: "observing the lift-off effect caused by the coating\n코팅으로 야기된 리프트-오프 효과 관찰",
    3: "varying the test frequency over a given range during the test\n시험하는 동안 주어진 범위 넘어 시험 주파수 변화",
  },
  21: {                                    /* 원본에 한글 없음 — 우리말 쪽 */
    2: "spinning coil\n회전 코일",
  },
  22: {                                    /* 임피던스 법 · 변조 분석 법 … */
    0: "impedance method of testing\n임피던스 법",
    1: "modulation analysis method of testing\n변조 분석 법",
    2: "phase analysis method of testing\n위상 분석 법",
  },
  25: {                                    /* 원본에 한글 없음 — 짧은 쪽 */
    0: "mhos\n모",
  },
  26: {                                    /* diamagnetic(반자성) — 「체」 없음 */
    0: "diamagnetic\n반자성",
    1: "ferromagnetic\n강자성",
    2: "paramagnetic\n상자성",
    3: "magnetic\n자력",
  },
  33: {                                    /* 원본 한글이 「대항하여」 */
    0: "opposes the magnetic field that induced the eddy currents\n와전류를 유도한 자기장에 대항한다",
    1: "reinforces the magnetic field that induced the eddy currents\n와전류를 유도한 자기장을 증가시킨다",
    3: "has no effect on the magnetic field that induced the eddy currents\n와전류를 유도한 자기장에 영향을 주지 않는다",
  },
  38: {                                    /* 회로의 전도율 */
    2: "increase the conductivity of the circuit\n회로의 전도율 증가",
  },
};

/* 두 은행에서 같은 문항을 짝짓는 열쇠 — 영문 첫 줄 */
const key = q => q.question.split("\n")[0].trim();

const write = process.argv.includes("--써라");
const ect = JSON.parse(fs.readFileSync(E, "utf8"));
const rft = JSON.parse(fs.readFileSync(R, "utf8"));

/* ECT 의 id 로 RFT 의 같은 문항을 찾는다 */
const byText = new Map(rft.map(q => [key(q), q]));

let touched = 0;
const answersBefore = [...ect, ...rft].map(q => q.answer);

for (const [idStr, opts] of Object.entries(FIX)) {
  const id = Number(idStr);
  const e = ect.find(q => q.id === id);
  if (!e) { console.log(`★ ECT id${id} 없음`); continue; }

  const r = byText.get(key(e));
  if (!r) { console.log(`★ RFT 에 짝이 없음 — ECT id${id}`); continue; }

  for (const [nStr, want] of Object.entries(opts)) {
    const n = Number(nStr);

    for (const [bank, q] of [["ECT", e], ["RFT", r]]) {
      const now = q.options[n];
      if (now === want) continue;

      /* 영문이 바뀌면 안 된다 — 잘려 있던 id19 만 예외 */
      const engNow = String(now).split("\n")[0].trim();
      const engWant = want.split("\n")[0].trim();
      if (engNow !== engWant && id !== 19) {
        console.log(`★ ${bank} id${id} ${n + 1}번 — 영문이 달라 건너뜀`);
        console.log(`   지금 : ${engNow}`);
        console.log(`   넣을 : ${engWant}`);
        continue;
      }

      console.log(`${bank} id${String(id).padEnd(3)} ${n + 1}번`);
      console.log(`   전 : ${String(now).replace(/\n/g, " ⏎ ")}`);
      console.log(`   후 : ${want.replace(/\n/g, " ⏎ ")}`);
      q.options[n] = want;
      touched++;
    }
  }
}

/* 정답 번호가 하나라도 움직였으면 큰일이다 */
const answersAfter = [...ect, ...rft].map(q => q.answer);
const moved = answersBefore.filter((v, i) => v !== answersAfter[i]).length;

console.log("");
console.log(`고친 보기 ${touched}개 · 정답 번호가 움직인 문항 ${moved}개`);

if (moved) { console.log("★ 정답이 움직였다. 쓰지 않는다."); process.exit(1); }

if (!write) {
  console.log("보여만 준 것이다. 실제로 고치려면 --써라 를 붙인다.");
} else {
  fs.writeFileSync(E, JSON.stringify(ect, null, 2) + "\n");
  fs.writeFileSync(R, JSON.stringify(rft, null, 2) + "\n");
  console.log("두 은행에 썼다.");
}
