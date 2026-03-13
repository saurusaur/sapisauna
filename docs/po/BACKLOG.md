# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

## Backlog

<!-- P1 -->
- [ ] [콘텐츠] 큐레이션 사우나 리스트 시드 데이터 — 사우나슐렝, 탑 사우나, 고독한 사우나 리스트 등 유명 큐레이션 리스트의 장소를 DB에 미리 등록. 초기 유저 탐색 경험 향상용 | priority: P1 | added: 2026-03-10
- [ ] [기능] 기여 보상 뱃지 시스템 (Phase 1) — 기록·장소등록 기반 개인 달성 뱃지 + 프로필 표시 + 획득 토스트. 랭킹 없이 개인 달성 중심. 상세: `docs/plans/PLAN_reward_system.md`, `docs/plans/reference_reward_system.md` | priority: P1 | added: 2026-03-01
- [ ] [리팩토링] safeParse 패턴 재검토 — 현재 overload(null→any) 방식이 최선인지, CurrentLogData 타입 정의 또는 다른 접근이 더 나은지 평가. 상세: `docs/plans/REVIEW_safeParse_errors.md` | priority: P1 | added: 2026-03-04
- [ ] [UX] 홈 화면 재설계 — 현재 달력 중심 → 추천/후기 중심으로 전환. 핵심: ①취향+위치 기반 사우나 추천 ②다른 유저 후기 피드. 달력은 자주 안 가는 유저에게 비어 보임. '기록하기' '기록 보기' 큰 CTA 버튼 배치. 달력은 히스토리 탭으로 이동 또는 축소 | priority: P1 | added: 2026-03-13
<!-- P2 -->
- [ ] [UX] 비로그인 홈 — 로그인 후와 동일 구조에 빈 상태 + "로그인하고 기록해보세요!" CTA. (CTA 화면 구현 완료, 로그인 후와 동일 구조 빈 상태로 전환 필요) | priority: P2 | added: 2026-02-28
- [ ] [UX] 전체 UI 흐름 점검 및 개선 — 화면 간 전환, 네비게이션, 사용자 여정 검토 | priority: P2 | added: 2026-02-28
- [ ] [UX] Auth 가드 + 로그인 팝업 모듈 — 비로그인 유저가 보호 기능(기록, 즐겨찾기 등) 접근 시 리다이렉트 대신 "로그인이 필요합니다" 팝업 표시. explore/[id] 공개 전환 포함. 상세: `docs/plans/ANALYSIS_storage_strategy.md` | priority: P2 | added: 2026-03-08
- [ ] [버그] 로그인 OAuth try/catch 누락 — login/page.tsx signInWithOAuth 네트워크 실패 시 에러 UI 없음. 상세: `docs/plans/archive/PLAN_app_stabilization_20260228.md` P1-6 | priority: P2 | added: 2026-03-06
- [ ] [기능] 장소 선택 '내 주변' — navigator.geolocation으로 현재 위치 → places.latitude/longitude 기반 거리 계산 → 거리순 정렬. 클라이언트 Haversine으로 시작, 장소 수 증가 시 Supabase earthdistance 확장 전환 (cube+earthdistance 활성화 필요, 스키마 변경 없음) | priority: P2 | added: 2026-03-04
- [ ] [UX] 히스토리 뷰 모드별 부가 기능 — 리스트 뷰: 정렬/필터 옵션(날짜순, 평점순, 타입별), 캘린더 뷰: 월별 stats(방문 횟수, 타입 분포 등) 표시 | priority: P2 | added: 2026-03-10
- [ ] [디자인] UI 디자인 체계 업데이트 — Phase 0-10 완료. 남은: Phase 11(최종검증). 상세: `docs/plans/PLAN_design_overhaul_implementation.md` | priority: P2 | added: 2026-02-28
- [ ] [기능] Explore 탭 신규 장소 추가 — 사용자가 탐색 화면에서 직접 새 장소를 등록 | priority: P2 | added: 2026-02-28
- [ ] [기능] 장소 찜(북마크) 시스템 — Spotify Playlist 모델. 현재 localStorage 기반 favorites를 DB(user_favorites 테이블)로 전환 포함. 비로그인 시 localStorage 폴백 -> 로그인 시 DB 머지. use-favorites 훅 내부만 교체하여 외부 인터페이스 유지 | priority: P2 | added: 2026-02-27
- [ ] [기능] 사우나 목록(컬렉션) 생성/관리 — 공개·비공개 설정 | priority: P2 | added: 2026-02-27
- [ ] [인프라] 도메인 URL 구매 | priority: P2 | added: 2026-02-28
- [ ] [인프라] 에러 로깅 & 리포팅 시스템 구축 | priority: P2 | added: 2026-02-28
- [ ] [UX] 폐업 배지 + 필터링 — place-card에 status='closed' 배지 표시, 탐색 목록에서 폐업 장소 숨김/흐리게 | priority: P2 | added: 2026-03-02
- [ ] [기능] "폐업했어요" 버튼 + Google 검증 — 유저 신고 → Google business_status API 확인 → 상태 업데이트 or 어드민 큐 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 병합 리뷰 화면 — merged=true 장소 목록 + 소스별 원본 비교. 유저 관리 시 users.status 컬럼(active/suspended/banned) 도입 검토 — 프로필 행 삭제 대신 소프트 밴 방식으로 차단. user-context에서 status 체크 후 차단 안내 화면 표시 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 수동 등록 장소 리뷰 큐 — source='manual' 장소 목록 표시 + 좌표·API 매칭 검증 화면. 장소 추가 시 검색 기반 등록 우선, 수동 입력은 폴백으로만 허용 (구현 완료) | priority: P2 | added: 2026-03-11
- [ ] [기능] "다른 장소에요" 신고 — 잘못 병합된 장소 유저 신고 → 어드민 큐 | priority: P2 | added: 2026-03-02
<!-- P3 -->
- [ ] [최적화] Google Fonts next/font 전환 — layout.tsx의 link 태그를 next/font/google로 교체. 렌더링 성능 개선 | priority: P3 | added: 2026-03-06
- [ ] [기능] 크로스 소스 장소 매칭 — 네이버 등록 시 구글 Nearby Search로 place_id 확보, 사용자 확인 1탭 (외국인 유저 대응) | priority: P3 | added: 2026-03-01
- [ ] [기능] 목록 공유 링크 및 구독(팔로우) 시스템 | priority: P3 | added: 2026-02-27
- [ ] [인프라] PWA 오프라인 지원 및 동기화 전략 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 진행 기능 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 단계에서 사용자 행동 분석 — 기능별 사용 빈도 확인, 미사용 기능 제거 (오프라인 진행) | priority: P3 | added: 2026-02-28

## Done

- [x] [기능] 스토리 카드 Canvas 렌더러 — modern-screenshot → Canvas 직접 렌더링. SVG 그래프 보존, half-leading 보정 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 장소 상세 사-피 리포트 개편 — 트라이브 바·온도·서브 메트릭·혼잡도·세신/매점/비용 통합, 트라이브 수별 그리드 정렬 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 탐색 페이지 더보기 페이지네이션 — 3개 → 10개씩 로드 + 위로가기 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 글래스 카드 가시성 개선 — 투명도 .45→.55, border .55→.65 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [UX] 트라이브 필터 드롭다운 바깥 클릭 닫기 — 장소 상세 로그 필터 | priority: P2 | added: 2026-03-13 | done: 2026-03-13
- [x] [리팩토링] 온보딩·로그·딥로그·닉네임 UI 정리 + DB bath_gender 로그 테이블 이동 | priority: P1 | added: 2026-03-13 | done: 2026-03-13
- [x] [인프라] DB 마이그레이션 — `logs.sweat_quality` integer nullable 추가 + `deep_logs.purposes` 컬럼 DROP | priority: P1 | added: 2026-03-11 | done: 2026-03-13
- [x] [UX] 장소 기록 소셜 설계 — explore/[id]에 다른 유저 기록 표시 + 사-피 리포트 통합 완료 | priority: P2 | added: 2026-03-11 | done: 2026-03-13
- [x] [기능] 장소 정보 수정 — place/[id]/edit 페이지 + updatePlace API | priority: P2 | added: 2026-03-08 | done: 2026-03-13
- [x] [UX] 스토리 사진 버튼 대안 탐색 — 배경 변경/초기화 버튼으로 개선 | priority: P2 | added: 2026-03-10 | done: 2026-03-13
- [x] [버그] 달력 날짜 1일 밀림 — record_date를 TIMESTAMP(TZ 없음)로 변경 + 저장/표시에서 UTC 변환 전부 제거. 7파일 수정 | priority: P1 | added: 2026-03-09 | done: 2026-03-10
- [x] [UX] 성공 토스트 고도화 — canvas-confetti 폭죽 애니메이션 구현 완료 (새 기록 시만 발동, 편집 시 미발동) | priority: P2 | added: 2026-03-09 | done: 2026-03-11
- [x] [UX] 병합 확인 모달 — 장소 등록 시 50m 내 기존 장소 발견되면 "이 장소인가요?" 유저 확인 UI | priority: P0 | added: 2026-03-02 | done: 2026-03-08
- [x] [UX] 기록 상세 → 장소 상세 링크 — history/[id] → explore/[id] 이동 | priority: P1 | added: 2026-03-04 | done: 2026-03-08
- [x] [리팩토링] TribeId 타입 통합 — 리터럴 반복 제거 + 상수화. 13파일 통합 | priority: P2 | added: 2026-03-08 | done: 2026-03-08
- [x] [기능] 기록 날짜/시간 편집 — record_date 컬럼 + date picker + 시간 셀렉트 | priority: P1 | added: 2026-03-04 | done: 2026-03-08
- [x] [기능] 비용 통화 선택 — DB currency 컬럼 + 딥로그 통화 셀렉터 + countryCode 기반 기본값 | priority: P1 | added: 2026-03-04 | done: 2026-03-10
- [x] [버그] Naver 장소 지도 링크 미작동 — 검색 URL 사용으로 해결 | priority: P1 | added: 2026-02-27 | done: 2026-03-08
- [x] [UX] 하단 네비게이션 바 — 5항목 구조(4탭+center raised 기록 버튼) | priority: P1 | added: 2026-02-28 | done: 2026-03-08
- [x] [기능] 홈 화면 — 주간/월간 달력 + 날짜별 기록 카드 캐러셀 + 추천 섹션 | priority: P1 | added: 2026-02-28 | done: 2026-03-08
- [x] [UX] 기록 추가 흐름 수정 — 숏로그 후 딥로그/스토리 분기 UI + 스토리 단순화 | priority: P1 | added: 2026-03-09 | done: 2026-03-09
- [x] [기능] 스토리 에디터 완성도 점검 — 에디터 제거, 사진 추가/삭제로 단순화 | priority: P2 | added: 2026-02-27 | done: 2026-03-09
- [x] [기능] log/nudge 페이지 완성 및 푸시 알림 연동 — nudge 제거, 분기 모달로 대체 | priority: P3 | added: 2026-02-27 | done: 2026-03-09
- [x] [버그] 로그 삭제 후 탐색 탭 stale 데이터 — pathname 의존성 추가로 자동 refetch | priority: P1 | added: 2026-03-08 | done: 2026-03-08
- [x] [리팩토링] 중복 로직 제거 — Phase 1-2, -303줄 | priority: P1 | added: 2026-03-01 | done: 2026-03-06
- [x] [인프라] Supabase 연동 및 Auth 시스템 구현 | priority: P1 | added: 2026-02-27 | done: 2026-02-28
- [x] [버그] 장소 신규 추가 — API 키 설정 + Google 검색 필터 최적화 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [버그] 사우너파 그래프 — 정상 동작 확인 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [인프라] 장소 데이터 실제 DB 연동 — Supabase places 테이블 전환 | priority: P0 | added: 2026-03-01 | done: 2026-03-03
- [x] [인프라] places-service 함수 업데이트 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 타입 정의 DB 동기화 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [UX] 지도 랜딩 URL 변경 — Naver/Google URL 구현 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 로그 수정(UPDATE) 함수 구현 | priority: P0 | added: 2026-03-01 | done: 2026-03-04
- [x] [버그] Naver 검색 HTML 엔티티 미디코딩 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] display_id 불필요 코드 제거 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] localStorage 레거시 정리 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 최근 등록 장소 레거시 데이터 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 딥로그 신규 기록 시 이전 데이터 복원 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 기록 이탈 시 미저장 워닝 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 장소 등록 유형 선택 개선 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
