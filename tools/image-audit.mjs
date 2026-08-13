/*
 * 규칙 7 점검 — 그림을 참조하는 문항에 실제로 그림이 붙어 있는가.
 *
 *   A. 본문이 그림을 가리키는데 image/images 가 없는 문항
 *   B. image 는 있는데 파일이 실제로 없는 문항
 *   C. 어디에서도 쓰지 않는 이미지 파일
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const IMG = path.join(PUB, "images");

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

/*
 * 본문이 "특정 그림" 을 가리키는 말만 잡는다.
 * "방사선 사진", "투과사진" 은 촬영 결과물을 뜻하는 일반 용어라
 * 그냥 "사진" 을 넣으면 그런 것까지 걸린다.
 */
const REFS = new RegExp(
  [
    "그림\\s*\\d",                 // 그림 1
    "다음\\s*그림",                // 다음 그림에서
    "위\\s*그림",
    "아래\\s*그림",
    "그림에서",
    "\\bin\\s+fig\\b",             // In Fig, H represents
    "\\bfig(ure)?\\.?\\s*\\d",     // Figure 1 / Fig. 2
    "shown\\s+in\\s+(the\\s+)?fig",
    "following\\s+(picture|figure|sketch|image)",
    "picture\\s+below",
    "shown\\s+below",
  ].join("|"),
  "i"
);

const onDisk = new Set(fs.existsSync(IMG) ? fs.readdirSync(IMG) : []);
const used = new Set();

let A = [], B = [];

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    const list = []
      .concat(q.image ? [q.image] : [])
      .concat(Array.isArray(q.images) ? q.images : []);
    list.forEach((n) => {
      used.add(n);
      if (!onDisk.has(n)) B.push(`${rel} id ${q.id}: ${n}`);
    });

    const t = `${q.question || ""} ${q.groupNote || ""}`;
    if (!list.length && REFS.test(t)) {
      A.push(`${rel} id ${q.id}: ${String(q.question).replace(/\s+/g, " ").slice(0, 92)}`);
    }
  }
}

const C = [...onDisk].filter((n) => !used.has(n));

let log = "";
log += `A. 그림을 가리키는데 이미지가 없는 문항  ${A.length}건\n` + A.map((s) => "   " + s).join("\n") + "\n\n";
log += `B. 이미지 파일이 실제로 없는 문항        ${B.length}건\n` + B.map((s) => "   " + s).join("\n") + "\n\n";
log += `C. 아무 문항도 쓰지 않는 이미지 파일     ${C.length}개\n` + C.map((s) => "   " + s).join("\n") + "\n";
log += `\n이미지 파일 ${onDisk.size}개 중 사용 중 ${used.size}개\n`;

fs.writeFileSync("image-audit-out.txt", log, "utf8");
console.log(log.slice(0, 6000));
