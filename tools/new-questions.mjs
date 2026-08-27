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

  /* Level Ⅱ 전문 ECT·RFT 20문항은 2026-08-27 에 넣었다 — tools/_spec-ect-rft-done.txt */

  /* Level Ⅱ 전문 TOFD 15문항은 2026-08-27 에 넣었다 — tools/_spec-tofd-done.txt */

  /* ═══════════════════════════════════════════
     Level Ⅲ 기초 — 55문항 → 83문항

     E02 5.2.2 가 정한 기초시험 구성에 맞춰 세 갈래로 나눠 짓는다.
       가) SNT-TC-1A 규정의 이해
       나) 적용 재질, 제작 및 생산 기술
       다) 다른 종목의 Level Ⅱ 문제와 비슷한 문제
     ═══════════════════════════════════════════ */
  "Level III/Basic": [

    /* ── 가) SNT-TC-1A 규정 ───────────────── */

    {
      q: Q("Under SNT-TC-1A, the document that an employer must prepare to describe how its NDT personnel are trained, examined and certified is the :",
           "SNT-TC-1A 에 따라 고용주가 자사 비파괴검사 요원의 교육·시험·인증 방법을 적어 두어야 하는 문서는?"),
      o: [
        Q("Quality Manual", "품질 매뉴얼"),
        Q("Written Practice", "사내 규정(Written Practice)"),
        Q("Inspection Procedure", "검사 절차서"),
        Q("Technique Sheet", "기법 지시서"),
      ],
      a: 1,
      why: "SNT-TC-1A 는 권고 규격이라 그대로 쓰라는 것이 아니다. 고용주가 자기 사정에 맞춰 사내 규정을 만들고 그것으로 요원을 인증한다.",
    },

    {
      q: Q("Under SNT-TC-1A, near vision acuity of NDT personnel shall be verified :",
           "SNT-TC-1A 에 따르면 비파괴검사 요원의 근거리 시력은 얼마마다 확인하는가?"),
      o: [
        Q("annually", "1년마다"),
        Q("every 2 years", "2년마다"),
        Q("every 3 years", "3년마다"),
        Q("only at initial certification", "최초 인증 때만"),
      ],
      a: 0,
      why: "근거리 시력은 1년마다, 색 구별 능력은 최초와 그 뒤 5년마다 확인한다. 시력이 안 되면 자격이 있어도 검사할 수 없다.",
    },

    {
      q: Q("Under SNT-TC-1A, an NDT Level I is qualified to :",
           "SNT-TC-1A 에 따른 NDT Level Ⅰ 이 할 수 있는 일은?"),
      o: [
        Q("develop examination techniques and approve procedures", "검사 기법을 개발하고 절차서를 승인한다"),
        Q("perform calibrations and specific examinations, and record results under supervision", "지시에 따라 교정과 정해진 검사를 하고 결과를 기록한다"),
        Q("interpret and evaluate results against acceptance criteria", "합격 기준에 견주어 결과를 판독하고 평가한다"),
        Q("train and examine Level II candidates", "Level Ⅱ 응시자를 교육하고 시험한다"),
      ],
      a: 1,
      why: "Level Ⅰ 은 지시받은 대로 하고 기록한다. 판독과 평가는 Level Ⅱ 부터, 기법 개발과 절차서 승인은 Level Ⅲ 다.",
    },

    {
      q: Q("Under SNT-TC-1A, the NDT Level III is responsible for :",
           "SNT-TC-1A 에 따른 NDT Level Ⅲ 의 책임은?"),
      o: [
        Q("performing calibrations only", "교정만 수행하는 것"),
        Q("establishing techniques, approving procedures, and training and examining personnel", "기법을 세우고 절차서를 승인하며 요원을 교육·시험하는 것"),
        Q("recording examination results only", "검사 결과를 기록하는 것만"),
        Q("purchasing the examination equipment", "검사 장비를 구매하는 것"),
      ],
      a: 1,
      why: "Level Ⅲ 는 사내 규정을 세우고, 기법과 절차서를 승인하며, 아래 등급을 교육·시험·인증하는 자리다. 규격 해석과 방법 선택도 여기서 한다.",
    },

    {
      q: Q("Under SNT-TC-1A, recertification of Level I and Level II personnel may be based on :",
           "SNT-TC-1A 에 따르면 Level Ⅰ·Ⅱ 의 재인증은 무엇에 근거할 수 있는가?"),
      o: [
        Q("re-examination, or evidence of continuing satisfactory performance", "재시험, 또는 계속 만족스럽게 수행해 왔다는 증거"),
        Q("re-examination only", "재시험만"),
        Q("payment of a renewal fee", "갱신 수수료 납부"),
        Q("a new vision test only", "새 시력검사만"),
      ],
      a: 0,
      why: "둘 중 하나다. 계속 만족스럽게 수행했는지는 그 종목 Level Ⅲ 가 평가한다. Level Ⅲ 는 재시험이나 ASNT 자격 유지로 재인증한다.",
    },

    {
      q: Q("Under SNT-TC-1A, when an employer uses an outside agency for NDT personnel qualification, the responsibility for certification remains with :",
           "SNT-TC-1A 에 따라 외부 기관에 자격인정을 맡겨도 인증의 책임은 누구에게 있는가?"),
      o: [
        Q("the outside agency", "외부 기관"),
        Q("the employer", "고용주"),
        Q("the purchaser", "발주자"),
        Q("ASNT", "ASNT"),
      ],
      a: 1,
      why: "시험을 남에게 맡길 수는 있어도 인증서를 내주는 것은 고용주다. 그래서 사내 규정에 외부 기관을 어떻게 쓰는지 적어 두어야 한다.",
    },

    {
      q: Q("Under SNT-TC-1A, an NDT Level II is qualified to :",
           "SNT-TC-1A 에 따른 NDT Level Ⅱ 가 할 수 있는 일은?"),
      o: [
        Q("only record data taken by others", "남이 얻은 자료를 기록하는 것만"),
        Q("set up and calibrate equipment, interpret and evaluate results, and prepare written instructions", "장비를 맞추고 교정하며, 결과를 판독·평가하고, 작업 지시서를 쓰는 일"),
        Q("approve the written practice of the employer", "고용주의 사내 규정을 승인하는 일"),
        Q("certify Level III personnel", "Level Ⅲ 요원을 인증하는 일"),
      ],
      a: 1,
      why: "Level Ⅱ 는 판독과 평가를 할 수 있고 Level Ⅰ 을 지도한다. 다만 사내 규정을 승인하거나 절차서를 세우는 것은 Level Ⅲ 의 일이다.",
    },

    {
      q: Q("Under SNT-TC-1A, a candidate's certification is automatically terminated when :",
           "SNT-TC-1A 에 따라 인증이 자동으로 끝나는 때는?"),
      o: [
        Q("the certification period expires", "인증 기간이 다 되었을 때"),
        Q("employment is terminated, or the employer finds the person's performance unsatisfactory", "고용이 끝나거나, 고용주가 수행이 만족스럽지 않다고 판단했을 때"),
        Q("the person changes NDT method", "종목을 바꿀 때"),
        Q("the annual vision test is passed", "연간 시력검사에 통과했을 때"),
      ],
      a: 1,
      why: "인증은 고용주가 자기 요원에게 주는 것이라 고용 관계가 끝나면 함께 끝난다. 수행이 못 미더울 때도 고용주가 끝낼 수 있다.",
    },

    /* ── 나) 재질·제작·생산 기술 ───────────── */

    {
      q: Q("The region of base metal next to a weld whose properties have been changed by the heat of welding is called the :",
           "용접 열 때문에 성질이 바뀐 용접부 옆 모재 부위를 무엇이라 하는가?"),
      o: [
        Q("weld metal", "용접금속"),
        Q("fusion line", "융합선"),
        Q("heat affected zone", "열영향부"),
        Q("root pass", "루트 패스"),
      ],
      a: 2,
      why: "녹지는 않았으나 열을 받아 조직이 바뀐 자리다. 굳고 물러져 균열이 잘 나므로 검사할 때 용접부와 함께 본다.",
    },

    {
      q: Q("Undercut in a weld is best described as :",
           "용접부의 언더컷을 바르게 설명한 것은?"),
      o: [
        Q("a groove melted into the base metal at the weld toe and left unfilled", "용접 지단부의 모재가 녹아 파인 채 채워지지 않은 홈"),
        Q("weld metal that has run over the base metal without fusing", "용접금속이 모재 위로 흘러 붙기만 한 것"),
        Q("a cavity caused by trapped gas", "갇힌 가스로 생긴 빈 자리"),
        Q("a crack at the weld root", "용접 루트의 균열"),
      ],
      a: 0,
      why: "전류가 세거나 운봉 속도가 빠르면 지단부 모재가 파인다. 파인 자리가 응력이 몰리는 곳이 되어 피로 파괴의 시작점이 된다. 흘러 붙기만 한 것은 오버랩이다.",
    },

    {
      q: Q("The difference between incomplete penetration and incomplete fusion is that incomplete penetration :",
           "용입불량과 융합불량의 차이는 무엇인가?"),
      o: [
        Q("occurs only in the weld cap", "용입불량은 덧살에서만 생긴다"),
        Q("means the weld metal did not extend through the joint thickness at the root", "용입불량은 루트에서 용접금속이 이음 두께를 다 채우지 못한 것이다"),
        Q("is always caused by hydrogen", "용입불량은 늘 수소 때문에 생긴다"),
        Q("is another name for slag inclusion", "용입불량은 슬래그 개재물의 다른 이름이다"),
      ],
      a: 1,
      why: "용입불량은 루트가 덜 채워진 것이고, 융합불량은 용접금속이 모재나 앞 패스에 안 붙은 것이다. 둘 다 면상 결함이라 대개 불합격이다.",
    },

    {
      q: Q("Slag inclusions in multi-pass welds are most often caused by :",
           "다층 용접에서 슬래그 개재물이 생기는 가장 큰 까닭은?"),
      o: [
        Q("excessive preheat", "예열이 지나쳐서"),
        Q("failure to clean slag from the previous pass", "앞 패스의 슬래그를 안 걷어내서"),
        Q("welding too slowly", "너무 천천히 용접해서"),
        Q("using too little filler metal", "용가재를 너무 적게 써서"),
      ],
      a: 1,
      why: "패스마다 슬래그를 걷어내지 않으면 다음 패스가 그 위를 덮어 가둔다. 개선각이 좁거나 운봉이 나빠도 잘 생긴다.",
    },

    {
      q: Q("Hydrogen-induced (delayed) cracking in weldments typically occurs :",
           "용접부의 수소 유기 균열(지연 균열)은 보통 언제 생기는가?"),
      o: [
        Q("during the welding arc", "용접 아크가 켜져 있는 동안"),
        Q("hours or days after the weld has cooled", "용접부가 식은 뒤 몇 시간에서 며칠 지나"),
        Q("only above 500°C", "500℃ 위에서만"),
        Q("only in austenitic stainless steel", "오스테나이트계 스테인리스강에서만"),
      ],
      a: 1,
      why: "수소가 조직 속을 돌아다니다 응력이 몰린 자리에 모여 균열을 낸다. 시간이 걸리므로 용접 직후 검사에서는 안 보일 수 있어, 규격이 식힌 뒤 일정 시간을 두고 검사하게 한다.",
    },

    {
      q: Q("The carbon equivalent (CE) of a steel is used mainly to judge :",
           "강의 탄소당량(CE)은 주로 무엇을 가늠하는 데 쓰는가?"),
      o: [
        Q("the corrosion resistance", "부식에 견디는 정도"),
        Q("the weldability and the risk of cracking", "용접성과 균열이 날 위험"),
        Q("the melting point", "녹는점"),
        Q("the electrical conductivity", "전기 전도율"),
      ],
      a: 1,
      why: "탄소만이 아니라 망간·크롬·몰리브덴 같은 합금 원소를 탄소로 환산해 더한 값이다. 이 값이 높을수록 열영향부가 굳어 균열이 나기 쉬워, 예열 온도와 후열처리를 정하는 잣대가 된다.",
    },

    {
      q: Q("Post-weld heat treatment (stress relief) is applied mainly to :",
           "용접 후 열처리(응력제거)를 하는 가장 큰 까닭은?"),
      o: [
        Q("reduce residual stresses and soften the heat affected zone", "잔류응력을 줄이고 열영향부를 무르게 하려고"),
        Q("increase the hardness of the weld", "용접부를 단단하게 하려고"),
        Q("remove surface oxide", "표면 산화층을 없애려고"),
        Q("add carbon to the weld metal", "용접금속에 탄소를 더하려고"),
      ],
      a: 0,
      why: "용접은 국부로 데웠다 식히므로 잔류응력이 남는다. 그대로 두면 응력부식균열이나 변형이 난다. 적절한 온도로 데웠다 천천히 식혀 푼다.",
    },

    {
      q: Q("Sensitization of austenitic stainless steel refers to :",
           "오스테나이트계 스테인리스강의 예민화란 무엇인가?"),
      o: [
        Q("an increase in tensile strength after welding", "용접 뒤 인장강도가 오르는 것"),
        Q("chromium carbide precipitation at grain boundaries, leaving the area prone to intergranular corrosion", "결정립계에 크롬 탄화물이 나와 그 자리가 입계부식에 약해지는 것"),
        Q("loss of magnetism after heat treatment", "열처리 뒤 자성을 잃는 것"),
        Q("the formation of martensite during quenching", "담금질 중 마르텐사이트가 생기는 것"),
      ],
      a: 1,
      why: "500~800℃ 언저리에 오래 머물면 크롬이 탄소와 붙어 결정립계로 몰린다. 그 둘레는 크롬이 모자라 부식에 약해진다. 저탄소강종(304L)이나 안정화강종(321·347)을 쓰거나 용체화 처리로 푼다.",
    },

    {
      q: Q("Creep in metals is best described as :",
           "금속의 크리프를 바르게 설명한 것은?"),
      o: [
        Q("sudden fracture under impact loading", "충격을 받아 갑자기 깨지는 것"),
        Q("slow, continuous deformation under constant stress at elevated temperature", "높은 온도에서 일정한 응력을 받아 천천히 계속 늘어나는 것"),
        Q("cracking caused by cyclic loading", "되풀이 하중으로 갈라지는 것"),
        Q("corrosion at grain boundaries", "결정립계가 부식되는 것"),
      ],
      a: 1,
      why: "보일러 튜브나 고온 배관처럼 오래 뜨겁게 쓰는 부재에서 문제가 된다. 되풀이 하중으로 갈라지는 것은 피로다.",
    },

    {
      q: Q("Stress corrosion cracking requires the simultaneous presence of :",
           "응력부식균열이 나려면 무엇이 함께 있어야 하는가?"),
      o: [
        Q("a susceptible material, a specific corrosive environment, and tensile stress", "그 균열에 약한 재질, 특정한 부식 환경, 그리고 인장응력"),
        Q("high temperature and impact loading only", "높은 온도와 충격 하중만"),
        Q("hydrogen and preheat", "수소와 예열"),
        Q("a compressive stress and a neutral environment", "압축응력과 중성 환경"),
      ],
      a: 0,
      why: "셋 가운데 하나만 없어도 안 난다. 그래서 잔류응력을 없애거나(응력제거), 환경을 바꾸거나, 재질을 바꿔 막는다. 오스테나이트계에 염소, 황동에 암모니아가 대표적인 짝이다.",
    },

    {
      q: Q("The ductile-to-brittle transition temperature of a steel is important because below it the steel :",
           "강의 연성-취성 천이온도가 중요한 까닭은, 그보다 낮은 온도에서 강이 어떻게 되기 때문인가?"),
      o: [
        Q("becomes stronger and safer", "더 세지고 안전해지기 때문"),
        Q("fractures with little deformation, even under moderate load", "웬만한 하중에도 거의 늘어나지 않고 깨지기 때문"),
        Q("loses all magnetism", "자성을 아주 잃기 때문"),
        Q("begins to creep rapidly", "빠르게 크리프가 일어나기 때문"),
      ],
      a: 1,
      why: "낮은 온도에서 강은 미리 알리는 변형 없이 갑자기 깨진다. 그래서 저온에서 쓰는 부재는 충격시험으로 이 성질을 확인한다.",
    },

    {
      q: Q("A cold shut in a casting is :",
           "주조품의 콜드셧(cold shut)이란 무엇인가?"),
      o: [
        Q("a crack caused by quenching", "담금질로 생긴 균열"),
        Q("a discontinuity where two streams of metal met but did not fuse", "두 갈래 쇳물이 만났으나 하나로 붙지 못한 자리"),
        Q("gas trapped during solidification", "굳는 동안 갇힌 가스"),
        Q("shrinkage at the last part to solidify", "가장 늦게 굳은 자리의 수축"),
      ],
      a: 1,
      why: "쇳물이 식으면서 흐름이 멎어 두 갈래가 만나도 안 붙는다. 표면에 열려 있으면 침투탐상으로, 속에 있으면 방사선으로 찾는다.",
    },

    {
      q: Q("A seam in wrought product is best described as :",
           "압연 제품의 심(seam)을 바르게 설명한 것은?"),
      o: [
        Q("a longitudinal discontinuity, open to the surface, formed during rolling", "압연 중에 생겨 표면에 길이 방향으로 열린 결함"),
        Q("a transverse crack caused by welding", "용접으로 생긴 가로 균열"),
        Q("gas porosity in a casting", "주조품의 기공"),
        Q("a lack of fusion in a weld", "용접부의 융합불량"),
      ],
      a: 0,
      why: "빌렛의 결함이나 표면 흠이 압연으로 늘어나 길게 이어진 것이다. 표면에 열려 있어 자분탐상·침투탐상으로 찾는다.",
    },

    {
      q: Q("In submerged arc welding, the arc and molten pool are shielded by :",
           "서브머지드 아크 용접에서 아크와 용융지를 덮어 보호하는 것은?"),
      o: [
        Q("an inert gas from a nozzle", "노즐에서 나오는 불활성 가스"),
        Q("a blanket of granular flux", "낟알 모양 용제(flux)를 덮은 층"),
        Q("a vacuum chamber", "진공 상자"),
        Q("the coating on the electrode", "용접봉의 피복"),
      ],
      a: 1,
      why: "용제가 아크를 덮어 눈에 안 보이므로 「잠긴(submerged)」이라 부른다. 용제가 대기를 막고 슬래그를 만든다. 그 슬래그를 패스마다 걷어내야 개재물이 안 생긴다.",
    },

    /* ── 다) 다른 종목의 Level Ⅱ 문제와 비슷한 것 ── */

    {
      q: Q("Which NDT method is best suited to detect a subsurface planar flaw in a thick steel weld?",
           "두꺼운 강 용접부 속에 있는 면상 결함을 찾는 데 가장 알맞은 검사법은?"),
      o: [
        Q("liquid penetrant testing", "침투탐상검사"),
        Q("visual testing", "육안검사"),
        Q("magnetic particle testing", "자분탐상검사"),
        Q("ultrasonic testing", "초음파탐상검사"),
      ],
      a: 3,
      why: "침투와 육안은 표면만 본다. 자분은 표면과 표면 바로 아래만 본다. 두께 속의 면상 결함은 초음파가 가장 잘 잡는다. 방사선은 빔과 나란한 면상 결함을 놓치기 쉽다.",
    },

    {
      q: Q("Radiography is generally better than ultrasonic testing for detecting :",
           "초음파탐상보다 방사선투과검사가 대체로 나은 것은?"),
      o: [
        Q("volumetric flaws such as porosity and slag", "기공이나 슬래그 같은 체적 결함"),
        Q("tight cracks parallel to the surface", "표면과 나란한 밀착 균열"),
        Q("laminations in plate", "판재의 라미네이션"),
        Q("flaw depth measurement", "결함의 깊이 측정"),
      ],
      a: 0,
      why: "방사선은 두께 차이를 그림자로 보므로 부피가 있는 결함을 잘 담는다. 반면 밀착 균열이나 라미네이션처럼 빔과 나란한 얇은 결함은 두께 차가 거의 없어 놓친다. 그것은 초음파의 몫이다.",
    },

    {
      q: Q("Which method can be used on nonmagnetic, nonconductive materials such as ceramics?",
           "세라믹처럼 자화되지도 않고 전기도 안 통하는 재료에 쓸 수 있는 검사법은?"),
      o: [
        Q("magnetic particle testing", "자분탐상검사"),
        Q("eddy current testing", "와전류탐상검사"),
        Q("liquid penetrant testing", "침투탐상검사"),
        Q("remote field testing", "원격장탐상검사"),
      ],
      a: 2,
      why: "침투탐상은 재료의 자성이나 전도성과 상관없이 표면에 열린 결함이면 찾는다. 다만 다공질이라 표면 전체가 침투액을 머금는 재료에는 못 쓴다.",
    },

    {
      q: Q("Acoustic emission testing detects :",
           "음향방출검사(AE)는 무엇을 찾는가?"),
      o: [
        Q("the shape of a static discontinuity", "가만히 있는 결함의 생김새"),
        Q("stress waves released as a discontinuity grows under load", "하중을 받아 결함이 자랄 때 나오는 응력파"),
        Q("the thickness of a coating", "도장의 두께"),
        Q("the conductivity of the material", "재료의 전도율"),
      ],
      a: 1,
      why: "결함이 자라야 소리가 난다. 그래서 부재 전체를 한 번에 지켜보며 「지금 커지고 있는 것」을 찾는 데 쓴다. 가만히 있는 결함은 못 찾으므로 다른 방법으로 확인한다.",
    },

    {
      q: Q("The thickness of a remaining wall in a corroded pipe is most commonly measured by :",
           "부식된 배관의 남은 두께는 보통 무엇으로 재는가?"),
      o: [
        Q("liquid penetrant testing", "침투탐상검사"),
        Q("ultrasonic thickness measurement", "초음파 두께 측정"),
        Q("magnetic particle testing", "자분탐상검사"),
        Q("visual testing", "육안검사"),
      ],
      a: 1,
      why: "수직 종파를 쏘아 저면 에코가 돌아오는 시간으로 두께를 잰다. 한쪽 면만 닿으면 되므로 가동 중인 배관에도 쓸 수 있다.",
    },

    {
      q: Q("A bubble (soap) solution applied to a pressurized joint is a form of :",
           "압력이 걸린 이음부에 비눗물을 발라 보는 것은 어떤 검사인가?"),
      o: [
        Q("leak testing", "누설검사"),
        Q("magnetic particle testing", "자분탐상검사"),
        Q("acoustic emission testing", "음향방출검사"),
        Q("eddy current testing", "와전류탐상검사"),
      ],
      a: 0,
      why: "새는 자리에서 기포가 올라온다. 간단하지만 민감도는 낮아, 더 작은 누설은 할로겐 검지기나 헬륨 질량분석기로 찾는다.",
    },

    {
      q: Q("Infrared (thermographic) testing is most useful for :",
           "적외선 열화상 검사가 가장 쓸모 있는 곳은?"),
      o: [
        Q("measuring the depth of a crack", "균열의 깊이를 재는 데"),
        Q("finding areas of abnormal temperature such as insulation loss or hot spots", "보온재가 빠진 자리나 국부 과열처럼 온도가 이상한 곳을 찾는 데"),
        Q("detecting laminations in thick plate", "두꺼운 판재의 라미네이션을 찾는 데"),
        Q("measuring conductivity", "전도율을 재는 데"),
      ],
      a: 1,
      why: "표면 온도 분포를 그림으로 본다. 노·배관의 보온 손상, 전기 설비 과열, 접합 불량을 넓은 면적에서 빠르게 찾는다.",
    },

    {
      q: Q("Before selecting an NDT method, the most important thing to know is :",
           "비파괴검사 방법을 고르기 전에 가장 먼저 알아야 하는 것은?"),
      o: [
        Q("the price of the equipment", "장비의 값"),
        Q("the type, size, location and orientation of the flaws expected", "예상되는 결함의 종류·크기·위치·방향"),
        Q("the name of the manufacturer", "제조업체의 이름"),
        Q("the colour of the test object", "시험체의 색"),
      ],
      a: 1,
      why: "방법마다 잘 찾는 결함이 다르다. 무엇을 찾을지 모르고 고르면 엉뚱한 방법을 쓰게 된다. 재질·형상·표면 상태·접근성도 함께 따진다.",
    },
  ],
  /* ═══════════════════════════════════════════
     Level Ⅲ VT — 31문항 → 65문항

     E02 5.2.2 가 정한 종목시험 구성에 맞춰 세 갈래로 나눠 짓는다.
       가) 기본 원리
       나) 기법 및 절차의 응용과 설정
       다) 코드·규격·사양서의 해석

     값은 회사 절차서 HIE-NDT-VT-P11 과 ASME Sec.V Art.9 를 본다.
     ═══════════════════════════════════════════ */
  "Level III/VT": [

    /* ── 가) 기본 원리 ────────────────────── */

    {
      q: Q("The human eye is most sensitive to light in which part of the spectrum?",
           "사람 눈이 가장 민감하게 느끼는 빛의 영역은?"),
      o: [
        Q("blue-violet", "청자색"),
        Q("yellow-green", "황록색"),
        Q("deep red", "짙은 적색"),
        Q("ultraviolet", "자외선"),
      ],
      a: 1,
      why: "밝은 곳에서 사람 눈은 파장 555 nm 언저리의 황록색에 가장 민감하다. 검사장 조명과 대비 색을 고를 때 바탕이 되는 성질이다.",
    },

    {
      q: Q("Contrast in visual examination is best described as :",
           "육안검사에서 말하는 대비(contrast)를 바르게 설명한 것은?"),
      o: [
        Q("the total amount of light falling on the surface", "표면에 떨어지는 빛의 총량"),
        Q("the difference in brightness or colour between a feature and its background", "살펴볼 것과 그 바탕 사이의 밝기나 색 차이"),
        Q("the distance from the eye to the surface", "눈과 표면 사이의 거리"),
        Q("the angle of view", "보는 각도"),
      ],
      a: 1,
      why: "아무리 밝아도 바탕과 구별되지 않으면 안 보인다. 그래서 조도만이 아니라 대비를 함께 따지고, 필요하면 빛의 방향을 바꾸거나 대비 표준을 쓴다.",
    },

    {
      q: Q("Glare on an examination surface is a problem because it :",
           "검사면의 눈부심(glare)이 문제가 되는 까닭은?"),
      o: [
        Q("increases the contrast of small features", "작은 것의 대비를 키우기 때문"),
        Q("reduces the ability of the eye to see detail and can mask discontinuities", "눈이 잔 것을 가려내는 힘을 떨어뜨려 결함을 가리기 때문"),
        Q("lowers the light intensity below the minimum", "조도를 최소 아래로 떨어뜨리기 때문"),
        Q("changes the colour of the surface", "표면의 색을 바꾸기 때문"),
      ],
      a: 1,
      why: "빛이 매끄러운 면에서 곧바로 눈으로 되쏘이면 눈이 부셔 잔 것을 못 본다. 빛의 각도를 바꾸거나 산란광을 써서 없앤다.",
    },

    {
      q: Q("Oblique (low-angle) lighting is used in visual examination mainly to :",
           "육안검사에서 비스듬한 저각 조명을 쓰는 가장 큰 까닭은?"),
      o: [
        Q("increase the overall brightness", "전체 밝기를 높이려고"),
        Q("cast shadows that reveal surface relief such as cracks and undercut", "그림자를 지워 균열이나 언더컷 같은 표면 굴곡을 드러내려고"),
        Q("reduce the required light intensity", "필요한 조도를 낮추려고"),
        Q("change the colour temperature", "색온도를 바꾸려고"),
      ],
      a: 1,
      why: "정면에서 비추면 굴곡이 평평해 보인다. 비스듬히 비추면 파인 자리에 그림자가 져서 눈에 든다.",
    },

    {
      q: Q("Under ASME Sec.XI, a VT-2 visual examination is performed to detect :",
           "ASME Sec.XI 에서 VT-2 육안검사는 무엇을 찾으려고 하는가?"),
      o: [
        Q("evidence of leakage from pressure-retaining components", "압력경계 부품에서 새어 나온 흔적"),
        Q("cracks in the weld surface", "용접부 표면의 균열"),
        Q("the general mechanical and structural condition of components and supports", "부품과 지지물의 전반적인 기계적·구조적 상태"),
        Q("the hardness of the base metal", "모재의 경도"),
      ],
      a: 0,
      why: "VT-1 은 균열 같은 표면 결함을, VT-2 는 누설 흔적을, VT-3 은 부품·지지물의 전반 상태를 본다. 무엇을 찾는지가 다르므로 요구되는 조도와 거리도 다르다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, the minimum light intensity on the examination surface is :",
           "절차서 HIE-NDT-VT-P11 에 따른 검사면의 최소 조도는?"),
      o: [
        Q("50 ft-cd (538 lux)", "50 ft-cd (538 lux)"),
        Q("100 ft-cd (1,076 lux)", "100 ft-cd (1,076 lux)"),
        Q("200 ft-cd (2,152 lux)", "200 ft-cd (2,152 lux)"),
        Q("15 ft-cd (161 lux)", "15 ft-cd (161 lux)"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 4.2. 최소 100 ft-cd(1,076 lux)다. 자분탐상·침투탐상의 가시광 조건 100 fc 와 같은 값이다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, the light meter shall be calibrated at least :",
           "절차서 HIE-NDT-VT-P11 에 따르면 조도계는 최소 얼마마다 교정하는가?"),
      o: [
        Q("every 6 months", "6개월마다"),
        Q("once a year, or whenever repaired", "1년마다, 또는 수리할 때마다"),
        Q("every 2 years", "2년마다"),
        Q("only before first use", "처음 쓰기 전에만"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 4.2. 1년마다 또는 수리될 때마다 교정한다. 1년 넘게 안 썼으면 쓰기 전에 교정한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, personnel shall have their near vision checked :",
           "절차서 HIE-NDT-VT-P11 에 따르면 검사요원의 근거리 시력은 얼마마다 확인하는가?"),
      o: [
        Q("annually", "해마다"),
        Q("every 2 years", "2년마다"),
        Q("every 3 years", "3년마다"),
        Q("only at initial qualification", "최초 자격인정 때만"),
      ],
      a: 0,
      why: "HIE-NDT-VT-P11 3.3. 자연 시력이든 교정 시력이든 재거 차트의 표준 J-1 문자를 읽을 수 있는지 해마다 확인한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, the results of a visual examination shall be evaluated by :",
           "절차서 HIE-NDT-VT-P11 에 따르면 육안검사 결과는 누가 평가하는가?"),
      o: [
        Q("any qualified examiner", "자격 있는 검사자면 누구든"),
        Q("a VT Level II or Level III examiner", "VT Level Ⅱ 또는 Level Ⅲ 자격자"),
        Q("the welder who made the weld", "그 용접부를 만든 용접사"),
        Q("the purchaser", "발주자"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 3.2. 자격인정은 SNT-TC-1A 를 따르는 HIE-QP-E01 에 따른다. 검사는 자격자가, 평가는 VT Level Ⅱ 이상이 한다.",
    },

    /* ── 나) 기법 및 절차의 응용과 설정 ────── */

    {
      q: Q("Under procedure HIE-NDT-VT-P11, before examination the surface shall be :",
           "절차서 HIE-NDT-VT-P11 에 따르면 검사 전 표면은 어떻게 해야 하는가?"),
      o: [
        Q("painted to improve contrast", "대비를 높이려고 도장한다"),
        Q("cleaned of oxide, slag, scale and spatter with wire brushes or suitable means", "산화물·슬래그·스케일·스패터를 강선 브러시나 알맞은 장비로 없앤다"),
        Q("left exactly as welded", "용접한 그대로 둔다"),
        Q("magnetized", "자화한다"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 5.1.1. 이물질이 결함을 가린다. 다만 기계가공으로 결함을 덮어 가리는 불규칙한 지시는 없애야 한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, procedure demonstration may be considered using :",
           "절차서 HIE-NDT-VT-P11 에 따르면 절차서 증명은 무엇으로 할 수 있는가?"),
      o: [
        Q("a line, artificial flaw or simulated condition of 1/32 in. (0.8 mm) width or less on the surface", "검사할 표면 또는 비슷한 표면에 놓인 폭 1/32 in.(0.8 mm) 이하의 가는 선·인공 불완전부·모의 형태"),
        Q("a radiograph of the same weld", "같은 용접부의 방사선 사진"),
        Q("a written statement by the examiner", "검사자의 서면 진술"),
        Q("a hardness test", "경도 시험"),
      ],
      a: 0,
      why: "HIE-NDT-VT-P11 3.4. 그 폭의 선을 볼 수 있으면 그 조건에서 검사할 수 있다고 본다. 조도·거리·각도·기구를 다 갖춘 상태에서 확인한다.",
    },

    {
      q: Q("Surface replication is used as an aid to visual examination in order to :",
           "표면 복제(replication)를 육안검사의 보조로 쓰는 까닭은?"),
      o: [
        Q("increase the light intensity on the surface", "표면의 조도를 높이려고"),
        Q("take a permanent, removable record of the surface condition for examination elsewhere", "표면 상태를 떼어 낼 수 있는 기록으로 떠서 다른 데서 살펴보려고"),
        Q("remove the discontinuity from the surface", "표면에서 결함을 없애려고"),
        Q("measure the thickness of the component", "부재의 두께를 재려고"),
      ],
      a: 1,
      why: "쓰던 설비를 뜯어 올 수 없을 때 그 자리에서 표면을 떠 온다. 현미경으로 크리프 공동이나 미세 균열을 보는 데 쓴다. 표면을 곱게 다듬고 부식시킨 뒤 떠야 한다.",
    },

    {
      q: Q("A borescope with a rigid tube compared with a flexible fibrescope generally provides :",
           "경성 보어스코프는 연성 파이버스코프와 견주어 대체로 어떠한가?"),
      o: [
        Q("better image quality but less access to bends", "상이 더 또렷하나 굽은 곳에는 잘 못 들어간다"),
        Q("worse image quality but better access", "상은 흐리나 접근이 낫다"),
        Q("the same in every respect", "무엇 하나 다르지 않다"),
        Q("no need for illumination", "조명이 필요 없다"),
      ],
      a: 0,
      why: "경성은 렌즈로 상을 넘겨 또렷하지만 곧은 길로만 들어간다. 연성은 광섬유 다발이라 굽은 데를 지날 수 있으나 섬유 수만큼만 상이 잡혀 거칠다.",
    },

    {
      q: Q("A weld gauge is used in visual examination to measure :",
           "용접 게이지는 육안검사에서 무엇을 재는 데 쓰는가?"),
      o: [
        Q("the hardness of the weld", "용접부의 경도"),
        Q("reinforcement height, fillet leg and throat, and undercut depth", "덧살 높이, 필렛 다리와 목두께, 언더컷 깊이"),
        Q("the residual stress", "잔류응력"),
        Q("the light intensity", "조도"),
      ],
      a: 1,
      why: "눈으로 「많다·적다」를 말하면 사람마다 다르다. 게이지로 재어 숫자로 남겨야 합격기준과 견줄 수 있다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, the extent of examination is :",
           "절차서 HIE-NDT-VT-P11 에 따른 검사 범위는?"),
      o: [
        Q("10% of the welds selected at random", "무작위로 고른 용접부의 10%"),
        Q("100% of all welds and the adjacent base metal", "모든 용접부와 인접 모재의 100%"),
        Q("the weld cap only", "용접 덧살만"),
        Q("only welds designated by the purchaser", "발주자가 지정한 용접부만"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 4.1. 전수 검사다. 육안검사는 값이 싸고 빠르므로 다른 방법을 하기 전에 전부 훑는 것이 원칙이다.",
    },

    {
      q: Q("A checklist is used in visual examination in order to :",
           "육안검사에서 점검표를 쓰는 까닭은?"),
      o: [
        Q("replace the written procedure", "절차서를 대신하려고"),
        Q("plan the examination and confirm that the required observations were made", "검사를 계획하고 요구된 관찰이 실제로 이루어졌는지 확인하려고"),
        Q("record the welder's name only", "용접사의 이름만 적으려고"),
        Q("calculate the acceptance criteria", "합격기준을 셈하려고"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 5.2.2. 점검표는 제작자가 공정 중 수행할 최소 검사 요건을 정한다. 최대 요건을 정하는 것은 아니므로 더 볼 수 있으면 본다.",
    },

    {
      q: Q("In-process visual examination is most valuable because it :",
           "공정 중 육안검사가 가장 값진 까닭은?"),
      o: [
        Q("is cheaper than examination after completion", "완료 후 검사보다 값이 싸기 때문"),
        Q("finds problems while they can still be corrected, before they are covered by later passes", "뒤 패스에 덮이기 전, 아직 고칠 수 있을 때 문제를 찾아내기 때문"),
        Q("does not require qualified personnel", "자격 있는 요원이 필요 없기 때문"),
        Q("replaces all other NDT methods", "다른 모든 비파괴검사를 대신하기 때문"),
      ],
      a: 1,
      why: "루트 패스의 용입불량이나 덜 걷어낸 슬래그는 다음 패스가 덮으면 표면에서 안 보인다. 그때그때 보아야 고칠 수 있고 재작업 비용도 준다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, requalification of the written procedure by demonstration is required when :",
           "절차서 HIE-NDT-VT-P11 에 따르면 실증에 의한 절차서 재인정이 필요한 때는?"),
      o: [
        Q("any variable is changed", "어떤 변수든 바뀔 때"),
        Q("an essential variable is changed beyond its specified value or range", "필수변수가 정해진 값이나 범위를 벗어나게 바뀔 때"),
        Q("a nonessential variable is changed", "비필수변수가 바뀔 때"),
        Q("the examiner is replaced", "검사자가 바뀔 때"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 3.4 · 표 6. 필수변수가 벗어나면 실증으로 다시 인정해야 한다. 비필수변수가 바뀌면 절차서를 고치기만 하면 된다.",
    },

    {
      q: Q("When a mirror is used to improve the angle of vision in direct visual examination, it :",
           "직접 육안검사에서 시각을 좋게 하려고 거울을 쓰면 어떠한가?"),
      o: [
        Q("makes the examination a remote visual examination", "그것만으로 원격 육안검사가 된다"),
        Q("is still direct visual examination", "여전히 직접 육안검사다"),
        Q("is not permitted", "쓸 수 없다"),
        Q("doubles the required light intensity", "필요한 조도가 두 배가 된다"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 5.2 · ASME Sec.V Art.9 T-952. 거울과 확대경은 직접 육안검사에서 쓸 수 있다. 눈과 표면 사이에 상을 옮기는 장치(보어스코프·카메라)가 끼면 원격이 된다.",
    },

    /* ── 다) 코드·규격·사양서의 해석 ───────── */

    {
      q: Q("Under ASME B31.1, surface undercut is unacceptable when it exceeds :",
           "ASME B31.1 에 따르면 표면 언더컷은 얼마를 넘으면 불합격인가?"),
      o: [
        Q("1/64 in. (0.4 mm)", "1/64 in.(0.4 mm)"),
        Q("1/32 in. (0.8 mm)", "1/32 in.(0.8 mm)"),
        Q("1/16 in. (1.5 mm)", "1/16 in.(1.5 mm)"),
        Q("1/8 in. (3.0 mm)", "1/8 in.(3.0 mm)"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.2 (ASME B31.1 136.4.2). 1/32 in.(0.8 mm)를 넘거나, 최소 요구 단면 두께를 넘어 파이면 불합격이다. 두 잣대 가운데 어느 하나만 걸려도 안 된다.",
    },

    {
      q: Q("Under ASME B31.1, a linear indication on the weld surface is unacceptable when its length exceeds :",
           "ASME B31.1 에 따르면 용접부 표면의 선형지시는 길이가 얼마를 넘으면 불합격인가?"),
      o: [
        Q("1/16 in. (1.5 mm)", "1/16 in.(1.5 mm)"),
        Q("1/8 in. (3.0 mm)", "1/8 in.(3.0 mm)"),
        Q("3/16 in. (5.0 mm)", "3/16 in.(5.0 mm)"),
        Q("1/4 in. (6.0 mm)", "1/4 in.(6.0 mm)"),
      ],
      a: 2,
      why: "HIE-NDT-VT-P11 6.2 (ASME B31.1 136.4.2 (7)). 3/16 in.(5.0 mm)를 넘는 선형지시는 불합격이다.",
    },

    {
      q: Q("Under ASME B31.1, surface porosity is unacceptable when four or more rounded indications are separated by :",
           "ASME B31.1 에 따르면 표면 기공은 구형지시 네 개 이상이 얼마 이하 간격으로 있을 때 불합격인가?"),
      o: [
        Q("1/32 in. (0.8 mm) or less", "1/32 in.(0.8 mm) 이하"),
        Q("1/16 in. (1.5 mm) or less", "1/16 in.(1.5 mm) 이하"),
        Q("1/8 in. (3.0 mm) or less", "1/8 in.(3.0 mm) 이하"),
        Q("1/4 in. (6.0 mm) or less", "1/4 in.(6.0 mm) 이하"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.2 (ASME B31.1 136.4.2 (8)). 임의의 방향으로 간격이 1/16 in.(1.5 mm) 이하인 구형지시가 네 개 이상이면 불합격이다. 치수가 3/16 in.(5.0 mm)를 넘는 구형지시 하나도 불합격이다.",
    },

    {
      q: Q("Under ASME B31.1, a rounded indication is one whose length is :",
           "ASME B31.1 에서 구형지시란 길이가 폭의 몇 배 이하인 것인가?"),
      o: [
        Q("2 times its width or less", "폭의 2배 이하"),
        Q("3 times its width or less", "폭의 3배 이하"),
        Q("5 times its width or less", "폭의 5배 이하"),
        Q("equal to its width", "폭과 같은 것"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.2. 길이가 폭의 3배 이하면 구형지시, 넘으면 선형지시다. 합격기준이 둘에 따라 다르므로 분류가 먼저다.",
    },

    {
      q: Q("Under ASME B31.1, incomplete penetration is evaluated by visual examination :",
           "ASME B31.1 에 따르면 용입부족은 어떤 때에 육안검사로 평가하는가?"),
      o: [
        Q("in every case", "언제나"),
        Q("only when the inside surface is readily accessible", "내면에 쉽게 접근할 수 있을 때만"),
        Q("only for pipe over 12 in. diameter", "지름 12 in. 를 넘는 배관에서만"),
        Q("never", "결코 안 한다"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.2 (ASME B31.1 136.4.2 (6)). 눈이 닿아야 볼 수 있다. 안쪽에 못 들어가면 방사선이나 초음파로 본다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, an indication that exceeds the criteria given in Table 1 shall be :",
           "절차서 HIE-NDT-VT-P11 에 따르면 표 1 의 기준을 넘는 지시는 어떻게 하는가?"),
      o: [
        Q("recorded but accepted", "기록만 하고 합격시킨다"),
        Q("rejected", "불합격 처리한다"),
        Q("re-examined by radiography and then accepted", "방사선으로 재검사한 뒤 합격시킨다"),
        Q("referred to the welder for a decision", "용접사에게 판정을 맡긴다"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.1. 표 1 에 주어진 기준을 넘는 지시가 관찰되면 불합격이다. 검사 결과는 적용 기술기준의 합격기준에 따라 평가한다.",
    },

    {
      q: Q("Under procedure HIE-NDT-VT-P11, the examination results shall be documented :",
           "절차서 HIE-NDT-VT-P11 에 따르면 검사 결과는 어떻게 문서로 남기는가?"),
      o: [
        Q("in the examiner's personal notebook", "검사자의 개인 수첩에"),
        Q("on the attached visual examination report form", "첨부된 육안시험 양식대로"),
        Q("verbally to the supervisor", "감독자에게 말로"),
        Q("only if a rejectable indication is found", "불합격 지시가 나왔을 때만"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 7.0. 양식을 정해 두면 빠뜨리는 항목이 없고 나중에 견주기 쉽다. 합격이어도 기록은 남긴다.",
    },

    {
      q: Q("The scope of procedure HIE-NDT-VT-P11 covers welds made to :",
           "절차서 HIE-NDT-VT-P11 이 다루는 용접부는 어느 규격에 따른 것인가?"),
      o: [
        Q("ASME Sec.VIII Div.2, ASME B31.1 and ASME Sec.I", "ASME Sec.VIII Div.2, ASME B31.1, ASME Sec.I"),
        Q("AWS D1.1 only", "AWS D1.1 만"),
        Q("API 1104 only", "API 1104 만"),
        Q("ISO 5817 only", "ISO 5817 만"),
      ],
      a: 0,
      why: "HIE-NDT-VT-P11 1.0. 저합금강이나 탄소강 배관으로 만든 것에 적용하며, 시험부 형상은 맞대기 용접부와 필렛 용접부, 재료 형태는 배관과 판재다.",
    },

    {
      q: Q("Overlap in a weld is unacceptable because it :",
           "용접부의 오버랩이 불합격인 까닭은?"),
      o: [
        Q("increases the weld strength too much", "용접 강도를 지나치게 높이기 때문"),
        Q("is weld metal lying on the base metal without fusion, forming a sharp notch", "모재에 붙지 않고 얹혀 있어 날카로운 노치를 만들기 때문"),
        Q("changes the colour of the base metal", "모재의 색을 바꾸기 때문"),
        Q("always contains hydrogen", "언제나 수소를 품고 있기 때문"),
      ],
      a: 1,
      why: "붙지 않았으므로 그 경계가 곧 균열과 같다. 게다가 지단부가 날카로워 응력이 몰린다. 갈아 없애고 필요하면 다시 용접한다.",
    },

    {
      q: Q("Arc strikes outside the weld groove are a concern because they :",
           "개선 밖에 생긴 아크 스트라이크가 문제가 되는 까닭은?"),
      o: [
        Q("only affect the appearance", "겉모습만 나빠지기 때문"),
        Q("create a small, rapidly quenched hard spot that may crack", "빠르게 식은 작고 굳은 자리가 생겨 균열이 날 수 있기 때문"),
        Q("increase the base metal thickness", "모재 두께가 늘어나기 때문"),
        Q("are always removed by the welder", "용접사가 늘 없애기 때문"),
      ],
      a: 1,
      why: "모재가 순간 녹았다 둘레 금속에 열을 빼앗겨 급랭한다. 그 자리가 굳고 물러져 균열이 시작된다. 갈아 없애고 두께가 모자라지 않는지 확인한다.",
    },

    {
      q: Q("Excessive weld reinforcement is undesirable mainly because it :",
           "덧살이 지나치게 높으면 왜 좋지 않은가?"),
      o: [
        Q("wastes filler metal only", "용가재만 낭비하기 때문"),
        Q("creates a sharp change in section at the toe where stress concentrates", "지단부에서 단면이 갑자기 바뀌어 응력이 몰리기 때문"),
        Q("reduces the weld strength below the base metal", "용접부 강도를 모재보다 낮추기 때문"),
        Q("prevents radiographic examination", "방사선투과검사를 못 하게 하기 때문"),
      ],
      a: 1,
      why: "덧살 자체가 약한 것이 아니라 지단부의 급한 꺾임이 문제다. 그래서 규격이 높이를 제한하고, 피로를 받는 부재는 매끄럽게 갈아 낸다.",
    },

    {
      q: Q("Weld joint misalignment (high-low) is measured as :",
           "용접 이음의 치우침(high-low)은 무엇을 재는 것인가?"),
      o: [
        Q("the gap between the two members before welding", "용접 전 두 부재 사이의 틈"),
        Q("the offset between the surfaces of the two members being joined", "이어 붙이는 두 부재의 면이 어긋난 정도"),
        Q("the angle between the two members", "두 부재 사이의 각도"),
        Q("the height of the weld reinforcement", "덧살의 높이"),
      ],
      a: 1,
      why: "면이 어긋난 채 용접하면 그 단차에 응력이 몰리고 방사선 판독도 어려워진다. 조립 검사에서 미리 잡아야 하므로 공정 중 육안검사의 주요 항목이다.",
    },

    {
      q: Q("A crater crack forms :",
           "크레이터 균열은 어디에 생기는가?"),
      o: [
        Q("at the start of the weld bead", "용접 비드가 시작되는 자리"),
        Q("at the point where the arc was broken at the end of a bead", "비드 끝에서 아크를 끊은 자리"),
        Q("along the fusion line only", "융합선을 따라서만"),
        Q("in the base metal far from the weld", "용접부에서 멀리 떨어진 모재"),
      ],
      a: 1,
      why: "아크를 갑자기 끊으면 마지막 쇳물이 오목하게 굳으면서 가운데로 당겨져 갈라진다. 별 모양으로 나기도 한다. 크레이터를 채우고 끊으면 막을 수 있다.",
    },

    {
      q: Q("The main limitation of visual examination is that it :",
           "육안검사의 가장 큰 한계는 무엇인가?"),
      o: [
        Q("requires expensive equipment", "값비싼 장비가 필요한 것"),
        Q("detects only conditions on the surface", "표면에 있는 것만 찾을 수 있는 것"),
        Q("cannot be used on welds", "용접부에 쓸 수 없는 것"),
        Q("requires the part to be magnetic", "부재가 자성체여야 하는 것"),
      ],
      a: 1,
      why: "눈에 보이는 것만 본다. 그래서 속에 있는 결함은 방사선·초음파로 따로 본다. 대신 값이 싸고 빨라 다른 방법에 앞서 전수로 한다.",
    },

    {
      q: Q("Under ASME B31.1, when evaluating undercut the examiner shall also consider :",
           "ASME B31.1 에 따라 언더컷을 판정할 때 함께 따져야 하는 것은?"),
      o: [
        Q("the colour of the weld metal", "용접금속의 색"),
        Q("whether the remaining section is less than the minimum required thickness", "남은 단면이 최소 요구 두께보다 얇아지지 않았는지"),
        Q("the welder's certification date", "용접사의 자격 취득일"),
        Q("the ambient temperature", "둘레 온도"),
      ],
      a: 1,
      why: "HIE-NDT-VT-P11 6.2. 깊이 1/32 in. 를 안 넘어도, 그만큼 파여 최소 요구 두께 아래로 내려가면 불합격이다. 두 잣대를 함께 본다.",
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
