/*
 * 만들어진 .docx 안에 Markdown 기호가 글자로 남아 있는지 본다.
 *
 * md2docx 는 줄 단위로 굵게(**)를 푼다. 그래서 굵게 표시가 줄바꿈을
 * 넘어가면 짝을 잃고 ** 가 글자 그대로 Word 에 찍힌다. 예전에 번호
 * 목록에서 이런 일이 있었다.
 *
 *   3. … 관리번호를 부여하고 **분리하여
 *      채점**한다.
 *
 * 원본을 아무리 봐도 안 보이고 결과물에서만 드러나므로 결과물을 본다.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const NASTY = [
  [/\*\*/g, "** 가 글자로 (굵게 표시가 안 풀림)"],
  [/&nbsp;/g, "&nbsp; 가 글자로"],
  [/&amp;(nbsp|lt|gt|quot|amp);/g, "HTML 기호가 두 번 감싸짐"],
  [/`/g, "백틱이 글자로"],
  [/<br\s*\/?>/gi, "<br> 이 글자로"],
  [/\|---/g, "표 구분선이 글자로"],
];

const files = process.argv.slice(2);
if (!files.length) {
  console.error("쓰임 : node tools/docx-check.mjs <파일.docx> …");
  process.exit(1);
}

let bad = 0;
for (const f of files) {
  console.log("=".repeat(70));
  console.log(f.split("/").pop());

  if (!fs.existsSync(f)) { console.log("  파일 없음\n"); bad++; continue; }

  const xml = execFileSync("unzip", ["-p", f, "word/document.xml"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });

  /* 글자만 뽑는다. 태그 안의 속성값은 보지 않는다 */
  const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1]).join("\n");

  let hit = 0;
  for (const [re, why] of NASTY) {
    const found = text.match(re);
    if (!found) continue;
    hit += found.length;
    console.log(`  ▶ ${why} — ${found.length}군데`);
    /* 어디인지 보이게 앞뒤를 조금 보여 준다 */
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const s = Math.max(0, m.index - 40);
      console.log("      …" + text.slice(s, m.index + 40).replace(/\n/g, " ") + "…");
      if (m.index > 0) break;
    }
  }

  console.log(hit ? `  살펴볼 곳 ${hit}군데` : "  남은 Markdown 기호 없음");
  bad += hit;
  console.log();
}

console.log(bad === 0 ? "결과물이 깨끗하다" : `살펴볼 곳 ${bad}건`);
