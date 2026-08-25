/*
 * 보기 번호 글자.
 *
 * 예전에는 ["①","②","③","④"] 처럼 배열로 박아 두었다. 보기가 늘 때마다
 * 배열을 늘려 왔는데 — 넷 → 여덟 — 그때마다 그 수를 넘는 문항에서
 * "① ② ③ ④ ⑤ ⑥ ⑦ ⑧ 9 10" 처럼 뒤쪽만 맨 숫자로 나왔다.
 * HIE-QP-E02 4.8 은 보기를 2개에서 10개까지 둘 수 있게 정한다.
 *
 * 배열을 늘리는 대신 글자표에서 바로 뽑는다. 다시 잘릴 일이 없다.
 *
 *   속 빈 동그라미  ①~⑳    U+2460 ~ U+2473
 *   속 찬 동그라미  ❶~❿    U+2776 ~ U+277F
 *                  ⓫~⓴    U+24EB ~ U+24F4
 *
 * 스무 개를 넘으면 그냥 숫자로 적는다. 그런 문항은 없다.
 */

/** 보기 번호 (속 빈 동그라미). i 는 0부터 */
export function optionMark(i) {
  const n = Number(i);
  if (!Number.isInteger(n) || n < 0) return "";
  if (n < 20) return String.fromCharCode(0x2460 + n);
  return String(n + 1);
}

/** 고른 보기 (속 찬 동그라미). 답안 표기란에서 쓴다 */
export function optionMarkFilled(i) {
  const n = Number(i);
  if (!Number.isInteger(n) || n < 0) return "";
  if (n < 10) return String.fromCharCode(0x2776 + n);   /* ❶~❿ */
  if (n < 20) return String.fromCharCode(0x24EB + (n - 10)); /* ⓫~⓴ */
  return String(n + 1);
}
