/*
 * held/ 로 빼 두었던 서술형 문항에 오답을 채워 은행에 되돌린다.
 *
 *   node tools/release-held.mjs          무엇이 바뀌는지 보여만 준다
 *   node tools/release-held.mjs --써라    실제로 넣는다
 *
 * 원본이 서술형이라 답이 여러 조각이었다. 주관식으로 내면 아는 사람도
 * 글자를 그대로 못 쳐서 틀리므로 held/ 에 빼 두었던 것들이다.
 * (held/Level III-MT.md, held/Level III-RT.md)
 *
 * 정답은 원본에 적힌 그대로 옮기고, 오답 셋은 지어 넣는다. 답이 여러
 * 조각인 문항(농도 세 가지, A·B 두 값)은 조각을 한 보기에 묶어 두었다.
 * 그래야 조각 하나만 맞히고 넘어가는 일이 없다.
 *
 * 오답은 그 종목에서 실제로 헷갈리는 값으로 골랐다. X선과 감마선 농도를
 * 뒤바꾼 것, 요크 극간을 좁게 잡은 것처럼 아는 사람만 가려낼 수 있는
 * 것들이다. 까닭은 문항마다 옆에 적어 둔다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";
const write = process.argv.includes("--써라");

/*
 * 되돌릴 문항.  정답은 늘 첫 보기에 둔다 (넣을 때 answer = 0).
 */
const HELD = {

  "Level III/MT": {
    source: "MTM-III.HWP",
    items: [
      {
        was: 2,
        q: "How much time is needed to adapt to dark viewing prior to performing fluorescent examination?\n형광 시험을 수행하기 전에 어두움에 적응하기 위해 필요한 시간은?",
        /* ASME Sec.V T-777.2 — 최소 5분 */
        o: [
          "At least 5 minutes\n최소 5분",
          "At least 1 minute\n최소 1분",
          "At least 10 minutes\n최소 10분",
          "At least 30 minutes\n최소 30분",
        ],
      },
      {
        was: 5,
        q: "How much is a limited range of the temperature when using the wet particle suspension?\n습식 자분 현탁액 사용 시 온도 제한 범위는?",
        /* 현탁액이 135°F 를 넘으면 안 된다. 100°F·175°F 는 흔히 헷갈리는 값 */
        o: [
          "Not exceed 135°F (57℃)\n135°F(57℃)를 넘지 않을 것",
          "Not exceed 100°F (38℃)\n100°F(38℃)를 넘지 않을 것",
          "Not exceed 175°F (79℃)\n175°F(79℃)를 넘지 않을 것",
          "Not exceed 212°F (100℃)\n212°F(100℃)를 넘지 않을 것",
        ],
      },
      {
        was: 7,
        q: "When using the yoke, how much spacing of Yoke-pole?\n요크를 사용할 때 극간 간격은 얼마인가?",
        /* 50~130 mm. 좁게·넓게 잡은 값을 오답으로 둔다 */
        o: [
          "Minimum 50 to maximum 130 mm\n최소 50 mm 에서 최대 130 mm",
          "Minimum 25 to maximum 75 mm\n최소 25 mm 에서 최대 75 mm",
          "Minimum 75 to maximum 200 mm\n최소 75 mm 에서 최대 200 mm",
          "Minimum 100 to maximum 300 mm\n최소 100 mm 에서 최대 300 mm",
        ],
      },
    ],
  },

  "Level III/RT": {
    source: "RTM-III.HWP",
    items: [
      {
        was: 1,
        q: "What requirement of this procedure shall be demonstrated on production or technique radiograph for its qualification?\n방사선 투과사진 기술 또는 제작에 대한 품질을 입증하기 위하여 이 절차서에서의 요구사항은 무엇인가?",
        /* 절차서 인증으로 보이는 것은 농도와 투과도계 상이다. 나머지는 조건일 뿐 입증 대상이 아니다 */
        o: [
          "Density and penetrameter image requirements\n농도와 투과도계 상(image) 요구사항",
          "Source size and source-to-film distance\n선원 크기와 선원-필름 거리",
          "Film brand and processing time\n필름 상표와 현상 시간",
          "Exposure time and tube current\n노출 시간과 관전류",
        ],
      },
      {
        was: 2,
        q: "For complete radiographic coverage of cylindrical girth welds, a minimum of ______ is required when the source is placed outside and the film inside the object.\n원주 용접부를 빠짐없이 촬영하려면, 선원을 바깥에 두고 필름을 안쪽에 둘 때 최소 몇 회가 필요한가?",
        /* 바깥 선원·안쪽 필름은 90° 간격 4회. 180° 2회·120° 3회는 다른 배치의 값이다 */
        o: [
          "Four exposures 90° apart\n90° 간격으로 4회 촬영",
          "Two exposures 180° apart\n180° 간격으로 2회 촬영",
          "Three exposures 120° apart\n120° 간격으로 3회 촬영",
          "Six exposures 60° apart\n60° 간격으로 6회 촬영",
        ],
      },
      {
        was: 4,
        q: "What is the different requirement in this procedure between X-ray and γ-ray?\n이 절차서에서 X선과 감마선에 다르게 정한 요구조건은 무엇인가?",
        /* 둘을 뒤바꾼 것이 가장 흔한 실수다 */
        o: [
          "Minimum film density 1.8 for X-ray, 2.0 for γ-ray\n최소 필름농도 X선 1.8, 감마선 2.0",
          "Minimum film density 2.0 for X-ray, 1.8 for γ-ray\n최소 필름농도 X선 2.0, 감마선 1.8",
          "Minimum film density 1.3 for both\n둘 다 최소 필름농도 1.3",
          "Maximum film density 4.0 for X-ray, 3.0 for γ-ray\n최대 필름농도 X선 4.0, 감마선 3.0",
        ],
      },
      {
        was: 5,
        q: "What evidence would you find on a radiograph that would indicate insufficient protection from back-scatter?\n후방산란을 충분히 막지 못했음을 투과사진에서 무엇으로 알 수 있는가?",
        /* 밝은 B 가 어두운 바탕에 뜨면 후방산란이다. 어두운 B 는 오히려 정상이다 */
        o: [
          "A light image of the letter B appears on a darker background\n어두운 바탕 위에 밝은 B 글자가 나타난다",
          "A dark image of the letter B appears on a lighter background\n밝은 바탕 위에 어두운 B 글자가 나타난다",
          "The density of the radiograph exceeds 4.0\n투과사진의 농도가 4.0을 넘는다",
          "The penetrameter image cannot be seen\n투과도계 상이 보이지 않는다",
        ],
      },
      {
        was: 6,
        q: "What are the radiographic density requirements?\n투과사진에 요구되는 농도는?",
        /* 세 값을 한 보기에 묶는다. 조각 하나만 맞히고 넘어가지 못하게 */
        o: [
          "X-ray single 1.8~4.0 · composite 1.3~4.0 · γ-ray single 2.0~4.0\nX선 단일필름 1.8~4.0 · 다중필름 겹쳐 관찰 1.3~4.0 · 감마선 단일필름 2.0~4.0",
          "X-ray single 2.0~4.0 · composite 1.3~4.0 · γ-ray single 1.8~4.0\nX선 단일필름 2.0~4.0 · 다중필름 겹쳐 관찰 1.3~4.0 · 감마선 단일필름 1.8~4.0",
          "X-ray single 1.8~4.0 · composite 1.8~4.0 · γ-ray single 2.0~4.0\nX선 단일필름 1.8~4.0 · 다중필름 겹쳐 관찰 1.8~4.0 · 감마선 단일필름 2.0~4.0",
          "X-ray single 1.3~4.0 · composite 1.3~4.0 · γ-ray single 1.3~4.0\nX선 단일필름 1.3~4.0 · 다중필름 겹쳐 관찰 1.3~4.0 · 감마선 단일필름 1.3~4.0",
        ],
      },
      {
        was: 10,
        q: "A circumferential butt weld in a class 1 component has been made in a 30 in. diameter pipe. The inside of the pipe is not accessible. The wall thickness is 5/8 in. and the reinforcement is the maximum allowed by the procedure. What is the maximum reinforcement allowed, and what is the required minimum wire IQI diameter?\n1등급 기기인 바깥지름 30인치 배관에 원주 맞대기 용접부가 있다. 배관 안쪽은 접근할 수 없고 벽두께는 5/8인치이며 용접덧살은 절차서가 허용하는 최대 크기이다. 최대 허용 덧살과 요구되는 최소 선형 투과도계 지름은?",
        /* 두 값을 한 보기에 묶는다 */
        o: [
          "Reinforcement 3/32 in. · #7 wire (0.013 in., 0.33 mm)\n덧살 3/32인치 · #7 와이어(0.013인치, 0.33 mm)",
          "Reinforcement 1/16 in. · #5 wire (0.008 in., 0.20 mm)\n덧살 1/16인치 · #5 와이어(0.008인치, 0.20 mm)",
          "Reinforcement 1/8 in. · #9 wire (0.020 in., 0.51 mm)\n덧살 1/8인치 · #9 와이어(0.020인치, 0.51 mm)",
          "Reinforcement 3/32 in. · #10 wire (0.025 in., 0.64 mm)\n덧살 3/32인치 · #10 와이어(0.025인치, 0.64 mm)",
        ],
      },
    ],
  },
};

/* ── 굽기 ─────────────────────────────────── */

let added = 0;

for (const [bank, { source, items }] of Object.entries(HELD)) {
  const file = path.join(ROOT, bank + ".json");
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  const sample = list[0];
  let next = Math.max(...list.map((q) => q.id)) + 1;

  console.log(`══ ${bank}  ${list.length}문항 → ${list.length + items.length}문항`);

  for (const it of items) {
    if (list.some((q) => q.question.startsWith(it.q.split("\n")[0].slice(0, 40)))) {
      console.log(`   ★ 이미 있음 — 건너뜀 : ${it.q.slice(0, 40)}`);
      continue;
    }

    list.push({
      id: next,
      level: sample.level,
      method: sample.method,
      category: sample.category,
      source,
      question: it.q,
      options: it.o,
      answer: 0,
      note:
        `원본이 서술형이라 held/ 로 빼 두었던 문항(원본 ${it.was}번)이다. ` +
        `정답은 원본 그대로 두고 오답 셋을 지어 넣어 4지선다로 되돌렸다 (2026-08-27). ` +
        `종목 NDE Level Ⅲ 승인 필요 — HIE-QP-E02 6.1.2, 6.3.1`,
    });

    console.log(`   id${next}  ${it.q.split("\n")[0].slice(0, 66)}`);
    console.log(`         정답 ${it.o[0].split("\n")[0]}`);
    next++;
    added++;
  }

  if (write) fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n", "utf8");
}

console.log(`\n되돌린 문항 ${added}개`);
if (!write) console.log("보여만 준 것이다. 실제로 넣으려면 --써라 를 붙인다.");
else console.log("썼다. held/ 의 두 파일은 사람이 지운다.");
