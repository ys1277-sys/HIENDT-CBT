/*
 * 보기가 넷인 복수정답 문항을 조합형 단일정답으로 바꾼다.
 *
 * 넷 가운데 셋이 정답인 문항이 셋 있었다. 찍어도 상당히 맞는다.
 * 항목을 묶으면 조합이 넷이 되어 단일정답 문항이 된다.
 *
 *   원본  ▶1 a  ▶2 b  ▶3 c   4 d      (정답 a·b·c)
 *   바꾼 뒤  ① a·b·c  ② a·b·d  ③ a·c·d  ④ b·c·d
 *
 * 정답 조합은 원본 정답 그대로다. 오답 조합은 원본에서 오답인 항목을
 * 반드시 하나 이상 품는다. 네 보기의 항목 수는 모두 같다.
 *
 * ★ 오답 조합은 내가 지은 것이다. 해당 종목 NDE Level Ⅲ 의 확인이 필요하다
 *   (HIE-QP-E02 6.1.2, 6.3.1).
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

const BANKS = [
  ["일반", "public/data/Level II/General"],
  ["전문", "public/data/Level II/Specific"],
  ["LIII", "public/data/Level III"],
];

/* n개짜리 조합을 모두 만든다 */
function combos(list, n) {
  if (n === 0) return [[]];
  if (list.length < n) return [];
  const [head, ...rest] = list;
  return [...combos(rest, n - 1).map((c) => [head, ...c]), ...combos(rest, n)];
}

const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

let n = 0;

for (const [b, dir] of BANKS) {
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const p = path.join(dir, f);
    const bank = JSON.parse(fs.readFileSync(p, "utf8"));
    let touched = false;

    for (const q of bank) {
      if (!Array.isArray(q.answer)) continue;
      const opts = (q.options || []).map(String);
      if (opts.length !== 4) continue;

      /*
       * 「위의 모두」「위의 어느 것도 아님」이 든 문항은 묶지 않는다.
       * 「Index point · None of the above」 같은 말이 안 되는 보기가 나온다.
       * 이런 문항은 보기가 이미 넷이고 2/4 정답이라 그대로 두어도 된다.
       */
      if (opts.some((o) => /(none|all|both|either)\s+of\s+the\s+above|위의?\s*(모두|어느)/i.test(o))) {
        console.log("– " + b + "/" + f.replace(".json", "") + " id" + q.id +
          "  「위의 모두/어느 것도 아님」이 있어 묶지 않음. 보기 넷 그대로 둔다");
        continue;
      }

      const want = [...q.answer].sort((x, y) => x - y);
      const idx = [0, 1, 2, 3];

      /* 정답 조합을 먼저, 그다음 오답인 항목을 품은 조합들 */
      const all = combos(idx, want.length);
      const wrong = all.filter((c) => !eq(c, want) && c.some((i) => !want.includes(i)));
      if (wrong.length < 3) { console.error("  ! 오답 조합이 모자라다 " + q.id); continue; }

      /* 정답 자리를 문항마다 달리 둔다 */
      const at = q.id % 4;
      const picked = [];
      const w = wrong.slice(0, 3);
      for (let i = 0, k = 0; i < 4; i++) picked.push(i === at ? want : w[k++]);

      const en = (i) => opts[i].split("\n")[0].trim();
      const ko = (i) => (opts[i].split("\n")[1] || "").trim();
      const hasKo = idx.every((i) => ko(i));

      const before = opts.map((o) => o.split("\n")[0].slice(0, 30));

      q.options = picked.map((c) =>
        hasKo ? c.map(en).join(" · ") + "\n" + c.map(ko).join(" · ")
              : c.map(en).join(" · "));
      q.answer = at;
      q.note = (q.note ? q.note + " " : "") +
        "넷 가운데 " + want.length + "개가 정답인 복수정답 문항이라 찍어도 맞을 확률이 높았다. " +
        "항목을 묶어 조합형 단일정답으로 바꿨다. 정답 조합은 원본 정답 그대로다. " +
        "★ 오답 조합은 해당 종목 NDE Level Ⅲ 의 확인이 필요하다 (HIE-QP-E02 6.1.2, 6.3.1).";

      console.log("■ " + b + "/" + f.replace(".json", "") + " id" + q.id +
        "  항목 " + want.length + "개씩  정답 " + "①②③④"[at]);
      picked.forEach((c, i) =>
        console.log("   " + (i === at ? "▶" : " ") + "①②③④"[i] + " " +
          c.map((j) => before[j]).join(" · ").slice(0, 74)));

      touched = true; n++;
    }

    if (touched && !DRY) fs.writeFileSync(p, JSON.stringify(bank, null, 2) + "\n");
  }
}

console.log("\n" + (DRY ? "[미리보기] " : "") + "바꾼 문항 " + n + "개");
