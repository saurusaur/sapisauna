# Handoff: Google OAuth 구현 복원 (2026-02-27)

## 현재 상태: 파일 복원 완료, 빌드 검증 필요

## 완료된 작업

### 1. 로컬 전용 4개 커밋 변경사항 — 전부 반영 확인됨
| 커밋 | 내용 | 주요 파일 |
|------|------|----------|
| a5958d9 refactor | 중복 함수 추출, score 라벨 SSOT | utils.ts, content.ts, record-card.tsx |
| 9d80c62 chore | 프로젝트 설정 | .claude/, .vscode/, CLAUDE.md |
| 7e329bf feat | 스토리 에디터, 저장 유틸 | story/edit/, story-editor/ 7개, storage.ts, sticker-templates.ts |
| 65b3589 chore | BACKLOG 부트스트랩 | docs/po/ (BACKLOG, DISCOVERY_LOG, VISION) |

### 2. Auth 구현 — 5개 신규 파일 복사 완료
1. `src/app/auth/callback/route.ts` — OAuth 콜백
2. `src/app/login/page.tsx` — Google 로그인 페이지
3. `src/contexts/auth-context.tsx` — AuthContext (user/session/signOut)
4. `src/lib/supabase-server.ts` — 서버 Supabase 클라이언트
5. `src/middleware.ts` — 라우트 보호 미들웨어

### 3. Auth 연동 기존 파일 수정 — working tree에 반영됨
- layout.tsx, user-context.tsx, page.tsx, home/page.tsx, settings/page.tsx
- onboarding/page.tsx, content.ts, supabase.ts, explore/[id]/page.tsx

### 4. 정리 완료
- CLAUDE.md → broken 기준으로 복원
- supabase/migrations/ → 001_schema.sql만 유지 (구 migration 2개 삭제)

### 5. 패키지
- `@supabase/ssr@0.8.0` — 설치 확인됨
- `@supabase/supabase-js` — 기존 설치

## 다음 단계 (로컬에서 진행)

### Step 1: 빌드 검증
```bash
npx tsc --noEmit        # 타입 체크 (빠름)
npx next build          # 풀 빌드
```

### Step 2: 에러 수정 (있을 경우)
빌드 에러 발생 시 아래 프롬프트 사용

### Step 3: .env.local 실제 키 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://<실제값>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<실제값>
```

### Step 4: Supabase 프로젝트 설정
- Google OAuth provider 활성화 (Dashboard → Authentication → Providers)
- Redirect URL: `http://localhost:3000/auth/callback`
- `001_schema.sql` 실행하여 users 테이블 생성

### Step 5: 커밋 정리
```bash
git add -A
git commit -m "feat: Google OAuth 인증 + 4개 로컬 커밋 복원 통합"
```

## 정리 대상
- `sauna_log_broken/` — git 깨짐, 소스는 main에 전부 반영됨. 삭제 가능
- `/tmp/sauna_auth_changes/` — broken과 동일. 삭제 가능
