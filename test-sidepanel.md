# 사이드패널 문제 디버깅 가이드

## 1단계: 확장 프로그램 로드 확인

1. Chrome에서 `chrome://extensions/` 열기
2. "yyoink" 확장 프로그램 찾기
3. **"서비스 워커" 또는 "배경 페이지" 링크 클릭**
4. Console 탭에서 에러 메시지 확인

## 2단계: 아이콘 클릭 테스트

1. 아무 웹페이지 열기
2. yyoink 아이콘 클릭
3. 콘솔에서 다음 메시지 확인:
   - "Sidepanel open failed" → API 호출 실패
   - 아무 메시지 없음 → 이벤트 리스너가 작동하지 않음

## 3단계: 수동 테스트

Service Worker 콘솔에서 다음 명령어 실행:

```javascript
// 현재 탭 가져오기
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  console.log('Current tab:', tabs[0].id);

  // 사이드패널 열기 시도
  chrome.sidePanel.open({tabId: tabs[0].id})
    .then(() => console.log('✅ Success'))
    .catch(err => console.error('❌ Failed:', err));
});
```

## 예상 원인과 해결책

### 원인 1: Promise 체인 오류
현재 코드의 `.catch().then()` 패턴이 잘못되어 에러 발생 시에도 상태가 업데이트됨

### 원인 2: API 호출 타이밍
`setOptions`와 `open`을 Promise.all로 동시 호출하면 경쟁 조건 발생 가능

### 원인 3: tabId 유효성
tabId가 유효하지 않거나 restricted page에서 호출

## 다음 단계

위 테스트 결과를 알려주시면 정확한 수정 방법을 제시하겠습니다.
