# PLAN: 전체 앱 안정화 (2026-02-28)

> **상태 확인**: 2026-03-03 — 11건 중 1.5건만 완료. DB 셋업 우선으로 미뤄졌던 플랜.

## 근본 원인 (반박 반영)
화이트 스크린 크래시 체인:
1. placeholder Supabase URL → `getSession()` 네트워크 실패
2. `.catch()` 없음 → `isLoading`이 영원히 `true`
3. `UserProvider`가 `null` 반환 → error.tsx 없음 → 404 루프

## 작업 목록

### P0: 화이트 스크린 해결 (4파일)
1. ❌ `src/contexts/auth-context.tsx:23` — `getSession().then().catch()` 추가, 실패시 `isLoading=false` 보장
2. ⚠️ `src/middleware.ts:67` — `getUser()` try/catch 감싸기 ❌ + `/onboarding`을 publicRoutes에 추가 ✅
3. ❌ `src/contexts/user-context.tsx:89` — `return null` → 로딩 스피너 반환
4. ❌ `src/app/error.tsx` — 글로벌 에러 바운더리 신규 생성

### P1: 에러 핸들링 (7+파일)
5. ❌ `src/lib/utils.ts` — `safeParse()` 유틸 함수 추가
6. ❌ `src/app/login/page.tsx:12-18` — OAuth try/catch + 에러 UI (URL ?error 배너는 있음)
7. ❌ `src/app/onboarding/page.tsx:109-115` — Supabase upsert try/catch
8. ❌ `src/contexts/user-context.tsx:38` — Supabase select try/catch
9. ❌ JSON.parse 무방비 9건: log/page(x2), log/deep/page(x2), complete/page, story/page, story/edit/page, user-context, utils.ts storage.get

### P2: Lint 정리 (2파일)
10. ❌ `src/app/layout.tsx:37` — Google Fonts `<link>` → `next/font/google`
11. ✅ `src/app/history/page.tsx` — useMemo deps 이미 정상

## 작업 순서
P0(1→2→3→4) → P1 → P2

## 예상 변경 파일: ~15개
## 빌드 검증: 각 P레벨 완료 후 `tsc --noEmit` + dev server 확인
