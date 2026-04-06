# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

## Backlog

<!-- P0 — 베타 출시 전 필수 -->
- [ ] [인프라] 에러 로깅 — 베타 기간 버그 리포트 수집 필수. Sentry 또는 간단 에러 바운더리 | priority: P0 | added: 2026-02-28

<!-- P1 — 베타 핵심 기능 -->
- [ ] [기능] SA-LIST 리워드 — XP: list_created(30), list_shared(10), first_subscriber(30). 마일스톤 칭호: 큐레이터(첫 리스트), 컬렉터(5개), 인플루언서(구독자10), 백과사전(장소30개 추가). rewards.ts + reward-service.ts 확장 | priority: P1 | added: 2026-03-23
- [ ] [콘텐츠] 큐레이션 리스트 시드 — 어드민 is_featured 리스트 5~8개 생성 (노천탕/24시/세신 등) | priority: P1 | added: 2026-03-23
- [ ] [기능] 장소 탐색 강화 — '내 주변' 거리순 정렬(geolocation) + Explore에서 직접 장소 등록 | priority: P1 | added: 2026-03-04
- [ ] [인프라] 도메인 구매 — 정식 출시 시. 베타는 Vercel URL로 충분 | priority: P3 | added: 2026-02-28

<!-- P2 — 베타 중 개선 -->
- [ ] [기능] 어드민 도구 — 병합 리뷰 + 수동 등록 리뷰 큐 + "다른 장소에요"/"폐업했어요" 신고 + 폐업 배지 | priority: P2 | added: 2026-03-02
- [ ] [리서치+UX] 나의 기록 & 통계 설계 — 히스토리 뷰 형태(타임라인/카드/리스트), 정렬·필터(날짜·평점·타입), 유저 통계 지표(총 방문수/월별 추이/자주 간 장소/트라이브 분포/온도 선호/재방문 점수), 표시 위치(프로필/히스토리/별도 탭), 시각화 방식 | priority: P2 | added: 2026-03-10
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

### 2026-04-07
- [x] [보안] OAuth 에러 핸들링 — signInWithOAuth try-catch 추가, 네트워크 실패/OAuth 에러/callback 에러 통합 UI | priority: P0 | added: 2026-03-06 | done: 2026-04-07
- [x] [보안] 비로그인 경험 + Auth 가드 — /home·/sa-list 공개, LoginPromptModal로 찜/구독/생성/히스토리/설정 가드, 프로필 유도카드, 홈 CTA "로그인하고 기록하기", SA-LIST 내리스트 칭 숨김 | priority: P0 | added: 2026-02-28 | done: 2026-04-07
- [x] [최적화] Google Fonts next/font 전환 — Oswald/Libre Franklin/Noto Sans KR 셀프호스팅, no-page-custom-font 워닝 제거 | priority: P3 | added: 2026-03-06 | done: 2026-04-07
- [x] [UX] PlaceCard 시설칩 1줄 고정 — flex-nowrap overflow-hidden | done: 2026-04-07
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
