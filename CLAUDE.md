# Sauna Log Project Guide

## 1. Project Overview
- **Goal**: 3-Click 기반 사우나/찜질방 기록 및 인스타그램 스토리 공유 PWA
- **Key Feature**: 사용자 그룹(목욕파/사우너파/찜질파)별 맞춤형 기능적인 로그 템플릿과 서치 가능한 데이터베이스 제공
- **Target User**: 쉽고 예쁘게 사우나 생활을 기록하고 공유하고 싶은 2030 유저들

## 2. Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React 18
- **Backend/DB**: Supabase (Auth, Realtime, Storage, PostgreSQL)
- **External APIs**: Naver Search API (장소 검색), Google Places API (장소 보강)
- **Deployment**: Vercel & PWA (Future: Capacitor for App)

## 3. Project Structure
```
src/
├── app/           # App Router 페이지 (home, log, explore, sa-list, history, settings, story)
│   ├── api/       # Route Handlers (places/search)
│   └── auth/      # OAuth callback
├── components/    # features/ (도메인) · ui/ (공통) · svg/ (트라이브 그래프)
├── contexts/      # Auth, User, Toast, SavePlace
├── hooks/         # useLogs, usePlaces, useLists, useSubscriptions 등
├── lib/           # Service 레이어 (logs-, places-, lists-service) + utils
├── constants/     # content, rewards, story-colors
├── types/         # 중앙 타입 정의 (index.ts)
└── middleware.ts   # 인증 보호 (public: /login, /explore, /api)
```
- **DB 마이그레이션**: `supabase/migrations/` (001~012)
- **스크립트**: `scripts/` (시드 데이터, 일괄 등록)

## 4. Development Rules
- **Coding Style**: 초보자도 이해 가능하도록 주석을 달고, 단계별로 설명할 것.
- **Naming**: 파일 및 폴더명은 소문자 기반 케밥 케이스(kebab-case) 권장.
- **UI/UX**: 모바일 웹(PWA) 우선 디자인, 기능 메뉴·버튼은 'Google Material Symbols'. 이모지는 트라이브 타입 선택, **리스트 커버 이모지(ListFormSheet)**, **사-리스트 피드 필터 칩 라벨**에만 사용.

## 5. Metadata for AI
- 이 프로젝트는 사우너 루틴과 리뷰 전문성을 반영하여 단순한 기록을 넘어 전문적인 리뷰 앱이 되도록 도와야 함

## 6. 출력 규칙 (컨텍스트 절약 최우선)

- 터미널 출력은 최소화 — 컨텍스트 윈도우 보호가 최우선
- 답변은 3-5줄 요약. 상세 내용은 MD 파일 저장 후 경로만 안내
- 코드/로그/구현 과정 → 터미널 프린트 금지. 필요시 파일로 저장
- 서브에이전트 결과 → 핵심 1-2줄만 터미널에 출력
- 파일 내용 인용/복사 금지 → 요약하거나 경로만 안내
- 표(table)는 5행 이내. 그 이상은 파일 저장
- When compacting, always preserve: 변경 파일 목록, 미해결 사항, 현재 작업 브랜치

## 7. 자율 실행

| 레벨 | 범위 | 예시 |
|------|------|------|
| 자율 가능 | 코드 스타일, 에러 핸들링, 테스트 | 버그 수정, 리팩토링 |
| 계획 필요 | 새 파일, API 변경, 설정 변경 | Plan Mode 사용 |
| 확인 필수 | 파일 삭제, DB 변경, 10개+ 파일 수정 | 반드시 사용자 승인 |

## 8. 작업 방식

- 멀티파일 변경, 아키텍처 결정 → Plan Mode 먼저
- 단순 수정 (오타, 로그 추가) → 바로 구현
- 구현 후 테스트/검증까지 한 흐름으로
- 코드 리뷰 시 실행 검증 필수 — 정적 분석만으로 종료 금지
- 같은 접근 2회 실패 → 다른 방법 시도
- 3회 이상 막히면 → 사용자에게 상황 설명
- 탐색/조사가 길어지면 서브에이전트로 위임
- 결과가 길면 파일로 저장하고 경로만 보고

## 9. 자기개선 (Self-Improving)

- 실수 발생 시 → 일반 패턴으로 추상화 → rules/에 규칙 추가
- 규칙 추가 시 루트 CLAUDE.md보다 `.claude/rules/` 우선 — 루트는 80줄 이내 유지
- 같은 유형의 실수 반복 방지가 목적
- 규칙이 비대해지면 주기적으로 정리

## 10. 성능 모드

품질 우선. 토큰 절약보다 정확성과 완성도. 추정 금지, 사실 확인 철저히.
