# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

## Backlog

<!-- P0 -->
<!-- P0: Dedup & DB 변경 연동 (프론트엔드) -->
- [ ] [UX] 병합 확인 모달 — 장소 등록 시 50m 내 기존 장소 발견되면 "이 장소인가요?" 유저 확인 UI. 자동 병합 오매칭 방지. 상세: `docs/plans/PLAN_place_dedup_logic.md` | priority: P0 | added: 2026-03-02
<!-- P1: 네비게이션 -->
- [ ] [UX] 기록 상세 → 장소 상세 링크 — history/[id] 페이지에서 장소 이름 탭하면 explore/[id]로 이동. 장소 간 탐색 동선 연결 | priority: P1 | added: 2026-03-04
<!-- P1: 리팩토링 -->
- [ ] [리팩토링] safeParse 패턴 재검토 — 현재 overload(null→any) 방식이 최선인지, CurrentLogData 타입 정의 또는 다른 접근이 더 나은지 평가. 상세: `docs/plans/REVIEW_safeParse_errors.md` | priority: P1 | added: 2026-03-04
<!-- P1 -->
- [ ] [기능] 기록 날짜/시간 편집 — 로그 작성·편집 시 created_at을 date/time picker로 수정 가능하게. 현재는 저장 시점 자동 기록만 지원 | priority: P1 | added: 2026-03-04
- [ ] [기능] 비용 통화 선택 — DB에 currency 컬럼 추가 (logs 또는 deep_logs). 유저가 입장료 기록 시 통화 직접 선택 (KRW/JPY/USD 등). 장소 countryCode 기반 기본값 자동 설정 + 수동 변경 가능. 향후 환율 API 연동으로 환산 표시 확장 가능 | priority: P1 | added: 2026-03-04
- [ ] [버그] Naver 장소 지도 링크 미작동 — Naver external_id가 좌표 조합(mapx_mapy)이라 entry/place URL 미작동. place_id 또는 주소+이름 검색 URL로 전환 필요 | priority: P1 | added: 2026-02-27
- [ ] [UX] 비로그인 홈 — 로그인 후와 동일 구조에 빈 상태 + "로그인하고 기록해보세요!" CTA. (CTA 화면 구현 완료, 로그인 후와 동일 구조 빈 상태로 전환 필요) | priority: P1 | added: 2026-02-28
- [ ] [UX] 하단 네비게이션 바 — 정리 & 플리 기능 플레이스홀더 추가. (기록 버튼 제거 완료) | priority: P1 | added: 2026-02-28
- [ ] [기능] 홈 화면 — 최근 기록을 달력 보기로 전환 + 더보기로 리스트 보기. 달력 내 '오늘' 버튼(스크롤 중 오늘 일자로 복귀), 연도 탭 시 연/월/일 입력으로 해당 날짜 바로 이동. 타입별 카운트 란은 높이 고정 — 데이터 유무에 따라 문구만 표시/숨김, 레이아웃 시프트 없이 | priority: P1 | added: 2026-02-28
- [ ] [UX] 전체 UI 흐름 점검 및 개선 — 화면 간 전환, 네비게이션, 사용자 여정 검토 | priority: P1 | added: 2026-02-28
- [ ] [리팩토링] user-context localStorage 제거 — DB를 single source of truth로 통일. localStorage 캐시 제거하여 sync 문제 원천 차단. 영향: user-context.tsx, onboarding/page.tsx, 설정 페이지들 | priority: P2 | added: 2026-03-06
<!-- P2 -->
- [ ] [기능] 장소 선택 '내 주변' — navigator.geolocation으로 현재 위치 → places.latitude/longitude 기반 거리 계산 → 거리순 정렬. 클라이언트 Haversine으로 시작, 장소 수 증가 시 Supabase earthdistance 확장 전환 (cube+earthdistance 활성화 필요, 스키마 변경 없음) | priority: P2 | added: 2026-03-04
- [ ] [버그/아키텍처] 스토리 미리보기↔에디터 간 요소 사이즈/배치 불일치 — 경쟁앱 리서치 후 dev-cycle 진행 | priority: P2 | added: 2026-02-28
- [ ] [디자인] UI 디자인 체계 업데이트 — 컬러/타이포/스페이싱 시스템 정비 | priority: P2 | added: 2026-02-28
- [ ] [기능] Explore 탭 신규 장소 추가 — 사용자가 탐색 화면에서 직접 새 장소를 등록 | priority: P2 | added: 2026-02-28
- [ ] [기능] 장소 찜(북마크) 시스템 — Spotify Playlist 모델. 현재 localStorage 기반 favorites를 DB(user_favorites 테이블)로 전환 포함. 비로그인 시 localStorage 폴백 -> 로그인 시 DB 머지. use-favorites 훅 내부만 교체하여 외부 인터페이스 유지 | priority: P2 | added: 2026-02-27
- [ ] [기능] 사우나 목록(컬렉션) 생성/관리 — 공개·비공개 설정 | priority: P2 | added: 2026-02-27
- [ ] [기능] 스토리 에디터 완성도 점검 (스티커/배경/크롭) | priority: P2 | added: 2026-02-27
- [ ] [인프라] 도메인 URL 구매 | priority: P2 | added: 2026-02-28
- [ ] [인프라] 에러 로깅 & 리포팅 시스템 구축 | priority: P2 | added: 2026-02-28
- [ ] [기능] 기여 보상 뱃지 시스템 (Phase 1) — 기록·장소등록 기반 개인 달성 뱃지 + 프로필 표시 + 획득 토스트. 랭킹 없이 개인 달성 중심. 상세: `docs/plans/PLAN_reward_system.md` | priority: P2 | added: 2026-03-01
- [ ] [UX] 폐업 배지 + 필터링 — place-card에 status='closed' 배지 표시, 탐색 목록에서 폐업 장소 숨김/흐리게 | priority: P2 | added: 2026-03-02
- [ ] [기능] "폐업했어요" 버튼 + Google 검증 — 유저 신고 → Google business_status API 확인 → 상태 업데이트 or 어드민 큐 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 병합 리뷰 화면 — merged=true 장소 목록 + 소스별 원본 비교 | priority: P2 | added: 2026-03-02
- [ ] [기능] "다른 장소에요" 신고 — 잘못 병합된 장소 유저 신고 → 어드민 큐 | priority: P2 | added: 2026-03-02
<!-- P3 -->
- [ ] [기능] 크로스 소스 장소 매칭 — 네이버 등록 시 구글 Nearby Search로 place_id 확보, 사용자 확인 1탭 (외국인 유저 대응) | priority: P3 | added: 2026-03-01
- [ ] [기능] 목록 공유 링크 및 구독(팔로우) 시스템 | priority: P3 | added: 2026-02-27
- [ ] [기능] log/nudge 페이지 완성 및 푸시 알림 연동 | priority: P3 | added: 2026-02-27
- [ ] [인프라] PWA 오프라인 지원 및 동기화 전략 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 진행 기능 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 단계에서 사용자 행동 분석 — 기능별 사용 빈도 확인, 미사용 기능 제거 (오프라인 진행) | priority: P3 | added: 2026-02-28

## Done

- [x] [리팩토링] 중복 로직 제거 — Phase 1(safeParse·dead code) + Phase 2(훅·컴포넌트·상수 통합, -303줄) | priority: P1 | added: 2026-03-01 | done: 2026-03-06

- [x] [인프라] Supabase 연동 및 Auth(로그인) 시스템 구현 | priority: P1 | added: 2026-02-27 | done: 2026-02-28
- [x] [버그] 장소 신규 추가 — API 키 설정 + Google 검색 필터 최적화 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [버그] 사우너파 그래프 — 사용자 오인 확인, 정상 동작 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [인프라] 장소 데이터 실제 DB 연동 — Supabase places 테이블 전환, CRUD 연결 | priority: P0 | added: 2026-03-01 | done: 2026-03-03
- [x] [인프라] places-service 함수 업데이트 — link 제거·coordinate_source 추가·place_sources lat/lng·findNearbyPlaces 복수형 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 타입 정의 DB 동기화 — PlaceSource/Place 타입 DB 스키마 일치 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [UX] 지도 랜딩 URL 변경 — Naver 주소+이름 검색 URL, Google place_id 기반 URL 구현 | priority: P0 | added: 2026-03-02 | done: 2026-03-03
- [x] [인프라] 로그 수정(UPDATE) 함수 구현 — updateLog + saveOrUpdateDeepLog + edit/insert 분기 + useRef 가드 + created_at/place_id 보존 | priority: P0 | added: 2026-03-01 | done: 2026-03-04
- [x] [버그] Naver 검색 HTML 엔티티 미디코딩 — stripHtml()에 &amp; 등 엔티티 디코딩 추가 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] display_id 불필요 코드 제거 — generate-id.ts 삭제 + 7개 파일 정리. DB에 저장된 적 없는 죽은 코드 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [인프라] localStorage 레거시 정리 — storage.ts 삭제 + 장소 선택 DB 기반 전환 + 마이그레이션 백로그 제거 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 최근 등록 장소 레거시 데이터 — localStorage 대신 DB places 최신 3개 표시 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [버그] 딥로그 신규 기록 시 이전 데이터 복원 — 편집 모드일 때만 deep_log 복원하도록 수정 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 기록 이탈 시 미저장 워닝 — place/add, log, log/deep, story 뒤로가기에 확인 모달 추가 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
- [x] [UX] 장소 등록 유형 선택 개선 — "탕 구분"→"유형 선택", 맨 위 배치, "일반 대중탕" 기본값, 아로마사우나 삭제 | priority: P1 | added: 2026-03-04 | done: 2026-03-04
