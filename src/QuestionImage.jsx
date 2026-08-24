import React, { useState } from "react";

/*
 * 문항 도해(그림) 표시
 *
 * 데이터에서는 두 가지 표기를 모두 받는다.
 *   "image":  "UT_SPECIFIC_B_Q16.png"
 *   "images": ["UT_SPECIFIC_B_Q16.png", "UT_SPECIFIC_B_Q16b.png"]
 *
 * 실제 파일은 public/data/images/ 아래에 둔다.
 * 배포 base 가 '/HIENDT-CBT/' 이므로 BASE_URL 을 반드시 앞에 붙여야 한다.
 */

const IMAGE_DIR = "data/images/";

export function questionImages(q) {
  const raw = q && (q.images ?? q.image);

  if (!raw) return [];

  return (Array.isArray(raw) ? raw : [raw])
    .map(s => String(s || "").trim())
    .filter(Boolean);
}

function resolve(src) {
  // 절대 URL 이나 data: 는 그대로 쓴다
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;

  return (
    import.meta.env.BASE_URL +
    IMAGE_DIR +
    src.replace(/^\/+/, "")
  );
}

/*
 * zoomable 은 시험 화면에서만 켠다.
 *
 * 휴대폰에서는 문제 칸이 351px 라, 원본 988x425 짜리 도해(MT General
 * FIG1)가 351x152 로 줄어 글자를 못 읽는다. 눌러서 원본 크기로 볼 수
 * 있게 한다. 원본이 화면보다 넓으면 덮개 안에서 밀어 보면 된다.
 *
 * 인쇄 쪽(PrintExam·PrintAdminExam)은 끈 채로 둔다. 종이에는 누를 수도
 * 없고, 인쇄 페이지 분할이 그림 높이를 재는데 덮개가 끼면 곤란하다.
 */
function QuestionImage({ q, className = "question-image", zoomable = false }) {
  /* 훅은 early return 보다 먼저 — 문항마다 그림 유무가 달라진다 */
  const [zoomed, setZoomed] = useState(null);

  const list = questionImages(q);

  if (list.length === 0) return null;

  return (
    <div className={className}>

      {
        list.map((src, i) => (
          <img
            key={i}
            src={resolve(src)}
            alt=""
            className={zoomable ? "zoomable" : undefined}
            title={zoomable ? "눌러서 크게 보기" : undefined}
            onClick={zoomable ? () => setZoomed(i) : undefined}
            /*
             * 인쇄 페이지 분할이 각 문항의 실제 높이를 재서 이뤄지므로
             * 지연 로딩을 쓰면 안 된다. 측정 시점에 이미 그려져 있어야 한다.
             */
            loading="eager"
          />
        ))
      }


      {
        zoomed !== null &&

        <div
          className="img-zoom"
          onClick={() => setZoomed(null)}
        >

          <img
            src={resolve(list[zoomed])}
            alt=""
          />

          <button
            type="button"
            className="img-zoom-close"
            onClick={() => setZoomed(null)}
          >
            닫기
          </button>

        </div>
      }

    </div>
  );
}

export default QuestionImage;
