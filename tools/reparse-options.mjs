/*
 * 원본에서 보기별 한글을 다시 뽑아 짝을 맞춘다. (규칙 11)
 *
 * 원본 시험지는 보기를 2단으로 찍는다.
 *
 *   a. focal depth                    b. aperture
 *         집속 깊이                        구경
 *   c. pitch                          d. x-offset
 *         피치                             엑스-오프셋
 *
 * 파서가 이 짝을 놓쳐, 앞 보기의 한글이 뒤 보기 칸으로 밀려 들어갔다.
 *
 *   1. focal depth / 초점 깊이
 *   2. aperture    / 집속 깊이 구경   <- "집속 깊이" 는 1번 것
 *   3. pitch                          <- 한글 없음
 *   4. x-offset    / 피치 엑스-오프셋 <- "피치" 는 3번 것
 *
 * 영문 줄에서 두 칸으로 나누고, 바로 아래 한글 줄도 가장 넓은 공백에서
 * 나누어 같은 자리끼리 붙인다.
 *
 * 안전장치
 *  - 원본 보기 수와 은행 보기 수가 같아야 한다
 *  - 보기별 영문 앞머리가 서로 맞아야 한다
 * 둘 중 하나라도 어긋나면 그 문항은 건드리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const SRC = ["D:/Visual Studio Code/Level II 문제", "D:/Visual Studio Code/Level III 문제"];

const walkJson = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? (e.name === "images" ? [] : walkJson(p)) : p.endsWith(".json") ? [p] : [];
  });
const walkHwp = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walkHwp(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const HANGUL = /[가-힣]/;
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const TAG = /^\s*[(（]\s*[EPTSA](\s*[,，]\s*[EPTSA])*\s*[)）]\s*/;

/* 원본에 따라 보기 표시가 소문자(a.)일 때도 대문자(A.)일 때도 있다 */
const TWO = /^\s*([a-eA-E])[.)]\s*(\S.*?)\s{3,}([a-eA-E])[.)]\s*(\S.*?)\s*$/;
const ONE = /^\s*([a-eA-E])[.)]\s*(\S.*?)\s*$/;
const MARK = /^\s*[a-eA-E][.)]/;

/* 한글 줄을 가장 넓은 공백에서 둘로 나눈다 */
function splitKo(line) {
  const runs = [...line.matchAll(/\s{3,}/g)];
  if (!runs.length) return null;
  const big = runs.reduce((a, b) => (b[0].length >= a[0].length ? b : a));
  const left = line.slice(0, big.index).trim();
  const right = line.slice(big.index + big[0].length).trim();
  if (!left || !right) return null;
  return [left, right];
}

/* 원본 한 문항의 보기 목록을 뽑는다 -> [{en, ko}] */
function parseOptions(lines) {
  const out = [];

  /* 보기 줄과 한글 줄 사이에 빈 줄이 끼어 있다. 다음 내용 줄을 찾는다 */
  const nextTextLine = (from) => {
    for (let j = from; j < Math.min(from + 3, lines.length); j++) {
      if (lines[j] && lines[j].trim()) return { line: lines[j], at: j };
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const l = (lines[i] || "").replace(/\[\[OBJ\]\]/g, " ");
    if (!l.trim()) continue;
    if (HANGUL.test(l) && !MARK.test(l)) continue;

    const two = l.match(TWO);
    if (two) {
      const nx = nextTextLine(i + 1);
      const usable = nx && HANGUL.test(nx.line) && !MARK.test(nx.line);
      const ko = usable ? splitKo(nx.line) : null;
      out.push({ en: two[2].trim(), ko: ko ? ko[0] : "" });
      out.push({ en: two[4].trim(), ko: ko ? ko[1] : "" });
      if (ko) i = nx.at;
      continue;
    }

    const one = l.match(ONE);
    if (one) {
      const nx = nextTextLine(i + 1);
      const usable = nx && HANGUL.test(nx.line) && !MARK.test(nx.line);
      const ko = usable ? nx.line.trim() : "";
      out.push({ en: one[2].trim(), ko });
      if (ko) i = nx.at;
    }
  }
  return out;
}

/* 원본 전체에서 "발문 앞머리 -> 보기 목록" 사전을 만든다 */
const book = new Map();
for (const root of SRC) {
  for (const f of walkHwp(root)) {
    let text;
    try { ({ text } = readHwp(f)); } catch { continue; }

    const lines = text.split("\n");
    const starts = [];
    lines.forEach((l, i) => {
      if (/^\s*(?:\[\[OBJ\]\])*\s*\d{1,3}[.)]\s*\S/.test(l)) starts.push(i);
    });

    for (let s = 0; s < starts.length; s++) {
      const from = starts[s];
      const to = s + 1 < starts.length ? starts[s + 1] : Math.min(from + 40, lines.length);
      const block = lines.slice(from, to);

      /*
       * 원본 발문은 여러 줄로 접혀 있다.
       * 첫 줄만 쓰면 은행의 발문과 안 맞아 못 찾는다.
       * 한글 줄이나 보기 줄이 나올 때까지 이어 붙인다.
       */
      const stemLines = [];
      for (let k = 0; k < block.length; k++) {
        const l = (block[k] || "").replace(/\[\[OBJ\]\]/g, " ");
        if (k === 0) { stemLines.push(l.replace(/^\s*\d{1,3}[.)]\s*/, "")); continue; }
        if (!l.trim()) continue;
        if (MARK.test(l)) break;
        if (HANGUL.test(l)) break;
        stemLines.push(l);
      }

      const key = norm(stemLines.join(" ").replace(TAG, "")).slice(0, 45);
      if (key.length < 20) continue;

      const opts = parseOptions(block.slice(1));
      if (opts.length < 2) continue;
      if (!book.has(key)) book.set(key, opts);
    }
  }
}

/* 은행을 훑어 짝이 어긋난 문항만 고친다 */
let fixed = [], skipped = [];

for (const f of walkJson(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");
  let touched = false;

  for (const q of items.flat(Infinity)) {
    const opts = q.options || [];
    if (opts.length < 2) continue;

    /* 한글이 빠진 보기가 있는 문항만 대상 */
    const missing = opts.filter((o) => !HANGUL.test(String(o))).length;
    if (missing === 0 || missing === opts.length) continue;

    const key = norm(String(q.question).split("\n")[0]).slice(0, 45);
    const src = book.get(key);
    if (!src) { skipped.push(`${rel} id ${q.id}: 원본에서 못 찾음`); continue; }
    if (src.length !== opts.length) {
      skipped.push(`${rel} id ${q.id}: 보기 수가 다름 (은행 ${opts.length} / 원본 ${src.length})`);
      continue;
    }

    /* 원본에 한글이 하나도 없으면 붙일 것이 없다 */
    if (!src.some((s) => s.ko)) {
      skipped.push(`${rel} id ${q.id}: 원본에도 보기 한글이 없음`);
      continue;
    }

    /* 영문이 서로 맞는지 확인 */
    const ok = opts.every((o, i) => {
      const a = norm(String(o).split("\n")[0]).slice(0, 18);
      const b = norm(src[i].en).slice(0, 18);
      return a && b && (a.startsWith(b.slice(0, 12)) || b.startsWith(a.slice(0, 12)));
    });
    if (!ok) { skipped.push(`${rel} id ${q.id}: 보기 영문이 원본과 안 맞음`); continue; }

    const before = opts.map((o) => String(o).replace(/\n/g, " / "));
    q.options = src.map((s) => (s.ko ? `${s.en}\n${s.ko}` : s.en));
    touched = true;

    fixed.push(
      `${rel} id ${q.id}\n` +
      before.map((b, i) => `   전 ${i + 1}. ${b.slice(0, 76)}`).join("\n") + "\n" +
      q.options.map((o, i) => `   후 ${i + 1}. ${o.replace(/\n/g, " / ").slice(0, 76)}`).join("\n")
    );
  }
  if (touched && APPLY) fs.writeFileSync(f, JSON.stringify(items, null, 2) + "\n", "utf8");
}

let log = `원본에서 보기 한글을 다시 붙인 문항 ${fixed.length}건\n\n` + fixed.join("\n\n") + "\n\n";
log += `건드리지 않은 문항 ${skipped.length}건\n` + skipped.map((s) => "  " + s).join("\n") + "\n";
log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";

fs.writeFileSync("reparse-options-out.txt", log, "utf8");
console.log(`고침 ${fixed.length}건 / 보류 ${skipped.length}건 -> reparse-options-out.txt`);
