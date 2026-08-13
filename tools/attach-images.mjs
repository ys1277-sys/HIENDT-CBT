/*
 * 원본에서 확인한 그림을 문항에 붙인다. (규칙 7)
 *
 * 앵커 위치가 일부 원본에서 머리말 로고를 가리켜 자동 연결이 안 됐다.
 * 그림을 직접 꺼내 눈으로 확인한 것만 손으로 연결한다.
 *
 *   MT General 26~29, 40 : 자기이력 곡선 Figure 1 (MTG-II(A) BIN0002)
 *   UT General 1         : 탐촉자 단면 Figure 1  (UTG-II(A) BIN0003, 이미 추출돼 있음)
 *
 * 이름만 다른 중복 이미지 3개도 지운다.
 */
import fs from "node:fs";
import path from "node:path";
import { readHwp } from "./hwplib.mjs";
import { toWebImage } from "./img.mjs";

const APPLY = process.argv.includes("--apply");
const PUB = "D:/Visual Studio Code/HIENDT-CBT/public/data";
const IMG = path.join(PUB, "images");

let log = "";

/* ---------- 1) MT 자기이력 곡선 추출 ---------- */
const MT_SRC = "D:/Visual Studio Code/Level II 문제/Genernal(40문항)/MTG-II(A).hwp";
const MT_NAME = "MT_GENERAL_FIG1.jpg";
{
  const { images } = readHwp(MT_SRC);
  /* 31854B jpg 가 Figure 1 (자기이력 곡선). 4817B 는 머리말 로고라 제외 */
  const fig = images.find((i) => i.kind === "jpg" && i.data.length > 20000);
  if (!fig) log += "** MT Figure 1 을 못 찾음\n";
  else {
    const web = toWebImage(fig.data, fig.kind);
    log += `MT Figure 1 추출: ${fig.id} ${fig.kind} ${fig.data.length}B -> ${MT_NAME}\n`;
    if (APPLY) fs.writeFileSync(path.join(IMG, MT_NAME), web.data);
  }
}

/* ---------- 1-2) RFT 지지판 신호 그림 추출 ---------- */
const RFT_SRC = "D:/Visual Studio Code/Level II 문제/Genernal(40문항)/RFTG-II(B).hwp";
const RFT_NAME = "RFT_GENERAL_SUPPORT_PLATE.png";
{
  const { images } = readHwp(RFT_SRC);
  const fig = images.find((i) => i.kind === "bmp" && i.data.length > 100000);
  if (!fig) log += "** RFT 지지판 그림을 못 찾음\n";
  else {
    const web = toWebImage(fig.data, fig.kind);
    log += `RFT 지지판 그림 추출: ${fig.id} ${fig.kind} ${fig.data.length}B -> ${RFT_NAME}\n`;
    log += `   주의: 원본에서 a·b·c 라벨은 그림 위에 별도 글자로 놓여 있어 비트맵에는 없다.\n`;
    if (APPLY) fs.writeFileSync(path.join(IMG, RFT_NAME), web.data);
  }
}

/* ---------- 2) 문항에 붙이기 ---------- */
const LINKS = {
  "Level II/General/MT": { ids: [26, 27, 28, 29, 40], image: MT_NAME },
  "Level II/General/UT": { ids: [1], image: "UT_GENERAL_B_Q6.jpg" },
  "Level II/General/RFT": { ids: [39], image: RFT_NAME },
};

for (const [rel, spec] of Object.entries(LINKS)) {
  const p = `${PUB}/${rel}.json`;
  const raw = fs.readFileSync(p, "utf8");
  const items = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  let n = 0;

  for (const q of items.flat(Infinity)) {
    if (!spec.ids.includes(q.id)) continue;
    q.image = spec.image;
    n++;
    log += `  ${rel} id ${q.id} <- ${spec.image}\n`;
  }
  if (n !== spec.ids.length) log += `** ${rel}: ${spec.ids.length}개 중 ${n}개만 연결됨\n`;
  if (APPLY) fs.writeFileSync(p, JSON.stringify(items, null, 2) + "\n", "utf8");
}

/* ---------- 3) 이름만 다른 중복 이미지 정리 ---------- */
const DUPES = ["VT_GENERAL_A_Q2.png", "VT_GENERAL_A_Q25.png", "UT_SPECIFIC_VA_Q23.png"];
for (const d of DUPES) {
  const f = path.join(IMG, d);
  if (!fs.existsSync(f)) continue;
  log += `중복 이미지 삭제: ${d}\n`;
  if (APPLY) fs.unlinkSync(f);
}

log += APPLY ? "\n적용 완료\n" : "\ndry-run 입니다. 적용하려면 --apply\n";
fs.writeFileSync("attach-images-out.txt", log, "utf8");
console.log(log);
