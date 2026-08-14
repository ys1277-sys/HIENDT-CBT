/*
 * 한글이 이상한 곳을 찾는다.
 *
 * 원본을 옮기는 과정에서 생긴 자국을 짚는다.
 *   조사가 홀로 떨어짐        "2mil Strip 어로 된"
 *   낱말 사이가 붙음          "직경13mm인바가"
 *   영문 조각이 어색하게 끼임
 *   물음표 없이 끝나는 물음
 *   영문에 견줘 지나치게 짧음 (덜 옮긴 것)
 *
 * 사람이 봐야 할 목록을 만드는 도구다. 스스로 고치지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const HANGUL = /[가-힣]/;

const CHECKS = [
  ["조사가 홀로", /(^|\s)(어로|으로써|로써)\s/],
  ["따옴표·괄호 안 맞음", /\(([^)]*$)|^([^(]*\))/],
  ["물음표 빠짐", /(무엇인가|어느 것인가|얼마인가|하는가|은\?$)/],
  ["빈 괄호", /\(\s*\)/],
  ["점 두 개", /\.\./],
  ["쉼표 앞 공백", /\s,/],
  /* 물음표·마침표 앞 공백. "어떠한가 ?" 처럼 벌어진 것 */
  ["문장부호 앞 공백", /\s[?？.]\s*$/],
  /* 낱말 사이가 붙음. "직경13mm인바가" */
  ["숫자와 한글이 붙음", /[가-힣]\d|\d[가-힣]/],
];

let out = "";
let n = 0;

for (const f of walk(ROOT)) {
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);
  const rel = path.relative(ROOT, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const parts = [
      ["발문", String(q.question || "")],
      ...(q.options || []).map((o, i) => [`보기${i + 1}`, String(o)]),
    ];

    for (const [tag, t] of parts) {
      const lines = t.split("\n");

      /* 영문 줄과 한글 줄 */
      const en = lines.find((l) => !HANGUL.test(l) && /[A-Za-z]{3}/.test(l)) || "";
      const ko = lines.find((l) => HANGUL.test(l)) || "";
      if (!ko) continue;

      const why = [];

      for (const [name, re] of CHECKS) {
        if (name === "물음표 빠짐") {
          if (re.test(ko) && !/[?？]\s*$/.test(ko.trim())) why.push(name);
          continue;
        }
        if (re.test(ko)) why.push(name);
      }

      /* 영문이 긴데 한글이 너무 짧으면 덜 옮긴 것일 수 있다 */
      const enLen = en.replace(/[^A-Za-z]/g, "").length;
      const koLen = ko.replace(/[^가-힣]/g, "").length;
      if (enLen > 60 && koLen > 0 && koLen < enLen * 0.22) why.push("한글이 너무 짧음");

      if (!why.length) continue;

      n++;
      out += `\n${rel} id ${q.id} ${tag}  [${why.join(", ")}]\n`;
      if (en) out += `  영 ${en.trim().slice(0, 120)}\n`;
      out += `  한 ${ko.trim().slice(0, 120)}\n`;
    }
  }
}

fs.writeFileSync("ko-odd-out.txt", `이상해 보이는 곳 ${n}건\n` + out, "utf8");
console.log(`이상해 보이는 곳 ${n}건 -> ko-odd-out.txt`);
