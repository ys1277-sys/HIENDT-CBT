/*
 * 문제은행 24개의 꼴을 하나로 맞춘다.
 *
 * 그동안 파일마다 다른 꼴로 쌓였다.
 *   - 한국어를 question 안 줄바꿈 뒤에 두기도 하고 question_kr·korean
 *     이라는 따로 필드에 두기도 했다. 211개는 두 곳에 똑같이 들어 있다.
 *   - level·method·category 가 아예 없는 파일이 있고, 일부 문항에만
 *     있는 파일도 있다. 파일이 놓인 자리가 이미 답을 말해 주는데도
 *     문항마다 따로 적어 두어 어긋날 여지를 남겼다.
 *   - category 에 "SPECIFIC"(대문자)이 126개, 시험 구분이 아니라
 *     주제(ASME Sec.VIII 따위)가 들어간 것이 10개 있다.
 *   - Level III/PT 는 category 와 subject 가 서로 바뀌어 있다.
 *
 * 맞추는 꼴
 *   id, level, method, category, topic?, source?, question, options,
 *   answer, groupNote?, image?, note?, question_original?
 *
 * question·options·answer 는 건드리지 않는다. 문제 내용은 그대로 둔다.
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

const JOBS = [
  ["Level II", "General",  "public/data/Level II/General"],
  ["Level II", "Specific", "public/data/Level II/Specific"],
  ["Level III", null,      "public/data/Level III"],
];

/* 내놓을 차례 */
const ORDER = ["id","level","method","category","topic","source","question",
  "options","answer","groupNote","image","note","question_original"];

const isDivision = (v) => /^(General|Specific|Basic|Method)$/i.test(String(v || ""));

let total = 0, changed = 0;
const log = [];

for (const [level, div, dir] of JOBS) {
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const p = path.join(dir, f);
    const method = f.replace(".json", "");
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const list = raw.flat(Infinity);

    /* 시험 구분은 파일이 놓인 자리가 정한다 */
    const category = level === "Level III"
      ? (method === "Basic" ? "Basic" : "Method")
      : div;

    const tally = { ko: 0, topic: 0, meta: 0, drop: 0, note: 0 };

    const out = list.map((q) => {
      const n = {};
      n.id = q.id;
      n.level = level;
      n.method = level === "Level III" && method === "Basic" ? "Basic" : method;
      n.category = category;

      if (q.level !== level || q.method === undefined || q.category !== category) tally.meta++;

      /* 주제 — subject 나, 시험 구분이 아닌 값이 들어간 category 에서 건진다 */
      let topic = null;
      if (q.subject !== undefined && !isDivision(q.subject)) topic = q.subject;
      if (q.category !== undefined && !isDivision(q.category)) topic = q.category;
      if (topic) { n.topic = String(topic).trim(); tally.topic++; }

      if (q.source !== undefined && String(q.source).trim()) n.source = q.source;

      n.question = q.question;
      n.options = q.options;
      n.answer = q.answer;

      if (q.groupNote !== undefined && String(q.groupNote).trim()) n.groupNote = q.groupNote;
      if (q.image !== undefined) n.image = q.image;

      /* 내용이 있는 explanation 만 note 로 살린다 */
      if (q.explanation !== undefined && String(q.explanation).trim()) {
        n.note = String(q.explanation).trim(); tally.note++;
      }
      if (q.question_original !== undefined) n.question_original = q.question_original;

      /* 버리는 것 */
      if (q.question_kr !== undefined || q.korean !== undefined) tally.ko++;
      for (const k of Object.keys(q)) if (!(k in n) &&
        !["subject","category","level","method","source","explanation",
          "question_kr","korean","type"].includes(k))
        tally.drop++, console.error("  ! 모르는 필드 " + k + " — " + p + " id" + q.id);

      /* 차례를 맞춰 다시 담는다 */
      const o = {};
      for (const k of ORDER) if (n[k] !== undefined) o[k] = n[k];
      return o;
    });

    total += out.length;
    const before = JSON.stringify(raw);
    const after = JSON.stringify(out);
    if (before !== after) changed++;

    log.push([ (level + "/" + (div || "") + "/" + method).replace("//", "/"),
      out.length, tally ]);

    if (!DRY) fs.writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
  }
}

console.log((DRY ? "[미리보기] " : "") + "파일 24개 / 문항 " + total + "개\n");
console.log("파일".padEnd(28) + "문항".padStart(5) + "  한국어중복버림  주제살림  메타보정  note살림");
for (const [name, n, t] of log)
  console.log(name.padEnd(28) + String(n).padStart(5) +
    String(t.ko).padStart(14) + String(t.topic).padStart(10) +
    String(t.meta).padStart(10) + String(t.note).padStart(9));
console.log("\n손댄 파일 " + changed + "개");
