/*
 * HIE-QP-E01(Rev.8) 절차서를 통째로 꺼낸다.
 *
 *   node tools/e01-dump.mjs            전문
 *   node tools/e01-dump.mjs 7.3        그 조항만
 *   node tools/e01-dump.mjs --toc      조항 목록만
 *
 * 이 절차서가 뼈대다. 값을 고치거나 규칙 문서를 손대기 전에 여기부터 본다.
 * readRich 는 { blocks } 를 돌려준다 — .text 가 아니다.
 */
import { readRich } from "./hwprich.mjs";

const E01 =
  "D:/Visual Studio Code/원본자료/절차서/비파괴시험요원 자격인정 절차서(HIE-QP-E01(Rev.8).hwp";

/*
 * blocks 는 글과 표가 섞여 있다.
 *   { t:"p", s:"글" }
 *   { t:"table", rows, cols, grid:[[칸|"covered", …], …] }
 *   칸 = { colSpan, rowSpan, blocks:[…] }
 * 표는 「│ 칸 │ 칸 」 꼴로 한 줄씩 편다.
 */
function flat(blocks, out = []) {
  for (const b of blocks || []) {
    if (typeof b === "string") { out.push(b); continue; }
    if (Array.isArray(b)) { flat(b, out); continue; }
    if (b == null) continue;

    if (b.t === "p") { out.push(b.s == null ? "" : String(b.s)); continue; }

    if (b.t === "table") {
      for (const row of b.grid || []) {
        const cells = [];
        for (const c of row || []) {
          if (c === "covered" || c == null) continue;
          cells.push(flat(c.blocks).join(" ").replace(/\s+/g, " ").trim());
        }
        if (cells.join("").trim()) out.push("│ " + cells.join(" │ "));
      }
      continue;
    }

    if (b.blocks) { flat(b.blocks, out); continue; }
  }
  return out;
}

const doc = await readRich(E01);
const lines = flat(doc.blocks)
  .map((l) => l.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trimEnd())
  .filter((l, i, a) => l.trim() !== "" || (a[i - 1] || "").trim() !== "");

const arg = process.argv[2] || "";

/* 조항 머리인가 */
const headOf = (l) => (l.trim().match(/^(\d+(?:\.\d+)*)\s/) || [])[1] || null;

if (arg === "--toc") {
  for (const l of lines) {
    const h = headOf(l);
    if (h) console.log("  " + h.padEnd(10) + l.trim().slice(h.length).trim().slice(0, 60));
  }
  process.exit(0);
}

if (arg) {
  /* 그 조항부터 다음 같은 깊이의 조항 앞까지 */
  let on = false;
  const depth = arg.split(".").length;
  for (const l of lines) {
    const h = headOf(l);
    if (h === arg) { on = true; }
    else if (on && h && h.split(".").length <= depth && !h.startsWith(arg + ".")) break;
    if (on) console.log(l);
  }
  process.exit(0);
}

console.log(lines.join("\n"));
console.error("\n──────── " + lines.length + "줄 ────────");
