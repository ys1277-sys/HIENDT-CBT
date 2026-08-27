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
  "Level II/General/MT": [

    {
      q: Q("For a discontinuity to produce the strongest indication, the magnetic field should be oriented :",
           "결함이 가장 뚜렷한 지시를 만들려면 자장의 방향은 결함에 대해 어떠해야 하는가?"),
      o: [
        Q("parallel to the length of the discontinuity", "결함의 길이 방향과 평행"),
        Q("perpendicular to the length of the discontinuity", "결함의 길이 방향과 수직"),
        Q("at 45 degrees to the length of the discontinuity", "결함의 길이 방향과 45도"),
        Q("in any direction, since the field is not directional", "자장에는 방향이 없으므로 어느 쪽이든 상관없다"),
      ],
      a: 1,
      why: "자속이 결함을 가로질러 끊겨야 누설자장이 생긴다. 결함과 나란하면 자속이 그대로 흘러 지시가 거의 안 생기며, 그래서 한 부재를 서로 직각인 두 방향으로 자화한다.",
    },

    {
      q: Q("A pie-shaped magnetic particle field indicator is used to :",
           "파이형 자장지시계(pie gauge)는 무엇에 쓰는가?"),
      o: [
        Q("measure the magnetizing current in amperes", "자화 전류를 암페어로 재는 데 쓴다"),
        Q("measure the residual field after demagnetization", "탈자 뒤 남은 잔류 자장을 재는 데 쓴다"),
        Q("show the direction of the magnetic field and whether its strength is adequate", "자장의 방향과 세기가 충분한지 보이는 데 쓴다"),
        Q("check the concentration of the wet particle suspension", "습식 현탁액의 자분 농도를 확인하는 데 쓴다"),
      ],
      a: 2,
      why: "ASME Sec.V Art.7 T-764.1 · HIE-NDT-MT-P11 4.2.2. 파이 게이지는 자장의 방향과 세기가 쓸 만한지 보여 줄 뿐, 자장의 크기를 재는 계기가 아니다. 전류는 전류계로, 잔류 자장은 자장계로 잰다.",
    },

    {
      q: Q("When performing a visible (nonfluorescent) magnetic particle examination, the minimum light intensity at the examination surface shall be :",
           "비형광(가시광) 자분탐상검사에서 검사면의 최소 조도는 얼마인가?"),
      o: [
        Q("10 fc (100 lx)", "10 fc (100 lx)"),
        Q("50 fc (500 lx)", "50 fc (500 lx)"),
        Q("200 fc (2,000 lx)", "200 fc (2,000 lx)"),
        Q("100 fc (1,000 lx)", "100 fc (1,000 lx)"),
      ],
      a: 3,
      why: "ASME Sec.V Art.7 T-777.1 · HIE-NDT-MT-P11 4.3.2 「최소 조도는 100 fc (1,000 lx)」.",
    },

    {
      q: Q("The minimum black light intensity at the examination surface for fluorescent magnetic particle examination is :",
           "형광 자분탐상검사에서 검사면의 최소 자외선 세기는 얼마인가?"),
      o: [
        Q("1,000 μW/cm²", "1,000 ㎼/㎠"),
        Q("100 μW/cm²", "100 ㎼/㎠"),
        Q("500 μW/cm²", "500 ㎼/㎠"),
        Q("2,000 μW/cm²", "2,000 ㎼/㎠"),
      ],
      a: 0,
      why: "ASME Sec.V Art.7 T-777.2 · HIE-NDT-MT-P11 4.3.3 (d) 「검사 기간 내내 최소 1000 ㎼/㎠ 이상」.",
    },

    {
      q: Q("During fluorescent magnetic particle examination, the ambient white light at the examination surface shall not exceed :",
           "형광 자분탐상검사를 하는 동안 검사면의 주변 백색광은 얼마를 넘지 않아야 하는가?"),
      o: [
        Q("10 fc (108 lx)", "10 fc (108 lx)"),
        Q("5 fc (54 lx)", "5 fc (54 lx)"),
        Q("2 fc (21.5 lx)", "2 fc (21.5 lx)"),
        Q("20 fc (215 lx)", "20 fc (215 lx)"),
      ],
      a: 2,
      why: "ASME Sec.V Art.7 T-777.2 · HIE-NDT-MT-P11 4.3.3 (a) 「보정된 조도계로 측정한 최대 주변 조도가 2 fc(21.5 lx)인 어두운 영역에서 수행」.",
    },

    {
      q: Q("Before use, a black light shall be allowed to warm up for a minimum of :",
           "자외선등은 사용 전 최소 얼마 동안 예열해야 하는가?"),
      o: [
        Q("1 minute", "1분"),
        Q("5 minutes", "5분"),
        Q("15 minutes", "15분"),
        Q("30 minutes", "30분"),
      ],
      a: 1,
      why: "ASME Sec.V Art.7 T-777.2. 자외선등은 최소 5분 예열해 세기가 안정된 뒤에 쓴다. 검사자가 어두움에 적응하는 시간도 최소 5분이다.",
    },

    {
      q: Q("The concentration of a nonfluorescent wet magnetic particle suspension shall be :",
           "비형광 습식 자분 현탁액의 농도는 얼마여야 하는가?"),
      o: [
        Q("0.1 to 0.4 mL per 100 mL of vehicle", "용매 100 mL 당 0.1~0.4 mL"),
        Q("5 to 10 mL per 100 mL of vehicle", "용매 100 mL 당 5~10 mL"),
        Q("1.2 to 2.4 mL per 100 mL of vehicle", "용매 100 mL 당 1.2~2.4 mL"),
        Q("10 to 20 mL per 100 mL of vehicle", "용매 100 mL 당 10~20 mL"),
      ],
      a: 2,
      why: "ASME Sec.V Art.7 T-764.1. 비형광은 100 mL 당 1.2~2.4 mL, 형광은 0.1~0.4 mL 다. 형광 값을 비형광으로 잘못 아는 일이 잦다.",
    },

    {
      q: Q("An alternating current electromagnetic yoke shall have a lifting power of at least ______ at the maximum pole spacing that will be used.",
           "교류 전자 요크는 쓰려는 최대 극간 간격에서 최소 얼마의 리프팅 파워를 내야 하는가?"),
      o: [
        Q("40 lb (18 kg)", "40 lb (18 kg)"),
        Q("25 lb (11 kg)", "25 lb (11 kg)"),
        Q("5 lb (2.3 kg)", "5 lb (2.3 kg)"),
        Q("10 lb (4.5 kg)", "10 lb (4.5 kg)"),
      ],
      a: 3,
      why: "ASME Sec.V Art.7 T-762.2. 교류 요크는 10 lb, 직류·영구자석 요크는 40 lb 다. 둘을 뒤바꿔 아는 일이 잦다.",
    },

    {
      q: Q("When using the prod technique, the prod spacing shall not exceed :",
           "프로드법으로 자화할 때 프로드 간격은 얼마를 넘지 않아야 하는가?"),
      o: [
        Q("8 in. (200 mm)", "8인치 (200 mm)"),
        Q("4 in. (100 mm)", "4인치 (100 mm)"),
        Q("12 in. (300 mm)", "12인치 (300 mm)"),
        Q("18 in. (450 mm)", "18인치 (450 mm)"),
      ],
      a: 0,
      why: "ASME Sec.V Art.7 T-752.2. 프로드 간격은 8인치를 넘지 않는다. 간격이 넓어지면 자장이 흩어져 가운데가 약해진다.",
    },

    {
      q: Q("The principal hazard associated with the prod technique is :",
           "프로드법에서 가장 조심해야 할 것은 무엇인가?"),
      o: [
        Q("overheating of the wet particle suspension", "습식 현탁액이 지나치게 뜨거워지는 것"),
        Q("arc strikes and local burning at the contact points", "접촉 자리에 아크 스트라이크와 국부 손상이 생기는 것"),
        Q("demagnetization of the part during examination", "검사 도중 부재가 저절로 탈자되는 것"),
        Q("loss of black light intensity", "자외선등의 세기가 떨어지는 것"),
      ],
      a: 1,
      why: "프로드는 부재에 직접 전류를 흘리므로 접촉이 나쁘면 아크가 튀어 표면이 상한다. 그래서 원자력·압력용기 부재에는 프로드법을 제한하거나 아크 자리를 갈아 내고 재검사한다.",
    },

    {
      q: Q("An indication is classified as linear when its length is :",
           "지시는 길이가 폭의 몇 배를 넘을 때 선형지시로 분류하는가?"),
      o: [
        Q("greater than twice its width", "폭의 2배를 넘을 때"),
        Q("greater than five times its width", "폭의 5배를 넘을 때"),
        Q("greater than three times its width", "폭의 3배를 넘을 때"),
        Q("equal to its width", "폭과 같을 때"),
      ],
      a: 2,
      why: "ASME Sec.VIII Div.1 Mandatory Appendix 6 을 비롯한 ASME 계열 규격의 공통 정의다. 길이가 폭의 3배를 넘으면 선형지시, 그 이하면 원형지시로 본다. 합격기준이 둘에 따라 다르므로 분류가 먼저다.",
    },

    {
      q: Q("Compared with alternating current, direct current magnetization is better for detecting :",
           "직류 자화는 교류 자화와 견주어 어떤 결함을 찾는 데 낫는가?"),
      o: [
        Q("discontinuities open to the surface only", "표면에 열린 결함만"),
        Q("subsurface discontinuities", "표면 아래에 있는 결함"),
        Q("discontinuities in nonferrous materials", "비철 재료에 있는 결함"),
        Q("discontinuities regardless of their orientation", "방향과 상관없이 모든 결함"),
      ],
      a: 1,
      why: "교류는 표피효과 때문에 자속이 표면에 몰려 표면 결함에 민감하고, 직류는 속까지 들어가 표면 아래 결함까지 찾는다. 자화 전류를 고를 때 첫째로 따지는 것이다.",
    },

    {
      q: Q("In the continuous magnetization technique, the magnetic particles are applied :",
           "연속법에서 자분은 언제 적용하는가?"),
      o: [
        Q("after the magnetizing current has been turned off", "자화 전류를 끊은 뒤"),
        Q("before the magnetizing current is turned on", "자화 전류를 넣기 전"),
        Q("while the magnetizing current is flowing", "자화 전류가 흐르고 있는 동안"),
        Q("after the part has been demagnetized", "부재를 탈자한 뒤"),
      ],
      a: 2,
      why: "연속법은 전류가 흐르는 동안 자분을 적용해 자화가 가장 센 때에 자분이 붙게 한다. 전류를 끊은 뒤 적용하는 것이 잔류법이다.",
    },

    {
      q: Q("A magnetic particle indication that is caused by an abrupt change in section thickness and not by a discontinuity is called :",
           "결함이 아니라 단면 두께가 갑자기 바뀐 탓에 나타나는 자분 지시를 무엇이라 하는가?"),
      o: [
        Q("a false indication", "의사지시"),
        Q("a relevant indication", "관련지시"),
        Q("a nonrelevant indication", "무관련지시"),
        Q("a residual indication", "잔류지시"),
      ],
      a: 2,
      why: "단면 변화·기하 형상 때문에 자속이 새어 생긴 지시는 무관련지시다. 자분이 흘러내렸거나 표면이 더러워 생긴 지시는 의사지시로 따로 부른다.",
    },

    {
      q: Q("The magnetic field produced when current is passed through a coil wrapped around a part is :",
           "부재에 코일을 감고 전류를 흘리면 어떤 자장이 생기는가?"),
      o: [
        Q("circular, and detects discontinuities parallel to the part axis", "원형 자장이며 축과 나란한 결함을 찾는다"),
        Q("longitudinal, and detects discontinuities transverse to the part axis", "종축 자장이며 축과 가로지르는 결함을 찾는다"),
        Q("longitudinal, and detects discontinuities parallel to the part axis", "종축 자장이며 축과 나란한 결함을 찾는다"),
        Q("circular, and detects discontinuities transverse to the part axis", "원형 자장이며 축과 가로지르는 결함을 찾는다"),
      ],
      a: 1,
      why: "코일 자화는 부재 축을 따라 흐르는 종축 자장을 만든다. 자장은 결함과 수직일 때 가장 잘 잡히므로 축을 가로지르는 결함을 찾는다. 부재에 직접 전류를 흘리면 원형 자장이 생겨 축과 나란한 결함을 찾는다.",
    },

    {
      q: Q("Demagnetization of a part after magnetic particle examination is normally accomplished by :",
           "자분탐상 뒤 부재를 탈자하는 일은 보통 어떻게 하는가?"),
      o: [
        Q("applying a steady direct current of increasing value", "일정한 직류를 점점 세게 걸어서"),
        Q("heating the part above its Curie point in all cases", "언제나 부재를 퀴리점 위로 가열해서"),
        Q("applying a strong field in the same direction as the original field", "처음 자화한 방향과 같은 방향으로 센 자장을 걸어서"),
        Q("applying a reversing field of gradually decreasing strength", "방향이 번갈아 바뀌면서 세기가 차츰 줄어드는 자장을 걸어서"),
      ],
      a: 3,
      why: "방향을 뒤집으면서 세기를 줄여 가면 자구가 흐트러져 잔류자기가 사라진다. 퀴리점(강의 경우 약 770℃) 위로 가열해도 탈자되지만 재질이 바뀌므로 특별한 경우가 아니면 안 쓴다.",
    },

    {
      q: Q("A gaussmeter or field indicator is used after demagnetization to :",
           "탈자한 뒤 자장계(gaussmeter)나 자장지시계를 쓰는 까닭은?"),
      o: [
        Q("verify that the residual field is within the specified limit", "남은 잔류 자장이 정한 한계 안에 드는지 확인하려고"),
        Q("measure the magnetizing current used", "썼던 자화 전류를 재려고"),
        Q("check the particle concentration", "자분 농도를 확인하려고"),
        Q("measure the light intensity at the surface", "검사면의 조도를 재려고"),
      ],
      a: 0,
      why: "탈자가 되었는지는 눈으로 알 수 없다. 자장계로 잔류 자장을 재어 사양이 정한 한계(흔히 3 gauss) 안에 드는지 확인한다.",
    },

    {
      /* 은행 12번이 「자분탐상할 수 있는 금속」을 이미 묻고 있어 주제를 바꿨다 */
      q: Q("Magnetic particle examination is capable of detecting discontinuities :",
           "자분탐상검사로 찾을 수 있는 결함은 어디에 있는 것인가?"),
      o: [
        Q("anywhere in the cross section, regardless of depth", "깊이와 상관없이 단면 어디에 있든"),
        Q("open to the surface and slightly below the surface", "표면에 열린 것과 표면 바로 아래에 있는 것"),
        Q("only those open to the surface", "표면에 열린 것만"),
        Q("only at the mid-wall of the part", "부재 두께 한가운데에 있는 것만"),
      ],
      a: 1,
      why: "누설자장은 결함이 표면에 가까울 때만 밖으로 새어 나온다. 표면에 열린 결함이 가장 뚜렷하고, 표면 바로 아래 결함도 흐릿하게 잡히지만 깊어질수록 못 찾는다. 속까지 보려면 초음파나 방사선을 쓴다.",
    },

    {
      q: Q("The examination surface shall be cleaned before magnetic particle examination mainly because contaminants :",
           "자분탐상 전에 검사면을 깨끗이 하는 가장 큰 까닭은?"),
      o: [
        Q("increase the residual magnetism of the part", "부재의 잔류자기를 키우기 때문에"),
        Q("reduce the lifting power of the yoke", "요크의 리프팅 파워를 떨어뜨리기 때문에"),
        Q("change the permeability of the base metal", "모재의 투자율을 바꾸기 때문에"),
        Q("can fill discontinuities and hold particles where there is no discontinuity", "결함을 메우거나, 결함이 없는 자리에 자분을 붙들기 때문에"),
      ],
      a: 3,
      why: "기름·녹·스케일은 결함 입구를 막아 지시를 못 나오게 하고, 거꾸로 결함이 없는 자리에 자분을 붙들어 의사지시를 만든다. 어느 쪽이든 판독을 그르친다.",
    },

    {
      q: Q("Post-examination cleaning of a part is required when :",
           "자분탐상 뒤 부재를 세척해야 하는 때는?"),
      o: [
        Q("the examination was performed with a yoke", "요크로 검사했을 때"),
        Q("residual particles or suspension could interfere with subsequent processing or service", "남은 자분이나 현탁액이 뒤 공정이나 사용에 지장을 줄 수 있을 때"),
        Q("the part was found to be acceptable", "부재가 합격 판정을 받았을 때"),
        Q("fluorescent particles were used, in every case", "형광 자분을 썼으면 언제나"),
      ],
      a: 1,
      why: "ASME Sec.V Art.7 T-780 계열. 세척은 언제나 하는 것이 아니라, 남은 자분·현탁액이 뒤 공정(도장·용접·조립)이나 사용에 지장을 줄 때 한다. 탈자도 같은 잣대로 판단한다.",
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
