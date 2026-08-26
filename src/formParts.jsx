/*
 * 회사 서식의 공통 조각
 *
 * E02·E03 의 양식(EXHIBIT)은 머리와 꼬리가 같은 꼴이다.
 *   맨 위    □ 관리본  □ 비관리본  Controlled Copy For Reference | 관리 번호
 *   제목줄   한글 이름 / 영문 이름 / 문서번호
 *   맨 아래  작성자 · 검토자 · 승인자 서명란
 *
 * 서식마다 따로 그리면 한 곳을 고칠 때 세 곳을 손봐야 한다.
 * 여기 모아 두고 각 서식은 가운데 내용만 채운다.
 *
 * 스타일은 print.css 의 .rp-* 를 함께 쓴다.
 */
import React from "react";

/*
 * 네모 칸.
 *
 * 시스템이 아는 사실만 채운다. 승인·확인처럼 사람이 판단하는 칸은
 * 비운 채로 인쇄한다 — 채워 두면 승인이 있었던 것처럼 보인다.
 */
export function Box({ on, children }) {
  return (
    <span className="rp-box">
      <span className="rp-mark">{on ? "■" : "□"}</span>
      {children}
    </span>
  );
}

/* 관리본 / 관리 번호 줄. 둘 다 사람이 정하는 값이라 비운다 */
export function ControlRow() {
  return (
    <table className="rp-control">
      <tbody>
        <tr>
          <td>
            <Box>관리본</Box>
            <Box>비관리본</Box>
            <span className="rp-en">Controlled Copy For Reference</span>
          </td>
          <td className="rp-ctrl-no">관리 번호 :</td>
        </tr>
      </tbody>
    </table>
  );
}

export function FormHead({ title, titleEn, code, page, pageCount }) {
  return (
    <div className="rp-head">
      <div className="rp-title">
        {title}
        <span>{titleEn}</span>
      </div>

      <div className="rp-code">
        {code}
        {pageCount > 1 ? (
          <span className="rp-page">{page} / {pageCount}</span>
        ) : null}
      </div>
    </div>
  );
}

/*
 * 서명란.
 *
 * 직책은 서식이 정해 둔 것이라 미리 적고, 성명·서명·일자는 비운다.
 * roles 는 [["작 성 자", "NDE Level Ⅲ / QA"], …] 꼴이다.
 */
export function SignFooter({ roles }) {
  return (
    <table className="rp-sign">
      <tbody>
        <tr>
          <th />
          {roles.map(([who]) => (
            <th key={who}>{who}</th>
          ))}
        </tr>
        <tr>
          <th>직 책</th>
          {roles.map(([who, title]) => (
            <td key={who} className="c">{title}</td>
          ))}
        </tr>
        <tr className="rp-signrow">
          <th>성명 / 서명</th>
          {roles.map(([who]) => (
            <td key={who} />
          ))}
        </tr>
        <tr>
          <th>일 자</th>
          {roles.map(([who]) => (
            <td key={who} />
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/* 표를 채울 빈 줄. 서식이 정한 줄 수만큼 손으로 적을 자리를 남긴다 */
export function padRows(rows, min) {
  const out = [...rows];
  while (out.length < min) out.push(null);
  return out;
}
