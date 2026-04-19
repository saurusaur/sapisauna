# SA-리스트 v1.1 구현 핸드오프 (2026-03-23 오후)

## 배경
SA-리스트 MVP 코드를 분석 → 벤치마크(Spotify/Letterboxd/IG/YT) + Devil's Advocate 리뷰 수행 → v1 버그 수정 + v1.1 기능 구현 진행. DB 010번 마이그레이션은 아직 Supabase에 미실행 상태 (SQL 파일만 수정).

## 플랜 파일
`.claude/plans/idempotent-giggling-church.md` — 전체 구현 계획

## 분석 파일
- `docs/research/sa_list_benchmark_20260323.md` — 4앱 벤치마크 비교
- `docs/handoff/review_sa_list_devils_advocate.md` — 27건 이슈 리뷰

## 핵심 설계 변경 (이번 세션)

### is_public → visibility 3단계 전환
- `private` (본인만) → `unlisted` (링크 공유, 비로그인 접근 가능) → `public` (발견 피드 노출)
- DB 스키마에서 `is_public BOOLEAN` 제거 → `visibility TEXT CHECK ('private','unlisted','public')` 교체
- **모든 코드에서 `is_public` 참조 제거 완료**

### useSavePlace Context Provider화
- `src/hooks/use-save-place.ts` → 로직을 `src/contexts/save-place-context.tsx`로 이동
- hook은 thin re-export로 변경 (기존 import 호환)
- `SavePlaceProvider`가 `layout.tsx`에서 앱 전체를 감싸므로 모든 컴포넌트가 같은 캐시 공유

### 스낵바 연동 (하트 탭 UX)
- 하트 탭 → 기본 저장 + 리치 스낵바 5초 (리스트 빠른 토글)
- 재탭(제거) → SaveBottomSheet(remove) 바로 열기
- 스낵바 `···` → SaveBottomSheet(save) 열기
- 스낵바에 터치/호버 시 auto-dismiss 일시중지 구현

---

## 완료된 작업

### SQL 수정 (supabase/010_lists.sql)
- ✅ `is_public` → `visibility` 전환
- ✅ place_count 트리거 double-decrement 버그 수정 (`place_count < 3` 기준)
- ✅ RLS: 비공개 리스트 구독 차단 (visibility IN ('public','unlisted') 조건 추가)
- ✅ default 리스트 삭제 방지 트리거 + RLS `lists_delete`에 `type != 'default'` 조건
- ✅ MAX_LISTS 15개 DB 제한 트리거
- ✅ 자동 visibility 강등: public → unlisted (place_count < 3 시, 링크 접근 유지)
- ✅ 인덱스 `idx_lists_visibility` 교체

### 타입 (src/types/index.ts)
- ✅ `ListVisibility` 타입 추가
- ✅ `SaList.is_public` → `SaList.visibility` 교체

### 서비스 (src/lib/lists-service.ts)
- ✅ `is_public` → `visibility` 전체 전환
- ✅ `createList`: visibility 파라미터 지원
- ✅ `updateList`: visibility 전환 시 slug 자동 생성
- ✅ `getPublicLists`: `visibility = 'public'` 필터

### 신규 파일
- ✅ `src/contexts/save-place-context.tsx` — SavePlace Context Provider (getSavedListIds, refreshMyLists 추가)
- ✅ `src/lib/lists-service-server.ts` — 서버 컴포넌트용 리스트 조회 (generateMetadata용)
- ✅ `src/app/sa-list/[id]/sa-list-detail-client.tsx` — 클라이언트 컴포넌트 분리

### 수정된 파일
- ✅ `src/hooks/use-save-place.ts` — Context re-export로 변경
- ✅ `src/hooks/use-lists.ts` — useList에 refresh 함수 추가
- ✅ `src/app/layout.tsx` — SavePlaceProvider 추가
- ✅ `src/components/features/cover-card.tsx` — visibility 3단계 배지 + 큐레이션 배지 + canShare 조건
- ✅ `src/components/ui/snackbar.tsx` — onShowMore 콜백 + 인터랙션 일시중지
- ✅ `src/app/sa-list/page.tsx` — visibility 토글 + 발견 탭 큐레이션/최근 공개 섹션 분리
- ✅ `src/app/sa-list/[id]/page.tsx` — 서버 컴포넌트 + generateMetadata (OG 카드)
- ✅ `src/app/explore/page.tsx` — 스낵바 + SaveBottomSheet 연동
- ✅ `src/app/explore/[id]/page.tsx` — 스낵바 + SaveBottomSheet 연동
- ✅ `src/app/explore/type/[type]/page.tsx` — 스낵바 + SaveBottomSheet 연동

### 삭제된 파일
- ✅ `src/hooks/use-favorites.ts` — 이전에 이미 삭제됨 확인

---

## 미완료 / 검증 필요

### 빌드 검증 필수
- `npm run build` 돌려서 타입 에러 확인 필요
- 특히 `is_public` 잔여 참조가 있을 수 있음 → grep으로 확인: `grep -r "is_public" src/`

### usePlaces 전체 로드 이슈 (미해결)
- `sa-list-detail-client.tsx`에서 `usePlaces()` 호출 → 전체 229건 로드
- 개선 방향: 추가 시트 열 때만 lazy fetch, 또는 서버사이드 검색 엔드포인트
- 현재 229건이라 실용적 문제 없으나, 장소 1000건 이상 시 개선 필요

### SaveBottomSheet의 useSavePlace 사용
- `save-bottom-sheet.tsx`가 `useSavePlace()` 직접 호출 → 이제 Context에서 가져오므로 캐시 공유 OK
- **그러나** `save-bottom-sheet.tsx` 내부의 `myLists` 참조가 Context 기준인지 확인 필요

### 코드 정리 (플랜 2-6, 미착수)
- 공유 로직 중복: `cover-card.tsx` + `sa-list-detail-client.tsx` → `src/lib/share.ts` 유틸 추출
- visibility 토글 로직 중복: `sa-list/page.tsx` + `sa-list-detail-client.tsx` → `use-list-actions.ts` 훅
- 이 정리는 기능 검증 후 별도 커밋으로 진행 권장

### 스낵바 관련 엣지 케이스
- `snackbar.tsx:47` — `onDismiss`가 useEffect dep array에 있어서, 부모가 useCallback 안 쓰면 무한 재시작 가능
  - explore 페이지에서는 `() => setSnackbarPlaceId(null)` 인라인 함수 → 매 렌더마다 새 참조
  - 실 사용 시 문제 없으면 OK, 문제 발생 시 snackbar 내부에서 ref로 보호 필요

### DB 마이그레이션
- `supabase/010_lists.sql` 아직 Supabase에 실행 안 함
- 실행 후 테스트 필요: 트리거, RLS, 기본 리스트 자동 생성

### OG 카드
- `generateMetadata` → `getListByIdServer` 호출 → 서버 Supabase 클라이언트 사용
- 비로그인 상태에서 public/unlisted 리스트의 OG 태그 정상 생성 확인 필요
- 배포 후 `curl -A 'facebookexternalhit' URL` 로 검증

### 큐레이션 리스트 시드 데이터
- 어드민 계정으로 type='admin' 리스트 2-3개 생성 필요
- 주제는 유저와 별도 논의 예정

---

## 고려된 컨텍스트

### 벤치마크 핵심 결정
- YouTube식 3단계 공개 (private/unlisted/public) 채택
- Letterboxd식 에디토리얼 피쳐 → 발견 탭 큐레이션 섹션 분리
- Spotify식 Save-then-Snackbar → 하트 탭 → 리치 스낵바 5초 UX
- Instagram식 Progressive Disclosure → 기본 리스트 자동 생성 유지

### Devil's Advocate 주요 수정
- place_count 트리거 off-by-one 버그 (CRITICAL) → 수정 완료
- RLS 비공개 리스트 구독 허용 (HIGH) → visibility 기반 차단으로 수정
- 삭제 확인 없음 (HIGH) → window.confirm 추가
- default 리스트 삭제 방지 없음 (HIGH) → 트리거 + RLS 이중 차단
- MAX_LISTS 클라이언트만 (HIGH) → DB 트리거 추가
- router.refresh() 작동 안 함 (HIGH) → useList에 refresh 추가
- 비공개 리스트 공유 버튼 (HIGH) → visibility='private' 시 숨김

### 아키텍처 결정
- `useSavePlace`를 Context로 승격 → 모든 페이지에서 같은 savedMap 캐시 공유
- OG 카드를 위해 `sa-list/[id]/page.tsx`를 서버+클라이언트로 분리
- `lists-service-server.ts` 별도 생성 (서버 Supabase 클라이언트 사용)

## 현재 브랜치
main (아직 커밋 안 함)
