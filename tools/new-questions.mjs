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

  /* ═══════════════════════════════════════════
     Level Ⅱ 일반 ECT — 40문항 → 60문항
     ASME Sec.V Art.8 과 와전류 원리를 본다

     ECT 와 RFT 두 은행이 와전류 이론 24문항을 나눠 쓰고 있다.
     여기 넣는 것은 ECT 쪽에만 넣는다 — RFT 는 원격장 고유 주제로
     따로 채운다.
     ═══════════════════════════════════════════ */
  "Level II/General/ECT": [

    {
      q: Q("The depth at which the eddy current density has decreased to about 37% of its surface value is called the :",
           "와전류 밀도가 표면 값의 약 37%로 줄어드는 깊이를 무엇이라 하는가?"),
      o: [
        Q("standard depth of penetration", "표준 침투깊이"),
        Q("effective depth of penetration", "유효 침투깊이"),
        Q("phase depth", "위상 깊이"),
        Q("saturation depth", "포화 깊이"),
      ],
      a: 0,
      why: "표준 침투깊이(δ)는 표면 밀도의 1/e, 곧 약 37%가 되는 깊이다. 그 세 배 깊이에서는 5%밖에 안 남아 사실상 검사가 안 된다.",
    },

    {
      q: Q("The standard depth of penetration decreases when :",
           "표준 침투깊이가 얕아지는 것은 언제인가?"),
      o: [
        Q("the test frequency decreases", "시험 주파수가 낮아질 때"),
        Q("the conductivity of the material decreases", "재료의 전도율이 낮아질 때"),
        Q("the test frequency, conductivity or permeability increases", "시험 주파수·전도율·투자율이 커질 때"),
        Q("the fill factor decreases", "충진율이 낮아질 때"),
      ],
      a: 2,
      why: "δ = 1/√(πfμσ) 다. 주파수·투자율·전도율 가운데 무엇이 커져도 침투깊이는 얕아진다. 그래서 깊은 결함을 보려면 주파수를 낮춘다.",
    },

    {
      q: Q("Lift-off in eddy current testing refers to :",
           "와전류탐상에서 리프트오프(lift-off)란 무엇인가?"),
      o: [
        Q("the change in coil response as the spacing between the coil and the surface changes", "코일과 검사면 사이 간격이 달라질 때 코일의 반응이 달라지는 것"),
        Q("the time taken for the coil to reach operating temperature", "코일이 동작 온도에 이르는 데 걸리는 시간"),
        Q("the removal of the coating from the test surface", "검사면의 도장을 벗겨내는 것"),
        Q("the loss of signal caused by a crack", "균열 때문에 신호를 잃는 것"),
      ],
      a: 0,
      why: "코일이 표면에서 조금만 떠도 신호가 크게 흔들린다. 방해가 되기도 하지만, 이 성질을 거꾸로 써서 비전도성 도장의 두께를 잰다.",
    },

    {
      q: Q("The edge effect in eddy current testing occurs when :",
           "와전류탐상의 가장자리 효과(edge effect)는 언제 생기는가?"),
      o: [
        Q("the coil is energized at too low a frequency", "코일에 너무 낮은 주파수를 걸었을 때"),
        Q("the coil approaches the edge or end of the test object", "코일이 시험체의 모서리나 끝에 가까워졌을 때"),
        Q("the couplant dries out", "접촉매질이 말랐을 때"),
        Q("the material is nonmagnetic", "재료가 비자성체일 때"),
      ],
      a: 1,
      why: "가장자리에서는 와전류가 흐를 자리가 잘려 신호가 크게 흔들린다. 그래서 끝단 가까이는 표준 시험편으로 따로 감도를 잡거나 검사 범위에서 뺀다.",
    },

    {
      q: Q("A reference standard for eddy current tube examination should be made from :",
           "튜브 와전류탐상에 쓰는 대비 시험편은 무엇으로 만들어야 하는가?"),
      o: [
        Q("any material of the same diameter", "지름만 같으면 어떤 재료든"),
        Q("carbon steel in all cases", "언제나 탄소강"),
        Q("tubing of the same material specification and nominal size as the tubes to be examined", "검사할 튜브와 같은 재료 사양·공칭 크기의 튜브"),
        Q("a material with twice the conductivity of the test object", "시험체보다 전도율이 두 배인 재료"),
      ],
      a: 2,
      why: "ASME Sec.V Art.8. 재질이 다르면 전도율·투자율이 달라 같은 결함도 다른 신호로 나온다. 그래서 지름·두께·재료 사양을 맞춘다.",
    },

    {
      q: Q("In eddy current tube testing, a differential coil arrangement is best suited for detecting :",
           "튜브 와전류탐상에서 차동(differential) 코일이 가장 잘 찾는 것은?"),
      o: [
        Q("gradual wall thinning over a long length", "긴 구간에 걸쳐 서서히 얇아진 감육"),
        Q("short, abrupt discontinuities such as pits and cracks", "공식이나 균열처럼 짧고 갑작스러운 결함"),
        Q("the overall diameter of the tube", "튜브의 전체 지름"),
        Q("the material conductivity", "재료의 전도율"),
      ],
      a: 1,
      why: "차동 코일은 가까이 붙은 두 코일의 차이를 본다. 둘이 함께 겪는 완만한 변화는 서로 지워져 안 잡히고, 한쪽만 지나는 갑작스러운 결함이 크게 뜬다. 완만한 감육은 절대(absolute) 코일로 본다.",
    },

    {
      q: Q("The main reason for using multi-frequency eddy current testing on heat exchanger tubes is to :",
           "열교환기 튜브 와전류탐상에서 다중 주파수를 쓰는 가장 큰 까닭은?"),
      o: [
        Q("shorten the examination time", "검사 시간을 줄이려고"),
        Q("suppress unwanted signals such as support plates and dents", "지지판이나 눌린 자국 같은 방해 신호를 지우려고"),
        Q("increase the pulling speed of the probe", "탐촉자를 더 빨리 당기려고"),
        Q("avoid the need for a reference standard", "대비 시험편을 안 쓰려고"),
      ],
      a: 1,
      why: "주파수마다 지지판·결함의 위상이 다르게 나온다. 두 주파수의 신호를 섞어 지지판 신호만 지우면 그 뒤에 숨은 결함이 드러난다.",
    },

    {
      q: Q("The phase angle of an eddy current signal from a tube is used mainly to determine :",
           "튜브 와전류 신호의 위상각은 주로 무엇을 알아내는 데 쓰는가?"),
      o: [
        Q("the depth of the discontinuity", "결함의 깊이"),
        Q("the length of the tube", "튜브의 길이"),
        Q("the pulling speed of the probe", "탐촉자를 당기는 속도"),
        Q("the ambient temperature", "둘레 온도"),
      ],
      a: 0,
      why: "결함이 깊을수록 신호의 위상이 돌아간다. 그래서 알려진 깊이의 인공 결함으로 위상-깊이 곡선을 만들어 두고 그것으로 깊이를 읽는다. 신호의 크기는 결함의 부피에 더 가깝다.",
    },

    {
      q: Q("Magnetic saturation is used in eddy current testing of ferromagnetic tubing to :",
           "강자성 튜브를 와전류탐상할 때 자기포화를 거는 까닭은?"),
      o: [
        Q("increase the pulling speed", "탐촉자를 빨리 당기려고"),
        Q("reduce the effect of permeability variations", "투자율이 들쭉날쭉한 것의 영향을 줄이려고"),
        Q("increase the standard depth of penetration to zero", "표준 침투깊이를 0 으로 만들려고"),
        Q("eliminate the need for a reference standard", "대비 시험편을 안 쓰려고"),
      ],
      a: 1,
      why: "강자성체는 투자율이 자리마다 달라 결함보다 큰 잡음을 만든다. 자석으로 미리 포화시켜 투자율을 일정하게 만들면 그 잡음이 사라지고 결함만 남는다.",
    },

    {
      q: Q("The signal from a support plate in heat exchanger tube testing is normally :",
           "열교환기 튜브 검사에서 지지판 신호는 보통 어떻게 다루는가?"),
      o: [
        Q("evaluated as a rejectable discontinuity", "불합격 결함으로 평가한다"),
        Q("treated as a nonrelevant indication used as a landmark", "무관련지시로 보고 위치를 가늠하는 표로 쓴다"),
        Q("removed by increasing the frequency", "주파수를 높여 없앤다"),
        Q("ignored and not recorded", "무시하고 기록하지 않는다"),
      ],
      a: 1,
      why: "지지판은 튜브의 결함이 아니다. 다만 신호가 뚜렷해 튜브의 몇 번째 자리인지 세는 데 쓴다. 그 아래 숨은 결함을 보려면 혼합 채널로 지지판 신호를 지운다.",
    },

    {
      q: Q("An absolute coil in eddy current testing is best suited for detecting :",
           "절대(absolute) 코일이 가장 잘 찾는 것은?"),
      o: [
        Q("gradual changes such as general wall thinning", "전면 감육처럼 서서히 달라지는 것"),
        Q("only cracks perpendicular to the axis", "축과 수직인 균열만"),
        Q("only discontinuities under support plates", "지지판 아래의 결함만"),
        Q("nothing, it is used only for calibration", "아무것도 못 찾는다. 교정에만 쓴다"),
      ],
      a: 0,
      why: "절대 코일은 기준값과 견주므로 완만한 변화도 잡아낸다. 대신 온도 변화 같은 것에도 흔들려 잡음이 많다. 차동 코일과 서로 모자란 데를 메운다.",
    },

    {
      q: Q("The test frequency for eddy current tube examination is usually selected so that the phase angle of a 100% through-wall hole is about :",
           "튜브 와전류탐상의 시험 주파수는 보통 100% 관통공의 위상각이 얼마가 되도록 고르는가?"),
      o: [
        Q("0 degrees", "0도"),
        Q("40 degrees", "40도"),
        Q("90 degrees", "90도"),
        Q("180 degrees", "180도"),
      ],
      a: 2,
      why: "관통공을 90°로 잡으면 바깥면 결함과 안쪽면 결함의 위상이 고르게 벌어져 깊이를 가늠하기 좋다. 이 주파수를 F90 이라 부른다.",
    },

    {
      q: Q("Eddy current testing can be applied to :",
           "와전류탐상을 쓸 수 있는 재료는?"),
      o: [
        Q("ferromagnetic materials only", "강자성체만"),
        Q("any electrically conductive material", "전기가 통하는 재료면 무엇이든"),
        Q("nonconductive materials only", "전기가 안 통하는 재료만"),
        Q("any material with a smooth surface", "표면이 매끄러운 재료면 무엇이든"),
      ],
      a: 1,
      why: "와전류는 전기가 통해야 흐른다. 그래서 알루미늄·구리·오스테나이트계 스테인리스강처럼 자화되지 않는 금속도 검사할 수 있다. 자분탐상이 강자성체만 되는 것과 다른 점이다.",
    },

    {
      q: Q("An increase in the conductivity of a nonmagnetic material will cause the eddy current signal to :",
           "비자성 재료의 전도율이 높아지면 와전류 신호는 어떻게 되는가?"),
      o: [
        Q("move along the conductivity curve toward the top of the impedance plane", "임피던스 평면의 전도율 곡선을 따라 위쪽으로 옮겨 간다"),
        Q("disappear entirely", "아주 사라진다"),
        Q("change frequency", "주파수가 달라진다"),
        Q("reverse polarity", "극성이 뒤집힌다"),
      ],
      a: 0,
      why: "임피던스 평면에서 전도율이 다른 재료는 저마다 정해진 자리에 놓인다. 이 성질로 재료를 가려내거나 열처리 상태를 확인한다.",
    },

    {
      q: Q("On the impedance plane, the lift-off signal is normally rotated to lie along the horizontal axis so that :",
           "임피던스 평면에서 리프트오프 신호를 가로축에 맞춰 돌려 놓는 까닭은?"),
      o: [
        Q("the probe can be pulled faster", "탐촉자를 더 빨리 당길 수 있어서"),
        Q("discontinuity signals separate from lift-off and can be read without interference", "결함 신호가 리프트오프와 방향이 갈려 흔들리지 않고 읽히기 때문"),
        Q("the standard depth of penetration increases", "표준 침투깊이가 깊어지기 때문"),
        Q("the reference standard is no longer needed", "대비 시험편이 더는 필요 없기 때문"),
      ],
      a: 1,
      why: "코일이 조금만 떠도 리프트오프 신호가 크게 흔들린다. 그것을 가로축에 눕혀 두면 결함 신호는 위쪽으로 솟아 서로 갈린다. 위상 회전은 검사 전에 대비 시험편으로 잡아 둔다.",
    },

    {
      q: Q("The main advantage of eddy current testing over other surface methods is that it :",
           "다른 표면 검사법과 견주어 와전류탐상이 나은 점은?"),
      o: [
        Q("requires no couplant and can be automated at high speed", "접촉매질이 필요 없고 빠르게 자동화할 수 있다"),
        Q("can detect discontinuities at any depth", "깊이와 상관없이 결함을 찾는다"),
        Q("works on nonconductive materials", "전기가 안 통하는 재료에도 쓸 수 있다"),
        Q("does not require a reference standard", "대비 시험편이 필요 없다"),
      ],
      a: 0,
      why: "코일이 표면에 닿지 않아도 되므로 뜨거운 것·움직이는 것도 검사할 수 있고 자동화가 쉽다. 대신 표면과 표면 가까운 곳만 보이고 전기가 통해야 한다.",
    },

    {
      q: Q("In eddy current testing, an increase in the lift-off distance will cause the signal amplitude to :",
           "와전류탐상에서 리프트오프 거리가 멀어지면 신호의 크기는 어떻게 되는가?"),
      o: [
        Q("increase", "커진다"),
        Q("decrease", "작아진다"),
        Q("remain unchanged", "그대로다"),
        Q("double", "두 배가 된다"),
      ],
      a: 1,
      why: "코일이 멀어질수록 시험체에 걸리는 자장이 약해져 와전류가 덜 흐른다. 그래서 결함 신호도 함께 작아진다. 도장 위에서 검사할 때 감도가 떨어지는 것이 이 때문이다.",
    },

    {
      q: Q("The eddy current signal from a discontinuity on the outside surface of a tube, compared with one of the same size on the inside surface, will be :",
           "튜브 바깥면의 결함 신호는 안쪽면에 있는 같은 크기의 결함과 견주어 어떠한가?"),
      o: [
        Q("larger, because the coil is closer to it", "코일에 더 가까워 더 크다"),
        Q("smaller, because the eddy current density is lower there", "그 자리의 와전류 밀도가 낮아 더 작다"),
        Q("identical in every respect", "무엇 하나 다르지 않다"),
        Q("of opposite polarity but the same size", "극성만 반대이고 크기는 같다"),
      ],
      a: 1,
      why: "탐촉자가 튜브 안에 있으므로 와전류는 안쪽면에서 가장 세고 바깥으로 갈수록 약해진다. 그래서 바깥면 결함은 작고 위상이 돌아간 신호로 나온다.",
    },

    {
      q: Q("Before and after each examination run, the eddy current system calibration shall be :",
           "와전류탐상은 검사를 한 차례 마칠 때마다 교정을 어떻게 해야 하는가?"),
      o: [
        Q("verified with the reference standard", "대비 시험편으로 확인한다"),
        Q("reset to the factory default", "장비 기본값으로 되돌린다"),
        Q("recorded but not verified", "기록만 하고 확인하지는 않는다"),
        Q("verified only if a discontinuity was found", "결함이 나왔을 때만 확인한다"),
      ],
      a: 0,
      why: "ASME Sec.V Art.8. 시작과 끝에 대비 시험편으로 확인한다. 어긋나 있으면 마지막으로 맞았던 교정 뒤에 검사한 튜브를 모두 다시 검사한다.",
    },

    {
      q: Q("A dent in a heat exchanger tube produces an eddy current signal because it :",
           "열교환기 튜브가 눌린 자국(dent)이 와전류 신호를 내는 까닭은?"),
      o: [
        Q("changes the fill factor at that location", "그 자리의 충진율이 달라지기 때문"),
        Q("increases the conductivity of the tube", "튜브의 전도율이 높아지기 때문"),
        Q("removes material from the tube wall", "튜브 벽의 살이 없어지기 때문"),
        Q("magnetizes the tube locally", "그 자리가 자화되기 때문"),
      ],
      a: 0,
      why: "눌려서 안지름이 줄면 코일과 벽 사이 간격이 달라져 충진율이 바뀐다. 살이 없어진 것이 아니므로 결함이 아니라 무관련지시로 다루되, 그 자리에 결함이 숨을 수 있어 따로 살핀다.",
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
