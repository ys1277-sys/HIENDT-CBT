/*
 * 절차서 hwp 를 앱이 읽을 수 있는 꼴로 바꾼다.
 *
 * D:/Visual Studio Code/절차서/*.hwp 를 읽어
 * public/data/procedures/ 에 문서 json 과 그림을 쓰고 index.json 을 갱신한다.
 *
 * 원본 그대로 옮긴다
 * ------------------
 * 표는 표로, 그림은 문서에 놓인 차례대로 싣는다. 글만 뽑으면
 * 개정이력·결재란이 "2" "2024.01.02" "H. H. KIM" 같은 조각으로 흩어지고
 * 합격기준 표도 못 읽는다.
 *
 * 영문 다음 한글
 * --------------
 * 원본 본문은 1줄 2칸 표다. 왼쪽 칸이 영문 전체, 오른쪽 칸이 한글 전체다.
 * 그대로 두면 영문을 다 읽은 뒤에야 한글이 나오고, 2.0 REFERENCES 같은
 * 항목이 두 번 나오는 것처럼 보인다.
 *
 * 항목 번호로 갈라 1.0 영문 다음 1.0 한글, 2.0 영문 다음 2.0 한글로 엮는다.
 */
import fs from "node:fs";
import path from "node:path";
import { readRich } from "./hwprich.mjs";
import { bmpToPng } from "./bmp2png.mjs";
import { pcxToPng, isPcx } from "./pcx2png.mjs";
import { wmfToPng, isWmf } from "./wmf2png.mjs";
import { oleToImage, isOle } from "./ole2png.mjs";
import { PROC_KO_FIX } from "./proc-ko-fix.mjs";

const SRC = "D:/Visual Studio Code/절차서";
const OUT = "D:/Visual Studio Code/HIENDT-CBT/public/data/procedures";

/*
 * 문서번호에서 과목을 못 읽는 것만 손으로 이어 준다.
 * 왼쪽이 우리가 가진 문서번호, 오른쪽이 문항이 부르는 이름이다.
 *
 * 나머지는 앱이 과목으로 찾는다(src/procedures.js). 문항은 ASME Sec.Ⅲ
 * 용(N21), Sec.Ⅷ 용(P11), API 6A 용(P6A) 을 따로 부르는데, 우리가 받은
 * 것은 과목마다 한 편씩이다. 갈래를 따지면 MT 는 14문항 가운데 5문항만
 * 열린다. 과목만 맞으면 그것을 연다.
 */
const ALIAS = {
  "HIE-NDT-TOFD-U09": ["HIE-NDT-P11"],
};

/* 브라우저가 그대로 그리는 형식. 나머지는 아래에서 바꿔 싣는다 */
const DRAWABLE = new Set(["jpg", "png", "gif", "bmp"]);
const EXT = { jpg: "jpg", png: "png", gif: "gif", bmp: "bmp" };

/*
 * 너무 작은 그림은 뺀다.
 *
 * 글머리표나 서명 도장 조각이 15x22 같은 크기로 들어 있다. 본문에 끼면
 * 뜻 없는 얼룩으로만 보인다. 도해는 이보다 훨씬 크다.
 */
const MIN_SIDE = 40;

/*
 * 원본이 영문뿐인 절차서에 붙일 한글.
 *
 * TOFD 는 본문 508줄 가운데 한글이 19줄뿐이고 그것도 표지·결재란이다.
 * 다른 절차서와 달리 영문·한글 2칸 짜임이 아예 없어 엮을 것이 없다.
 * 그래서 없던 한글을 지어 붙인다. tools/tofd-ko.mjs 가 원문이고
 * tools/apply-tofd-ko.mjs 가 영문 줄과 짝지어 이 파일을 만든다.
 */
const KO_FILE = { "p11-2-TOFD.hwp": "tofd-ko.json" };

function readKo(name) {
  const f = KO_FILE[name];
  if (!f) return null;

  try {
    return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
  } catch {
    return null;
  }
}

/*
 * 영문 줄 다음에 한글 줄을 끼운다. 다른 절차서와 같은 모양이 된다.
 * 제목이면 한글도 제목으로 둔다. 한쪽만 굵으면 짝이 어긋나 보인다.
 */
function weaveKo(blocks, ko) {
  const out = [];

  for (const b of blocks) {
    out.push(b);

    if (b.t !== "p" && b.t !== "h") continue;

    const s = String(b.s || "").replace(/\s+/g, " ").trim();
    const t = ko[s];
    if (t) out.push({ ...b, s: t });
  }

  return out;
}

/*
 * 덩이 하나에 든 글을 다 모은다. 표 안까지 들어간다.
 */
function blockText(b) {
  if (!b) return "";
  if (b === "covered") return "";
  if (b.t === "table") {
    return b.grid
      .map((row) => row.map((c) => (!c || c === "covered" ? "" : c.blocks.map(blockText).join(" "))).join(" "))
      .join(" ");
  }
  if (b.t === "img") return "";
  return String(b.s || "");
}

/*
 * 원본 표지를 걷어낸다.
 *
 * hwp 표지는 「로고 + 회사이름 + 문서번호 + 개정 + 제목 + 발행부서」를
 * 4줄 6칸 표에 담고 있다. 그것을 그대로 옮기면 절차서마다 칸 나눔이
 * 조금씩 달라 열 편이 열 가지 꼴로 뜬다. ECT 절차서는 아예 그 앞에
 * 표제지가 한 장 더 있고, UT 는 목차가 표지보다 앞에 나온다.
 *
 * 표지에 적힌 값은 readCover 가 따로 읽어 index.json 에 넣는다. 화면에는
 * 앱이 한 가지 꼴로 그린다(src/ProcedureHead.jsx). 그러니 여기서는
 * 표지 표와 그 앞에 딸린 표제지를 통째로 뺀다.
 */
const COVER_MARK = /Document\s*No/i;

function stripCover(blocks) {
  let at = -1;

  for (let i = 0; i < Math.min(blocks.length, 14); i++) {
    if (blocks[i].t !== "table") continue;
    if (COVER_MARK.test(blockText(blocks[i]))) { at = i; break; }
  }

  /* 표지를 못 찾으면 아무것도 안 뺀다. 본문을 잃는 것보다 낫다 */
  if (at < 0) return blocks;

  const rest = blocks.slice(at + 1);

  /*
   * UT 절차서는 목차 표시가 표지보다 앞에 있다. 표지와 함께 빼 버리면
   * 목차만 표시 없이 덩그러니 남는다. 뺀 덩이 가운데 목차 표시가 있었으면
   * 앞으로 옮겨 둔다.
   */
  const toc = blocks
    .slice(0, at)
    .some((b) => TOC_MARK.test(blockText(b).replace(/\s+/g, " ").trim()));

  return toc ? [{ t: "p", s: "CONTENTS" }, ...rest] : rest;
}

/*
 * 목차 표시를 한 꼴로 맞춘다.
 *
 * 원본이 제각각이다. 1칸 표에 「CONTENTS」, 문단에 「Contents」 다음 줄에
 * 「목차」, 한 줄에 「CONTENTS 목차」, E01 은 「TABLE OF CONTENTS」.
 * 표지를 뺀 자리에 오는 이 표시를 항목 제목과 같은 꼴로 바꾼다.
 */
const TOC_MARK = /^(table\s*of\s*contents|contents|목\s*차)$/i;

function normalizeToc(blocks) {
  let i = 0;
  let found = false;

  while (i < blocks.length && i < 4) {
    const t = blockText(blocks[i]).replace(/\s+/g, " ").trim();
    if (TOC_MARK.test(t) || /^contents\s*목\s*차$/i.test(t)) { found = true; i++; continue; }
    break;
  }

  if (!found) return blocks;
  return [{ t: "h", level: 2, s: "CONTENTS 목차" }, ...blocks.slice(i)];
}

/*
 * 표지 로고가 두 번 나오는 것을 한 번으로 줄인다.
 *
 * 표지 첫머리 표 안에 회사 로고가 들어 있는데, 그 로고가 표 밖에도
 * 한 번 더 딸려 나온다. 절차서를 열면 로고만 덩그러니 뜬 뒤 표지가
 * 나오고 거기에 또 로고가 있다. 일곱 편이 다 그렇다.
 *
 * 표지를 통째로 걷어내면서 같이 빠지지만, 표지를 못 찾은 절차서를
 * 위해 남겨 둔다.
 */
function dropLooseCoverLogo(blocks) {
  if (blocks.length < 2) return blocks;
  if (blocks[0].t !== "img" || blocks[1].t !== "table") return blocks;

  const src = blocks[0].src;
  let found = false;

  (function look(bs) {
    for (const b of bs) {
      if (b.t === "img" && b.src === src) { found = true; return; }
      if (b.t !== "table") continue;
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") look(c.blocks);
        }
      }
    }
  })([blocks[1]]);

  return found ? blocks.slice(1) : blocks;
}

/*
 * 표지 표의 회사 로고에 표시를 단다.
 *
 * 화면에서는 아주 작게 그린다. 도해가 아니라 머리글 장식이라 제 크기
 * (200x230)로 두면 표지 칸을 혼자 다 차지한다.
 *
 * 첫 표 안에서 처음 나오는 그림 하나만 고른다. 결재란 서명 도장은
 * 그대로 둔다.
 */
/*
 * 한글이 제 글꼴로만 그리는 글자를 보통 글자로 바꾼다.
 *
 * 한글은 가로줄을 그을 때 유니코드 선 글자를 쓰지 않고 제 글꼴의
 * 사용자 영역(15면 PUA) 글자를 쓴다. 그대로 옮기면 웹 글꼴에 그 글자가
 * 없어 네모(󰠏󰠏󰠏)로 뜬다. 서식의 밑줄과 제목 아래 구분선이 전부 그랬다.
 *
 *   U+F080F   가는 가로줄 — 서식의 기입란 밑줄
 *   U+F081A   굵은 가로줄 — 제목 아래 구분선
 *   U+F0827   굵은 가로줄 — 제목 아래 구분선
 *
 * 남은 PUA 글자는 뜻을 모르므로 지우지 않고 그대로 둔다. 지우면 무엇이
 * 있었는지조차 알 수 없게 된다.
 */
const GLYPH = new Map([
  [0xf080f, "─"],
  [0xf081a, "━"],
  [0xf0827, "━"],
]);

function deglyph(s) {
  if (typeof s !== "string") return s;
  let out = "";
  for (const ch of s) out += GLYPH.get(ch.codePointAt(0)) ?? ch;
  return out;
}

/*
 * 우리말 맞춤법 가운데 뜻이 안 바뀌는 것만 바로잡는다.
 *
 * 「되어야 한다」의 「한다」는 보조용언이라 띄어 쓴다. 원본에는
 * 「되어야한다」가 열 편에 걸쳐 예순여 군데 있다. 빈칸 하나를 넣는
 * 일이라 뜻이 달라지지 않는다.
 *
 * 말투(…합니다 / …한다)나 잘못된 번역은 여기서 손대지 않는다. 그것은
 * 문장을 다시 쓰는 일이고, 절차서 본문의 임자는 원본 hwp 다. 어디가
 * 어떻게 어긋났는지는 tools/proc-proof.mjs 가 보여 준다.
 */
const SPACING = [
  /* 되야 → 되어야.  「되-」에 「-어야」가 붙는다 */
  [/되야(?=\s*(한다|합니다|된다|할|하는))/g, "되어야"],

  /* 보조용언은 띄어 쓴다 */
  [/([가-힣])야한다/g, "$1야 한다"],
  [/([가-힣])야합니다/g, "$1야 합니다"],
  [/([가-힣])야된다/g, "$1야 된다"],
  [/([가-힣])어야할/g, "$1어야 할"],

  /* 의존명사 「수」는 띄어 쓴다 */
  [/([가-힣])할수(?=\s*(있|없))/g, "$1할 수"],
];

function tidyKo(s) {
  if (typeof s !== "string" || !/[가-힣]/.test(s)) return s;
  let t = s;
  for (const [from, to] of SPACING) t = t.replace(from, to);
  return t;
}

/*
 * 절차서별 우리말 교정표를 입힌다. (tools/proc-ko-fix.mjs)
 *
 * 글월 전체가 하나도 안 틀리게 맞을 때만 갈아 끼운다. 원본 hwp 가
 * 바뀌면 안 걸리고 그냥 지나가며, 몇 줄이 안 걸렸는지 빌드가 알려 준다.
 * 조용히 엉뚱한 자리에 붙는 일은 없다.
 */
function applyKoFix(blocks, code) {
  const table = PROC_KO_FIX[code];
  if (!table) return { blocks, hit: 0, total: 0 };

  const left = new Set(Object.keys(table));
  let hit = 0;

  const walk = (bs) =>
    bs.map((b) => {
      if (b.t === "table") {
        return {
          ...b,
          grid: b.grid.map((row) =>
            row.map((c) =>
              !c || c === "covered" ? c : { ...c, blocks: walk(c.blocks) }
            )
          ),
        };
      }

      if (b.t === "img") return b;

      const s = String(b.s || "").trim();
      const want = table[s];
      if (!want) return b;

      left.delete(s);
      hit++;
      return { ...b, s: want };
    });

  const out = walk(blocks);
  return { blocks: out, hit, total: Object.keys(table).length, left: [...left] };
}

/*
 * 회사 로고를 크기로 찾아 표시한다.
 *
 * markCoverLogo 는 「첫 표 안의 첫 그림」만 본다. 표지 짜임이 다른
 * 절차서에서는 놓친다. 실제로 ECT 절차서의 로고가 표시되지 않아
 * 원본 크기(200x230)로 그려졌다.
 *
 * 회사 로고는 어느 절차서에서나 같은 그림이라 크기가 늘 같다.
 * 짜임을 따지지 말고 크기로 잡는다.
 */
const LOGO_W = 200, LOGO_H = 230;

function markLogoBySize(blocks, sizeOf) {
  (function look(bs) {
    for (const b of bs) {
      if (b.t === "img" && b.src) {
        const d = sizeOf.get(String(b.src).split("/").pop());
        if (d && d[0] === LOGO_W && d[1] === LOGO_H) b.logo = true;
      }
      if (b.t === "table" && b.grid)
        for (const row of b.grid)
          for (const c of row) if (c && c !== "covered") look(c.blocks);
      if (b.blocks) look(b.blocks);
    }
  })(blocks);
  return blocks;
}

function markCoverLogo(blocks) {
  const first = blocks.find((b) => b.t === "table");
  if (!first) return blocks;

  let done = false;

  (function look(bs) {
    for (const b of bs) {
      if (done) return;

      if (b.t === "img") { b.logo = true; done = true; return; }
      if (b.t !== "table") continue;

      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") look(c.blocks);
        }
      }
    }
  })([first]);

  return blocks;
}

/*
 * 개정이력 표의 서명 도장에 표시를 단다.
 *
 * 손글씨 서명을 스캔해 넣은 것이라 원본이 308x112 쯤 된다. 그대로
 * 그리면 이름 글자보다 도장이 훨씬 커서 칸이 늘어난다. 화면에서
 * 절반으로 줄인다.
 *
 * 표 안 그림이라고 다 도장은 아니다. PAUT 755x450, UT 647x492 처럼
 * 표 안에 든 진짜 도해가 있다. 그래서 표를 가려서 고른다. 작성자·
 * 검토자·승인자 칸이 있는 표만 서명 표로 본다.
 */
const STAMP_TABLE = /개정번호|Rev\.\s*No|Prepared\s*by|작\s*성\s*자/;

function markStamps(blocks) {
  const cellText = (bs) =>
    bs
      .map((b) => (b.t === "table" ? tableText(b) : String(b.s || "")))
      .join(" ");

  const tableText = (t) =>
    t.grid
      .map((row) =>
        row.map((c) => (!c || c === "covered" ? "" : cellText(c.blocks))).join(" ")
      )
      .join(" ");

  const mark = (bs) => {
    for (const b of bs) {
      if (b.t === "img") { b.stamp = true; continue; }
      if (b.t !== "table") continue;
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") mark(c.blocks);
        }
      }
    }
  };

  for (const b of blocks) {
    if (b.t !== "table") continue;
    if (!STAMP_TABLE.test(tableText(b))) continue;

    for (const row of b.grid) {
      for (const c of row) {
        if (c && c !== "covered") mark(c.blocks);
      }
    }
  }

  /* 표지 로고는 도장이 아니다. 겹치면 로고 쪽을 남긴다 */
  (function unmark(bs) {
    for (const b of bs) {
      if (b.t === "img" && b.logo) { delete b.stamp; continue; }
      if (b.t !== "table") continue;
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") unmark(c.blocks);
        }
      }
    }
  })(blocks);

  return blocks;
}

/*
 * 표에서 아무것도 없는 줄을 지운다.
 *
 * 개정이력 표에 내용이 하나도 없는 줄이 네 개씩 들어 있다. 한글에서
 * 칸 높이를 맞추려고 넣어 둔 것인데, 화면에서는 얇은 빈 띠로만 보인다.
 * 열 편에 43줄이 있다.
 *
 * 위 칸이 세로로 걸쳐 내려온 줄(covered)은 건드리지 않는다. 그 줄을
 * 지우면 걸친 칸이 갈 곳을 잃어 표가 어긋난다. 지금은 그런 줄이 없다.
 */
function dropEmptyRows(blocks) {
  for (const b of blocks) {
    if (b.t !== "table") continue;

    const keep = b.grid.filter((row) => {
      const allEmpty = row.every(
        (c) => !c || (c !== "covered" && c.blocks.length === 0)
      );
      const covered = row.some((c) => c === "covered");
      return !allEmpty || covered;
    });

    if (keep.length !== b.grid.length) {
      b.grid = keep;
      b.rows = keep.length;
    }

    for (const row of b.grid) {
      for (const c of row) {
        if (c && c !== "covered") dropEmptyRows(c.blocks);
      }
    }
  }

  return blocks;
}

/* PNG·JPG 머리에서 크기를 읽는다 */
function pixelSize(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i + 9 < buf.length;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      }
      const len = buf.readUInt16BE(i + 2);
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return [0, 0];
}

const HANGUL = /[가-힣]/;
const LATIN = /[A-Za-z]/;

/*
 * 항목 번호. "1.0 SCOPE" "4.2.1 Application" "6.11.1.2 …"
 *
 * 예전에는 세 자리까지만 봤다. 그러면 6.11.1.1 6.11.1.2 6.11.1.3 이
 * 모두 열쇠 6.11.1 로 뭉개져, 영문과 한글을 짝지을 때 첫 것만 남고
 * 나머지가 사라졌다. 네 자리까지 본다.
 */
const SECTION = /^(\d{1,2}\.\d{1,2}(?:\.\d{1,2}){0,2})[\s.]/;

/* ---- 표지에서 문서 정보 읽기 ---- */

/* 덩이 나무를 글로 눌러 본다. 표지 읽기에만 쓴다 */
function flatten(blocks, out = []) {
  for (const b of blocks) {
    if (b.t === "p") out.push(b.s);
    else if (b.t === "table") {
      for (const row of b.grid) {
        for (const c of row) {
          if (c && c !== "covered") flatten(c.blocks, out);
        }
      }
    }
  }
  return out;
}

/*
 * 표지 제목의 오타.
 *
 * 원본을 그대로 옮기는 것이 원칙이지만 제목은 창 머리와 목록에 계속
 * 나오는 자리라 눈에 밟힌다. 뜻이 바뀌지 않는 철자만 바로잡는다.
 * 본문은 손대지 않는다.
 */
const TITLE_TYPO = [
  [/\bULTRASOINC\b/gi, "ULTRASONIC"],   // PAUT 표지
];

/*
 * 제목을 한 꼴로 맞춘다.
 *
 * 여덟 편은 「ULTRASONIC EXAMINATION PROCEDURE」처럼 다 대문자인데
 * TOFD 는 「Ultrasonic Examination(TOFD) PROCEDURE」, E01 은
 * 「NDE Personnel Qualification and Certification Procedure」로 섞여
 * 있다. 절차서 머리글에 나란히 뜨는 자리라 눈에 밟힌다.
 *
 * 대소문자와 묶음표 앞 빈칸만 손본다. 말은 원본 그대로 둔다.
 */
function fixTitle(s) {
  let t = s;
  for (const [from, to] of TITLE_TYPO) t = t.replace(from, to);

  t = t.toUpperCase().replace(/\s*\(/g, " (").replace(/\s+/g, " ").trim();
  return t;
}

/*
 * 한글 제목의 띄어쓰기.
 *
 * 「원격장 탐상 검사 절차서」만 낱말을 벌려 놓았다. 나머지 아홉 편은
 * 「와전류탐상검사」 「방사선투과검사」처럼 검사 이름을 한 낱말로
 * 붙여 쓴다. 비파괴검사 용어의 표준 표기도 붙여 쓰는 쪽이다.
 */
const TITLE_KO = [
  [/원격장\s*탐상\s*검사/g, "원격장탐상검사"],
];

function fixTitleKo(s) {
  let t = String(s).replace(/\s+/g, " ").trim();
  for (const [from, to] of TITLE_KO) t = t.replace(from, to);
  return t;
}

function readCover(lines) {
  const out = { code: "", rev: "", date: "", subject: "", subjectKo: "", dept: "", pages: "" };

  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    const l = lines[i];

    if (!out.code && /^Document\s*No\.?$/i.test(l)) {
      const next = lines.slice(i + 1, i + 4).find((s) => /HIE/i.test(s));
      if (next) out.code = next.replace(/\s*-\s*/g, "-").replace(/\s+/g, "").toUpperCase();
    }
    if (!out.rev) {
      const m = l.match(/^Revision\s*No\.?\s*(\d+)/i);
      if (m) out.rev = `Rev.${m[1]}`;
      else if (/^Revision\s*No\.?$/i.test(l)) {
        const next = lines.slice(i + 1, i + 4).find((s) => /^\d+$/.test(s));
        if (next) out.rev = `Rev.${next}`;
      }
    }
    if (!out.date && /^Revision\s*Date/i.test(l)) {
      const m = l.match(/(\d{4}\s*[.\-]\s*\d{1,2}\s*[.\-]\s*\d{1,2})/);
      if (m) out.date = m[1];
      else {
        const next = lines.slice(i + 1, i + 4).find((s) => /\d{4}\s*[.\-]/.test(s));
        if (next) out.date = next;
      }
    }
    /*
     * 제목은 표 칸 안에서 줄이 나뉜다.
     *   Subject
     *   NDE Personnel Qualification and
     *   Certification Procedure
     * 첫 줄만 쓰면 "NDE Personnel Qualification and" 로 잘린다.
     */
    if (!out.subject && /^Subject$/i.test(l)) {
      const parts = [];
      for (let k = i + 1; k < Math.min(i + 6, lines.length); k++) {
        const s = lines[k];
        if (!s) continue;
        if (/^(Issued|Dep'?t\.?|Page\b|TABLE OF CONTENTS)/i.test(s)) break;
        if (HANGUL.test(s)) break;
        parts.push(s);
      }
      if (parts.length) out.subject = fixTitle(parts.join(" "));
    }

    /*
     * 발행부서.  「Issued」 「Dep't.」 다음 칸에 「기술부 TECH Dep't」
     * 처럼 들어 있다. E01 은 「QM Dep't」 한 마디뿐이다.
     */
    if (!out.dept && /^(Issued|Dep'?t\.?)$/i.test(l)) {
      const next = lines
        .slice(i + 1, i + 5)
        .find((s) => /Dep'?t|기술부|QM|QA/i.test(s) && !/^(Issued|Dep'?t\.?)$/i.test(s));
      if (next) out.dept = next.trim();
    }

    /* 「Page of 48」 — 원본이 몇 쪽짜리인지 */
    if (!out.pages) {
      const m = l.match(/^Page\s*of\s*(\d+)/i);
      if (m) out.pages = m[1];
    }

    /* 한글 제목은 결재란 아래에 따로 있다 */
    if (!out.subjectKo && /(절차서|지침서)\s*$/.test(l) && l.length <= 40) {
      out.subjectKo = fixTitleKo(l);
    }
  }
  return out;
}

/* ---- 영문 다음 한글로 엮기 ---- */

function splitSections(blocks) {
  const out = [];
  let cur = { key: "", blocks: [] };
  out.push(cur);

  for (const b of blocks) {
    const m = b.t === "p" && b.s.match(SECTION);
    if (m) {
      cur = { key: m[1], blocks: [] };
      out.push(cur);
    }
    cur.blocks.push(b);
  }
  return out.filter((s) => s.blocks.length);
}

const glyphCount = (blocks, re) =>
  flatten(blocks).join(" ").split("").filter((c) => re.test(c)).length;

/*
 * 1줄 2칸 표에서 왼쪽이 영문, 오른쪽이 한글이면 항목별로 엮는다.
 * 짝이 안 맞는 항목은 있는 대로 이어 붙인다.
 */
function weave(table) {
  if (table.rows !== 1 || table.cols !== 2) return null;

  const left = table.grid[0][0];
  const right = table.grid[0][1];
  if (!left || left === "covered" || !right || right === "covered") return null;

  const en = left.blocks;
  const ko = right.blocks;
  if (en.length < 3 || ko.length < 3) return null;

  /* 왼쪽은 영문이 많고 오른쪽은 한글이 많아야 한다 */
  if (glyphCount(en, LATIN) < glyphCount(en, HANGUL)) return null;
  if (glyphCount(ko, HANGUL) < glyphCount(ko, LATIN)) return null;

  const enSec = splitSections(en);
  const koSec = splitSections(ko);
  if (enSec.length < 2) return null;

  /*
   * 한글 항목을 열쇠별로 줄 세운다.
   *
   * 예전에는 열쇠 하나에 한 항목만 담아, 같은 번호가 두 번 나오면
   * 뒤엣것이 통째로 사라졌다. 줄로 담아 앞에서부터 하나씩 꺼낸다.
   */
  const koQueue = new Map();
  for (const s of koSec) {
    if (!s.key) continue;
    if (!koQueue.has(s.key)) koQueue.set(s.key, []);
    koQueue.get(s.key).push(s);
  }

  const taken = new Set();
  const out = [];

  /*
   * 머리.
   *
   * 본문은 쪽마다 2칸 표로 나뉘어 있어, 한글 칸이 앞 쪽에서 이어지는
   * 줄로 시작할 때가 있다. 그 줄에는 항목 번호가 없다. 예전에는
   * 이것을 통째로 버려 "(d) 검사 결과" 같은 줄이 사라졌다.
   * 영문 머리 다음에 그대로 놓는다.
   */
  let i = 0;

  if (enSec[0] && !enSec[0].key) {
    out.push(...enSec[0].blocks);
    i = 1;
  }

  for (const s of koSec) {
    if (s.key) break;
    out.push(...s.blocks);
    taken.add(s);
  }

  for (; i < enSec.length; i++) {
    const s = enSec[i];
    out.push(...s.blocks);

    const q = koQueue.get(s.key);
    if (q && q.length) {
      const k = q.shift();
      taken.add(k);
      out.push(...k.blocks);
    }
  }

  /*
   * 짝을 못 찾은 한글은 원본 차례 그대로 뒤에 붙인다.
   *
   * 한글이 "5.7.2항에 기술된" 처럼 쓰고 영문이 "5.7.2 Except as" 로
   * 쓰면 열쇠가 어긋난다. 자리는 조금 밀려도 글은 살린다.
   */
  for (const s of koSec) {
    if (taken.has(s)) continue;
    out.push(...s.blocks);
  }

  return out;
}

/*
 * 제목 줄에 표시를 단다.
 *
 * 번호가 붙었다고 다 제목이 아니다. 이 절차서는 본문 문단에도 번호를 단다.
 *
 *   1.0 SCOPE                                        <- 제목
 *   1.1 This procedure is to govern the continuous …  <- 본문
 *   4.1 Examination Medium                            <- 제목
 *
 * 길이로만 가르면 안 된다. 같은 1.2 인데 영문은 길어서 본문, 한글은
 * 짧아서 제목이 되어 한쪽만 굵고 파랗게 나왔다.
 *
 * 가름
 *   N.0 은 언제나 제목이다 (1.0 SCOPE, 2.0 REFERENCES)
 *   그 밖에는 짧고 문장으로 끝나지 않아야 제목이다
 */
const ENDS_SENTENCE = /[.。]\s*$|다\.?\s*$|[,、]\s*$/;

/*
 * 한 자리 항목. "1. Scope" "10. DOCUMENTATION"
 *
 * TOFD 절차서는 1.0 이 아니라 1. 로 번호를 단다. 두 자리만 보다가
 * 제목을 하나도 못 잡아, 그 문서만 굵은 줄 없이 밋밋했다.
 * 뒤에 반드시 빈칸과 글자가 와야 한다. 그래야 "2.25 MHz" 같은
 * 숫자를 제목으로 잘못 잡지 않는다.
 */
const ONE_LEVEL = /^(\d{1,2})\.\s+\S/;

function sectionKey(s) {
  const m = s.match(SECTION);
  if (m) return m[1];

  const one = s.match(ONE_LEVEL);
  return one ? one[1] : null;
}

/*
 * 번호 바로 뒤에 조사가 붙으면 제목이 아니라 본문이다.
 *
 *   5.5.3항에 규정한 대비 시험편의 …
 *
 * ECT 절차서에 이런 줄이 있다. 마침표 없이 끊겨 있어 문장 끝 검사에
 * 안 걸리고, 55자보다 짧아 제목으로 굵게 찍혔다.
 */
const PARTICLE_AFTER_NUMBER = /^(?:\d+\.)*\d+\.?[가-힣]/;

function isHeading(s) {
  const key = sectionKey(s);
  if (!key) return false;

  if (PARTICLE_AFTER_NUMBER.test(s)) return false;

  /* 1.0 2.0 처럼 큰 항목 */
  if (/^\d{1,2}\.0(?:[\s.]|$)/.test(s)) return true;

  return s.length <= 55 && !ENDS_SENTENCE.test(s);
}

/*
 * 항목 제목을 한 꼴로 맞춘다.
 *
 * 원본이 절차서마다 다르다.
 *   1.0 SCOPE(개요)      MT·RT·PT·VT
 *   1.0 SCOPE (개요)     UT
 *   1.0 SCOPE(개 요)     E01
 *   1.0 SCOPE 적용범위   RFT
 *   1.0 Scope 적용범위   ECT
 *
 * 영문 뒤에 오는 한글 풀이는 언제나 「영문 (한글)」로 둔다. 말은 원본
 * 그대로 두고 빈칸과 묶음표만 손본다.
 */
function tidyHeading(s) {
  let t = String(s).replace(/\s+/g, " ").trim();

  /* 「개 요」처럼 두 글자를 벌려 쓴 것 */
  t = t.replace(/\(\s*([가-힣])\s+([가-힣])\s*\)/g, "($1$2)");

  /* 영문 다음에 묶음표 없이 붙은 한글 풀이 */
  t = t.replace(
    /^((?:\d+\.)*\d+\.?\s+[^가-힣(]+?)\s+([가-힣][가-힣\s·]*)$/,
    (_, head, ko) => `${head.trim()} (${ko.trim()})`
  );

  /* 묶음표 앞에는 빈칸 하나 */
  t = t.replace(/\s*\(/, " (");

  return t;
}

function markHeadings(blocks) {
  return blocks.map((b) => {
    if (b.t !== "p" || !isHeading(b.s)) return b;
    const key = sectionKey(b.s);
    return { t: "h", level: key.split(".").length >= 3 ? 3 : 2, s: tidyHeading(b.s) };
  });
}

/* ---- 굽기 ---- */

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const table = {};
const report = [];
const failed = [];
const koFixReport = [];
let shrunk = 0;
let tiny = 0;
let rescued = 0;

for (const name of fs.readdirSync(SRC).filter((f) => /\.hwp$/i.test(f))) {
  const file = path.join(SRC, name);

  let doc;
  try {
    doc = readRich(file);
  } catch (e) {
    report.push(`${name}: 읽기 실패 — ${e.message}`);
    continue;
  }

  const cover = readCover(flatten(doc.blocks));
  const code = cover.code || path.parse(name).name.toUpperCase();

  /* 그림을 내보낸다. 파일 이름은 BinData 번호로 건다 */
  const figures = [];
  const srcOf = new Map();
  /* 그림마다 픽셀 크기를 적어 둔다. 회사 로고를 크기로 찾을 때 쓴다 */
  const sizeOf = new Map();

  for (const im of doc.images) {
    let data = im.data;
    let ext = EXT[im.kind];

    /*
     * 브라우저가 못 그리는 형식은 바꿔 싣는다.
     *
     * 예전에는 통째로 뺐다. 그래서 TOFD 절차서만 도해 18장이 비었다.
     * 열어 보니 되살릴 수 있는 것들이었다.
     *
     *   PCX 11장   표지 로고. 아홉 문서에 같은 것이 들어 있다
     *   WMF 18장   벡터가 아니라 스캔 그림을 WMF 껍데기에 싼 것
     *   OLE  3장   다른 프로그램에서 붙여 넣은 그림. 속에 BMP·WMF
     */
    if (!DRAWABLE.has(im.kind)) {
      let got = null;

      if (isPcx(im.data)) {
        const png = pcxToPng(im.data);
        if (png) got = { ext: "png", data: png };
      } else if (isWmf(im.data)) {
        const png = wmfToPng(im.data);
        if (png) got = { ext: "png", data: png };
      } else if (isOle(im.data)) {
        got = oleToImage(im.data);
      }

      if (!got) {
        failed.push(`${code} binId ${im.binId}: ${im.kind} 를 못 바꿈 (뺌)`);
        continue;
      }

      shrunk += Math.max(0, im.data.length - got.data.length);
      rescued++;
      data = got.data;
      ext = got.ext;
    }

    /*
     * hwp 안의 BMP 는 압축이 하나도 안 돼 있다. 절차서 9편에서
     * 79장이 80MB 였다. PNG 로 바꾼다.
     */
    if (im.kind === "bmp") {
      const png = bmpToPng(im.data);
      if (png) {
        shrunk += im.data.length - png.length;
        data = png;
        ext = "png";
      } else {
        failed.push(`${code} binId ${im.binId}: BMP 를 못 바꿈 (그대로 둠)`);
      }
    }

    /* 글머리표·도장 조각은 본문에 얼룩으로만 보인다 */
    const [w, h] = pixelSize(data);
    if (w && h && (w < MIN_SIDE || h < MIN_SIDE)) {
      tiny++;
      continue;
    }

    const fname = `${code}_${im.binId}.${ext}`;
    fs.writeFileSync(path.join(OUT, fname), data);
    srcOf.set(im.binId, fname);
    sizeOf.set(fname, [w, h]);
    figures.push(fname);
  }

  /* 덩이를 다듬는다 */
  let woven = 0;

  function convert(blocks) {
    const out = [];

    for (const b of blocks) {
      if (b.t === "p") { out.push({ ...b, s: tidyKo(deglyph(b.s)) }); continue; }

      if (b.t === "img") {
        const src = srcOf.get(b.binId);
        if (src) out.push({ t: "img", src });
        continue;
      }

      if (b.t !== "table") continue;

      /* 본문이 담긴 2칸 표는 항목별로 엮어 편다 */
      const w = weave(b);
      if (w) {
        woven++;
        out.push(...markHeadings(convert(w)));
        continue;
      }

      out.push({
        t: "table",
        rows: b.rows,
        cols: b.cols,
        grid: b.grid.map((row) =>
          row.map((c) =>
            !c || c === "covered" ? c : { colSpan: c.colSpan, rowSpan: c.rowSpan, blocks: convert(c.blocks) }
          )
        ),
      });
    }
    return out;
  }

  let blocks = normalizeToc(
    stripCover(
      dropEmptyRows(
        markStamps(
          markLogoBySize(
            markCoverLogo(dropLooseCoverLogo(markHeadings(convert(doc.blocks)))),
            sizeOf
          )
        )
      )
    )
  );

  const ko = readKo(name);
  if (ko) blocks = weaveKo(blocks, ko);

  /* 절차서별 우리말 교정표 */
  const fixed = applyKoFix(blocks, code);
  blocks = fixed.blocks;

  if (fixed.total) {
    koFixReport.push(
      `${code}  우리말 교정 ${fixed.hit}/${fixed.total}줄` +
        (fixed.left.length ? `  ★ 못 찾은 줄 ${fixed.left.length}개` : "")
    );
    for (const s of fixed.left || []) koFixReport.push(`     ${s.slice(0, 70)}`);
  }

  const payload = {
    code,
    title: cover.subject || code,
    titleKo: cover.subjectKo,
    rev: cover.rev,
    date: cover.date,
    dept: cover.dept,
    pages: cover.pages,
    source: name,
    blocks,
  };

  fs.writeFileSync(path.join(OUT, `${code}.json`), JSON.stringify(payload) + "\n", "utf8");

  const entry = {
    title: cover.subject || code,
    titleKo: cover.subjectKo,
    rev: cover.rev,
    date: cover.date,
    dept: cover.dept,
    pages: cover.pages,
    doc: `${code}.json`,
  };
  table[code] = entry;
  for (const alias of ALIAS[code] || []) table[alias] = { ...entry };

  const tables = blocks.filter((b) => b.t === "table").length;
  const imgs = blocks.filter((b) => b.t === "img").length;

  report.push(
    `${name.padEnd(16)} -> ${code.padEnd(20)} ${(cover.rev || "").padEnd(6)}` +
      ` 덩이 ${String(blocks.length).padStart(4)}  표 ${String(tables).padStart(2)}` +
      `  그림 ${String(imgs).padStart(2)}/${String(figures.length).padStart(2)}  엮음 ${woven}` +
      ((ALIAS[code] || []).length ? `  (별칭: ${ALIAS[code].join(", ")})` : "")
  );
}

const manifest = {
  _읽어보기:
    "tools/build-procedures.mjs 가 만든 파일입니다. 손으로 고치지 말고 절차서 hwp 를 고친 뒤 다시 돌리세요.",
  procedures: table,
};

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(report.join("\n"));
if (koFixReport.length) console.log("\n" + koFixReport.join("\n"));
console.log(`\n등록한 이름 ${Object.keys(table).length}개`);
if (shrunk) console.log(`BMP 를 PNG 로 바꿔 ${(shrunk / 1048576).toFixed(1)} MB 를 줄였다`);
if (tiny) console.log(`너무 작아 뺀 그림 ${tiny}장 (글머리표·도장 조각)`);
if (rescued) console.log(`PCX·WMF·OLE 에서 되살린 그림 ${rescued}장`);
if (failed.length) console.log("\n" + failed.join("\n"));
