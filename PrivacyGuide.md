# 개인정보 처리방침 - yyoink

**최종 업데이트**: 2026년 5월

## 개요

yyoink는 웹에서 선택한 텍스트와 메모를 수집해 주제별 개인 위키로 정리하는 Chrome 확장 프로그램입니다. 사용자의 개인정보 보호는 무엇보다 중요합니다.

## 데이터 수집

### 수집하는 정보

- **Source**: 사용자가 웹 페이지, 클립보드, 메모에서 직접 저장한 텍스트
- **Topic**: 사용자가 생성한 주제 이름, 설명, 색상
- **WikiPage 및 AI Draft**: 사용자가 실행한 AI 기능의 초안, 승인된 위키 본문, 출처 연결 정보
- **설정**: 테마, 활성 Topic, 사용자가 직접 입력한 OpenAI API key 및 모델명

### 수집하지 않는 정보

- 개인 식별 정보 (이름, 이메일 등)
- 웹 브라우징 기록
- 비밀번호 또는 민감한 정보
- 사용 분석 또는 추적 데이터

## 데이터 저장

Source, Topic, WikiPage, AI Draft는 브라우저의 IndexedDB에 저장됩니다. 설정과 OpenAI API key는 Chrome의 로컬 저장소(`chrome.storage.local`)에 저장됩니다.

- **기본 로컬 저장**: 수집 자료는 기본적으로 사용자의 기기에 저장됩니다.
- **클라우드 동기화 없음**: 별도의 클라우드 서버에 동기화되지 않습니다.
- **제3자 공유 없음**: yyoink는 데이터를 판매하거나 제품 분석 목적으로 공유하지 않습니다.

## AI 기능

AI 기능은 선택 사항입니다. 사용자가 OpenAI API key를 입력하고 `Generate Wiki`, `Update Wiki`, 또는 `Ask`를 직접 실행할 때만 선택된 Topic의 Source, WikiPage, 질문 내용이 OpenAI API로 전송됩니다.

- yyoink는 자체 서버를 운영하지 않으며 AI 요청은 사용자의 브라우저에서 OpenAI API로 직접 전송됩니다.
- API key는 사용자의 기기에 로컬 저장됩니다.
- AI 응답은 Draft로 저장되며, 사용자가 승인하기 전에는 WikiPage에 반영되지 않습니다.
- OpenAI로 전송된 데이터는 OpenAI의 개인정보 및 데이터 처리 정책의 적용을 받습니다.

## 권한 (Permissions)

| 권한                  | 목적                            |
| --------------------- | ------------------------------- |
| `storage`             | 설정, API key, 마이그레이션 상태 저장 |
| `activeTab`           | 텍스트 수집을 위해 현재 탭 접근 |
| `contextMenus`        | 우클릭 메뉴로 Source 저장       |
| `clipboardWrite/Read` | 복사 및 붙여넣기 기능 지원      |
| `sidePanel`           | 사이드 패널 인터페이스 표시     |

## 외부 서비스

- **Google Fonts**: Inter 폰트 로드
- **Google Favicon Service**: 웹사이트 아이콘(파비콘) 표시
- **OpenAI API**: 사용자가 직접 실행한 AI 위키 생성, 업데이트, 질문 기능 처리

위 서비스들은 각자의 개인정보 처리방침에 따라 데이터를 처리합니다. OpenAI API에는 위의 AI 기능 범위에 해당하는 선택 자료가 전송될 수 있습니다.

## 데이터 제어

사용자는 자신의 데이터에 대해 완전한 통제권을 가집니다.

- **내보내기**: 언제든지 Source, Topic, WikiPage, AI Draft를 JSON 파일로 다운로드할 수 있습니다.
- **삭제**: 개별 Source를 삭제하거나 전체 데이터를 초기화할 수 있습니다.
- **제거**: 확장 프로그램을 삭제하면 모든 로컬 데이터도 함께 삭제됩니다.

## 문의

개인정보 보호와 관련된 문의는 GitHub 저장소의 Issue를 통해 남겨주세요.

---

_이 확장 프로그램은 사용자의 데이터를 판매하지 않으며, AI 기능은 사용자가 직접 실행한 경우에만 선택된 자료를 OpenAI API로 전송합니다._

<br>
<br>

# Privacy Policy - yyoink

**Last Updated**: May 2026

## Overview

yyoink is a Chrome extension that helps you collect selected text and notes from the web and organize them into a topic-based personal wiki. Your privacy is important to us.

## Data Collection

### What We Collect

- **Sources**: Text you choose to save from web pages, clipboard input, or notes
- **Topics**: Topic names, descriptions, and colors you create
- **WikiPages and AI Drafts**: AI drafts, approved wiki content, and source citation links created by actions you run
- **Settings**: Theme, active topic, OpenAI API key, and model name you enter

### What We Do NOT Collect

- Personal information (name, email, etc.)
- Browsing history
- Passwords or sensitive data
- Analytics or tracking data

## Data Storage

Sources, Topics, WikiPages, and AI Drafts are stored locally in browser IndexedDB. Settings and your OpenAI API key are stored in Chrome local storage (`chrome.storage.local`).

- **Local by default**: Your collected material is stored on your device by default
- **No cloud sync**: Data is not synced across devices
- **No third-party sharing for analytics**: yyoink does not sell your data or share it for product analytics

## AI Features

AI features are optional. When you enter an OpenAI API key and explicitly run `Generate Wiki`, `Update Wiki`, or `Ask`, the selected Topic's Sources, WikiPage, and your question are sent to the OpenAI API.

- yyoink does not run its own server; AI requests are sent directly from your browser to OpenAI.
- Your API key is stored locally on your device.
- AI responses are saved as Drafts and are not applied to WikiPages until you approve them.
- Data sent to OpenAI is governed by OpenAI's privacy and data processing policies.

## Permissions

| Permission            | Purpose                             |
| --------------------- | ----------------------------------- |
| `storage`             | Save settings, API key, and migration state locally |
| `activeTab`           | Access current tab for text capture |
| `contextMenus`        | Right-click menu to save selections |
| `clipboardWrite/Read` | Copy and paste functionality        |
| `sidePanel`           | Display the extension interface     |

## External Services

- **Google Fonts**: Used to load the Inter font family
- **Google Favicon Service**: Used to display website icons
- **OpenAI API**: Used only for AI wiki generation, updates, and topic questions you run

These services process data under their own privacy policies. OpenAI may receive the selected material described in the AI Features section above.

## Data Control

You have full control over your data:

- **Export**: Download Sources, Topics, WikiPages, and AI Drafts anytime
- **Delete**: Remove individual Sources or clear all data
- **Uninstall**: Removing the extension deletes all local data

## Contact

For privacy concerns, please open an issue on our GitHub repository.

---

_This extension does not sell your data. AI features transmit selected material to OpenAI only when you explicitly run them._
