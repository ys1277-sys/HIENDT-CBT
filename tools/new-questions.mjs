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

  /* ═══════════════════════════════════════════
     Level Ⅱ 일반 UT — 40문항 → 60문항
     ASME Sec.V Art.4 · Art.5 와 초음파 원리를 본다
     ═══════════════════════════════════════════ */
  "Level II/General/UT": [

    {
      q: Q("The couplant used in contact ultrasonic examination is required mainly to :",
           "접촉법 초음파탐상에서 접촉매질(couplant)을 쓰는 가장 큰 까닭은?"),
      o: [
        Q("lubricate the search unit so it slides easily", "탐촉자가 잘 미끄러지게 하려고"),
        Q("displace the air between the search unit and the surface", "탐촉자와 검사면 사이의 공기를 밀어내려고"),
        Q("cool the transducer during long examinations", "긴 검사 동안 진동자를 식히려고"),
        Q("increase the frequency of the sound beam", "초음파의 주파수를 높이려고"),
      ],
      a: 1,
      why: "강과 공기의 음향 임피던스 차가 워낙 커서 사이에 공기막이 있으면 초음파가 거의 다 되튄다. 접촉매질이 그 공기를 밀어내야 소리가 시험체로 들어간다.",
    },

    {
      q: Q("A transfer correction is applied when :",
           "전이 보정(transfer correction)은 언제 하는가?"),
      o: [
        Q("the search unit frequency is changed during the examination", "검사 도중 탐촉자 주파수를 바꿀 때"),
        Q("the surface condition of the test object differs from that of the calibration block", "시험체의 표면 상태가 교정 시험편과 다를 때"),
        Q("the examination is performed by a Level I examiner", "Level I 검사자가 검사할 때"),
        Q("the test object is thicker than 50 mm", "시험체 두께가 50 mm 를 넘을 때"),
      ],
      a: 1,
      why: "ASME Sec.V Art.4 T-434.2.1. 교정 시험편은 매끄러운데 시험체는 거칠거나 도장이 있으면 들어가는 소리의 양이 달라진다. 그 차이만큼 감도를 더해 주는 것이 전이 보정이다.",
    },

    {
      q: Q("What is the sound path distance to the first leg reflection point when using a 45° shear wave on a 25 mm thick plate?",
           "두께 25 mm 판재에 45° 횡파를 쓸 때 1스킵 첫 반사점까지의 음향 거리는?"),
      o: [
        Q("25 mm", "25 mm"),
        Q("50 mm", "50 mm"),
        Q("35.4 mm", "35.4 mm"),
        Q("17.7 mm", "17.7 mm"),
      ],
      a: 2,
      why: "음향 거리 = 두께 ÷ cos(굴절각) = 25 ÷ cos45° = 25 ÷ 0.707 = 35.4 mm. 표면 거리는 두께 × tan45° = 25 mm 다. 둘을 헷갈리기 쉽다.",
    },

    {
      q: Q("If the pulse repetition rate is set too high, the display may show :",
           "펄스 반복률을 너무 높게 잡으면 화면에 무엇이 나타날 수 있는가?"),
      o: [
        Q("a permanent loss of the back-wall echo", "저면 에코가 아주 사라진다"),
        Q("ghost (wrap-around) echoes from the previous pulse", "앞선 펄스에서 온 유령 에코(wrap-around)"),
        Q("a change in the refracted angle", "굴절각이 달라진다"),
        Q("an increase in the near field length", "근거리 음장이 길어진다"),
      ],
      a: 1,
      why: "앞서 쏜 소리가 시험체 안에서 아직 오가는 중에 다음 펄스를 쏘면, 그 늦게 돌아온 에코가 다음 화면에 엉뚱한 자리에 뜬다. 결함으로 잘못 읽히므로 반복률을 낮춰 사라지는지 보아 가린다.",
    },

    {
      q: Q("The near field (Fresnel zone) length of a transducer increases when :",
           "탐촉자의 근거리 음장(near field)이 길어지는 것은 언제인가?"),
      o: [
        Q("the frequency decreases", "주파수가 낮아질 때"),
        Q("the transducer diameter decreases", "진동자 지름이 작아질 때"),
        Q("the frequency or the diameter increases", "주파수나 진동자 지름이 커질 때"),
        Q("the couplant is changed to oil", "접촉매질을 기름으로 바꿀 때"),
      ],
      a: 2,
      why: "N = D²f / 4V 다. 지름이나 주파수가 커지면 근거리 음장이 길어진다. 이 구간은 음압이 들쭉날쭉해 크기를 재기 어려우므로 평가는 원거리 음장에서 한다.",
    },

    {
      q: Q("Ultrasonic examination of a weld is usually performed with :",
           "용접부 초음파탐상은 보통 어떤 파로 하는가?"),
      o: [
        Q("longitudinal waves at normal incidence", "수직으로 입사시킨 종파"),
        Q("surface (Rayleigh) waves", "표면파(레일리파)"),
        Q("shear waves at an angle", "비스듬히 입사시킨 횡파"),
        Q("Lamb waves", "램파"),
      ],
      a: 2,
      why: "용접 덧살 때문에 용접부 위에 탐촉자를 놓을 수 없어, 모재에서 비스듬히 쏘아 횡파로 검사한다. 수직 종파는 판재의 라미네이션이나 두께 측정에 쓴다.",
    },

    {
      q: Q("When the incident angle in the first medium is increased so that the refracted longitudinal wave reaches 90°, that incident angle is called the :",
           "굴절된 종파가 90° 가 될 때의 입사각을 무엇이라 하는가?"),
      o: [
        Q("second critical angle", "제2 임계각"),
        Q("first critical angle", "제1 임계각"),
        Q("Snell angle", "스넬각"),
        Q("skip angle", "스킵각"),
      ],
      a: 1,
      why: "제1 임계각을 넘으면 종파가 사라지고 횡파만 남는다. 횡파까지 90° 가 되는 각이 제2 임계각이고, 그 너머는 표면파가 된다. 각도 탐촉자는 두 임계각 사이를 쓴다.",
    },

    {
      q: Q("Before ultrasonic examination, the calibration shall be verified at least :",
           "초음파탐상에서 교정은 최소 언제 다시 확인해야 하는가?"),
      o: [
        Q("once a week", "일주일에 한 번"),
        Q("at the start and finish of each examination, and every 4 hours", "검사를 시작할 때와 끝낼 때, 그리고 4시간마다"),
        Q("only when the search unit is changed", "탐촉자를 바꿀 때만"),
        Q("once a month", "한 달에 한 번"),
      ],
      a: 1,
      why: "ASME Sec.V Art.4 T-263. 시작·종료와 4시간마다 확인한다. 어긋나 있으면 마지막으로 맞았던 때 이후에 검사한 것을 다시 검사한다.",
    },

    {
      q: Q("The velocity of a shear wave in steel is approximately :",
           "강에서 횡파의 속도는 대략 얼마인가?"),
      o: [
        Q("5,900 m/s", "5,900 m/s"),
        Q("3,230 m/s", "3,230 m/s"),
        Q("1,480 m/s", "1,480 m/s"),
        Q("2,900 m/s", "2,900 m/s"),
      ],
      a: 1,
      why: "강에서 종파는 약 5,900 m/s, 횡파는 약 3,230 m/s 로 종파의 절반쯤이다. 물에서는 약 1,480 m/s 다. 같은 주파수라면 횡파의 파장이 짧아 작은 결함을 더 잘 찾는다.",
    },

    {
      q: Q("The wavelength of a 5 MHz longitudinal wave in steel (velocity 5,900 m/s) is approximately :",
           "강(음속 5,900 m/s)에서 5 MHz 종파의 파장은 대략 얼마인가?"),
      o: [
        Q("0.59 mm", "0.59 mm"),
        Q("2.95 mm", "2.95 mm"),
        Q("1.18 mm", "1.18 mm"),
        Q("11.8 mm", "11.8 mm"),
      ],
      a: 2,
      why: "λ = V / f = 5,900 ÷ 5,000,000 = 0.00118 m = 1.18 mm 다. 보통 파장의 절반보다 작은 결함은 찾기 어렵다고 본다.",
    },

    {
      q: Q("Increasing the examination frequency generally results in :",
           "검사 주파수를 높이면 대체로 어떻게 되는가?"),
      o: [
        Q("better resolution but less penetration", "분해능이 좋아지고 투과력은 떨어진다"),
        Q("better penetration but less resolution", "투과력이 좋아지고 분해능은 떨어진다"),
        Q("both better resolution and better penetration", "분해능과 투과력이 함께 좋아진다"),
        Q("no change in either", "둘 다 달라지지 않는다"),
      ],
      a: 0,
      why: "주파수가 높으면 파장이 짧아 작은 결함을 가려내지만 감쇠가 커서 깊이 못 간다. 굵은 결정립 주조품에 낮은 주파수를 쓰는 것이 이 때문이다.",
    },

    {
      q: Q("The primary purpose of a basic calibration block is to :",
           "기본 교정 시험편을 쓰는 가장 큰 까닭은?"),
      o: [
        Q("establish the distance and amplitude response of the system", "장비의 거리와 진폭 응답을 정하려고"),
        Q("measure the thickness of the couplant layer", "접촉매질 층의 두께를 재려고"),
        Q("determine the frequency of the search unit", "탐촉자의 주파수를 알아내려고"),
        Q("check the surface roughness of the test object", "시험체의 표면 거칠기를 확인하려고"),
      ],
      a: 0,
      why: "ASME Sec.V Art.4 T-434. 알려진 크기의 반사체로 가로 눈금(거리)과 세로 눈금(진폭)을 맞춘다. 그래서 시험편은 검사할 재질·두께·열처리·곡률과 같아야 한다.",
    },

    {
      q: Q("The material of the basic calibration block shall be :",
           "기본 교정 시험편의 재질은 어때야 하는가?"),
      o: [
        Q("always carbon steel regardless of the object", "시험체와 상관없이 늘 탄소강"),
        Q("acoustically equivalent to the material being examined", "검사할 재료와 음향 특성이 같아야 한다"),
        Q("harder than the material being examined", "검사할 재료보다 단단해야 한다"),
        Q("any material with a smooth surface", "표면이 매끄러운 재료면 무엇이든"),
      ],
      a: 1,
      why: "ASME Sec.V Art.4 T-434.1.1. 재질이 다르면 음속과 감쇠가 달라 교정이 어긋난다. 제품 형태와 열처리 상태까지 맞춘다.",
    },

    {
      q: Q("A discontinuity oriented parallel to the sound beam will most likely :",
           "초음파 빔과 나란히 놓인 결함은 어떻게 되는가?"),
      o: [
        Q("produce the largest possible indication", "가장 큰 지시를 만든다"),
        Q("produce little or no indication", "지시가 거의 또는 전혀 안 나온다"),
        Q("produce a false back-wall echo", "가짜 저면 에코를 만든다"),
        Q("change the velocity of the beam", "빔의 속도를 바꾼다"),
      ],
      a: 1,
      why: "빔이 결함 면에 부딪혀 되돌아와야 지시가 나온다. 나란하면 소리가 스쳐 지나간다. 그래서 예상되는 결함 방향에 맞춰 굴절각을 고르고, 두 방향에서 검사한다.",
    },

    {
      q: Q("In an immersion test, the water path distance is normally set so that :",
           "수침법에서 수거리는 보통 어떻게 잡는가?"),
      o: [
        Q("the water path is equal to the object thickness", "수거리를 시험체 두께와 같게"),
        Q("the first water-to-metal interface echo appears after the first back-wall echo", "물-금속 경계 에코가 저면 에코보다 뒤에 오게"),
        Q("the second water travel echo falls beyond the first back-wall echo", "물속을 두 번 오간 에코가 저면 에코보다 뒤에 오게"),
        Q("the water path is as short as possible", "수거리를 될 수 있는 대로 짧게"),
      ],
      a: 2,
      why: "물속에서 되돌아온 다중 에코가 시험체의 저면 에코와 겹치면 판독이 헷갈린다. 물에서의 음속이 강의 약 1/4 이므로 수거리를 두께의 1/4 보다 길게 잡아 겹치지 않게 한다.",
    },

    {
      q: Q("A laminar discontinuity in plate is best detected with :",
           "판재의 라미네이션은 무엇으로 가장 잘 찾는가?"),
      o: [
        Q("an angle beam shear wave", "각도 탐촉자의 횡파"),
        Q("a straight beam longitudinal wave", "수직 탐촉자의 종파"),
        Q("a surface wave", "표면파"),
        Q("a Lamb wave in the plate mode", "판 모드 램파"),
      ],
      a: 1,
      why: "라미네이션은 표면과 나란히 누워 있으므로 수직으로 쏜 종파가 정면으로 맞고 되돌아온다. 각도 빔은 스쳐 지나가 잘 못 찾는다.",
    },

    {
      q: Q("Attenuation of ultrasound in a material is caused mainly by :",
           "재료 속에서 초음파가 줄어드는 것은 주로 무엇 때문인가?"),
      o: [
        Q("absorption and scattering", "흡수와 산란"),
        Q("refraction and mode conversion only", "굴절과 모드 변환만으로"),
        Q("the couplant layer", "접촉매질 층"),
        Q("the pulse repetition rate", "펄스 반복률"),
      ],
      a: 0,
      why: "소리 에너지가 열로 바뀌는 흡수와, 결정립 경계에서 사방으로 흩어지는 산란이 두 축이다. 결정립이 굵을수록 산란이 커져 주파수를 낮춰야 한다.",
    },

    {
      q: Q("The couplant used for the examination shall be :",
           "검사에 쓰는 접촉매질은 어때야 하는가?"),
      o: [
        Q("the same as that used for calibration", "교정할 때 쓴 것과 같아야 한다"),
        Q("always water regardless of the surface", "표면과 상관없이 늘 물이어야 한다"),
        Q("thicker than that used for calibration", "교정할 때 쓴 것보다 걸쭉해야 한다"),
        Q("selected by the examiner at the time of examination", "검사할 때 검사자가 골라 쓰면 된다"),
      ],
      a: 0,
      why: "ASME Sec.V Art.4 T-431. 접촉매질이 달라지면 시험체로 들어가는 소리의 양이 달라져 교정이 어긋난다. 니켈 합금·오스테나이트계·티타늄에는 황과 할로겐 함량도 따진다.",
    },

    {
      q: Q("Compared with a flat search unit, a focused search unit provides :",
           "평면 탐촉자와 견주어 집속 탐촉자는 어떠한가?"),
      o: [
        Q("greater penetration into thick sections", "두꺼운 부위에 더 깊이 들어간다"),
        Q("higher sensitivity and resolution within the focal zone", "초점 구간 안에서 감도와 분해능이 더 높다"),
        Q("a wider beam over the whole sound path", "음향 경로 내내 빔이 더 넓다"),
        Q("no need for a couplant", "접촉매질이 필요 없다"),
      ],
      a: 1,
      why: "빔을 한 자리에 모아 그 구간의 음압을 높인다. 대신 초점을 벗어나면 빠르게 퍼져 감도가 떨어지므로, 찾으려는 깊이에 초점을 맞춰 써야 한다.",
    },

    {
      q: Q("Ultrasonic examination records shall include :",
           "초음파탐상 기록에 반드시 담아야 하는 것은?"),
      o: [
        Q("only the indications that were rejected", "불합격 처리한 지시만"),
        Q("the examination data, calibration data and the identity of the examiner", "검사 자료와 교정 자료, 검사자를 알 수 있는 것"),
        Q("the purchase order number only", "발주 번호만"),
        Q("a photograph of the test object", "시험체 사진"),
      ],
      a: 1,
      why: "ASME Sec.V Art.4 T-491. 나중에 같은 조건으로 되짚어 볼 수 있어야 하므로 장비·탐촉자·주파수·교정 시험편·감도 설정과 검사자를 함께 남긴다.",
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
