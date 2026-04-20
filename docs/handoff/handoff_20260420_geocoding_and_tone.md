# Handoff 2026-04-20 — Geocoding 마이그레이션 + 톤/레이아웃 작업

## 완료한 작업 (이번 세션)

### 1. Geocoding API 마이그레이션 (대규모 리팩토링)
- **문제:** Google Text Search `formatted_address` 파싱으로 country_code 추출 → 일본 장소가 reversed 포맷(`"Japan, 〒..."`)일 때 'KR' 오염 → 네이버 지도/타투 모달 오동작
- **해결:** Google Geocoding API reverse(월 10K 무료) + `address_components` 구조화 데이터 사용
- **DB 변경:**
  - `supabase/022_place_city.sql` — `places.city TEXT` 컬럼 추가
- **코드:**
  - `src/lib/geo/address-builder.ts` — address_components → clean address 재조립
  - `src/lib/geo/reverse-geocode.ts` — Geocoding API wrapper
  - `src/app/api/places/reverse-geocode/route.ts` — API endpoint
  - `src/constants/country-names.ts` — ISO → display name 매핑
  - `src/app/place/add/page.tsx` — 선택 시 reverse-geocode 자동 호출
  - `src/lib/places-service.ts` — toPlace에서 short_address 분기 (Naver: "서울 강남구" / Google·Manual: "Tokyo, Japan")
  - 기존 `extractCountryCode`, 해외 `generateShortAddress` 제거
- **기존 데이터 교정:** 246/248 row 업데이트 (country_code/city/address_original)
  - 2건 lat/lng 누락 → forward Geocoding으로 보강 (아라고나이트 고온천, 스포테라)
  - 스크립트: `scripts/migrate-existing-addresses.ts`, `scripts/fix-missing-latlng.ts`
- **핵심 알고리즘 포인트:**
  - JP 블록 번지 복원: `premise + sublocality_level_3/4/5`를 `-`로 결합 → "18-9", "3-chōme-13-12"
  - POI 필터: placeName 매칭 + "숫자 0개 AND 길이 4자↑" (サウナアルプス, Sky Building 등 제거)
  - sublocality 순회는 명시적 level_1/level_2/neighborhood만 (base 'sublocality' 제외 — level_3/4/5와 types 충돌 방지)
  - Admin2 (county/district) 생략 — 일관성 우선
  - postal code 제거, subpremise (층/호) 제거
- **백업 테이블 (사후 정리 필요):**
  ```sql
  DROP TABLE IF EXISTS places_backup_20260420;
  DROP TABLE IF EXISTS place_sources_backup_20260420;
  ```
  → 배포 안정 확인 후 1~2일 뒤 유저가 Supabase에서 직접 DROP
- **플랜 문서:** `docs/plans/archive/PLAN_geocoding_migration.md`

### 2. 컬러 hex → hue 마이그레이션 (이전 세션 마무리)
- `lists.cover_color` (hex) → `cover_hue` (int) 완전 전환, `users.profile_color` 동일
- OKLCH 기반 perceptual-uniform 톤 (`LIST_COVER_TONE = {l:0.70, c:0.15}`)
- 프로필 파스텔 톤 조정 (`COVER_TONE = {s:38, l:82}`)
- `hexToHue`, `hexToOklchHue` 역산 함수 제거
- 플랜: `docs/plans/archive/PLAN_color_hue_migration.md`

### 3. SA-리스트 상세 J 레이아웃
- Visitor 구독 outline pill → 커버 내부 하단
- Owner 공개 pill → 네비 우상단
- 크리에이터 + 소셜 + 통계 한 줄 통합
- 소셜 링크 한글화 (인스타그램/네이버 블로그/스레드)

### 4. 백로그 small wins
- Google 지도 URL dead ternary 제거 (`explore/[id]/page.tsx`)
- 탐색 검색 0건 UI에 "직접 장소 추가" CTA 추가 (`explore/page.tsx`)

---

## 기억해야 할 중요 사항

### Google APIs 활성화 상태
현재 GCP 프로젝트에 enabled된 API (2026-04-20 기준 — 기능 추가 시 이 범위 내 우선 검토):

Address Validation · Distance Matrix · Geocoding · Geolocation · Map Tiles · Maps Embed · Maps Grounding Lite · Maps JavaScript · Maps Platform Datasets · Maps SDK (Android/iOS) · Maps Static · Places Aggregate · Places API · Places API (New) · Places UI Kit · Roads · Time Zone

Geocoding 무료 한도: **10K/월** (월 ~100회 사용 예상 → 100× 여유)

### DB 스키마 최신 상태
- `places`: country_code, **city (신규)**, latitude, longitude, facility_type, bath_policy, facilities, is_24h
- `place_sources`: source(naver/google/manual), name_original, address_original, external_id, latitude, longitude
- `lists`: **cover_hue (int, 0~360)**, cover_emoji, visibility, is_featured, tags, creator_links
- `users`: **profile_hue (int)**, profile_emoji
- 최신 마이그레이션: `022_place_city.sql`

### short_address 로직 (place에서 렌더)
- `primary source === 'naver'` → 기존 `generateShortAddress(address, 'KR')` → "서울 강남구"
- 그 외 (Google/Manual) → `${city}, ${COUNTRY_NAMES[cc]}` → "Tokyo, Japan"
- utils.ts `generateShortAddress`는 한국 주소(Naver) 로직만 남김

### place/add 폼에서 reverse-geocode 타이밍
- 유저가 Google 검색 결과 선택 시 `/api/places/reverse-geocode?lat=..&lng=..&name=..` 호출
- 응답의 country_code/city/address를 resolvedCountryCode/resolvedCity 상태에 저장
- 저장 시 places INSERT에 함께 전달
- Naver 결과는 resolved 없이 country_code='KR', city=null, address=네이버 원본

---

## 미해결 / 다음 세션 할 일

### 즉시 (안전 정리)
- [ ] 백업 테이블 DROP (배포 안정 1~2일 후)
- [ ] 2건 저품질 데이터 모니터링 — 아라고나이트 고온천, 스포테라 (lat/lng 보강됐지만 city=null 또는 Seogwipo)

### 백로그 (우선순위별)

**P0 (28일 이월 — 베타 블로커):**
- [콘텐츠] 큐레이션 리스트 시드 5~8개 생성 (어드민 is_featured 리스트, 유저 직접 작업)
- [인프라] Sentry 소스맵 — Vercel에 SENTRY_AUTH_TOKEN/ORG/PROJECT 3개 env 설정 (유저 직접, 15분)

**P1 이월:**
- [기능] 사우너 숏로그 건식/습식 토글 (플랜 있음: `docs/plans/PLAN_wet_sauna_quick_log.md`, 3~4시간)
- [UX] 사우나 ID 카드/페이지 (13일 이월, 설계 필요)
- [기능] SA-LIST 리워드 (28일 이월, XP+칭호 4종)
- [기능] '내 주변' 거리순 정렬 (geolocation)

**P2 작은 정리:**
- [데이터] 시설 태그 잔여 4건 (유림탕/유진/주신/필례) — 유저 기여 대기, 지금 액션 불필요

### 가설 검증 상태 (VISION.md)
- **H1 (Spotify식 컬렉션)**: 기능은 활발, 검증용 시드 데이터(큐레이션 리스트) 부족 → P0 큐레이션 시드가 병목
- **H2 (3-click 숏로그)**: 검증 중, 사우너 건식/습식 토글이 다음 실험

---

## 주요 커밋 (이번 세션)

```
c046e9b fix: 백로그 small wins 2건 처리 (지도 URL + 검색 CTA)
fb36083 chore: Geocoding 마이그레이션 완료 — 플랜 archive + 백로그 반영
e0e0b0c fix: address-builder JP 블록 번지 복원 + POI 필터 강화
702bb83 feat: Google Geocoding API reverse로 구조화된 주소 획득
9f57d78 docs+migration: Geocoding 플랜 업데이트 + SQL 022 생성
71c1a32 docs: Geocoding 마이그레이션 플랜 작성
8b05639 tune: 프로필 파스텔 한 톤 연하게 · 사-리스트 살짝 선명하게
4c2d582 feat: 커버 컬러피커 OKLCH 전환
747881a refactor: 커버/프로필 색상 저장을 hex → hue 기반으로 전환
947bd55 feat: SA-리스트 상세 J 레이아웃 + 메모 수정 버튼 중복 제거
```

---

## 환경변수 / 시크릿 상태
- `GOOGLE_PLACES_API_KEY` — Places + Geocoding 둘 다 활성화
- `SUPABASE_SERVICE_ROLE_KEY` — 마이그레이션 스크립트용 (`.env.local`에만)
- Vercel: Sentry env 3개 아직 미설정 (P0 백로그)

## 자주 참조하는 파일 경로
- 백로그: `docs/po/BACKLOG.md`
- 비전: `docs/po/VISION.md`
- 메모리: `/Users/stella/.claude/projects/-Users-stella-Documents-sauna-log/memory/`
- 플랜(완료): `docs/plans/archive/`
- 핸드오프(완료): `docs/handoff/archive/`
- 시드 스크립트: `scripts/bulk-register-places.ts`
