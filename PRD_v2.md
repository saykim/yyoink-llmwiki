# yyoink - Product Requirements Document (PRD) v2.0

> **코드 분석 기반 상세 PRD** | 작성일: 2026-01-25

---

## 1. Executive Summary

### 1.1 제품 개요

| 항목 | 내용 |
|------|------|
| **제품명** | yyoink |
| **버전** | 1.0.0 |
| **플랫폼** | Chrome Extension (Manifest V3) |
| **개발자** | SYK (ooak.studio.101) |
| **라이선스** | Proprietary |

### 1.2 한 줄 설명

> **"웹에서 무엇이든 가져가세요 - 복사 방지 우회, 스니펫 수집, 프로젝트별 정리"**

### 1.3 핵심 가치 제안

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 간편한 수집     우클릭 한 번으로 선택한 텍스트 즉시 저장      │
│  📁 프로젝트 정리   색상 코드가 있는 프로젝트로 스니펫 분류       │
│  🔓 복사 방지 해제  복사가 막힌 웹사이트에서도 텍스트 추출 가능   │
│  🔒 프라이버시      모든 데이터는 로컬에만 저장 (서버 전송 없음)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    Chrome Messaging API    ┌────────────────┐ │
│  │   Side Panel     │◄──────────────────────────►│  Background.js │ │
│  │   (main.js)      │                            │ Service Worker │ │
│  │                  │                            │                │ │
│  │  • UI 렌더링      │                            │ • 컨텍스트 메뉴 │ │
│  │  • 상태 관리      │                            │ • 메시지 라우팅 │ │
│  │  • 사용자 인터랙션│                            │ • 초기화       │ │
│  └────────┬─────────┘                            └───────┬────────┘ │
│           │                                              │          │
│           │              ┌────────────────┐              │          │
│           └─────────────►│ Chrome Storage │◄─────────────┘          │
│                          │    (Local)     │                         │
│                          │                │                         │
│                          │ • snippets[]   │                         │
│                          │ • projects[]   │                         │
│                          │ • settings     │                         │
│                          └────────────────┘                         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Content Script                           │   │
│  │                       (content.js)                            │   │
│  │                                                               │   │
│  │  • 복사 방지 해제 (CSS/JS 오버라이드)                          │   │
│  │  • 페이지 텍스트 추출                                         │   │
│  │  • 오버레이 요소 제거                                         │   │
│  │  • 네이버 블로그 블러 이미지 복원                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 파일 구조

```
context_pilot/
├── manifest.json           # 확장 프로그램 설정 (Manifest V3)
├── background.js           # 서비스 워커 (컨텍스트 메뉴, 메시지 처리)
├── content.js              # 콘텐츠 스크립트 (복사 해제, 텍스트 추출)
├── sidepanel/
│   ├── index.html          # 사이드 패널 UI 구조
│   ├── main.js             # 사이드 패널 로직 (1,223 lines)
│   └── styles.css          # 디자인 시스템 (1,917 lines)
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon64.png
│   └── icon128.png
├── PRD.md                  # 제품 요구사항 문서
└── PrivacyGuide.md         # 개인정보 처리방침
```

### 2.3 기술 스택

| 레이어 | 기술 | 설명 |
|--------|------|------|
| **Runtime** | Chrome Extension Manifest V3 | 최신 확장 프로그램 표준 |
| **Frontend** | Vanilla JavaScript | 프레임워크 없이 순수 JS |
| **Styling** | CSS Variables + Custom Design System | 테마 지원 |
| **Storage** | chrome.storage.local | 로컬 영구 저장소 |
| **Typography** | Google Fonts (Inter) | 외부 폰트 |
| **Icons** | Google Favicon API | 웹사이트 파비콘 |

---

## 3. 데이터 모델

### 3.1 Snippet (스니펫)

```typescript
interface Snippet {
  id: string;           // 고유 ID (timestamp + random)
  text: string;         // 저장된 텍스트 내용
  sourceUrl: string;    // 출처 URL
  pageTitle: string;    // 페이지 제목
  domain: string;       // 도메인 (예: "github.com")
  projectId: string;    // 소속 프로젝트 ID
  createdAt: string;    // ISO 8601 형식 생성 시각
}
```

### 3.2 Project (프로젝트)

```typescript
interface Project {
  id: string;           // 고유 ID ("default" 또는 생성된 ID)
  name: string;         // 프로젝트 이름
  color: string;        // HEX 색상 코드 (예: "#6366f1")
  createdAt: string;    // ISO 8601 형식 생성 시각
}
```

### 3.3 Settings (설정)

```typescript
interface Settings {
  theme: "auto" | "light" | "dark";  // 테마 설정
  activeProjectId: string;            // 현재 활성 프로젝트
}
```

### 3.4 색상 팔레트 (프로젝트용)

| 색상 | HEX | 용도 |
|------|-----|------|
| Indigo | `#6366f1` | 기본값 |
| Violet | `#8b5cf6` | 보조 |
| Pink | `#ec4899` | 강조 |
| Red | `#ef4444` | 경고/중요 |
| Amber | `#f59e0b` | 주의 |
| Emerald | `#10b981` | 성공 |
| Cyan | `#06b6d4` | 정보 |
| Blue | `#3b82f6` | 일반 |

---

## 4. 기능 상세

### 4.1 스니펫 저장 시스템

#### 4.1.1 컨텍스트 메뉴 저장

```
Save to yyoink
├── [Project Name 1]        → 특정 프로젝트에 직접 저장
├── [Project Name 2]
├── ────────────────
├── Save to Active Project  → 현재 선택된 프로젝트에 저장
└── + Create New Project... → 새 프로젝트 생성 후 저장
```

**구현 위치**: `background.js` → `updateContextMenus()`, `saveSnippet()`

#### 4.1.2 페이지 캡처

- **기능**: 현재 페이지의 본문 전체를 스니펫으로 저장
- **추출 로직**: 
  - 불필요한 요소 제거 (nav, footer, ads, sidebar 등)
  - 메인 콘텐츠 영역 우선 탐색 (`main`, `article`, `[role="main"]`, `.content`)
  - 최대 10,000자 제한

**구현 위치**: `content.js` → `extractPageText()`

#### 4.1.3 강제 선택 (Force Select)

- **기능**: 선택 불가능한 텍스트 강제 추출
- **동작**: `window.getSelection()` + `Range.cloneContents()` 활용

**구현 위치**: `content.js` → `forceExtractSelection()`

### 4.2 복사 방지 해제 시스템

#### 4.2.1 일반 모드 (Standard Bypass)

| 적용 대상 | 해제 방법 |
|-----------|-----------|
| CSS `user-select: none` | `user-select: auto !important` 주입 |
| `oncopy` 이벤트 | 핸들러 null 처리 |
| `oncontextmenu` 이벤트 | 핸들러 null 처리 |
| `onselectstart` 이벤트 | 핸들러 null 처리 |
| 투명 오버레이 | z-index > 1000 + 빈 요소 자동 제거 |

**구현 위치**: `content.js` → `enableCopyBypass()`, `applyBypassToElement()`

#### 4.2.2 강력 모드 (Hardcore Mode)

- **활성화**: 복사 해제 버튼 **길게 누르기** (500ms)
- **동작**: `chrome.contentSettings.javascript.set({ setting: "block" })`
- **효과**: 해당 도메인의 JavaScript 완전 비활성화
- **해제**: 다시 길게 눌러 JavaScript 재활성화 + 페이지 새로고침

**구현 위치**: `sidepanel/main.js` → `enableHardcoreBypass()`

#### 4.2.3 네이버 블로그 블러 이미지 복원

- **대상**: `blog.naver.com` 도메인
- **동작**: URL 파라미터에서 `_blur` 제거
- **예시**: `type=w800_blur` → `type=w800`

**구현 위치**: `content.js` → `fixBlurredImages()`

### 4.3 프로젝트 관리

| 기능 | 설명 | 구현 위치 |
|------|------|-----------|
| 프로젝트 생성 | 이름 + 8가지 색상 선택 | `saveNewProject()` |
| 프로젝트 삭제 | 스니펫 삭제 또는 다른 프로젝트로 이동 옵션 | `confirmDeleteProject()` |
| 프로젝트 필터링 | 드롭다운에서 선택 시 해당 프로젝트만 표시 | `renderSnippets()` |
| 기본 프로젝트 | "Default" 프로젝트 자동 생성 (삭제 불가) | `initializeStorage()` |

### 4.4 스니펫 관리

| 기능 | 설명 | 단축키/UI |
|------|------|-----------|
| 검색 | 실시간 필터링 (200ms debounce) | `⌘K` / `Ctrl+K` |
| 복사 | 개별 스니펫 클립보드 복사 | 카드 호버 → 복사 버튼 |
| 전체 복사 | 현재 필터된 모든 스니펫 복사 | "Copy" 버튼 |
| 편집 | 텍스트 수정 + 프로젝트 변경 | 카드 호버 → 편집 버튼 |
| 삭제 | 인라인 확인 UI (Yes/No) | 카드 호버 → 삭제 버튼 |
| 확장/축소 | 긴 스니펫 펼쳐보기 | 카드 클릭 |

### 4.5 데이터 내보내기/가져오기

#### 4.5.1 내보내기 형식

| 형식 | 파일명 | 내용 |
|------|--------|------|
| **JSON** | `yyoink-export.json` | 완전한 데이터 백업 (프로젝트 + 스니펫) |
| **Markdown** | `yyoink-export.md` | 프로젝트별 그룹핑, 인용 형식, 출처 링크 |
| **Plain Text** | `yyoink-export.txt` | 프로젝트별 섹션, 스니펫 텍스트 + 출처 |

#### 4.5.2 가져오기 지원

| 형식 | 동작 |
|------|------|
| JSON | 프로젝트 + 스니펫 복원 (중복 ID 처리) |
| TXT/MD | 빈 줄 기준 분리 → 개별 스니펫 생성 |

### 4.6 추가 수집 도구

| 도구 | 설명 | 아이콘 |
|------|------|--------|
| **Quick Memo** | 직접 입력한 메모를 스니펫으로 저장 | ✏️ |
| **Paste** | 클립보드 내용을 즉시 스니펫으로 저장 | 📋 |

---

## 5. 메시지 프로토콜

### 5.1 Content Script ↔ Background/Sidepanel

| 메시지 타입 | 방향 | 페이로드 | 응답 |
|-------------|------|----------|------|
| `EXTRACT_PAGE_TEXT` | Background → Content | - | `{ text, url, title, domain }` |
| `ENABLE_COPY_BYPASS` | Sidepanel → Content | - | `{ success: true }` |
| `DISABLE_COPY_BYPASS` | Sidepanel → Content | - | `{ success: true }` |
| `FORCE_GET_SELECTION` | Sidepanel → Content | - | `{ text }` |
| `GET_SELECTION_TEXT` | Sidepanel → Content | - | `{ text }` |

### 5.2 Background ↔ Sidepanel

| 메시지 타입 | 방향 | 페이로드 | 설명 |
|-------------|------|----------|------|
| `SNIPPET_ADDED` | Background → Sidepanel | `{ snippet }` | 컨텍스트 메뉴로 저장 시 UI 업데이트 |
| `OPEN_CREATE_PROJECT` | Background → Sidepanel | `{ text, tabInfo }` | 새 프로젝트 생성 모달 열기 |
| `GET_PAGE_TEXT` | Sidepanel → Background | - | 페이지 캡처 요청 |
| `GET_PAGE_INFO` | Sidepanel → Background | - | 현재 탭 정보 요청 |
| `REFRESH_MENUS` | Sidepanel → Background | - | 컨텍스트 메뉴 갱신 |

---

## 6. UI/UX 디자인 시스템

### 6.1 색상 토큰 (Dark Mode 기본)

```css
/* Primary Colors */
--primary-500: #6366f1;
--primary-600: #4f46e5;

/* Background */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-tertiary: #1a1a24;
--bg-elevated: #22222e;

/* Text */
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-muted: #64748b;

/* Semantic */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
```

### 6.2 테마 지원

| 테마 | 설명 | 적용 방식 |
|------|------|-----------|
| **Auto** | 시스템 설정 따름 | `prefers-color-scheme` 미디어 쿼리 |
| **Light** | 밝은 테마 | `body.theme-light` 클래스 |
| **Dark** | 어두운 테마 | `body.theme-dark` 클래스 |

### 6.3 컴포넌트 구조

```
Container
├── Header
│   ├── Logo (yyoink 브랜딩)
│   └── Header Actions (Coffee, Settings)
├── Project Selector (커스텀 드롭다운)
├── Quick Actions Bar
│   ├── Capture (Primary)
│   ├── Copy All (Secondary)
│   ├── Bypass Lock (Icon)
│   ├── Force Select (Icon)
│   ├── Memo (Icon)
│   └── Paste (Icon)
├── Search Bar (⌘K 단축키)
├── Snippets Container
│   ├── Empty State (스니펫 없을 때)
│   └── Snippet Cards (동적 렌더링)
├── Footer Actions
│   ├── Snippet Count
│   ├── Import Button
│   └── Export Button
└── Footer Credit (ooak.studio.101)
```

### 6.4 모달 시스템

| 모달 ID | 용도 |
|---------|------|
| `addProjectModal` | 새 프로젝트 생성 |
| `manageProjectsModal` | 프로젝트 목록 관리 |
| `deleteProjectModal` | 프로젝트 삭제 확인 |
| `editSnippetModal` | 스니펫 편집 |
| `memoModal` | 퀵 메모 작성 |
| `exportModal` | 내보내기 형식 선택 |
| `settingsModal` | 테마 설정 |

---

## 7. 권한 (Permissions)

| 권한 | 용도 | 필수 여부 |
|------|------|-----------|
| `storage` | 스니펫/프로젝트/설정 저장 | ✅ 필수 |
| `contextMenus` | 우클릭 메뉴 저장 옵션 | ✅ 필수 |
| `activeTab` | 현재 탭 정보 접근 | ✅ 필수 |
| `clipboardWrite` | 스니펫 복사 기능 | ✅ 필수 |
| `clipboardRead` | 클립보드 붙여넣기 기능 | ✅ 필수 |
| `sidePanel` | 사이드 패널 UI | ✅ 필수 |
| `contentSettings` | 강력 모드 (JS 비활성화) | ⚠️ 조건부 |
| `<all_urls>` | 모든 웹사이트에서 동작 | ✅ 필수 |

---

## 8. 성능 요구사항

| 지표 | 목표 | 현재 상태 |
|------|------|-----------|
| 사이드 패널 로딩 | < 500ms | ✅ 달성 |
| 스니펫 저장 | < 100ms | ✅ 달성 |
| 검색 debounce | 200ms | ✅ 구현됨 |
| 스크롤 성능 | 1,000개 스니펫까지 부드럽게 | ⚠️ 가상화 미적용 |

---

## 9. 보안 및 프라이버시

### 9.1 데이터 보안

- ✅ 모든 데이터 로컬 저장 (`chrome.storage.local`)
- ✅ 외부 서버 전송 없음
- ✅ 클라우드 동기화 없음
- ✅ 제3자 데이터 공유 없음

### 9.2 외부 서비스 의존성

| 서비스 | 용도 | 데이터 전송 |
|--------|------|-------------|
| Google Fonts | Inter 폰트 로드 | 익명 요청 |
| Google Favicon API | 웹사이트 아이콘 | 도메인명만 전송 |

---

## 10. 제한사항 및 향후 계획

### 10.1 현재 제한사항

| 제한 | 설명 |
|------|------|
| 텍스트 전용 | 이미지, 파일 저장 미지원 |
| 로컬 전용 | 클라우드 동기화 없음 |
| Chrome 전용 | Firefox, Safari 미지원 |
| 협업 없음 | 공유 기능 없음 |

### 10.2 향후 로드맵

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 태그 시스템 | P1 | 🔜 계획됨 |
| AI 요약 | P2 | 💡 아이디어 |
| 클라우드 동기화 (Google Drive) | P2 | 💡 아이디어 |
| Firefox 지원 | P3 | 💡 아이디어 |

---

## 11. 릴리스 히스토리

| 버전 | 날짜 | 변경 사항 |
|------|------|-----------|
| 1.0.0 | 2026-01 | 초기 릴리스 |

---

## 부록 A: 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows) | 사이드 패널 토글 |
| `Cmd+K` / `Ctrl+K` | 검색창 포커스 |

---

## 부록 B: 코드 통계

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `sidepanel/main.js` | 1,223 | 핵심 비즈니스 로직 |
| `sidepanel/styles.css` | 1,917 | 디자인 시스템 |
| `sidepanel/index.html` | 642 | UI 구조 |
| `content.js` | 283 | 콘텐츠 스크립트 |
| `background.js` | 207 | 서비스 워커 |
| `manifest.json` | 54 | 확장 프로그램 설정 |
| **총계** | **4,326** | - |

---

_이 PRD는 실제 코드 분석을 기반으로 작성되었습니다. (2026-01-25)_
