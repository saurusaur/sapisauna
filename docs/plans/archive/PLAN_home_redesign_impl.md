# 홈 리디자인 실제 반영 플랜

> 베이스 프로토타입: `docs/po/홈_프로토타입_20260605.html`
> 대상: `src/app/home/page.tsx` + 관련 컴포넌트
> 작성: 2026-06-05

## 1. 프로토타입 요소 → 실제 앱 매핑

| 프로토 요소 | 실제 컴포넌트/파일 | 링크(onClick) | 데이터 소스 |
|---|---|---|---|
| 상단 레드 영역 + 곡선 | `home/page.tsx` 신규 래퍼 | — | — |
| HELLO SA-PIEN + "우리는 사우나 신인류" | `home/page.tsx` header | — | 정적(APP) |
| 유저 스탬프 카드(프로필+칭호+레벨) | `ProfileCard` 개편 | 프로필→유저홈(미구현)·레벨→`/settings/titles` | `useUser()` (nickname, profile_emoji/hue, active_title, level, xp→`levelProgress`) |
| 증기 도장(흰/블루) | `public/logo/sauna-stamp.svg` | (현재 장식) | **향후** 체크인 리워드 |
| 사-첵 버튼(기록 CTA) | 신규 버튼 + `public/logo/sapi-chek-logo.svg` | !auth→`requireAuth()` / else `selectedRecordDate=today`→`/place` | — |
| TRIBE PICKS 3카드 | `TribePicksCard` 개편 | `/sa-list/tribe/{tribe.id}` | `TRIBES` + **카운트(데이터 갭)** |
| SA-PI FEATURED 가로스크롤 | `FeaturedSaListCarousel` 신규 variant | `/sa-list/{list.id}` (카드), `/sa-list`(전체) | `useFeaturedPublicLists()` → title·description·cover_hue(`listBgColor`)·owner_nickname·place_count |
| 하단 내비(둥근 글래스) | `BottomNav` 소폭 수정 | 기존 그대로 | — |

## 2. 컴포넌트별 변경

### A. `home/page.tsx` (레이아웃 재구성)
- 배경: `bath-tile-bg` 위에 **상단 레드 풀블리드 영역**(height~286 + 곡선 SVG) 추가.
- 헤더: HELLO SA-PIEN(둘 다 흰색·Oswald italic) + 서브타이틀, 레드 위.
- **삭제/이동 검토**: 현재 "오늘의 기록"(RecordCard) + "사-피엔스 라이브"(커뮤니티) 섹션 → 프로토엔 없음. → **결정 필요(D1)**.
- 로그인/비로그인 분기: 스탬프카드=ProfileCard(게스트는 로그인 유도 variant), TRIBE PICKS·FEATURED는 **전 유저 노출**(현재 TribePicks는 비로그인 전용 → 변경).

### B. `ProfileCard` → 스탬프 카드
- 통계 행(열기링/총기록/방문) 제거, 프로필+칭호+레벨만.
- `transform: rotate(-3.5deg)`, 거의 불투명 배경, min-height 확대.
- 도장 2개(흰=배경장식 우상단, 블루=카드 캔버스)는 **home 레이아웃 레벨**에서 absolute 배치(카드 밖 레드까지 걸침) → ProfileCard 외부 래퍼에서 처리 권장.
- ※ 통계는 `/history` 대시보드로 이미 존재 → 홈에서 빼도 정보 손실 적음.

### C. 사-첵 CTA (신규)
- 원형 `<img src="/logo/sapi-chek-logo.svg">` round-clip, `rotate(10deg)`, 우하단 카드 위 오버랩(엄지존), 일부 화면밖 크롭.
- onClick = 기존 `home/page.tsx` CTA 로직 재사용.

### D. `TribePicksCard` → 3카드 (카운트 박스 내, 애니메이션 비로그인 전용)
- 이모지 타일 → **컬러 풀필 카드**(SAUNNER/BATHER/JIMI 영문 Oswald + **카드 박스 안에 "N곳" 카운트(D2)** + 트라이브 이모지 우하단 크롭). 색=기존 tribe 색.
- 서브타이틀 "실시간 업데이트 트라이브별 베스트 사우나!".
- **공통(로그인 포함, =프로토 그대로)**: 정적 3카드, 카드 탭 → `/sa-list/tribe/{id}`.
- **비로그인 전용 애니메이션**: 기존 3초 오토스크롤 — 액티브 카드 강조(scale/shadow) 순환 + 카드 아래 로테이팅 라인(액티브 트라이브 `description` + "추천 사우나 보기 >" → tribe 리스트). 카운트는 박스 안(로테이팅 라인 아님).
- 로그인 유저: 사이클/로테이팅 라인 **없음**(피로도 방지).

### E. `FeaturedSaListCarousel` → tilted 스크롤 variant
- 신규 모드(예: `variant="home-tilt"`): 가로 스크롤 + 불규칙 각도/높이 + 모서리만 겹침, 이모지 없음, title+desc(2줄)+meta(owner·N곳).
- 색 = `listBgColor(cover_hue)`. 카드 클릭 → `/sa-list/{id}`.
- 섹션 제목 "SA-PI FEATURED" + 서브 "고수들의 추천 사우나".

### F. `BottomNav` (소폭)
- `nav-bar`에 `border-radius: 26px 26px 0 0` 추가, 하단 세이프에어리어 패딩.
- 홈버튼 흰 테두리 없음·그림자 유지(이미 일치).

## 3. 데이터 갭 / 신규

- **TRIBE 카운트("N곳")**: 트라이브별 추천 사우나 수. 현재 직접 훅 없음.
  - 옵션 ①: `usePlaces()`에서 facility/category 기준 클라 집계(트라이브↔시설 매핑 필요, 부정확 가능).
  - 옵션 ②: 트라이브별 featured 리스트 수 집계.
  - 옵션 ③: 신규 RPC/카운트 쿼리.
  - 옵션 ④: MVP 정적/숨김. → **결정 필요(D2)**.
- **도장(체크인 리워드)**: 지금은 장식. 향후 `logs` 기반 월간 체크인 → [[project_sa_list_reward_plan]] 연계.

## 4. 단계별 구현 순서

1. **에셋·내비**: BottomNav 라운드 처리 + 로고/스탬프 에셋 `public/` 확인. (저위험)
2. **레이아웃 셸**: home/page.tsx 레드 영역+곡선+헤더 골격, 기존 섹션 임시 유지.
3. **스탬프 카드**: ProfileCard 개편(통계 제거) + 도장 배치 래퍼 + 사-첵 CTA.
4. **TRIBE PICKS**: TribePicksCard 3카드 개편(+카운트 D2 반영).
5. **SA-PI FEATURED**: 캐러셀 tilt variant.
6. **정리**: 오늘의 기록/커뮤니티 처리(D1), 로그인/비로그인 상태 5종(Empty/Loading/Partial/Error/Ideal) 점검.
7. **검증**: `npm run dev` 실 디바이스 폭, 비로그인/로그인 양쪽.

## 5. 결정 확정 (2026-06-05)

- **D1 ✅ 모두 제거**: "오늘의 기록(RecordCard)" + "사-피엔스 라이브(커뮤니티)" 섹션 삭제. (오늘의 기록은 `/history`, 커뮤니티는 별도)
- **D2 ✅ 트라이브별 featured 리스트 수**: `lists`에서 is_featured=true를 트라이브(tribe/category)별 집계해 "N곳" 표시. → use-lists에 트라이브별 카운트 셀렉터/집계 추가.
- **D3 ✅ 기존 컴포넌트 in-place 개편**: ProfileCard·TribePicksCard·FeaturedSaListCarousel·BottomNav 직접 수정/variant.
- **D4 ✅ 이번엔 장식만**: 도장은 `sauna-stamp.svg` 데코. 체크인 리워드 로직은 후속 작업.

## 6. 확정 작업 범위 (수정 파일)
1. `src/app/home/page.tsx` — 레드 셸+곡선+헤더, 섹션 재구성, 오늘의기록·커뮤니티 제거, 사첵 CTA, 도장 배치.
2. `src/components/features/profile-card.tsx` — 통계 제거, 스탬프카드 스타일(틸트·불투명), 게스트 variant 유지.
3. `src/components/features/tribe-picks-card.tsx` — 3 컬러카드(영문 Oswald+카운트+이모지 크롭), 전 유저 노출.
4. `src/components/features/featured-sa-list-carousel.tsx` (+`featured-sa-list-card.tsx`) — home-tilt variant.
5. `src/components/bottom-nav.tsx` — 라운드 상단 + 세이프에어리어.
6. `src/hooks/use-lists.ts` — 트라이브별 featured 카운트(D2).
7. 에셋: `public/logo/sapi-chek-logo.svg`, `public/logo/sauna-stamp.svg` (이미 존재).

## 7. 게스트(비로그인) 경험 — 감사 결과 & 확정
현재 비로그인 홈의 게스트 전용 요소는 아래뿐. **차이는 2곳만, 나머지는 로그인과 동일 화면.**
- **유저 스탬프 카드**: 게스트 = ProfileCard 예시 variant(dim + "나만의 사우나 카드를 만들어보세요" 오버레이, 칭호 "예비 사-피엔스") → 탭 시 `requireAuth()`. (유지)
- **사-첵 CTA**: 게스트 = `requireAuth()` → `LoginPromptModal`("WELCOME SA-PIEN / 멤버 전용 기능이에요 / 3초 로그인" → `/login`). 로그인 = `/place`.
- **TRIBE PICKS 애니메이션**: **비로그인 전용 유지**(로그인은 정적 프로토). 카운트는 양쪽 모두 박스 안(§2D).
- **그 외 게스트 전용 히어로/CTA 없음** (LOGIN.HOME_TITLE/EXPLORE_CTA/LOGIN_CTA 상수는 홈 미사용). → FEATURED·내비 등 나머지는 로그인과 동일.

게스트 차이 정리(3): ①스탬프카드=예시 variant ②사첵 CTA→requireAuth+모달 ③TRIBE PICKS 사이클 애니메이션. 그 외 전부 동일.

## 8. 간격·패딩 체계 (일관 적용)
Tailwind 스케일(1=4px) 기준 통일:
- 화면 가로 패딩: 헤더(레드) `px-6`(24), 섹션 콘텐츠 `px-5`(20).
- 섹션 간 세로 리듬: `mt-8`(32) (TRIBE↔FEATURED 등).
- 제목(h2) → 서브타이틀: `mt-1`(4); 서브타이틀 → 콘텐츠: `mb-4`(16).
- 카드 내부 패딩: 14~16; 카드 간 grid `gap-2.5`(10).
- 스탬프 카드 내부 행 간격: `gap-1.5`(6)~`gap-2.5`(10).
- 헤더 h1 → 서브: `mt-2.5`(10).
- 도장/사첵 등 absolute 데코는 리듬과 무관(겹침 의도).
> 구현 시 매직넘버 대신 위 스케일로 통일, 동일 역할엔 동일 값.
