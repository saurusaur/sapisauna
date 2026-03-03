# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress

- [ ] [인프라] 장소 데이터 실제 DB 연동 — 더미/로컬 장소 데이터를 Supabase places 테이블로 전환, CRUD 연결 | priority: P0 | added: 2026-03-01

## Backlog

<!-- P0: UI↔DB 동기화 (감사 결과 기반) -->
- [ ] [인프라] UI↔DB 동기화 수정 — 매점 컬럼 추가, purpose 배열화, INSERT 로직 구현, place_id 연결. 상세: `docs/plans/PLAN_ui_db_sync.md` | priority: P0 | added: 2026-03-01
<!-- P0: Dedup & DB 변경 연동 (프론트엔드) -->
- [ ] [UX] 병합 확인 모달 — 장소 등록 시 50m 내 기존 장소 발견되면 "이 장소인가요?" 유저 확인 UI. 자동 병합 오매칭 방지. 상세: `docs/plans/PLAN_place_dedup_logic.md` | priority: P0 | added: 2026-03-02
- [ ] [인프라] places-service 함수 업데이트 — addPlace에서 link 제거·coordinate_source 추가·place_sources에 lat/lng 저장, findNearbyPlace→findNearbyPlaces(복수형, LIMIT 1 제거) | priority: P0 | added: 2026-03-02
- [ ] [인프라] 타입 정의 DB 동기화 — PlaceSource: link 제거·lat/lng 추가, Place: coordinate_source·status·merged 추가 | priority: P0 | added: 2026-03-02
- [ ] [UX] 지도 랜딩 URL 변경 — 장소 상세에서 Naver는 주소+이름 검색 URL, Google은 place_id 기반 URL로 교체. 실제 지도 업체 페이지 랜딩 | priority: P0 | added: 2026-03-02
- [ ] [인프라] 로그 수정 시 updated_at 기록 — logs에 logged_at 없이 created_at+updated_at 사용. 수정 시 updated_at 갱신 로직 추가 | priority: P0 | added: 2026-03-02
<!-- P1: 리팩토링 -->
- [ ] [리팩토링] 중복 로직 제거 — AMENITY_LABEL_MAP 제거, getFacilityLabel 통합, 즐겨찾기 훅 추출, ChipSelect/PlaceStatsDisplay 컴포넌트화, SortType/UseDataState/TRIBE_COLORS 통합, FACILITY_ICON_MAP 자동생성. 상세: `docs/plans/REVIEW_duplicate_logic.md` | priority: P1 | added: 2026-03-01
<!-- P1: DB 연동 후 바로 착수 -->
- [ ] [버그] 로그인 후 장소 카드 지도 링크 클릭 시 랜딩 이상 — ⚠️ DB 연동 완료 후 작업 | priority: P1 | added: 2026-02-27
- [ ] [인프라] localStorage → Supabase 데이터 마이그레이션 플로우 | priority: P1 | added: 2026-02-27
- [ ] [UX] 비로그인 홈 — 로그인 후와 동일 구조에 빈 상태 + "로그인하고 기록해보세요!" CTA (현재 버튼 두 개 화면 대체) | priority: P1 | added: 2026-02-28
- [ ] [UX] 하단 네비게이션 바 — 기록 버튼 삭제, 정리 & 플리 기능 플레이스홀더 추가 | priority: P1 | added: 2026-02-28
- [ ] [기능] 홈 화면 — 최근 기록을 달력 보기로 전환 + 더보기로 리스트 보기. 달력 내 '오늘' 버튼(스크롤 중 오늘 일자로 복귀), 연도 탭 시 연/월/일 입력으로 해당 날짜 바로 이동. 타입별 카운트 란은 높이 고정 — 데이터 유무에 따라 문구만 표시/숨김, 레이아웃 시프트 없이 | priority: P1 | added: 2026-02-28
- [ ] [UX] 전체 UI 흐름 점검 및 개선 — 화면 간 전환, 네비게이션, 사용자 여정 검토 | priority: P1 | added: 2026-02-28
<!-- P2 -->
- [ ] [버그/아키텍처] 스토리 미리보기↔에디터 간 요소 사이즈/배치 불일치 — 경쟁앱 리서치 후 dev-cycle 진행 | priority: P2 | added: 2026-02-28
- [ ] [디자인] UI 디자인 체계 업데이트 — 컬러/타이포/스페이싱 시스템 정비 | priority: P2 | added: 2026-02-28
- [ ] [기능] Explore 탭 신규 장소 추가 — 사용자가 탐색 화면에서 직접 새 장소를 등록 | priority: P2 | added: 2026-02-28
- [ ] [기능] 장소 찜(북마크) 시스템 — Spotify Playlist 모델 | priority: P2 | added: 2026-02-27
- [ ] [기능] 사우나 목록(컬렉션) 생성/관리 — 공개·비공개 설정 | priority: P2 | added: 2026-02-27
- [ ] [기능] 스토리 에디터 완성도 점검 (스티커/배경/크롭) | priority: P2 | added: 2026-02-27
- [ ] [인프라] 도메인 URL 구매 | priority: P2 | added: 2026-02-28
- [ ] [인프라] 에러 로깅 & 리포팅 시스템 구축 | priority: P2 | added: 2026-02-28
- [ ] [기능] 기여 보상 뱃지 시스템 (Phase 1) — 기록·장소등록 기반 개인 달성 뱃지 + 프로필 표시 + 획득 토스트. 랭킹 없이 개인 달성 중심. 상세: `docs/plans/PLAN_reward_system.md` | priority: P2 | added: 2026-03-01
<!-- P3 -->
- [ ] [UX] 폐업 배지 + 필터링 — place-card에 status='closed' 배지 표시, 탐색 목록에서 폐업 장소 숨김/흐리게 | priority: P2 | added: 2026-03-02
- [ ] [기능] "폐업했어요" 버튼 + Google 검증 — 유저 신고 → Google business_status API 확인 → 상태 업데이트 or 어드민 큐 | priority: P2 | added: 2026-03-02
- [ ] [기능] 어드민 병합 리뷰 화면 — merged=true 장소 목록 + 소스별 원본 비교 | priority: P2 | added: 2026-03-02
- [ ] [기능] "다른 장소에요" 신고 — 잘못 병합된 장소 유저 신고 → 어드민 큐 | priority: P2 | added: 2026-03-02
- [ ] [기능] 크로스 소스 장소 매칭 — 네이버 등록 시 구글 Nearby Search로 place_id 확보, 사용자 확인 1탭 (외국인 유저 대응) | priority: P3 | added: 2026-03-01
- [ ] [기능] 목록 공유 링크 및 구독(팔로우) 시스템 | priority: P3 | added: 2026-02-27
- [ ] [기능] log/nudge 페이지 완성 및 푸시 알림 연동 | priority: P3 | added: 2026-02-27
- [ ] [인프라] PWA 오프라인 지원 및 동기화 전략 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 진행 기능 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 단계에서 사용자 행동 분석 — 기능별 사용 빈도 확인, 미사용 기능 제거 (오프라인 진행) | priority: P3 | added: 2026-02-28

## Done

- [x] [인프라] Supabase 연동 및 Auth(로그인) 시스템 구현 | priority: P1 | added: 2026-02-27 | done: 2026-02-28
- [x] [버그] 장소 신규 추가 — API 키 설정 + Google 검색 필터 최적화 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
- [x] [버그] 사우너파 그래프 — 사용자 오인 확인, 정상 동작 | priority: P1 | added: 2026-02-28 | done: 2026-02-28
