/*
 * 조사가 앞말에서 떨어진 곳을 찾는다.
 *
 * 조사는 앞말에 붙여 쓴다. 앞말이 로마자든 숫자든 마찬가지다.
 *   TOFD·PAUT·FMC 는  →  TOFD·PAUT·FMC는
 *   UT Level Ⅱ 가     →  UT Level Ⅱ가
 *
 * 상위 절차서 E01 도 「Level III에」 「LevelⅢ는」 처럼 붙여 쓴다.
 *
 * 쓰임 : node tools/josa-check.mjs [--fix] <파일.md> …
 */
import fs from "node:fs";

const JOSA = ["은", "는", "이", "가", "을", "를", "와", "과", "의",
              "에게", "에서", "에", "으로", "로", "부터", "까지",
              "보다", "만", "도", "이나", "나", "이며", "며"];

/* 앞말이 이런 글자로 끝날 때만 본다. 한글 뒤 띄어쓰기는 건드리지 않는다 */
const HEAD = "A-Za-z0-9ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ\\)\\]%°℃℉";

const RE = new RegExp(
  "([" + HEAD + "]) (" + JOSA.join("|") + ")(?=[\\s,.·)\\]」』]|$)", "g");

const FIX = process.argv.includes("--fix");
const files = process.argv.slice(2).filter((x) => !x.startsWith("--"));

let total = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  let n = 0;

  const out = lines.map((l, i) => {
    /* 코드 덩이와 표 구분선은 건드리지 않는다 */
    if (/^\s*```/.test(l) || /^\s*\|[\s:|-]+\|\s*$/.test(l)) return l;

    /*
     * ★ 「1.1 이 규칙은」의 「이」는 조사가 아니라 관형사다.
     *   붙이면 「1.1이 규칙은」이 되어 문장이 망가진다.
     *   예전에 이걸로 문장 여섯 개를 망가뜨린 적이 있다.
     *   조항 번호 바로 뒤의 빈칸은 건드리지 않는다.
     */
    const num = l.match(/^\s*(\d{1,2}(?:\.\d{1,2}){0,2})\s/);
    const numGap = num ? num[0].length - 1 : -1;

    RE.lastIndex = 0;
    const hits = [...l.matchAll(RE)].filter((m) => m.index + 1 !== numGap);
    if (!hits.length) return l;

    for (const m of hits) {
      n++; total++;
      console.log("  " + f.split("/").pop().slice(0, 12) + " " + String(i + 1).padStart(4) +
        "줄  「" + m[1] + " " + m[2] + "」 → 「" + m[1] + m[2] + "」");
      console.log("        " + l.trim().slice(0, 80));
    }
    /* 고칠 때도 조항 번호 뒤는 건드리지 않는다 */
    let out2 = l, shift = 0;
    for (const m of hits) {
      const at = m.index + 1 - shift;
      out2 = out2.slice(0, at) + out2.slice(at + 1);
      shift++;
    }
    return out2;
  });

  if (n && FIX) fs.writeFileSync(f, out.join("\n"));
  console.log("  " + f.split("/").pop() + "  " + n + "군데" + (n && FIX ? "  → 고침" : ""));
}
console.log("\n" + (total ? "떨어진 조사 " + total + "군데" : "떨어진 조사 없음"));
