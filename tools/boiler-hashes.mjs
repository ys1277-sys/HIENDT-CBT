/* 여러 검사법 시험지에 공통으로 나오는 이미지(로고/서명)의 해시를 저장 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readHwp } from "./hwplib.mjs";

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const METHODS = ["ECT", "PAUT", "TOFD", "RFT", "UT", "MT", "PT", "RT", "VT"];
const methodOf = (f) => {
  const b = path.basename(f).toUpperCase();
  if (b.startsWith("B-III")) return "BASIC";
  return METHODS.find((m) => b.startsWith(m)) || "?";
};

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.hwp$/i.test(e.name) ? [p] : [];
  });

const files = [
  ...walk("D:/Visual Studio Code/원본자료/Level II 문제"),
  ...walk("D:/Visual Studio Code/원본자료/Level III 문제"),
];

const m = new Map();
for (const f of files) {
  for (const im of readHwp(f).images) {
    const h = sha1(im.data);
    if (!m.has(h)) m.set(h, new Set());
    m.get(h).add(methodOf(f));
  }
}

const boiler = [...m.entries()].filter(([, s]) => s.size >= 2).map(([h]) => h);
fs.writeFileSync("boiler-hashes.json", JSON.stringify(boiler), "utf8");
console.log(`파일 ${files.length}개 · boilerplate ${boiler.length}종 저장`);
