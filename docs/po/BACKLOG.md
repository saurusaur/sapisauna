# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

## Backlog

<!-- P0 — 베타 출시 전 필수 -->
- [ ] [인프라] Sentry 소스맵 업로드 설정 — 코드+래퍼 구현 완료(c6adb35), DSN 환경변수 설정 완료. 남은 작업: ① sentry.io > Settings > Auth Tokens에서 토큰 생성 → Vercel에 `SENTRY_AUTH_TOKEN` 추가, ② sentry.io > Settings > General의 Organization Slug → Vercel에 `SENTRY_ORG` 추가, ③ sentry.io > Settings > Projects의 프로젝트명 → Vercel에 `SENTRY_PROJECT` 추가. 이 3개 설정하면 빌드 시 소스맵이 Sentry에 업로드되어 에러 스택트레이스에서 원본 코드 라인 확인 가능. 가이드: `docs/guides/SENTRY_GUIDE.md` | priority: P2 | added: 2026-02-28
- [x] [기능+UX] 나의 기록 대시보드 | priority: P0 | added: 2026-03-10 | done: 2026-04-12
- [ ] [콘텐츠] 큐레이션 리스트 시드 — 어드민 is_featured 리스트 5~8개 생성 (노천탕/24시/세신 등) | priority: P0 | added: 2026-03-23

<!-- P1 — 베타 핵심 기능 -->
- [ ] [기능] 사우너 숏로그 건식/습식 토글 — 숏로그에서 습식 사우나 온도 입력 가능하게. deep_logs.wet_sauna_temp 활용. 플랜: `docs/plans/PLAN_wet_sauna_quick_log.md` | priority: P1 | added: 2026-04-12
- [ ] [UX] 사우나 ID 유저 카드/페이지 — 유저 프로필 페이지를 '사우나 ID 카드' 컨셉으로 설계. 포함 정보: tribe, 선호 온도/시설유형, active 칭호, 방문 통계 등 (구성 아이디어 필요) | priority: P1 | added: 2026-04-07
- [ ] [기능] SA-LIST 리워드 — XP: list_created(30), list_shared(10), first_subscriber(30). 마일스톤 칭호: 큐레이터(첫 리스트), 컬렉터(5개), 인플루언서(구독자10), 백과사전(장소30개 추가). rewards.ts + reward-service.ts 확장 | priority: P1 | added: 2026-03-23
- [ ] [버그] Google 주소 포맷팅 + country_code — formatted_address 파싱 실패 시 기본값 KR → 일본 장소에 네이버 지도 표시, 타투 모달 미트리거. address_components에서 country 직접 추출 필요. 핸드오프: `docs/handoff/handoff_20260418_bugfix_and_features.md` | priority: P1 | added: 2026-04-18
- [ ] [버그] place_count 실시간 싱크 — 리스트에서 장소 삭제 후 place_count 미갱신 (캐시/리프레시 흐름 점검 필요) | priority: P1 | added: 2026-04-18
- [ ] [기능] 급냉탕 온도 필드 추가 — ICE 섹션에 ice_bath_temp 컬럼 + 로그 폼 + 장소 상세 표시. DB 마이그레이션 필요 | priority: P1 | added: 2026-04-18
- [ ] [UX] 탐색 검색 결과 없음 → 장소 추가 유도 — 검색 결과 0건일 때 "이 장소를 직접 추가하기" CTA로 장소 등록 플로우 연결 | priority: P1 | added: 2026-04-14
- [ ] [기능] 장소 탐색 강화 — '내 주변' 거리순 정렬(geolocation) + Explore에서 직접 장소 등록 | priority: P1 | added: 2026-03-04
- [ ] [인프라] 도메인 구매 — 정식 출시 시. 베타는 Vercel URL로 충분 | priority: P3 | added: 2026-02-28

<!-- P2 — 베타 중 개선 -->
- [ ] [UX] 트라이브 픽 → 사-리스트 이동 — 홈 "추천 사우나" 트라이브 픽 섹션을 사-리스트 탭으로 이동 (추천 로직이 리스트 기반) | priority: P2 | added: 2026-04-18
- [ ] [기능] 탐색 탭 → 지도 뷰 전환 — 탐색을 "주변 사우나 찾기 + 장소 정보" 지도 중심으로 변경. 지도 API 선정(Naver/Mapbox) 필요 | priority: P2 | added: 2026-04-18
- [ ] [UX] 장소 상세보기 SA-LIST 섹션 — 해당 장소가 포함된 공개 리스트 수 + 인기순 리스트 목록 표시 | priority: P2 | added: 2026-04-13
- [ ] [기능] 구독 리스트 지도 통합 보기 — 구독한 리스트 장소를 지도에 표시. Naver Map(국내)/Mapbox(해외) 검토. 마커+클러스터링+바텀시트. 플랜: `docs/plans/PLAN_sa_list_renewal.md` 섹션 E | priority: P2 | added: 2026-04-13
- [ ] [기능] 어드민 도구 — 병합 리뷰 + 수동 등록 리뷰 큐 + "다른 장소에요"/"폐업했어요" 신고 + 폐업 배지 | priority: P2 | added: 2026-03-02
- [ ] [기능] 회원 탈퇴 — 이메일 요청(sapi.sauna@gmail.com). 개인정보처리방침에 명시됨, 법적 대응 필요 | priority: P2 | added: 2026-03-20
- [ ] [디자인] UI 최종 검증 — Phase 11 | priority: P2 | added: 2026-02-28
- [ ] [리팩토링] safeParse 패턴 재검토 — 상세: `REVIEW_safeParse_errors.md` | priority: P2 | added: 2026-03-04

<!-- P3 — 장기 -->
- [ ] [기능] 소셜 — 공유 링크 + 팔로우 + 크로스 소스 매칭(네이버↔구글) | priority: P3 | added: 2026-02-27
- [ ] [기능] API 카테고리→시설유형 자동매핑 — 유저 인풋 보조. 상세: `PLAN_venue_type_auto_mapping.md` | priority: P3 | added: 2026-03-20
- [ ] [데이터] 시설 태그 잔여 보강 — 4건(유림탕/유진/주신/필례) 유저 기여로 보완 | priority: P3 | added: 2026-03-21
- [ ] [인프라] PWA 오프라인 + 동기화 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 사용자 행동 분석 | priority: P3 | added: 2026-02-28

## Done

### 2026-04-18
- [x] [기능] SA-LIST 리뉴얼 Phase 1+2 — 홈 탭→단일 스크롤(Featured/내 리스트/인기태그/피드), 전체보기(/sa-list/my), 검색+태그 칩 필터, DB RPC(017) | done: 2026-04-14
- [x] [디자인] SA-LIST featured 카드 & 페이지 레이아웃 다듬기 — 구독 pill(아웃라인), 그라데이션 제거→inner shadow, 설명 2줄 min-height, 커버 팔레트 어두운 원색, 프로필 톤 맑은 파스텔 | done: 2026-04-17
- [x] [기능] SA-LIST 리뉴얼 Phase 3 — 상세 커버 헤더(cover_color+이모지 48px), 크리에이터 섹션(아바타+닉네임+통계), 태그 칩, Owner 메모수정/제거 버튼, Featured 구독 토글 연결 | done: 2026-04-18
- [x] [기능] SA-LIST 리뉴얼 Phase 4 — 크리에이터 소셜 링크(인스타/네이버/쓰레드, DB 018), 폼 플랫폼 선택 UI, 상세 소셜 아이콘, 공유 문구("[이모지] [제목] | SA-PI에서 보기") | done: 2026-04-18
- [x] [버그] window.confirm → ConfirmModal 교체 — 6곳(sa-list/my, list-manage-sheet x2, save-flow, explore/type, use-list-actions) | done: 2026-04-18
- [x] [UX] 검색 결과 선택 배경색 레드→그레이 | done: 2026-04-17
- [x] [UX] 섹션 헤더 문구 변경 — Featured→사-피 픽, 내 리스트→내 사-리스트, 인기 리스트→인기 사-리스트 | done: 2026-04-17
- [x] [UX] 이모지 피커 액티비티 탭 대표 이모지 🏃→🧖 | done: 2026-04-17

### 2026-04-12
- [x] [기능+UX] 나의 기록 대시보드 — History 캘린더 뷰 대시보드 고도화: KPI 행, 루틴 카드, 인사이트 카드, WEEK/MONTH 토글, 딥로그 링, empty state 블러 | done: 2026-04-12
- [x] [UX] 홈 프로필 카드 리디자인 — 히트 링 + 총기록/방문장소 3칸 그리드, 레벨 프로그레스바 | done: 2026-04-12
- [x] [UX] 이모지 피커 스크롤 앵커링 수정 + 대표 이모지 변경 — 라벨 매칭+closest 방식으로 정확한 섹션 이동 | done: 2026-04-12
- [x] [UX] 설정 아이콘 편집 심볼 palette → sticker 변경 | done: 2026-04-12
- [x] [기능] ICE 입력 분→초 단위 전환 — 10~90초 step 10, DB CHECK 완화+마이그레이션 | done: 2026-04-12
- [x] [UX] 루틴 뱃지 단위 suffix 추가 — 스토리/상세/이미지 내보내기에 m/s/set 표기 | done: 2026-04-12
- [x] [UX] 기록 카드 딥로그 표기 통일 — stacks 심볼 → 달력 스타일 스톤 점/링 | done: 2026-04-12
- [x] [기능] 트라이브별 루틴 기본값 — saunner/bather: HEAT 12m ICE 60s PAUSE 5m, jimi: HEAT 15m PAUSE 10m | done: 2026-04-12
- [x] [UX] 기록 페이지 기본 랜딩 메인 트라이브 + 탭 순서 유저 선호순 + 전체 맨 끝 | done: 2026-04-12

### 2026-04-11
- [x] [UX] TRIBE PICKS 카드 — 비로그인 홈에 트라이브 선택 유도 카드 (3초 오토 스크롤, 트라이브별 설명+CTA, /explore/type 연결) | done: 2026-04-08
- [x] [UX] 비로그인 홈 디테일 — ProfileCard 게스트 미리보기(SA-PIEN, 예비 사-피엔스), explore/[id] 기록하기 숨김, 홈 CTA "오늘 사우나 기록하기", 전체보기 숨김 | done: 2026-04-08
- [x] [UX] LoginPromptModal UX — WELCOME SA-PIEN 헤딩, "멤버 전용 기능이에요" 문구, "3초 로그인" 버튼 | done: 2026-04-11
- [x] [인프라] public_profiles 뷰 — 비로그인에서도 닉네임/칭호 표시 (gender 등 비공개 컬럼 차단) | done: 2026-04-08
- [x] [UX] 이모지 피커 카테고리 탭 바 — 섹션 간 빠른 이동, ETag 캐시 무효화 | done: 2026-04-08
- [x] [UX] 컬러 슬라이더 채도 상향 — 45→55% (탁함 개선) | done: 2026-04-08

### 2026-04-07
- [x] [보안] OAuth 에러 핸들링 — signInWithOAuth try-catch 추가, 네트워크 실패/OAuth 에러/callback 에러 통합 UI | priority: P0 | added: 2026-03-06 | done: 2026-04-07
- [x] [보안] 비로그인 경험 + Auth 가드 — /home·/sa-list 공개, LoginPromptModal로 찜/구독/생성/히스토리/설정 가드, 프로필 유도카드, 홈 CTA "로그인하고 기록하기", SA-LIST 내리스트 칭 숨김 | priority: P0 | added: 2026-02-28 | done: 2026-04-07
- [x] [최적화] Google Fonts next/font 전환 — Oswald/Libre Franklin/Noto Sans KR 셀프호스팅, no-page-custom-font 워닝 제거 | priority: P3 | added: 2026-03-06 | done: 2026-04-07
- [x] [UX] PlaceCard 시설칩 최대 2개 + 1줄 고정 — flex-nowrap overflow-hidden, whitespace-nowrap, slice(0,2) | done: 2026-04-07
- [x] [UX] 이모지 피커 개선 — 사람/몸·기호·깃발 카테고리 제거(API 프록시 필터링), 섹션 제목→구분선, 이모지 28px 확대, 6열 | done: 2026-04-07
- [x] [UX] 컬러 슬라이더 톤 조정 — 채도 75→45%, 밝기 55→62% 머티드 파스텔. COVER_TONE+coverHex() 상수 통일 | done: 2026-04-07
- [x] [인프라] verify-gate hook 버그 수정 — find에 -type f 추가, .json 디렉토리 오인 방지 | done: 2026-04-07
- [x] [기능] SA-LIST UI 리디자인 — 헤더 "SA-LIST" 통일, 필터칩 Chip 교체+이모지 제거, 섹션 헤더 통일, Featured 카드 정사각형+글래스 쉐도우, Hue 슬라이더 커버 색상, Frimousse 이모지 피커(lazy-load), default 리스트 ♨️ 고정+glass-card 구분, 내 리스트 정렬(default 상단 고정) | done: 2026-04-07
- [x] [버그] PlaceCard 시설칩 아이콘 누락 — FACILITY_ICON_MAP 연결 + cold-bath 따옴표 오염 데이터 44건 정리 + 방어 로직 추가 | done: 2026-04-06
- [x] [기능] 프로필 아이콘 커스터마이징 — DB profile_color/profile_emoji 추가, 설정 > 아이콘 편집 페이지, ProfileCard 레이아웃 D(왼쪽 아이콘+닉네임+칭호), HueSlider+Frimousse 재사용, 기본값 트라이브 컬러+이모지, EmojiPickerField 공용 컴포넌트 추출 | done: 2026-04-07

### 2026-04-06
- [x] [데이터] 신규 시설 9건 등록 + 온도 보강 4건 — 한림탕/리버사우나/소금강스파/봉래탕/서울사우나/인천조탕/라파사우나/동아온천사우나/씨메르. 노다지·아쿠아필드·워커힐·오레브 온도 보강. 습식 CHECK 65→75 통일 (012) | done: 2026-04-06

### 2026-04-04
- [x] [UX] 사-리스트 피드 재구성 — 상단 칩(내 리스트·최신·인기) 단일 스크롤 필터, 기본 탭 **인기**; 구독 목록을 「내 리스트」 화면 안 「구독 중」 섹션으로 통합; `is_featured`만 가로 캐러셀, 세로 피드는 피처 제외로 중복 방지; 본인 공개 리스트는 구독 버튼 없음 | done: 2026-04-04
- [x] [기능] lists.cover_emoji + ListFormSheet 커버 이모지(선택) — 마이그레이션 `013_lists_cover_emoji.sql`, 생성/편집·`createList`/`updateList` 반영; `getPublicLists(sort: popular|recent)` + `getFeaturedPublicLists()`; `usePublicLists`/`useFeaturedPublicLists`(탭별 fetch 스킵) | done: 2026-04-04
- [x] [리팩토링] 사-리스트 UI 컴포넌트 분리 — `featured-sa-list-card`, `sa-list-feed-row`, `sa-list-filter-chip`; 피처 카드 `aspect-[5/4]`·단일 이모지; 커버 색 팔레트 고채도 팔레트로 교체 | done: 2026-04-04
- [x] [문서] CLAUDE.md — 이모지 허용 범위에 리스트 커버·사-리스트 필터 칩 라벨 명시 | done: 2026-04-04
- [x] [데이터] DB 품질 대규모 수정 (011) — 포도호텔→아라고나이트 분리, Kumeya 오매핑, 시설유형 재분류 11건, 해외 주소 40건 정리, country_code 11건, 온도 이상치 5건, 그린사우나/관악 이름 수정 | done: 2026-03-27
- [x] [데이터] 카톡 재추출 + DB 교차검증 — 2600줄 신규 대화 분석, 온도/시설/장문리뷰 추출, DB 크로스체크(MISMATCH 9건), 호텔 부대시설 조사, 리서치 문서 체계화(RESEARCH_INDEX.md) | done: 2026-03-27
- [x] [데이터] 큐레이션 리스트 후보 정리 — 13개 테마(냉탕/노천/24시/세신/동네/온천/타투/도쿄/밥/슐렝2023-2025/SPA!대상), 사우나슐렝 전체 리스트 조사, Spa Alps 밥맛집 확인 | done: 2026-03-24

### 2026-03-23
- [x] [기능] SA-LIST 전체 구현 — DB 스키마(010) + 서비스 + 인스타식 저장 UX + 리스트 생성(태그+장소+메모) + 구독/해지 Undo + 어드민 추천(is_featured) + 발견 탭 캐러셀 | done: 2026-03-23
- [x] [리팩토링] Devil's Advocate 이슈 해결 — usePlaces→usePlaceSearch, N+1→RPC, 구독 guard, 스낵바 ref, share/visibility 중복 추출, DB 트리거→코드 이동 | done: 2026-03-23

### 2026-03-21
- [x] [기능] 딥로그 탕/사우나 온도 통합 — 온탕/열탕/냉탕 토글 통합섹션 + 건식/습식 tribe별 분기 + 점수 미선택/재클릭 해제 | done: 2026-03-21
- [x] [기능] 세신/마사지 리뉴얼 — scrub_types 칩(복수선택) + scrub_cost + 만족도. DB: scrub_types TEXT[], scrub_cost INT | done: 2026-03-21
- [x] [기능] 어드민 로그 비가시화 — 홈 피드/장소 카드/트라이브 통계에서 제외. 온도/비용 집계만 포함. RPC 어드민 제외 | done: 2026-03-21
- [x] [콘텐츠] 카톡 원본 재추출 + DB 반영 — 60건 태그/온도/메모 보강 + orphan 3건 통합 | done: 2026-03-21
- [x] [UX] 홈 라이브/추천 UI 정리 — 카드 폭 통일, compact 4줄 고정, 문구/모달 통일 | done: 2026-03-21
- [x] [정리] 시드 작업 파일 아카이브 — 플랜 11개 + 리서치 19개 아카이브, 스크립트 16개 삭제, rename | done: 2026-03-21

### 2026-03-20
- [x] [콘텐츠] 시드 데이터 230건 벌크 등록 — 4소스 통합, API 매칭, 지도명 sync, 오매칭 수정, 어드민 로그 생성 | done: 2026-03-20
- [x] [기능] DB 스키마 대규모 개편 — facility_type 6종 + bath_policy 분리 + 온탕/열탕 분리 + 딥로그 확장(청결도/습식/열탕) | done: 2026-03-20
- [x] [기능] 시설유형 UI + 타투 커버 — 시설유형 5종 칩 + 탕구분 칩 + JP 타투 커버 모달 + tattoo-cover 태그 | done: 2026-03-20
- [x] [UX] 홈 화면 전면 재설계 — 캘린더→추천/커뮤니티 피드 + UserLogCard + 찜질파 뱃지 전용화 | done: 2026-03-20
- [x] [UX] 스토리 카드 + 내보내기 — 하단 칭호/닉네임 + 찜질파 SWEAT 뱃지 + 베타 칭호 플래그 | done: 2026-03-20
- [x] [법률] 이용약관 + 개인정보 처리방침 — 초안 + 로그인 동의 문구 + 페이지 라우팅 | done: 2026-03-20

### 2026-03-13
- [x] [기능] 칭호 시스템 — XP/레벨 + 마일스톤/랜덤(340종) + 프로필 + 설정 관리 | done: 2026-03-13
- [x] [기능] 스토리 Canvas 렌더러 + 사-피 리포트 개편 + 장소 정보 수정 | done: 2026-03-13
- [x] [리팩토링] 온보딩·로그·딥로그 UI 정리 + DB bath_gender 이동 + sweat/purposes 정리 | done: 2026-03-13
- [x] [UX] 탐색 더보기 + 글래스 카드 + 트라이브 필터 + 장소 소셜 설계 | done: 2026-03-13

### 2026-03-08~10
- [x] [기능] 기록 핵심 — 날짜/시간 편집 + 비용 통화 선택 + 기록 흐름 수정 + 스토리 에디터 | done: 2026-03-10
- [x] [UX] 네비게이션 — 하단 바 + 병합 모달 + 기록→장소 링크 + 이탈 워닝 | done: 2026-03-08
- [x] [버그] 달력 1일 밀림 + Naver 지도 링크 + 삭제 후 stale + 딥로그 복원 | done: 2026-03-10

### 2026-03-01~06
- [x] [인프라] DB 기반 완성 — Supabase 연동 + places DB 전환 + CRUD + 타입 동기화 + 레거시 정리 | done: 2026-03-04
- [x] [리팩토링] 중복 로직 제거 + TribeId 통합 | done: 2026-03-08
