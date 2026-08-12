/*
 * 채점 규칙 (Quiz / Result / 인쇄 컴포넌트가 공용으로 쓴다)
 *
 * 문항은 세 가지다.
 *
 *   single  선택지에서 하나 고르기.  answer 는 0-based 인덱스   (예: 2)
 *   multi   선택지에서 여럿 고르기.  answer 는 인덱스 배열       (예: [0,1,3,4,5])
 *   text    주관식.                 answer 는 문자열            (예: "Slag")
 *           원본 시험지가 서술형인 ECT / RFT Specific 이 여기 해당한다.
 *
 * 응시자 답(user)도 같은 모양으로 저장한다.
 *   single -> number, multi -> number[], text -> string
 */

export const SINGLE = "single";
export const MULTI = "multi";
export const TEXT = "text";

export function questionType(q) {
  if (Array.isArray(q && q.answer)) return MULTI;

  const hasOptions =
    Array.isArray(q && q.options) && q.options.length > 0;

  return hasOptions ? SINGLE : TEXT;
}

/*
 * 주관식 비교용 정규화.
 * 대소문자, 공백, 문장부호 차이는 무시한다.
 * 단위나 기호(°, %, /, 숫자)는 답의 일부이므로 남긴다.
 */
export function normalizeText(value) {
  return String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[()[\]{}"'`~!?;:*_]/g, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortedUnique(list) {
  return [...new Set(list.map(Number))]
    .filter(n => Number.isFinite(n))
    .sort((a, b) => a - b);
}

/** 응시자가 이 문항에 답을 했는가 */
export function isAnswered(q, user) {
  switch (questionType(q)) {
    case MULTI:
      return Array.isArray(user) && user.length > 0;

    case TEXT:
      return typeof user === "string" && user.trim() !== "";

    default:
      return user !== undefined && user !== null && user !== "";
  }
}

/** 정답인가 */
export function isCorrect(q, user) {
  if (!q) return false;

  switch (questionType(q)) {

    case MULTI: {
      if (!Array.isArray(user)) return false;

      const got = sortedUnique(user);
      const want = sortedUnique(q.answer);

      return (
        want.length > 0 &&
        got.length === want.length &&
        got.every((v, i) => v === want[i])
      );
    }

    case TEXT: {
      const want = normalizeText(q.answer);

      // 정답이 비어 있으면(아직 안 채운 문항) 맞다고 하지 않는다
      return want !== "" && normalizeText(user) === want;
    }

    default: {
      if (!isAnswered(q, user)) return false;
      return Number(user) === Number(q.answer);
    }
  }
}

/** 인쇄물에서 "이 선택지가 정답인가" 표시용 */
export function isCorrectOption(q, index) {
  if (Array.isArray(q && q.answer)) {
    return q.answer.map(Number).includes(index);
  }
  return Number(q && q.answer) === index;
}

/** 인쇄물에서 "응시자가 이 선택지를 골랐는가" 표시용 */
export function isChosenOption(user, index) {
  if (Array.isArray(user)) return user.map(Number).includes(index);
  if (user === undefined || user === null || user === "") return false;
  return Number(user) === index;
}

/** 화면·인쇄에 보여줄 응시자 답 문자열 */
export function formatUserAnswer(q, user, marks) {
  const type = questionType(q);

  if (type === TEXT) {
    return typeof user === "string" && user.trim() !== "" ? user : "-";
  }

  const list = Array.isArray(user) ? user : user === undefined || user === null || user === "" ? [] : [user];

  if (list.length === 0) return "-";

  return list
    .map(Number)
    .sort((a, b) => a - b)
    .map(i => (marks && marks[i]) || String(i + 1))
    .join(", ");
}
