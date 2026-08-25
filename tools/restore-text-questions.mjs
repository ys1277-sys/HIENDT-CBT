/*
 * 보류해 둔 서술형 문항을 주관식으로 되살린다.
 *
 * 앞서 이 문항들을 held/ 로 뺐다. 보기 2~4번이 비어 있어 객관식으로는
 * 낼 수 없고, 오답 보기를 지어내는 것은 종목 NDE Level Ⅲ 의 승인
 * 사항이라 손댈 수 없었기 때문이다.
 *
 * 그런데 원본이 애초에 서술형이고, 앱은 주관식을 이미 채점한다.
 *   src/grading.js  questionType() 이 options 가 없으면 TEXT 로 본다
 *   src/Quiz.jsx    TEXT 문항에는 입력란을 그린다
 *
 * 그러니 오답 보기를 지어낼 것이 아니라 원본대로 주관식으로 두면 된다.
 * 새로 짓는 것이 아니라 원본 꼴로 되돌리는 것이다.
 *
 * 쓰임 : node tools/restore-text-questions.mjs [--dry]
 */
import fs from "node:fs";

const DRY = process.argv.includes("--dry");

const JOBS = [
  ["held/Level III-MT.md", "public/data/Level III/MT.json", "MT"],
  ["held/Level III-RT.md", "public/data/Level III/RT.json", "RT"],
];

/* held 파일에서 문항을 읽는다 */
function readHeld(p) {
  const md = fs.readFileSync(p, "utf8");
  const out = [];
  for (const bl of md.split(/^### id /m).slice(1)) {
    const id = Number(bl.match(/^(\d+)/)?.[1]);
    const q = bl.match(/```\n([\s\S]*?)\n```/)?.[1];
    const ans = bl.match(/원본 정답 : `([^`]*)`/)?.[1];
    if (id && q && ans) out.push({ id, question: q.trim(), answer: ans.trim() });
  }
  return out;
}

let n = 0;
for (const [heldPath, bankPath, method] of JOBS) {
  if (!fs.existsSync(heldPath)) { console.log("  " + heldPath + " 없음"); continue; }
  const items = readHeld(heldPath);
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

  console.log("=".repeat(72));
  console.log(heldPath.split("/").pop() + "   " + items.length + "문항");

  const keep = [];
  for (const it of items) {
    if (bank.some((q) => q.id === it.id)) { console.log("  ! id" + it.id + " 이미 있다"); continue; }

    /*
     * 주관식 채점은 글자 그대로 맞아야 한다 (grading.js isCorrect).
     * 「Density and penetrameter image requirements / 농도와 투과도계 상…」
     * 같은 답은 맞게 알고도 그대로 칠 수가 없다. 그런 문항을 주관식으로
     * 내면 아는 사람이 틀린다. 짧고 분명한 답만 되살린다.
     */
    const a = it.answer;
    if (a.includes("/") || a.replace(/\s/g, "").length > 24) {
      console.log("  – id" + it.id + "  답이 길어 주관식으로 못 냄 : " + a.slice(0, 50));
      keep.push(it);
      continue;
    }
    bank.push({
      id: it.id,
      level: "Level III",
      method,
      category: "Method",
      question: it.question,
      /* 주관식은 보기를 두지 않는다. grading.js 가 options 없음을 TEXT 로 본다 */
      options: [],
      answer: it.answer,
      note: "원본이 서술형인 문항이다. 객관식으로 옮기며 보기 2~4번이 비어 " +
            "있던 것을, 원본대로 주관식으로 되돌렸다. 정답은 원본 답지 그대로다.",
    });
    console.log("  + id" + it.id + "  답 「" + it.answer + "」");
    console.log("       " + it.question.split("\n")[0].slice(0, 70));
    n++;
  }

  bank.sort((a, b) => a.id - b.id);
  if (!DRY) fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2) + "\n");

  /* 못 되살린 것만 남겨 보류 파일을 다시 쓴다 */
  if (DRY) continue;
  if (!keep.length) { fs.rmSync(heldPath); continue; }

  const md = [
    "# " + heldPath.split("/").pop().replace(".md", "") + " — 아직 낼 수 없는 문항", "",
    "원본이 서술형이다. 답이 여러 조각이라 주관식으로 내면 아는 사람도",
    "글자를 그대로 못 쳐서 틀린다. 두 갈래 가운데 하나를 골라야 한다.", "",
    "  가) 오답 보기 셋을 채워 객관식으로 낸다",
    "  나) 답을 한 조각으로 줄여 주관식으로 낸다  (보기 없이 답만 두면 된다)", "",
    "해당 종목 NDE Level Ⅲ 가 정해 승인한다. (HIE-QP-E02 6.1.2, 6.3.1)", "",
    "---", "",
  ];
  for (const it of keep) {
    md.push("### id " + it.id, "", "```", it.question, "```", "");
    md.push("원본 정답 : `" + it.answer + "`", "");
  }
  fs.writeFileSync(heldPath, md.join("\n"));
}


console.log("\n" + (DRY ? "[미리보기] " : "") + "되살린 주관식 " + n + "문항");
