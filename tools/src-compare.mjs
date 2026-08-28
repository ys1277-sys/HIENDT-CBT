/*
 * 새 원본과 지금 문제은행의 글을 견준다.
 *
 * 원본을 갈아엎지 않는다. 사용자가 시험지에서 고친 대목만 찾아 보여준다.
 * 문제은행에는 원본에 없는 것이 얹혀 있다.
 *   주관식을 객관식으로 바꾸며 지은 보기 (규칙 12)
 *   원본에 한글이 없어 새로 붙인 한글 (규칙 11)
 *   그림, 묶음 지시문, 빈칸 표시
 * 갈아엎으면 이것이 다 사라진다.
 *
 * 짝짓기
 *   발문을 낱자만 남겨 견준다. 띄어쓰기·문장부호 차이는 무시한다.
 *   글자 하나라도 다르면 다른 것으로 보고 나란히 찍는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp, parseExam } from "./hwplib.mjs";
import { parseAutoNum } from "./parse-autonum.mjs";

const SRC = "D:/Visual Studio Code/원본자료/Level II 문제";
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data/Level II";

/* 자동 번호를 쓴 시험지는 따로 읽는다 */
const AUTONUM = /ECTG-II|RFTG-II|ECTS-II|RFTS-II/;

const walkH = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walkH(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const walkJ = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walkJ(p) : p.endsWith(".json") ? [p] : [];
  });

/*
 * 견줄 수 있게 다듬는다.
 *
 * 원본은 한글을 영문 줄 끝 괄호에 넣는다.
 *   coplanar with the major plane(불연속의 주 평면과 동일면상)
 * 문제은행은 줄을 나눈다.
 *   coplanar with the major plane\n불연속의 주 평면과 동일면상
 *
 * 한글 괄호를 떼고 영문 낱자만 남겨 견준다.
 */
const bare = (s) =>
  String(s)
    .split("\n")[0]
    /* 파서가 남긴 자국. 글 내용이 아니다 */
    .replace(/\[\[OBJ\]\]/g, " ")
    .replace(/^\s*[A-E][.)]\s+/, " ")
    .replace(/[(（][^)）]*[가-힣][^)）]*[)）]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/* 문제은행 */
const bank = new Map();
for (const f of walkJ(PUB)) {
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  for (const q of JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity)) {
    const en = String(q.question).split("\n")[0];
    const k = bare(q.question).slice(0, 70);
    if (k.length > 20 && !bank.has(k)) bank.set(k, { q, rel });
  }
}

/* 원본 */
const rows = [];

for (const f of walkH(SRC)) {
  const name = path.basename(f);
  let list;

  try {
    if (AUTONUM.test(name)) {
      list = parseAutoNum(f).map((q) => ({
        question: [q.stem.join(" "), q.ko.join(" ")].filter(Boolean).join("\n"),
        options: q.options,
      }));
    } else {
      const { text, picAnchors } = readHwp(f);
      list = parseExam(text, picAnchors);
    }
  } catch (e) {
    rows.push({ kind: "읽기실패", name, why: e.message });
    continue;
  }

  for (const q of list) {
    const en = String(q.question || "").split("\n")[0].trim();
    if (!en || en.length < 20) continue;

    const k = bare(q.question).slice(0, 70);
    if (k.length <= 20) continue;

    const hit = bank.get(k);
    if (!hit) {
      rows.push({ kind: "은행에없음", name, en });
      continue;
    }

    /* 보기 글이 다른가 */
    const a = (q.options || []).map((o) => bare(String(o).split("\n")[0]));
    const b = (hit.q.options || []).map((o) => bare(String(o).split("\n")[0]));

    /* 원본 보기가 없으면(주관식) 견줄 것이 없다 */
    if (!a.length) continue;
    if (a.length !== b.length || a.some((x, i) => x !== b[i])) {
      rows.push({ kind: "보기다름", name, rel: hit.rel, id: hit.q.id, en, src: q.options, cur: hit.q.options });
    }
  }
}

const by = (k) => rows.filter((r) => r.kind === k);

let out = "";
out += `원본에서 읽은 문항 가운데\n`;
out += `  은행에 없는 발문 ${by("은행에없음").length}건\n`;
out += `  보기 글이 다른 문항 ${by("보기다름").length}건\n`;
out += `  읽기 실패 ${by("읽기실패").length}건\n`;

out += `\n=== 보기 글이 다른 문항 ===\n`;
for (const r of by("보기다름")) {
  out += `\n${r.rel} id ${r.id}   (${r.name})\n  ${r.en.slice(0, 100)}\n`;
  r.src.forEach((o, i) => (out += `   원본 ${i + 1}. ${String(o).replace(/\n/g, " / ").slice(0, 86)}\n`));
  (r.cur || []).forEach((o, i) => (out += `   은행 ${i + 1}. ${String(o).replace(/\n/g, " / ").slice(0, 86)}\n`));
}

out += `\n=== 은행에 없는 발문 ===\n`;
for (const r of by("은행에없음")) out += `  ${r.name}  ${r.en.slice(0, 96)}\n`;

fs.writeFileSync("src-compare-out.txt", out, "utf8");
console.log(out.split("\n").slice(0, 4).join("\n"));
