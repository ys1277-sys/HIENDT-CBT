/*
 * 선택지 한글이 옆 칸과 섞인 것을 찾는다.
 *
 * 원본 시험지가 2단 편집이라(a·b는 왼쪽, c·d는 오른쪽) 파서가 짝을 잘못 맞춰
 * 앞 보기의 한글까지 뒤 보기 한 칸에 들어간 경우가 있다.
 *
 *   ② Only required in ASME Code Case 2235-10
 *      이 절차서에 요구되지 않는다. 오직 ASME Code Case 2235-10에 요구된다.
 *        ^^^^^^^^^^^^^^^^^^^^^^ 이건 ① 의 한글이다
 *
 * 판정: "한 줄 안에" 영어 낱말과 한글이 함께 들어 있으면 의심한다.
 *
 * 줄 단위로 봐야 한다. 긴 보기는 영문이 2~3줄, 한글이 그 뒤 줄에 오는 게
 * 정상인데, 줄을 합쳐서 길이만 비교하면 그것까지 잘못 잡는다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" || e.name === "procedures" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

/* 한 줄 안에 두 글자 이상 영어 낱말이 이만큼 있으면서 한글도 있으면 의심 */
const EN_WORDS = 3;

let n = 0, log = "";
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    (q.options || []).forEach((o, i) => {
      const lines = String(o).split("\n").map((l) => l.trim()).filter(Boolean);
      const bad = lines.filter((l) =>
        /[가-힣]/.test(l) && (l.match(/[A-Za-z]{2,}/g) || []).length >= EN_WORDS);
      if (!bad.length) return;
      n += bad.length;
      log += `${rel} id ${q.id} 선택지${i + 1}\n`;
      bad.forEach((l) => (log += `   ${l.slice(0, 110)}\n`));
    });
  }
}

log = `한글이 옆 칸과 섞인 것으로 의심되는 선택지 ${n}건\n\n` + log;
fs.writeFileSync("ko-merged-out.txt", log, "utf8");
console.log(log.slice(0, 7000));
