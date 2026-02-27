# 변경 분석 — 커밋 분류 결과

> 생성: 2026-02-27
> 기준: `git diff HEAD` + `git status --short` (untracked 포함)
> 분류 기준: handoff_20260227_google_oauth.md의 5개 카테고리

---

## 요약

| # | 카테고리 | 수정 | 신규 | 삭제 | 비고 |
|---|----------|------|------|------|------|
| 1 | refactor: 중복 함수 추출, score 라벨 SSOT | 3 | 0 | 0 | |
| 2 | chore: 프로젝트 설정 | 1 | 10+ | 0 | .claude/, .vscode/, CLAUDE |
| 3 | feat: 스토리 에디터, 저장 유틸 | 0 | 11 | 0 | story/edit + story-editor 7개 + lib 3개 |
| 4 | chore: BACKLOG 부트스트랩 | 0 | 3 | 0 | docs/po/ |
| 5 | feat: Google OAuth 인증 | 12 | 5 | 0 | 핵심 구현 |
| ? | 미분류 | 7 | 3 | 2 | 아래 별도 정리 |

총 파일 수: **수정 23 + 신규 22+ + 삭제 2 = ~47건**

---

## 카테고리 1: refactor — 중복 함수 추출, score 라벨 SSOT

### src/lib/utils.ts (수정)
- `getRevisitEmoji`, `getTotonoLabel`, `getRestQualityLabel` 삭제
- `getStepLabel()` 범용 헬퍼 신규 추가 (content.ts SSOT 기반)
- `getWaterQualityLabel`, `getCleanlinessLabel` → `getStepLabel` + `QUICK_LOG` 상수로 재구현
- `getDetailText()` 공유 함수 신규 추가 (record-card, history 상세 등에서 사용)

### src/components/features/record-card.tsx (수정)
- 로컬 `getDetailText()` 함수 삭제 (15줄)
- import를 `utils.ts`의 `getDetailText`로 교체
- `getWaterQualityLabel`, `getCleanlinessLabel` import 제거

### src/app/history/[id]/page.tsx (수정)
- 로컬 `getStepLabel()` 함수 삭제 (4줄)
- 로컬 `getDetailText()` 함수 삭제 (16줄)
- import에 `getStepLabel`, `getDetailText` 추가 (utils.ts에서)

---

## 카테고리 2: chore — 프로젝트 설정

### CLAUDE.md (수정)
- 섹션 5~9 추가: 출력 규칙, 자율 실행 레벨, 작업 방식, 자기개선, 성능 모드

### .claude/ (신규 디렉토리) — 전체 신규
- `settings.json` — Claude Code 설정
- `rules/context-management.md` — 컨텍스트 절약 규칙
- `rules/execution-bias.md` — 실행 편향 규칙
- `rules/verification.md` — 검증 보고 규칙
- `hooks/format-ts.sh` — TS 포맷 훅
- `hooks/verify-gate.sh` — 검증 게이트 훅
- `skills/` (7개 디렉토리) — commit-flow, day, dev-cycle, devils-advocate, maker-checker, po, retro

### .vscode/ (신규 디렉토리) — 전체 신규
- `settings.json` (3줄)

### CLAUDE (신규 파일)
- 60줄, 루트에 별도 CLAUDE 파일 (확장자 없음)

---

## 카테고리 3: feat — 스토리 에디터, 저장 유틸

### src/app/story/edit/page.tsx (신규, 300줄)
- 스토리 편집 페이지 — 스티커 배치, 배경 선택, 크롭 등

### src/components/story-editor/ (신규 디렉토리, 7개 파일)
- `background-picker.tsx` (210줄) — 배경 색상/이미지 선택
- `crop-modal.tsx` (136줄) — 이미지 크롭 모달
- `editor-canvas.tsx` (168줄) — 에디터 캔버스 (forwardRef)
- `editor-toolbar.tsx` (70줄) — 에디터 툴바
- `sticker-content.tsx` (332줄) — 스티커 콘텐츠 렌더링
- `sticker-drawer.tsx` (144줄) — 스티커 목록 드로어
- `sticker.tsx` (149줄) — 개별 스티커 컴포넌트

### src/lib/sticker-templates.ts (신규, 110줄)
- 스티커 타입 정의 및 템플릿 목록

### src/lib/storage.ts (신규, 58줄)
- `saveLogToHistory()` — 로그를 localStorage savedLogs에 저장
- `getLogHistory()` — 저장된 로그 목록 조회

### src/lib/themed-backgrounds.ts (신규, 31줄)
- 배경 테마 정의 (색상 팔레트)

---

## 카테고리 4: chore — BACKLOG 부트스트랩

### docs/po/BACKLOG.md (신규, 21줄)
- 프로젝트 백로그 정의

### docs/po/DISCOVERY_LOG.md (신규, 14줄)
- 디스커버리 로그

### docs/po/VISION.md (신규, 13줄)
- 프로젝트 비전 문서

---

## 카테고리 5: feat — Google OAuth 인증

### 신규 파일 (5개)
| 파일 | 줄수 | 설명 |
|------|------|------|
| `src/app/auth/callback/route.ts` | 46 | OAuth 콜백: code→session 교환, 프로필 유무로 분기 |
| `src/app/login/page.tsx` | 61 | 로그인 페이지: Google 버튼, 에러 표시 |
| `src/contexts/auth-context.tsx` | 60 | AuthProvider: session 관리, signOut |
| `src/lib/supabase-server.ts` | 33 | 서버 클라이언트 (cookies 연동) |
| `src/middleware.ts` | 85 | 라우트 보호: 공개 라우트 외 인증 필수 |

### 수정 파일 (12개)
| 파일 | 변경 요약 |
|------|-----------|
| `src/app/layout.tsx` | `<AuthProvider>`로 앱 전체 래핑 |
| `src/app/page.tsx` | 루트 분기 로직: authUser/profile 기반으로 재작성 |
| `src/app/home/page.tsx` | 비로그인 CTA UI 추가, `useAuth` import |
| `src/app/settings/page.tsx` | `signOut()` 연동, ConfirmModal로 로그아웃 확인 |
| `src/app/onboarding/page.tsx` | authUser 있으면 Supabase users 테이블에 upsert |
| `src/app/explore/[id]/page.tsx` | 미인증 시 기록하기 → `/login?next=/log` 리다이렉트 |
| `src/contexts/user-context.tsx` | Supabase에서 프로필 로드 → localStorage 폴백 |
| `src/lib/supabase.ts` | `createClient` → `createBrowserClient` (@supabase/ssr) |
| `src/constants/content.ts` | `LOGIN` 상수 블록 추가 (홈 타이틀, CTA 텍스트 등) |
| `package.json` | `@supabase/ssr` 의존성 추가 |
| `package-lock.json` | `@supabase/ssr` 잠금 파일 업데이트 |

**주의**: `package.json`과 `package-lock.json`은 카테고리 3(스토리 에디터)의 의존성도 포함:
- `@use-gesture/react` — 스티커 드래그 (카테고리 3)
- `react-easy-crop` — 이미지 크롭 (카테고리 3)
- `@supabase/ssr` — OAuth 세션 관리 (카테고리 5)

→ **package.json/package-lock.json은 카테고리 5에 포함하되, 카테고리 3 의존성도 있음을 커밋 메시지에 명시하거나 카테고리 3 커밋 이후에 배치 권장**

---

## 미분류 / 카테고리 겹침 파일

### 여러 카테고리에 걸치는 파일

| 파일 | 주 카테고리 | 겹침 | 설명 |
|------|------------|------|------|
| `src/app/story/page.tsx` | **3** (스토리 에디터) | — | EditorCanvas 읽기 전용 모드, sessionStorage 에디터 상태 복원, 커스텀 카드 버튼 추가 |
| `src/app/complete/page.tsx` | **3** (저장 유틸) | — | `saveLogToHistory()` 연동, sessionStorage 정리, 새로고침 UX 개선 |
| `src/app/log/page.tsx` | **3** or 독립 | — | 장소 없으면 `/place`로 redirect 추가 (에디터 흐름 보완) |
| `src/app/globals.css` | **3** (스토리 에디터) | — | `@keyframes slide-up` + `.animate-slide-up` (바텀시트용) |
| `docs/STACK.md` | **2** (프로젝트 설정) | — | Emoji 사용 설명 업데이트 (tribe 요소) |
| `docs/LAUNCH_CHECKLIST.md` | **2** or **4** | — | 신규 런칭 체크리스트 (78줄) |

### DB 마이그레이션 변경

| 파일 | 변경 | 카테고리 |
|------|------|----------|
| `supabase/migrations/001_initial_schema.sql` | **삭제** | **5** (스키마 통합) |
| `supabase/migrations/002_add_fields.sql` | **삭제** | **5** (스키마 통합) |
| `supabase/migrations/001_schema.sql` | **신규** (204줄) | **5** (통합된 스키마) |

---

## 권장 커밋 순서

의존성 방향(하위→상위)을 고려한 순서:

```
1. chore: 프로젝트 설정 — CLAUDE.md, .claude/, .vscode/, CLAUDE, docs/STACK.md
2. chore: BACKLOG 부트스트랩 — docs/po/, docs/LAUNCH_CHECKLIST.md
3. refactor: 중복 함수 추출, score 라벨 SSOT — utils.ts, record-card.tsx, history/[id]/page.tsx
4. feat: 스토리 에디터, 저장 유틸 — story/edit/, story-editor/ 7개, lib 3개, story/page.tsx, complete/page.tsx, log/page.tsx, globals.css, package.json(일부)
5. feat: Google OAuth 인증 — auth/, login/, auth-context, supabase-server, middleware, layout, page, home, settings, onboarding, explore, user-context, supabase.ts, content.ts(LOGIN), package.json(@supabase/ssr), migrations
```

### package.json 분리 문제
`package.json`에 카테고리 3(`@use-gesture/react`, `react-easy-crop`)과 카테고리 5(`@supabase/ssr`)의 의존성이 섞여 있어, 커밋 4와 5에서 각각 해당 줄만 추가하는 방식이 이상적이지만, 실무적으로는 **커밋 4에 package.json 전체 포함**이 간편함.

---

## 수치 요약

| 지표 | 값 |
|------|-----|
| diff 내 수정 파일 | 20개 |
| diff 내 삭제 파일 | 2개 |
| untracked 신규 파일 | 22+개 (디렉토리 포함) |
| 총 변경 파일 | ~47건 |
| diff 줄 수 (추가/삭제) | +530 / -490 (tracked만, migrations 제외 시 +350/-220) |
| 신규 코드 줄 수 (untracked) | ~1,769줄 (src만) + ~393줄 (docs/config) |
