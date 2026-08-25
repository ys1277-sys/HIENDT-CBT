/*
 * 보기의 영어·한국어 나누는 꼴을 「영어 줄바꿈 한국어」 하나로 맞춘다.
 *
 *   Accept 합격            → Accept\n합격
 *   Reject (불합격)        → Reject\n불합격
 *   …thickness\n (깊이가…)  → …thickness\n깊이가…
 *
 * 건드리지 않는 것
 *   - 괄호가 글 가운데 있는 것. lens(사물-렌즈 거리) 처럼 원래 그 자리에
 *     있어야 하는 설명이다.
 *   - 숫자만 있는 보기(1\n1개). 영어가 없을 뿐 꼴은 이미 맞다.
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const H = /[가-힣]/;

function fix(s) {
  let t = String(s);

  /* (C) 한국어 줄 전체가 괄호로 감싸인 것 */
  const lines = t.split("\n");
  if (lines.length === 2) {
    const k = lines[1].trim();
    const m = k.match(/^\((.+)\)$/s);
    if (m && !m[1].includes("(") && !m[1].includes(")"))
      return lines[0].trimEnd() + "\n" + m[1].trim();
  }

  if (t.includes("\n")) return t;

  /*
   * 공식은 건드리지 않는다. 「f : focal length of the lens(렌즈의 초점길이)」
   * 의 괄호는 보기 전체의 번역이 아니라 기호 하나를 풀어 준 것이다.
   * 줄을 바꾸면 보기 전체의 번역처럼 읽혀 뜻이 달라진다.
   */
  if (/=/.test(t)) return t;

  /* (B) 끝에 붙은 (한국어). 그 앞은 한국어가 없어야 한다 */
  const b = t.match(/^([^가-힣]+?)\s*\(([^()]*[가-힣][^()]*)\)\s*$/);
  if (b) return b[1].trim() + "\n" + b[2].trim();

  /* (A) 한 줄에 「영어 한국어」 */
  if (!H.test(t)) return t;
  const i = t.search(H);
  const en = t.slice(0, i).trim();
  const ko = t.slice(i).trim();
  /* 영어가 있어야 하고, 영어 쪽에 괄호가 열린 채 끝나면 안 된다 */
  if (!en || !/[A-Za-z]/.test(en)) return t;
  if ((en.match(/\(/g) || []).length !== (en.match(/\)/g) || []).length) return t;
  return en + "\n" + ko;
}

let n = 0;
for (const [name, r] of [["LII/G", "public/data/Level II/General"],
                         ["LII/S", "public/data/Level II/Specific"],
                         ["LIII", "public/data/Level III"]]) {
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json"))) {
    const p = path.join(r, f);
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    let touched = false;

    for (const q of j) {
      (q.options || []).forEach((o, i) => {
        const a = String(o), b = fix(o);
        if (a === b) return;
        console.log((name + "/" + f.replace(".json", "") + " id" + q.id + " 보기" + (i + 1)).padEnd(28));
        console.log("    전 : " + JSON.stringify(a));
        console.log("    후 : " + JSON.stringify(b));
        q.options[i] = b; touched = true; n++;
      });
    }
    if (touched && !DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  }
}
console.log("\n" + (DRY ? "[미리보기] " : "") + "고칠 보기 " + n + "개");
