/*
 * 답지 통합 파서
 *
 * 시험지 답지 형식이 세 가지다.
 *
 *  (1) 블록형   "문제" 헤더 + 번호 여러 개 + "해답" 헤더 + 답 여러 개
 *               10문항 단위로 반복. Level II 대부분.
 *               한 문항의 답이 여러 줄에 걸치기도 한다
 *               (예: "네 가지를 쓰시오" -> CRACK / POROSITY / I.P L.F / SLAG)
 *
 *  (2) 격자형   번호와 답이 번갈아 나온다. 번호가 세로로 흐르므로
 *               6 A 16 C 26 C 36 C  7 C 17 C ... 처럼 보인다.
 *               제목("ANSWER SHEET" / "Answers" / "해답")이 있을 때도 없을 때도 있다.
 *
 *  (3) 각주     칸이 좁아 "#1" "*1" 만 적고 표 아래에 실제 답을 쓴 경우.
 *               해당 번호의 각주 내용을 정답으로 삼는다.
 */

const HEAD_Q = /^문\s*제$/;
const HEAD_A = /^해\s*답$/;
const LETTERS = /^[A-Za-z](?:\s*[,·\/]\s*[A-Za-z]|\s+[A-Za-z](?=\s|$))*$/;

const clean = (s) =>
  s.replace(/\[\[OBJ\]\]/g, " ")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ")
    .replace(/[\u200B-\u200F\u3000\uE000-\uF8FF\uFEFF\uFFF0-\uFFFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DECOR = /^[\u2500-\u257F\u25A0-\u25FF\u2580-\u259F\uFFF0-\uFFFF\u00B7\u318D_\-=~]+$/;
const meaningful = (s) => s !== "" && !DECOR.test(s.replace(/\s/g, ""));

const isNum = (s) => /^\d{1,3}$/.test(s);

/*
 * 답지가 문서 끝에만 있는 게 아니다. 중간에 답지가 나오고 그 뒤로 문항이
 * 다시 이어지는 시험지가 있다.
 *
 *   22
 *   c                                          <- 22번 답, 여기서 답지 끝
 *   2. How to prove the strength of ...         <- 다시 문항
 *
 * 이걸 모르면 답지 마지막 항목이 뒤따르는 문항을 통째로 빨아들인다.
 * "번호. 영문" 이나 "A. 보기" 로 시작하면 답이 아니라 문항으로 본다.
 */
const looksLikeQuestion = (s) =>
  /^\d{1,2}[.)]\s+\S/.test(s) ||
  /^[A-Da-d][.)]\s+[A-Za-z가-힣]/.test(s) ||
  /^\*\s*(The following|Questions|Refer)/i.test(s) ||
  /*
   * 각주 "정의" 가 시작되면 답지는 끝난 것이다.
   *   *1 a : preclean  b : Application of penetrant ...   <- 정의, 여기서 끊는다
   *   *1                                                  <- 답 칸의 참조 표시, 이건 답이다
   */
  /^[#*]\d+\s+\S/.test(s);

/* ---------- (3) 각주 ---------- */

function collectFootnotes(lines) {
  const notes = {};
  let cur = null;

  for (const l of lines) {
    const m = /^[#*](\d+)\s*(.*)$/.exec(l);
    if (m) {
      cur = m[1];
      notes[cur] = m[2] ? [m[2]] : [];
    } else if (cur && !isNum(l)) {
      notes[cur].push(l);
    } else {
      cur = null;
    }
  }

  const out = {};
  for (const [k, v] of Object.entries(notes)) out[k] = v.join(" ").trim();
  return out;
}

const resolveFootnote = (ans, notes) => {
  const m = /^[#*](\d+)$/.exec(String(ans).trim());
  return m && notes[m[1]] ? notes[m[1]] : ans;
};

/* ---------- (1) 블록형 ---------- */

function parseBlocks(lines, hasOptions) {
  const key = {};
  const warnings = [];
  let found = false;

  let i = 0;
  while (i < lines.length) {
    if (!HEAD_Q.test(lines[i])) { i++; continue; }
    found = true;
    i++;

    const nos = [];
    while (i < lines.length && isNum(lines[i])) nos.push(Number(lines[i++]));
    if (!nos.length) continue;

    if (i >= lines.length || !HEAD_A.test(lines[i])) {
      warnings.push(`${nos[0]}~${nos[nos.length - 1]}번 뒤에 '해답' 없음`);
      continue;
    }
    i++;

    /*
     * 다음 "문제" 헤더까지가 이 블록의 답이다.
     * 다만 답지 뒤에 문항이 다시 이어지는 시험지가 있어서,
     * 문항처럼 보이는 줄이 나오면 거기서 끊는다.
     */
    const answers = [];
    while (i < lines.length && !HEAD_Q.test(lines[i]) && !looksLikeQuestion(lines[i])) {
      /*
       * 각주 표시가 홀로 있는 줄.
       *   ... 합격 / 불합격 / #1 / 선형지시 ...
       * 아직 답이 모자라면 그 표시가 곧 답(각주 참조)이지만,
       * 문항 수만큼 채운 뒤라면 여기부터는 각주 본문이다.
       */
      if (/^[#*]\d+$/.test(lines[i]) && answers.length >= nos.length) break;

      answers.push(lines[i++]);
    }

    /*
     * 답 줄을 문항에 배분한다.
     * 뒤에서부터 "글자 답"을 확정해 두면, 가운데 있는 여러 줄짜리
     * 서술형 답이 몇 줄인지 저절로 정해진다.
     */
    let a = 0;
    for (let k = 0; k < nos.length; k++) {
      const no = nos[k];
      const remainQ = nos.length - k - 1;               // 이 문항 뒤에 남은 문항 수
      const maxTake = answers.length - a - remainQ;     // 뒤 문항 몫을 남기고 가져갈 수 있는 최대

      if (maxTake <= 0) { warnings.push(`${no}번 답 없음`); continue; }

      if (hasOptions(no) || LETTERS.test(answers[a] || "")) {
        key[no] = answers[a++];
        continue;
      }

      const parts = [];
      while (
        parts.length < maxTake &&
        a < answers.length &&
        !(parts.length && LETTERS.test(answers[a]))
      ) {
        parts.push(answers[a++]);
      }
      key[no] = parts.join(" / ");
    }
  }

  return { key, warnings, found };
}

/* ---------- (2) 격자형 ---------- */

function expectedOrder(total, stride) {
  const out = [];
  for (let r = 1; r <= stride; r++) {
    for (let c = 0; r + c * stride <= total; c++) out.push(r + c * stride);
  }
  return out;
}

function tryGrid(tokens, start, total, stride) {
  const want = expectedOrder(total, stride);
  const key = {};
  let ti = start, matched = 0;

  for (let wi = 0; wi < want.length && ti < tokens.length; wi++) {
    if (Number(tokens[ti]) !== want[wi]) break;
    ti++;
    if (ti > tokens.length) break;

    const nextWant = want[wi + 1];
    const parts = [];
    while (ti < tokens.length && Number(tokens[ti]) !== nextWant) parts.push(tokens[ti++]);

    key[want[wi]] = parts.join(" ").trim();
    matched++;
  }

  return { key, matched, total: want.length };
}

/* ---------- (4) 헤더 없는 블록형 + 번호/답 쌍 교대 ---------- */

/*
 * 답지 표는 문서마다 셀 읽는 순서가 다르다.
 *   PAUT/TOFD :  11 12 13 ... 20  다음에  c a c c b b b c a d
 *   B-III     :  49 a 20 c 50 d 21 c ...   (열 순서가 뒤섞임)
 *
 * 격자 배열을 맞추려 하면 문서마다 깨진다.
 * 번호가 연달아 나오면 그 개수만큼 뒤를 답으로 보고(블록),
 * 하나만 나오면 바로 다음 토큰을 답으로 본다(쌍).
 * 이러면 열 순서와 무관하게 번호-답 짝이 잡힌다.
 */
function parseAuto(lines, validNo) {
  const key = {};
  let i = 0;

  while (i < lines.length) {
    if (!isNum(lines[i])) { i++; continue; }

    // 연속한 번호 모으기
    const nos = [];
    while (i < lines.length && isNum(lines[i]) && validNo(Number(lines[i]))) {
      nos.push(Number(lines[i++]));
    }
    if (!nos.length) { i++; continue; }

    if (nos.length === 1) {
      // 쌍 교대: 다음 토큰 하나가 답
      if (
        i < lines.length &&
        !(isNum(lines[i]) && validNo(Number(lines[i]))) &&
        !looksLikeQuestion(lines[i])
      ) {
        if (key[nos[0]] === undefined) key[nos[0]] = lines[i++];
      }
      continue;
    }

    // 블록: 번호 개수만큼 뒤를 답으로
    for (const no of nos) {
      if (i >= lines.length) break;
      if (isNum(lines[i]) && validNo(Number(lines[i]))) break;   // 다음 번호 블록 시작
      if (looksLikeQuestion(lines[i])) break;                    // 답지가 끝나고 문항이 다시 시작
      if (key[no] === undefined) key[no] = lines[i];
      i++;
    }
  }

  return key;
}

function parseGrid(lines, questionCount) {
  const nums = lines.filter(isNum).map(Number);
  if (!nums.length) return { key: {}, matched: 0 };

  const total = questionCount || Math.max(...nums);

  // 시작 후보: "1" 이 나오는 위치 (뒤에서부터 — 답지는 보통 문서 끝에 있다)
  const starts = [];
  lines.forEach((l, i) => { if (Number(l) === 1) starts.push(i); });
  starts.reverse();

  let best = { matched: 0, key: {} };

  for (const s of starts.slice(0, 6)) {
    for (let stride = 1; stride <= Math.max(1, total); stride++) {
      const r = tryGrid(lines, s, total, stride);
      if (r.matched > best.matched) best = { ...r, stride, start: s };
      if (best.matched === best.total) break;
    }
    if (best.matched === best.total) break;
  }

  return best;
}

/* ---------- 진입점 ---------- */

export function parseAnswerKey(text, { questionCount = 0, hasOptions = () => true } = {}) {
  const lines = text.split("\n").map(clean).filter(meaningful);
  const notes = collectFootnotes(lines);

  /*
   * 답지를 찾는 방식이 여러 가지라 모두 돌려보고
   * 문항 번호와 가장 많이 맞아떨어지는 결과를 쓴다.
   */
  const max = questionCount || 0;
  const validNo = (n) => n >= 1 && (max ? n <= max : n <= 200);

  const block = parseBlocks(lines, hasOptions);
  const grid = parseGrid(lines, questionCount);
  const auto = parseAuto(lines, validNo);

  /*
   * 답이 빈 칸인 항목은 세지 않는다.
   * 격자형은 정렬이 어긋나면 번호만 잔뜩 만들고 답을 다 비워두는데,
   * 개수만 세면 그게 이겨버린다.
   */
  const score = (k) =>
    Object.entries(k).filter(
      ([n, v]) => validNo(Number(n)) && String(v).trim() !== ""
    ).length;

  const cands = [
    { key: block.key, how: "블록형", warnings: block.warnings, n: score(block.key) },
    { key: grid.key, how: "격자형", warnings: [], n: score(grid.key) },
    { key: auto, how: "자동", warnings: [], n: score(auto) },
  ].sort((a, b) => b.n - a.n);

  if (process.env.ANSKEY_DEBUG) {
    console.error(
      "[anskey] 줄 " + lines.length +
      " · 블록 " + score(block.key) +
      " · 격자 " + score(grid.key) +
      " · 자동 " + score(auto) +
      " -> " + cands[0].how
    );
  }

  const use = cands[0];

  /*
   * 답지 마지막 항목이 뒤따르는 내용을 흡수하는 경우가 남는다.
   * 어떤 경계 규칙을 넣어도 시험지마다 형태가 달라 한 건씩 새어 나온다.
   * 정답은 늘 앞쪽에 온전히 있으므로, 뒤에 붙은 군더더기를 잘라낸다.
   *
   *   "c  2. How to prove the strength of ..."   -> "c"
   *   "9.3 ㎜  15. Which of the following ..."   -> "9.3 ㎜"
   *   "불합격 / 불합격 / #1"                      -> "불합격 / 불합격"
   */
  const trimTail = (s) => {
    let t = String(s);

    // 다음 문항 번호가 붙은 지점에서 자른다
    const q = /\s\d{1,2}\.\s+[A-Z가-힣]/.exec(t);
    if (q) t = t.slice(0, q.index);

    // 묶음 지시문이 붙은 지점
    const g = /\s\*\s*(The following|Questions|Refer)/i.exec(t);
    if (g) t = t.slice(0, g.index);

    // 끝에 매달린 각주 표시
    t = t.replace(/(\s*\/\s*)?[#*]\d+\s*$/, "");

    return t.trim();
  };

  // 각주 참조를 실제 내용으로 바꾸고 군더더기를 정리한다
  const key = {};
  for (const [no, ans] of Object.entries(use.key)) {
    const v = trimTail(resolveFootnote(ans, notes));
    if (String(v).trim() !== "") key[no] = String(v).trim();
  }

  return { key, how: use.how, warnings: use.warnings, footnotes: notes };
}
