# yyoink - Product Requirements Document (PRD) v3.0

> **최종 통합 및 개발자용 상세 PRD** | 작성일: 2026-01-25

---

## 1. 제품 개요 (Product Overview)

### 1.1 제품명
**yyoink**

### 1.2 버전
v3.0.0 (Developer-Ready)

### 1.3 한 줄 설명
> **"웹에서 무엇이든 가져가세요 - 복사 방지 우회, 스니펫 수집, 프로젝트별 정리"**

### 1.4 핵심 가치 제안
- **간편한 수집**: 우클릭 한 번으로 선택한 텍스트 즉시 저장
- **프로젝트 정리**: 색상 코드가 있는 프로젝트로 스니펫 분류
- **복사 방지 해제**: 복사가 막힌 웹사이트에서도 텍스트 추출 가능
- **프라이버시**: 모든 데이터는 로컬에만 저장 (서버 전송 없음)

---

## 2. 문제 정의 (Problem Statement)

### 2.1 해결하려는 페인 포인트 (Pain Points)
1. **정보 파편화**: 웹 서핑 중 발견한 유용한 정보를 저장하기 위해 메모장, 카카오톡 나에게 보내기, 노션 등을 오가며 흐름이 끊김.
2. **복사 방지 제약**: 우클릭 금지, 드래그 금지 설정이 된 사이트에서 정보를 수집하기 위해 타이핑을 직접 하거나 개발자 도구를 열어야 하는 번거로움.
3. **맥락 상실**: 저장한 텍스트가 어디서 왔는지(URL), 언제 저장했는지 기억나지 않아 나중에 활용하기 어려움.
4. **정리 부담**: 수집한 정보를 나중에 분류하려고 하면 이미 양이 너무 많아져 포기하게 됨.

### 2.2 기존 방식 (Status Quo)
- 브라우저 북마크 (텍스트 내용 확인 불가)
- 메모 앱에 복사-붙여넣기 (출처 수동 기록 필요)
- 스크린샷 (텍스트 검색 및 재활용 불가)

### 2.3 해결 가치
yyoink는 수집과 분류를 **수집하는 순간**에 동시에 처리하며, 기술적 제약(복사 방지)을 제거하여 정보 수집의 마찰력을 제로로 만듭니다.

---

## 3. 타겟 사용자 및 시나리오

### 3.1 주요 사용자 (User Personas)
| 페르소나 | 설명 | 니즈 |
| :--- | :--- | :--- |
| **연구자/리서처** | 논문, 기사 등에서 정보 수집 | 출처 URL 자동 저장, 프로젝트별 체계적 분류 |
| **콘텐츠 크리에이터** | 블로그, 영상 기획 자료 수집 | 빠른 클리핑, 메모 추가, 마크다운 내보내기 |
| **학생** | 과제, 논문 참고자료 수집 | 검색 기능, 일괄 복사 기능 |
| **지식 근로자** | 업무 관련 정보 스크랩 | 사이드 패널을 통한 빠른 접근 및 활용 |

### 3.2 사용 시나리오
1. **즉시 저장**: 웹 서핑 중 유용한 문장 발견 → 우클릭 메뉴에서 프로젝트 선택 → 즉시 저장.
2. **주제별 리서치**: 특정 주제 프로젝트 생성 → 관련 정보만 수집 → 사이드 패널에서 해당 프로젝트 필터링하여 검토.
3. **복사 방지 우회**: 복사가 막힌 블로그에서 정보 필요 → Bypass 모드 활성화 → 텍스트 선택 및 저장.
4. **자료 정리**: 수집한 자료를 마크다운으로 내보내어 보고서나 블로그 초안으로 활용.

---

## 4. 사용자 스토리 (User Stories)

| ID | 사용자 스토리 | 수용 기준 (Acceptance Criteria) |
| :--- | :--- | :--- |
| **US-01** | **AS A** 리서처 **I WANT TO** 우클릭으로 텍스트를 저장하고 싶다 **SO THAT** 작업 흐름을 끊지 않고 정보를 수집할 수 있다. | **GIVEN** 텍스트가 선택된 상태에서 **WHEN** 우클릭 메뉴 'Save to yyoink' 클릭 시 **THEN** 선택된 프로젝트에 텍스트, URL, 제목이 저장된다. |
| **US-02** | **AS A** 크리에이터 **I WANT TO** 프로젝트별로 색상을 지정하고 싶다 **SO THAT** 시각적으로 정보를 빠르게 구분할 수 있다. | **GIVEN** 프로젝트 생성 모달에서 **WHEN** 8가지 색상 중 하나를 선택하고 저장하면 **THEN** 해당 프로젝트와 스니펫에 색상 코드가 적용된다. |
| **US-03** | **AS A** 사용자 **I WANT TO** 복사 방지된 사이트에서 텍스트를 선택하고 싶다 **SO THAT** 필요한 정보를 강제로 추출할 수 있다. | **GIVEN** 복사 방지된 페이지에서 **WHEN** 'Bypass' 버튼을 클릭하면 **THEN** 드래그 및 우클릭이 가능해진다. |
| **US-04** | **AS A** 사용자 **I WANT TO** 강력 모드를 사용하고 싶다 **SO THAT** 일반적인 우회로 해결되지 않는 사이트의 제약을 풀 수 있다. | **GIVEN** 사이드 패널에서 **WHEN** 'Bypass' 버튼을 500ms 이상 길게 누르면 **THEN** 해당 사이트의 JS가 비활성화되며 강력 우회가 적용된다. |
| **US-05** | **AS A** 학생 **I WANT TO** 수집한 모든 스니펫을 한 번에 복사하고 싶다 **SO THAT** 과제 문서에 빠르게 붙여넣을 수 있다. | **GIVEN** 스니펫 목록에서 **WHEN** 'Copy All' 버튼을 클릭하면 **THEN** 현재 필터링된 모든 스니펫이 텍스트 형식으로 클립보드에 복사된다. |
| **US-06** | **AS A** 사용자 **I WANT TO** 직접 메모를 작성하고 싶다 **SO THAT** 웹 사이트 내용 외의 내 생각을 함께 저장할 수 있다. | **GIVEN** 사이드 패널에서 **WHEN** 'Memo' 아이콘 클릭 후 텍스트 입력 및 저장 시 **THEN** 새로운 스니펫으로 저장된다. |
| **US-07** | **AS A** 사용자 **I WANT TO** 데이터를 마크다운으로 내보내고 싶다 **SO THAT** 노션이나 옵시디언 같은 도구에서 활용할 수 있다. | **GIVEN** 내보내기 모달에서 **WHEN** 'Markdown' 선택 시 **THEN** 프로젝트별로 그룹화된 .md 파일이 다운로드된다. |
| **US-08** | **AS A** 사용자 **I WANT TO** 저장된 스니펫을 검색하고 싶다 **SO THAT** 과거에 저장한 정보를 빠르게 찾을 수 있다. | **GIVEN** 검색창에 키워드 입력 시 **WHEN** 200ms 경과 후 **THEN** 해당 키워드가 포함된 스니펫만 실시간으로 필터링된다. |
| **US-09** | **AS A** 사용자 **I WANT TO** 클립보드 내용을 즉시 저장하고 싶다 **SO THAT** 다른 앱에서 복사한 내용도 yyoink에 통합할 수 있다. | **GIVEN** 사이드 패널에서 **WHEN** 'Paste' 아이콘을 클릭하면 **THEN** 현재 클립보드의 텍스트가 즉시 스니펫으로 저장된다. |
| **US-10** | **AS A** 사용자 **I WANT TO** 페이지 전체 내용을 저장하고 싶다 **SO THAT** 중요한 아티클 전체를 보관할 수 있다. | **GIVEN** 웹 페이지에서 **WHEN** 'Capture' 버튼을 클릭하면 **THEN** 본문 텍스트가 추출되어 스니펫으로 저장된다. |

---

## 5. 기능 요구사항 (Functional Requirements)

### 5.1 스니펫 수집 도구
- **우클릭 저장 (P0)**: 선택 영역 텍스트 저장.
- **페이지 캡처 (P1)**: 본문 영역(main, article 등) 자동 추출.
- **강제 선택 (P1)**: `window.getSelection()` 기반 강제 추출.
- **퀵 메모 (P1)**: 사용자 직접 입력 저장.
- **클립보드 붙여넣기 (P2)**: 클립보드 텍스트 즉시 저장.

### 5.2 프로젝트 관리
- **생성/삭제 (P0)**: 이름 및 8종 색상 지정.
- **필터링 (P0)**: 프로젝트별 스니펫 보기.
- **활성 프로젝트 (P1)**: 현재 선택된 프로젝트로 모든 저장 작업 집중.

### 5.3 복사 방지 해제 (Copy Bypass)
- **일반 모드 (P0)**: CSS `user-select` 해제, `oncopy` 등 이벤트 핸들러 제거.
- **강력 모드 (P1)**: 도메인별 JavaScript 완전 비활성화 (길게 누르기).
- **이미지 복원 (P2)**: 네이버 블로그 등 블러 처리된 이미지 URL 수정.

### 5.4 데이터 관리
- **내보내기 (P0)**: JSON(백업), Markdown(활용), Plain Text.
- **가져오기 (P1)**: JSON 복원, TXT/MD 줄 단위 생성.
- **검색 (P0)**: 실시간 텍스트 검색 (Debounce 적용).

---

## 6. 기술 아키텍처 (Technical Architecture)

### 6.1 시스템 구조 및 통신
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

### 6.2 파일 구조
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

### 6.3 데이터 모델 (TypeScript Interfaces)
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

interface Project {
  id: string;           // 고유 ID ("default" 또는 생성된 ID)
  name: string;         // 프로젝트 이름
  color: string;        // HEX 색상 코드 (예: "#6366f1")
  createdAt: string;    // ISO 8601 형식 생성 시각
}

interface Settings {
  theme: "auto" | "light" | "dark";  // 테마 설정
  activeProjectId: string;            // 현재 활성 프로젝트
}
```

### 6.4 색상 팔레트 (프로젝트용)
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

### 6.5 메시지 프로토콜 (Message Protocol)

#### 6.5.1 Content Script ↔ Background/Sidepanel
| 메시지 타입 | 방향 | 페이로드 | 응답 |
|-------------|------|----------|------|
| `EXTRACT_PAGE_TEXT` | Background → Content | - | `{ text, url, title, domain }` |
| `ENABLE_COPY_BYPASS` | Sidepanel → Content | - | `{ success: true }` |
| `DISABLE_COPY_BYPASS` | Sidepanel → Content | - | `{ success: true }` |
| `FORCE_GET_SELECTION` | Sidepanel → Content | - | `{ text }` |
| `GET_SELECTION_TEXT` | Sidepanel → Content | - | `{ text }` |

#### 6.5.2 Background ↔ Sidepanel
| 메시지 타입 | 방향 | 페이로드 | 설명 |
|-------------|------|----------|------|
| `SNIPPET_ADDED` | Background → Sidepanel | `{ snippet }` | 컨텍스트 메뉴로 저장 시 UI 업데이트 |
| `OPEN_CREATE_PROJECT` | Background → Sidepanel | `{ text, tabInfo }` | 새 프로젝트 생성 모달 열기 |
| `GET_PAGE_TEXT` | Sidepanel → Background | - | 페이지 캡처 요청 |
| `GET_PAGE_INFO` | Sidepanel → Background | - | 현재 탭 정보 요청 |
| `REFRESH_MENUS` | Sidepanel → Background | - | 컨텍스트 메뉴 갱신 |

### 6.6 기술 스택
- **Runtime**: Chrome Extension Manifest V3
- **Frontend**: Vanilla JavaScript, CSS Variables
- **Storage**: `chrome.storage.local` (5MB limit)
- **Typography**: Google Fonts (Inter)
- **Icons**: Google Favicon API

---

## 7. UI/UX 디자인 시스템

### 7.1 색상 토큰 (Dark Mode 기본)
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

### 7.2 컴포넌트 구조 (Component Tree)
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

### 7.3 모달 시스템 (Modal System)
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

## 8. 권한 (Permissions)

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

## 9. 예외 처리 및 에지 케이스 (Error Handling)

| 시나리오 | 현재 동작 | 사용자 메시지 |
| :--- | :--- | :--- |
| 제한된 페이지 (chrome://) | 액션 차단 | "Cannot access this page" |
| 컨텐츠 스크립트 연결 끊김 | 에러 캐치 | "Please refresh the page and try again" |
| 클립보드 권한 거부 | 에러 캐치 | "Cannot read clipboard. Please allow permission." |
| 클립보드 비어 있음 | 빈 값 체크 | "Clipboard is empty" |
| 선택된 텍스트 없음 | 빈 값 체크 | "No text selected" |
| 잘못된 가져오기 파일 | JSON.parse 예외 처리 | "Error importing file" |
| 파비콘 로드 실패 | onerror 핸들러 | 파비콘 숨김 처리 |
| DOM 복제 실패 | document.body 폴백 | (자동 처리) |

---

## 10. 토스트 메시지 카탈로그 (Toast Messages)

| 액션 | 메시지 | 타입 |
| :--- | :--- | :--- |
| 스니펫 저장 (우클릭) | "Snippet saved!" | Success |
| 스니펫 저장 (강제 선택) | "Selection saved!" | Success |
| 페이지 캡처 완료 | "Page captured!" | Success |
| 개별 복사 | "Copied!" | Success |
| 전체 복사 | "Copied N snippets!" | Success |
| 스니펫 삭제 | "Snippet deleted" | Success |
| 프로젝트 삭제 | "Project deleted" | Success |
| 프로젝트 생성 | "Project created!" | Success |
| 프로젝트 생성 + 저장 | "Project created & snippet saved!" | Success |
| 스니펫 수정 | "Snippet updated!" | Success |
| 메모 저장 | "Memo saved!" | Success |
| 클립보드 붙여넣기 | "Pasted from clipboard!" | Success |
| 내보내기 완료 | "Exported as FORMAT!" | Success |
| 가져오기 완료 | "Imported N snippets!" | Success |
| 테마 변경 | "Theme set to X" | Info |
| Bypass 활성화 | "복사 잠금 해제 활성화 (길게 누르면 강력 모드)" | Info |
| Bypass 비활성화 | "복사 잠금 해제 비활성화" | Info |
| 강력 모드 활성화 | "강력 모드 활성화 - JS 비활성화됨" | Warning |
| 강력 모드 해제 | "강력 모드 해제 - 페이지 새로고침" | Info |
| 복사할 스니펫 없음 | "No snippets to copy" | Warning |
| 내보낼 데이터 없음 | "No snippets to export" | Warning |
| 메모 내용 비어 있음 | "Please write something" | Warning |
| 프로젝트 이름 비어 있음 | "Please enter a project name" | Warning |
| 스니펫 내용 비어 있음 | "Snippet text cannot be empty" | Warning |

---

## 11. 보안 및 프라이버시 (Security & Privacy)

### 11.1 XSS 방지
- 모든 사용자 입력 및 웹 추출 텍스트는 렌더링 전 `escapeHtml()` 함수를 거쳐야 함.
- `innerHTML` 대신 `textContent` 사용 원칙.

### 11.2 데이터 보안
- 모든 데이터는 `chrome.storage.local`에 저장되며 외부 서버로 전송되지 않음.
- Content Security Policy (CSP) 준수: 인라인 스크립트 금지.
- 제3자 데이터 공유 없음.

### 11.3 외부 서비스 의존성
| 서비스 | 용도 | 데이터 전송 |
|--------|------|-------------|
| Google Fonts | Inter 폰트 로드 | 익명 요청 |
| Google Favicon API | 웹사이트 아이콘 | 도메인명만 전송 |

---

## 12. 저장소 제한 및 관리 (Storage)

- **용량 제한**: `chrome.storage.local` 기본 5MB.
- **스니펫 제한**: 개별 스니펫 당 최대 10,000자.
- **한계 도달 전략 (TODO)**: 80% 도달 시 경고 알림, 오래된 스니펫 자동 삭제 옵션 검토 필요.

---

## 13. 성능 요구사항 (Performance)

| 지표 | 목표 | 현재 상태 |
|------|------|-----------|
| 사이드 패널 로딩 | < 500ms | ✅ 달성 |
| 스니펫 저장 | < 100ms | ✅ 달성 |
| 검색 debounce | 200ms | ✅ 구현됨 |
| 스크롤 성능 | 1,000개 스니펫까지 부드럽게 | ⚠️ 가상화 미적용 |

---

## 14. 성공 지표 (Success Metrics / KPI)

| 지표 | 정의 | 목표 |
| :--- | :--- | :--- |
| **DAU** | 일간 활성 사용자 (사이드 패널 오픈 기준) | - |
| **Snippets Saved** | 총 저장된 스니펫 수 | - |
| **Retention** | 7일 후 재방문율 | - |
| **Feature Usage** | Bypass, Export 등 주요 기능 사용 비율 | - |

> **참고**: 현재 개인정보 보호를 위해 텔레메트리를 수집하지 않음 (No telemetry by design).

---

## 15. 테스트 전략 (Test Strategy)

### 15.1 수동 테스트 체크리스트
- [ ] 우클릭 메뉴 프로젝트별 저장 동작 확인
- [ ] Bypass 모드 활성화 후 드래그 금지 사이트 동작 확인
- [ ] 강력 모드(JS 차단) 활성화 및 해제 확인
- [ ] 다크/라이트 테마 전환 시 UI 가독성 확인
- [ ] 대량 데이터(100개 이상) 검색 성능 확인

### 15.2 호환성
- Chrome 88 이상 (Manifest V3 필수)
- Windows / macOS / Linux Chrome 브라우저

---

## 16. 배포 가이드 (Deployment)

### 16.1 Chrome Web Store 요구사항
- **아이콘**: 16x16, 32x32, 48x48, 128x128 (PNG)
- **설명**: 핵심 기능 및 개인정보 처리방침 포함
- **권한 설명**: 왜 `all_urls`와 `storage` 권한이 필요한지 명시

### 16.2 패키징
- `zip -r yyoink-v1.0.0.zip . -x "*.git*" "*.DS_Store*" "PRD*"`

---

## 17. 용어 사전 (Glossary)

- **Snippet**: 웹에서 수집하거나 직접 작성한 텍스트 조각.
- **Project**: 스니펫을 분류하는 폴더 개념의 단위.
- **Bypass**: 웹사이트의 복사 방지 기술을 우회하는 기능.
- **Hardcore Mode**: JavaScript를 완전히 차단하여 강력하게 우회하는 모드.
- **Side Panel**: 브라우저 우측에 고정되어 나타나는 UI 영역.
- **Content Script**: 웹 페이지의 컨텍스트에서 실행되는 스크립트.
- **Service Worker**: 백그라운드에서 메시징 및 메뉴를 관리하는 스크립트.

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
_이 문서는 yyoink 프로젝트의 최종 요구사항을 담고 있으며, 개발 및 QA의 기준점으로 사용됩니다._
