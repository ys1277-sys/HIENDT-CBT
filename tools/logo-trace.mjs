/*
 * 회사 로고 그림을 SVG 길로 옮긴다.  색은 회사 파랑(#0179cf).
 *
 *   node svgtrace.mjs <png> <낼 svg>
 *
 * 41x45 짜리 작은 그림을 14mm 로 늘려 찍으니 가장자리가 뭉개진다.
 * 큰 원본(371x426)의 잉크 경계를 따라가 길로 만들면 어느 크기로 찍어도
 * 또렷하다.
 */
import fs from "node:fs";
import zlib from "node:zlib";

const [file, outFile] = process.argv.slice(2);
const buf = fs.readFileSync(file);

/* ── PNG 풀기 ─────────────────────────────── */
let p = 8, w = 0, h = 0, bit = 0, color = 0, idat = [], plte = null;
while (p < buf.length) {
  const len = buf.readUInt32BE(p);
  const type = buf.toString("ascii", p + 4, p + 8);
  const data = buf.slice(p + 8, p + 8 + len);
  if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bit = data[8]; color = data[9]; }
  else if (type === "PLTE") plte = data;
  else if (type === "IDAT") idat.push(data);
  else if (type === "IEND") break;
  p += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[color];
const bpp = Math.max(1, (ch * bit) / 8);
const stride = Math.ceil((w * ch * bit) / 8);
const out = Buffer.alloc(stride * h);
let q = 0;
for (let y = 0; y < h; y++) {
  const f = raw[q++]; const line = raw.slice(q, q + stride); q += stride;
  const cur = out.slice(y * stride, (y + 1) * stride);
  const prev = y ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
  for (let i = 0; i < stride; i++) {
    const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0, x = line[i];
    let v;
    if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b;
    else if (f === 3) v = x + ((a + b) >> 1);
    else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
           v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
    cur[i] = v & 255;
  }
}
const ink = new Uint8Array(w * h);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const o = y * stride + x * ch;
  const [r, g, b] = color === 3 ? [plte[out[o] * 3], plte[out[o] * 3 + 1], plte[out[o] * 3 + 2]]
                  : color === 0 || color === 4 ? [out[o], out[o], out[o]]
                  : [out[o], out[o + 1], out[o + 2]];
  ink[y * w + x] = (r + g + b) / 3 < 128 ? 1 : 0;
}

/* ── 잉크 칸의 테두리를 따라간다 ───────────── */
const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : ink[y * w + x]);

/* 칸 격자 위의 모서리. (x,y) 는 칸 왼위 꼭짓점 */
const seen = new Set();
const rings = [];

/* 잉크 덩이의 바깥·안쪽 테두리를 모두 걷는다 (Moore 이웃 따라가기 대신 모서리 따라가기) */
const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];   /* 오른·아래·왼·위 */

function edgeKey(x, y, d) { return x + "," + y + "," + d; }

/*
 * 모서리 하나는 「칸 사이의 금」이다. 잉크가 왼쪽에 오도록 걷는다.
 *   d=0 오른쪽으로 : 위 칸이 종이, 아래 칸이 잉크
 * 이렇게 두면 바깥 테두리는 시계 반대, 구멍은 시계 방향으로 돈다.
 */
function inkLeft(x, y, d) {
  if (d === 0) return at(x, y - 1) === 0 && at(x, y) === 1;        /* → */
  if (d === 1) return at(x, y) === 0 && at(x - 1, y) === 1;        /* ↓ */
  if (d === 2) return at(x - 1, y) === 0 && at(x - 1, y - 1) === 1;/* ← */
  return at(x - 1, y - 1) === 0 && at(x, y - 1) === 1;             /* ↑ */
}

for (let y = 0; y <= h; y++) {
  for (let x = 0; x <= w; x++) {
    for (let d = 0; d < 4; d++) {
      if (!inkLeft(x, y, d)) continue;
      if (seen.has(edgeKey(x, y, d))) continue;

      const pts = [];
      let cx = x, cy = y, cd = d;
      for (let step = 0; step < w * h * 8; step++) {
        seen.add(edgeKey(cx, cy, cd));
        pts.push([cx, cy]);
        cx += dirs[cd][0]; cy += dirs[cd][1];
        if (cx === x && cy === y && ((cd + 1) % 4 === d || cd === d || true)) {
          /* 처음 자리로 돌아왔는지는 다음 방향을 고른 뒤 판단한다 */
        }
        /* 왼쪽으로 꺾기 → 곧장 → 오른쪽으로 꺾기 순으로 시도 */
        let nd = -1;
        for (const t of [(cd + 3) % 4, cd, (cd + 1) % 4, (cd + 2) % 4]) {
          if (inkLeft(cx, cy, t) && !seen.has(edgeKey(cx, cy, t))) { nd = t; break; }
        }
        if (nd < 0) break;
        cd = nd;
      }
      if (pts.length > 8) rings.push(pts);
    }
  }
}

/* ── 곧은 구간 줄이기 (Douglas-Peucker) ────── */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, best = tol;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* 여백 잘라 0..100 으로 옮긴다 */
let x0 = w, y0 = h, x1 = -1, y1 = -1;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) {
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}
const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
const S = 100 / Math.max(bw, bh);
const ox = (100 - bw * S) / 2, oy = (100 - bh * S) / 2;
const fx = v => +(((v - x0) * S) + ox).toFixed(2);
const fy = v => +(((v - y0) * S) + oy).toFixed(2);

const TOL = Number(process.env.TOL || 1.2);
const paths = rings
  .map(r => simplify(r, TOL))
  .filter(r => r.length > 3)
  .map(r => "M" + r.map(([x, y]) => fx(x) + " " + fy(y)).join("L") + "Z");

const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="HANKUK INDUSTRIAL ENGINEERING">
<path fill="#0179cf" fill-rule="evenodd" d="${paths.join("")}"/>
</svg>
`;
fs.writeFileSync(outFile, svg);
console.log(`테두리 ${rings.length}개 · 꼭짓점 ${paths.join("").length} 글자 · ${(svg.length / 1024).toFixed(1)}KB`);
console.log(`원본 잉크 테두리 ${bw}x${bh}`);
