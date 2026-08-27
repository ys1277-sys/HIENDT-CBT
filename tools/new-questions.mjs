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

  /* Level Ⅱ 일반 TOFD 20문항은 2026-08-27 에 넣었다 — tools/_tofd-done.txt */

  /* ═══════════════════════════════════════════
     Level Ⅱ 일반 PAUT — 40문항 → 60문항
     ASME Sec.V Art.4 와 위상배열 원리를 본다
     ═══════════════════════════════════════════ */
  "Level II/General/PAUT": [

    {
      q: Q("A phased array beam is steered by :",
           "위상배열에서 빔의 방향은 무엇으로 바꾸는가?"),
      o: [
        Q("mechanically tilting the wedge", "웨지를 기계로 기울여서"),
        Q("firing the elements with small, controlled time delays", "각 진동자를 아주 짧은 시간차를 두고 차례로 울려서"),
        Q("changing the couplant thickness", "접촉매질 두께를 바꿔서"),
        Q("switching the instrument frequency", "장비의 주파수를 바꿔서"),
      ],
      a: 1,
      why: "진동자마다 울리는 때를 조금씩 어긋내면 각 파면이 겹쳐 원하는 방향으로 기운 파면이 만들어진다. 이 시간차 묶음이 초점 법칙(focal law)이다.",
    },

    {
      q: Q("A focal law in phased array testing is :",
           "위상배열의 초점 법칙(focal law)이란 무엇인가?"),
      o: [
        Q("the set of time delays applied to each element for a given angle and focus", "정해진 각도와 초점을 만들려고 각 진동자에 주는 시간차 묶음"),
        Q("the acceptance criterion for flaw sizing", "결함 크기의 합격 기준"),
        Q("the rule that limits the wedge angle", "웨지 각도를 제한하는 규칙"),
        Q("the calibration curve of the instrument", "장비의 교정 곡선"),
      ],
      a: 0,
      why: "각도 하나, 초점 하나마다 초점 법칙이 하나씩 있다. S-주사는 초점 법칙을 각도별로 줄지어 쏘는 것이고, 선형 주사는 진동자 묶음을 옮겨 가며 같은 법칙을 되풀이하는 것이다.",
    },

    {
      q: Q("Grating lobes in a phased array probe are caused mainly by :",
           "위상배열 탐촉자의 격자엽(grating lobe)은 주로 무엇 때문에 생기는가?"),
      o: [
        Q("too much couplant", "접촉매질이 너무 많아서"),
        Q("element pitch that is too large relative to the wavelength", "파장에 견주어 진동자 피치가 너무 커서"),
        Q("too many elements in the aperture", "구경 안의 진동자 수가 너무 많아서"),
        Q("a wedge angle below the first critical angle", "웨지 각도가 제1 임계각보다 낮아서"),
      ],
      a: 1,
      why: "피치가 파장의 절반을 넘으면 엉뚱한 방향으로도 빔이 서 버린다. 그 가짜 빔이 잡은 반사체가 화면에 결함처럼 뜬다. 그래서 탐촉자를 고를 때 피치와 주파수를 함께 따진다.",
    },

    {
      q: Q("Increasing the number of active elements (a larger aperture) will :",
           "활성 진동자 수를 늘려 구경을 키우면 어떻게 되는가?"),
      o: [
        Q("widen the beam and shorten the near field", "빔이 넓어지고 근거리 음장이 짧아진다"),
        Q("narrow the beam and lengthen the near field", "빔이 좁아지고 근거리 음장이 길어진다"),
        Q("have no effect on the beam", "빔에 아무 영향이 없다"),
        Q("change the refracted angle only", "굴절각만 달라진다"),
      ],
      a: 1,
      why: "구경이 커지면 빔이 모여 좁아지고 근거리 음장이 길어져 더 깊은 데까지 초점을 맞출 수 있다. 대신 진동자를 많이 쓰므로 장비의 채널 수에 걸린다.",
    },

    {
      q: Q("Phased array focusing is possible only within :",
           "위상배열의 집속은 어디까지만 되는가?"),
      o: [
        Q("the near field of the aperture", "구경의 근거리 음장 안"),
        Q("the far field of the aperture", "구경의 원거리 음장 안"),
        Q("the wedge", "웨지 안"),
        Q("any distance without limit", "거리에 상관없이 어디까지나"),
      ],
      a: 0,
      why: "근거리 음장 밖에서는 빔이 저절로 퍼지기만 해 모을 수 없다. 더 깊이 초점을 두려면 구경을 키우거나 주파수를 올려 근거리 음장을 늘려야 한다.",
    },

    {
      q: Q("A sectorial (S) scan is produced by :",
           "부채꼴(S) 주사는 어떻게 만들어지는가?"),
      o: [
        Q("moving the same aperture along the array", "같은 구경을 배열을 따라 옮기며"),
        Q("sweeping the beam through a range of angles from a fixed aperture", "구경을 고정한 채 여러 각도로 빔을 훑으며"),
        Q("rotating the probe by hand", "탐촉자를 손으로 돌리며"),
        Q("firing all elements at the same instant", "모든 진동자를 한꺼번에 울리며"),
      ],
      a: 1,
      why: "구경을 그대로 두고 각도만 바꿔 가며 쏘아 부채꼴 영상을 만든다. 탐촉자를 안 움직여도 여러 각도로 볼 수 있어 접근이 어려운 자리에 좋다.",
    },

    {
      q: Q("The main advantage of a time corrected gain (TCG) over a DAC curve in phased array is that :",
           "위상배열에서 DAC 곡선보다 TCG 가 나은 점은?"),
      o: [
        Q("it needs no calibration block", "교정 시험편이 필요 없다"),
        Q("equal reflectors give equal screen height at every depth, so C-scan colours are comparable", "같은 반사체가 어느 깊이에서나 같은 화면 높이로 나와 C-주사의 색을 견줄 수 있다"),
        Q("it increases the probe frequency", "탐촉자 주파수를 높인다"),
        Q("it removes the need for an encoder", "엔코더를 안 써도 된다"),
      ],
      a: 1,
      why: "DAC 는 곡선을 그어 두고 눈으로 견주는 것이라 깊이마다 화면 높이가 다르다. TCG 는 깊이별로 이득을 더해 높이를 맞추므로, 색으로 크기를 보이는 C-주사·S-주사에 맞는다.",
    },

    {
      q: Q("A scan plan for a phased array weld examination is prepared mainly to :",
           "위상배열 용접부 검사에서 주사 계획(scan plan)을 세우는 가장 큰 까닭은?"),
      o: [
        Q("record the examiner's certification", "검사자의 자격을 기록하려고"),
        Q("show that the beams cover the whole examination volume", "빔이 검사 체적 전체를 덮는지 보이려고"),
        Q("calculate the price of the examination", "검사 비용을 셈하려고"),
        Q("set the pulse repetition rate", "펄스 반복률을 잡으려고"),
      ],
      a: 1,
      why: "각도·구경·웨지 자리·스킵을 그려 보아야 개선면과 루트까지 빔이 닿는지 알 수 있다. 안 닿는 자리가 있으면 각도나 탐촉자 자리를 고쳐 계획을 다시 세운다.",
    },

    {
      q: Q("Before use, the phased array system shall be checked for element activity in order to :",
           "위상배열 장비는 쓰기 전에 진동자 활성도를 확인해야 한다. 까닭은?"),
      o: [
        Q("find dead or weak elements that would distort the beam", "빔을 일그러뜨릴 죽거나 약한 진동자를 찾으려고"),
        Q("measure the wedge angle", "웨지 각도를 재려고"),
        Q("calibrate the encoder", "엔코더를 교정하려고"),
        Q("set the examination frequency", "검사 주파수를 정하려고"),
      ],
      a: 0,
      why: "진동자 하나가 죽으면 그 자리의 파면이 빠져 빔이 기울고 감도가 떨어진다. 몇 개까지 죽어도 되는지는 규격과 절차서가 정해 둔다.",
    },

    {
      q: Q("Compared with a conventional single-angle shear wave examination, phased array normally :",
           "보통 단일 각도 횡파 검사와 견주어 위상배열은 대체로 어떠한가?"),
      o: [
        Q("covers the weld with fewer probe positions and records the data", "탐촉자를 덜 옮기고도 용접부를 덮으며 자료를 기록으로 남긴다"),
        Q("needs no couplant", "접촉매질이 필요 없다"),
        Q("works without a calibration block", "교정 시험편 없이 된다"),
        Q("detects flaws regardless of their orientation", "결함이 어느 쪽으로 기울어 있든 다 찾는다"),
      ],
      a: 0,
      why: "여러 각도를 한 자리에서 쏘므로 탐촉자를 앞뒤로 덜 옮긴다. 엔코더로 자리를 함께 기록해 나중에 다시 판독할 수 있는 것도 큰 차이다. 결함 방향에 안 흔들리는 것은 TOFD 쪽이다.",
    },

    {
      q: Q("The wedge of a phased array probe is used mainly to :",
           "위상배열 탐촉자의 웨지는 주로 무엇에 쓰는가?"),
      o: [
        Q("protect the elements from wear only", "진동자가 닳지 않게 막기만 한다"),
        Q("refract the beam into the material and set the sweep range", "빔을 재료 속으로 굴절시키고 훑을 각도 범위를 잡는다"),
        Q("hold the couplant in place", "접촉매질을 붙들어 둔다"),
        Q("increase the number of elements", "진동자 수를 늘린다"),
      ],
      a: 1,
      why: "웨지의 각도가 굴절각의 한가운데를 정하고, 전자 조향은 그 언저리 몇십 도만 더한다. 그래서 45~70° 를 훑을지 다른 범위를 볼지가 웨지 선택에서 갈린다.",
    },

    {
      q: Q("In the designation 16/128 for a phased array instrument, the numbers mean :",
           "위상배열 장비를 16/128 이라 적을 때 두 숫자는 무엇을 뜻하는가?"),
      o: [
        Q("16 MHz maximum frequency and 128 focal laws", "최대 주파수 16 MHz 와 초점 법칙 128개"),
        Q("16 pulser-receiver channels used at one time, out of 128 element connections", "한 번에 쓰는 송수신 채널 16개, 이을 수 있는 진동자 128개"),
        Q("16 elements in the probe and a 128 mm aperture", "탐촉자 진동자 16개와 구경 128 mm"),
        Q("16 degrees minimum and 128 degrees maximum steering", "조향 각도 최소 16도, 최대 128도"),
      ],
      a: 1,
      why: "앞 숫자가 한 번에 울릴 수 있는 채널 수, 뒤 숫자가 이을 수 있는 진동자 수다. 구경을 채널 수보다 크게 잡을 수 없으므로 이 값이 빔을 얼마나 모을 수 있는지를 가른다.",
    },

    {
      q: Q("The angular range that a phased array probe can be steered is limited mainly by :",
           "위상배열 탐촉자가 조향할 수 있는 각도 범위를 주로 무엇이 제한하는가?"),
      o: [
        Q("the encoder resolution", "엔코더의 분해능"),
        Q("the element width — a wider element steers over a smaller range", "진동자의 폭 — 넓을수록 조향 범위가 좁아진다"),
        Q("the couplant type", "접촉매질의 종류"),
        Q("the length of the cable", "케이블 길이"),
      ],
      a: 1,
      why: "진동자 하나가 내는 소리의 퍼짐이 조향할 수 있는 한계를 정한다. 좁은 진동자는 넓게 퍼져 많이 기울일 수 있고, 넓은 진동자는 앞으로만 쏘아 조금밖에 못 기운다.",
    },

    {
      q: Q("A two-dimensional (matrix) phased array probe differs from a one-dimensional linear array in that it can :",
           "2차원(매트릭스) 위상배열 탐촉자가 1차원 선형 배열과 다른 점은?"),
      o: [
        Q("steer and focus in two planes instead of one", "한 평면이 아니라 두 평면에서 조향하고 집속할 수 있다"),
        Q("work without a wedge", "웨지 없이 쓸 수 있다"),
        Q("operate at twice the frequency", "주파수가 두 배다"),
        Q("be used without an encoder", "엔코더 없이 쓸 수 있다"),
      ],
      a: 0,
      why: "1차원 배열은 배열이 놓인 방향으로만 빔을 기울일 수 있다. 매트릭스 배열은 진동자가 가로세로로 놓여 옆으로도 기울일 수 있어, 결함이 용접선과 비스듬히 놓인 경우에 쓴다.",
    },

    {
      q: Q("The examination volume for a phased array weld examination normally includes :",
           "위상배열 용접부 검사의 검사 체적에는 보통 무엇까지 든다."),
      o: [
        Q("the weld metal only", "용접금속만"),
        Q("the weld and the adjacent base metal (heat affected zone)", "용접부와 그에 잇닿은 모재(열영향부)까지"),
        Q("the weld cap only", "용접 덧살만"),
        Q("the whole plate", "판재 전체"),
      ],
      a: 1,
      why: "융합불량과 균열은 개선면과 열영향부에서 잘 난다. 그래서 용접부 양쪽 모재까지 검사 체적에 넣고, 거기까지 빔이 닿는지 주사 계획으로 확인한다.",
    },

    {
      q: Q("In phased array examination, an encoder is used to :",
           "위상배열 검사에서 엔코더는 무엇에 쓰는가?"),
      o: [
        Q("link each A-scan to its position along the weld", "각 A-주사를 용접선의 어느 자리에서 얻은 것인지 잇는다"),
        Q("measure the wedge temperature", "웨지 온도를 잰다"),
        Q("set the focal laws", "초점 법칙을 정한다"),
        Q("calibrate the amplitude", "진폭을 교정한다"),
      ],
      a: 0,
      why: "자리 정보가 있어야 C-주사·D-주사 영상이 만들어지고 결함 길이를 잴 수 있다. 엔코더 없이 훑으면 화면은 나오지만 기록으로 남기거나 길이를 잴 수 없다.",
    },

    {
      q: Q("The calibration of a phased array system shall be verified :",
           "위상배열 장비의 교정은 언제 다시 확인해야 하는가?"),
      o: [
        Q("only at the start of the job", "작업 시작할 때만"),
        Q("at the start and finish of each examination and at set intervals", "검사를 시작할 때와 끝낼 때, 그리고 정해진 시간마다"),
        Q("once a month", "한 달에 한 번"),
        Q("only when the wedge is changed", "웨지를 바꿀 때만"),
      ],
      a: 1,
      why: "웨지가 닳거나 온도가 달라지면 굴절각과 지연이 흔들린다. 어긋나 있으면 마지막으로 맞았던 때 이후에 검사한 것을 다시 검사한다.",
    },

    {
      q: Q("Wedge attenuation compensation (angle gain compensation) is applied because :",
           "웨지 감쇠 보정(각도별 이득 보정)을 하는 까닭은?"),
      o: [
        Q("the encoder reads differently at each angle", "각도마다 엔코더가 다르게 읽히기 때문"),
        Q("the sound path in the wedge and the transmission differ with each steered angle", "조향 각도마다 웨지 안 경로와 투과율이 달라지기 때문"),
        Q("the couplant dries out at high angles", "각도가 크면 접촉매질이 마르기 때문"),
        Q("the probe frequency changes with angle", "각도에 따라 탐촉자 주파수가 달라지기 때문"),
      ],
      a: 1,
      why: "같은 반사체라도 45° 와 70° 에서 화면 높이가 다르게 나온다. 각도마다 이득을 달리 더해 고르게 맞춰야 S-주사 안에서 크기를 견줄 수 있다.",
    },

    {
      q: Q("The sensitivity for a phased array weld examination is normally set using :",
           "위상배열 용접부 검사의 감도는 보통 무엇으로 잡는가?"),
      o: [
        Q("the backwall echo of the test object", "시험체의 저면 에코"),
        Q("a known reflector such as a side-drilled hole in the calibration block", "교정 시험편의 측면공처럼 크기를 아는 반사체"),
        Q("the amplitude of the lateral wave", "측면파의 크기"),
        Q("the noise level of the instrument", "장비의 잡음 높이"),
      ],
      a: 1,
      why: "크기를 아는 반사체를 정해진 화면 높이에 맞춰 두어야 나중에 나온 지시를 그것과 견줄 수 있다. 각도마다 높이가 달라지므로 웨지 감쇠 보정과 TCG 를 함께 잡는다.",
    },

    {
      q: Q("The phased array examination record shall include :",
           "위상배열 검사 기록에 담아야 하는 것은?"),
      o: [
        Q("the rejected flaws only", "불합격 처리한 결함만"),
        Q("the scan plan, focal laws, calibration data and the encoded scan data", "주사 계획과 초점 법칙, 교정 자료, 그리고 자리가 기록된 주사 자료"),
        Q("a photograph of the weld", "용접부 사진"),
        Q("the wedge serial number only", "웨지 일련번호만"),
      ],
      a: 1,
      why: "위상배열은 자료 자체가 기록이라 나중에 다시 판독한다. 그러려면 어떤 각도로 어떻게 교정해 어디를 훑은 것인지가 함께 남아 있어야 한다.",
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

  /*
   * 이미 넣은 은행에 또 넣지 않는다.
   *
   * 이 도구를 두 번 돌려 PAUT 가 60문항에서 80문항이 된 적이 있다.
   * 지어 넣은 문항은 note 에 자국이 있으니 그것으로 가린다.
   */
  const already = list.filter((q) => q.note && /새로 지은 문항이다/.test(q.note)).length;

  if (already) {
    console.log(`★ ${bank} 에 이미 지어 넣은 문항이 ${already}개 있다. 건너뛴다.`);
    console.log(`   다시 넣으려면 먼저 tools/drop-new.mjs 로 뺀다.\n`);
    continue;
  }

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
