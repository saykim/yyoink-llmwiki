# yyoink-wiki

yyoink-wiki is a Chrome extension for collecting web sources into topic-based personal wiki pages and creating ChatGPT/Claude-ready Prompt Packs.

기본 흐름은 API key 없이 동작합니다.

1. 웹에서 Source를 수집합니다.
2. Topic별로 자료를 정리합니다.
3. Wiki 탭에서 Topic Wiki를 직접 작성합니다.
4. Evidence 탭에서 로컬 근거를 찾습니다.
5. Copy Prompt Pack으로 ChatGPT/Claude에 붙여넣을 프롬프트 패키지를 만듭니다.

처음 사용하는 경우 [USER_GUIDE.md](USER_GUIDE.md)를 먼저 읽으세요.

## Quick Install

1. Chrome에서 `chrome://extensions`를 엽니다.
2. `Developer mode`를 켭니다.
3. `Load unpacked`를 누릅니다.
4. 이 저장소의 최상위 폴더, 즉 `manifest.json`이 있는 폴더를 선택합니다.
5. Chrome 툴바에서 yyoink-wiki 아이콘을 눌러 사이드 패널을 엽니다.

## Privacy

기본 Wiki, Evidence, Prompt Pack 기능은 외부 AI API를 호출하지 않습니다. 자세한 내용은 [PrivacyGuide.md](PrivacyGuide.md)를 참고하세요.
