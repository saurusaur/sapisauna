# facility_type + bath_policy UI 구현 상세 플랜

> DB 변경 완료 상태. 코드 11파일 수정 필요.

## DB 현재 상태 (변경 완료)
- `places.facility_type`: 'small-bath' | 'public-bath' | 'hotel-spa' | 'private-sauna' | 'bulgama-house' | 'gym-sauna'
- `places.bath_policy`: NULL (남녀분리) | 'male-only' | 'female-only' | 'mixed'

---

## Phase 1: 타입 + 상수 (커밋 1)

### `src/types/index.ts`
- **:15-16** FacilityType 값 변경
  - Before: `'gender-bath' | 'male-only' | 'female-only' | 'private-bath' | 'mixed-bath'`
  - After: `'small-bath' | 'public-bath' | 'hotel-spa' | 'private-sauna' | 'bulgama-house' | 'gym-sauna'`
- **:16 뒤** 추가: `export type BathPolicy = 'male-only' | 'female-only' | 'mixed'`
- **:40 뒤** Place interface에 `bath_policy?: BathPolicy | null` 추가

### `src/constants/content.ts`
- **:57-65** `PLACE_BATH_TYPE` → 2개로 분리:
  - `PLACE_VENUE_TYPE`: small-bath/동네목욕탕, public-bath/대중목욕탕, hotel-spa/호텔·스파, private-sauna/개인사우나, bulgama-house/불한증막, gym-sauna/헬스장사우나
  - `PLACE_BATH_POLICY`: male-only/남성전용, female-only/여성전용, mixed/혼탕
- **:731-734** `EXPLORE_FILTERS.GENDER` options → `['male-only', 'female-only', 'mixed']`
- **:737-764** `FACILITY_LABEL_MAP` / `FACILITY_ICON_MAP` — 참조 배열 변경

---

## Phase 2: 서비스 레이어 (커밋 2)

### `src/lib/places-service.ts`
- **:7** import에 `BathPolicy` 추가
- **:27** `toPlace()` — default `'gender-bath'` → `'public-bath'` + `bath_policy` 매핑 추가
- **:134** `mergeWithPlace()` — 파라미터 + payload에 `bath_policy` 추가, default 변경
- **:175** `createNewPlace()` — 파라미터 + payload에 `bath_policy` 추가, default 변경
- **:227** `updatePlace()` — 파라미터 + payload에 `bath_policy` 추가

---

## Phase 3: 장소 등록/수정 UI (커밋 3)

### `src/app/place/add/page.tsx`
- **:5** import `PLACE_BATH_TYPE` → `PLACE_VENUE_TYPE, PLACE_BATH_POLICY`
- **:14** import `BathPolicy` 추가
- **:51** state 분리: `bathGender` → `facilityType` + `bathPolicy`
- **:122** localStorage에 `bathPolicy` 추가
- **:127-138** buildParams에 `facility_type: facilityType`, `bath_policy: bathPolicy`
- **:458-475** UI: 2단 칩 섹션 (시설 유형 + 탕 구분)

### `src/app/place/[id]/edit/page.tsx`
- **:11** import `BathPolicy` 추가
- **:29** state 추가: `bathPolicy`
- **:46-47** 로드 시 `place.bath_policy` 설정
- **:76** save payload에 `bath_policy` 추가
- **:122-139** UI: 2단 칩 섹션

---

## Phase 4: 탐색/표시 (커밋 4)

### `src/app/explore/page.tsx`
- **:158-160** gender 필터: `p.facility_type` → `p.bath_policy` 비교

### `src/app/explore/[id]/page.tsx`
- **:234** localStorage에 `bathPolicy` 추가
- **:316-326** 배지: `place.facility_type` → `place.bath_policy` 비교

### `src/components/features/place-card.tsx`
- **:57-67** 배지: `place.facility_type` → `place.bath_policy` 비교

---

## Phase 5: 로그 연동 (커밋 5)

### `src/app/log/page.tsx`
- **:22** state 추가: `bathPolicy`
- **:25-42** `deriveBathGender()` 재작성:
  ```
  (bathPolicy, facilityType, userGender) → BathGender
  - 'male-only' → 'male'
  - 'female-only' → 'female'
  - 'mixed' → mixed/mixed_male/mixed_female
  - null + facilityType='private-sauna' → private/private_male/private_female
  - null (남녀분리) → male/female (userGender 기반)
  ```
- **:103-109** localStorage 복원에 `bathPolicy` 추가
- **:183** deriveBathGender 호출 변경

### `src/app/place/page.tsx`
- **:92, :140** handlePlaceSelect에 `bath_policy` 전달

---

## 커밋 순서

| # | 파일 수 | 내용 |
|---|---------|------|
| 1 | 2 | types + constants (기반) |
| 2 | 1 | places-service (CRUD) |
| 3 | 2 | add + edit (UI) |
| 4 | 3 | explore + place-card (표시) |
| 5 | 2 | log + place (연동) |

## 주의사항
- localStorage에 구버전 `facilityType: 'gender-bath'` 남아있을 수 있음 → 폴백 처리
- `deriveBathGender`: private-sauna는 bath_policy가 아닌 facility_type에서 확인 → 파라미터 2개 필요
- FACILITY_LABEL_MAP/ICON_MAP 참조 변경 안 하면 getFacilityLabel 깨짐
