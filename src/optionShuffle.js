/*
 * 보기 자리 섞기.
 *
 * HIE-QP-E02 7.3.1 은 「문항 순서와 보기 순서를 매 회차 섞는다」고 한다.
 * 그런데 보기 가운데에는 옮기면 뜻이 무너지는 것이 있어 그냥 섞을 수 없다.
 * 두 갈래로 나눠 다룬다.
 *
 *   1. 자리를 지키는 보기 (LOCKED)  — 그 보기만 제자리에 두고 나머지를 섞는다
 *      「all of the above」 「위의 모두」 「해당 없음」
 *      앞에 무엇이 있든 「위의 것 전부」라는 뜻이라, 자기만 끝에 있으면 된다.
 *      1,096문항에 139개.
 *
 *   2. 번호로 다른 보기를 부르는 문항 (NUMBER_REF) — 아예 안 섞는다
 *      「Both 1 and 2」 「b and c above」 「1, 2, 3번 모두」
 *      1번과 2번이 자리를 바꾸면 가리키는 내용이 달라진다. 그 보기를
 *      제자리에 둬도 소용이 없다. 36문항이 그렇다.
 *
 * 어느 쪽에도 안 걸리면 보기를 다 섞는다.
 *
 * tools/shuffle-test.mjs 가 은행 24개를 문항마다 200번씩 섞어 보며
 * 정답이 같은 보기를 가리키는지, 자리를 지켜야 할 보기가 안 움직였는지,
 * 보기 모임이 그대로인지 잰다.
 */

/* Fisher-Yates */
export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/*
 * 자리를 지키는 보기.
 *
 * 낱말 하나로 잡으면 안 된다. 「testing both sides of the specimen」
 * 「radiation of a wavelength above 300nm」처럼 above·both 가 들어 있어도
 * 다른 보기를 안 가리키는 것이 많다. 짜임으로 잡는다.
 */
export const LOCKED = [
  /\b(all|none|any|both|either|neither)\s+of\s+(the\s+)?(above|following|foregoing|these|them)\b/i,
  /\b(all|none|any)\s+of\s+[a-d]\s+above\b/i,
  /\b(all|none)\s+of\s+above\b/i,
  /\ball\s+of\s+current\b/i,
  /\bthe\s+above\s+(answers?|choices?)\b/i,
  /위\s*(의|에)?\s*(모두|전부|어느|아무|것|답|1|2|3|A|B)/,
  /상기\s*(모두|전부|어느)/,
  /해당\s*(사항)?\s*없(음|다)/,
  /정답\s*(이)?\s*없(음|다)/,
  /모두\s*(정답|맞|해당|합격|불합격|아니|옳)/,
  /어느\s*것도\s*(아니|옳지|맞지)/,
  /둘\s*다/,
];

export const isLocked = (option) =>
  LOCKED.some((re) => re.test(String(option)));

/*
 * 번호나 글자로 다른 보기를 부르는 보기.
 *
 * 하나라도 있으면 그 문항은 통째로 안 섞는다.
 *
 * 「Both sketch a and sketch b」는 여기 안 든다. 보기에 붙은 번호가 아니라
 * 문제 그림 속 스케치를 가리키는 말이고, 그 이름이 보기 글에 그대로
 * 적혀 있어 자리가 바뀌어도 뜻이 안 달라진다. (RFT 일반 39번)
 */
export const NUMBER_REF = [
  /\banswers?\s*\d+\s*(,|and|&)\s*\d+/i,
  /\b(both|neither|either)\s*\d+\s*(and|nor|or|&|,)\s*\d+/i,
  /\ba\s+mixture\s+of\s+\d/i,
  /\b(all|any|none)\s+of\s+[a-d]\s*,\s*[a-d]/i,
  /\b[a-d]\s+and\s+[a-d]\s+above\b/i,
  /^[a-d]\s+and\s+[a-d]\s*(are\s+correct)?$/im,
  /\d\s*번\s*(과|와)\s*\d\s*번/,
  /\d\s*(,|과|와)\s*\d\s*(,|과|와)?\s*\d?\s*번?\s*(이|가)?\s*(모두|다|전부)/,
  /[a-d]\s*,\s*[a-d]\s*둘\s*다/i,
  /[A-D]\s*(와|과)\s*[A-D]\s*(가|이)?\s*맞/,
];

export const callsByNumber = (options) =>
  options.some((o) => NUMBER_REF.some((re) => re.test(String(o))));

/*
 * 한 문항의 보기 자리를 바꾼다.
 *
 * 정답 번호도 같이 옮긴다. 안 옮기면 채점이 통째로 어긋난다.
 * 복수정답(배열)은 번호를 하나하나 옮긴 뒤 다시 차례로 세운다.
 * 주관식(정답이 글자)은 보기가 없으니 여기 안 온다.
 */
export function shuffleOptions(q) {
  const opts = q && q.options;
  if (!Array.isArray(opts) || opts.length < 2) return q;
  if (callsByNumber(opts)) return q;

  /* 자리를 바꿔도 되는 칸 */
  const free = [];
  opts.forEach((o, i) => {
    if (!isLocked(o)) free.push(i);
  });
  if (free.length < 2) return q;

  /* free[k] 칸에 옛 pick[k] 번 보기가 온다 */
  const pick = shuffle(free);

  const options = [...opts];
  const from = opts.map((_, i) => i);          /* 새 자리 → 옛 자리 */

  free.forEach((slot, k) => {
    options[slot] = opts[pick[k]];
    from[slot] = pick[k];
  });

  /* 옛 자리 → 새 자리 */
  const to = [];
  from.forEach((old, now) => { to[old] = now; });

  let answer = q.answer;

  if (Array.isArray(answer)) {
    answer = answer
      .map((a) => (Number.isInteger(to[a]) ? to[a] : a))
      .sort((a, b) => a - b);
  } else if (Number.isInteger(answer) && Number.isInteger(to[answer])) {
    answer = to[answer];
  }

  return { ...q, options, answer };
}
