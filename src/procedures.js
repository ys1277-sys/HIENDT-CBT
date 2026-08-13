/*
 * 절차서 부록.
 *
 * 문항 지시문은 "HIE-NDT-MT-N21 (Rev.2) 절차서를 보고 풀라" 고만 하고,
 * 정작 그 절차서는 시험장에서 따로 나눠 주는 인쇄물이라 앱에 없다.
 *
 * public/data/procedures/index.json 에 절차서를 등록해 두면
 * 문제은행·관리자 출력 뒤에 부록으로 붙는다. 등록하지 않으면
 * 부록 없이 지금까지대로 나온다.
 *
 * 뽑힌 문항이 실제로 가리키는 절차서만 붙인다. 25문항짜리 시험지에
 * 안 쓰는 절차서까지 다 붙으면 인쇄물이 쓸데없이 두꺼워진다.
 */

/*
 * 지시문에서 절차서 이름을 뽑는다.
 * "HIE-NDT-MT-N21 (Rev.2)" 든 "HIE-NDT-MT-N21(Rev.2)" 든 이름만 본다.
 * ASME·API 같은 규격집은 응시자가 지참하니 여기서 뺀다.
 */
const CODE = /HIE-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g;

export function procedureCodes(questions) {
  const found = [];

  for (const q of questions || []) {
    const note = q && q.groupNote;
    if (!note) continue;

    for (const m of String(note).match(CODE) || []) {
      if (!found.includes(m)) found.push(m);
    }
  }
  return found;
}

/*
 * 등록된 절차서 가운데 이 시험지가 쓰는 것만 고른다.
 *
 * 열쇠는 지시문에 적힌 이름과 똑같이 쓰기로 했지만, 개정판을 나눠
 * 등록할 수도 있어서("HIE-NDT-PT-P11 Rev.1") 앞부분이 맞으면 받아 준다.
 */
export function pickProcedures(manifest, questions) {
  const table = (manifest && manifest.procedures) || null;
  if (!table) return [];

  const codes = procedureCodes(questions);
  const picked = [];

  for (const code of codes) {
    const key =
      Object.prototype.hasOwnProperty.call(table, code)
        ? code
        : Object.keys(table).find((k) => k.startsWith(code));

    if (!key) continue;

    const item = table[key] || {};
    const pages = item.pages || [];

    /*
     * 절차서는 두 가지로 들어온다.
     *   doc    hwp 에서 뽑은 본문 문서 (tools/build-procedures.mjs)
     *   pages  쪽마다 뜬 그림
     * 둘 다 없으면 보여 줄 것이 없다.
     */
    if (!item.doc && !pages.length) continue;
    if (picked.some((p) => p.key === key)) continue;

    picked.push({
      key,
      code,
      title: item.title || key,
      rev: item.rev || "",
      doc: item.doc || "",
      pages,
    });
  }
  return picked;
}

/* 본문 문서를 읽는다 */
export async function loadDoc(file) {
  try {
    const res = await fetch(
      import.meta.env.BASE_URL +
        "data/procedures/" +
        String(file).replace(/^\//, "") +
        "?v=" +
        __BUILD_ID__
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/*
 * 절차서 목록을 읽는다.
 *
 * 파일이 없거나 비어 있어도 오류로 보지 않는다. 절차서를 아직 안 넣은
 * 상태가 정상이고, 그때는 부록 없이 인쇄되면 된다.
 */
export async function loadProcedures() {
  try {
    const res = await fetch(
      import.meta.env.BASE_URL +
        "data/procedures/index.json?v=" +
        __BUILD_ID__
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* 쪽 그림의 실제 주소 */
export function pageSrc(file) {
  return (
    import.meta.env.BASE_URL +
    "data/procedures/" +
    String(file).replace(/^\//, "")
  );
}
