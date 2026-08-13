/*
 * 묶음 지시문의 문항 번호.
 *
 * 원본 시험지는 이렇게 적는다.
 *   * The following questions (1-5) refer to HIE procedure, HIE-NDT-UT-N21 ...
 *     (다음 문제 (1-5)은 HIE 절차서에 언급된다. ...)
 *
 * CBT 는 문항을 섞어 뽑으니 원본 번호를 그대로 두면 거짓말이 된다.
 * A 시험지 (6-10) 과 B 시험지 (21-25) 가 같은 묶음이기도 하다.
 * 그래서 데이터에서는 번호를 떼어 두고, 화면에 그릴 때 이번 시험지의
 * 실제 번호를 다시 넣는다.
 *
 * 묶음 문항은 늘 붙어서 움직이므로(규칙 10) 번호가 이어진 한 덩어리다.
 */

/* 문항 -> "1-5" 또는 "3" */
export function groupRanges(questions) {
  const map = new Map();
  const list = questions || [];

  let i = 0;
  while (i < list.length) {
    const note = list[i] && list[i].groupNote;
    if (!note) {
      i++;
      continue;
    }

    let j = i;
    while (j + 1 < list.length && list[j + 1] && list[j + 1].groupNote === note) j++;

    const label = i === j ? String(i + 1) : `${i + 1}-${j + 1}`;
    for (let k = i; k <= j; k++) map.set(list[k], label);

    i = j + 1;
  }
  return map;
}

/*
 * 지시문에 번호를 끼워 넣는다.
 *
 *   The following questions refer to ...   ->  The following questions (1-5) refer to ...
 *   (다음 문제는 HIE 절차서에 ...)          ->  (다음 문제 (1-5)은 HIE 절차서에 ...)
 *
 * 이미 번호가 붙어 있는 줄은 건드리지 않는다. 원본에서 번호를 못 떼어낸
 * 지시문이 아직 남아 있을 수 있다.
 */
/*
 * 숫자 뒤에 붙는 조사를 고른다.
 *
 * "(1-6)" 은 "일에서 육" 이라 읽으니 받침이 있어 "은" 이고,
 * "(1-5)" 는 "오" 로 끝나 "는" 이다. 마지막 자리 숫자로 가른다.
 * 10·20 처럼 0 으로 끝나면 "십" 이라 받침이 있다.
 */
const HAS_TAIL = {
  0: true,  // 십
  1: true,  // 일
  2: false, // 이
  3: true,  // 삼
  4: false, // 사
  5: false, // 오
  6: true,  // 육
  7: true,  // 칠
  8: true,  // 팔
  9: false, // 구
};

const JOSA = {
  은: ["은", "는"],
  는: ["은", "는"],
  이: ["이", "가"],
  가: ["이", "가"],
  을: ["을", "를"],
  를: ["을", "를"],
};

function josaFor(label, had) {
  const pair = JOSA[had];
  if (!pair) return had;

  const lastDigit = Number(String(label).replace(/\D/g, "").slice(-1));
  return HAS_TAIL[lastDigit] ? pair[0] : pair[1];
}

export function withRange(note, label) {
  if (!note || !label) return note;

  return String(note)
    .split("\n")
    .map((line) => {
      /* 원본에서 번호를 못 떼어낸 지시문이 남아 있을 수 있다 */
      if (/[(（]\s*\d{1,3}\s*(?:[-–~～]\s*\d{1,3}\s*)?[)）]/.test(line)) return line;

      return line
        .replace(/\b(questions?)\b/i, `$1 (${label})`)
        .replace(
          /(문제|문항)(은|는|이|가|을|를)/,
          (m, word, had) => `${word} (${label})${josaFor(label, had)}`
        );
    })
    .join("\n");
}
