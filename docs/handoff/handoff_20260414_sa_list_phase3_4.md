# Handoff: SA-LIST 리뉴얼 Phase 3~4

> Phase 1(홈 레이아웃) + Phase 2(검색/태그)는 `handoff_20260414_sa_list_renewal.md` 참조.
> 이 문서는 Phase 1+2 완료 후 이어서 진행할 나머지 구현 내용.

---

## Phase 3: 상세 페이지 리뉴얼 + Featured 구독 상태

### 3-1. 상세 페이지 헤더 리뉴얼
**파일**: `src/app/sa-list/[id]/sa-list-detail-client.tsx`
**와이어프레임**: `docs/wireframes/sa-list-detail.html` (Visitor/Owner 2 variant)

**변경 내용:**
- 커버 영역: cover_color 배경 + 이모지 48px + 제목 22px bold + 설명
- 블랙 그라데이션 제거 (현재 없으니 추가하지 말 것)
- 네비 버튼: 배경 원형 제거 → 아이콘만 (white, 앱 패턴)
  - Visitor: ← 뒤로 + 공유
  - Owner: ← 뒤로 + 공유 + more_vert (3-dot 메뉴)

**크리에이터 섹션 변경:**
- 아바타: 둥근 사각형 `border-radius: 10px` (현재 없음, 유저 profile_emoji+profile_color 사용)
- 유저네임: 영문 대문자 `uppercase`
- 장소 수 아이콘: `onsen`
- 구독자 수: 눈에 띄게 (0이면 "첫 번째 구독자가 되어보세요")
- Owner: 구독 버튼 대신 공개상태 배지 + `expand_more` 쉐브론 (탭하면 visibility 변경)

**장소 카드 (Owner variant):**
- 기존 PlaceCard collection variant 유지
- 메모 수정 버튼 + 제거 버튼 추가 (제거는 `margin-left: auto` 오른쪽 끝)
- 제거 로직: 다른 리스트에도 저장되어 있으면 확인 모달 → 이 리스트에서만 제거 + Undo 스낵바
- "장소 추가" 버튼: dashed border, `add_location` 아이콘

**태그 섹션 추가:**
- 크리에이터 섹션 아래, 장소 목록 위
- 태그 칩 가로 flex wrap
- 현재 코드에 태그 표시 없음 → `list.tags` 읽어서 칩 렌더

### 3-2. Featured 카드 구독 상태 표시
**파일**: `src/components/features/featured-sa-list-card.tsx`

**변경 내용:**
- props에 `subscribed?: boolean` 추가
- 우상단에 pill 배지:
  - 구독중: 흰 배경 + 블랙 텍스트 + check 아이콘
  - 미구독(구독하기): 흰 배경 + 레드(`var(--color-primary)`) 텍스트

**데이터 연동:**
- `sa-list/page.tsx`에서 `useSubscribedLists` → subscribedIds Set 생성
- `featuredLists.map(list => <FeaturedSaListCard subscribed={subscribedIds.has(list.id)} />)`

---

## Phase 4: 크리에이터 소셜 링크 + 공유 문구

### 4-1. 크리에이터 소셜 링크

**DB 마이그레이션:**
```sql
-- supabase/018_list_creator_links.sql
ALTER TABLE lists ADD COLUMN creator_links JSONB DEFAULT '{}';
```
- 저장 형식: `{ "instagram": "username", "naver_blog": "blogid" }`
- **DB에는 username/ID만 저장**

**코드 상수** (`src/constants/content.ts`):
```ts
export const CREATOR_LINK_PREFIXES: Record<string, string> = {
  instagram: 'https://instagram.com/',
  naver_blog: 'https://blog.naver.com/',
}
```
- 플랫폼 URL 변경 시 상수만 수정, DB 안 건드림

**타입** (`src/types/index.ts`):
- `SaList`에 `creator_links?: Record<string, string>` 추가

**리스트 생성/편집 폼** (`src/components/features/list-form-sheet.tsx`):
- 토글 "소셜 링크 추가" → 플랫폼별 입력 행
- 각 행: 플랫폼 아이콘(SVG) + 프리픽스 라벨(읽기전용) + username input
- initialData/onSubmit에 `creator_links` 추가
- 2개만: 인스타그램 + 네이버 블로그

**상세 페이지** (`sa-list-detail-client.tsx`):
- 크리에이터 이름 옆 소셜 아이콘 버튼
- 클릭 시 `CREATOR_LINK_PREFIXES[platform] + username`으로 `window.open`
- 유저가 입력한 링크만 표시 (없으면 숨김)

**아이콘:**
- 인스타그램: SVG (와이어프레임에 있음)
- 네이버 블로그: N 로고 SVG (와이어프레임에 있음)

**서비스** (`src/lib/lists-service.ts`):
- `createList`, `updateList`에 `creator_links` 필드 추가
- `getListById` 쿼리에 `creator_links` 포함 (JSONB → 자동 파싱)

### 4-2. 공유 문구 개선
**파일**: `src/lib/share.ts`

**현재**: `navigator.share({ title, url })` — text 파라미터 없음
**변경**: text 파라미터 추가

```ts
const text = `${list.cover_emoji || '🧖'} ${list.title} — SA-PI 사우나 리스트에서 확인하기`
await navigator.share({ title, text, url })
```

- **구현 시 유저와 문구 협의 후 확정** — 여러 후보 제안 → 유저 선택
- 가이드라인: 80자 이내, 카카오링크 1000자 제한, OG description 60자 권장
- 필수 포함: 리스트 제목 + 앱 이름 + CTA

---

## 구현 순서 요약

```
Phase 1: 홈 레이아웃 리뉴얼 (sa-list/page.tsx, feed-row, featured-card)
Phase 2: 검색 + 인기 태그 (lists-service, use-lists, DB RPC)
Phase 3: 상세 리뉴얼 + Featured 구독 상태
Phase 4: 크리에이터 링크 (DB + 폼 + 상세) + 공유 문구
```

각 Phase 완료 시 중간 커밋. Phase 간 의존성 없으므로 순서 변경 가능.

---

## 참조 파일
- 와이어프레임: `docs/wireframes/sa-list-*.html` (3개)
- 전체 플랜: `docs/plans/PLAN_sa_list_renewal.md`
- Phase 1+2 핸드오프: `docs/handoff/handoff_20260414_sa_list_renewal.md`
