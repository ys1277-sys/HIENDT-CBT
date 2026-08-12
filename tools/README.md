# tools — 시험지(HWP) 판독 및 문제 데이터 구축

`public/data/**.json` 은 원본 한글 시험지(HWP)에서 뽑아 만든다.
그 작업에 쓰는 도구들이다. 앱 빌드와는 무관하며 필요할 때만 직접 실행한다.

원본 시험지 위치 (경로가 코드에 박혀 있다)

```
D:\Visual Studio Code\Level II 문제\      Genernal(40문항) / Specific(25문항) / B16.34(밸브)
D:\Visual Studio Code\Level III 문제\     basic / B16.34(밸브) / 문항추가
```

## 왜 직접 만들었나

HWP 5.0 은 OLE 복합문서이고 본문은 raw-deflate 로 압축돼 있다.
변환 도구(LibreOffice, pandoc 등)가 이 PC 에 없어서,
프로젝트에 이미 있던 `cfb` 와 Node 내장 `zlib` 으로 직접 읽는다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `hwplib.mjs` | HWP 판독기 + 시험지 파서. 본문·이미지·그림 앵커를 뽑고 문항/선택지로 나눈다 |
| `anskey.mjs` | 답지 파서. 시험지마다 형식이 달라 세 가지(블록형·격자형·자동)를 모두 시도한다 |
| `img.mjs` | BMP·PCX → PNG 변환. 외부 도구 없이 Node 내장 zlib 만 쓴다 |
| `apply-subject.mjs` | 과목 하나를 원본에서 재구축해 JSON 에 반영 |
| `subject.mjs` | 과목 하나를 검수용 마크다운으로 출력 (반영하지 않음) |
| `merge-kr.mjs` | `question_kr` 등 별도 키에 있는 한글을 `question` 에 합침 |
| `boiler-hashes.mjs` | 로고·서명처럼 여러 검사법 시험지에 공통으로 나오는 이미지의 해시를 뽑음 |
| `verify.mjs` | 앱의 채점 규칙대로 24개 파일 전부 검증 |
| `anskey-test.mjs` | 49개 시험지의 답지 파싱 상태 점검 |
| `report.mjs` | 49개 시험지의 문항·선택지·이미지 집계 |
| `broken-count.mjs` | 답지에 다른 문항이 섞여 들어간 항목 탐지 |
| `untranslated.mjs` | 한글 번역이 없는 문항 목록 |
| `held-list.mjs` | 보류 문항을 중복 제거해 출력 |

## 쓰는 법

```bash
cd tools

node verify.mjs                          # 채점 검증 — 전부 100점이어야 정상
node anskey-test.mjs                     # 답지 파싱 상태
node broken-count.mjs                    # 깨진 답지 항목 (0이어야 정상)

node subject.mjs General RT              # 검수용 문서만 생성
node apply-subject.mjs General RT         # dry-run
node apply-subject.mjs General RT --apply # 실제 반영
node apply-subject.mjs General RT --apply --skip   # 채점 불가 문항은 빼고 반영

node boiler-hashes.mjs                   # boiler-hashes.json 갱신
node merge-kr.mjs --apply                # 숨은 한글 번역을 화면에 살림
```

`--apply` 없이는 아무것도 쓰지 않는다.

## 데이터 형식

```json
{
  "id": 1,
  "level": "Level II",
  "method": "RT",
  "category": "General",
  "question": "The kilovoltage applied to an X-ray tube affects:\n엑스선관에 적용한 전압은?",
  "options": ["the quality of the beam\n빔의 질", "..."],
  "answer": 2,
  "image": "RT_GENERAL_A_Q5.png",
  "groupNote": "※ Answers to questions 1 through 4 ...\n(1번부터 4번까지 ...)"
}
```

- `question` / `options` 는 `영문\n한글`. 앱이 줄바꿈으로 나눠 표시한다
- `answer` 는 0-based. 배열이면 복수정답, 문자열이면 주관식
- 선택지 텍스트에 `A. ` 같은 접두사를 넣지 않는다. 앱이 1·2·3·4 를 그린다
- `groupNote` 는 여러 문항에 걸치는 지시문. 해당 문항마다 표시된다

## 알아둘 것

원본 시험지는 표기가 제각각이라 파서가 그만큼 너저분하다. 겪은 것들:

- 문항 번호가 한글 자동번호라 본문에 없는 시험지 (ECTS-II, RFTS-II) — 자동 추출 불가
- 선택지가 2단 배치라 문서 순서가 `a, c, b, d`
- 선택지 라벨이 `A, B, D, D` 로 잘못 붙은 문항
- 답지가 문서 중간에 있고 그 뒤로 문항이 이어지는 시험지
- 답지 칸이 좁아 답이 두 줄로 나뉜 경우 (`1/16 in.` + `(1.5 mm)`)
- 칸에 안 들어가 `#1` 만 쓰고 표 아래에 실제 답을 적은 각주
- 그림이 선 그림(이미지)과 라벨(한글 도형)로 나뉘어 있어 이미지만 뽑으면 글자가 빠짐

파서를 고칠 때는 `anskey-test.mjs` 와 `verify.mjs` 를 함께 돌려
한쪽을 고치다 다른 쪽이 깨지지 않는지 확인한다.
