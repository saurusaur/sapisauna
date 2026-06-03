# 카톡/노션 원본 데이터 — 검증 시 어떤 파일을 쓸까 (READ FIRST)

> 목적: 여러 세션/터미널이 **같은 기준으로 원본을 조회·검증**하기 위한 가이드.
> 핵심: `katalk-extract-20260519-flat.csv`는 **정제·가공된 파생본**이라 "원문 검증"엔 최적이 아니다.

---

## 📂 데이터 계보 (정확도/용도별)

| 파일 | 성격 | 용도 | 주의 |
|---|---|---|---|
| `KakaoTalk_Chat_…2026-05-19….csv` | 카톡 **원본 17,463행** (verbatim) | 절대 원문 확인 | record→행 매핑 어려움(멀티라인 메시지·헤더). 정규식/파싱 필요 |
| `katalk-extract-20260519-chunk{1..5}.md` | Phase1-3 **추출본** (발화자·날짜·신뢰도·전체 인용) | ⭐ **원문 검증 최적** (누가/언제/정확히 뭐라고) | record 번호로 조회. §C(명시 온도/시설), §D(긴 리뷰) |
| `katalk-extract-20260519-flat.csv` | **정제 CSV** (온도 컬럼화·canonical명) | 정제된 온도·시설·정식명 매핑 | ⚠️ 아래 "flat.csv 주의" 참고 |
| `../notion-review-db-analysis.md` | **노션 리뷰 DB** 160블록 (유형·주소·탕·사우나·온도·한줄평) | 노션 출처 시설 원본 (온도·시설) | `#### 시설명` 블록 단위. 다중값("건식 58, 95")·범위("50~66") 표기 있음 |
| `../MASTER_place_matching_reference.md` | **매칭 마스터** (DB정식명↔place_id↔주소↔카톡표기↔노션표기) | ⭐ 원본명 ↔ DB 정식명 빠른 조회 | 라이브 DB 반영. 재생성: `scripts/katalk-master-reference.mjs` |
| `overseas-facilities-review.md` | 해외 23곳 (영문명·place_id·facility_type, 검증완료) | 해외 원문/등록정보 | flat.csv엔 해외 없음(여기 별도) |

---

## ✅ "어떤 걸 쓸까" 빠른 결정

- **"이 시설에 대해 누가 정확히 뭐라고 했나"(원문 발화 검증)** → `chunk{1..5}.md` (record로 조회). 부족하면 원본 카톡 CSV.
- **정제된 온도/시설 태그/canonical 정식명** → `flat.csv` (단 가공값임을 인지).
- **노션 리뷰 출처 시설의 온도/탕/사우나** → `notion-review-db-analysis.md`.
- **원본 표기 ↔ DB 정식명(Naver/Google) ↔ place_id** → `MASTER_place_matching_reference.md`.
- **해외 시설** → `overseas-facilities-review.md`.

---

## ⚠️ flat.csv 주의 (가공본임 — 원문 아님)

1. **온도 컬럼 = 교정된 가공값**. chunk 추출 시 "건식↔습식 / 온탕↔열탕" 칸밀림이 있어 `scripts/katalk-merge-flat.mjs`의 **FIX135**로 교정함. 즉 온도 컬럼을 raw_quote와 곧이곧대로 대조하면 다를 수 있음(교정이 더 정확).
2. **`raw_quote`는 핵심 문장만 발췌**(평균 42자, 최대 92자). 전체 메시지 아니고 **발화자·날짜 없음**.
3. **국내 144행만**. 해외 6건 제외(overseas 파일 별도).
4. **`canonical_name`** = 그룹 A/B alias→정식명 매핑(명확한 것만). 빈칸이면 미매핑/신규.
5. 재생성: `node scripts/katalk-merge-flat.mjs` (FIX135 반영).

---

## 🔧 검수 스크립트 (READ-ONLY 위주)

| 스크립트 | 용도 |
|---|---|
| `scripts/katalk-master-reference.mjs` | 마스터 매칭 + 원본대조 검수 재생성 |
| `scripts/katalk-db-crosscheck.mjs` | CSV ↔ DB places 매칭 (NEW/MATCHED 판정) |
| `scripts/katalk-db-full-audit.mjs` | DB ↔ Google/Naver 전수검수 |
| `scripts/katalk-temp-sanity-audit.mjs` | 온도 범위/교차모순 + CSV 대조 |
| `scripts/katalk-name-facility-audit.mjs` | 이름·facilities ↔ Naver 대조 |
| `scripts/katalk-enrich-apply.mjs` | 온도→어드민로그 반영(--apply, 범위검증·중복가드) |

> 알려진 한계: 원본대조 파서가 노션 **다중값/범위**에서 첫값만 잡아 오탐 가능 → 큰 차이는 반드시 해당 chunk MD/노션 블록 **원본 직접 확인** 후 판단.

---

## 🧭 record 번호로 원문 찾기 (chunk MD)

각 chunk가 담당하는 record 범위:
- chunk1: ~record 2250 / chunk2: 2251–4550 / chunk3: 4551–6750 / chunk4: 6751–9100 / chunk5: 9101~
- `grep "record <N>" katalk-extract-20260519-chunk*.md` 또는 해당 chunk의 §C/§D 표에서 조회.

---

## 📝 DB 교정 이력 (이 데이터로 무엇이 DB에 반영됐나)
상세는 핸드오프 `docs/handoff/handoff_20260529_katalk_db_sync_v2.md` §11·§13 참조.
- facility_type 7종(026/027), city 보강(028), enrich 어드민로그(5/19), 개별 온도/facilities 교정(클럽케이·봉일·할매탕·아쿠아·북한산·그린 등) — **전부 라이브 DB 반영됨**.
- flat.csv의 colshift(FIX135 rec1664·1908 등)는 CSV-only일 수 있음 → DB 반영 여부는 enrich/개별교정으로 별도 확인.

---

## 🧱 신규 place 등록 컨벤션 (등록 시 항상 적용)
> ⚠️ 스키마 확인은 마이그레이션 파일 아닌 **라이브 DB**로(`select('*').limit(1)` / pg_constraint). scrub_cost·primary_sauna_kind 등 .sql에 없고 라이브에만 있음.

- **이름·좌표(국내) = Naver 지도명 우선(正), verbatim**. 이름 줄이거나 넘겨짚기 금지, 철자 그대로(스파**앳**홈/팔공산심천랜드/르네상스 휘트니스). 좌표=Naver, `coordinate_source='naver'`. Google은 city·is_24h **백필·검증만**. 해외=Google.
- **Naver top-1 맹신 금지** — 동명이의(덕산온천탕↔부천 덕산사우나)·부속엔티티(스타벅스/전기차충전소/식당)가 top으로 옴 → 지역한정+분류(목욕탕/사우나/찜질방/온천/스파/호텔)+주소 시·군 일치로 선택. 같은 곳이 지도사마다 이름 다름(Naver 덕산온천탕=Google 덕산 온천장, 신평리546).
- **external_id**: source='naver'→`mapx_mapy`(Naver 원좌표 정수) / source='google'→place_id. 국내 신규=naver+mapx_mapy(가짜 google id 금지, 매칭없으면 null).
- **city**(영문 일관): 광역시=Seoul/Busan/Gwangju(광주광역시)/Daegu/Incheon/Daejeon/Ulsan/Sejong. 도 소속 시/군=로마자 접미사 없음(Paju/Gangneung/Goseong/Namhae/Uijeongbu/Suwon/Yongin/Yesan/Yangyang/Jeonju/Jeju/Seogwipo). **경기 광주시=Gwangju-si**(광주광역시와 구분). Naver 도로명 기준(Google en은 Cheju·한글 섞여 보조만). 도쿄 23특별구→Tokyo(address-builder.ts).
- **온도/tribe**(라이브 CHECK): cold 0-30·hot 30-46·sauna(건식)50-130·steam(습식)40-75·very_hot(열탕)38-46·**jjim(한증막/숯가마/불가마)70-130**·ice(급냉)0-20. 한증막류=**jjim_temp+tribe='jimi'**(sauna_temp 아님). 컬럼: steam은 logs / very_hot·ice·scrub_cost·scrub_types는 deep_logs. 족욕=필드없음→memo, 세신가격=scrub_cost.
- 등록 전 기존 DB와 **좌표 프록시미티(<120m) 재확인**(silent 중복 방지).
