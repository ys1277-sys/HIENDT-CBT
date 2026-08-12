import React from "react";

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

function QuestionImage({ q, className = "question-image" }) {
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
            /*
             * 인쇄 페이지 분할이 각 문항의 실제 높이를 재서 이뤄지므로
             * 지연 로딩을 쓰면 안 된다. 측정 시점에 이미 그려져 있어야 한다.
             */
            loading="eager"
          />
        ))
      }
    </div>
  );
}

export default QuestionImage;
