# PLAN — 카톡 DB Sync #18 (MATCHED 검수·enrich → NEW 등록)

작성: 2026-06-01 / 브랜치: preview
선행: #14b 통합 CSV(144행), #16 크로스체크(MATCHED 39·AMBIGUOUS 16확정·NEW 64)
입력 문서: `katalk-db-crosscheck-20260601.md`, `katalk-ambig-detail-20260601.md`, `katalk-extract-20260519-flat.csv`, `overseas-facilities-review.md`
API: Google Places(New) `GOOGLE_PLACES_API_KEY` · Naver Local `NAVER_CLIENT_ID/SECRET` (둘 다 .env.local 존재)
어드민 ID: `23c431c3-9b23-4779-bb27-13472e58090a`

## 원칙 (전 단계 공통)
- **모든 DB 쓰기는 dry-run → 유저 승인 → apply.** (메모리 피드백)
- **facility_type 자동수정 금지** — enum 의미(special=불가마/효소)+Google types+Naver category 교차검증해 후보만 제시, 결정은 유저. [[feedback-facility-type-semantics]]
- 기존 어드민 로그 덮어쓰기 금지. `places.facilities`는 합집합 추가만.
- NEW 등록은 5건 단위 배치(execution-bias 규칙). 배치마다 유저 확인.
- region 컬럼은 발화자 거주지 noise → 위치 판단에 사용 금지.

---

## PHASE 0 — 준비/스냅샷 (read-only)
- 0.1 **전 places(255) 스냅샷 백업**(places 전 컬럼 + place_sources). 롤백/감사 기준선. 산출: `qa/db-snapshot-all-20260601.json`
- 0.2 MATCHED 39 facility → 고유 place_id 목록 dedupe(오라카이 4행→1 등). enrich 대상 태깅용. 산출: `qa/matched-place-ids.json`
- 0.3 어드민 ID·env 키(Google/Naver) 로드 검증(연결 probe)

## PHASE 1 — DB 전수 검수 (QA, read-only) ⭐ 유저 핵심 요구
**대상: DB 전 places 255개** (MATCHED 39는 부분집합 → 함께 검수, enrich 대상으로 별도 태깅).
각 place에 대해 DB값 ↔ Google ↔ Naver 비교.
- 1.1 DB 현재값 추출: `facility_type, country_code, city, place_sources.name_original, address_original, latitude, longitude, coordinate_source, source, external_id`
- 1.2 Google Places API New `searchText`(textQuery=name+주소/지역, languageCode=ko): `displayName, formattedAddress, types, location, addressComponents(country)`. 해외 place는 regionCode 생략/자동.
- 1.3 Naver Local Search(`/v1/search/local.json`, query=name): `title, category, address, roadAddress, mapx/mapy`. (Naver=KR 한정 → 해외는 Google만)
- 1.4 비교·플래그 룰:
  - 🔴 `country_code` 불일치 (DB≠Google country) — manual=KR 강제저장 버그 패턴 재점검
  - 🔴 주소 공란 또는 DB주소 ↔ Google/Naver 도로명 불일치
  - 🔴 place_sources 이름 누락/깨짐
  - 🟡 좌표(lat/lng) 누락 또는 Google location과 >500m 차이
  - 🟡 `facility_type` 의심: Google types/Naver category와 어긋남(예: DB hotel-spa인데 category=대중목욕탕) → **후보 제시만**
  - 🟡 `coordinate_source`/`external_id`/`city` 누락
- 1.5 배치 처리: 255건을 ~50건씩 5배치, API 결과 캐시(`qa/api-cache.json`)로 재호출 방지. 검색 0건/동명이의는 '확인필요' 리스트로 분리(스킵 금지).
- 1.6 산출물:
  - `katalk-db-full-audit-20260601.md` — **255건 전수** DB/Google/Naver 3열 비교 + 플래그 요약(🔴/🟡 카운트)
  - `qa/audit-flags.json` — 교정 후보 구조화(자동 apply 입력용, 단 facility_type은 유저 결정 후)
  - **← Decision Gate ①**: 🔴/🟡 플래그 중 어떤 항목을 Phase2에서 교정할지, facility_type 후보 승인
- 스크립트: `scripts/katalk-db-full-audit.mjs` (read-only) — `audit-manual-places.ts` 패턴 확장
- 이미 확정된 교정 포함: 프리마스파 hotel-spa→**public-bath**, 부산 프리마는 MATCHED서 제외(NEW로).

## PHASE 2 — 메타 교정 (DB write: places/place_sources) — 전수 검수 결과 반영
- 2.1 유저가 Gate①에서 승인한 교정만 반영(MATCHED 39 한정 아님, **255 전체 중 승인분**): facility_type / country_code / 누락 주소·좌표·external_id·city 보강
- 2.2 dry-run 출력(변경 전후 diff 표, place별) → **Decision Gate ② (apply 승인)**
- 2.3 apply: `places`/`place_sources` UPDATE. 어드민 로그 아님(순수 메타 교정). 변경분 로그 파일 기록.
- 스크립트: `scripts/katalk-meta-fix.mjs --dry-run | --apply`

## PHASE 3 — MATCHED enrich (어드민 logs/deep_logs 생성, DB write)
CSV temps → 어드민 로그. 매핑 규칙(핸드오프 §2 "DB 반영 구현 원칙"):
- 3.1 컬럼 매핑: `hot_bath_temp←hot, cold_bath_temp←cold(일반), sauna_temp←dry, steam_sauna_temp←steam`; deep_logs: `very_hot_bath_temp←vh, cost←entrance, scrub_cost←scrub, memo←특이사항`. 급냉탕은 `deep_logs.has_ice_bath+ice_bath_temp`.
- 3.2 그룹C 특수 적용:
  - 강변스파랜드 **남/여 2 logs 분리** (남: cold=null/ice_bath, 여: cold=15)
  - 더 리버사이드 메디스파 **3시점 logs**(1월·3월·5월) 각 deep_logs 동반
  - 레몬사우나 냉탕 **23 단일**
  - 설해원: rec5267 로그는 설해원에, 면역공방(개인파동욕실)=special 정보는 memo 보존
- 3.3 facilities 태그 합집합(추가만). 카톡 태그→DB 태그 정규화.
- 3.4 dry-run(생성될 logs/deep_logs 목록) → **Decision Gate ③** → apply
- 스크립트: 기존 `scripts/enrich-places-from-katalk.ts` 확장 또는 신규 `katalk-enrich.mjs --dry-run|--apply`

## PHASE 4 — NEW 64건 신규 등록 (DB write: places+place_sources+logs)
- 4.1 NEW 64 dedupe + canonical_name 확정 + 부산 프리마(호텔 프리마 부산) 합류 → 최종 목록
- 4.2 각 시설 Google/Naver 검색 → 정식명·주소·좌표·country·types/category. 산출 비교표: `katalk-new-register-20260601.md`
- 4.3 facility_type 결정(불가마/효소→special, 센토→public-bath 등) → **Decision Gate ④** (5건씩 묶어 제시)
- 4.4 좌표 못 찾는 시설·검색 0건 시설은 별도 '확인필요' 리스트(스킵 금지, 유저 보고)
- 4.5 배치 등록(5건 단위): place + place_sources(name_original/address_original/source/external_id/좌표) insert → 어드민 logs/deep_logs. dry-run→apply per 배치
- 스크립트: `scripts/bulk-register-places.ts` 패턴 재사용 + `katalk-new-register.mjs`

## PHASE 5 — 검증/마감
- 5.1 등록 후 카운트 대조: places 255→예상치, 신규 logs/deep_logs 수
- 5.2 spot check 10건(어드민 통계 화면 또는 쿼리)
- 5.3 프로덕션(Vercel) 반영 영향 확인(어드민 로그는 유저 노출 안 됨)
- 5.4 핸드오프 #18 완료 처리, 플랜 archive 이동

---

## Decision Gates 요약
| Gate | 시점 | 유저 결정 |
|---|---|---|
| ① | Phase1 후 | QA 플래그 중 어떤 교정 반영할지(특히 facility_type) |
| ② | Phase2 apply 전 | 메타 교정 dry-run 승인 |
| ③ | Phase3 apply 전 | enrich 로그 생성 dry-run 승인 |
| ④ | Phase4 등록 전 | NEW facility_type + 배치별 등록 승인 |

## 리스크/주의
- Google/Naver 검색 동명이의(레몬사우나 등) → 주소·좌표로 disambiguate, 애매하면 유저 확인(오매칭 재발 방지)
- API 쿼터/비용: **255(전수)+64(NEW)≈319건 검색**. Google searchText 과금 — ~50건 배치+`api-cache.json` 캐시로 재호출 방지. Naver는 일일 25,000건 무료라 여유.
- Naver Local은 KR만 → country 판정은 Google addressComponents 기준
- 좌표 없는 기존 place 다수 가능 → 보강은 Gate①에서 선택
