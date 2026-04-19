# Handoff: SA-LIST 리뉴얼 구현

## 작업 목표
SA-LIST 페이지를 와이어프레임 기반으로 리뉴얼. Phase 1(레이아웃) + Phase 2(검색/태그).

## 확정된 사항

### 와이어프레임 (확정)
- `docs/wireframes/sa-list-home.html` — 홈 단일 스크롤
- `docs/wireframes/sa-list-detail.html` — 상세 (Visitor/Owner 2 variant)
- `docs/wireframes/sa-list-my-lists.html` — 전체보기 (A: 탭 필터 통합 채택)

### 플랜 문서
- `docs/plans/PLAN_sa_list_renewal.md` — 전체 기능 목록, DB 변경, 파일 목록

### 유저 결정사항
- 전체보기 라우트: `/sa-list/my` (별도 페이지)
- 구현 범위: Phase 1+2 (레이아웃 + 검색/태그). 크리에이터 링크/공유문구는 다음.
- 빈 인기태그: 섹션 숨김
- 전체보기 레이아웃: A안 (탭 필터 — 전체/내 리스트/구독 중)

### UI 디자인 결정
- **홈**: 탭 3개 제거 → 단일 세로 스크롤 (Featured → 내 리스트 → 인기태그 → 인기 피드)
- **Featured 카드**: 이모지 좌상단, 구독 pill 우상단 (구독하기=레드, 구독중=블랙), 제목 16px 2줄 허용, 설명 1줄, 그라데이션 0.18
- **내 리스트 카드**: 가로 스크롤 140px 카드, 이모지+배경색 둥근정사각형 썸네일, 공개상태 배지(공개/비공개/링크공유/구독중)
- **피드 row**: 좌측 accent bar 제거, 이모지+배경색 썸네일만 유지
- **유저네임**: 전부 영문 대문자 (text-transform: uppercase)
- **리스트 컬러**: `COVER_COLOR_PALETTE` 쨍한 원색, 유저 프로필은 머티드 파스텔로 구분
- **상세 디테일**: 커버 블랙 그라데이션 없음, 아바타 둥근사각형(border-radius:10px), 장소수 아이콘 `onsen`
- **상세 오너**: 3-dot 메뉴(more_vert), 공개상태 배지+expand_more 쉐브론, "장소 추가" dashed 버튼, 메모수정/제거 버튼(제거는 오른쪽 끝)
- **소셜 링크**: 인스타 SVG + 네이버 N SVG (2개만). DB에 username만 저장, URL 프리픽스는 코드 상수
- **헤더 버튼**: 배경 없이 아이콘만 (앱 패턴 통일)
- **네비바**: 2+center raised+2 (앱과 동일)
- **그림자**: 전체 `0 2px 8px -2px rgba(0,0,0,0.06)` 통일

## Phase 1: 레이아웃 (파일 목록)

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/app/sa-list/page.tsx` | 탭 → 단일 스크롤. Featured 캐러셀 + 내 리스트 가로카드 + 인기태그(Phase2) + 인기 피드 |
| `src/components/features/featured-sa-list-card.tsx` | 구독 pill 추가(우상단), 설명 1줄, 제목 2줄, 그림자/그라데이션 수정 |
| `src/components/features/sa-list-feed-row.tsx` | accent bar 제거, 썸네일에 cover_color 배경 적용 |

### 신규 파일
| 파일 | 내용 |
|------|------|
| `src/app/sa-list/my/page.tsx` | 전체보기 페이지 (탭: 전체/내 리스트/구독 중) |

### 주요 구현 포인트

**sa-list/page.tsx 구조 변경:**
```
<header> SA-LIST + 검색/생성 버튼 </header>
<section> Featured 캐러셀 (useFeaturedPublicLists) </section>
<section> 내 리스트 가로 스크롤 + 전체보기 링크 (useMyLists + useSubscribedLists, 최대 4-5개) </section>
<section> 인기 태그 (Phase 2) </section>
<section> 인기순/최신순 토글 + 세로 피드 (usePublicLists) </section>
```

**Featured 카드 구독 상태:**
- `useSubscribedLists`에서 subscribedIds Set 만들어서 featured 카드에 전달
- FeaturedSaListCard에 `subscribed?: boolean` prop 추가

**내 리스트 가로 카드:**
- 새 컴포넌트 불필요 — page.tsx 안에 인라인 JSX로 구현 (my-card 패턴)
- 구독 리스트도 같은 카드 컴포넌트, visibility 자리에 "구독 중" 표시
- "새 리스트" 카드는 마지막에 dashed border

**전체보기 (/sa-list/my):**
- 기존 `SaListFeedRow` 컴포넌트 재사용
- 탭 3개: 전체(내 리스트+구독), 내 리스트만, 구독 중만
- 카운트 표시
- "새 리스트 만들기" 인라인 row (dashed)

## Phase 2: 검색/태그

### DB 변경
```sql
-- supabase/017_popular_tags_rpc.sql
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INT DEFAULT 10)
RETURNS TABLE(tag TEXT, count BIGINT) AS $$
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM lists
  WHERE visibility = 'public' AND array_length(tags, 1) > 0
  GROUP BY tag ORDER BY count DESC LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;
```

### 수정 파일
| 파일 | 변경 |
|------|------|
| `src/lib/lists-service.ts` | `getPublicLists`에 `search?: string` 파라미터 추가 + `getPopularTags()` 함수 추가 |
| `src/hooks/use-lists.ts` | `usePublicLists`에 search/tag 지원 + `usePopularTags()` 훅 추가 |
| `src/app/sa-list/page.tsx` | 검색 input + 인기태그 칩 섹션 + 태그/검색 필터 연동 |

### 검색 구현
- `getPublicLists(limit, offset, sort, search?)` — search 있으면 `title ILIKE '%search%' OR tags @> ARRAY[search]`
- 검색 input: 300ms debounce, 최소 2글자
- 태그 칩 클릭: 해당 태그로 피드 필터

## 구현 원칙 (유저 요청)
1. 기존 컴포넌트 최대 재활용 — 새 컴포넌트 만들지 말 것
2. 하드코딩 최소화 — 상수는 content.ts
3. 기능별 구현방법 3가지 제안 → 비판적 평가 → 검증된 방법만
4. 중복 컴포넌트 생성 금지

## 미완료 (다음 세션)
- 크리에이터 소셜 링크 (DB 마이그레이션 + 폼 + 상세 표시)
- 공유 문구 개선 (유저와 협의 후 확정)
- 상세 페이지 리뉴얼 (커버 헤더 + 크리에이터 섹션 + 태그)
- Featured 카드 구독 상태 표시

## 커밋 안 된 변경
- `docs/wireframes/` — 3개 HTML 와이어프레임
- `docs/plans/PLAN_sa_list_renewal.md` — 플랜 문서
- `docs/po/BACKLOG.md` — 백로그 업데이트 (유저가 수정)
