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

  /* Level Ⅱ 일반 여덟 종목은 2026-08-27 에 다 넣었다 */

  /* ═══════════════════════════════════════════
     Level Ⅱ 전문 ECT — 20문항 → 30문항

     전문시험은 「사양서·장치·검사기법·절차서」를 묻는다(E01 표 3).
     그래서 회사 절차서 HIE-NDT-ET-P11 을 보고 짓고, 문제문에도
     절차서 번호를 밝힌다. 일반시험과 반대다.
     ═══════════════════════════════════════════ */
  "Level II/Specific/ECT": [

    {
      q: Q("Under procedure HIE-NDT-ET-P11, calibration shall be verified at least every :",
           "절차서 HIE-NDT-ET-P11 에 따르면 연속 검사 중 교정은 최소 얼마마다 확인해야 하는가?"),
      o: [
        Q("1 hour", "1시간"),
        Q("2 hours", "2시간"),
        Q("4 hours", "4시간"),
        Q("8 hours", "8시간"),
      ],
      a: 2,
      why: "HIE-NDT-ET-P11 6.7. 검사 전·후와 연속 검사 중 최소 4시간마다 교정을 확인한다. 어긋나 있으면 마지막으로 맞았던 교정 뒤에 검사한 튜브를 다시 검사한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the measured size of an artificial flaw shall agree with the calibration standard within :",
           "절차서 HIE-NDT-ET-P11 에 따르면 인공 결함의 측정값은 대비 시험편과 얼마 이내로 맞아야 하는가?"),
      o: [
        Q("± 5%", "± 5%"),
        Q("± 10%", "± 10%"),
        Q("± 15%", "± 15%"),
        Q("± 20%", "± 20%"),
      ],
      a: 0,
      why: "HIE-NDT-ET-P11 6.5. 인공 결함을 재어 ±5% 안에 들면 교정이 유효하다. 벗어나면 다시 교정한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, after connecting power the instrument shall be warmed up for about :",
           "절차서 HIE-NDT-ET-P11 에 따르면 전원을 이은 뒤 장비를 얼마 동안 예열하는가?"),
      o: [
        Q("1 to 2 minutes", "1~2분"),
        Q("5 to 10 minutes", "5~10분"),
        Q("20 to 30 minutes", "20~30분"),
        Q("no warm-up is needed", "예열은 필요 없다"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P11 7.3. 전자 회로가 안정되기 전에 교정하면 검사 중에 값이 흘러 어긋난다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the depth curve table used to read flaw depth is created from :",
           "절차서 HIE-NDT-ET-P11 에 따르면 결함 깊이를 읽는 데 쓰는 깊이 곡선(Depth Curves) 표는 무엇으로 만드는가?"),
      o: [
        Q("the backwall signal of the tube", "튜브의 저면 신호"),
        Q("the signals from the artificial flaws in the calibration tube", "교정 튜브의 인공 결함에서 얻은 신호"),
        Q("the noise level of the instrument", "장비의 잡음 높이"),
        Q("the pulling speed of the probe", "탐촉자를 당기는 속도"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P11 6.2·6.3. 깊이를 아는 인공 결함마다 신호를 얻어 채널별 표를 만들고, 그 곡선으로 검사 중에 나온 신호의 깊이를 읽는다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the minimum resolution of the recording system shall be :",
           "절차서 HIE-NDT-ET-P11 에 따른 기록 장치의 최소 분해능은?"),
      o: [
        Q("8 bits per data point", "데이터 점당 8비트"),
        Q("12 bits per data point", "데이터 점당 12비트"),
        Q("16 bits per data point", "데이터 점당 16비트"),
        Q("32 bits per data point", "데이터 점당 32비트"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P11 5.1.2.2. 전 화면에서 데이터 점당 12비트 이상이어야 한다. 분해능이 낮으면 작은 신호가 뭉개진다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the strip chart display shall be able to show at least :",
           "절차서 HIE-NDT-ET-P11 에 따르면 스트립 차트는 최소 몇 개의 기록을 보일 수 있어야 하는가?"),
      o: [
        Q("one record", "1개"),
        Q("two records", "2개"),
        Q("four records", "4개"),
        Q("eight records", "8개"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P11 5.1.2.1. 최소 2개다. 진폭과 위상을 나란히 놓고 보아야 결함인지 지지판인지 가려진다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the analogue output frequency response of the instrument shall be constant within :",
           "절차서 HIE-NDT-ET-P11 에 따르면 장비의 아날로그 출력 주파수 응답은 입력값의 몇 % 이내로 일정해야 하는가?"),
      o: [
        Q("2%", "2%"),
        Q("5%", "5%"),
        Q("10%", "10%"),
        Q("20%", "20%"),
      ],
      a: 0,
      why: "HIE-NDT-ET-P11 5.1.1.2. dc 부터 Fmax 까지 2% 이내로 일정해야 한다. Fmax 는 탐촉자 최대 이동속도에 0.4 Hz-s/mm 를 곱한 값이다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the data acquisition rate shall digitize at least :",
           "절차서 HIE-NDT-ET-P11 에 따른 신호 수집율은 최소 얼마인가?"),
      o: [
        Q("10 signals per inch of tubing", "배관 1인치당 10개"),
        Q("20 signals per inch of tubing", "배관 1인치당 20개"),
        Q("30 signals per inch of tubing", "배관 1인치당 30개"),
        Q("60 signals per inch of tubing", "배관 1인치당 60개"),
      ],
      a: 2,
      why: "HIE-NDT-ET-P11 5.1.1.1. 1인치당 최소 30개다. 표본이 성기면 짧은 결함이 표본 사이로 빠져나간다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the results of the examination may be evaluated by :",
           "절차서 HIE-NDT-ET-P11 에 따르면 검사 결과를 평가할 수 있는 사람은?"),
      o: [
        Q("any examiner who performed the scan", "주사를 한 검사자면 누구든"),
        Q("an examiner qualified as ET Level II or Level III", "ET Level Ⅱ 또는 Level Ⅲ 로 자격부여된 검사원"),
        Q("the equipment manufacturer", "장비 제조업체"),
        Q("the purchaser only", "발주자만"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P11 3.0. 자료를 모으는 것과 판정하는 것은 다르다. 판정은 ET Level Ⅱ 이상이 한다. 자격인정은 HIE-QP-E01 을 따른다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P11, the calibration standard tube shall have :",
           "절차서 HIE-NDT-ET-P11 에 따른 대비 시험편의 요건은?"),
      o: [
        Q("the same nominal diameter, thickness and material as the tubes to be examined", "검사할 튜브와 같은 공칭직경·두께·재질"),
        Q("any diameter as long as the material is the same", "재질만 같으면 지름은 무엇이든"),
        Q("twice the wall thickness of the tubes to be examined", "검사할 튜브의 두 배 두께"),
        Q("carbon steel in every case", "언제나 탄소강"),
      ],
      a: 0,
      why: "HIE-NDT-ET-P11 5.5. 지름·두께·재질(화학 성분)이 같아야 한다. 하나라도 다르면 같은 결함이 다른 신호로 나와 교정이 어긋난다.",
    },
  ],

  /* ═══════════════════════════════════════════
     Level Ⅱ 전문 RFT — 20문항 → 30문항
     회사 절차서 HIE-NDT-ET-P99 를 본다
     ═══════════════════════════════════════════ */
  "Level II/Specific/RFT": [

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the depth of a calibration discontinuity shall be within :",
           "절차서 HIE-NDT-ET-P99 에 따르면 교정용 불연속의 깊이는 어느 범위 안에 들어야 하는가?"),
      o: [
        Q("± 10% of the specified depth or ± 0.005 in., whichever is smaller", "지정 깊이의 ±10% 또는 ±0.005 in. 가운데 작은 값"),
        Q("± 20% of the specified depth or ± 0.003 in., whichever is smaller", "지정 깊이의 ±20% 또는 ±0.003 in. 가운데 작은 값"),
        Q("± 5% of the specified depth only", "지정 깊이의 ±5% 만"),
        Q("± 1 mm regardless of depth", "깊이와 상관없이 ±1 mm"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 4.3.2. 깊이는 불연속의 한가운데에서 재며, 지정 깊이의 ±20% 와 ±0.003 in. 가운데 작은 값 안에 들어야 한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the flat machined flaw in the calibration tube is made with a milling tool of :",
           "절차서 HIE-NDT-ET-P99 에 따르면 교정 튜브의 평면 가공 결함은 지름 얼마인 밀링 공구로 만드는가?"),
      o: [
        Q("0.125 in.", "0.125 in."),
        Q("0.250 in.", "0.250 in."),
        Q("0.500 in.", "0.500 in."),
        Q("1.000 in.", "1.000 in."),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 4.3.1. 지름 0.250 in. 밀링 공구로 측면 밀링해 모서리를 둥글게 만든다. 깊이는 50%, 축 방향 길이는 튜브 공칭 외경의 절반이다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the edges of the short circumferential groove in the calibration tube shall be bevelled at :",
           "절차서 HIE-NDT-ET-P99 에 따르면 교정 튜브의 짧은 원주 그루브 가장자리는 몇 도로 기울이는가?"),
      o: [
        Q("45°", "45°"),
        Q("60°", "60°"),
        Q("90°", "90°"),
        Q("105°", "105°"),
      ],
      a: 3,
      why: "HIE-NDT-ET-P99 4.3.1. 105°다. 깊이 20%, 축 방향 길이 0.625 in. 인 짧은 원주 홈이며, 마모 흠과 긴 원주 그루브도 같은 105°로 기울인다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, sensitivity is set so that the artificial flaw signal is :",
           "절차서 HIE-NDT-ET-P99 에 따르면 감도는 인공 결함 지시가 얼마로 나오도록 맞추는가?"),
      o: [
        Q("40% to 80% of screen height and 1 mm to 20 mm on the strip chart", "화면 높이의 40~80%, 스트립 차트에서 1~20 mm"),
        Q("10% to 30% of screen height", "화면 높이의 10~30%"),
        Q("exactly 100% of screen height", "화면 높이의 꼭 100%"),
        Q("as high as possible without limit", "한도 없이 될 수 있는 대로 높게"),
      ],
      a: 0,
      why: "HIE-NDT-ET-P99 6.0. 너무 낮으면 잡음에 묻히고, 너무 높으면 신호가 잘려 위상을 못 읽는다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the transfer device shall be able to pull the coil at a constant speed of about :",
           "절차서 HIE-NDT-ET-P99 에 따르면 이송 장치는 코일을 얼마의 일정한 속도로 당길 수 있어야 하는가?"),
      o: [
        Q("0.05 m/s", "0.05 m/s"),
        Q("0.2 m/s", "0.2 m/s"),
        Q("1.0 m/s", "1.0 m/s"),
        Q("2.0 m/s", "2.0 m/s"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 4.4. 0.2 m/s 로 당길 수 있고 그 속도를 조절할 수 있어야 한다. 이송 장치를 쓸 수 없으면 사람이 코일을 일정한 속도로 당긴다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, a calibration standard of a material different from the tubes may be used only if the frequencies used differ by :",
           "절차서 HIE-NDT-ET-P99 에 따르면 검사할 튜브와 재질이 다른 대비 시험편은 쓰는 주파수가 몇 배 이내일 때만 쓸 수 있는가?"),
      o: [
        Q("less than 2 times", "2배 미만"),
        Q("less than 5 times", "5배 미만"),
        Q("less than 10 times", "10배 미만"),
        Q("any difference is acceptable", "차이가 얼마든 상관없다"),
      ],
      a: 0,
      why: "HIE-NDT-ET-P99 4.3. 2배 이상 차이 나면 그 대비 시험편은 적절하지 않은 것으로 보아, 검사할 재료를 더 정확히 나타내는 재료로 만든 것으로 바꾼다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, if the system goes out of calibration during the examination :",
           "절차서 HIE-NDT-ET-P99 에 따르면 검사 도중 장비가 교정에서 벗어나면 어떻게 하는가?"),
      o: [
        Q("record the fact and continue", "그 사실을 기록하고 그대로 이어 간다"),
        Q("recalibrate, record it, and re-examine all tubes examined since the last valid calibration", "재교정하고 기록한 뒤, 마지막으로 유효했던 교정 뒤에 검사한 튜브를 모두 다시 검사한다"),
        Q("re-examine only the last tube", "마지막 튜브만 다시 검사한다"),
        Q("change the probe and continue without recalibration", "탐촉자만 바꾸고 재교정 없이 이어 간다"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 5.8. 어긋난 뒤에 검사한 것은 믿을 수 없다. 재교정은 5.4항부터 5.7항까지를 되풀이하고 보고서에 남긴다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the wear scar in the calibration tube is a tapered groove of :",
           "절차서 HIE-NDT-ET-P99 에 따르면 교정 튜브의 마모 흠(wear scar)은 깊이 얼마인 홈인가?"),
      o: [
        Q("20% depth", "깊이 20%"),
        Q("40% depth", "깊이 40%"),
        Q("60% depth", "깊이 60%"),
        Q("80% depth", "깊이 80%"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 4.3.1. 튜브 지지대에서 생기는 마모를 본뜬 것으로, 튜브 원주의 180° 넘게 이어지는 깊이 40%의 홈이다. 홈 바닥에서 잰 축 방향 길이는 0.625 in. 다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, the tapered flaw near the support has a depth of :",
           "절차서 HIE-NDT-ET-P99 에 따르면 지지대 부근 침식을 본뜬 테이퍼형 결함의 깊이는?"),
      o: [
        Q("20%", "20%"),
        Q("40%", "40%"),
        Q("60%", "60%"),
        Q("80%", "80%"),
      ],
      a: 2,
      why: "HIE-NDT-ET-P99 4.3.1. 깊이 60%의 홈이며, 급한 쪽 면은 튜브 축에 대해 65°, 가장 깊은 자리에서의 원주 방향 범위는 90°다.",
    },

    {
      q: Q("Under procedure HIE-NDT-ET-P99, before eddy current examination the tubes shall be :",
           "절차서 HIE-NDT-ET-P99 에 따르면 검사 전에 튜브는 어떤 상태여야 하는가?"),
      o: [
        Q("magnetically saturated", "자기포화되어 있어야 한다"),
        Q("clean", "깨끗해야 한다"),
        Q("filled with couplant", "접촉매질로 채워 두어야 한다"),
        Q("heated above 50°C", "50℃ 넘게 데워 두어야 한다"),
      ],
      a: 1,
      why: "HIE-NDT-ET-P99 7.0. 스케일이나 침전물이 있으면 탐촉자가 걸려 속도가 들쭉날쭉해지고, 그 자체가 신호를 만들어 결함을 가린다. 신호를 읽는 데 방해가 될 만한 것은 미리 없애거나 살펴 둔다.",
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
