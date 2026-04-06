# 세션 요약 — 2026-03-23

## 완료된 작업

### SA-LIST 기능 전체 구현
1. **DB 스키마** — lists + list_items + list_subscriptions + RLS + 트리거(default 자동생성만)
2. **서비스 레이어** — CRUD, 카운터(코드), visibility 강등(코드), N+1 RPC, 중복명 차단
3. **인스타식 저장 UX** — 컬렉션 유무 분기, SaveBottomSheet(heart 토글 + 인라인 메모 + 시트 내 토스트 + 인라인 새 리스트)
4. **저장 해제** — 기본만 → 바로 해제, 컬렉션에도 있으면 → 확인 모달 + removeFromAll
5. **리스트 생성 리뉴얼** — 이름 + 태그 + 장소 멀티선택(미니카드+메모) + 나가기 컨펌
6. **구독 시스템** — 구독/해지 Undo 토스트 모든 곳에서 일관 적용
7. **코드 정리** — share.ts, use-list-actions.ts 중복 추출, fetch→refetch, onDismiss ref
8. **어드민 추천** — is_featured 플래그 + 상세 star 버튼 + 발견 탭 캐러셀
9. **네이밍** — 기본 리스트 → "MY SA-LIST", 섹션 → "SA-LIST"
10. **DB 트리거 정리** — 비즈니스 로직 코드로 이동, create_default_list만 DB 유지

### Devil's Advocate 이슈 해결
- usePlaces 전체 로드 → usePlaceSearch 서버 검색 (300ms 디바운스)
- is_public → visibility 잔여 0건 확인
- 구독 toggling guard
- 스낵바 onDismiss ref 보호
- N+1 getPlaceSaveCounts → SQL RPC
- admin/curated 타입 제거 → default/user + is_featured

## 다음 작업 필요

### 리워드 시스템 확장 (SA-LIST 관련)
- 현재 XP: short_log(20), deep_log(30), place_created(50), place_merged(20), welcome(20)
- **추가 필요**: list_created, list_shared, list_subscribed 등
- **추가 마일스톤**: 첫 리스트 생성, 리스트 10개 생성, 첫 구독자 획득 등

### 큐레이션 리스트 시드
- 어드민 계정으로 is_featured 리스트 생성 필요
- 후보 키워드 아래 정리됨

### 2026-03-24 ~ 04-06 추가 완료
- 011: DB 품질 대규모 수정 (오매핑/주소/시설유형/온도/country_code)
- 012: 신규 시설 9건 + 온도 보강 4건 + 습식 CHECK 통일
- 카톡 재추출 (2600줄), DB 교차검증, 호텔 부대시설 조사
- 큐레이션 리스트 후보 13개 테마 정리
- 리서치 문서 체계화 (RESEARCH_INDEX.md)

### 백로그 잔여 (P0)
- 비로그인 경험 + Auth 가드
- OAuth 에러 핸들링
- 에러 로깅 (Sentry)

### 다음 작업 (P1)
- 큐레이션 리스트 시드 생성 (어드민 is_featured)
- SA-LIST 리워드 구현 (XP + 마일스톤 칭호)
