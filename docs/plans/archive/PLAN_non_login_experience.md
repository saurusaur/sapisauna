# 비로그인 경험 구현 플랜

## Context
P0 태스크 38일 이월. 베타테스터가 로그인 없이 앱을 탐색할 수 있어야 함. 보호 기능의 silent fail → 로그인 팝업 전환.

## 변경 파일 및 내용

### 1. `src/components/ui/login-prompt-modal.tsx` (신규)
- ConfirmModal 스타일 재사용 (overlay + 300px 카드)
- 문구: "이 기능을 사용하려면\n로그인이 필요해요.\n\n사-피엔스에 합류하세요!"
- 버튼: "로그인하기" (`/login?next=현재경로`) / "나중에"

### 2. `src/hooks/use-login-prompt.ts` (신규)
- `requireAuth()` → true/false, `showPrompt`/`setShowPrompt` 상태
- 각 컴포넌트에서 `if (!requireAuth()) return` 패턴

### 3. `src/middleware.ts` (수정)
- publicRoutes에 `/home`, `/sa-list` 추가

### 4. `src/app/home/page.tsx` (수정)
- redirect 제거. 기존 레이아웃 유지하되:
  - **프로필카드**: `!authUser`일 때 "로그인하고 나만의 사우나 카드를 만들어보세요" 유도 카드
  - **오늘의 기록**: "오늘 사우나 어떠셨어요?" + "로그인하고 기록하기" 버튼
  - **기록하기 CTA**: "로그인하고 기록하기" → 클릭 시 LoginPromptModal
  - 추천/커뮤니티 섹션: hooks가 빈 배열 반환 → 빈 상태 자연스럽게 노출

### 5. `src/components/features/profile-card.tsx` (수정)
- `!user`일 때 null 대신 로그인 유도 카드 반환
- 문구: "나만의 사우나 카드를 만들어보세요"
- 클릭 시 LoginPromptModal

### 6. `src/components/features/save-flow.tsx` (수정, line 53)
- `if (!user) return` → `if (!requireAuth()) return` + 모달 렌더

### 7. `src/hooks/use-subscriptions.ts` (수정, line 51)
- `toggle()`이 `!user`일 때 `'need_auth'` 반환

### 8. `src/app/sa-list/[id]/sa-list-detail-client.tsx` (수정)
- toggle 결과 `'need_auth'` 체크 → LoginPromptModal

### 9. `src/app/sa-list/page.tsx` (수정)
- 비로그인 시 '내 리스트' 칩 숨기기
- 리스트 생성 onSubmit: `if (!requireAuth()) return` + 모달

### 10. `src/components/bottom-nav.tsx` (수정)
- history, settings 탭 클릭 시: `!authUser`면 LoginPromptModal (middleware 리다이렉트 대신)

## 구현 순서
1. login-prompt-modal + use-login-prompt (기반)
2. middleware (라우트 공개)
3. profile-card (유도 카드)
4. home/page (빈 상태 + CTA 변경)
5. save-flow (찜 모달)
6. use-subscriptions + sa-list-detail-client (구독 모달)
7. sa-list/page (칩 숨기기 + 생성 모달)
8. bottom-nav (보호 탭 모달)

## 검증
- `npm run build` 빌드 성공 확인
- 비로그인: /home 빈 상태 + 유도카드, /explore 탐색, /sa-list 탐색
- 찜/구독/생성/기록/히스토리/설정 클릭 → 로그인 모달
- 로그인 후 ?next= 경로로 복귀
