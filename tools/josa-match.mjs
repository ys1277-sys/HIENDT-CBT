/*
 * 목적어 조사 「을/를」이 앞 글자의 받침과 맞는지 본다.
 *
 *   node tools/josa-match.mjs
 *
 * 받침이 있으면 「을」, 없으면 「를」이다. 「용접부을」처럼 어긋난 것을 찾는다.
 *
 * 처음에는 이·가·은·는·과·와까지 다 보게 했더니 「초과」의 과, 「있는」의
 * 는, 「얼마인가」의 가처럼 낱말 속 글자를 조사로 잡아 1,281건이 나왔다.
 * 거의 다 거짓이었다. 우리말 조사는 형태소를 갈라야 제대로 가려지므로,
 * 글자만 보고 확실히 말할 수 있는 「을/를」 하나로 좁혔다.
 *
 * 그것도 뒤에 빈칸이나 문장 끝이 와야 조사로 본다 —
 * 「그을음」의 을, 「흐를」의 를 같은 것을 걸러 내려는 것이다.
 *
 * 숫자·영문 뒤는 읽는 소리로 갈리므로 (3을 / MHz를) 건드리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/data";

function hasBatchim(ch) {
  const c = ch.codePointAt(0);
  if (c < 0xac00 || c > 0xd7a3) return null;
  return (c - 0xac00) % 28 !== 0;
}

function check(text) {
  const out = [];
  const s = String(text);

  for (const m of s.matchAll(/([가-힣])([을를])(?=[\s,.·)\]]|$)/g)) {
    const [, prev, got] = m;
    const b = hasBatchim(prev);
    if (b === null) continue;
    const want = b ? "을" : "를";
    if (got === want) continue;
    out.push({
      prev, got, want,
      near: s.slice(Math.max(0, m.index - 16), m.index + 10).replace(/\s+/g, " "),
    });
  }
  return out;
}

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, o);
    else if (e.name.endsWith(".json")) o.push(p);
  }
  return o;
}

let hit = 0;
for (const file of walk(ROOT).sort()) {
  let list;
  try { list = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  if (!Array.isArray(list) || !list[0] || !list[0].question) continue;

  const name = file.replace(ROOT + path.sep, "").replace(/\\/g, "/").replace(".json", "");

  for (const q of list) {
    const spots = [["문항", q.question]];
    (q.options || []).forEach((o, i) => spots.push(["보기" + (i + 1), o]));
    if (q.groupNote) spots.push(["묶음", q.groupNote]);

    for (const [where, txt] of spots) {
      const ko = String(txt).split("\n").filter((l) => /[가-힣]/.test(l)).join(" ");
      for (const r of check(ko)) {
        hit++;
        console.log(
          name.padEnd(24) + "id" + String(q.id).padEnd(5) + where.padEnd(7) +
          "「" + r.prev + r.got + "」 → 「" + r.prev + r.want + "」"
        );
        console.log("     … " + r.near + " …");
      }
    }
  }
}

console.log("\n" + "─".repeat(64));
console.log(hit ? "「을/를」이 어긋난 자리 " + hit + "곳" : "「을/를」이 어긋난 자리 없음");
