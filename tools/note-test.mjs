/* 과목마다 갑지 NOTE 가 원본 갈래대로 나오는지 본다 */
import fs from "node:fs";
import path from "node:path";
import { examNote } from "../src/examNote.js";

const PUB = "public/data";
const SEP = String.fromCharCode(92);

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    }
    return p.endsWith(".json") ? [p] : [];
  });

const seen = new Map();
let bad = 0;

for (const f of walk(PUB)) {
  const rel = path.relative(PUB, f).split(SEP).join("/").replace(".json", "");
  const bits = rel.split("/");
  const level = bits[0];
  const method = bits[bits.length - 1];
  const subject = bits.length === 3 ? bits[1] : "";

  const note = examNote(level, method, subject);
  const sig =
    note.items.map((x) => x.ko).join(" / ") + (note.footer ? " + 단서" : "");

  if (!seen.has(sig)) seen.set(sig, []);
  seen.get(sig).push(rel);

  /* 3번은 어느 갈래든 새 문장이어야 한다 */
  if (note.items[2].ko !== "시험지 출력 후 시험을 보는 경우 답변은 볼펜 또는 잉크로 기록할 것") {
    console.log("3번이 다름 :", rel);
    bad++;
  }
  /* 조건 없이 잉크만 말하던 옛 문장이 남아 있으면 안 된다 */
  if (note.items.some((x) => x.ko === "답변은 볼펜 또는 잉크로 기록할 것")) {
    console.log("옛 3번 남음 :", rel);
    bad++;
  }
}

console.log("갈래", seen.size, "가지\n");
let n = 0;
for (const [sig, list] of [...seen.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log("─".repeat(70));
  console.log(`[${String.fromCharCode(64 + ++n)}] ${list.length}과목 : ${list.join(", ")}`);
  sig.split(" / ").forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
}

console.log("\n" + (bad === 0 ? "전체 통과" : bad + "건 어긋남"));
