/*
 * 보기가 채워지지 않은 문항을 갈라낸다.
 *
 * 원본 시험지의 서술형 문제를 객관식으로 옮기면서 보기 2~4번이 빈 채로
 * 남았다. 화면에는 빈 동그라미가 뜨고, 고를 것이 하나뿐이라 응시자가
 * 그냥 맞힌다.
 *
 *  - 보기가 2개 살아 있는 것(Yes/No, Accept/Reject) : 빈 칸만 떼고
 *    한국어를 붙여 은행에 남긴다. 원래 두 갈래 문제다.
 *  - 보기가 1개뿐인 것 : 오답 보기를 지어낼 수 없다. HIE-QP-E02 6.1.2 와
 *    6.3.1 은 문항 등록·수정을 해당 종목 NDE Level Ⅲ 의 승인 사항으로
 *    정한다. held/ 로 빼 두고 Level Ⅲ 가 보기를 채우면 되돌린다.
 *    (E02 6.3.2 — 필요하면 문항을 고치거나 은행에서 제외한다)
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

/* 두 갈래 문제의 한국어 */
const KO = { Yes: "예", No: "아니오", Accept: "합격", Reject: "불합격" };

const held = {};
let kept = 0, out = 0;

for (const r of ["public/data/Level II/General", "public/data/Level II/Specific", "public/data/Level III"]) {
  for (const f of fs.readdirSync(r).filter((x) => x.endsWith(".json"))) {
    const p = r + "/" + f;
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const keep = [];
    let touched = false;

    for (const q of j) {
      const real = (q.options || []).filter((o) => String(o).trim());
      if (real.length === (q.options || []).length) { keep.push(q); continue; }

      if (real.length >= 2) {
        /* 빈 칸을 떼고 한국어를 붙인다 */
        q.options = real.map((o) => {
          const t = String(o).trim();
          return (!t.includes("\n") && KO[t]) ? t + "\n" + KO[t] : t;
        });
        console.log("남김  " + p.split("/").slice(-2).join("/") + " id" + q.id +
          "  보기 " + JSON.stringify(q.options.map((o) => o.replace("\n", "/"))));
        keep.push(q); kept++; touched = true;
      } else {
        const name = r.split("/").slice(2).join("-") + "-" + f.replace(".json", "");
        (held[name] ??= []).push(q);
        console.log("보류  " + p.split("/").slice(-2).join("/") + " id" + q.id +
          "  " + String(q.question).split("\n")[0].slice(0, 66));
        out++; touched = true;
      }
    }
    if (touched && !DRY) fs.writeFileSync(p, JSON.stringify(keep, null, 2) + "\n");
  }
}

/* 보류한 문항을 검수하기 좋게 적어 둔다 */
for (const [name, list] of Object.entries(held)) {
  const md = [
    "# " + name + " — 보기가 채워지지 않은 문항",
    "",
    "원본 시험지의 서술형 문제를 객관식으로 옮기면서 정답만 남고 오답 보기가",
    "비어 있다. 해당 종목 NDE Level Ⅲ 가 오답 보기를 채워 승인하면",
    "(HIE-QP-E02 6.1.2, 6.3.1) 문제은행으로 되돌린다.",
    "",
    "되돌릴 때 지켜야 할 꼴 — 보기는 「영어 줄바꿈 한국어」",
    "",
    "---",
    "",
  ];
  for (const q of list) {
    md.push("### id " + q.id + (q.source ? "  (" + q.source + ")" : ""));
    md.push("");
    md.push("```");
    md.push(String(q.question));
    md.push("```");
    md.push("");
    md.push("원본 정답 : `" + String(q.options[q.answer]).replace(/\n/g, " / ") + "`");
    md.push("");
    md.push("| 보기 | 채울 내용 |");
    md.push("|:-:|---|");
    md.push("| 1 | " + String(q.options[q.answer]).replace(/\n/g, " / ") + "  ← 정답 |");
    md.push("| 2 | |");
    md.push("| 3 | |");
    md.push("| 4 | |");
    md.push("");
  }
  if (!DRY) fs.writeFileSync("held/" + name + ".md", md.join("\n"));
  console.log("\nheld/" + name + ".md — " + list.length + "문항");
}

console.log("\n" + (DRY ? "[미리보기] " : "") + "은행에 남긴 것 " + kept + " / 보류로 뺀 것 " + out);
