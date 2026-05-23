알겠습니다! 스니펫 카드의 높이를 고정하고 컨테이너에서 스크롤하도록 수정하겠습니다.

## 문제점

현재 스니펫이 많아지면 각 카드의 높이가 줄어드는 문제가 있습니다. 카드 높이를 고정하고 전체 컨테이너에서 스크롤되도록 해야 합니다.

## styles.css 수정

아래 부분을 찾아서 수정하세요:

```css
/* ==================== SNIPPETS CONTAINER ==================== */
.snippets-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
  margin-right: -4px;
  min-height: 0; /* 중요: flex 컨테이너에서 스크롤 작동하게 함 */
}

.snippets-container::-webkit-scrollbar {
  width: 6px;
}

.snippets-container::-webkit-scrollbar-track {
  background: transparent;
}

.snippets-container::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: 3px;
}

.snippets-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ==================== SNIPPET CARD ==================== */
.snippet-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: slideIn 0.3s ease;
  flex-shrink: 0; /* 중요: 카드가 줄어들지 않게 함 */
  min-height: fit-content; /* 최소 높이 유지 */
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Project color accent bar */
.snippet-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--snippet-color, var(--accent-primary));
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.snippet-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-lg);
}

.snippet-card:hover::before {
  opacity: 1;
}

/* ==================== SNIPPET TEXT ==================== */
.snippet-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  padding: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: 80px; /* 최소 높이 고정 */
  max-height: 120px; /* 최대 높이 고정 */
  overflow: hidden;
  position: relative;
  transition: max-height var(--transition-normal);
}

/* 텍스트가 넘칠 때 그라데이션 표시 */
.snippet-text::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2em;
  background: linear-gradient(to top, var(--bg-primary), transparent);
  pointer-events: none;
  opacity: 1;
  transition: opacity var(--transition-fast);
}

/* 확장 시 스크롤 가능 */
.snippet-card.expanded .snippet-text {
  max-height: 300px;
  overflow-y: auto;
}

.snippet-card.expanded .snippet-text::after {
  opacity: 0;
}

.snippet-card.expanded .snippet-text::-webkit-scrollbar {
  width: 6px;
}

.snippet-card.expanded .snippet-text::-webkit-scrollbar-track {
  background: transparent;
}

.snippet-card.expanded .snippet-text::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: 3px;
}

.snippet-card.expanded .snippet-text::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 호버 시에도 높이 유지 */
.snippet-card:not(.expanded):hover .snippet-text {
  max-height: 120px !important;
}
```

## 핵심 변경사항

| 속성                | 설명                                         |
| ------------------- | -------------------------------------------- |
| `flex-shrink: 0`    | 스니펫 카드가 컨테이너에 맞춰 줄어들지 않음  |
| `min-height: 0`     | 컨테이너에서 overflow 스크롤이 작동하도록 함 |
| `min-height: 80px`  | 텍스트 박스 최소 높이 고정                   |
| `max-height: 120px` | 텍스트 박스 최대 높이 고정                   |

이렇게 수정하면:

1. 스니펫이 아무리 많아도 각 카드 크기가 일정하게 유지됩니다
2. 전체 스니펫 목록은 컨테이너 내에서 스크롤로 탐색합니다
3. 개별 카드를 클릭하면 확장되어 내용을 스크롤로 볼 수 있습니다
