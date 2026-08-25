/*
 * 복수정답 문항을 조합형 4지선다로 바꾼다.
 *
 * 보기가 넷을 넘는 문항이 여덟 개 있었고 그중 일곱이 복수정답이었다.
 * 오답 보기를 지워 넷으로 줄이면 정답 비율이 올라가 문제가 쉬워진다.
 * (MT 일반 12번은 열 중 셋이 정답이라 넷으로 줄이면 3/4가 정답이 된다.)
 *
 * 그래서 항목을 묶어 한 번호에 여러 개를 넣는다.
 *
 *   ① a · d · e
 *   ② a · b · c   ← 정답. 원본 정답 조합 그대로다
 *   ③ b · e · f
 *   ④ c · d · f
 *
 * 지킨 규칙
 *   정답 조합은 원본 정답 그대로 둔다. 새로 만든 것은 오답 조합뿐이다.
 *   네 보기의 항목 수를 모두 같게 한다. 하나만 개수가 다르면 그것만
 *     보고도 답을 고른다.
 *   오답 조합에는 반드시 원본에서 오답인 항목이 하나 이상 들어간다.
 *   정답 자리를 ①에 몰지 않는다.
 *
 * ★ 오답 조합은 내가 지은 것이다. HIE-QP-E02 6.1.2·6.3.1 에 따라
 *   해당 종목 NDE Level Ⅲ 의 확인이 필요하다. 각 문항의 note 에 적어 둔다.
 *
 * 쓰임 : node tools/to-combo.mjs [--dry]
 */
import fs from "node:fs";

const DRY = process.argv.includes("--dry");
const P2 = "public/data/Level II/";
const P3 = "public/data/Level III/";

/* 항목을 묶어 보기 하나로 만든다 */
const join = (items) => ({
  en: items.map((x) => x.en).join(" · "),
  ko: items.map((x) => x.ko).join(" · "),
});

const JOBS = [];

/* ── 일반/MT 12 — 자분탐상 가능한 금속 (정답 3개) ── */
{
  const m = {
    ferro: { en: "ferro-magnetic metals", ko: "강자성 금속" },
    low:   { en: "low carbon steel", ko: "저탄소강" },
    ni:    { en: "nickel", ko: "니켈" },
    al:    { en: "aluminum", ko: "알루미늄" },
    aus:   { en: "austenitic steels", ko: "오스테나이트 강" },
    cu:    { en: "copper", ko: "구리" },
    br:    { en: "bronze", ko: "청동" },
    mg:    { en: "magnesium", ko: "마그네슘" },
    ti:    { en: "titanium", ko: "티타늄" },
  };
  JOBS.push({
    file: P2 + "General/MT.json", id: 12,
    question:
      "Select the group of metals that may be magnetic particle inspected.\n" +
      "자분탐상시험을 할 수 있는 금속끼리 묶은 것은?",
    groups: [
      [m.low, m.al, m.cu],
      [m.ferro, m.low, m.ni],          /* 정답 */
      [m.ni, m.aus, m.ti],
      [m.ferro, m.br, m.mg],
    ],
    answer: 1,
  });
}

/* ── 일반/MT 14 — 단조물에서 찾기 힘든 불연속 (정답 2개) ── */
{
  const d = {
    shrink: { en: "shrink", ko: "수축" },
    lof:    { en: "lack of fusion", ko: "용융부족" },
    laps:   { en: "laps", ko: "겹침" },
    flash:  { en: "flash line cracks", ko: "플래시선 균열" },
    flakes: { en: "flakes", ko: "플레이크" },
    burst:  { en: "cracks or bursts", ko: "균열이나 파열" },
  };
  JOBS.push({
    file: P2 + "General/MT.json", id: 14,
    question:
      "Which group lists discontinuities that may NOT be found in forgings?\n" +
      "단조물에서는 찾아보기 힘든 불연속끼리 묶은 것은?",
    groups: [
      [d.laps, d.flakes],
      [d.flash, d.burst],
      [d.shrink, d.lof],               /* 정답 */
      [d.shrink, d.laps],
    ],
    answer: 2,
  });
}

/* ── 일반/VT 28 — VT 절차서 포함 항목 (정답 5개 / 오답 1개) ── */
{
  const v = {
    how:  { en: "How exam. is to be performed", ko: "검사를 어떻게 수행할 것인가" },
    prep: { en: "Surface preparation", ko: "표면 전처리" },
    seq:  { en: "Sequence of performing exam.", ko: "검사 수행 순서" },
    spec: { en: "Manufacturer’s specification", ko: "제조자 시방서" },
    data: { en: "Data to be tabulated, if any", ko: "기록할 데이터가 있다면 그 내용" },
    step: { en: "Step wedge comparison film", ko: "계단쐐기 대비 필름" },  /* 오답 */
  };
  JOBS.push({
    file: P2 + "General/VT.json", id: 28,
    question:
      "Which group lists items that a written VT procedure shall contain?\n" +
      "VT 절차서에 포함되어야 하는 항목끼리 묶은 것은?",
    groups: [
      [v.how, v.prep, v.step, v.seq, v.spec],
      [v.how, v.prep, v.seq, v.spec, v.data],   /* 정답 */
      [v.prep, v.step, v.seq, v.spec, v.data],
      [v.how, v.step, v.seq, v.spec, v.data],
    ],
    answer: 1,
  });
}

/* ── LIII/Basic 38 — 탄성한계를 조금 넘었을 때 (정답 2개) ── */
{
  const b = {
    plastic: { en: "Plastic flow", ko: "소성 유동" },
    work:    { en: "Work hardening", ko: "가공경화" },
    crack:   { en: "Cracking", ko: "균열" },
    fatigue: { en: "Fatigue", ko: "피로" },
    elastic: { en: "Elastic deformation", ko: "탄성 변형" },
    twin:    { en: "Twinning", ko: "쌍정" },
  };
  JOBS.push({
    file: P3 + "Basic.json", id: 38,
    question:
      "Which group lists what normally occurs when stressing most engineering materials " +
      "a small amount beyond their elastic limit?\n" +
      "대부분의 공학 재료가 탄성한계를 조금 넘는 응력을 받을 때 일어나는 현상끼리 묶은 것은?",
    groups: [
      [b.elastic, b.fatigue],
      [b.crack, b.twin],
      [b.plastic, b.work],             /* 정답 */
      [b.plastic, b.crack],
    ],
    answer: 2,
  });
}

/* ── LIII/RT 33 — 피사체대비 (정답 3개) ── */
{
  const r = {
    thick: { en: "thickness differences in specimen", ko: "시험체의 두께 차이" },
    energy:{ en: "radiation energy level", ko: "방사선 에너지 준위" },
    dens:  { en: "density variations in specimen", ko: "시험체의 밀도 변화" },
    scat:  { en: "scattered radiation", ko: "산란 방사선" },
    film:  { en: "type of film used", ko: "사용한 필름의 종류" },
    sfd:   { en: "source-to-film distance", ko: "선원-필름 거리" },
  };
  JOBS.push({
    file: P3 + "RT.json", id: 33,
    question:
      "Which group lists items that affect subject contrast?\n" +
      "피사체대비에 영향을 주는 것끼리 묶은 것은?",
    groups: [
      [r.thick, r.energy, r.dens],     /* 정답 */
      [r.thick, r.scat, r.film],
      [r.energy, r.sfd, r.film],
      [r.dens, r.scat, r.sfd],
    ],
    answer: 0,
  });
}

/* ── LIII/RT 34 — 방사선 흡수 개념 (정답 3개) ── */
{
  const r = {
    compton: { en: "Compton effect", ko: "컴프턴 효과" },
    photo:   { en: "Photoelectric effect", ko: "광전 효과" },
    pair:    { en: "Pair production", ko: "쌍생성" },
    brems:   { en: "Bremsstrahlung", ko: "제동복사" },
    disint:  { en: "disintegration", ko: "붕괴" },
    kcap:    { en: "K-capture", ko: "K 포획" },
  };
  JOBS.push({
    file: P3 + "RT.json", id: 34,
    question:
      "Which group lists the nuclear concepts by which radiation is absorbed?\n" +
      "방사선이 흡수되는 원자핵 개념끼리 묶은 것은?",
    groups: [
      [r.compton, r.brems, r.kcap],
      [r.photo, r.disint, r.brems],
      [r.compton, r.photo, r.pair],    /* 정답 */
      [r.pair, r.kcap, r.disint],
    ],
    answer: 2,
  });
}

/* ── LIII/RT 37 — 120KV 초과 촬영의 납박 효과 (정답 3개) ── */
{
  const r = {
    dec:  { en: "decreases exposure time", ko: "노출시간을 줄인다" },
    long: { en: "absorbs long wavelength scattered radiation", ko: "긴 파장의 산란선을 흡수한다" },
    imp:  { en: "improves sharpness and definition", ko: "선명도와 명료도를 높인다" },
    inc:  { en: "increases exposure time", ko: "노출시간을 늘린다" },
    short:{ en: "absorbs short wavelength scattered radiation", ko: "짧은 파장의 산란선을 흡수한다" },
    red:  { en: "reduces sharpness and definition", ko: "선명도와 명료도를 떨어뜨린다" },
  };
  JOBS.push({
    file: P3 + "RT.json", id: 37,
    question:
      "Which group lists the significant effects of lead foil in direct contact with the film " +
      "for exposures over 120 KV?\n" +
      "120KV를 넘는 촬영에서 필름에 직접 밀착시킨 납박의 중요한 효과끼리 묶은 것은?",
    groups: [
      [r.inc, r.short, r.red],
      [r.dec, r.long, r.imp],          /* 정답 */
      [r.dec, r.short, r.red],
      [r.inc, r.long, r.imp],
    ],
    answer: 1,
  });
}

/* ── 일반/VT 1 — 단일정답이라 오답만 둘 덜어낸다 ── */
const TRIM = {
  file: P2 + "General/VT.json", id: 1,
  keep: [0, 1, 4, 5],   /* radio · infrared · cosmic rays · X-rays */
  answer: 2,
};

/* ── 적용 ─────────────────────────────── */
let n = 0;

for (const j of JOBS) {
  const bank = JSON.parse(fs.readFileSync(j.file, "utf8"));
  const q = bank.find((x) => x.id === j.id);
  if (!q) { console.error("  ! 못 찾음 " + j.file + " id" + j.id); continue; }

  const sizes = new Set(j.groups.map((g) => g.length));
  if (sizes.size !== 1) { console.error("  ! 보기마다 항목 수가 다르다 " + j.id); continue; }

  q.question = j.question;
  q.options = j.groups.map((g) => { const c = join(g); return c.en + "\n" + c.ko; });
  q.answer = j.answer;
  q.note =
    "원본은 보기 " + (q.options.length > 4 ? "" : "") + "여러 개 가운데 복수정답을 고르는 문항이었다. " +
    "오답 보기를 지워 넷으로 줄이면 정답 비율이 올라가 문제가 쉬워지므로, 항목을 묶어 " +
    "조합형 4지선다로 바꿨다. 정답 조합은 원본 정답 그대로이고 오답 조합은 새로 만든 것이다. " +
    "네 보기의 항목 수를 같게 맞춰 개수로 답이 드러나지 않게 했다. " +
    "★ 오답 조합은 해당 종목 NDE Level Ⅲ 의 확인이 필요하다 (HIE-QP-E02 6.1.2, 6.3.1).";

  if (!DRY) fs.writeFileSync(j.file, JSON.stringify(bank, null, 2) + "\n");
  console.log("■ " + j.file.split("/").slice(-2).join("/") + " id" + j.id +
    "  보기 " + j.groups.length + "개 × 항목 " + j.groups[0].length + "개  정답 " + "①②③④"[j.answer]);
  j.groups.forEach((g, i) =>
    console.log("   " + (i === j.answer ? "▶" : " ") + "①②③④"[i] + " " + join(g).ko.slice(0, 76)));
  n++;
}

/* 단일정답 문항은 오답만 덜어낸다 */
{
  const bank = JSON.parse(fs.readFileSync(TRIM.file, "utf8"));
  const q = bank.find((x) => x.id === TRIM.id);
  if (q) {
    const kept = TRIM.keep.map((i) => q.options[i]);
    q.options = kept;
    q.answer = TRIM.answer;
    q.note = "원본은 보기가 여섯인 단일정답 문항이었다. 정답은 그대로 두고 오답 보기 둘만 " +
             "덜어내 넷으로 맞췄다. 묻는 내용은 바뀌지 않았다.";
    if (!DRY) fs.writeFileSync(TRIM.file, JSON.stringify(bank, null, 2) + "\n");
    console.log("■ " + TRIM.file.split("/").slice(-2).join("/") + " id" + TRIM.id +
      "  오답 둘만 덜어냄  정답 " + "①②③④"[TRIM.answer]);
    kept.forEach((o, i) =>
      console.log("   " + (i === TRIM.answer ? "▶" : " ") + "①②③④"[i] + " " + String(o).replace("\n", " / ")));
    n++;
  }
}

console.log("\n" + (DRY ? "[미리보기] " : "") + "바꾼 문항 " + n + "개");
