# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

## Backlog

<!-- P1 -->
- [ ] [리팩토링] safeParse 패턴 재검토 — 현재 overload(null→any) 방식이 최선인지, CurrentLogData 타입 정의 또는 다른 접근이 더 나은지 평가. 상세: `docs/plans/REVIEW_safeParse_errors.md` | priority: P1 | added: 2026-03-04
- [ ] [기능] API 카테고리→시설유형 자동매핑 — 네이버/구글 장소 등록 시 카테고리 기반으로 facility_type 자동 태깅. 상세: `PLAN_venue_type_auto_mapping.md` | priority: P1 | added: 2026-03-20
<!-- P2 -->
- [ ] [UX] 비로그인 홈 — 로그인 후와 동일 구조에 빈 상태 + "로그인하고 기록해보세요!" CTA. (CTA 화면 구현 완료, 로그인 후와 동일 구조 빈 상태로 전환 필요) | priority: P2 | added: 2026-02-28
- [ ] [UX] 전체 UI 흐름 점검 및 개선 — 화면 간 전환, 네비게이션, 사용자 여정 검토 | priority: P2 | added: 2026-02-28
- [ ] [UX] Auth 가드 + 로그인 팝업 모듈 — 비로그인 유저가 보호 기능(기록, 즐겨찾기 등) 접근 시 리다이렉트 대신 "로그인이 필요합니다" 팝업 표시. explore/[id] 공개 전환 포함. 상세: `docs/plans/ANALYSIS_storage_strategy.md` | priority: P2 | added: 2026-03-08
- [ ] [버그] 로그인 OAuth try/catch 누락 — login/page.tsx signInWithOAuth 네트워크 실패 시 에러 UI 없음. 상세: `docs/plans/archive/PLAN_app_stabilization_20260228.md` P1-6 | priority: P2 | added: 2026-03-06
- [ ] [기능] 장소 선택 '내 주변' — navigator.geolocation으로 현재 위치 → places.latitude/longitude 기반 거리 계산 → 거리순 정렬 | priority: P2 | added: 2026-03-04
- [ ] [UX] 히스토리 뷰 모드별 부가 기능 — 리스트 뷰: 정렬/필터 옵션(날짜순, 평점순, 타입별), 캘린더 뷰: 월별 stats | priority: P2 | added: 2026-03-10
- [ ] [디자인] UI 디자인 체계 업데이트 — Phase 0-10 완료. 남은: Phase 11(최종검증). 상세: `docs/plans/PLAN_design_overhaul_implementation.md` | priority: P2 | added: 2026-02-28
- [ ] [기능] Explore 탭 신규 장소 추가 — 사용자가 탐색 화면에서 직접 새 장소를 등록 | priority: P2 | added: 2026-02-28
- [ ] [기능] 장소 찜(북마크) 시스템 — Spotify Playlist 모델. localStorage → DB 전환 포함 | priority: P2 | added: 2026-02-27
- [ ] [기능] 사우나 목록(컬렉션) 생성/관리 — 공개·비공개 설정 | priority: P2 | added: 2026-02-27
- [ ] [인프라] 도메인 URL 구매 | priority: P2 | added: 2026-02-28
- [ ] [인프라] 에러 로깅 & 리포팅 시스템 구축 | priority: P2 | added: 2026-02-28
- [ ] [UX] 폐업 배지 + 필터링 — place-card에 status='closed' 배지 표시 | priority: P2 | added: 2026-03-02
- [ ] [기능] "폐업했어요" 버튼 + Google 검증 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 병합 리뷰 화면 — merged=true 장소 + 소스 비교 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 수동 등록 장소 리뷰 큐 | priority: P2 | added: 2026-03-11
- [ ] [기능] "다른 장소에요" 신고 | priority: P2 | added: 2026-03-02
- [ ] [기능] 회원 탈퇴 기능 — 이메일(sapi.sauna@gmail.com) 요청 처리. 향후 앱 내 자동화 검토 | priority: P2 | added: 2026-03-20
- [ ] [데이터] 시설 태그 보강 — 태그 없는 한국 시설 9건 + 해외 상세 주소 미확인 건. 유저 기여로 보완 예정 | priority: P2 | added: 2026-03-20
- [ ] [콘텐츠] 큐레이션 리스트 기능 — 사우나슐렝/올해의사우나 등. UUID 매핑 완료, DB 연결 필요. 드래프트: `scripts/010_curated_lists_DRAFT.sql` | priority: P2 | added: 2026-03-20
<!-- P3 -->
- [ ] [최적화] Google Fonts next/font 전환 | priority: P3 | added: 2026-03-06
- [ ] [기능] 크로스 소스 장소 매칭 — 네이버 등록 시 구글 Nearby Search로 place_id 확보 | priority: P3 | added: 2026-03-01
- [ ] [기능] 목록 공유 링크 및 구독(팔로우) 시스템 | priority: P3 | added: 2026-02-27
- [ ] [인프라] PWA 오프라인 지원 및 동기화 전략 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 진행 기능 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 단계에서 사용자 행동 분석 | priority: P3 | added: 2026-02-28

## Done

- [x] [UX] 홈 더보기 쉐브론 레드 | priority: P3 | added: 2026-03-20 | done: 2026-03-21
- [x] [법률] 로그인 약관 동의 문구 + 이용약관/개인정보 처리방침 페이지 — 로그인 페이지 문구, /legal/terms, /legal/privacy 페이지, 설정 라우팅 연결 | priority: P0 | added: 2026-03-20 | done: 2026-03-20
- [x] [법률] 개인정보 처리방침 + 이용약관 초안 — 베타 출시용. 서비스명: 사-피(SA-PI) | priority: P0 | added: 2026-03-20 | done: 2026-03-20
- [x] [UX] 설정 페이지 인스타그램 링크 — @sapi.sauna | priority: P3 | added: 2026-03-20 | done: 2026-03-20
- [x] [UX] 탐색 필터 탕구분 한글 라벨 — FACILITY_LABEL_MAP/ICON_MAP에 bath_policy 매핑 | priority: P2 | added: 2026-03-20 | done: 2026-03-20
- [x] [UX] 스토리 카드 레이아웃 — 하단: tribe dot(윗줄) + SA-PI SAUNA/칭호pill/닉네임(아랫줄). 내보내기 동일 반영 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] 베타 칭호 플래그 — IS_BETA=true → 온보딩 시 '첫 사-피엔스' 고정. rewards.ts에서 false로 복원 가능 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [UX] 찜질파 뱃지 전용화 — 스토리/히스토리: HEAT/PAUSE/RPT/SWEAT(/5). 상단 메트릭: REST만. 퀵로그 ICE 제외 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [UX] 홈 커뮤니티 카드 장소명+이모지 같은 라인 + 추천 더보기 축소 | priority: P2 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] 타투 커버 모달 — JP 장소만 모달(커버/자유 분기), 그 외 바로 tattoo-friendly. Explore 필터 매칭 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] 시설유형 UI 정리 — 대중목욕탕/동네목욕탕/호텔프리미엄/개인사우나/특수. 헬스장사우나 UI 숨김 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] facility_type + bath_policy 분리 — 시설유형 6종 + 탕구분 4종. deriveBathGender → bath_policy+facility_type 기반 | priority: P0 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] 온탕/열탕 분리 — hot_bath=온탕(logs), very_hot_bath=열탕(deep_logs). 사우너 딥로그 온탕 → logs.hot_bath_temp 저장 | priority: P1 | added: 2026-03-20 | done: 2026-03-20
- [x] [기능] 딥로그 확장 — 청결도 1-5 + 습식사우나 40-70°C + 열탕 38-46°C. 시설 자동태그. UI 순서 변경 | priority: P0 | added: 2026-03-20 | done: 2026-03-20
- [x] [콘텐츠] 시드 데이터 벌크 등록 — 4개 소스 통합 230건. Naver/Google API 매칭 + 어드민 로그 생성. 오매칭 16건 수정 + 지도명 sync | priority: P1 | added: 2026-03-10 | done: 2026-03-20
- [x] [UX] 홈 화면 재설계 — 캘린더 → 추천+커뮤니티 피드 중심. UserLogCard/useHomeRecommendations 추가 | priority: P1 | added: 2026-03-13 | done: 2026-03-20
- [x] [기능] 칭호 시스템 — XP/레벨 + 마일스톤/랜덤 칭호(340종) + 프로필 표시 + 설정 관리 UI | priority: P1 | added: 2026-03-01 | done: 2026-03-13
- [x] [기능] 스토리 카드 Canvas 렌더러 — modern-screenshot → Canvas 직접 렌더링 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 장소 상세 사-피 리포트 개편 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 탐색 페이지 더보기 페이지네이션 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 글래스 카드 가시성 개선 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 트라이브 필터 드롭다운 바깥 클릭 닫기 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [리팩토링] 온보딩·로그·딥로그·닉네임 UI 정리 + DB bath_gender 이동 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [인프라] DB 마이그레이션 — `logs.sweat_quality` + `deep_logs.purposes` DROP | priority: P1 | added: 2026-03-11 | done: 2026-03-13
- [x] [UX] 장소 기록 소셜 설계 | priority: P2 | added: 2026-03-11 | done: 2026-03-13
- [x] [기능] 장소 정보 수정 | priority: P2 | added: 2026-03-08 | done: 2026-03-13
- [x] [UX] 스토리 사진 버튼 대안 탐색 | priority: P2 | added: 2026-03-10 | done: 2026-03-13
- [x] [버그] 달력 날짜 1일 밀림 | priority: P1 | added: 2026-03-09 | done: 2026-03-10
- [x] [UX] 성공 토스트 고도화 | priority: P2 | added: 2026-03-09 | done: 2026-03-11
- [x] [UX] 병합 확인 모달 | priority: P0 | added: 2026-03-02 | done: 2026-03-08
- [x] [UX] 기록 상세 → 장소 상세 링크 | priority: P1 | added: 2026-03-04 | done: 2026-03-08
- [x] [리팩토링] TribeId 타입 통합 | priority: P2 | added: 2026-03-08 | done: 2026-03-08
- [x] [기능] 기록 날짜/시간 편집 | priority: P1 | added: 2026-03-04 | done: 2026-03-08
- [x] [기능] 비용 통화 선택 | priority: P1 | added: 2026-03-04 | done: 2026-03-10
- [x] [버그] Naver 장소 지도 링크 미작동 | priority: P1 | added: 2026-02-27 | done: 2026-03-08
- [x] [UX] 하단 네비게이션 바 | priority: P1 | added: 2026-02-28 | done: 2026-03-08
- [x] [기능] 홈 화면 | priority: P1 | added: 2026-02-28 | done: 2026-03-08
- [x] [UX] 기록 추가 흐름 수정 | priority: P1 | added: 2026-03-09 | done: 2026-03-09
- [x] [기능] 스토리 에디터 완성도 점검 | priority: P2 | added: 2026-02-27 | done: 2026-03-09
- [x] [기능] log/nudge 페이지 완성 | priority: P3 | added: 2026-02-27 | done: 2026-03-09
- [x] [버그] 로그 삭제 후 탐색 탭 stale 데이터 | priority: P1 | added: 2026-03-08 | done: 2026-03-08
- [x] [리팩토링] 중복 로직 제거 | priority: P1 | added: 2026-03-01 | done: 2026-03-06
- [x] [인프라] Supabase 연동 및 Auth 시스템 구현 | priority: P1 | added: 2026-02-27 | done: 2026-02-28
- [x] [버그] 장소 신규 추가 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [버그] 사우너파 그래프 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [인프라] 장소 데이터 실제 DB 연동 | priority: P0 | added: 2026-03-01 | done: 2026-03-03
- [x] [인프라] places-service 함수 업데이트 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 타입 정의 DB 동기화 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [UX] 지도 랜딩 URL 변경 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 로그 수정(UPDATE) 함수 구현 | priority: P0 | added: 2026-03-01 | done: 2026-03-04
- [x] [버그] Naver 검색 HTML 엔티티 미디코딩 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] display_id 불필요 코드 제거 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] localStorage 레거시 정리 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 최근 등록 장소 레거시 데이터 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 딥로그 신규 기록 시 이전 데이터 복원 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 기록 이탈 시 미저장 워닝 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 장소 등록 유형 선택 개선 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
