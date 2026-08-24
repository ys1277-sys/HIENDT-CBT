/*
 * 과목 파일마다 어느 원본 시험지에서 왔는지 보고,
 * 그 시험지들의 갑지 NOTE 가 몇 번 갈래인지 맞춰 본다.
 *
 * 갑지 NOTE 를 시험마다 다르게 넣으려면 먼저 이 대응이 1:1 인지
 * 확인해야 한다. A/B 시험지가 서로 다른 갈래를 쓰면 !! 로 표시한다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";

const SRC = [
  "D:/Visual Studio Code/Level II 문제",
  "D:/Visual Studio Code/Level III 문제"
];
const PUB = "public/data";
const SEP = String.fromCharCode(92); // 역슬래시

const walk = (d, ok) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      return e.name === "images" || e.name === "procedures" ? [] : walk(p, ok);
    }
    return ok(e.name) ? [p] : [];
  });

/* 원본 시험지 → NOTE 갈래 번호 */
const noteOf = new Map();
const variants = [];

const hwps = SRC.filter(fs.existsSync).flatMap((d) =>
  walk(d, (n) => /\.hwp$/i.test(n) && !n.startsWith("~"))
);

for (const f of hwps) {
  let txt;
  try {
    txt = readHwp(f).text;
  } catch {
    continue;
  }
  const i = txt.search(/NOTE\s*:/i);
  if (i < 0) continue;

  let seg = txt.slice(i, i + 2000);
  const j = seg.search(/Approved\s*by/i);
  if (j > 0) seg = seg.slice(0, j);

  const norm = seg.replace(/\s+/g, " ").trim();
  let k = variants.indexOf(norm);
  if (k < 0) {
    variants.push(norm);
    k = variants.length - 1;
  }
  noteOf.set(path.basename(f, path.extname(f)).toLowerCase(), k + 1);
}

/* 과목 파일 → 그 안 문항들의 source */
const rows = [];

for (const f of walk(PUB, (n) => n.endsWith(".json"))) {
  const rel = path.relative(PUB, f).split(SEP).join("/").replace(".json", "");
  const items = JSON.parse(fs.readFileSync(f, "utf8")).flat(Infinity);
  const srcs = [...new Set(items.map((q) => q.source).filter(Boolean))];

  const hit = srcs.map((s) => {
    const key = s.toLowerCase().trim();
    if (noteOf.has(key)) return { s, v: noteOf.get(key) };
    const near = [...noteOf.keys()].find((k) => k.includes(key) || key.includes(k));
    return { s, v: near ? noteOf.get(near) : null, near };
  });

  const vs = [...new Set(hit.map((h) => h.v))];
  rows.push({ rel, vs, hit });
}

console.log("갈래", variants.length, "가지\n");

for (const r of rows) {
  const clean = r.vs.length === 1 && r.vs[0];
  console.log(`${clean ? "  " : "!!"} ${r.rel.padEnd(26)} 갈래 ${r.vs.join(",")}`);
  if (!clean) {
    r.hit.forEach((h) =>
      console.log(`      ${h.v ?? "못찾음"}  ${h.s}${h.near ? "  ~ " + h.near : ""}`)
    );
  }
}
