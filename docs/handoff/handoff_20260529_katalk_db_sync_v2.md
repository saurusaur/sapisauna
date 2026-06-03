# 핸드오프 v2: 카톡 크롤링 → DB 동기화 작업

작성일: 2026-05-29
이전 핸드오프: `docs/handoff/handoff_20260523_katalk_db_sync.md` (참조용. 이 v2가 최신 SSOT)
브랜치: preview
다음 세션에서 fresh로 이어가기 위한 상태 스냅샷.

---

## 0. 작업 목적

먼데이사우나 카톡 추출본(2026-05-19, 17,463행 / 11,099 records) → 웹앱 `places` 테이블에 정확한 시설 정보 반영. Phase 1~3(추출/분류) 완료, Phase 4(DB 매칭) 대기 중. 그룹 C·D 팩트체크 진행 중.

---

## 1. 진행 상태 (Task)

| # | 작업 | 상태 |
|---|---|---|
| 14 | 청크 5개 → 정규화 CSV (각 청크별) | ✅ 완료 |
| 14b | **단일 통합 CSV 생성** | ✅ **완료 (2026-06-01)** — `katalk-extract-20260519-flat.csv` 144 국내행/15열. chunk2·4 재정규화 + 해외 6 제외 + canonical_name. 노트: `katalk-flat-merge-notes-20260601.md`, 스크립트: `scripts/katalk-merge-flat.mjs` |
| 15 | CSV 마지막 수기 추가 2건 확인 처리 | ✅ 완료 |
| 16 | DB cross-check (places 매칭) | ✅ **완료 (2026-06-01)** — 119 고유시설 ↔ DB 255곳. MATCHED 40 / AMBIGUOUS 16(전건 유저 확정) / NEW 63. 리포트: `katalk-db-crosscheck-20260601.md` + `katalk-ambig-detail-20260601.md`. 스크립트: `scripts/katalk-db-crosscheck.mjs`, `katalk-ambig-detail.mjs` |
| 17 | 팩트체크 17건 유저 결정 | ✅ 완료 — 해외 23건 포함 전건 결정. MEDIUM 3건도 2026-06-01 추가검증으로 HIGH 승격 |
| 18 | enrich 실행 또는 SQL 패치 | ⏳ 대기 (그룹C 행분리·리버사이드 3시점은 이 단계에서 적용) |
| 19 | **DB 전수검수(255) + facility_type 체계 확장** | 🟡 진행중 (2026-06-02) — 아래 §11 |

---

## 11. DB 전수검수 + facility_type 확장 (2026-06-02)

플랜: `docs/plans/PLAN_katalk_db_sync_phase18.md` / 검수: `katalk-db-full-audit-20260601.md` / 재분류: `katalk-reclassify-candidates-20260601.md`

### 완료
- **전수검수(255건)**: 🔴(country/주소/이름) 0건. 🟡 city누락 114·type의심 18·좌표far 1·ext-id 9. (좌표far는 주소기반 재쿼리로 20→1 가짜양성 제거)
- **도쿄 city 원인규명**: Google이 23특별구를 locality로 반환 → city가 "Minato City" 등. 9곳 영향.
- **facility_type 체계 확장 결정**: `hotel-spa`→`hotel-premium` 리네임 + **`resort-spa` 신설**(캐주얼 메가 데이온천/워터파크). special은 불가마/효소 유지.
- **구현 완료(코드)**: `src/types/index.ts`(union), `src/constants/content.ts`(PLACE_VENUE_TYPE에 hotel-premium·resort-spa, gym-sauna는 유저 요청으로 제외).
- **마이그레이션 작성**: `supabase/026_facility_type_expand.sql` — hotel-spa→hotel-premium 리네임 + CHECK 확장 + resort-spa 10건 재태깅. **⚠️ 레포에 러너 없음 → Supabase SQL editor에서 수동 실행 필요.**
- **resort-spa 확정 10건**(026에 포함): 스플라스·클럽디오아시스·디오션·송파워터킹덤·아쿠아필드(안성/하남/고양)·테르메덴·파라다이스시티 씨메르·Therme Erding.

### 적용 완료 (2026-06-02)
- **026·027·028 마이그레이션 적용됨** (유저 실행). facility_type 7종(hotel-premium/resort-spa 신설), city 보강 123건(도쿄 9 룰 포함), 트리니티 제거.
- **아라고나이트** manual→google 업그레이드(external_id·Seogwipo·좌표).
- **온도 전수검수**(`katalk-temp-sanity-20260602.md`): 229로그 중 실오류 2건만 → **할매탕 냉10→24, 아쿠아필드 습70→45 교정 적용**. 나머지는 Notion출처(그린·우리유황) 또는 표시온도/다른시점 차이로 정상.
- **chunk1/3/5 칸밀림 7건 교정**(`katalk-merge-flat.mjs` FIX135): 건식↔습식/온탕↔열탕 밀림. 통합 CSV 재생성됨.
- **코드**: `address-builder.ts` 도쿄룰, `types/index.ts`·`content.ts` 7종 반영.

### enrich (Phase3) — ✅ APPLY 완료 (2026-06-02)
- `scripts/katalk-enrich-apply.mjs --apply` 실행. 결과: UPDATE보강 7 + INSERT 5/19로그 19 + 그룹C 3 = 5/19 어드민로그 22개 신규.
- 검증: 중복 0(강변 남/여만 2), 온도 범위위반 0, 오류 0. 전체 logs 275/deep_logs 266.
- 정책 적용: 🟢NULL보강=기존로그 UPDATE / ⚠️충돌=5/19 신규로그(기존 Notion·시드값 보존) / 그룹C=강변 남여·리버사이드 시점.
- 제외 반영: 호텔프리마부산(NEW), 할매탕·아쿠아필드(직접교정), 오라카이=5/19 종합 1로그.
- 안전장치: 온도 정수반올림+범위검증(범위밖 omit), 5/19 로그 중복방지 가드(재실행 안전).
- 추가발견 교정: 솔로레포 rec1225 "로울리80=건식"이 습식칸 오배치 → FIX135에 추가(통합CSV 재생성됨).

### ✅ §11 항목 전부 완료 (2026-06-02)
facility_type 재분류(026·027)·센텀스파랜드 resort-spa·프리마스파/Wellbe→public-bath·리조트 개별분류(더앤/석정/신북/안단테/솔샘=resort-spa, Midorinokaze/Shiriuchi/SATOYAMA=hotel-premium, 필례/척산/SKY SPA=public-bath)·해외spa 4건(AIRE/Vabali=hotel-premium, Elamus=resort-spa)·트리니티 제거·city 보강(028)·도쿄룰·enrich — **모두 적용·검증 완료**.

### 남은 것 (다음 세션)
- **Phase 4 — NEW 신규 시설 ~64건 등록** → §12 참조
- (저우선) `seed-data-unified.json`의 hotel-spa 41건 잔존 → 재시드 시 새 CHECK 위반하니 hotel-premium으로 정리 필요. 지금은 재시드 안 하므로 무해.

---

## 2. 확정된 결정사항 (다음 세션에서 그대로 적용)

### 그룹 A — Alias 병합 (모두 단일 시설)

| 카톡 표기들 | DB 정식명 |
|---|---|
| 프리마, 프리마스파, 청담프리마, 청담 프리마스파 | **프리마스파** |
| 우리유황, 우리유황온천 | **우리유황온천** |
| 더앤리조트온천, 양양 더앤온천, 현남 더앤리조트온천 | **더앤리조트 스파** (양양군 현남면) |
| 안토, 안토리조트, 안토 사우나 | **안토** (강북구 삼양로) |
| 프라임 노다지, 노다지, 광진구 프라임 노다지 | **프라임노다지사우나** |
| 쉐레이, 쉐레이 암반수, 구기동 쉐레이 | **쉐레이암반수사우나** (※ 스파레이=강남 별개, 절대 병합 금지) |

### 그룹 B — 정식명·지점

| 카톡 표기 | DB 정식명 | 비고 |
|---|---|---|
| 메디스파 / 더 리버사이드 호텔 메디 스파 등 | **더 리버사이드 호텔 더 메디스파** | |
| 인천공항 스파엣홈 | **별도 2개**: ① 스파앳홈 인천공항 제1터미널점 ② 스파앳홈 T2 인천공항 제2터미널점 | 지도상 별개 등록 |
| #파주강남24시, #파주강남24시사우나 | **강남24시사우나** (파주 소재) | '#' 표기는 검색용 태그 |
| 송해원, 송해온 | **송도해수온천 송해온** | 본문 "송해원"은 작성자 오타 |
| 아늑 시그니처 호텔 구로, 아늑 구로, 루프 사우나 | **아늑 시그니처 서울 구로 루프 사우나** | 지도 정식 명칭 |
| 웨스틴 (서울/시청) | **웨스틴 조선 서울** | record 7192 등 |
| 웨스틴 (부산/해운대) | **웨스틴 조선 부산** | record 9651, 9690 — 별개 시설 |
| 웨스틴서울 파르나스/파르나르 | **웨스틴 서울 파르나스** | record 9220, 14029, 16931, 17353 — 강남, 별개 시설 |
| 인터컨, 인터콘 | **그랜드 인터컨티넨탈 서울 파르나스** | |
| 경원대워커힐 | **경원재 바이 워커힐** | 인천 연수구 |
| 봉개 | **봉개사우나** | 제주 |
| 김녕 | **김녕용암해수사우나** | 제주시 구좌읍 |
| 혼모심 | **혼모심사우나** | 제주 |
| 해미안, 해미안 해수사우나 | **해미안녹차해수사우나** | 제주 (네이버 지도 정식) |

### 그룹 C — 오타·매칭·온도 분리 (5건 완료)

| 항목 | 결정 |
|---|---|
| record 9220 "혼탕 40" | **온탕 40** 오타로 처리 |
| record 9220 "웨스틴서울 파르나르" | **웨스틴 서울 파르나스**로 매칭 |
| **강변스파랜드 남탕** | `bath_gender=male` / `cold_bath_temp=null` (비움) / `has_ice_bath=true` / `ice_bath_temp=5` / memo: "냉탕 2개(급냉/일반), 히노끼존 내기욕 + 휴게의자 2개" (5-7도 수치는 제외) |
| **강변스파랜드 여탕** | `bath_gender=female` / `cold_bath_temp=15` / `has_ice_bath=false` (또는 null) |
| **레몬사우나 냉탕** | **23도 단일값** (record 7154 + 15816 명시 발언 기준). 냉폭포는 메모 제외 (DB facility enum에 cold_waterfall 없음) |
| **record 5176** | **우이령불가마주쉼사우나 여탕** 매칭 (chunk3 컨텍스트 연결됨) |
| **record 5293** | **스페이스본휘트니스** (광화문). 정식명 사용자 확인됨 |
| **record 5504** | **강변스파랜드 남탕**으로 매칭. 발화자 리커버리 천재가 강변스파랜드 평소 다님. 메모에 "냉탕 2개, 히노끼존 내기욕 + 휴게의자 2개" 보존 |
| **아쿠아필드 하남 / 하남 스타필드 스파** | **동일 시설 병합** (record 11905 "아쿠아필드 하남 스파" 명시) |

### 그룹 D — 정책 결정 (3건 완료, 해외만 사용자 응답 대기)

| 항목 | 결정 |
|---|---|
| **D-1 효소찜질 시설 분류** | 효소 전용 시설(수락산편백원, 수원효소힐링센터) → `facility_type='special'`. **신사 스파레이**의 효소찜질은 별도 등록 X, 스파레이의 메모에 "효소찜질 10만원 코스" 보존 |
| **D-2 가격·정책 반영 룰** | 가격/성별이 명확하면 DB 숫자/정책 필드에 반영. 운영시간은 현재 DB에서 받지 않으므로 미반영. 기타 유용한 정성 정보는 메모에 보존 |
| **D-3 리버사이드 시점별 후기** | `places` 1개 + `logs` 3개 (각 시점별 record_date 다르게) + 각 logs에 deep_logs 동반 (청결도/메모 시점별). 시설 태그는 장소 단위 합집합 |
| **D-4·D-5 해외 시설 등록** | **23개 시설 검토 파일 생성 완료**. 사용자 더블체크 응답 대기 → 그 다음 DB 등록 |
| **지도명 우선 정책** | 국내는 Naver 지도명/주소/external_id, 해외는 Google 지도명/주소/place_id 우선. 해외명은 영어 표기 |

### DB 반영 구현 원칙

1. 지도 매칭이 확정된 장소만 `places.facilities`를 업데이트한다.
2. 시설 정보는 `places.facilities`에 기존값 + 신규 태그 **합집합**으로 반영한다. 카톡 추출 태그는 DB 태그로 정규화한다.
3. 온도/가격/성별/시점별 리뷰는 어드민 `logs` + `deep_logs`를 새로 생성한다. 기존 어드민 로그를 덮어쓰지 않는다.
4. 일반 냉탕은 `logs.cold_bath_temp`, 급냉탕은 `deep_logs.has_ice_bath` + `deep_logs.ice_bath_temp`에 넣는다.
5. 건식/습식/온탕은 `logs.sauna_temp`, `logs.steam_sauna_temp`, `logs.hot_bath_temp`에 넣고, 열탕은 `deep_logs.very_hot_bath_temp`에 넣는다.
6. 가격은 `deep_logs.cost`, 명확한 성별은 `logs.bath_gender`, 시설 전체 성별 정책은 `places.bath_policy` 후보로 반영한다.
7. DB 태그에 없는 시설 표현은 임의 태그를 만들지 않고 메모에 남긴다.
8. `places.facilities`는 **추가만** 됨 (logs-service.ts:341-376 `[...current, ...newTags]`). 절대 제거 안 됨. 어드민 로그 `has_ice_bath=false` 들어가도 places의 'ice-bath' 태그 보존됨.

---

## 3. 남은 결정 포인트 (다음 세션에서 사용자 결정 필요)

### A. 해외 시설 23개 더블체크 (가장 우선)

**파일**: `docs/research/katalk-20260519/overseas-facilities-review.md`

사용자가 검토해야 할 항목:
- 23개 시설의 영문명·주소·시설정보 정확성
- 각 시설의 `facility_type` 결정 (hotel-spa / special / public-bath / private-sauna 등)
- MEDIUM 신뢰도 3건 정밀 검토 필요:
  - **세이류온천**: `源泉野天風呂 那珂川清滝` (Nakagawa Seiryu)로 매칭. 영문 displayName이 일본어로만
  - **코코로노**: `心のリゾート 海の別邸 ふる川`의 Google 표시명 `Hotel Furukawa` (Shiraoi Kojohama). 공식 사이트 별칭 확인 권장
  - **홍콩 리젠트**: Tsim Sha Tsui 위치 일치하나 Google types에 spa/sauna 없음. `facility_type=hotel-spa`로 등록 권장

### B. 그 외 잔여 (해외 끝나면)

현재 모든 그룹 A·B·C·D 결정 완료. 해외 외에 잔여 결정 포인트 없음. 단 145 rows 통합 + DB 매칭 진행 중 새로 발견될 가능성 있음.

---

## 4. 작업 파일 경로

### 입력 (원본)
- `docs/research/katalk-20260519/KakaoTalk_Chat_먼데이사우나 mondaysauna 함께만드는사우나♨️_2026-05-19-01-25-20.csv`
- 17,463 물리 라인 / 11,099 records

### 추출 결과 (Phase 1~3)
- 메인: `docs/research/katalk-20260519/katalk-extract-20260519.md`
- 청크 5개: `docs/research/katalk-20260519/katalk-extract-20260519-chunk{1..5}.md`

### 정규화 CSV (Phase 4 입력용, 청크별 — 헤더 없음)
- `katalk-chunk-1-flat.csv` — 20 rows
- `katalk-chunk-2-flat.csv` — 28 rows
- `katalk-chunk-3-flat.csv` — 37 rows
- `katalk-chunk-4-flat.csv` — 32 rows
- `katalk-chunk-5-flat.csv` — 28 rows (리버사이드·스파앳홈 보강 2건 포함)
- **합 145 rows.** 단일 통합 CSV `katalk-extract-20260519-flat.csv` 는 **아직 미생성** → 그룹 결정 완료 후 작업

CSV 컬럼 (헤더):
`name, region, dry_temp_c, steam_temp_c, cold_bath_temp_c, hot_bath_temp_c, very_hot_bath_temp_c, facilities, scrub_cost_krw, entrance_cost_krw, source_chunk, source_record, raw_quote, notes`

### 해외 시설 검토 (이번 세션 신규)
- `docs/research/katalk-20260519/overseas-facilities-review.md` — **백그라운드 에이전트가 생성 완료**
- 23개 해외 시설 (일본 + 미국 + 홍콩) — 카톡 정보 + Google Places API 영문명/주소/place_id
- 매칭 신뢰도: HIGH 20건, MEDIUM 3건, LOW 0건

### 프로토콜 & 스킬
- `docs/research/PROTOCOL_katalk_crawl_extract.md` (구) → `.agents/skills/katalk-sauna-extract/` (현)
- 메모리 참조: `reference_katalk_protocol.md`

### 관련 스크립트
- `scripts/enrich-places-from-katalk.ts` — 기존 enrich 스크립트
- `scripts/bulk-register-places.ts` — bulk place 등록 (해외 등록에 활용 가능)
- API key: `.env.local`의 `GOOGLE_PLACES_API_KEY`

---

## 5. 다음 세션 진행 순서 (권장)

1. **사용자에게 해외 시설 23개 검토 답변 받기**
   - `docs/research/katalk-20260519/overseas-facilities-review.md` 읽고 영문명/시설정보 더블체크
   - 각 시설 `facility_type` 결정 (특히 MEDIUM 3건)
   - 등록 제외할 시설이 있다면 명시

2. **145 rows 단일 통합 CSV 생성**
   - 5개 chunk-N-flat.csv를 하나로 합치기 (헤더 1줄 + 145 rows)
   - alias → 정식명 치환 (그룹 A·B의 매핑 적용)
   - 강변스파랜드/레몬사우나/리버사이드 등 그룹 C 결정사항 적용 (남탕/여탕 row 분리 등)
   - 해외 23개도 동일 CSV 또는 별도 파일에 포함

3. **#16 DB cross-check 작업**
   - `places` 테이블과 매칭:
     - HIGH 매칭: 자동 enrich 후보
     - MEDIUM/LOW: 유저 검토 (16건 오매칭 사례 재발 방지)
     - 신규: place 추가 후보
   - 산출물: `katalk-db-crosscheck-20260529.md` (또는 적절한 날짜)

4. **#18 enrich 실행 또는 SQL 패치**
   - `scripts/enrich-places-from-katalk.ts` 활용 또는 직접 SQL
   - 어드민 로그 생성 (강변스파랜드 남/여 2건, 리버사이드 3시점, 기타)
   - **dry-run 후 사용자 명시 확인 받고 apply** (메모리 피드백)

5. **검증**: 매칭 정확도 spot check 후 production 반영

---

## 6. 백그라운드 에이전트 상태 (이번 세션)

이번 세션에서 시작한 백그라운드 에이전트 **모두 완료됨**:

| 에이전트 작업 | 결과 |
|---|---|
| chunk1~5 정규화 CSV 생성 | ✅ 5개 파일 모두 저장 |
| chunk1 재처리 (1차 누락분) | ✅ 저장 완료 (20 rows) |
| 해외 시설 23개 정리 + Google API | ✅ overseas-facilities-review.md 저장 |

**다음 세션에서 백그라운드 에이전트를 fresh로 다시 돌릴 필요 없음.** 기존 산출물 그대로 사용.

만약 어떤 사유로 재실행이 필요하다면:

### 해외 시설 재실행 prompt (참고용)

```
사용자 검토용 해외 시설 리스트 파일 작성. 입력:
- 청크 5개: docs/research/katalk-20260519/katalk-extract-20260519-chunk{1..5}.md
- 원본 CSV: docs/research/katalk-20260519/KakaoTalk_Chat_*.csv

대상 시설 23개: 사우나 도쿄 / 사우나스 / 카이료유 / 나미하노유 / 쓰루가메유 / 세이류온천 / 아리마 타이코노유 / 코코로노 / 코노스미카 / 토토켄 / 이나리유 / 마에다유 / 우메유 / 하기노유 / fuua / 토토파 / 카마타 온센 / 미도리노카제 / 도쿄 긴자 91도 사우나 / 아만 도쿄 / 자누 / 메도우드 리조트(샌프란시스코) / 홍콩 리젠트

각 시설마다 Google Places API New 호출:
  source .env.local
  curl POST https://places.googleapis.com/v1/places:searchText
  X-Goog-FieldMask: places.displayName,places.formattedAddress,places.id,places.types
  body: {"textQuery":"<시설명+지역>", "regionCode":"<JP/US/HK>", "languageCode":"en"}

테이블 출력: docs/research/katalk-20260519/overseas-facilities-review.md
- 시설별: 카톡 표기, Google 영문명, 주소, place_id, types, 카톡 시설 정보, 출처 record, 매칭 신뢰도
- 추론 금지, 본문 명시값만, 매칭 신뢰도 낮으면 "검토 필요"
```

---

## 7. 한국어 입력 주의사항 (다음 세션 위해)

이번 세션 + 이전 세션 모두 AskUserQuestion 옵션 라벨에 한국어 unicode escape 사용 시 자모 변환 오류 빈발:
- "더앤" → "더앨" / "쉐레이" → "셰레이" / "아늑" → "아닭"/"아늘" / "파르나스" → "파롬"

**방지책 (다음 세션 필수):**
- AskUserQuestion 옵션 라벨에 한국어 입력 시 한 글자씩 검증
- 가능하면 텍스트 질문(메시지 본문)으로 진행 — `Write` tool로 작성한 파일은 한글 직접 입력 가능
- 옵션 라벨이 깨질 우려가 있으면 사용자 답변 전에 짧게 확인
- 이번 세션 후반에는 텍스트 질문으로 전환해 정확도 ↑

---

## 8. 핵심 안전장치 (메모리 피드백 — 잊지 말 것)

1. **추론 금지** — 본문에 없는 값은 절대 채우지 않음. 시설 분류·정식명·영업형태는 사용자 팩트체크 필수
2. **스킵 금지** — 모호한 항목 발견 시 사용자에게 보고, 임의 결정 X
3. **컨텍스트 정확도 > 추출량** — 단일 키워드 매칭만으로 결론 X, 앞뒤 5~10건 확인
4. **원문 보존** — 추출 결과에 반드시 원문 + 출처(record + 발화자 + 날짜)
5. **alias 자동 병합 금지** — 카톡 표기 그대로 1 row, 정식명 매핑은 별도 단계
6. **DB Sync dry-run** — 사용자 명시 확인 받고 apply (메모리 reference_katalk_protocol.md)

---

## 9. 진행 중 발견된 추가 사항 (DB 반영 시 참고)

- **인천공항 스파앗홈 누락 보강**: chunk5 추출에서 빠졌던 record ~11074-11086 영역. chunk5에 신규 항목 추가됨.
- **더 리버사이드 호텔 더 메디스파 5월 정성 후기 (수기 추가본)**: CSV에는 없고 사용자가 수기 제공. chunk5에 신규 항목 + 메인 G 팩트체크에 시점별 평가 차이 메모.
- **chunk1 파일 저장 누락 1회**: 1차 에이전트가 데이터만 보고하고 Write 안 함 → 재처리로 해결됨.
- **chunk5의 송해원 ≠ 송해온** 표기 차이: 본문 "송해원"은 작성자 별나라임금의 표기/오타, 정식명은 "송해온" (송도해수온천 송해온).
- **chunk1·chunk5 더 리버사이드 호텔 메디스파 시점별 데이터** 합산 필요: chunk1 (1월) + chunk4 (3월 세신) + chunk5 (5월 수기 추가).

---

## 10. 다음 세션 첫 메시지 예시 (Phase 4)

```
handoff_20260529_katalk_db_sync_v2.md §12 읽고 Phase 4(NEW 신규 등록) 이어가 줘.
1. 크로스체크 재실행해서 현재 DB 기준 NEW 목록 재확정
2. Google/Naver로 정식명·주소·좌표·facility_type 확보
3. 5건씩 배치로 dry-run→확인→등록
```

§1~9는 Phase 1~3(완료) 기록. §11=facility_type/검수/enrich 완료 기록. §12=Phase4 플랜.

---

## 12. Phase 4 — NEW 신규 시설 등록 (다음 세션 본작업)

### 목표
카톡 추출 CSV에서 **DB에 없는 신규 시설**을 `places` + `place_sources` + 어드민 `logs`/`deep_logs`로 등록.

### 입력/출처
- **NEW 후보**: `docs/research/katalk-20260519/katalk-db-crosscheck-20260601.md`의 "🆕 NEW (63건)" 표 + **호텔 프리마 부산**(rec1173) = 약 64건
- **온도/메모/canonical**: `docs/research/katalk-20260519/katalk-extract-20260519-flat.csv` (144행, 칸밀림 8건 교정 완료본)
- ⚠️ **DB가 026/027/028로 변경됨** → Phase4 시작 시 **크로스체크 재실행**(`node scripts/katalk-db-crosscheck.mjs`)해서 현재 DB(254곳) 기준 NEW 재확정. 그새 매칭되거나 등록된 게 있을 수 있음.

### 진행 순서
1. **NEW 목록 재확정**: 크로스체크 재실행 → 진짜 신규만 추림 (MATCHED/AMBIGUOUS는 이미 처리됨)
2. **각 시설 정보 확보**: Google Places(New) `searchText` + Naver Local Search → 정식명·주소·좌표(location)·country·types/category. (스크립트 패턴: `scripts/katalk-city-backfill.mjs`의 geocode, `katalk-db-full-audit.mjs`의 google/naver 호출)
3. **facility_type 결정** (유저, 5건씩 배치): 7종 체계. 동명이의 주의(주소·좌표로 disambiguate, 16건 오매칭 재발 방지)
4. **등록 (dry-run→확인→apply, 5건 배치)**:
   - `places`: facility_type, bath_policy, country_code, city, latitude, longitude, coordinate_source='google'(또는 naver)
   - `place_sources`: name_original(정식명), address_original, source, external_id(place_id)
   - 어드민 `logs`/`deep_logs`: CSV 온도/메모 (enrich와 동일 패턴, 온도 정수반올림+범위검증+중복가드)
5. **검증**: places 카운트(254→예상), spot check 10건

### 핵심 레퍼런스 (Phase4에서 그대로 적용)
- **facility_type 7종**: small-bath / public-bath / hotel-premium / resort-spa / private-sauna / special / gym-sauna
  - 규칙: **럭셔리·프리미엄=hotel-premium**(호텔·료칸·설해원·오레브·AIRE·Vabali), **캐주얼 메가 데이온천·워터파크=resort-spa**(아쿠아필드·테르메·워터파크·온천리조트), **불가마/효소/한증막=special**, 그 외 대중=public-bath. (메모리 `feedback_facility_type_semantics`)
  - 등록 UI 옵션은 `content.ts` PLACE_VENUE_TYPE 6종(gym-sauna 제외, 유저 요청)
- **city**: Google geocode 영문 locality. KR 광역시(서울/부산 등)는 locality 없어 admin1 사용, **도쿄 23특별구는 'Tokyo'로 롤업**(`address-builder.ts` resolveAddress 룰 이미 반영). KR 광역시 영문정규화 맵 = `katalk-city-backfill.mjs` KR_METRO.
- **온도 제약** (INT + BETWEEN): cold 0-30, hot 30-46, sauna(건식) 50-130, steam(습식) 40-75, very_hot(deep, 열탕) 38-46. **소수→반올림, 범위밖→해당 필드 omit**. (`katalk-enrich-apply.mjs` vt() 참고)
- **API 키**: GOOGLE_PLACES_API_KEY, NAVER_CLIENT_ID/SECRET (`.env.local`)
- **어드민 ID**: 23c431c3-9b23-4779-bb27-13472e58090a
- **마이그레이션 적용**: 레포에 러너 없음 → SQL은 Supabase SQL Editor 수동 실행. **데이터 INSERT/UPDATE는 supabase-js 서비스롤로 직접 가능**(DDL만 SQL Editor 필요).
- **DB 트리거**: create_default_list만. 카운터/visibility는 코드 → 직접 INSERT 시 places.facilities 태그 합집합은 자동 안 됨(필요시 별도 처리).

### Phase4 특수 케이스
- **호텔 프리마 부산** (rec1173, 부산 해운대, 건식100): 럭셔리 호텔 → facility_type=hotel-premium. 청담 프리마스파(public-bath)와 **별개 시설**. 이름 "프리마" 충돌 주의(자동매처가 프리마스파로 오매칭했었음).
- **해외 23건** (`overseas-facilities-review.md`, 전건 HIGH 검증완료, facility_type·place_id 확정): **별도 트랙**. country_code JP(20)/US/HK 등, Google place_id 이미 확보. Phase4에 같이 등록할지 or Phase4b로 분리할지 유저 결정 필요. (도쿄 9곳은 city='Tokyo' 룰 적용)
- **region 컬럼 무시**: CSV region은 발화자 거주지 noise. 위치는 Google/Naver 기준.
- **다지점 이미 정리됨**: 레몬(광진 1곳)·군인공제회(1곳)은 NEW 아님(MATCHED). NEW엔 진짜 신규만.

### 산출 스크립트 (Phase 1~3, 재사용 가능)
- `katalk-merge-flat.mjs` (통합 CSV 생성+칸밀림 FIX135) / `katalk-db-crosscheck.mjs` (매칭) / `katalk-db-full-audit.mjs` (Google/Naver 검수) / `katalk-city-backfill.mjs` (지오코딩) / `katalk-enrich-apply.mjs` (로그 INSERT/UPDATE 패턴) / `katalk-temp-sanity-audit.mjs` (온도 검수)
- 마이그레이션: `supabase/026`(facility_type 확장) `027`(재분류) `028`(트리니티+city) — **모두 적용됨**

---

## 13. DB 품질 검수 + 교정 (2026-06-03)

기등록 데이터 정합성 검수. **마스터 매칭 파일 신설** + 카톡/노션 원본 대조.

### 신설 재사용 파일 (향후 검수용)
- **`docs/research/MASTER_place_matching_reference.md`** — place별 [DB 정식명(Naver/Google 등록명) ↔ place_id ↔ 주소 ↔ type ↔ 카톡 표기 ↔ 노션 표기]. 255곳. 원본명↔정식명 빠른 조회용. 생성: `scripts/katalk-master-reference.mjs`(재생성 가능, 라이브 DB 반영).
- `docs/research/katalk-20260519/katalk-source-crossaudit-20260603.md` — DB온도/facilities ↔ 카톡 ↔ 노션 대조 플래그.
- 원본: 카톡=`katalk-extract-20260519-flat.csv`, 노션=`docs/research/notion-review-db-analysis.md`(160블록 파싱), 이름변경=`docs/research/archive/notion-vs-csv-name-comparison-20260324.md`.

### 교정 적용 (전부 원본 확인 후 유저 승인)
- **온도** (노션/카톡/블로그 원본 대조 후 교정):
  - 클럽케이서울: 건84→95·습68→56·열null→42 (노션 출처값, 시드 전사오류)
  - 봉일스파랜드: 건99→95·습54→69 (노션, 건식 2개 58/95 중 95)
  - 할매탕: 냉10→24 (카톡 원문 "냉탕은 24도")
  - 아쿠아필드 하남: 습70→45 (비정상 고온)
  - 북한산온천 비젠: 온탕30·열탕40 추가 (블로그 adolfkim.tistory/398·makeiteasy-trends/944)
- **facilities/이름**:
  - 그린대중목욕탕: 이름(그린사우나→그린대중목욕탕)·주소(경안상가 지하1층)·jjimjilbang 제거 (Naver 옛 찜질방 리스팅으로 오등록됐던 것)
  - 북한산온천 비젠: jjimjilbang 제거 + parking·hot-bath·cold-bath·dry-sauna 추가
  - 아라고나이트: manual→google 업그레이드(앞 세션)

### 검증만 (변경 없음)
- **C 이름변경 6건 전부 DB 정상**: 호수사우나·일죽목욕탕·초정약수원탕·관악24시불가마사우나·천호목욕탕·금천파크온천호텔 모두 현재 Naver 정식명과 일치. 노션 원본명은 옛 표기였을 뿐. (국내 Naver 우선 정책)
- **jjimjilbang**: 67곳 보유, 대부분 정상(스파렉스/참숯가마/불가마/대형스파). 그린·북한산만 실제 오태깅이었음(둘 다 교정).
- **온도 소폭차(≤5도)/dual-log**: 우이령·설해원·오라카이·영빈·국제광천수 등은 카톡 5/19 로그 별도 보존된 다른 시점 → 유지.

### 알려진 한계 / 다음에
- 크로스오딧 파서가 노션 **다중값("건식 58, 95")·범위("50~66")**에서 오탐 → 첫값만 잡음. 봉일(41도차)·현대월드·강남목욕탕·삼부 등이 오탐이었음(개별 원본확인으로 걸러냄). 파서 보완하면 잔여 플래그 정확도↑.
- `katalk-merge-flat.mjs` FIX135에 colshift 2건 추가됨(rec1664 국제온천·rec1908 남해쏠비치, "건식70"→습식칸). 이 2건의 DB 반영은 미적용(필요시 enrich).
- 북한산온천 비젠 등 일부 facilities는 여전히 불완전(원본 부족). 점진 보강 대상.
- **현재 places 255곳** (196 KR + 59 해외, 트리니티 삭제 반영).
