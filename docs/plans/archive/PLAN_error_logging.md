# Error Logging 도입 플랜 — 구현 완료

> 목표: 프로덕션에서 유저 에러를 개인정보 없이 수집 · 알림 · 대응
> **최종 선택: Sentry 단독** (Axiom 기각 — 클라이언트 에러 사각지대, 번들 비용 허용 범위)
> **상태: 코드 구현 완료, Sentry 계정 셋업 대기 중**

## 현황 분석

| 항목 | 상태 |
|------|------|
| 에러 바운더리 | `error.tsx` 있음, `global-error.tsx` 없음 |
| console.error | 9곳 (auth, log, history, story, places, reward, DataState, user-context) |
| 디버깅 console.log | 24곳 (process-photo, image-export — 프로덕션 노출 중) |
| 모니터링 라이브러리 | 없음 |
| Middleware 에러 로깅 | 없음 (암묵적 catch) |

## 솔루션 비교 (검증 완료)

| 기준 | Sentry | Axiom | Supabase 자체 |
|------|--------|-------|---------------|
| 셋업 | 중 (wizard+3파일) | **저 (1-click)** | 높 (테이블+API+UI) |
| 번들 영향 | ~30KB gzip | **~3KB** | 0 |
| 무료 한도 | 5K/월 | **500GB/월** | DB 용량 내 |
| 서버 에러 | 좋음 | **우월 (Vercel 네이티브)** | 단일장애점 |
| 클라이언트 에러 | **우월** | 약함 | 직접구현 |
| PII 필터 | 내장 | 없음 | 직접구현 |
| 알림 | 이메일/슬랙 | **슬랙/이메일** | 직접구현 |
| 퇴출 비용 | 중 | **저** | 저 |

## Devil's Advocate 핵심 발견

1. **Sentry는 현 단계에서 과하다** — 번들 +30KB(PWA 성능), 알림 피로(1인 개발자), 운영 부담이 유저 수십명 베타에서 정당화 안 됨
2. **Axiom이 "에러만 수집" 목표에 더 정확히 부합** — 서버 로그 자동 수집, 번들 무영향, 한도 무제한급
3. **래퍼 패턴으로 퇴출 비용 제로화** — `error-logger.ts` 1개 파일만 수정하면 Sentry로 전환 가능
4. **소스맵 보안 주의** — Sentry 도입 시 `hideSourceMaps: true` 필수
5. **Supabase 자체 로깅은 비추** — DB 장애 시 로그도 유실, 단일장애점

## 최종 전략: Axiom + 경량 래퍼 (단계적 확장)

### Phase 1: 즉시 (오늘)
- [ ] `src/lib/error-logger.ts` 래퍼 생성
  ```ts
  export function captureError(error: unknown, context?: { label?: string; extra?: Record<string, string> }) {
    const label = context?.label ?? 'Error';
    console.error(`[${label}]`, error);
    // Phase 2에서 Axiom log.error() 연결
    // Phase 3에서 Sentry.captureException() 연결
  }
  ```
- [ ] 기존 `console.error` 9곳 → `captureError()` 교체
- [ ] `src/app/global-error.tsx` 생성 (레이아웃 레벨 에러 캐치)
- [ ] 프로덕션 디버깅 로그 정리: `process-photo.ts`, `image-export.ts`의 console.log/time 제거 또는 dev-only 분기

### Phase 2: 이번 주
- [ ] Axiom Vercel 통합 (Vercel Dashboard > Integrations > Axiom)
- [ ] `next-axiom` 패키지 설치, `error-logger.ts`에 Axiom 연결
- [ ] Axiom 대시보드에서 에러 필터 모니터 생성
- [ ] 이메일 알림 설정 (Error 레벨만)

### Phase 3: 유저 100명+ 도달 시
- [ ] Sentry 도입 검토
- [ ] 클라이언트 에러 추적 필요성 평가
- [ ] `error-logger.ts` 래퍼에 Sentry SDK 연결

## 변경 파일 예상

| 파일 | 작업 |
|------|------|
| `src/lib/error-logger.ts` | **신규** — 에러 로깅 래퍼 |
| `src/app/global-error.tsx` | **신규** — 전역 에러 바운더리 |
| `src/contexts/user-context.tsx` | console.error → captureError |
| `src/app/auth/callback/route.ts` | console.error → captureError |
| `src/app/api/places/search/route.ts` | console.error → captureError |
| `src/app/log/page.tsx` | console.error → captureError |
| `src/app/log/deep/page.tsx` | console.error → captureError |
| `src/app/history/[id]/page.tsx` | console.error → captureError |
| `src/app/story/page.tsx` | console.error → captureError (2곳) |
| `src/lib/reward-service.ts` | console.error → captureError |
| `src/components/ui/data-state.tsx` | console.error → captureError |
| `src/lib/process-photo.ts` | 디버깅 로그 제거/dev-only |
| `src/lib/image-export.ts` | 디버깅 로그 제거/dev-only |
| `package.json` | next-axiom 추가 (Phase 2) |
| `next.config.js` | withAxiom 래핑 (Phase 2) |

## PII 방어

- `sendDefaultPii: false` (Sentry 도입 시)
- `captureError` 래퍼에서 UUID/이메일 패턴 자동 스크러빙
- Supabase 에러 메시지에서 user_id 노출 방지: 에러 전파 전 메시지 정제
- Axiom은 서버 로그만 수집 → 클라이언트 PII 노출 경로 자체가 없음

## 리스크

| 리스크 | 레벨 | 대응 |
|--------|------|------|
| Axiom 클라이언트 에러 사각지대 | MEDIUM | Phase 1 래퍼가 console.error로 Vercel Function Log에 남김 |
| 알림 피로 | LOW | Error만 알림 + 주 1회 리뷰 루틴 |
| SW(Service Worker) 에러 미수집 | LOW | PWA SW 미사용 중, 도입 시 별도 핸들러 |
| Axiom 서비스 중단 | LOW | 래퍼 패턴으로 즉시 전환 가능 |
