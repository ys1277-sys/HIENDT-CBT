/*
 * 줄이 바뀌는 자리에서 조사가 떨어진 곳을 찾는다.
 *
 * 앞서 조사 붙이기는 한 줄씩만 봤다. 그래서
 *   … 해당 종목 NDE Level Ⅲ
 *   가 직접 풀어 정답을 확인 …
 * 처럼 줄이 바뀌며 갈라진 것은 못 잡았다. Word 로 옮길 때 두 줄을 빈칸
 * 하나로 이어 붙이므로 "Ⅲ 가" 가 되어 버린다.
 */
import fs from "node:fs";

const JOSA =
  "은|는|이|가|을|를|와|과|의|에게|에서|에|으로|로|부터|까지|보다|만|도";

const HEAD = /[A-Za-z0-9\)\]%ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ*]$/;
const START = new RegExp("^(" + JOSA + ")(?=[\\s가-힣])");

let total = 0;

for (const f of process.argv.slice(2)) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const hits = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    const b = lines[i + 1];

    if (!a.trim() || !b.trim()) continue;
    /* 표·제목·코드는 건너뛴다 */
    if (/^\s*[|#>`]/.test(a) || /^\s*[|#>`]/.test(b)) continue;

    if (!HEAD.test(a.trimEnd())) continue;
    const m = b.match(START);
    if (!m) continue;

    hits.push([i + 1, a.trimEnd().slice(-30), m[1], b.trim().slice(0, 40)]);
  }

  console.log("=".repeat(74));
  console.log(f.split("/").pop() + "  —  " + hits.length + "군데");

  for (const [ln, tail, josa, head] of hits) {
    console.log("  " + String(ln).padStart(4) + "줄  …" + tail);
    console.log("        " + String(ln + 1).padStart(4) + "줄  " + head);
    console.log("        → 이어 붙이면 「" + tail.slice(-6) + " " + josa + "」");
  }

  total += hits.length;
  console.log();
}

console.log(total ? "살펴볼 곳 " + total + "군데" : "줄이 바뀌며 갈라진 조사 없음");
