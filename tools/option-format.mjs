/*
 * 보기(options)가 영어와 한국어를 담는 꼴을 본다.
 *
 * 화면에서 이런 것이 나왔다.
 *   ① True\n맞다        ← 줄바꿈으로 나눔
 *   ② False (틀리다)    ← 괄호로 감쌈
 * 한 문항 안에서도 꼴이 갈린다.
 */
import fs from "node:fs";
import path from "node:path";

const HANGUL = /[가-힣]/;

const kind = (s) => {
  const t = String(s);
  if (!HANGUL.test(t)) return "영어만";
  if (!/[A-Za-z]/.test(t)) return "한국어만";
  if (t.includes("\n")) return "줄바꿈";
  if (/\([^)]*[가-힣][^)]*\)\s*$/.test(t)) return "괄호";
  return "한 줄에 섞임";
};

const tally = new Map();
const mixed = [];

for (const [n, r] of [["LII/G", "public/data/Level II/General"],
                      ["LII/S", "public/data/Level II/Specific"],
                      ["LIII", "public/data/Level III"]]) {
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(r, f), "utf8"));
    for (const q of j) {
      const ks = (q.options || []).map(kind);
      for (const k of ks) tally.set(k, (tally.get(k) || 0) + 1);

      /* 한 문항 안에서 꼴이 갈리는가 (영어만 은 빼고 센다) */
      const real = [...new Set(ks.filter((k) => k !== "영어만"))];
      if (real.length > 1)
        mixed.push([n + "/" + f.replace(".json", ""), q.id, real.join(" + "),
          (q.options || []).map((o) => String(o).replace(/\n/g, "⏎")).join("  |  ").slice(0, 110)]);
    }
  }
}

console.log("보기 한 개씩 세어 본 꼴");
[...tally].sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log("  " + k.padEnd(12) + String(v).padStart(6)));

console.log("\n한 문항 안에서 꼴이 갈리는 문항 : " + mixed.length + "개");
mixed.slice(0, 25).forEach(([f, id, k, s]) =>
  console.log("  " + (f + " id" + id).padEnd(26) + k + "\n      " + s));
if (mixed.length > 25) console.log("  … 외 " + (mixed.length - 25));
