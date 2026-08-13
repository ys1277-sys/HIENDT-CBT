/*
 * 선택지 꼬리에 흘러든 답지표·후속문항을 잘라낸다.
 *
 * 파서가 마지막 선택지에서 멈추지 못해, 그 뒤에 오는 답지표와
 * 다음 문항들이 통째로 선택지 문자열 안에 들어가 있다.
 * 지금은 시험화면에서 그게 보기 하나로 그려진다.
 *
 * 잘라낸 내용은 따로 저장한다 — 그 안에 은행에 없는 문항이 묻혀 있다.
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walk(p)) : p.endsWith(".json") ? [p] : [];
  });

/*
 * 여기서부터 뒤는 선택지가 아니다.
 * "해답 없음"(= None of the above 번역) 같은 정상 문구를 지우지 않도록
 * 줄 전체를 기준으로 좁게 잡는다.
 */
const CUT = [
  /^\s*(GENERAL|SPECIFIC)\s*\(/i,
  /^\s*문제\s*$/,
  /^\s*해답\s*$/,
  /^\s*번호\s*$/,
  /시험\s*문제\s*해답/,
  /^\s*ANSWER\s*SHEET/i,
  /^\s*[A-Z]{2,4}\s*-\s*[ⅠⅡⅢⅣⅤIVX]+\s*-\s*[A-C]\s*(ANSWER|Answers)/i,
  /^\s*\*\s*(The\s+)?(follow|next)/i,
  /^\s*\*\s*Questions?\s+(No\.)?\s*\d/i,
  /^\s*\*\s*Refer\s+to\s/i,
  /^\s*\*\s*Answers?\s+to\b/i,
  /〓{3,}|─{6,}|={8,}/,                              /* 답지표 구분선 */
  /^\s*\(?Level\s+[IVXⅠ-Ⅹ]+\s*(Gen|Spec)/i,          /* "(Level II Gen-A) Answer" */
  /^\s*[A-Z]{2,5}\s+(GENERAL|SPECIFIC)\s*[(（]/i,     /* "TOFD GENERAL (TOFD General - Ⅱ - A)" */
  /^\s*#\d\s*$/,
  /^\s*\d{1,2}\.\s+[A-Z][a-z]+.{20,}/, /* 다음 문항 번호 */
];

const cutAt = (s) => {
  const lines = String(s).split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (CUT.some((re) => re.test(lines[i]))) {
      /* 첫 줄이 곧바로 잘림점이면 그 선택지는 통째로 쓰레기 */
      return { keep: lines.slice(0, i).join("\n").trim(), cut: lines.slice(i).join("\n") };
    }
  }
  return { keep: String(s).trim(), cut: "" };
};

let log = "", salvage = "";
let touched = 0, droppedOpts = 0;

for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let fileTouched = false;

  for (const q of items.flat(Infinity)) {
    if (!Array.isArray(q.options) || !q.options.length) continue;

    const rebuilt = [];
    let changed = false;
    q.options.forEach((o, i) => {
      const { keep, cut } = cutAt(o);
      if (!cut) { rebuilt.push(o); return; }
      changed = true;
      salvage += `\n${"=".repeat(70)}\n### ${rel} id ${q.id} 선택지 ${i + 1} 에서 떼어냄\n${cut}\n`;
      if (keep) rebuilt.push(keep);
      else droppedOpts++;
    });
    if (!changed) continue;

    /* 정답 위치가 밀리지 않도록, 통째로 버린 선택지가 정답보다 앞이면 조정 */
    const removedBefore = q.options.length - rebuilt.length;
    if (removedBefore && typeof q.answer === "number" && q.answer >= rebuilt.length) {
      log += `   ** ${rel} id ${q.id}: 정답 위치 ${q.answer} 가 남은 선택지 수 ${rebuilt.length} 를 벗어남 — 수동 확인 필요\n`;
    }

    log += `${rel} id ${q.id}: 선택지 ${q.options.length} -> ${rebuilt.length}\n`;
    q.options = rebuilt;
    touched++;
    fileTouched = true;
  }

  if (fileTouched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

log = `선택지를 정리한 문항 ${touched}건, 통째로 버린 선택지 ${droppedOpts}개\n\n` + log;
log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";
fs.writeFileSync("clean-options-out.txt", log, "utf8");
fs.writeFileSync("떼어낸내용.txt", salvage, "utf8");
console.log(log);
