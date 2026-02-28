# UI vs DB 필드 감사 (Audit) 결과

**작성일**: 2026-03-01
**범위**: content.ts UI 필드 → DB 스키마 매칭 + 실제 저장 경로 추적

---

## 핵심 발견 (Critical Findings)

### 1. DB INSERT 로직이 존재하지 않음

현재 `complete/page.tsx`에서 `saveLogToHistory()`를 호출하지만, 이 함수는 **localStorage에만 저장**한다.
`src/lib/storage.ts`의 `saveLogToHistory()`는 `savedLogs` 키로 localStorage 배열에 push할 뿐,
**Supabase `logs` / `deep_logs` 테이블에 INSERT하는 코드가 프로젝트 어디에도 없다.**

> 즉, 모든 Quick Log + Deep Log 데이터가 DB에 전혀 저장되지 않는 상태.
> `logs-service.ts`에는 SELECT(조회)만 있고, INSERT/UPDATE 함수가 없다.

이것이 가장 근본적인 문제이며, 아래 필드별 매칭은 "만약 DB INSERT가 구현된다면"의 관점에서 작성.

---

## 2. logs 테이블 (Quick Log)

### UI → localStorage 저장 필드 (`/log/page.tsx` handleSave)

| UI 필드 | 상수 출처 | localStorage 키 | DB 컬럼 | 상태 |
|---------|-----------|-----------------|---------|------|
| 타입 선택 | TRIBE_CATEGORY_MAP | `tribe_id` | `log_type` | ⚠️ 키 이름 불일치 (tribe_id vs log_type) |
| 또 갈래요 | QUICK_LOG.COMMON.REVISIT | `revisit_score` | `revisit_score` | ✅ 매칭 |
| HEAT 시간 | QUICK_LOG.COMMON.ROUTINE.HEAT | `heat_time` | `heat_time` | ✅ 매칭 |
| ICE 시간 | QUICK_LOG.COMMON.ROUTINE.ICE | `ice_time` | `ice_time` | ✅ 매칭 |
| PAUSE 시간 | QUICK_LOG.COMMON.ROUTINE.PAUSE | `pause_time` | `pause_time` | ✅ 매칭 |
| REPEAT 세트 | QUICK_LOG.COMMON.ROUTINE.REPEAT | `repeat` | `repeat` | ✅ 매칭 |
| 냉탕 온도 | QUICK_LOG.COMMON.COLD_BATH_TEMP | `cold_bath_temp` | `cold_bath_temp` | ✅ 매칭 |
| 목욕물 온도 | QUICK_LOG.BATHER.HOT_BATH_TEMP | `hot_bath_temp` | `hot_bath_temp` | ✅ 매칭 |
| 수질 | QUICK_LOG.BATHER.WATER_QUALITY | `water_quality` | `water_quality` | ✅ 매칭 |
| 건식사우나 온도 | QUICK_LOG.SAUNER.SAUNA_TEMP | `sauna_temp` | `sauna_temp` | ✅ 매칭 |
| 사우나 하이 | QUICK_LOG.SAUNER.TOTONO | `totono` | `totono_score` | ⚠️ 키 이름 불일치 (totono vs totono_score) |
| 한증막 온도 | QUICK_LOG.JIMI.JJIM_TEMP | `jjim_temp` | `jjim_temp` | ✅ 매칭 |
| 청결도 | QUICK_LOG.JIMI.CLEANLINESS | `cleanliness` | `cleanliness` | ✅ 매칭 |
| 장소 이름 | - | `place_name` | ❌ 없음 (place_id로 JOIN) | ⚠️ place_id를 저장해야 함 |
| display_id | generateDisplayId() | `display_id` | `display_id` | ✅ 매칭 |

### DB 컬럼 중 UI에서 수집하지 않는 것

| DB 컬럼 | 설명 | 상태 |
|---------|------|------|
| `user_id` | 서버에서 auth.uid()로 자동 설정 | ✅ 서버 처리 |
| `place_id` | localStorage에 `selectedPlace.id` 있으나 currentLog에 포함 안 됨 | ❌ 저장 시 누락 |
| `logged_at` | `created_at`으로 저장 중, DB는 `logged_at` 기대 | ⚠️ 키 이름 불일치 |
| `refreshed_score` | DB에 컬럼 존재, UI에 없음 | ⚠️ 미사용 컬럼 |
| `rest_quality` | DB에 컬럼 존재 (찜질파), UI에 없음 | ⚠️ 미사용 컬럼 |

---

## 3. deep_logs 테이블 (Deep Log)

### UI → localStorage 저장 필드 (`/log/deep/page.tsx` handleSave)

| UI 필드 | 상수 출처 | localStorage 키 (deep_log.*) | DB 컬럼 | 상태 |
|---------|-----------|------------------------------|---------|------|
| 탕 선택 | DEEP_LOG.BATH_GENDER | `bath_gender` | `bath_gender` | ✅ 매칭 |
| 동행자 | DEEP_LOG.COMPANION | `companion` | `companion` | ✅ 매칭 |
| 방문 목적 | DEEP_LOG.PURPOSE | `purposes` (배열) | `purpose` (단일 TEXT) | ❌ 타입 불일치: UI는 복수 선택(배열), DB는 단일 TEXT |
| 비용 | DEEP_LOG.COST | `cost` | `cost` | ✅ 매칭 |
| 혼잡도 | DEEP_LOG.CROWD | `crowd` | `crowd` | ✅ 매칭 |
| 자유 메모 | DEEP_LOG.MEMO | `memo` | `memo` | ✅ 매칭 |
| 세신 이용 여부 | DEEP_LOG.SCRUB | `has_scrub` | `had_scrub` | ⚠️ 키 이름 불일치 (has_scrub vs had_scrub) |
| 세신 만족도 | DEEP_LOG.SCRUB.satisfaction | `scrub_satisfaction` | `scrub_satisfaction` | ✅ 매칭 |
| 매점 이용 여부 | PLACE_SPECS.STORE | `has_store` | ❌ 없음 | ❌ DB 컬럼 누락 |
| 매점 평가 | PLACE_SPECS.STORE.rating | `store_score` | ❌ 없음 | ❌ DB 컬럼 누락 |
| 매점 추천 메모 | PLACE_SPECS.STORE.memoPlaceholder | `store_memo` | ❌ 없음 | ❌ DB 컬럼 누락 |

### DB 컬럼 중 UI에서 수집하지 않는 것

| DB 컬럼 | 설명 | 상태 |
|---------|------|------|
| `used_sauna_types` | TEXT[] | ⚠️ UI 미구현 (DeepLogData.facilityTags?) |
| `used_rooms` | TEXT[] | ⚠️ UI 미구현 (DeepLogData.roomTypes?) |
| `used_amenities` | TEXT[] | ⚠️ UI 미구현 (DeepLogData.amenities?) |
| `scrub_price` | INT | ⚠️ UI 미구현 (DeepLogData.scrubPrice?) |
| `food_eaten` | TEXT[] | ⚠️ UI 미구현 (DeepLogData.food?) |
| `log_id` | FK → logs.id | 서버 처리 |

---

## 4. places 테이블 (장소 등록)

### UI → DB 저장 (`/place/add/page.tsx` → `places-service.ts addPlace()`)

| UI 필드 | 상수 출처 | addPlace 파라미터 | DB 컬럼 | 상태 |
|---------|-----------|-------------------|---------|------|
| 장소 이름 | 수동 입력 | `name` → place_sources.name_original | place_sources.name_original | ✅ 매칭 |
| 주소 | 수동 입력 | `address` → place_sources.address_original | place_sources.address_original | ✅ 매칭 |
| 좌표 | 검색 결과 | `latitude`, `longitude` | places.latitude, longitude | ✅ 매칭 |
| 시설 선택 | PLACE_SPECS (HEAT/ICE/PAUSE/BEYOND/AMENITIES) | `facilities` | places.facilities | ✅ 매칭 |
| 24시 영업 | UI 토글 | `is_24h` | places.is_24h | ✅ 매칭 |
| 탕 구분 | PLACE_BATH_TYPE | `bath_gender` | places.bath_gender | ✅ 매칭 |
| 검색 엔진 | UI 선택 | `source` | place_sources.source | ✅ 매칭 |
| 외부 ID | 검색 결과 | `external_id` | place_sources.external_id | ✅ 매칭 |

> places 테이블은 `addPlace()` 서비스가 완성되어 있어 DB 저장이 정상 작동함.

---

## 5. 타입 정의 불일치 (types/index.ts)

| 타입 필드 | 실제 사용/DB | 문제 |
|-----------|-------------|------|
| `DeepLogData.purpose` | `string` (단일) | UI는 복수 선택인데 타입도 단일 string |
| `LogWithPlace.deep_log.purposes` | `string[]` (배열) | 조회 타입은 배열인데 DB는 단일 TEXT |
| `LogWithPlace.deep_log.has_store` | `boolean` | DB에 해당 컬럼 없음 |
| `LogWithPlace.deep_log.store_score` | `number` | DB에 해당 컬럼 없음 |
| `LogWithPlace.deep_log.store_memo` | `string` | DB에 해당 컬럼 없음 |

---

## 6. 요약: 심각도별 분류

### CRITICAL (즉시 수정 필요)

1. **logs/deep_logs INSERT 로직 없음** — UI 데이터가 localStorage에만 저장되고 Supabase에 도달하지 않음
2. **place_id 미포함** — currentLog에 place_id가 없어서 DB 저장 시 장소 연결 불가
3. **매점 관련 3개 필드 DB 누락** — `has_store`, `store_score`, `store_memo` 컬럼이 deep_logs에 없음
4. **purpose 타입 불일치** — UI는 복수 선택(배열)인데 DB는 단일 TEXT

### WARNING (키 이름 불일치)

5. `tribe_id` (UI) vs `log_type` (DB)
6. `totono` (UI) vs `totono_score` (DB)
7. `has_scrub` (UI) vs `had_scrub` (DB)
8. `created_at` (UI) vs `logged_at` (DB)

### INFO (미사용/미구현)

9. DB에 `refreshed_score`, `rest_quality` 컬럼 있으나 UI 미구현
10. DB에 `used_sauna_types`, `used_rooms`, `used_amenities`, `scrub_price`, `food_eaten` 있으나 UI 미구현
