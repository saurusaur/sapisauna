# 핸드오프: 카톡 DB Sync Phase 4b — 해외 23건 등록 (fresh 세션용)

작성: 2026-06-04 / 브랜치: preview
선행 완료: Phase 4 국내 40건 등록 + enrich + 데이터 정리 (이 세션, 전부 DB 반영·검증 완료)

---

## 📌 다음 세션 첫 작업 = 해외 사우나 23건 등록 (Phase 4b)

### ⭐ 시작 전 반드시 읽을 것 (READ FIRST)
1. **`docs/research/katalk-20260519/README.md`** — **검증 시 어떤 원본 파일을 쓸지 + 신규 등록 컨벤션의 SSOT.**
   - "📂 데이터 계보" : flat.csv는 가공본, 원문은 chunk MD, 노션은 `notion-review-db-analysis.md`, 매칭은 `MASTER_place_matching_reference.md`
   - "🧱 신규 place 등록 컨벤션" 섹션 : 이름·좌표·external_id·city·온도/tribe 규칙 **전부 여기에 통합돼 있음** (별도 문서 안 만듦)
   - **이 README 기준으로 카톡·노션 DB 검증/등록을 진행한다** (유저 지시)
2. **`docs/research/katalk-20260519/overseas-facilities-review.md`** — 해외 23건 입력 데이터 (영문명·주소·place_id·types·facility_type·카톡출처·매칭신뢰도). 전건 HIGH 20/MEDIUM 3, place_id 확보완료.
3. 시설별 결정 기록: `docs/research/katalk-20260519/katalk-new-register-decisions-20260603.md`

### 해외 등록 규칙 (README 컨벤션의 해외 분기)
- **해외 = Google 정(正)**: `name_original`=Google displayName(en), 좌표=Google location, `coordinate_source='google'`.
- `place_sources`: `source='google'`, `external_id`=Google **place_id**(ChIJ...). (국내는 naver+mapx_mapy였음 — 해외는 google+place_id)
- `country_code`: JP(약20)/US/HK/DE 등 (overseas review에 국가별 표기). KR 아님.
- **city**: Google en locality. **도쿄 23특별구 → 'Tokyo' 롤업**(9곳, `src/lib/geo/address-builder.ts` resolveAddress 룰). 그 외 영문 locality.
- `facility_type`: overseas-review에서 이미 확정 (AIRE/Vabali=hotel-premium, Elamus=resort-spa, 등). enum 7종 CHECK.
- 온도 데이터: 카톡 chunk MD/flat엔 해외 6건 제외돼 있음 → 해외 온도는 overseas-review + 원본 카톡(chunk) 원문에서 확인. 라이브 CHECK 범위검증 필수.
- MEDIUM 3건(세이류온천·코코로노·홍콩리젠트)은 등록 전 유저 더블체크.

### 진행 순서 (국내 40건과 동일 패턴)
1. overseas-review 23건 → 등록 입력셋 구성(이름·주소·좌표·place_id·country·city·facility_type·온도·facilities·memo)
2. **기존 DB 프록시미티 + external_id(place_id) 중복가드** (이미 등록된 해외 있는지 — 도쿄 9곳은 city보강 때 일부 존재 가능, 크로스체크 필요)
3. **dry-run → 유저 확인 → 5건 배치 apply**
4. 검증: places 카운트, place_id 중복 0, 온도 범위위반 0, spot-check

### 재사용 스크립트
- **`scripts/katalk-new-register.mjs`** — 국내 등록 스크립트(dry-run/--apply/--only=N-M, external_id 중복가드+프록시미티+온도 vt 범위검증). **해외용으로 입력소스(meta)·source='google'·external_id=place_id 분기만 추가하면 재사용 가능.**
- `scripts/katalk-new-meta-final.mjs`(국내 메타생성, 참고) / `katalk-fix-corrupt-facilities.mjs`(facilities 토큰 수리) / `katalk-deeplog-memo-scan.mjs`(memo 손상 스캔)
- env: `.env.local` (GOOGLE_PLACES_API_KEY, SUPABASE_URL/SERVICE_ROLE_KEY). 스크립트 패턴: `NODE_TLS_REJECT_UNAUTHORIZED='0'` + .env 자체파싱.

---

## ✅ 이 세션에서 완료된 것 (DB 반영·검증 완료, 재작업 불필요)

| # | 작업 | 결과 |
|---|---|---|
| 1 | **국내 NEW 40건 등록** | places 256→**296**(+40), place_sources(naver,external_id=mapx_mapy)+40, 어드민 logs 39+deep_logs. 온도위반0·중복0 |
| 2 | **enrich 누락분** | NULL보강6(금진·청춘·대영·더케이·도미인x2)·신규로그4(하남용산·리버사우나·덕구5/19·소노캄5/19)·facilities(주심유황 open-air-bath)·memo(스파레이 효소) |
| 3 | **깨진 facilities 토큰 42곳** 수정 | 앞에 `"` 붙은 토큰 strip+dedupe (`katalk-fix-corrupt-facilities.mjs`) |
| 4 | **jjim Phase 5** | 숲속한방랜드 sauna→jjim105 전환 / 신북온천·아쿠아하남·우이령 시설보강(건식 확인) |
| 5 | **deep_log memo 손상 7건** | facility-토큰 memo → 누락4토큰 facilities 복구 후 memo null (`katalk-deeplog-memo-scan.mjs`) |

### 핵심 컨벤션 (라이브 검증됨, README §신규등록컨벤션에 수록)
- **국내 이름·좌표 = Naver 지도명 verbatim 정**(추측·줄임·오타 금지: 스파**앳**홈/팔공산심천랜드/르네상스 휘트니스). Google은 city·is_24h 백필.
- **external_id**: naver=`mapx_mapy` / google=place_id. **스키마 확인은 라이브 DB**(마이그레이션 파일에 scrub_cost·primary_sauna_kind 등 누락).
- **온도 라이브 CHECK**: cold0-30·hot30-46·sauna(건식)50-130·steam(습식)40-75·very_hot(열탕)38-46·**jjim(한증막/숯가마/불가마)70-130**·ice0-20. 한증막류=jjim_temp+tribe='jimi'. 컬럼: steam=logs / very_hot·ice·scrub_cost·scrub_types=deep_logs.
- **city**: 광역시=영문(Seoul/Busan/Gwangju…), 도 시/군=영문 무접미사(Paju/Gangneung/Yesan/Jeju/Seogwipo…), **경기 광주시=Gwangju-si**.
- **facility 토큰맵·기본태그**: special·private 제외 국내=기본 온탕/열탕/냉탕. 호텔=기본 주차. 국내 전부 tattoo-friendly. 온천명 시설=memo에 "온천"(향후 온천리스트). (상세 decisions doc + register 스크립트 OV)

---

## 🔭 남은 것 (Phase 4b 외)
- (저우선) 일부 enrich 로그 tribe가 bather인데 dry-sauna 보유 — 경미한 불일치, 통계영향 적음
- jjim 미파일: 더 없음(숲속한방랜드 1건이 유일했고 처리됨, 나머지 카톡/노션이 건식 입증)

## 산출 문서 (이 세션)
- `katalk-new-meta-final-20260603.json/.md`(국내40 메타) · `katalk-new-register-dryrun-20260603.md` · `katalk-new-register-decisions-20260603.md`(시설별 결정 SSOT)
- `katalk-enrich-missed-dryrun-20260604.md` · `katalk-jjim-phase5-20260604.md` · `katalk-deeplog-memo-scan-20260604.md`
