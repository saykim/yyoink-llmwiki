# 개인정보 처리방침 - yyoink

**최종 업데이트**: 2026년 1월

## 개요

yyoink는 웹 스니펫을 수집하고 정리하는 것을 돕는 Chrome 확장 프로그램입니다. 사용자의 개인정보 보호는 무엇보다 중요합니다.

## 데이터 수집

### 수집하는 정보

- **스니펫**: 사용자가 웹 페이지에서 저장한 텍스트
- **프로젝트**: 사용자가 생성한 프로젝트 이름 및 색상
- **설정**: 테마 등 사용자 환경설정

### 수집하지 않는 정보

- 개인 식별 정보 (이름, 이메일 등)
- 웹 브라우징 기록
- 비밀번호 또는 민감한 정보
- 사용 분석 또는 추적 데이터

## 데이터 저장

모든 데이터는 Chrome의 저장소 API(`chrome.storage.local`)를 사용하여 **사용자의 기기에 로컬로만** 저장됩니다.

- **서버 전송 없음**: 데이터는 기기 외부로 전송되지 않습니다.
- **클라우드 동기화 없음**: 별도의 클라우드 서버에 동기화되지 않습니다.
- **제3자 공유 없음**: 데이터를 외부나 제3자와 공유하지 않습니다.

## 권한 (Permissions)

| 권한                  | 목적                            |
| --------------------- | ------------------------------- |
| `storage`             | 스니펫 및 설정을 로컬에 저장    |
| `activeTab`           | 텍스트 수집을 위해 현재 탭 접근 |
| `contextMenus`        | 우클릭 메뉴로 스니펫 저장       |
| `clipboardWrite/Read` | 복사 및 붙여넣기 기능 지원      |
| `sidePanel`           | 사이드 패널 인터페이스 표시     |

## 외부 서비스

- **Google Fonts**: Inter 폰트 로드
- **Google Favicon Service**: 웹사이트 아이콘(파비콘) 표시

위 서비스들은 각자의 개인정보 처리방침에 따라 익명의 사용 데이터를 수집할 수 있습니다.

## 데이터 제어

사용자는 자신의 데이터에 대해 완전한 통제권을 가집니다.

- **내보내기**: 언제든지 저장된 데이터를 파일로 다운로드할 수 있습니다.
- **삭제**: 개별 스니펫을 삭제하거나 전체 데이터를 초기화할 수 있습니다.
- **제거**: 확장 프로그램을 삭제하면 모든 로컬 데이터도 함께 삭제됩니다.

## 문의

개인정보 보호와 관련된 문의는 GitHub 저장소의 Issue를 통해 남겨주세요.

---

_이 확장 프로그램은 개인 데이터를 수집, 전송 또는 판매하지 않습니다._

<br>
<br>

# Privacy Policy - yyoink

**Last Updated**: January 2026

## Overview

yyoink is a Chrome extension that helps you collect and organize web snippets. Your privacy is important to us.

## Data Collection

### What We Collect

- **Snippets**: Text you choose to save from web pages
- **Projects**: Project names and colors you create
- **Settings**: Theme preferences

### What We Do NOT Collect

- Personal information (name, email, etc.)
- Browsing history
- Passwords or sensitive data
- Analytics or tracking data

## Data Storage

All data is stored **locally** on your device using Chrome's storage API (`chrome.storage.local`).

- **No server transmission**: Your data never leaves your device
- **No cloud sync**: Data is not synced across devices
- **No third-party sharing**: We do not share any data

## Permissions

| Permission            | Purpose                             |
| --------------------- | ----------------------------------- |
| `storage`             | Save snippets and settings locally  |
| `activeTab`           | Access current tab for text capture |
| `contextMenus`        | Right-click menu to save selections |
| `clipboardWrite/Read` | Copy and paste functionality        |
| `sidePanel`           | Display the extension interface     |

## External Services

- **Google Fonts**: Used to load the Inter font family
- **Google Favicon Service**: Used to display website icons

These services may collect anonymous usage data per their own privacy policies.

## Data Control

You have full control over your data:

- **Export**: Download all your data anytime
- **Delete**: Remove individual snippets or clear all data
- **Uninstall**: Removing the extension deletes all local data

## Contact

For privacy concerns, please open an issue on our GitHub repository.

---

_This extension does not collect, transmit, or sell any personal data._
