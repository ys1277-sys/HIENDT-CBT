/*
 * 같은 은행 안에 두 번 들어간 문제를 하나로 합친다.
 *
 * 원본 시험지가 A형·B형 둘로 나뉘어 있었는데 한 은행으로 합치면서
 * 같은 문제가 두 번 들어갔다. 은행 하나에서 뽑으므로 한 회차에 같은
 * 문제가 두 번 나올 수 있다.
 *
 * 남길 쪽은 A형을 원칙으로 하되, A형이 깨진 것은 B형을 남긴다.
 * 지운 쪽의 출처는 남는 쪽에 합쳐 적어 어느 시험지에서 왔는지 잃지 않는다.
 */
import fs from "node:fs";

const DRY = process.argv.includes("--dry");

/* [파일, 남길 id, 지울 id, 까닭] */
const JOBS = [
  ["public/data/Level II/General/MT.json", 29, 40,
   "id40 은 보기 5번이 「P L.F」— 원본을 옮기다 깨진 글자다"],
  ["public/data/Level II/Specific/TOFD.json", 8, 30, "A형을 남긴다"],
  ["public/data/Level II/Specific/MT.json", 8, 19, "A형을 남긴다"],
  ["public/data/Level II/Specific/PAUT.json", 7, 24, "A형을 남긴다"],
  ["public/data/Level II/Specific/PAUT.json", 9, 23, "A형을 남긴다"],
  ["public/data/Level II/Specific/UT.json", 3, 20, "A형을 남긴다"],
  ["public/data/Level II/Specific/UT.json", 19, 18,
   "이것만 거꾸로다. A형인 id18 의 보기 3번이 「20% C. none of the above」로 " +
   "두 보기가 붙어 버렸다. 멀쩡한 B형을 남긴다"],
];

const byFile = new Map();
for (const j of JOBS) {
  if (!byFile.has(j[0])) byFile.set(j[0], []);
  byFile.get(j[0]).push(j);
}

for (const [p, jobs] of byFile) {
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const before = j.length;
  const drop = new Set();

  for (const [, keep, kill, why] of jobs) {
    const a = j.find((q) => q.id === keep);
    const b = j.find((q) => q.id === kill);
    if (!a || !b) { console.error("  ! 못 찾음 " + p + " " + keep + "/" + kill); continue; }

    console.log(p.split("/").slice(-2).join("/") + "  id" + kill + " → id" + keep);
    console.log("    " + String(a.question).split("\n")[0].slice(0, 74));
    console.log("    까닭 : " + why);

    /* 출처를 합쳐 둔다 */
    const src = [a.source, b.source].filter(Boolean);
    if (src.length === 2 && src[0] !== src[1]) {
      a.source = src.join(" / ");
      console.log("    출처 : " + a.source);
    }
    drop.add(kill);
  }

  const out = j.filter((q) => !drop.has(q.id));
  console.log("    " + before + " → " + out.length + "문항\n");
  if (!DRY) fs.writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
}
console.log(DRY ? "[미리보기]" : "합쳤다");
