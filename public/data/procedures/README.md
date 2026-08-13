# 절차서

문항이 "이 절차서를 보고 풀라"고 가리키는 HIE 사내 절차서를 여기에 넣습니다.

넣어 두면 시험 화면에서 묶음 지시문에 적힌 **절차서 이름이 눌리는 글자**가
되고, 누르면 계산기처럼 창이 떠서 절차서를 볼 수 있습니다. 문항을 가리면
머리를 끌어 옆으로 옮깁니다. `Esc` 로 닫고 `←` `→` 로 쪽을 넘깁니다.

넣지 않아도 시험은 그대로 돌아갑니다. 그때는 절차서 이름이 그냥 글자로만
나오고, 응시자는 종이 절차서를 따로 받아야 합니다.

## 인쇄 부록은 지금 꺼져 있다

문제은행·관리자 출력 뒤에 절차서를 부록으로 붙이는 기능도 들어 있지만
쪽수가 너무 늘어나 꺼 뒀습니다. 켜려면 `src/ProcedureAppendix.jsx` 맨 위의

```js
export const PRINT_APPENDIX = false;
```

를 `true` 로 바꿉니다. 그러면 뽑힌 문항이 실제로 가리키는 절차서만
문제지 맨 뒤에 붙습니다.

## 넣는 방법

### 1. 절차서를 쪽마다 그림으로 만든다

hwp 나 pdf 는 인쇄 화면에 그대로 못 싣는다. 쪽마다 png 로 저장한다.

- 한글: `파일 > 다른 이름으로 저장 > PNG`
- PDF: 아크로뱃에서 `내보내기 > 이미지 > PNG` (해상도 150dpi 이상)

파일 이름은 아무렇게나 지어도 되지만, 아래처럼 절차서 이름과 쪽 번호를
넣어 두면 나중에 알아보기 쉽다.

```
HIE-NDT-MT-N21_p1.png
HIE-NDT-MT-N21_p2.png
```

그림 파일은 이 폴더(`public/data/procedures/`)에 그대로 둔다.

### 2. index.json 에 등록한다

`procedures` 안에 절차서 이름을 열쇠로 넣는다. 열쇠는 문항 지시문에
적힌 이름과 **똑같이** 쓴다. `Rev` 는 빼고 적는다.

```json
{
  "procedures": {
    "HIE-NDT-MT-N21": {
      "title": "자분탐상시험 절차서 (ASME Sec.Ⅲ)",
      "rev": "Rev.2",
      "pages": ["HIE-NDT-MT-N21_p1.png", "HIE-NDT-MT-N21_p2.png"]
    }
  }
}
```

| 칸 | 뜻 |
| --- | --- |
| 열쇠 | 지시문에 적힌 절차서 이름. `HIE-NDT-MT-N21` |
| `title` | 부록 첫 줄에 나올 이름. 없으면 열쇠를 쓴다 |
| `rev` | 개정 번호. 없어도 된다 |
| `pages` | 쪽 그림 파일 이름. 적은 차례대로 인쇄된다 |

`_보기` 와 `_읽어보기` 는 설명용이라 지워도 되고 둬도 된다.

열쇠를 잘못 적으면 이름이 안 눌린다. 지시문에 `HIE-NDT-MT-N21` 이라고
적혀 있으면 열쇠도 `HIE-NDT-MT-N21` 이어야 한다. `Rev` 는 뺀다.

### 3. 확인한다

```
node tools/refdoc-audit.mjs
```

어느 절차서가 아직 안 들어왔는지, 등록했는데 그림 파일이 없는지 알려 준다.

## 지금 필요한 절차서

`tools/refdoc-audit.mjs` 를 돌리면 최신 목록이 나온다. 2026년 8월 기준 15종이다.

| 절차서 | 과목 |
| --- | --- |
| `HIE-QP-E01` | ECT, RFT, VT |
| `HIE-NDT-ET-P11` | ECT, RFT |
| `HIE-NDT-PAUT-P11` | PAUT |
| `HIE-NDT-P11` | TOFD |
| `HIE-NDT-MT-N21` `HIE-NDT-MT-P11` `HIE-NDT-MT-P6A` `HIE-NDT-MT-AP5L` | MT |
| `HIE-NDT-PT-N21` `HIE-NDT-PT-P11` `HIE-NDT-PT-P6A` | PT |
| `HIE-NDT-RT-N21` `HIE-NDT-RT-P11` | RT |
| `HIE-NDT-UT-N21` `HIE-NDT-UT-P11` | UT |

같은 절차서라도 문항마다 `Rev.1` `Rev.2` `Rev.3` 이 섞여 나온다.
개정판마다 답이 다르면 `HIE-NDT-PT-P11 Rev.1` 처럼 열쇠를 나눠 등록해도 된다.

`ASME Sec.Ⅷ` `API 6A` `ASME B16.34` 같은 규격집은 응시자가 지참하는
자료라 여기 넣지 않는다.
