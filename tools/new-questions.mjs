/*
 * 새로 지은 문항을 은행에 넣는다.
 *
 *   node tools/new-questions.mjs          무엇이 들어가는지 보여만 준다
 *   node tools/new-questions.mjs --써라    실제로 넣는다
 *
 * 왜 짓는가
 * ---------
 * 은행 열셋이 규정 출제 수와 똑같아 회차마다 같은 문항이 나간다.
 * (HIE-QP-E02 6.1.3) 원본 시험지에서 더 뽑을 것이 있는지 tools/general-gap.mjs
 * 로 훑었는데 A형과 B형이 같은 40문항이라 나올 것이 없었다. 그래서 짓는다.
 *
 * 무엇을 보고 짓는가
 * -----------------
 * 일반시험은 일반 이론과 규격 지식을 묻는다(E01 표 3). 회사 절차서를
 * 몰라도 풀 수 있어야 하므로 ASME Sec.V·SNT-TC-1A 와 검사 원리를 본다.
 * 전문시험은 「사양서·장치·검사기법·절차서」를 묻으므로 회사 절차서를 본다.
 *
 * 지키는 것
 * ---------
 *   - 은행이 이미 다루는 주제는 피한다. 넣기 전에 낱말 겹침으로 잰다.
 *   - 오답은 그 종목에서 실제로 헷갈리는 값으로 둔다.
 *     100 fc 옆에 10·50·200 fc, 1000 ㎼ 옆에 100·500·2000 ㎼.
 *   - 정답 자리를 ①②③④ 고루 흩는다. 검토 모드에서는 보기를 안 섞는다.
 *   - 근거를 note 에 적는다. 규격 조항 번호까지 적어 펴 볼 수 있게 한다.
 *     (HIE-QP-E02 6.1.2, 6.3.1 — 종목 NDE Level Ⅲ 승인 사항)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/* 한 줄에 영문, 다음 줄에 우리말 — 은행과 같은 꼴 */
const Q = (en, ko) => `${en}\n${ko}`;

const BANKS = {

  /* ═══════════════════════════════════════════
     Level Ⅱ 일반 MT — 40문항 → 60문항
     ASME Sec.V Art.7 과 자분탐상 원리를 본다
     ═══════════════════════════════════════════ */
  /* Level Ⅱ 일반 MT 20문항은 2026-08-27 에 넣었다 — tools/_mt-done.txt */

  /* Level Ⅱ 일반 PT 20문항은 2026-08-27 에 넣었다 — tools/_pt-done.txt */

  /* Level Ⅱ 일반 RT 20문항은 2026-08-27 에 넣었다 — tools/_rt-done.txt */

  /* Level Ⅱ 일반 UT 20문항은 2026-08-27 에 넣었다 — tools/_ut-done.txt */

  /* Level Ⅱ 일반 ECT 20문항은 2026-08-27 에 넣었다 — tools/_ect-done.txt */

  /* Level Ⅱ 일반 RFT 20문항은 2026-08-27 에 넣었다 — tools/_rft-done.txt */

  /* ═══════════════════════════════════════════
     Level Ⅱ 일반 TOFD — 40문항 → 60문항
     ASME Sec.V Art.4 부록과 TOFD 원리를 본다
     ═══════════════════════════════════════════ */
  "Level II/General/TOFD": [

    {
      q: Q("In a TOFD image, the first signal to arrive at the receiver is the :",
           "TOFD 영상에서 수신 탐촉자에 가장 먼저 닿는 신호는 무엇인가?"),
      o: [
        Q("backwall signal", "저면 반사 신호"),
        Q("lateral wave", "측면파"),
        Q("upper tip diffraction signal", "결함 위 끝 회절 신호"),
        Q("lower tip diffraction signal", "결함 아래 끝 회절 신호"),
      ],
      a: 1,
      why: "측면파는 두 탐촉자 사이 표면 바로 아래를 곧장 지나므로 길이가 가장 짧아 먼저 닿는다. 그다음이 결함 위 끝, 아래 끝, 마지막이 저면이다. 이 차례가 TOFD 판독의 뼈대다.",
    },

    {
      q: Q("In TOFD, the depth of a flaw tip is determined from :",
           "TOFD 에서 결함 끝의 깊이는 무엇으로 정하는가?"),
      o: [
        Q("the amplitude of the diffracted signal", "회절 신호의 크기"),
        Q("the arrival time of the diffracted signal", "회절 신호가 닿은 시각"),
        Q("the frequency of the probe", "탐촉자의 주파수"),
        Q("the width of the probe wedge", "웨지의 폭"),
      ],
      a: 1,
      why: "TOFD 는 크기가 아니라 시각을 잰다. 그래서 결함이 빔과 어느 쪽으로 기울어 있든 깊이를 고르게 잰다. 진폭에 기대는 펄스에코와 갈리는 대목이다.",
    },

    {
      q: Q("The signal diffracted from the upper tip of an embedded flaw is normally :",
           "속에 있는 결함의 위 끝에서 나온 회절 신호는 보통 어떠한가?"),
      o: [
        Q("phase-inverted relative to the lower tip signal", "아래 끝 신호와 위상이 뒤집혀 있다"),
        Q("in phase with the lower tip signal", "아래 끝 신호와 위상이 같다"),
        Q("larger than the backwall signal", "저면 신호보다 크다"),
        Q("always absent", "언제나 안 나타난다"),
      ],
      a: 0,
      why: "위 끝과 아래 끝에서 나온 회절파는 위상이 반대다. 이 뒤집힘을 보고 두 신호가 한 결함의 양 끝인지 가려내며, 그래서 TOFD 는 RF(비정류) 파형으로 본다.",
    },

    {
      q: Q("The dead zone immediately below the scanning surface in TOFD is caused by :",
           "TOFD 에서 검사면 바로 아래에 생기는 불감대의 원인은?"),
      o: [
        Q("the backwall signal", "저면 신호"),
        Q("the width (duration) of the lateral wave", "측면파의 폭(지속 시간)"),
        Q("the encoder resolution", "엔코더의 분해능"),
        Q("the couplant layer", "접촉매질 층"),
      ],
      a: 1,
      why: "측면파가 시간축에서 폭을 차지해 그 안에 든 얕은 결함이 묻힌다. 그래서 표면 가까운 부위는 펄스에코나 다른 방법을 함께 써서 덮는다.",
    },

    {
      q: Q("A second dead zone in TOFD occurs :",
           "TOFD 의 또 다른 불감대는 어디에 생기는가?"),
      o: [
        Q("at mid-wall", "두께 한가운데"),
        Q("just above the backwall", "저면 바로 위"),
        Q("outside the weld cap", "용접 덧살 바깥"),
        Q("there is only one dead zone", "불감대는 하나뿐이다"),
      ],
      a: 1,
      why: "저면 반사 신호도 폭을 차지해 그 바로 위 결함을 가린다. 위아래 두 불감대를 어떻게 덮을지가 TOFD 검사 계획의 첫 고민이다.",
    },

    {
      q: Q("The probe centre spacing (PCS) in TOFD is normally set so that the beams cross at :",
           "TOFD 의 탐촉자 중심 간격(PCS)은 보통 빔이 어디에서 만나도록 잡는가?"),
      o: [
        Q("the scanning surface", "검사면"),
        Q("about two-thirds of the wall thickness", "벽 두께의 약 3분의 2 되는 깊이"),
        Q("the backwall", "저면"),
        Q("one-tenth of the wall thickness", "벽 두께의 10분의 1 되는 깊이"),
      ],
      a: 1,
      why: "빔이 만나는 자리에서 감도가 가장 높다. 2/3 깊이에 두면 두께 전체에 걸쳐 감도가 고르게 퍼진다. 한 구간으로 못 덮는 두꺼운 용접부는 구간을 나눠 PCS 를 달리 잡는다.",
    },

    {
      q: Q("TOFD probes are normally used with a wide beam angle mainly to :",
           "TOFD 탐촉자에 넓은 빔각을 쓰는 가장 큰 까닭은?"),
      o: [
        Q("cover the whole examination volume with one pass", "한 번 지나가는 것으로 검사 체적 전체를 덮으려고"),
        Q("increase the amplitude of the backwall signal", "저면 신호를 키우려고"),
        Q("reduce the number of probes to one", "탐촉자를 하나로 줄이려고"),
        Q("eliminate the need for an encoder", "엔코더를 안 쓰려고"),
      ],
      a: 0,
      why: "TOFD 는 탐촉자를 용접선을 따라 한 번 밀면서 두께 전체를 담는다. 그러려면 빔이 넓게 퍼져야 한다. 대신 넓은 만큼 분해능은 떨어져 감쇠가 큰 재질에는 불리하다.",
    },

    {
      q: Q("TOFD probes are normally highly damped in order to :",
           "TOFD 탐촉자를 강하게 제동(damping)하는 까닭은?"),
      o: [
        Q("increase the penetration depth", "투과 깊이를 늘리려고"),
        Q("produce a short pulse so that closely spaced signals can be separated", "펄스를 짧게 만들어 가까이 붙은 신호를 갈라내려고"),
        Q("reduce the probe centre spacing", "탐촉자 중심 간격을 줄이려고"),
        Q("increase the amplitude of the lateral wave", "측면파를 키우려고"),
      ],
      a: 1,
      why: "펄스가 길면 측면파·회절파·저면파가 서로 겹쳐 붙는다. 강하게 제동해 링잉을 줄이면 불감대가 좁아지고 가까운 두 끝을 갈라 볼 수 있다.",
    },

    {
      q: Q("Compared with pulse-echo, a major advantage of TOFD is that :",
           "펄스에코와 견주어 TOFD 가 나은 큰 점은?"),
      o: [
        Q("it detects flaws regardless of their orientation", "결함이 어느 쪽으로 기울어 있든 찾아낸다"),
        Q("it requires no couplant", "접촉매질이 필요 없다"),
        Q("it needs no reference block", "대비 시험편이 필요 없다"),
        Q("it can be used on nonmetallic materials", "비금속에도 쓸 수 있다"),
      ],
      a: 0,
      why: "회절은 결함 끝에서 사방으로 퍼지므로 결함이 빔과 나란하든 비스듬하든 신호가 온다. 반사에 기대는 펄스에코는 결함이 기울면 놓치기 쉽다.",
    },

    {
      q: Q("In a TOFD image, a flaw that shows only one tip signal and breaks the backwall is most likely :",
           "TOFD 영상에서 끝 신호가 하나만 보이고 저면 신호를 끊는 결함은 무엇일 가능성이 큰가?"),
      o: [
        Q("an embedded flaw at mid-wall", "두께 한가운데 있는 내부 결함"),
        Q("a flaw open to the far (backwall) surface", "저면 쪽 표면에 열린 결함"),
        Q("porosity", "기공"),
        Q("a lack of side wall fusion in the middle", "가운데의 개선면 융합불량"),
      ],
      a: 1,
      why: "저면에 열린 결함은 아래 끝이 표면과 닿아 있어 위 끝 신호만 나오고, 저면 신호가 그 자리에서 끊긴다. 속에 있는 결함은 위·아래 끝 신호가 둘 다 나오고 저면은 멀쩡하다.",
    },

    {
      q: Q("An encoder is used in TOFD scanning to :",
           "TOFD 주사에서 엔코더를 쓰는 까닭은?"),
      o: [
        Q("record the position of the probe along the weld", "용접선을 따라간 탐촉자의 자리를 기록하려고"),
        Q("measure the couplant thickness", "접촉매질 두께를 재려고"),
        Q("set the probe centre spacing", "탐촉자 중심 간격을 잡으려고"),
        Q("calibrate the time base", "시간축을 교정하려고"),
      ],
      a: 0,
      why: "TOFD 는 영상으로 기록해 나중에 다시 본다. 각 A-주사가 용접선의 어느 자리에서 나온 것인지 알아야 결함의 길이와 위치를 잴 수 있다.",
    },

    {
      q: Q("A non-parallel (longitudinal) TOFD scan means that the probe pair moves :",
           "비평행(길이 방향) TOFD 주사란 탐촉자 쌍이 어떻게 움직이는 것인가?"),
      o: [
        Q("along the weld with the beam axis across the weld", "빔 축은 용접부를 가로지른 채 용접선을 따라"),
        Q("across the weld with the beam axis along the weld", "빔 축은 용접선을 따른 채 용접부를 가로질러"),
        Q("in a circle around a fixed point", "한 점을 중심으로 원을 그리며"),
        Q("in the thickness direction only", "두께 방향으로만"),
      ],
      a: 0,
      why: "보통 검사는 비평행 주사로 용접선을 한 번 훑는다. 결함이 나오면 그 자리에서 빔 축을 용접선과 나란히 두고 가로질러 미는 평행 주사로 길이와 깊이를 더 정확히 잰다.",
    },

    {
      q: Q("The probe (wedge) delay must be measured and entered before a TOFD examination because :",
           "TOFD 검사 전에 웨지 지연을 재어 넣어야 하는 까닭은?"),
      o: [
        Q("it sets the scanning speed", "주사 속도를 정하기 때문"),
        Q("the time spent in the wedge is not part of the material path and must be subtracted", "웨지 안에서 걸린 시간은 재료를 지난 것이 아니라 빼 주어야 하기 때문"),
        Q("it determines the encoder resolution", "엔코더 분해능을 정하기 때문"),
        Q("it changes the probe frequency", "탐촉자 주파수를 바꾸기 때문"),
      ],
      a: 1,
      why: "TOFD 는 도달 시각으로 깊이를 셈한다. 웨지에서 흘려보낸 시간을 안 빼면 결함이 실제보다 깊게 나온다. 그래서 검사 전에 시험편으로 웨지 지연을 재어 장비에 넣는다.",
    },

    {
      q: Q("Straight lines of high amplitude running across a TOFD image at a constant depth usually indicate :",
           "TOFD 영상에서 일정한 깊이로 가로지르는 곧고 진한 줄은 보통 무엇인가?"),
      o: [
        Q("a long planar flaw", "긴 면상 결함"),
        Q("the lateral wave and the backwall signal", "측면파와 저면 신호"),
        Q("porosity", "기공"),
        Q("an encoder error", "엔코더 오류"),
      ],
      a: 1,
      why: "측면파와 저면 신호는 결함과 상관없이 늘 같은 깊이로 지나가므로 영상 위아래에 곧은 줄로 나타난다. 이 두 줄이 흔들리거나 끊기는 자리가 결함이 있는 자리다.",
    },

    {
      q: Q("If the lateral wave disappears over part of a TOFD scan, the most likely cause is :",
           "TOFD 주사 도중 어느 구간에서 측면파가 사라졌다면 무엇 때문일 가능성이 큰가?"),
      o: [
        Q("the flaw is deeper than two-thirds of the wall", "결함이 벽 두께의 3분의 2보다 깊기 때문"),
        Q("loss of couplant or a surface-breaking flaw between the probes", "접촉매질이 끊겼거나 두 탐촉자 사이 표면에 열린 결함이 있기 때문"),
        Q("the encoder has stopped counting", "엔코더가 세기를 멈췄기 때문"),
        Q("the probe frequency is too low", "탐촉자 주파수가 너무 낮기 때문"),
      ],
      a: 1,
      why: "측면파는 두 탐촉자 사이 표면 바로 아래를 지난다. 그 길이 끊기면 사라진다. 접촉이 떨어졌을 수도 있고 표면에 열린 결함이 길을 막았을 수도 있으므로, 다시 훑어 접촉 문제인지 결함인지 가려야 한다.",
    },

    {
      q: Q("The through-wall height of a flaw in TOFD is measured as :",
           "TOFD 에서 결함의 두께 방향 높이는 어떻게 재는가?"),
      o: [
        Q("the amplitude difference between the two tip signals", "두 끝 신호의 진폭 차이로"),
        Q("the depth difference between the upper tip and lower tip signals", "위 끝 신호와 아래 끝 신호의 깊이 차이로"),
        Q("the length of the backwall interruption", "저면이 끊긴 길이로"),
        Q("the width of the lateral wave", "측면파의 폭으로"),
      ],
      a: 1,
      why: "커서를 위 끝과 아래 끝 신호에 각각 맞추면 그 깊이 차가 곧 결함 높이다. TOFD 가 결함 높이를 정확히 잰다고 하는 것이 이 때문이다.",
    },

    {
      q: Q("Before a TOFD examination, the scanning surface shall be :",
           "TOFD 검사 전에 탐촉자가 지나갈 자리는 어떻게 해야 하는가?"),
      o: [
        Q("coated with paint to protect it", "보호하려고 도장을 한다"),
        Q("smooth and free of weld spatter and loose scale", "매끄럽게 하고 스패터와 들뜬 스케일을 없앤다"),
        Q("left exactly as welded", "용접한 그대로 둔다"),
        Q("magnetized before scanning", "주사하기 전에 자화한다"),
      ],
      a: 1,
      why: "탐촉자가 걸리거나 들뜨면 접촉이 끊겨 측면파와 저면 신호가 흔들린다. 그러면 영상 위아래 기준선이 무너져 판독을 못 한다. 덧살은 그대로 두어도 되지만 지나갈 자리는 고르게 만든다.",
    },

    {
      q: Q("Before a TOFD examination, the encoder shall be :",
           "TOFD 검사 전에 엔코더는 무엇을 해야 하는가?"),
      o: [
        Q("verified over a known distance", "알려진 거리를 지나게 해 확인한다"),
        Q("replaced with a new one", "새것으로 바꾼다"),
        Q("set to the maximum sensitivity", "감도를 최대로 올린다"),
        Q("removed to reduce friction", "마찰을 줄이려고 뗀다"),
      ],
      a: 0,
      why: "엔코더가 어긋나 있으면 결함의 자리와 길이가 모두 틀어진다. 제조사가 정한 거리를 지나게 해 읽은 값이 맞는지 검사 전에 확인한다.",
    },

    {
      q: Q("If the two TOFD probes are not equidistant from the weld centreline, the result will be :",
           "TOFD 두 탐촉자가 용접 중심선에서 같은 거리에 있지 않으면 어떻게 되는가?"),
      o: [
        Q("no signal at all", "아무 신호도 안 난다"),
        Q("the calculated depth of the flaw will be in error", "결함의 깊이를 잘못 계산하게 된다"),
        Q("the lateral wave will disappear", "측면파가 사라진다"),
        Q("the scan speed will double", "주사 속도가 두 배가 된다"),
      ],
      a: 1,
      why: "깊이 계산은 두 탐촉자가 결함을 가운데 두고 마주 본다는 전제로 한다. 한쪽으로 치우치면 그 전제가 깨져 깊이가 어긋난다. 그래서 오프셋 주사는 따로 보정한다.",
    },

    {
      q: Q("The TOFD examination record shall include :",
           "TOFD 검사 기록에 담아야 하는 것은?"),
      o: [
        Q("the rejected flaws only", "불합격 처리한 결함만"),
        Q("the scan data, probe and PCS details, and the calibration data", "주사 자료와 탐촉자·PCS 값, 그리고 교정 자료"),
        Q("a photograph of the weld", "용접부 사진"),
        Q("the purchase order number only", "발주 번호만"),
      ],
      a: 1,
      why: "TOFD 는 영상 자체가 기록이라 나중에 다시 판독할 수 있다. 그러려면 어떤 탐촉자를 어떤 PCS 로 어떻게 교정해 찍은 것인지가 함께 남아 있어야 한다.",
    },
  ],

};

/* ═══════════════════════════════════════════
   넣기
   ═══════════════════════════════════════════ */

/* 낱말 겹침 — 은행에 이미 있는 주제인지 잰다 */
const words = (s) => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const w of b) if (a.has(w)) n++;
  return n / Math.min(a.size, b.size);
}

let added = 0;
const clash = [];

for (const [bank, items] of Object.entries(BANKS)) {
  const file = path.join(ROOT, bank + ".json");
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  const sample = list[0];
  let next = Math.max(...list.map((q) => q.id)) + 1;

  const have = list.map((q) => ({
    w: words(String(q.question).split("\n")[0]),
    t: String(q.question).split("\n")[1] || "",
  }));

  console.log(`══ ${bank}  ${list.length}문항 → ${list.length + items.length}문항\n`);

  const spread = { 0: 0, 1: 0, 2: 0, 3: 0 };

  for (const it of items) {
    const w = words(it.q.split("\n")[0]);
    let best = 0, at = "";
    for (const h of have) {
      const s = overlap(h.w, w);
      if (s > best) { best = s; at = h.t; }
    }
    if (best > 0.6) clash.push(`${bank}  ${Math.round(best * 100)}%  ${it.q.split("\n")[1].slice(0, 40)}  ↔  ${at.slice(0, 40)}`);

    list.push({
      id: next,
      level: sample.level,
      method: sample.method,
      category: sample.category,
      question: it.q,
      options: it.o,
      answer: it.a,
      note:
        `2026-08-27 에 새로 지은 문항이다. 은행이 규정 출제 수와 같아 회차마다 ` +
        `같은 문항이 나가던 것을 늘리려는 것이다(HIE-QP-E02 6.1.3). ` +
        `근거 : ${it.why} ` +
        `종목 NDE Level Ⅲ 승인 필요 — HIE-QP-E02 6.1.2, 6.3.1`,
    });

    spread[it.a]++;
    console.log(`   id${next}  ${it.q.split("\n")[1].slice(0, 62)}`);
    console.log(`         정답 ${it.a + 1}번  ${it.o[it.a].split("\n")[1]}`);
    console.log(`         겹침 ${Math.round(best * 100)}%`);
    next++;
    added++;
  }

  console.log(`\n   정답 자리 — ①${spread[0]} ②${spread[1]} ③${spread[2]} ④${spread[3]}`);
  if (write) fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n", "utf8");
}

console.log(`\n지어 넣은 문항 ${added}개`);

if (clash.length) {
  console.log(`\n★ 은행에 있는 문항과 6할 넘게 겹치는 것 ${clash.length}개`);
  for (const c of clash) console.log("   " + c);
}

if (!write) console.log("\n보여만 준 것이다. 실제로 넣으려면 --써라 를 붙인다.");
else console.log("\n썼다.");
