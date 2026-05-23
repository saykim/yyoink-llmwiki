# 사이드패널 토글 기능 수정

## 문제점
- 확장 프로그램 아이콘 클릭 시 사이드패널이 열리지 않음
- 다시 클릭해도 닫히지 않음

## 원인 분석 (Systematic Debugging)

### Phase 1: Root Cause Investigation
1. **Promise 체인 순서 오류**: `.catch().then()` 패턴으로 인해 에러 발생 시에도 상태가 업데이트됨
2. **API 사용 방식 문제**: `Promise.resolve()`로 불필요하게 Chrome API를 감싸서 사용
3. **tabId vs windowId**: Chrome 114+ 에서는 `windowId` 사용이 권장됨

### Phase 2: Pattern Analysis
- Chrome Extension 공식 문서 참고
- `chrome.sidePanel.open({ windowId })` 패턴이 권장 방식
- async/await 사용이 Promise 체인보다 안전함

### Phase 3: Hypothesis
`tabId` 기반 API 호출과 Promise 체인 오류로 인한 상태 동기화 실패

### Phase 4: Implementation

## 수정사항

### 1. windowId 기반으로 변경
```javascript
// BEFORE
function openSidePanelForTab(tabId) {
  chrome.sidePanel.open({ tabId })
}

// AFTER
async function openSidePanelForWindow(windowId) {
  await chrome.sidePanel.open({ windowId });
}
```

### 2. async/await 패턴 적용
```javascript
// BEFORE
Promise.all(promises).catch().then(() => {
  sidePanelOpenState.add(tabId); // 에러 후에도 실행됨
});

// AFTER
try {
  await chrome.sidePanel.open({ windowId });
  sidePanelOpenState.add(windowId); // 성공 시에만 실행
} catch (error) {
  console.error("❌ Failed:", error);
}
```

### 3. 이벤트 리스너 수정
```javascript
// BEFORE
chrome.action.onClicked.addListener((tab) => {
  toggleSidePanelForTab(tab.id);
});

// AFTER
chrome.action.onClicked.addListener(async (tab) => {
  await toggleSidePanelForTab(tab);
});
```

### 4. 불필요한 이벤트 리스너 제거
- `chrome.sidePanel.onOpened`, `onClosed`는 모든 Chrome 버전에서 지원되지 않음
- 수동 상태 관리로 대체

## 테스트 방법

### 1. 확장 프로그램 재로드
1. `chrome://extensions/` 열기
2. yyoink 확장 프로그램 찾기
3. **새로고침 버튼** 클릭

### 2. 기능 테스트
1. 아무 웹페이지 열기
2. yyoink 아이콘 클릭 → **사이드패널 열림** ✅
3. 다시 아이콘 클릭 → **사이드패널 닫힘** ✅

### 3. 디버깅
Service Worker 콘솔 확인:
- "✅ Side panel opened for window: X" → 성공
- "❌ Failed to open side panel: ..." → 에러 메시지 확인

## 추가 개선사항

### 토글 동작 명확화
현재는 상태를 추적하여 토글하지만, Chrome의 사이드패널은 자동으로 토글됩니다.
더 간단한 구현:

```javascript
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("Failed to toggle side panel:", error);
  }
});
```

Chrome이 자동으로 "이미 열려있으면 닫기" 동작을 처리합니다.

## 참고자료
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
