# 중복 매핑/로직 분석 리포트

분석일: 2026-03-01

---

## 1. AMENITY_LABEL_MAP vs PLACE_SPECS.AMENITIES.options 중복

| 항목 | 위치 |
|------|------|
| 수동 맵 | `src/constants/content.ts:641-651` (AMENITY_LABEL_MAP) |
| 자동 소스 | `src/constants/content.ts:339-353` (PLACE_SPECS.AMENITIES.options) |

**분석**: AMENITY_LABEL_MAP에 있는 9개 항목 중 8개(`store`, `gym`, `massage`, `sleep-room`, `workspace`, `dryer-free`, `towel`, `shampoo-bodywash`, `charging`)가 PLACE_SPECS.AMENITIES.options에 동일한 id/label로 존재한다. 단, `workspace`의 label이 AMENITY_LABEL_MAP에서는 `'작업공간'`이고, PLACE_SPECS.AMENITIES.options에서는 `'작업 공간'`으로 띄어쓰기 차이가 있다.

**FACILITY_LABEL_MAP(654-666)은 AMENITY_LABEL_MAP을 먼저 spread한 뒤 PLACE_SPECS를 순회하여 덮어쓰므로**, AMENITY_LABEL_MAP의 값이 PLACE_SPECS의 label과 다를 경우 PLACE_SPECS 값으로 덮어써진다. 즉 AMENITY_LABEL_MAP의 `workspace: '작업공간'`은 결국 PLACE_SPECS의 `'작업 공간'`으로 덮어쓰여 사실상 무의미하다.

- ✅ 제거 가능: AMENITY_LABEL_MAP 전체를 삭제하고, FACILITY_LABEL_MAP 생성 로직에서 AMENITY_LABEL_MAP spread 제거
- 영향 파일: `src/constants/content.ts`, 그리고 AMENITY_LABEL_MAP을 직접 import하는 파일은 없음 (FACILITY_LABEL_MAP만 외부에서 사용됨)
- 기능 변경: 없음 (PLACE_SPECS가 이미 동일 데이터를 가지고 있으므로)

---

## 2. `getFacilityLabel()` 함수 4곳 중복 정의

동일한 함수가 4개 파일에 독립적으로 정의됨:

| 파일 | 라인 |
|------|------|
| `src/components/features/place-card.tsx` | :15 |
| `src/components/features/filter-controls.tsx` | :20 |
| `src/app/place/page.tsx` | :11 |
| `src/app/explore/type/[type]/page.tsx` | :19 |

모두 `return FACILITY_LABEL_MAP[id] || id`와 동일한 한 줄 함수.

- ✅ 제거 가능: `src/lib/utils.ts`에 한 번만 정의하고 4곳에서 import
- 영향 파일: 위 4개 파일
- 기능 변경: 없음

---

## 3. 즐겨찾기 유틸 함수 3곳 복붙

`getDefaultCollection()`, `loadFavorites()`, `saveFavorites()`, `toggleFavorite()`, `isFavorited()` 로직이 3개 파일에 거의 동일하게 반복:

| 파일 | 함수들 |
|------|--------|
| `src/app/explore/page.tsx` | :23-51, :97-115 |
| `src/app/explore/[id]/page.tsx` | :18-37, :77-93 |
| `src/app/explore/type/[type]/page.tsx` | :27-53, :108-126 |

- ✅ 제거 가능: `src/hooks/use-favorites.ts` 커스텀 훅으로 추출
- 영향 파일: 위 3개 파일
- 기능 변경: 없음

---

## 4. `getFavoriteCount()` 2곳 중복

| 파일 | 라인 |
|------|------|
| `src/app/explore/page.tsx` | :47-50 |
| `src/app/explore/type/[type]/page.tsx` | :49-52 |

동일한 reduce 로직.

- ✅ 제거 가능: 즐겨찾기 훅에 포함
- 영향 파일: 위 2개 파일
- 기능 변경: 없음

---

## 5. `placeStatsMap` useMemo 로직 2곳 중복

로그에서 장소별 평균/건수를 계산하는 동일한 useMemo 로직:

| 파일 | 라인 |
|------|------|
| `src/app/explore/page.tsx` | :182-193 |
| `src/app/explore/type/[type]/page.tsx` | :129-140 |

- ✅ 제거 가능: `src/hooks/use-place-stats-map.ts` 또는 기존 `use-places.ts`에 추가
- 영향 파일: 위 2개 파일
- 기능 변경: 없음

---

## 6. `PlaceStatsDisplay` 컴포넌트 2곳 중복 정의

동일한 인라인 컴포넌트가 2개 파일에 정의:

| 파일 | 라인 |
|------|------|
| `src/app/explore/type/[type]/page.tsx` | :65-77 |
| `src/app/place/page.tsx` | :16-28 |

- ✅ 제거 가능: `src/components/features/place-stats-display.tsx`로 추출
- 영향 파일: 위 2개 파일
- 기능 변경: 없음

---

## 7. `SortType` 타입 2곳 중복 정의

| 파일 | 라인 |
|------|------|
| `src/hooks/use-explore-filters.ts` | :5 |
| `src/components/features/filter-controls.tsx` | :28 |

둘 다 `'recommended' | 'popular'`.

- ✅ 제거 가능: `filter-controls.tsx`에서 제거하고 `use-explore-filters.ts`에서 import
- 영향 파일: `src/components/features/filter-controls.tsx`
- 기능 변경: 없음

---

## 8. `UseDataState<T>` 인터페이스 2곳 중복 정의

| 파일 | 라인 |
|------|------|
| `src/hooks/use-logs.ts` | :11-15 |
| `src/hooks/use-places.ts` | :11-15 |

동일한 `{ data: T; loading: boolean; error: string | null }` 구조.

- ✅ 제거 가능: `src/types/index.ts`에 정의 후 양쪽에서 import
- 영향 파일: `src/hooks/use-logs.ts`, `src/hooks/use-places.ts`
- 기능 변경: 없음

---

## 9. `ChipSelect` 컴포넌트 2곳 중복 정의

| 파일 | 라인 |
|------|------|
| `src/app/log/deep/page.tsx` | :110-138 |
| `src/app/place/add/page.tsx` | :131-151 |

둘 다 `SelectButton`을 감싼 래퍼 컴포넌트. deep/page.tsx 버전은 `multiple` prop을 지원하고, add/page.tsx 버전은 항상 배열 기반이라 약간 다름.

- ✅ 제거 가능: `src/components/ui/chip-select.tsx`로 통합 (multiple 지원 포함)
- 영향 파일: 위 2개 파일
- 기능 변경: 없음 (두 인터페이스의 합집합으로 설계)

---

## 10. `TRIBE_COLORS` 매핑 3곳 중복

CSS 변수 참조 컬러맵이 3곳에 분산:

| 파일 | 라인 | 이름 |
|------|------|------|
| `src/constants/content.ts` | :36-40 | `TRIBE_COLORS` (private, TRIBES 내부용) |
| `src/app/explore/page.tsx` | :56-60 | `TYPE_TAB_COLORS` |
| `src/app/history/page.tsx` | :20-24 | `TRIBE_COLORS` |

모두 `{ saunner: 'var(--color-saunner)', bather: 'var(--color-bather)', jimi: 'var(--color-jimi)' }` 동일.

- ✅ 제거 가능: `src/constants/content.ts`의 TRIBE_COLORS를 export하면 2곳에서 재사용 가능
- 영향 파일: `src/app/explore/page.tsx`, `src/app/history/page.tsx`
- 기능 변경: 없음

---

## 11. `bath_gender` 타입 리터럴 하드코딩 5+곳

`'male-only' | 'female-only' | 'private' | 'mixed'` 리터럴 유니온이 여러 곳에 하드코딩:

| 파일 | 라인 |
|------|------|
| `src/types/index.ts` | :24 |
| `src/lib/places-service.ts` | :27, :118 |
| `src/app/place/add/page.tsx` | :42, :400 |
| `src/app/explore/page.tsx` | :212, :215 |
| `src/constants/content.ts` | :636 (EXPLORE_FILTERS.GENDER.options) |

- ✅ 제거 가능: `src/types/index.ts`에서 `PlaceBathGender` 타입을 정의하거나, `PLACE_BATH_TYPE`의 id에서 자동 추출
- 영향 파일: 위 모든 파일
- 기능 변경: 없음

---

## 12. `LogData` 타입 vs `LogWithPlace` / `SavedLog` 중복 필드

| 파일 | 타입명 |
|------|--------|
| `src/types/index.ts` | `LogWithPlace` |
| `src/lib/storage.ts` | `SavedLog` |
| `src/components/story-editor/sticker-content.tsx` | `LogData` |

3가지 모두 `sauna_temp`, `cold_bath_temp`, `repeat`, `totono`, `water_quality`, `hot_bath_temp`, `cleanliness`, `jjim_temp`, `revisit_score` 등의 필드를 독립적으로 정의한다. `SavedLog`는 추가로 `savedAt` 등을 가지고, `LogData`는 `_editId` 등 스토리용 필드가 있어 완전히 동일하지는 않지만 핵심 필드가 반복됨.

- ❌ 즉시 제거 어려움: 각 타입의 용도가 다름 (DB 조인, localStorage, 스토리 렌더). 다만 공통 필드를 base interface로 추출하여 `extends` 가능
- 영향 파일: 3개 파일
- 기능 변경: 리팩토링 시 import 경로 변경

---

## 13. `EXPLORE_FILTERS` label이 `PLACE_SPECS` label과 수동 중복

| 항목 | EXPLORE_FILTERS | PLACE_SPECS |
|------|----------------|-------------|
| 온열 시설 | `EXPLORE_FILTERS.HEAT.label` (613) | `PLACE_SPECS.HEAT.label` (299) |
| 냉각 시설 | `EXPLORE_FILTERS.ICE.label` (618) | `PLACE_SPECS.ICE.label` (312) |
| 휴식 시설 | `EXPLORE_FILTERS.PAUSE.label` (623) | `PLACE_SPECS.PAUSE.label` (321) |
| 편의시설 | `EXPLORE_FILTERS.AMENITIES.label` (631) | `PLACE_SPECS.AMENITIES.label` (340) |

EXPLORE_FILTERS의 label 4개가 PLACE_SPECS의 label과 동일. EXPLORE_FILTERS.BEYOND.label만 `'특별 시설'`로 PLACE_SPECS.BEYOND.label `'추가 시설'`과 다름 (의도적일 수 있음).

또한 EXPLORE_FILTERS의 options 배열은 PLACE_SPECS options의 id 부분집합을 하드코딩한 것.

- ❌ 단순 제거 어려움: EXPLORE_FILTERS는 PLACE_SPECS의 **부분집합**이며 필터에 표시할 항목만 선별함. BEYOND.label이 의도적으로 다를 수 있음. 다만 label은 PLACE_SPECS에서 참조하도록 개선 가능
- 영향 파일: `src/constants/content.ts`, `src/components/features/filter-controls.tsx`
- 기능 변경: label 참조만 바꾸면 없음, options 구조 변경 시 주의 필요

---

## 14. `storage` (utils.ts) vs `storage.ts` (lib/) 이중 스토리지 시스템

| 파일 | 기능 |
|------|------|
| `src/lib/utils.ts:87-113` | 범용 `storage.get/set/remove` + `STORAGE_KEYS` |
| `src/lib/storage.ts:1-58` | `SavedLog` 전용 `saveLogToHistory/getSavedLogs` |

두 파일 모두 localStorage를 다루지만 서로 참조하지 않고 독립적으로 존재.

- ❌ 즉시 통합 어려움: `storage.ts`는 LAUNCH_CHECKLIST에서 Supabase 교체 예정으로 명시됨. 통합보다는 `storage.ts` 제거 시점에 정리하는 것이 적절
- 영향 파일: `src/lib/storage.ts`, `src/lib/utils.ts`
- 기능 변경: 마이그레이션 시 변경 필수

---

## 15. `facilityIconMap` 빌드 로직 — filter-controls.tsx에만 존재하지만 FACILITY_LABEL_MAP 패턴과 중복

`src/components/features/filter-controls.tsx:8-18`에서 PLACE_SPECS + PLACE_BATH_TYPE을 순회하여 `id -> icon` 맵을 빌드하는데, 이는 `content.ts:654-666`의 FACILITY_LABEL_MAP 빌드 패턴과 동일한 순회 로직.

- ✅ 제거 가능: `content.ts`에 `FACILITY_ICON_MAP`도 함께 자동 생성하면 filter-controls.tsx의 빌드 로직 불필요
- 영향 파일: `src/constants/content.ts`, `src/components/features/filter-controls.tsx`
- 기능 변경: 없음

---

## 요약 (안전 제거 가능 목록)

| # | 중복 항목 | 영향도 | 난이도 |
|---|----------|--------|--------|
| ✅1 | AMENITY_LABEL_MAP 제거 | 낮음 (1파일) | 쉬움 |
| ✅2 | getFacilityLabel() 통합 | 낮음 (4파일 import 변경) | 쉬움 |
| ✅3 | 즐겨찾기 유틸 → 훅 추출 | 중간 (3파일 리팩토링) | 중간 |
| ✅4 | getFavoriteCount() → 훅 포함 | 낮음 (2파일) | 쉬움 |
| ✅5 | placeStatsMap → 훅 추출 | 낮음 (2파일) | 쉬움 |
| ✅6 | PlaceStatsDisplay → 컴포넌트 추출 | 낮음 (2파일) | 쉬움 |
| ✅7 | SortType 중복 제거 | 낮음 (1파일) | 쉬움 |
| ✅8 | UseDataState → types에 통합 | 낮음 (2파일) | 쉬움 |
| ✅9 | ChipSelect → 컴포넌트 추출 | 낮음 (2파일) | 쉬움 |
| ✅10 | TRIBE_COLORS export 통합 | 낮음 (2파일) | 쉬움 |
| ✅11 | bath_gender 타입 추출 | 중간 (5+파일) | 중간 |
| ✅15 | FACILITY_ICON_MAP 자동 생성 | 낮음 (2파일) | 쉬움 |
| ❌12 | LogData/SavedLog/LogWithPlace 필드 중복 | 높음 | 어려움 |
| ❌13 | EXPLORE_FILTERS label/options 분리 유지 | 중간 | 중간 |
| ❌14 | storage 이중 시스템 | Supabase 마이그레이션 시 해결 | 보류 |

**총 발견: 15건 중 12건 안전 제거 가능 (✅), 3건 보류 (❌)**
