# 첫 배포 가이드 (Clean DB Reset + Vercel)

> 작성: 2026-03-11

---

## 배포 전 필수 작업 체크리스트

### A. 블로커 (반드시 해결)

- [ ] **A1. PWA 아이콘 생성** — manifest.json이 참조하는 아이콘 파일이 없음
  - 필요: `public/icons/icon-192.png` (192x192)
  - 필요: `public/icons/icon-512.png` (512x512)
  - 없으면 PWA 설치 불가 + 콘솔 에러

- [ ] **A2. Supabase DB 클린 리셋** — 아래 Step 2에서 진행

- [ ] **A3. Supabase Auth — Google OAuth 리다이렉트 URL 설정**
  - 프로덕션 도메인 추가 필요 (현재 localhost만 등록되어 있을 가능성)

### B. 권장 (첫 배포 후에도 가능하지만 빨리 할수록 좋음)

- [ ] **B1. safeParse 타입 정리** — 5개 파일에서 4가지 패턴 혼용 중 (REVIEW_safeParse_errors.md)
- [ ] **B2. 비로그인 홈 UX** — 현재 CTA만 있음, 빈 상태 개선 가능
- [ ] **B3. Auth 가드 팝업** — 현재 리다이렉트 방식, 팝업으로 개선 예정

### C. 나중에 (P2 백로그)

- 장소 dedup 유저 확인 UI
- 폐업 확인 플로우
- Favorites → DB 마이그레이션
- 리워드 시스템 UI

---

## Step 1: PWA 아이콘 준비

앱 아이콘 이미지 2개를 준비하여 아래 경로에 저장:

```
public/
  icons/
    icon-192.png   (192×192px)
    icon-512.png   (512×512px)
```

> 팁: Figma/Canva에서 512px 정사각형으로 만들고 192px로 리사이즈.
> 투명 배경 PNG 권장.

---

## Step 2: Supabase DB 클린 리셋

Supabase Dashboard → SQL Editor에서 실행.

### 2-1. 기존 테이블 전부 삭제

```sql
-- 순서 중요 (외래키 의존성)
DROP TABLE IF EXISTS deep_logs CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS place_sources CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- RPC 함수도 삭제
DROP FUNCTION IF EXISTS find_nearby_places(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_place_stats(uuid);
```

### 2-2. 스키마 새로 적용

`supabase/001_schema.sql` 파일 전체를 SQL Editor에 붙여넣고 실행.

이 파일에 포함된 내용:
- users (xp, level, active_title 포함)
- places, place_sources
- logs, deep_logs (purposes 제거됨)
- RLS 정책, 인덱스, RPC 함수

### 2-3. sweat_quality 칼럼 추가 (스키마에 아직 미반영)

```sql
ALTER TABLE logs ADD COLUMN IF NOT EXISTS sweat_quality INT
  CHECK (sweat_quality BETWEEN 1 AND 5);
```

### 2-4. 확인

```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- users 칼럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' ORDER BY ordinal_position;
```

예상 결과: `users` 테이블에 `id, nickname, gender, user_types, primary_type, last_used_template, xp, level, active_title, created_at, updated_at` 11개 칼럼.

---

## Step 3: Supabase Auth 설정

### 3-1. Google OAuth Provider 확인

Supabase Dashboard → Authentication → Providers → Google

- Client ID, Client Secret 입력되어 있는지 확인
- Redirect URL 복사해두기 (Step 3-2에서 사용)


### 3-2. Google Cloud Console — 리다이렉트 URI 추가

Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client

**Authorized redirect URIs**에 추가:
```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

### 3-3. 프로덕션 도메인 추가 (Vercel 배포 후)

Supabase Dashboard → Authentication → URL Configuration

- **Site URL**: `https://your-domain.vercel.app` (또는 커스텀 도메인)
- **Redirect URLs**: `https://your-domain.vercel.app/auth/callback` 추가

> ⚠️ 이건 Step 5(Vercel 배포) 후에 URL을 알고 나서 설정. 먼저 배포하고 돌아올 것.

---

## Step 4: Vercel 프로젝트 생성 + 환경변수

### 4-1. Vercel에 프로젝트 연결

```bash
# Vercel CLI 설치 (없으면)
npm i -g vercel

# 프로젝트 루트에서
vercel
```

또는 https://vercel.com → "Add New Project" → GitHub 레포 연결

### 4-2. 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables

| Key | Value | Environment |
|-----|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview |
| `NAVER_CLIENT_ID` | 네이버 API Client ID | Production, Preview |
| `NAVER_CLIENT_SECRET` | 네이버 API Client Secret | Production, Preview |
| `GOOGLE_PLACES_API_KEY` | Google Places API Key | Production, Preview |

> `.env.local`에서 값 복사. Vercel에 등록하면 서버 빌드 시 자동 주입됨.

### 4-3. 빌드 설정 확인

Vercel Dashboard → Project → Settings → General

- Framework Preset: **Next.js** (자동 감지)
- Build Command: `next build` (기본값)
- Output Directory: `.next` (기본값)
- Node.js Version: **18.x** 이상

---

## Step 5: 첫 배포

### 방법 A: Git Push 자동 배포 (추천)

```bash
git add -A
git commit -m "chore: 첫 배포 준비 — PWA 아이콘 + 리워드 칼럼 추가"
git push origin main
```

Vercel이 GitHub 연결되어 있으면 push 시 자동 빌드+배포.

### 방법 B: CLI 수동 배포

```bash
vercel --prod
```

### 배포 후 확인

1. Vercel이 부여한 URL 확인 (예: `sauna-log.vercel.app`)
2. 브라우저에서 접속 → 로그인 화면 표시 확인
3. 콘솔 에러 없는지 확인 (F12 → Console)

---

## Step 6: 배포 후 마무리

### 6-1. Supabase Auth URL 업데이트 (Step 3-3으로 돌아가기)

Supabase Dashboard → Authentication → URL Configuration

- **Site URL**: `https://sauna-log.vercel.app` (실제 URL로 교체)
- **Redirect URLs**:
  - `https://sauna-log.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (개발용 유지)

### 6-2. Google OAuth — 프로덕션 도메인 추가

Google Cloud Console → Credentials → OAuth Client

**Authorized JavaScript origins** 추가:
```
https://sauna-log.vercel.app
```

**Authorized redirect URIs** — 기존 Supabase callback URL이면 변경 불필요.

### 6-3. 전체 플로우 테스트

| 단계 | 확인 사항 |
|------|----------|
| 1 | 로그인 페이지 → Google 로그인 성공 |
| 2 | 온보딩 → 닉네임 + 트라이브 선택 → 홈 이동 |
| 3 | 홈 → 퀵로그 작성 → 스토리 페이지 |
| 4 | 딥로그 작성 → 스토리 페이지 |
| 5 | 탐색 → 장소 검색 → 장소 상세 |
| 6 | 히스토리 → 기록 상세 → 삭제 |
| 7 | 설정 → 닉네임/트라이브 변경 |
| 8 | PWA 설치 (모바일 크롬 → "홈 화면에 추가") |

### 6-4. 커스텀 도메인 (선택)

Vercel Dashboard → Project → Settings → Domains → 도메인 추가
→ DNS 설정 안내에 따라 CNAME/A 레코드 추가
→ 추가 후 Supabase Site URL + Google OAuth도 새 도메인으로 업데이트

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Google 로그인 후 빈 화면 | Supabase Redirect URL 미등록 | Step 6-1 확인 |
| "redirect_uri_mismatch" 에러 | Google Console에 URI 미등록 | Step 6-2 확인 |
| 장소 검색 안 됨 | Vercel 환경변수 누락 | Step 4-2 확인 |
| PWA 설치 안 됨 | 아이콘 파일 없음 | Step 1 확인 |
| 빌드 실패 | TypeScript 에러 | `npm run build` 로컬에서 먼저 확인 |
