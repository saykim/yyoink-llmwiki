# yyoink-wiki 사용자 설명서

이 문서는 yyoink-wiki를 처음 설치한 사용자가 바로 자료를 수집하고, Topic Wiki를 정리하고, ChatGPT/Claude에 붙여넣을 Prompt Pack을 만들 수 있도록 작성되었습니다.

## 1. yyoink-wiki는 무엇인가

yyoink-wiki는 웹에서 찾은 문장, 페이지 본문, 메모, 클립보드 내용을 주제별로 모아 개인 위키와 Prompt Pack으로 정리하는 Chrome 확장 프로그램입니다.

기본 사용 방식은 API key가 필요 없습니다.

1. 웹에서 자료를 Source로 모읍니다.
2. Topic별로 자료를 분류합니다.
3. Wiki 탭에서 Topic Wiki를 직접 정리합니다.
4. Evidence 탭에서 저장한 자료 안에서 근거를 찾습니다.
5. Copy Prompt Pack으로 ChatGPT/Claude에 붙여넣을 프롬프트 패키지를 만듭니다.

OpenAI API를 직접 호출하는 Cloud 기능은 선택 사항입니다. 처음 사용하는 경우에는 `Cloud Generate`, `Cloud Update`를 쓰지 않아도 됩니다.

## 2. 용어 정리

| 용어 | 의미 |
| --- | --- |
| Source | 웹에서 저장한 선택 텍스트, 페이지 본문, 메모, 클립보드 텍스트입니다. |
| Topic | 하나의 조사 주제입니다. 자료를 나누는 기본 단위입니다. |
| Topic Wiki | 한 Topic 안의 Source를 읽고 사용자가 직접 정리한 Markdown 위키입니다. |
| Evidence | 외부 AI를 호출하지 않고 현재 Topic의 Wiki와 Source 안에서 관련 근거를 검색하는 기능입니다. |
| Prompt Pack | 현재 Topic의 Wiki, Source Library, 질문을 ChatGPT/Claude에 붙여넣기 좋게 묶은 텍스트입니다. |
| Cloud AI | OpenAI API key를 넣은 사용자만 선택적으로 쓰는 직접 API 호출 기능입니다. |

## 3. 설치하기

현재 개발 버전은 Chrome의 압축해제된 확장 프로그램으로 불러와 사용할 수 있습니다.

1. Chrome을 엽니다.
2. 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위 `Developer mode`를 켭니다.
4. `Load unpacked`를 누릅니다.
5. 이 프로젝트 폴더를 선택합니다.
   - 폴더 예시: `/Users/kimsy/DataScience/01_Projects/Web_Applications/context_pilot`
   - `manifest.json` 파일이 들어 있는 최상위 폴더를 선택해야 합니다.
6. 확장 프로그램 목록에 `yyoink-wiki`가 보이면 설치가 끝난 것입니다.
7. Chrome 툴바에서 yyoink-wiki 아이콘을 눌러 사이드 패널을 엽니다.

단축키가 설정되어 있으면 `Command+Shift+P`로도 사이드 패널을 열 수 있습니다. Windows/Linux에서는 `Ctrl+Shift+P`입니다.

## 4. 첫 사용 빠른 시작

처음에는 아래 순서대로만 사용하면 됩니다.

1. yyoink-wiki 사이드 패널을 엽니다.
2. 상단 Topic 선택 영역에서 `All Topics`를 누릅니다.
3. `New`를 눌러 새 Topic을 만듭니다.
   - 예: `AI 검색 제품 조사`, `논문 리뷰`, `블로그 글감`
4. 조사할 웹페이지로 이동합니다.
5. 필요한 문장을 드래그합니다.
6. 우클릭 후 `Save to yyoink-wiki`에서 방금 만든 Topic을 선택합니다.
7. 사이드 패널의 `Sources` 탭에서 저장된 Source를 확인합니다.
8. 자료를 몇 개 더 저장합니다.
9. `Wiki` 탭으로 이동합니다.
10. `Edit Wiki`를 누르고 저장한 자료를 읽으며 Topic Wiki를 정리합니다.
11. `Save Wiki`를 누릅니다.
12. `Copy Prompt Pack`을 누릅니다.
13. ChatGPT 또는 Claude 웹앱에 붙여넣고 원하는 작업을 요청합니다.

이 흐름이 yyoink-wiki의 기본 사용법입니다.

## 5. 사이드 패널 화면 구성

### 상단 영역

- `yyoink-wiki`: 현재 확장 프로그램 이름입니다.
- 커피 버튼: 제작자 후원 링크입니다.
- 설정 버튼: 테마, 선택적 OpenAI API key, 모델 설정을 엽니다.
- Topic 선택 영역: 현재 작업할 Topic을 고릅니다.

### Sources 탭

Source를 수집하고 관리하는 곳입니다.

- `Capture`: 현재 페이지 본문을 추출해 Source로 저장합니다.
- `Copy`: 현재 필터링된 Source를 모두 클립보드에 복사합니다.
- 자물쇠 아이콘: 복사 방지 해제 기능입니다.
- 커서 아이콘: 현재 선택된 텍스트를 강제로 추출해 저장합니다.
- 연필 아이콘: 직접 메모를 Source로 저장합니다.
- 클립보드 아이콘: 클립보드 내용을 Source로 저장합니다.
- 검색창: 저장된 Source를 검색합니다.
- `Import`: 백업 파일이나 텍스트 파일을 가져옵니다.
- `Export`: JSON, Markdown, Plain Text 형식으로 내보냅니다.

### Wiki 탭

현재 Topic의 위키와 Prompt Pack을 관리하는 곳입니다.

- `Edit Wiki`: Topic Wiki를 Markdown으로 직접 작성하거나 수정합니다.
- `Copy Prompt Pack`: 현재 Topic의 Wiki와 Source Library를 ChatGPT/Claude용 프롬프트로 복사합니다.
- `Cloud Generate`: 선택적 OpenAI API 기능입니다. API key가 없으면 사용할 필요가 없습니다.
- `Cloud Update`: 선택적 OpenAI API 기능입니다.
- `Review Draft`: Cloud AI가 만든 초안을 검토하고 승인 또는 거절합니다.

### Evidence 탭

현재 Topic 안에서만 근거를 찾는 로컬 검색 화면입니다.

- 질문 입력창: 찾고 싶은 키워드나 질문을 입력합니다.
- `Find Evidence`: Topic Wiki와 Source에서 관련 근거를 찾습니다.
- `Copy Prompt Pack`: 입력한 질문을 포함한 Prompt Pack을 복사합니다.

Evidence는 ChatGPT/Claude에 질문하는 기능이 아닙니다. 저장한 자료 안에서 관련 근거를 찾아주는 Evidence Finder입니다.

## 6. Topic 만들고 선택하기

Topic은 자료를 나누는 기본 단위입니다.

1. 상단의 `All Topics` 또는 현재 Topic 이름을 누릅니다.
2. 드롭다운에서 `New`를 누릅니다.
3. Topic 이름을 입력합니다.
4. 색상을 선택합니다.
5. `Create Topic`을 누릅니다.

이후 저장하는 Source는 선택된 Topic에 들어갑니다. `All Topics` 상태에서는 전체 Source를 볼 수 있지만, Wiki와 Prompt Pack 작업은 특정 Topic을 선택하고 하는 것이 좋습니다.

권장 방식:

- 하나의 글, 조사, 업무 주제마다 Topic을 하나 만듭니다.
- 너무 큰 Topic 하나에 모든 자료를 넣지 않습니다.
- ChatGPT/Claude에 넘길 단위로 Topic을 나눕니다.

## 7. Source 저장하기

### 방법 1. 우클릭으로 선택 텍스트 저장

가장 기본적인 저장 방식입니다.

1. 웹페이지에서 저장할 문장을 드래그합니다.
2. 우클릭합니다.
3. `Save to yyoink-wiki`를 선택합니다.
4. 저장할 Topic을 선택합니다.

저장되는 정보:

- 선택한 텍스트
- 페이지 제목
- URL
- 도메인
- 저장 시각
- 연결된 Topic

### 방법 2. 현재 페이지 전체 캡처

긴 글이나 아티클 전체를 저장할 때 사용합니다.

1. 저장할 페이지를 엽니다.
2. 사이드 패널에서 저장할 Topic을 선택합니다.
3. `Sources` 탭에서 `Capture`를 누릅니다.

페이지 본문 추출이 실패하면 페이지를 새로고침한 뒤 다시 시도합니다.

### 방법 3. 메모 저장

내 생각, 요약, 오프라인 자료를 함께 저장할 때 사용합니다.

1. `Sources` 탭에서 연필 아이콘을 누릅니다.
2. 내용을 입력합니다.
3. 저장할 Topic을 선택합니다.
4. `Save Memo`를 누릅니다.

### 방법 4. 클립보드에서 저장

다른 앱에서 복사한 내용을 yyoink-wiki에 넣을 때 사용합니다.

1. 다른 앱이나 웹페이지에서 텍스트를 복사합니다.
2. yyoink-wiki 사이드 패널을 엽니다.
3. 저장할 Topic을 선택합니다.
4. `Sources` 탭에서 클립보드 아이콘을 누릅니다.

Chrome에서 클립보드 권한을 물어보면 허용해야 합니다.

### 방법 5. 복사 방지된 페이지에서 저장

일부 사이트는 드래그, 우클릭, 복사를 막습니다.

1. 해당 페이지를 엽니다.
2. `Sources` 탭에서 자물쇠 아이콘을 누릅니다.
3. 텍스트 선택이 가능해졌는지 확인합니다.
4. 필요한 문장을 선택해 우클릭 저장합니다.

일반 해제가 부족하면 자물쇠 아이콘을 길게 눌러 강력 모드를 사용할 수 있습니다. 강력 모드는 사이트 동작에 영향을 줄 수 있으므로 필요한 페이지에서만 사용하세요.

## 8. Topic Wiki 작성하기

Topic Wiki는 AI가 자동으로 만들어주는 문서가 아니라, 사용자가 저장한 Source를 보고 직접 정리하는 핵심 작업 공간입니다.

1. Topic을 선택합니다.
2. `Wiki` 탭으로 이동합니다.
3. `Edit Wiki`를 누릅니다.
4. 기본 템플릿을 참고해 내용을 작성합니다.
5. `Save Wiki`를 누릅니다.

권장 구조:

```markdown
# Topic 이름

## Summary

이 Topic에서 현재까지 파악한 핵심 내용을 3-5문장으로 적습니다.

## Key Notes

- 중요한 사실 1
- 중요한 사실 2
- 중요한 사실 3

## Evidence

- 어떤 Source에서 확인했는지 적습니다.
- 서로 충돌하는 내용이 있으면 함께 적습니다.

## Open Questions

- 아직 확인이 필요한 질문
- 추가로 찾아야 할 자료
```

좋은 Wiki 작성 방식:

- Source를 복사해 붙여넣기만 하지 말고, 내 말로 요약합니다.
- 사실과 추측을 구분합니다.
- 확인이 필요한 내용은 `Open Questions`에 남깁니다.
- 나중에 ChatGPT/Claude가 인용할 수 있도록 Source와 연결되는 단서를 남깁니다.

## 9. Evidence로 로컬 근거 찾기

Evidence는 현재 Topic 안에서만 검색합니다. 외부 AI를 호출하지 않으며 API key도 필요 없습니다.

사용 예:

1. Topic을 선택합니다.
2. `Evidence` 탭으로 이동합니다.
3. 질문을 입력합니다.
   - 예: `가격 정책 관련 근거`
   - 예: `보안 리스크`
   - 예: `Claude와 ChatGPT 비교`
4. `Find Evidence`를 누릅니다.
5. 검색 결과에서 관련 Source와 excerpt를 확인합니다.
6. 필요하면 `Open source`를 눌러 원문 페이지를 엽니다.

Evidence가 잘 찾지 못하는 경우:

- 질문을 짧은 키워드 중심으로 바꿉니다.
- Topic을 잘못 선택했는지 확인합니다.
- Source가 충분히 저장되어 있는지 확인합니다.
- Wiki에 관련 내용이 아직 없는지 확인합니다.

## 10. Prompt Pack 만들기

Prompt Pack은 yyoink-wiki의 가장 중요한 출력물입니다. 현재 Topic의 Wiki와 Source Library를 하나의 긴 프롬프트로 묶어 ChatGPT/Claude에 붙여넣을 수 있게 만듭니다.

### Wiki 탭에서 만들기

1. Topic을 선택합니다.
2. `Wiki` 탭으로 이동합니다.
3. Topic Wiki가 어느 정도 정리되어 있는지 확인합니다.
4. `Copy Prompt Pack`을 누릅니다.
5. ChatGPT 또는 Claude 웹앱을 엽니다.
6. 입력창에 붙여넣습니다.
7. 원하는 작업을 이어서 요청합니다.

예시 요청:

```text
위 자료만 근거로 해서 블로그 초안을 작성해줘.
근거가 부족한 주장은 "근거 부족"이라고 표시해줘.
마지막에 추가 조사 질문도 정리해줘.
```

### Evidence 탭에서 질문 포함 Prompt Pack 만들기

1. Topic을 선택합니다.
2. `Evidence` 탭으로 이동합니다.
3. 질문을 입력합니다.
4. `Copy Prompt Pack`을 누릅니다.
5. ChatGPT 또는 Claude에 붙여넣습니다.

이 경우 Prompt Pack 안의 Task가 입력한 질문에 맞춰 구성됩니다.

예시 질문:

```text
이 Topic의 자료만 보고 핵심 주장, 근거, 반박 가능성을 표로 정리해줘.
```

### Prompt Pack을 붙여넣은 뒤 AI에게 시킬 수 있는 일

- 수집 자료를 근거로 보고서 초안 작성
- 블로그 글 구조 만들기
- 논문/기사/제품 비교표 작성
- 놓친 질문과 추가 조사 목록 만들기
- 서로 충돌하는 Source 찾기
- Topic Wiki를 더 깔끔한 Markdown 문서로 재작성

중요: ChatGPT/Claude가 답변할 때도 "제공한 Source 안에서만 답하라"고 요청하는 것이 좋습니다.

## 11. Cloud AI 기능은 언제 쓰나

처음에는 Cloud AI 기능을 사용하지 않아도 됩니다.

Cloud 기능은 OpenAI API key를 직접 입력한 사용자가 yyoink-wiki 안에서 바로 초안을 만들고 싶을 때 쓰는 고급 기능입니다.

설정 방법:

1. 오른쪽 위 설정 버튼을 누릅니다.
2. `Advanced Cloud AI` 섹션으로 이동합니다.
3. OpenAI API key를 입력합니다.
4. 모델명을 확인합니다.
5. `Save AI Settings`를 누릅니다.

사용 방법:

- `Cloud Generate`: 현재 Topic의 Source를 바탕으로 새 Wiki 초안을 만듭니다.
- `Cloud Update`: 기존 Topic Wiki와 새 Source를 바탕으로 업데이트 초안을 만듭니다.
- `Review Draft`: Cloud AI가 만든 초안을 검토합니다.
- `Approve`: 초안을 실제 Topic Wiki에 반영합니다.
- `Reject`: 초안을 버립니다.

주의:

- Cloud Generate/Update를 실행하면 선택된 Topic의 자료가 OpenAI API로 전송됩니다.
- API key는 로컬에 저장됩니다.
- 기본 Prompt Pack/Evidence Finder 흐름은 외부 AI를 호출하지 않습니다.

## 12. 내보내기와 백업

주기적으로 JSON 백업을 만들어두는 것을 권장합니다.

1. `Sources` 탭 하단의 `Export`를 누릅니다.
2. 형식을 선택합니다.

형식별 용도:

| 형식 | 용도 |
| --- | --- |
| JSON | 전체 백업용입니다. Topic, Source, Wiki, Draft 정보를 보존합니다. |
| Markdown | 사람이 읽기 좋고 Obsidian, Notion 등에 옮기기 좋습니다. |
| Plain Text | 단순 텍스트 공유용입니다. |

가져오기:

1. `Sources` 탭 하단의 `Import`를 누릅니다.
2. JSON, Markdown, TXT 파일을 선택합니다.
3. 가져온 자료가 Source 목록에 생겼는지 확인합니다.

백업을 목적으로 한다면 JSON을 사용하세요.

## 13. 추천 워크플로우

### 리서치 자료 정리

1. Topic을 하나 만듭니다.
2. 관련 페이지에서 핵심 문장을 Source로 저장합니다.
3. 긴 글은 `Capture`로 저장합니다.
4. `Evidence`로 중요한 키워드의 근거를 확인합니다.
5. `Wiki`에서 직접 요약합니다.
6. `Copy Prompt Pack`으로 ChatGPT/Claude에 넘겨 보고서 초안을 만듭니다.

### 블로그 글 작성

1. 글 주제로 Topic을 만듭니다.
2. 참고할 글, 통계, 인용 자료를 Source로 저장합니다.
3. 내 생각은 Memo로 저장합니다.
4. Wiki에 주장, 근거, 반론, 예시를 정리합니다.
5. Prompt Pack을 복사해 Claude/ChatGPT에 붙여넣습니다.
6. "제공된 Source만 근거로 글 구조를 만들어달라"고 요청합니다.

### 제품 비교

1. 비교할 제품군으로 Topic을 만듭니다.
2. 각 제품 페이지, 가격 페이지, 문서 페이지를 Source로 저장합니다.
3. Evidence에서 `가격`, `보안`, `제한`, `API`, `라이선스` 같은 키워드로 근거를 찾습니다.
4. Wiki에 비교 기준별 메모를 적습니다.
5. Prompt Pack을 복사해 표 형태 비교를 요청합니다.

## 14. 문제 해결

### 우클릭 메뉴가 보이지 않습니다

- 텍스트를 먼저 드래그했는지 확인합니다.
- Chrome 확장 프로그램이 켜져 있는지 확인합니다.
- `chrome://extensions`에서 yyoink-wiki를 껐다가 다시 켭니다.
- 페이지를 새로고침합니다.

### 사이드 패널이 열리지 않습니다

- Chrome 툴바의 yyoink-wiki 아이콘을 클릭합니다.
- 단축키 `Command+Shift+P` 또는 `Ctrl+Shift+P`를 시도합니다.
- 확장 프로그램을 다시 로드합니다.

### Capture가 실패합니다

- 페이지를 새로고침합니다.
- 로그인이나 권한이 필요한 페이지인지 확인합니다.
- 본문이 이미지로만 되어 있으면 텍스트 추출이 어려울 수 있습니다.
- 필요한 부분을 드래그해 우클릭 저장하거나, 클립보드 저장을 사용합니다.

### Evidence 결과가 없습니다

- 현재 선택된 Topic에 Source가 있는지 확인합니다.
- 질문을 짧은 키워드로 바꿉니다.
- 영어/한국어 표현을 바꿔 다시 검색합니다.
- 관련 내용을 Wiki에 정리한 뒤 다시 시도합니다.

### Prompt Pack이 너무 깁니다

- Topic을 더 작게 나눕니다.
- 불필요한 Source를 삭제합니다.
- Wiki에 핵심만 요약한 뒤 Prompt Pack을 복사합니다.
- ChatGPT/Claude의 입력 한도를 넘으면 Source를 일부 삭제하거나 Topic별로 나눠 붙여넣습니다.

### Cloud Generate가 실패합니다

- OpenAI API key가 저장되어 있는지 확인합니다.
- 모델명이 올바른지 확인합니다.
- 네트워크 상태를 확인합니다.
- 기본 사용자는 Cloud 기능 대신 Copy Prompt Pack을 사용하면 됩니다.

## 15. 개인정보와 보안

기본 기능은 로컬 중심으로 동작합니다.

- Source, Topic, Wiki, Draft는 브라우저 로컬 저장소와 IndexedDB에 저장됩니다.
- 기본 Wiki, Evidence, Prompt Pack 기능은 외부 AI API를 호출하지 않습니다.
- Prompt Pack은 사용자가 직접 클립보드에 복사해 ChatGPT/Claude 웹앱에 붙여넣습니다.
- Cloud Generate/Update를 직접 실행할 때만 선택된 Topic 자료가 OpenAI API로 전송됩니다.
- 민감한 정보, 비밀번호, 개인정보는 Source로 저장하지 않는 것이 좋습니다.

공용 컴퓨터에서는 사용하지 않는 것을 권장합니다. 확장 프로그램을 삭제하면 로컬 데이터도 함께 삭제될 수 있으므로, 삭제 전에는 JSON 백업을 만들어두세요.

## 16. 처음 사용할 때의 목표

처음부터 완벽한 위키를 만들려고 하지 않아도 됩니다.

첫날 목표는 아래 정도면 충분합니다.

1. Topic 하나 만들기
2. Source 5개 저장하기
3. Wiki에 Summary와 Open Questions 작성하기
4. Evidence로 근거 1번 찾기
5. Copy Prompt Pack으로 ChatGPT/Claude에 붙여넣기

이 흐름을 한 번 해보면 yyoink-wiki의 사용 방식이 잡힙니다.
