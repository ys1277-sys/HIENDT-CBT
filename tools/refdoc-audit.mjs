/*
 * 절차서 부록이 갖춰졌는지 본다.
 *
 * 문항 지시문은 "HIE-NDT-MT-N21 (Rev.2) 절차서를 보고 풀라" 고만 하고,
 * 그 절차서는 시험장에서 따로 나눠 주는 인쇄물이라 앱에 없다.
 * public/data/procedures/ 에 넣어 두면 문제지 뒤에 부록으로 붙는다.
 *
 * 세 가지를 알려 준다.
 *   - 아직 안 들어온 절차서
 *   - 등록했는데 그림 파일이 없는 절차서
 *   - 넣어 뒀는데 아무 문항도 안 가리키는 절차서
 *
 * ASME·API 같은 규격집은 응시자가 지참하는 자료라 세지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const DIR = `${PUB}/procedures`;

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "images" || e.name === "procedures" ? [] : walk(p);
    return p.endsWith(".json") ? [p] : [];
  });

const CODE = /HIE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g;

/* 문항이 가리키는 절차서 */
const need = new Map();
for (const f of walk(PUB)) {
  const raw = fs.readFileSync(f, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).flat(Infinity);
  const rel = path.relative(PUB, f).replace(/\\/g, "/").replace(".json", "");

  for (const q of items) {
    if (!q.groupNote) continue;
    for (const code of String(q.groupNote).match(CODE) || []) {
      const got = need.get(code) || { n: 0, where: new Set() };
      got.n++;
      got.where.add(rel);
      need.set(code, got);
    }
  }
}

/* 등록된 절차서 */
let manifest = null;
try {
  const raw = fs.readFileSync(`${DIR}/index.json`, "utf8");
  manifest = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
} catch {
  manifest = null;
}
const table = (manifest && manifest.procedures) || {};

/* 앱과 같은 방법으로 찾는다 (src/procedures.js) */
const methodOf = (code) => {
  const m = String(code).toUpperCase().match(/^HIE-NDT-([A-Z]+)-/);
  return m ? m[1] : "";
};

const keyFor = (code) => {
  if (Object.prototype.hasOwnProperty.call(table, code)) return code;
  const same = Object.keys(table).find((k) => k.startsWith(code));
  if (same) return same;
  const method = methodOf(code);
  if (!method) return null;
  return Object.keys(table).find((k) => methodOf(k) === method) || null;
};

const missing = [];
const broken = [];
const ready = [];

for (const [code, v] of [...need.entries()].sort((a, b) => b[1].n - a[1].n)) {
  const key = keyFor(code);
  if (!key) {
    missing.push({ code, ...v });
    continue;
  }

  const item = table[key] || {};

  /*
   * 절차서는 두 가지로 들어온다.
   *   doc    hwp 에서 뽑은 본문 문서 (tools/build-procedures.mjs)
   *   pages  쪽마다 뜬 그림
   */
  const files = item.doc ? [item.doc] : item.pages || [];
  const gone = files.filter((p) => !fs.existsSync(path.join(DIR, p)));

  if (!files.length || gone.length) broken.push({ code, key, files, gone, ...v });
  else ready.push({ code, key, files, kind: item.doc ? "본문" : "그림", ...v });
}

const unused = Object.keys(table).filter(
  (k) => ![...need.keys()].some((c) => k === c || k.startsWith(c))
);

let out = "";
out += `문항이 가리키는 절차서 ${need.size}종\n`;
out += `  볼 수 있음     ${ready.length}종\n`;
out += `  아직 안 들어옴 ${missing.length}종\n`;
out += `  등록했는데 그림이 없음 ${broken.length}종\n\n`;

if (ready.length) {
  out += "=== 응시자가 볼 수 있는 절차서 ===\n";
  for (const r of ready) out += `  ${r.code.padEnd(22)} ${r.kind}  (${r.n}문항)\n`;
  out += "\n";
}

if (broken.length) {
  out += "=== 등록했는데 그림 파일이 없다 ===\n";
  for (const b of broken) {
    out += `  ${b.code.padEnd(22)} ${b.files.length ? `없는 파일: ${b.gone.join(", ")}` : "doc 도 pages 도 없음"}\n`;
  }
  out += "\n";
}

if (missing.length) {
  out += "=== 아직 안 들어온 절차서 ===\n";
  out += "문항수  절차서                  어느 과목\n";
  out += "-".repeat(88) + "\n";
  for (const m of missing) {
    out += `${String(m.n).padStart(5)}  ${m.code.padEnd(22)}  ${[...m.where].join(", ")}\n`;
  }
  out += "\n넣는 방법은 public/data/procedures/README.md 를 보세요.\n\n";
}

if (unused.length) {
  out += "=== 넣어 뒀는데 아무 문항도 안 가리킨다 ===\n";
  for (const u of unused) out += `  ${u}\n`;
  out += "  (이름을 잘못 적었을 수 있다. 지시문에 적힌 그대로 써야 한다)\n";
}

fs.writeFileSync("refdoc-audit-out.txt", out, "utf8");
console.log(out);
