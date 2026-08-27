/*
 * 보기 섞기가 채점을 어긋내지 않는지 본다.
 *
 *   node tools/shuffle-test.mjs
 *
 * 보는 것
 *   1. 섞기 전 정답 보기의 글과 섞은 뒤 정답 보기의 글이 같은가
 *   2. 자리를 지켜야 하는 보기가 제자리에 남았는가
 *   3. 보기의 모임이 그대로인가 (잃거나 겹치지 않았는가)
 *   4. 은행 24개 · 문항마다 200번 섞어도 한 번도 안 어긋나는가
 *
 * src/optionShuffle.js 를 그대로 들여와 잰다. 규칙이 두 군데로 갈리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

import { shuffleOptions, isLocked, callsByNumber } from "../src/optionShuffle.js";

/* ── 은행을 읽는다 ─────────────────────────── */
const ROOT = "public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /images|procedures|held/.test(e.name) ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const ROUNDS = 200;
let banks = 0, items = 0, runs = 0;
let moved = 0, still = 0, frozen = 0;
const fail = [];

for (const f of walk(ROOT)) {
  let list;
  try { list = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  if (!Array.isArray(list)) continue;

  banks++;
  const rel = path.relative(ROOT, f).split(path.sep).join("/").replace(".json", "");

  for (const q of list) {
    if (!Array.isArray(q.options) || q.options.length < 2) continue;
    items++;

    /* 섞기 전 정답의 글 */
    /*
     * 정답이 가리키는 보기의 「글 모임」을 견준다.
     *
     * 번호 차례로 늘어놓고 견주면 안 된다. 복수정답 [0,1] 이 섞여
     * [1,2] 가 되면 두 글의 앞뒤가 바뀌어 있을 수 있다. 가리키는
     * 보기가 같으면 채점은 같다.
     */
    const wantText = Array.isArray(q.answer)
      ? [...q.answer].map((i) => q.options[i]).sort()
      : Number.isInteger(q.answer) ? [q.options[q.answer]] : null;

    const lockedAt = q.options.map((o, i) => (isLocked(o) ? i : -1)).filter((i) => i >= 0);
    const bagBefore = [...q.options].sort().join("\u0000");

    let changedOnce = false;

    for (let r = 0; r < ROUNDS; r++) {
      const s = shuffleOptions(q);
      runs++;

      /* 1. 정답이 같은 보기를 가리키는가 */
      if (wantText) {
        const gotText = Array.isArray(s.answer)
          ? [...s.answer].map((i) => s.options[i]).sort()
          : [s.options[s.answer]];

        if (gotText.join("\u0000") !== wantText.join("\u0000")) {
          fail.push(`${rel} id${q.id} — 정답이 다른 보기를 가리킨다`);
          break;
        }
      }

      /* 2. 자리를 지켜야 하는 보기가 그대로인가 */
      for (const i of lockedAt) {
        if (s.options[i] !== q.options[i]) {
          fail.push(`${rel} id${q.id} — 자리를 지켜야 할 보기 ${i + 1}번이 움직였다`);
          break;
        }
      }

      /* 3. 보기 모임이 그대로인가 */
      if ([...s.options].sort().join("\u0000") !== bagBefore) {
        fail.push(`${rel} id${q.id} — 보기가 바뀌거나 사라졌다`);
        break;
      }

      if (s.options.join("\u0000") !== q.options.join("\u0000")) changedOnce = true;
    }

    /* 4. 번호로 다른 보기를 부르는 문항은 한 번도 안 움직여야 한다 */
    if (callsByNumber(q.options)) {
      if (changedOnce) fail.push(`${rel} id${q.id} — 번호로 보기를 부르는 문항인데 섞였다`);
      frozen++;
    }
    else if (changedOnce) moved++;
    else still++;
  }
}

console.log(`은행 ${banks}개 · 보기가 있는 문항 ${items}개 · 섞어 본 횟수 ${runs}회`);
console.log(`${ROUNDS}번 안에 자리가 바뀐 문항 ${moved}개 · 한 번도 안 바뀐 문항 ${still}개`);
console.log(`번호로 보기를 부르는 문항이라 아예 안 섞은 것 ${frozen}개`);
console.log("");

if (fail.length) {
  console.log(`★ 어긋난 곳 ${fail.length}건`);
  for (const f of [...new Set(fail)].slice(0, 20)) console.log("   " + f);
  process.exit(1);
}
console.log("어긋난 곳 없음 — 보기를 섞어도 채점이 그대로다");
