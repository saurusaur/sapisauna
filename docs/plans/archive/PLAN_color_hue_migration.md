# 컬러 hex → hue 마이그레이션 플랜

**상태:** 계획 단계
**작성일:** 2026-04-19
**예상 소요:** 2~2.5시간
**영향 범위:** 12~15 파일, DB 2 테이블(`lists`, `users`) + 1 뷰(`public_profiles`)

## Context

SA-리스트 커버 컬러피커가 방금 OKLCH 기반으로 전환되면서, hex → hue 역산 함수(`hexToOklchHue`) 유지가 필요해짐. 현 초기 단계(유저·리스트 수 적음)를 활용해 **hex 저장 완전 제거**하고 hue만 DB에 저장하는 구조로 한 번에 리팩토링. 톤 공식(OKLCH L/C 값) 변경 시 DB 건드릴 필요 없이 자동 반영되는 장점.

## 핵심 설계

- DB: `cover_color TEXT` → `cover_hue INT`, `profile_color TEXT` → `profile_hue INT`
- 렌더 시: hue를 보고 `listCoverHex(hue)` / `coverHex(hue)`로 hex 생성
- NULL hue = 기본색 사용 (리스트 `#78716c`, 프로필 트라이브 컬러)
- 편집 진입 시 `hexToHue` 역산 불필요 — DB의 hue 바로 사용
- `hexToHue` / `hexToOklchHue` 함수 제거

## 변경 파일

### 1. DB 마이그레이션 (SQL 2개)

**`supabase/019_color_hue_add.sql`** — hue 컬럼 추가 + 백업 테이블
```sql
-- 백업 (롤백 대비)
CREATE TABLE lists_color_backup_20260419 AS SELECT id, cover_color FROM lists WHERE cover_color IS NOT NULL;
CREATE TABLE users_color_backup_20260419 AS SELECT id, profile_color FROM users WHERE profile_color IS NOT NULL;

-- hue 컬럼 추가 (NULL 허용, 기본값 없음)
ALTER TABLE lists ADD COLUMN IF NOT EXISTS cover_hue INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_hue INT;
```

**`supabase/020_color_hue_drop_hex.sql`** — hex 컬럼 drop + 뷰 재생성 + 백업 테이블 정리
```sql
-- public_profiles 뷰 재생성
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT id, nickname, active_title, primary_type, profile_hue, profile_emoji
FROM users;
GRANT SELECT ON public_profiles TO anon, authenticated;

-- hex 컬럼 drop
ALTER TABLE lists DROP COLUMN IF EXISTS cover_color;
ALTER TABLE users DROP COLUMN IF EXISTS profile_color;

-- 백업 테이블 정리 (로컬 검증 완료 후 실행)
DROP TABLE IF EXISTS lists_color_backup_20260419;
DROP TABLE IF EXISTS users_color_backup_20260419;
```

### 2. 데이터 변환 스크립트 (TS 1개)

**`scripts/migrate_color_to_hue.ts`** — 019 실행 직후, 020 실행 전
- Supabase admin 클라이언트 사용 (SUPABASE_SERVICE_KEY)
- `lists` 전수 조회 → `cover_color` 있으면 `hexToOklchHue(hex)` → `UPDATE cover_hue`
- `users` 전수 조회 → `profile_color` 있으면 `hexToHue(hex)` (HSL) → `UPDATE profile_hue`
- 실행 로그: 변환 개수, 실패 row ID 리스트
- **멱등성 보장** — cover_hue 이미 있으면 skip

### 3. 타입 정의

**`src/types/index.ts`**
- `SaList`: `cover_color: string | null` → `cover_hue: number | null`
- `SaList`: `owner_profile_color` → `owner_profile_hue`
- 관련 쿼리 결과 타입

### 4. 서비스 레이어

**`src/lib/lists-service.ts`** (약 6곳)
- `.select(...)` 쿼리 컬럼명 변경 (cover_color → cover_hue, 조인 users 컬럼)
- `createList` INSERT 페이로드
- `updateList` UPDATE 페이로드
- `listToUnified` / 매핑 함수 필드명

**`src/contexts/user-context.tsx`** (약 4곳)
- `.select(...)` 컬럼명 변경
- `updateUser` 페이로드 타입

### 5. 렌더 헬퍼 신설

**`src/lib/utils.ts`**
```ts
export function listBgColor(hue: number | null | undefined): string {
  return hue == null ? '#78716c' : listCoverHex(hue)
}
export function profileBgColor(hue: number | null | undefined, fallback: string): string {
  return hue == null ? fallback : coverHex(hue)
}
```

### 6. 렌더 지점 일괄 교체

**리스트 커버 (7곳)**
- `src/components/features/sa-list-feed-row.tsx:37`
- `src/app/sa-list/page.tsx:376, 426`
- `src/app/sa-list/[id]/sa-list-detail-client.tsx:170, 257`
- `src/components/features/cover-card.tsx:40`
- `src/components/features/featured-sa-list-card.tsx:27`

패턴: `style={{ backgroundColor: list.cover_color || '#78716c' }}` → `style={{ backgroundColor: listBgColor(list.cover_hue) }}`

**프로필 아이콘 (5곳)**
- `src/components/features/profile-card.tsx:92`
- `src/app/settings/page.tsx:96-97`
- owner_profile_color 참조 (sa-list-detail-client 등)

### 7. 폼 컴포넌트

**`src/components/features/list-form-sheet.tsx`**
- `initialHex`, `hexToOklchHue(initialHex)` 제거
- `const [hue, setHue] = useState(() => initialData?.cover_hue ?? 0)`
- `onSubmit`에 `cover_hue: hue` 전달 (기존 `cover_color: coverColor` 제거)
- `coverColor = listCoverHex(hue)` — 미리보기 용도로만 유지

**`src/app/settings/profile-icon/page.tsx`**
- `hexToHue(initialHex)` 제거
- `user.profile_hue` 직접 사용
- submit 시 `profile_hue: hue`

### 8. 유틸 정리

**`src/lib/utils.ts`**
- `hexToHue` 제거
- `hexToOklchHue` 제거
- `hslToHex` 유지 (coverHex 내부에서 사용)
- `COVER_TONE`, `LIST_COVER_TONE`, `coverHex`, `listCoverHex` 유지

## 데이터 변환 전략

**왜 TS 스크립트인가:** HSL hue 변환은 plpgsql로 쓸 수 있지만, OKLCH hue는 sRGB → linear → LMS matrix → OKLab → OKLCH 변환이 필요해 SQL에서 구현 비효율. 이미 `hexToOklchHue`(culori) 있는 TS에서 돌리는 게 최선.

**실행 순서:**
1. 019 SQL 실행 → hue 컬럼 추가 (아직 NULL)
2. TS 스크립트 실행 → 기존 hex를 hue로 변환해 채움
3. 샘플 검증 (SELECT 5~10건 골라 hex ↔ hue 왕복 일치 확인)
4. 코드 배포 (hue 기반 렌더링)
5. 020 SQL 실행 → hex 컬럼 drop

## 검증 체크리스트

- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 통과
- [ ] `npm run lint` 신규 경고 없음
- [ ] 기존 리스트 조회 → 색 원래와 동일
- [ ] 기존 리스트 편집 진입 → 슬라이더 위치 맞음 → 저장 → 색 유지
- [ ] 신규 리스트 생성 → 색 저장 → 새로고침 → 같은 색
- [ ] 프로필 아이콘 동일 테스트
- [ ] public_profiles 뷰 조회 정상 (비로그인 피드)
- [ ] `user-context.tsx` refresh 동작

## 롤백 전략

| 단계 | 롤백 |
|---|---|
| 019 실행 후 | `ALTER TABLE ... DROP COLUMN cover_hue, profile_hue` (데이터 손실 없음) |
| 스크립트 실행 후 | 위와 동일 (hex는 그대로) |
| 코드 배포 후 문제 | 이전 커밋으로 revert (hex 컬럼 아직 살아 있음) |
| 020 실행 후 | 백업 테이블에서 hex 복구 (`UPDATE lists SET cover_color = b.cover_color FROM lists_color_backup_20260419 b WHERE lists.id = b.id`) |

## 리스크 및 주의사항

1. **배포 순서 민감**
   - 코드 배포 → DB 019는 backward-compatible이지만 code가 hue를 읽기 시작하면 데이터 마이그 전에 기본색만 보임
   - **권장 순서:** 019 실행 → 스크립트 실행 → 검증 → **이후** 코드 배포 → 마지막 020

2. **`public_profiles` 뷰** — 020 SQL에서 `profile_color` → `profile_hue`로 재생성. 비로그인 경로에서 누락 없는지 테스트 필수.

3. **Supabase 생성 타입** — 이 프로젝트는 수동 타입(`types/index.ts`) 사용 → 영향 없음 (확인 완료).

4. **Story cards** — 스토리 카드에서 `cover_color` 참조하는지 재확인 (현재 조사상 없음).

5. **소셜 공유 OG 이미지** — 리스트 공유 문구/썸네일에서 cover_color 사용 여부 재확인.

6. **`COVER_TONE` 변경과 공존** — 프로필 톤은 HSL 유지. hue만 저장되므로 나중에 프로필도 OKLCH로 바꾸면 DB 무변경으로 자동 반영됨 (아키텍처 이점).

## 미결정 사항

- [x] Fallback 색 (리스트 `#78716c`, 프로필 트라이브 컬러) 유지 — **확정**
- [x] 백업 테이블: 020 SQL에 DROP 포함 (로컬 검증 완료 후 즉시 정리) — **확정**
- [x] 배포: 오늘 중 production 적용 — **확정**

## 진행 단계 (커밋 단위)

1. **플랜 + SQL 019 + 변환 스크립트** (3 파일)
2. **스크립트 실행 + 샘플 검증** (커밋 없음, 로컬 DB)
3. **types + 서비스 레이어** (`types/index.ts`, `lists-service.ts`, `user-context.tsx`)
4. **렌더 헬퍼 + 렌더 지점 일괄** (`utils.ts` + 12곳)
5. **폼 컴포넌트** (`list-form-sheet.tsx`, `profile-icon/page.tsx`)
6. **유틸 정리 + SQL 020**
7. **검증 + 백업 테이블 정리 메모**
