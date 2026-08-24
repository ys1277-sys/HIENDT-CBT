/*
 * 시험지 갑지(표지)의 NOTE.
 *
 * 예전에는 1·2·3 세 줄을 그대로 박아 뒀다. 그런데 원본 시험지 49개를
 * 열어 보니 갑지 NOTE 가 시험마다 다르다. 크게 세 군데가 갈린다.
 *
 *   - 1번  참고자료를 아예 못 쓰는지, 표·그래프·절차서까지 쓸 수 있는지,
 *          식·표·코드까지 쓸 수 있는지
 *   - 시간 제한  "시험시간은 2시간 이내" 가 붙는 시험과 안 붙는 시험
 *   - ASNT 단서  Level III 전문시험에만 붙는다
 *
 * 원본에 있던 "3. This examination must be completed in ink or ball-point
 * pen." 은 CBT 로 푸는 응시자에게는 맞지 않는 말이라, 시험지를 뽑아
 * 종이로 푸는 경우로 조건을 달아 바꿨다.
 *
 * 원본 영문에 손댄 곳
 *   - "This is closed book examination"  →  a 를 넣었다
 *   - 참고자료를 쓸 수 있다는 문장 앞에 However 를 넣었다. 원문에는
 *     접속사가 없어 앞 문장(closed book)과 정면으로 어긋나 읽혔다.
 *     한글은 처음부터 "…없으나" 였다.
 *   - "are required to specific examination only"  →  take 를 넣었다
 */

/* 1. 서적 참고 — 시험마다 갈리는 첫 줄 */

const CLOSED = {
  en:
    "This is a closed book examination. " +
    "No reference material may be used during the examination.",
  ko: "시험 도중 서적을 참고할 수 없음"
};

const OPEN_PROC = {
  en:
    "This is a closed book examination. However, reference material such as " +
    "graphs, tables and the applicable procedure may be used during the examination.",
  ko: "시험 도중 서적을 참고할 수 없으나, 표, 그래프, 적용 절차서는 사용할 수 있다"
};

const OPEN_CODE = {
  en:
    "This is a closed book examination. However, reference material " +
    "(equations, tables, codes, etc.) may be used during the examination.",
  ko: "시험 도중 서적을 참고할 수 없으나, 참고자료(식, 표, 코드 등)는 사용할 수 있다"
};

const OPEN_EQ = {
  en:
    "This is a closed book examination. However, reference material " +
    "(equations, tables, etc.) may be used during the examination.",
  ko: "시험 도중 서적을 참고할 수 없으나, 참고자료(식, 표 등)는 사용할 수 있다"
};

/* 2·3·4·5 — 붙는 시험만 다를 뿐 글은 같다 */

const INTENT = {
  en:
    "Questions about the intent of an examination question " +
    "will be answered during the examination.",
  ko: "문제에 대한 질문에 한해서 답변함"
};

const INK = {
  en:
    "If the examination is taken on a printed paper, " +
    "answers must be completed in ink or ball-point pen.",
  ko: "시험지 출력 후 시험을 보는 경우 답변은 볼펜 또는 잉크로 기록할 것"
};

const GRADE = {
  en:
    "Examination administered for qualification shall result in a composite " +
    "grade of at least 80%, with no individual examination having a grade less than 70%.",
  ko: "과락은 70%이며 합격선은 80%임"
};

const TIME = {
  en: "Completed within 2 hr.",
  ko: "시험시간은 2시간 이내"
};

/* 번호 없이 4번 아래 덧붙는 단서. Level III 전문시험에만 있다 */

const ASNT = {
  en:
    "※ Candidates with ASNT NDE Level III certification are satisfied with " +
    "the Basic Examination and the Method Examination (for each method) and are " +
    "required to take the specific examination only. (Minimum grade 80%.)",
  ko:
    "ASNT NDE Level III 자격을 소지한 응시자는 기본시험, 종목시험(각 종목 시험에 " +
    "대한)을 만족한 것으로 하며, 전문 시험만 시행하도록 할 것.(합격선 80%)"
};

/*
 * 갈래 다섯. 뒤에 붙은 이름은 원본 시험지에서 온 것이다.
 *
 *   A  ECTG-II(B), RFTG-II(B), ECTS-II, RFTS-II, B-III
 *   B  MTG-II, PTG-II, RTG-II, UTG-II, VTG-ll
 *   C  PAUT/TOFD General, Specific(2020·2014) 전부
 *   D  MTM-III, PTM-III, RTM-III, UTM-III
 *   E  VTS-IIIB by SYH
 */

const A = { items: [CLOSED, INTENT, INK, GRADE] };
const B = { items: [CLOSED, INTENT, INK, GRADE, TIME] };
const C = { items: [OPEN_PROC, INTENT, INK, GRADE, TIME] };
const D = { items: [OPEN_CODE, INTENT, INK, GRADE] };
const E = { items: [OPEN_EQ, INTENT, INK, GRADE], footer: ASNT };

/*
 * 시험 → 갈래.
 *
 * 열쇠는 "Level II/General/MT" 꼴이다. Level III 는 시험구분이 없어
 * "Level III/MT" 가 된다.
 */

const MAP = {
  "Level II/General/ECT": A,
  "Level II/General/RFT": A,

  "Level II/General/MT": B,
  "Level II/General/PT": B,
  "Level II/General/RT": B,
  "Level II/General/UT": B,
  "Level II/General/VT": B,

  "Level II/General/PAUT": C,
  "Level II/General/TOFD": C,

  "Level II/Specific/ECT": A,
  "Level II/Specific/RFT": A,

  "Level II/Specific/MT": C,
  "Level II/Specific/PAUT": C,
  "Level II/Specific/PT": C,
  "Level II/Specific/RT": C,
  "Level II/Specific/TOFD": C,
  "Level II/Specific/UT": C,
  "Level II/Specific/VT": C,

  "Level III/Basic": A,

  "Level III/MT": D,
  "Level III/PT": D,
  "Level III/RT": D,
  "Level III/UT": D,

  "Level III/VT": E
};

/*
 * 갑지에 찍을 NOTE 를 고른다.
 *
 * 위 표가 문제은행의 23개 과목을 다 덮고 있어 아래 기본값까지 갈 일은
 * 없다. 새 과목이 늘었을 때 갑지가 비지 않게 두는 안전판이다.
 * 가장 빡빡한 A(서적 참고 불가)를 기본으로 둔다.
 */

export function examNote(level, method, subject) {
  const key = subject
    ? `${level}/${subject}/${method}`
    : `${level}/${method}`;

  return MAP[key] || A;
}

export default examNote;
