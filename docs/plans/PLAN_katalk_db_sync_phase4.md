# PLAN: 카톡 DB Sync Phase 4 — NEW 신규 시설 등록

작성: 2026-06-02 / 브랜치: preview
선행: `handoff_20260529_katalk_db_sync_v2.md` §12 (Phase 1~3·§11 전부 완료)
목표: 카톡 추출 CSV의 **DB 미존재 신규 시설**을 `places` + `place_sources` + 어드민 `logs`/`deep_logs`로 등록.
원칙: **속도보다 무오류·퀄리티.** 모든 쓰기는 dry-run → 유저 확인 → apply, 5건 배치.

---

## 0. 현재 상태 스냅샷 (검증된 사실)

| 항목 | 값 | 근거 |
|---|---|---|
| 마이그레이션 적용 | 026·027·028 모두 적용됨 | handoff §11 |
| 현재 places 추정 | ~254곳 (028이 트리니티 1건 삭제) | handoff §12 |
| facility_type CHECK | 7종: small-bath/public-bath/hotel-premium/resort-spa/private-sauna/special/gym-sauna | `026` L17-18 |
| NEW 후보(과거) | 63 + 호텔프리마부산 = 64 (DB 변경 전 기준) | crosscheck §70 |
| 해외 | 23건, 전건 HIGH·place_id 확정 | overseas-facilities-review.md |
| DDL 필요 여부 | **없음** — 데이터 INSERT만 → supabase-js 서비스롤 직접 가능 | handoff §12 |

### ⚠️ 재확정이 반드시 필요한 이유 (오류 방지 핵심)
028이 이미 등록한 시설들이 과거 NEW 표에 그대로 남아 있어 **중복 등록 위험**:
- `도미인 강남`(rec3890) → DB에 **도미인 서울 강남** 이미 존재(028 L71)
- `도미인 인사동`(rec3923) → DB에 **도미인 EXPRESS 서울 인사동** 이미 존재(028 L60)
- `장소명 미기재(냉수욕)`(rec5504) → 그룹C에서 **강변스파랜드 남탕**으로 해소·enrich 완료 → NEW 아님
→ **크로스체크 재실행으로 진짜 NEW만 추려야 함.** 과거 64건 그대로 등록 금지.

---

## 1. 스키마 계약 (등록 시 반드시 지킬 제약)

### places (INSERT)
- `facility_type` NOT NULL, CHECK 7종 (026)
- `bath_policy` 기본 'gender-bath' (009) — male-only/female-only/mixed 명확 시만 변경
- `country_code` NOT NULL 기본 'KR' (해외는 JP/US/HK/DE 등)
- `city` TEXT (022) — Google en locality. KR 광역시=admin1, **도쿄 23특별구→'Tokyo' 롤업**(address-builder 룰)
- `latitude` DECIMAL(10,8) / `longitude` DECIMAL(11,8)
- `coordinate_source` CHECK ('naver','google','manual')
- `status` 기본 'active', `facilities` TEXT[] (CSV 태그 → DB 태그 정규화)

### place_sources (INSERT)
- `name_original` NOT NULL (정식명), `address_original`, `source`, `external_id`(place_id)
- **UNIQUE(source, external_id)** → 재실행 시 충돌 → 사전 select로 가드

### logs / deep_logs (어드민 INSERT)
- 어드민 ID: `23c431c3-9b23-4779-bb27-13472e58090a`
- 온도 INT + BETWEEN: cold 0-30 / hot 30-46 / sauna(건식) 50-130 / steam(습식) 40-75 / very_hot(deep,열탕) 38-46
- **소수→반올림, 범위밖→해당 필드 omit** (`katalk-enrich-apply.mjs` vt() 그대로)
- 일반냉탕→logs.cold / 급냉→deep.has_ice_bath+ice_bath_temp / 열탕→deep.very_hot_bath_temp

### 트리거 주의
- `create_default_list`만 동작. **places.facilities 합집합 자동 안 됨** → NEW는 신규라 합집합 불필요(직접 set).

---

## 2. 진행 단계

### Step 1 — NEW 목록 재확정 (read-only)
1. `node scripts/katalk-db-crosscheck.mjs` 재실행 (현 DB 254 기준)
2. 과거 64건과 diff → 그새 MATCHED 된 항목 제거 (도미인 2건 등)
3. 그룹C 해소분 제외: rec5504
4. **내부 중복 후보 식별** → 유저 확인 (병합/별개):
   - `스카이베이`(2734) ↔ `강릉 스카이베이`(3923) ↔ `스파디움`(8675)
   - `신라모노그램호텔사우나`(3424) ↔ `강릉 신라모노그램 레지던스 스파 파빌리온`(6126)
   - `용산 드래곤머큐어`(2983) ↔ `용산 드래곤시티`(2985)
5. 산출물: `docs/research/katalk-20260519/katalk-new-reconfirm-20260602.md` (진짜 NEW N건)

### Step 2 — 시설 정보 확보 (read-only, 신규 스크립트 `katalk-new-geocode.mjs`)
- **국내**: Naver Local Search(정식명·주소·좌표) + Google geocode(city 영문 locality)
- **해외**: overseas-facilities-review.md place_id·displayName·address 그대로 (재호출 불필요)
- 그룹A/B canonical 매핑 적용 (#파주강남24시→강남24시사우나, 웨스틴서울파르나스→웨스틴 서울 파르나스, 아늑→정식명)
- **오매칭 방지**: 좌표+주소로 disambiguate. 추론 금지 — API 명시값만, 모호하면 "검토필요" 플래그
- 산출물: `katalk-new-geocode-20260602.md` (시설별 정식명/주소/좌표/city/types/신뢰도)

### Step 3 — facility_type 결정 (유저, 5건 배치)
- 7종 규칙 제안값 + Google types 교차검증 후 유저 최종 결정
  - **special**(불가마/효소/한증막): 수락산편백원·수원효소힐링센터·원시불한증막·잠실수양불한증막 등
  - **hotel-premium**(호텔/료칸/럭셔리): 조선팰리스 강남·포시즌스·소노캄·힐튼·머큐어·풀만·네스트 등
  - **resort-spa**(메가 데이온천/워터파크): 산정호수 한화리조트 온천·쏠비치 등 (유저 확인)
  - **public-bath**: 그 외 대중탕/사우나
- **D-1 적용**: 신사 스파레이 효소찜질 = 별도 등록 X (기존 스파레이 메모에 보존)
- 한글 라벨 깨짐 주의(handoff §7) → **텍스트 질문 병행**, 옵션 라벨 한 글자 검증

### Step 4 — 등록 (신규 스크립트 `katalk-new-register.mjs`, dry-run→확인→apply, 5건 배치)
- `places` INSERT → 반환 id로 `place_sources` + 어드민 `logs`/`deep_logs` 연쇄 INSERT
- 안전장치:
  - external_id 사전 select → 중복 시 skip (재실행 안전)
  - vt() 온도 범위검증, 5/19 로그 중복가드
  - 배치당 dry-run 리포트 파일 → 유저 확인 후 `--apply`
- 호텔 프리마 부산(rec1173): hotel-premium, 청담 프리마스파와 **별개**(이름 충돌 주의)

### Step 5 — 검증 (verification.md 형식 필수)
- places 카운트: 254 → 254+N (국내) → +23 (해외)
- place_sources external_id 중복 0 / 온도 범위위반 0 / 로그 중복 0
- spot check 10건 (이름·좌표·facility_type·country_code)
- 산출물: `katalk-new-register-verify-20260602.md`

---

## 3. 결정 포인트

| # | 결정 | 결과 |
|---|---|---|
| D-A | 국내·해외 등록 트랙 | ✅ **국내 먼저 → 해외 23건 Phase 4b로 분리** (2026-06-02 유저) |
| D-B | 내부 중복 후보(스카이베이/신라모노그램/드래곤 등) | ⏳ Step 1 재확정 후 케이스별 질문 |
| D-C | 신규 시설 어드민 로그 범위 | ✅ **온도/메모 등 실데이터 있는 것만** 생성. 빈 placeholder 금지(트리니티 교훈) (2026-06-02 유저) |

> 본 플랜 = **Phase 4(국내)**. 해외 23건은 별도 **Phase 4b**로 진행(overseas-facilities-review.md, place_id 확정).

---

## 4. 재사용 자산
- 스크립트: `katalk-db-crosscheck.mjs`(매칭) / `katalk-enrich-apply.mjs`(vt·INSERT 패턴) / `katalk-city-backfill.mjs`(geocode) / `katalk-db-full-audit.mjs`(Google/Naver 호출)
- 입력: `katalk-extract-20260519-flat.csv`(144행) / `overseas-facilities-review.md`(23건) / `katalk-db-crosscheck-20260601.md`(과거 NEW 표)
- env: `.env.local` — SUPABASE_URL/SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY, NAVER_CLIENT_ID/SECRET (전부 존재 확인됨)

## 5. 안전장치 (메모리 피드백)
1. 추론 금지 — 본문/API 명시값만 2. 스킵 금지 — 모호 시 유저 보고
3. dry-run 후 apply 4. 동명이의 좌표 disambiguate (16건 오매칭 재발 방지)
5. facility_type은 enum 라벨+Google types 교차검증 (에이전트 추론값 신뢰 금지)
