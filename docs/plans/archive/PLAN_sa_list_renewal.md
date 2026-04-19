# SA-LIST 페이지 리뉴얼 플랜

## Context
SA-LIST 기능이 구현되어 있으나 레이아웃/가독성/기능 완성도가 부족. 리서치(hackathon-research-plan.md, composer-prompts.md)와 유저 피드백 기반으로 발견 편의성·이용 직관성·기능 임팩트 중심으로 리뉴얼. 홈은 Spotify 벤치마크. 와이어프레임 먼저 → 코딩 진행 예정.

---

## A. 기능 목록 (우선순위순)

### Must-Have (이번 스프린트)

#### 1. 홈 레이아웃 리뉴얼 — Spotify식 단일 스크롤
**현재 문제**: 탭 3개(내 리스트/최신/인기)로 분리 → 정보 파편화, 탭 이동 피로
**제안 레이아웃** (위→아래 단일 스크롤):

```
┌─────────────────────────────┐
│  SA-LIST              🔍 ＋  │  ← 헤더: 검색+생성 버튼
├─────────────────────────────┤
│  🔥 Featured                │
│  ┌──────┐ ┌──────┐ ┌────   │  ← 가로 캐러셀 (리뉴얼)
│  │ 커버 │ │ 커버 │ │      │
│  │ 제목 │ │ 제목 │ │      │
│  │ 3곳  │ │ 5곳  │ │      │
│  └──────┘ └──────┘ └────   │
├─────────────────────────────┤
│  📋 내 리스트         전체보기 │  ← 가로 스크롤 미니카드 (3-4개)
│  [MY] [리스트1] [리스트2]    │
├─────────────────────────────┤
│  🏷 인기 태그                │  ← 가로 스크롤 칩
│  #노천탕 #24시 #세신맛집     │
├─────────────────────────────┤
│  📊 인기 리스트              │  ← 세로 피드 (무한 스크롤)
│  ┌─ row ──────────────────┐ │
│  │ 🔥 서울 노천탕 TOP 5   │ │
│  │ @creator · 5곳 · 구독3 │ │
│  └────────────────────────┘ │
│  ┌─ row ──────────────────┐ │
│  │ ...                    │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

**핵심 변경:**
- 탭 제거 → 단일 세로 스크롤로 모든 정보 노출
- Featured 캐러셀 최상단 유지
- 내 리스트는 가로 미니카드로 축약 (전체보기 → 별도 화면)
- 인기 태그 섹션 추가
- 하단 세로 피드는 인기순 (정렬 토글 가능)

#### 2. Featured 카드 리뉴얼
**현재 문제**: 작은 글씨 한쪽 몰림, 정보 부족
**제안:**
```
┌────────────────────┐
│  [cover_color bg]  │
│                    │
│  🧖 (큰 이모지)    │
│                    │
│  ━━━━━━━━━━━━━━━  │
│  서울 노천탕 TOP 5  │  ← 제목 (bold, 16px+)
│  @saunalover       │  ← 크리에이터
│  5곳 · ✓ 구독중    │  ← 장소 수 + 구독 상태
└────────────────────┘
```
- 제목/크리에이터/장소 수를 하단에 충분한 크기로
- 구독 여부 체크 표시 (✓ 구독중 / 구독하기 숨김)
- 장소 수 필수 표기

#### 3. 해시태그 검색 + 인기/최근 태그
**현재**: 유저가 자유 입력하는 태그 존재, 검색 기능 없음
**제안:**
- 홈에 "인기 태그" 가로 칩 섹션 — DB에서 가장 많이 사용된 태그 상위 N개 추출
- 칩 클릭 → 해당 태그로 필터된 피드 표시
- 검색 입력 시 리스트 제목 + 태그 동시 검색 (ILIKE title OR tag contains)
- 구현: `getPublicLists`에 `search?: string` 파라미터 추가, SQL에서 `title ILIKE '%search%' OR tags @> ARRAY[search]`

#### 4. 크리에이터 소셜 링크
**현재**: 없음
**제안:**
- DB: `lists` 테이블에 `creator_links JSONB DEFAULT '{}'` 추가
  ```json
  { "instagram": "username", "blog": "blogid", "threads": "username" }
  ```
- **DB에는 username/ID만 저장** — URL 프리픽스는 코드 상수로 관리
- **코드 상수** (`constants/content.ts`):
  ```ts
  CREATOR_LINK_PREFIXES = {
    instagram: 'https://instagram.com/',
    naver_blog: 'https://blog.naver.com/',
    threads: 'https://threads.net/@',
  }
  ```
- 플랫폼 URL 변경 시 DB 수정 없이 상수만 업데이트하면 됨
- 리스트 생성/편집 폼: 토글 "소셜 링크 추가" → 플랫폼 토글 + username만 입력
  - 각 플랫폼 아이콘 + 프리픽스 라벨(읽기전용) + username 입력창
- 상세 페이지: `CREATOR_LINK_PREFIXES[platform] + username`으로 동적 링크 생성
  - 크리에이터 이름 옆 플랫폼별 아이콘 버튼 → 외부 링크 오픈

#### 5. 리스트 상세 페이지 리뉴얼
**현재 문제**: 가독성 떨어짐, 정보 밀도 낮음
**Spotify/Belli 벤치마크 기반 필수 정보:**

```
┌─────────────────────────────┐
│  ← 뒤로                공유  │
├─────────────────────────────┤
│  [cover_color 영역]         │
│  🧖 (이모지 48px)           │
│  서울 노천탕 TOP 5          │  ← 제목 (bold 24px)
│  나만 알고 싶은 노천탕들      │  ← 설명
├─────────────────────────────┤
│  👤 @saunalover  📷 🔗      │  ← 크리에이터 + 소셜링크
│  5곳 · 구독자 12명          │  ← 통계
│  [구독하기] 버튼             │
├─────────────────────────────┤
│  #노천탕 #서울 #겨울추천     │  ← 태그 칩
├─────────────────────────────┤
│  ┌─ PlaceCard ────────────┐ │
│  │ 1. 스파랜드             │ │  ← 넘버링 + 장소카드
│  │ "화요일 아침이 한산해요"  │ │  ← 큐레이터 메모
│  └────────────────────────┘ │
│  ┌─ PlaceCard ────────────┐ │
│  │ 2. 용산 드래곤힐스파    │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

**핵심 변경:**
- 헤더 영역: cover_color 배경 + 이모지 + 제목 크게
- 크리에이터 아이덴티티 강화: 닉네임 + 소셜 링크 아이콘
- 구독자 수 눈에 띄게 (0이면 "첫 번째 구독자가 되어보세요")
- 태그 칩 노출
- 넘버링 없음 — 컬렉션 성격 (순위 아님)

#### 6. 공유 문구 개선 (카톡/링크)
**현재**: `navigator.share({ title, url })` — title과 URL만 전달. text 없음.
**제안 — text 파라미터 추가:**

```
```
"🧖 서울 노천탕 TOP 5 — SA-PI 사우나 리스트에서 확인하기"
```
- **가이드라인**: 카카오링크 텍스트 1000자 제한, OG description 60자 권장, 실무 80-120자 적정
- navigator.share text: 공식 글자 수 제한 없음 (OS/앱별 상이)
- 필수 포함: 리스트 제목 + 앱 이름 + CTA
- **구현 시 유저와 문구 협의 후 확정** — 여러 후보 제안 → 유저 선택

#### 7. Featured 카드 구독 상태 표시
- Featured 캐러셀 카드에 유저의 구독 여부를 시각적으로 표시
- 구현: `useFeaturedPublicLists` 결과에 구독 상태 매칭
  - `useSubscribedLists`에서 가져온 list ID Set과 비교
  - 카드 우상단 또는 하단에 작은 체크 아이콘

---

### Nice-to-Have (다음 스프린트)

#### 8. 리스트 스토리 카드 Export
- composer-prompts.md에 `renderListCard` 구현 플랜 있음
- 보류 — 카톡 공유 문구 우선

#### 9. 구독 리스트 지도 보기 → **별도 백로그 P2**
- 구독한 리스트들의 장소를 지도에 통합 표시
- 장기 플랜 필요 (API/툴 선정)

---

## B. DB 변경

### 신규 마이그레이션: `supabase/017_list_creator_links.sql`
```sql
ALTER TABLE lists ADD COLUMN creator_links JSONB DEFAULT '{}';
```

### 인기 태그 RPC (서버사이드):
```sql
CREATE FUNCTION get_popular_tags(limit_count INT DEFAULT 10)
RETURNS TABLE(tag TEXT, count BIGINT) AS $$
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM lists
  WHERE visibility = 'public' AND array_length(tags, 1) > 0
  GROUP BY tag ORDER BY count DESC LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## C. 변경 파일 목록

| 파일 | 변경 |
|------|------|
| `src/app/sa-list/page.tsx` | 탭 → 단일 스크롤 레이아웃, 검색, 인기 태그 |
| `src/app/sa-list/[id]/sa-list-detail-client.tsx` | 헤더 리뉴얼, 크리에이터 링크, 구독자 강조, 넘버링 |
| `src/components/features/featured-sa-list-card.tsx` | 카드 레이아웃 리뉴얼, 구독 상태 |
| `src/components/features/sa-list-feed-row.tsx` | 피드 행 가독성 개선 |
| `src/components/features/list-form-sheet.tsx` | 크리에이터 링크 입력 필드 추가 |
| `src/lib/lists-service.ts` | 검색 파라미터, 인기 태그 RPC, creator_links |
| `src/lib/share.ts` | 공유 text 파라미터 추가 |
| `src/hooks/use-lists.ts` | 검색/태그 필터 지원 |
| `src/types/index.ts` | SaList에 creator_links 추가 |
| `supabase/017_list_creator_links.sql` | DB 마이그레이션 |

---

## D. 구현 원칙 (유저 요청)

1. 기존 컴포넌트 최대 재활용 — `EmojiPickerField`, `HueSlider`, `PlaceCard`, `SaListFeedRow` 등
2. 하드코딩 최소화 — 상수는 `content.ts`에, 매직넘버 금지
3. 기능별 구현방법 3가지 제안 → 비판적 평가 → 검증된 방법만 제시
4. 중복 컴포넌트 생성 금지

---

## E. 지도 보기 장기 플랜 (백로그 P2 추가)

### 구독 리스트 지도 통합 보기
**목표**: 유저가 구독한 리스트들의 장소를 지도에 한번에 표시

**API/툴 후보:**
1. **Naver Map API** (Web Dynamic Map) — 국내 최적, 무료 할당량 넉넉, 한국어 주소 정확
2. **Kakao Map API** — 국내 커버리지 좋음, 카카오 생태계 연동
3. **Google Maps JavaScript API** — 글로벌 커버리지 (해외 사우나 대응), 비용 발생
4. **Mapbox GL JS** — 커스텀 스타일링 자유도 최고, 프리티어 넉넉

**추천**: Naver Map (1순위, 국내) + Mapbox (2순위, 해외 확장 시)

**구현 범위:**
- 리스트 상세에서 "지도로 보기" 토글
- 구독 탭에서 "내 구독 지도" 통합 뷰
- 마커 클릭 → 장소 카드 바텀시트
- 클러스터링 (장소 밀집 시)

---

## F. 작업 순서

1. **와이어프레임** — HTML 프로토타입으로 홈/상세 레이아웃 확정 (모바일 비율)
2. **DB 마이그레이션** — creator_links + 인기태그 RPC
3. **홈 레이아웃** — 단일 스크롤 + Featured 리뉴얼
4. **검색 + 태그** — 서비스 + 훅 + UI
5. **상세 페이지** — 헤더/크리에이터/구독자/넘버링
6. **크리에이터 링크** — 폼 + 상세 표시
7. **공유 문구** — share.ts 개선
8. **Featured 구독 상태** — 카드에 표시

---

## G. 검증

- 각 단계별 모바일 브라우저에서 실기기 확인
- 비로그인 상태에서 홈/상세 접근 가능 여부
- 공유 링크 → 카톡/iMessage에서 OG 미리보기 확인
- 크리에이터 링크 → 외부 앱 정상 오픈
