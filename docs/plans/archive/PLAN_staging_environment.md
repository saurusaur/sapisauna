# PLAN: Staging / Preview 환경 구축

> 작성일: 2026-04-29
> 목표: 라이브(프로덕션) 별개로 변경사항을 미리 확인·테스트 후 confirm 시 반영하는 흐름 구축

## 1. 현재 인프라 진단

| 영역 | 상태 |
|------|------|
| Git | 단일 `main` 브랜치 직접 푸시 (브랜치 전략 없음) |
| Vercel | 모든 배포 Production (preview deployment 활용 0) |
| Supabase | 단일 프로젝트 — production DB와 dev 작업이 같은 DB 공유 |
| 로컬 dev 로그인 | **불가** — Supabase Auth Redirect URL에 `localhost` 미등록 추정 |
| middleware.ts | 공개 라우트(`/auth/callback`, `/login`, `/explore`, `/home`, `/sa-list`) 정상 — 미들웨어 차단 아님 |
| 환경변수 | `.env.local`에 production Supabase 키 1세트만 존재 |

### 로컬 로그인 차단 진짜 원인 (검증 필요)

- middleware는 `/auth/callback` 통과시킴 → 미들웨어 문제 아님
- 가장 유력: **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** 에 `http://localhost:3000` 계열이 없음
- Google OAuth 로그인 후 Supabase가 callback URL 화이트리스트 검증 → localhost 거부 → redirect 실패 → 로그인 안 됨

## 2. 목표 워크플로

```
feature/xxx 브랜치
  ↓ push
Vercel Preview URL (sapisauna-git-feature-xxx-saunabum.vercel.app)
  ↓ 본인 확인 OK
main 머지
  ↓ 자동 배포
Production (sapisauna.vercel.app, 외부인 노출)
```

- 라이브 = 외부인 보는 그대로 유지
- 본인은 push마다 자동 발급되는 preview URL에서 변경사항 미리 확인
- main 머지는 본인이 직접 트리거 (= confirm 단계)

## 3. Phase 1 — 즉시 실행 (오늘, 30분 이내)

비용 0, Supabase 분리 없이 가장 가치 큰 변화. 1인 개발자에게 충분.

### 3-1. Supabase Redirect URL 화이트리스트 추가

**대시보드 경로**: Supabase Project → Authentication → URL Configuration → Redirect URLs

추가:
```
http://localhost:3000/**
http://localhost:3000/auth/callback
https://*-saunabum.vercel.app/**
https://*-saunabum.vercel.app/auth/callback
```

`*` 와일드카드로 모든 Vercel preview URL 자동 허용. (프로덕션 URL은 이미 등록되어 있을 것)

**효과**:
- 로컬 dev (`npm run dev`) 에서 Google OAuth 로그인 가능
- 모든 preview deployment URL에서도 로그인 가능

### 3-2. Git 브랜치 컨벤션 정착

```bash
# 작업 시작
git checkout main && git pull
git checkout -b feature/today-task

# 작업 + 푸시
git push -u origin feature/today-task
# → Vercel이 자동으로 preview URL 발급 (Vercel 대시보드 또는 GitHub PR 페이지에서 확인)

# preview URL에서 본인 확인 → OK면
git checkout main
git merge feature/today-task
git push origin main
# → 자동으로 production 배포

# 정리
git branch -d feature/today-task
git push origin --delete feature/today-task
```

**선택**: `preview` 라는 long-lived 브랜치 두기 — 여러 feature를 통합 테스트 후 main에 한꺼번에 머지하고 싶을 때 유용. 1인이고 변경 단위 작으면 불필요.

### 3-3. Vercel 환경변수 점검 (현재 그대로 두면 됨)

Vercel Dashboard → Settings → Environment Variables 의 각 키가 Production / Preview / Development 모두 체크된 상태일 것. 그대로 유지 — Phase 1에서는 같은 Supabase DB 공유.

### 3-4. (선택) Vercel Production Branch Protection

Vercel Dashboard → Settings → Git → Protected Git Branches 에 `main` 추가 → 직접 push 시 경고. 또는 GitHub 측에서 main branch protection rule.

1인 개발자라면 생략 OK.

### 3-5. 검증

- [ ] `npm run dev` 후 Google OAuth 로그인 → 홈 진입 확인
- [ ] `feature/test-preview` 브랜치 만들어 작은 변경 push → Vercel preview URL 발급 확인
- [ ] Preview URL에서 로그인 + 핵심 플로우 작동 확인
- [ ] main 머지 시 production 배포 확인 (기존 동작 유지)

## 4. Phase 2 — 베타 유저 30명+ 시 (DB 분리)

실유저 데이터가 쌓이기 시작하면 dev/preview 작업이 production 데이터를 오염시키지 않도록 분리.

### 4-1. Supabase Staging 프로젝트 생성

- Supabase 무료 티어 활성 프로젝트 2개까지 가능
- 새 프로젝트 이름: `sapisauna-staging`
- 기존 production 마이그레이션 SQL 전부 적용 (`supabase/001~022`)
- 어드민 계정 + 시드 시설 데이터 복사 (production export → staging import)

### 4-2. Vercel Environment Variables 분리

각 키마다 Production / Preview / Development 별 다른 값:

| 키 | Production | Preview / Development |
|----|------------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | production project | staging project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | staging |
| `SUPABASE_SERVICE_ROLE_KEY` | production | staging |
| `NAVER_CLIENT_ID` / `_SECRET` | 동일 | 동일 |
| `GOOGLE_PLACES_API_KEY` | 동일 | 동일 (또는 staging용 별도 key) |
| `NEXT_PUBLIC_SENTRY_DSN` | production project | staging project |

### 4-3. 로컬 `.env.local` 도 staging 으로 전환

로컬 dev 작업이 staging Supabase 사용하도록.

### 4-4. 마이그레이션 동기화 자동화 (선택)

Supabase CLI 사용 시:
```bash
supabase db push --project-ref staging-ref   # staging 먼저
# 검증 후
supabase db push --project-ref production-ref
```

### 4-5. 시드 동기화

production의 places 데이터를 주기적으로 staging에 동기화 (앱 콘텐츠는 같게):
```bash
# 예: pg_dump로 places + place_sources 테이블만 복사
pg_dump --table=places --table=place_sources <production_url> | psql <staging_url>
```

## 5. 결정 포인트

| 질문 | 추천 |
|------|------|
| Phase 1만 vs 1+2 동시? | **Phase 1만** 지금. Phase 2는 베타 유저 30명+ 시 |
| `preview` long-lived 브랜치 둘지? | **불필요** (1인 개발자, 작은 단위 변경 위주) |
| Branch protection? | **선택** (실수 방지 원하면 main만 보호) |
| Supabase Auth Redirect URL 와일드카드 안전한가? | **OK** — Supabase가 host 매칭, 임의 도메인 추가 불가 |

## 6. 작업 체크리스트 (Phase 1만)

### 즉시 실행
- [ ] Supabase Dashboard → Auth Redirect URLs 4개 추가
- [ ] 로컬 `npm run dev` 로그인 테스트
- [ ] 첫 `feature/xxx` 브랜치 만들어 preview URL 발급 테스트
- [ ] Vercel 환경변수 모든 키가 Preview/Development 체크됐는지 확인 (대시보드)

### 정착
- [ ] CLAUDE.md 또는 README에 워크플로 한 줄 추가:
  > 작업 시 `feature/xxx` 브랜치 → push → preview URL 확인 → main 머지

### 옵션
- [ ] Vercel Settings → Git Protected Branches 에 `main` 추가
- [ ] GitHub Branch Protection Rule (main, require PR)

## 7. Phase 2 트리거 시점

다음 중 1개라도 해당되면 Phase 2 진행:
- 베타 유저 30명 이상
- 마이그레이션 위험 작업 예정 (DB 스키마 큰 변경)
- 본인 외 협업자 합류
- production 데이터 오염 사고 1번 발생 (회복 가능 수준)

## 8. 비용

| 단계 | 비용 |
|------|------|
| Phase 1 | 0원 (Vercel 기본 plan + Supabase 1 project) |
| Phase 2 | 0원 (Supabase 무료 티어 2 project + Vercel 동일) |

Vercel Pro 플랜은 협업/팀 기능, 트래픽 늘 때만 필요. 현재 단계 hobby plan 충분.

## 9. 리스크 & 대비

| 리스크 | 대비 |
|--------|------|
| 와일드카드 Redirect URL 보안 | Supabase가 host 매칭 검증, 외부 도메인 추가 불가 → 안전 |
| 같은 DB 공유로 dev 데이터 오염 | 본인만 사용 + 작은 변경 단위 → 영향 미미. Phase 2 분리로 근본 해결 |
| preview URL 외부 노출 | URL은 알려지면 누구나 접근. 민감 데이터는 RLS로 차단됨. URL 추측 어려움 (해시 포함) |
| middleware redirect loop | `/auth/callback` 공개 라우트 확인됨. 문제 시 추가 디버깅 필요 |

## 10. 참조 링크

- [Vercel Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Auth URL Configuration](https://supabase.com/docs/guides/auth/concepts/redirect-urls)
- [Supabase 무료 티어 한도](https://supabase.com/pricing)
