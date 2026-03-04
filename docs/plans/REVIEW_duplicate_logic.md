# 코드 전체 검토 리포트

분석일: 2026-03-04 (2차 업데이트)
범위: 중복 코드 + 미사용 코드 + UX/UI 갭 + 타입/상수 정합성

---

## Part A. 중복 코드 — 통합 대상 12건

### A1. getFacilityLabel() — 4곳 복붙 ✅ 쉬움

**뭐가 문제?**
`FACILITY_LABEL_MAP[id] || id` 한 줄짜리 함수가 4개 파일에 각각 정의되어 있다.
나중에 맵 로직이 바뀌면(예: 다국어 지원) 4곳을 다 수정해야 한다.

| 파일 | 라인 |
|------|------|
| `src/components/features/place-card.tsx` | :15 |
| `src/components/features/filter-controls.tsx` | :20 |
| `src/app/place/page.tsx` | :11 |
| `src/app/explore/type/[type]/page.tsx` | :19 |

**해결**: `src/lib/utils.ts`에 한 번 정의 → 4곳에서 import.
**대안**: `content.ts`에서 export. 하지만 utils.ts가 이미 유틸 함수 모아놓은 곳이라 여기가 자연스럽다.
**추천**: utils.ts ✅

---

### A2. 즐겨찾기 로직 — 3곳 복붙 (90+줄) ✅ 중간

**뭐가 문제?**
`getDefaultCollection()`, `loadFavorites()`, `saveFavorites()`, 즐겨찾기 토글 로직이 explore 관련 3개 페이지에 거의 동일하게 복사되어 있다.
한 곳에서 버그를 고치면 나머지 2곳에도 같은 수정을 해야 한다.

| 파일 | 라인 |
|------|------|
| `src/app/explore/page.tsx` | :22-52 |
| `src/app/explore/[id]/page.tsx` | :17-37 |
| `src/app/explore/type/[type]/page.tsx` | :27-53 |

**해결 A (추천 ✅)**: `src/hooks/use-favorites.ts` 커스텀 훅 생성.
- `useFavorites()` → `{ favorites, toggleFavorite, isFavorited, favoriteCount }` 반환
- 내부에서 localStorage 관리 + state 관리 일괄 처리
- 3개 페이지는 훅만 호출

**해결 B**: `src/lib/favorites-utils.ts`에 순수 함수만 추출. 각 페이지에서 state는 직접 관리.
- 장점: 훅 의존 없이 함수만 공유
- 단점: useState + useEffect 보일러플레이트는 여전히 3곳에 남음

**추천**: 해결 A (훅). state까지 캡슐화해야 실질적 중복 제거가 됨.

---

### A3. TRIBE_COLORS — 3곳 중복 ✅ 쉬움

**뭐가 문제?**
`{ saunner: 'var(--color-saunner)', bather: 'var(--color-bather)', jimi: 'var(--color-jimi)' }` 동일한 객체가 3곳에 각각 정의.

| 파일 | 이름 |
|------|------|
| `src/constants/content.ts:36-40` | `TRIBE_COLORS` (private) |
| `src/app/explore/page.tsx:56-60` | `TYPE_TAB_COLORS` |
| `src/app/history/page.tsx:20-24` | `TRIBE_COLORS` |

**해결**: `content.ts`의 `TRIBE_COLORS`를 export → 2곳에서 import.
**추천**: 이것만 하면 됨 ✅

---

### A4. PlaceStatsDisplay — 2곳 중복 ✅ 쉬움

**뭐가 문제?**
"또갈래요 4.2 · 3건" 표시하는 동일 컴포넌트가 2곳에 인라인 정의.

| 파일 | 라인 |
|------|------|
| `src/app/place/page.tsx` | :16-28 |
| `src/app/explore/type/[type]/page.tsx` | :64-77 |

**해결**: `src/components/features/place-stats-display.tsx`로 추출.
**추천**: 단독 파일 ✅

---

### A5. ChipSelect — 2곳 중복 ✅ 쉬움

**뭐가 문제?**
SelectButton을 감싼 칩 선택 래퍼가 2곳에 인라인 정의.
deep/page.tsx 버전은 `multiple` prop 지원, add/page.tsx는 항상 배열 기반.

| 파일 | 라인 |
|------|------|
| `src/app/log/deep/page.tsx` | :110-138 |
| `src/app/place/add/page.tsx` | :137-151 |

**해결**: `src/components/ui/chip-select.tsx`로 통합. `multiple` prop으로 단일/복수 선택 모두 지원.
**추천**: UI 컴포넌트 폴더에 배치 ✅

---

### A6. SortType — 2곳 중복 ✅ 쉬움

| 파일 | 라인 |
|------|------|
| `src/hooks/use-explore-filters.ts` | :5 |
| `src/components/features/filter-controls.tsx` | :28 |

**해결**: `use-explore-filters.ts`에서 export → `filter-controls.tsx`에서 import.

---

### A7. UseDataState<T> — 2곳 중복 ✅ 쉬움

| 파일 | 라인 |
|------|------|
| `src/hooks/use-logs.ts` | :11-15 |
| `src/hooks/use-places.ts` | :11-15 |

**해결**: `src/types/index.ts`에 정의 → 양쪽 훅에서 import.

---

### A8. AMENITY_LABEL_MAP 제거 ✅ 쉬움

**뭐가 문제?**
`AMENITY_LABEL_MAP`은 `PLACE_SPECS.AMENITIES.options`과 동일한 데이터.
`FACILITY_LABEL_MAP` 빌드 시 PLACE_SPECS가 덮어쓰므로 사실상 무의미.

**해결**: AMENITY_LABEL_MAP 삭제 + FACILITY_LABEL_MAP에서 spread 제거.
외부에서 직접 import하는 곳 없음.

---

### A9. FACILITY_ICON_MAP 자동 생성 ✅ 쉬움

**뭐가 문제?**
`filter-controls.tsx`에서 매 렌더마다 PLACE_SPECS를 순회해서 icon 맵을 빌드.

**해결**: `content.ts`에서 `FACILITY_LABEL_MAP` 빌드 로직 옆에 `FACILITY_ICON_MAP`도 함께 생성 → export.

---

### A10. bath_gender 타입 리터럴 하드코딩 5+곳 ✅ 중간

**뭐가 문제?**
`'public' | 'male-only' | 'female-only' | 'private' | 'mixed'` 리터럴이 5곳+에 흩어져 있다.
새 유형 추가 시 모든 곳을 수정해야 함.

**해결**: `types/index.ts`에 `FacilityType` 타입 정의 → 모든 곳에서 import.

---

### A11. facilityIconMap 런타임 빌드 → 상수화 ✅ 쉬움

A9와 동일. `content.ts`에서 미리 빌드.

---

### A12. insertDeepLog vs saveOrUpdateDeepLog — 기능 중복 ✅ 중간

**뭐가 문제?**
`insertDeepLog`은 INSERT만, `saveOrUpdateDeepLog`는 UPSERT.
두 함수의 목적이 겹친다.

**해결**: `insertDeepLog` 내부에서 `saveOrUpdateDeepLog`를 호출하도록 통합.
**대안**: `insertDeepLog` 삭제하고 `saveOrUpdateDeepLog`만 유지.
**추천**: 대안 (삭제). 호출처가 1곳뿐이라 간단.

---

## Part B. 미사용/죽은 코드 — 제거 대상

| # | 항목 | 파일 | 설명 |
|---|------|------|------|
| B1 | `TRIBE_NAME_MAP` | `content.ts` | export되지만 어디서도 import 안 됨 |
| B2 | `StoryTemplateId` 타입 | `types/index.ts` | 코드에서 사용되지 않음 |
| B3 | `STICKER_MAX_COUNT` | `sticker-templates.ts` | 정의만 있고 import 없음 |
| B4 | `GREETING` vs `GREETING_WITH_TYPE` | `content.ts` | 동일 출력. 하나 제거 |
| B5 | `storage.ts` 삭제됨 | - | ✅ 이미 완료 (3/4) |
| B6 | `generate-id.ts` 삭제됨 | - | ✅ 이미 완료 (3/4) |

---

## Part C. 타입/상수 정합성 이슈

### C1. DeepLogData.food vs DB food_eaten — 이름 불일치 🔴 높음

**뭐가 문제?**
타입에서는 `food`라고 부르는데, DB 스키마에서는 `food_eaten`이다.
API 응답이 DB 컬럼명을 사용하므로 타입과 맞지 않을 수 있다.

**해결**: `types/index.ts`의 `food`를 `food_eaten`으로 변경. 사용처도 일괄 수정.
**영향**: logs-service.ts, log/deep/page.tsx, complete/page.tsx 등

---

### C2. EXPLORE_FILTERS ↔ PLACE_SPECS 필터 동기화

**뭐가 문제?**
- `hot-bath`(온탕)은 PLACE_SPECS에 있지만 EXPLORE_FILTERS.HEAT에 없다
- 이전 세션에서 유저가 의도적으로 hot-bath를 필터에서 제외 요청함

**상태**: 의도적 제외 — 문서화만 필요.

---

### C3. LogData 타입 3곳 필드 중복 ⚠️ 보류

`LogWithPlace` (types), `SavedLog` (삭제됨), `LogData` (sticker-content)가 유사 필드를 갖는다.
storage.ts 삭제로 SavedLog는 해소됨. sticker-content의 LogData는 스토리 렌더 전용이라 분리 유지가 합리적.

**상태**: storage.ts 삭제로 2/3 해소. 나머지 1건은 용도가 달라 보류.

---

## Part D. UX/UI 갭 — 기능적 누락

### D1. 기록 삭제 미구현 🔴 CRITICAL

**뭐가 문제?**
`history/[id]/page.tsx:44`에 `// TODO: Supabase 삭제 로직` 주석만 있다.
삭제 버튼은 렌더링되고, ConfirmModal도 뜨지만, 실제 삭제 로직이 없다.
**유저가 삭제 확인을 눌러도 아무 일도 안 일어난다.**

**해결**: `logs-service.ts`에 `deleteLog(logId)` 함수 추가 → `history/[id]`에서 호출.

---

### D2. 기록 상세 → 장소 상세 링크 없음 ⚠️ MEDIUM

**뭐가 문제?**
`history/[id]`에서 장소 이름이 보이지만 클릭해도 아무 일이 없다.
`explore/[id]`(장소 상세)로 이동하는 링크가 없다.

**상태**: BACKLOG P1에 이미 추가됨 (오늘).

---

### D3. 온보딩 에러 처리 없음 ⚠️ MEDIUM

**뭐가 문제?**
`onboarding/page.tsx`에서 Supabase upsert 실패 시 에러 UI가 없다.
닉네임 중복 체크 실패도 무시됨.

**해결**: try/catch + 에러 상태 표시 추가.

---

### D4. 스토리 공유/다운로드 성공 피드백 없음 ⚠️ MEDIUM

**뭐가 문제?**
Share/Download 버튼 클릭 후 성공/실패 여부를 유저가 알 수 없다.

**해결**: 토스트 메시지 컴포넌트 추가.

---

### D5. JSON.parse 무방비 9곳 ⚠️ MEDIUM

**뭐가 문제?**
localStorage에서 읽은 값을 `JSON.parse()`로 파싱할 때 try/catch가 없다.
손상된 데이터가 있으면 페이지가 크래시한다.

| 파일 | 대상 |
|------|------|
| `src/app/log/page.tsx` | `currentLog`, `selectedPlace` |
| `src/app/log/deep/page.tsx` | `currentLog` |
| `src/app/story/page.tsx` | `storyLog` |
| `src/app/complete/page.tsx` | `currentLog` |
| `src/app/story/edit/page.tsx` | `storyLog` |
| `src/app/history/[id]/page.tsx` | 없음 (DB 직접) ✅ |

**해결 A (추천 ✅)**: `utils.ts`에 `safeParse<T>(key: string, fallback: T): T` 헬퍼 추가.
```typescript
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) } catch { return fallback }
}
```

**해결 B**: 각 파일에 개별 try/catch. 단점: 또 복붙.
**추천**: 해결 A ✅

---

### D6. 설정 하위 페이지 뒤로가기 버튼 없음 ⚠️ LOW

`/settings/nickname`, `/settings/type`, `/settings/gender`에 뒤로가기 버튼이 없다.

---

## Part E. 보류 항목 (현재 수정 불필요)

| 항목 | 이유 |
|------|------|
| EXPLORE_FILTERS label ↔ PLACE_SPECS label 수동 중복 | 필터는 PLACE_SPECS의 부분집합. 구조 변경 시 위험. 현재 유지 |
| LogData (sticker-content) 필드 중복 | 스토리 렌더 전용. 용도 분리 합리적 |
| next/font/google | 기능 아닌 최적화. 후순위 |
| placeStatsMap useMemo 2곳 | usePlaceStats 훅이 이미 개별 조회 지원. 별도 통합 불필요 |

---

## 실행 계획 — 우선순위별 3단계

### Phase 1: 안전 제거 + 크리티컬 수정 (추천: 다음 세션)

| # | 작업 | 영향 파일 | 난이도 |
|---|------|----------|--------|
| D1 | 기록 삭제 구현 | logs-service + history/[id] | 중간 |
| C1 | food → food_eaten 이름 수정 | types + 서비스 + 페이지 | 쉬움 |
| D5 | safeParse 헬퍼 + 적용 | utils + 5개 페이지 | 쉬움 |
| B1-B4 | 죽은 코드 제거 | content.ts, types, sticker-templates | 쉬움 |

### Phase 2: 중복 제거 리팩토링

| # | 작업 | 영향 파일 | 난이도 |
|---|------|----------|--------|
| A1 | getFacilityLabel 통합 | utils + 4 페이지 | 쉬움 |
| A2 | useFavorites 훅 추출 | 신규 훅 + 3 페이지 | 중간 |
| A3 | TRIBE_COLORS export | content.ts + 2 페이지 | 쉬움 |
| A4 | PlaceStatsDisplay 추출 | 신규 컴포넌트 + 2 페이지 | 쉬움 |
| A5 | ChipSelect 추출 | 신규 컴포넌트 + 2 페이지 | 쉬움 |
| A8-A9 | AMENITY_LABEL_MAP 제거 + ICON_MAP 생성 | content.ts + filter-controls | 쉬움 |

### Phase 3: 타입 정리 + UX 개선

| # | 작업 | 영향 파일 | 난이도 |
|---|------|----------|--------|
| A6-A7 | SortType + UseDataState 통합 | hooks + types | 쉬움 |
| A10 | FacilityType 타입 추출 | types + 5개 파일 | 중간 |
| A12 | insertDeepLog/saveOrUpdateDeepLog 통합 | logs-service + complete | 쉬움 |
| D3 | 온보딩 에러 처리 | onboarding/page | 쉬움 |
| D4 | 토스트 피드백 | 신규 컴포넌트 + story | 중간 |

---

## 수치 요약

| 카테고리 | 건수 | 제거 가능 라인 (추정) |
|----------|------|-----------------------|
| 중복 코드 통합 | 12건 | ~250줄 |
| 죽은 코드 제거 | 4건 | ~30줄 |
| 타입/상수 정합성 | 3건 | 이름 변경 위주 |
| UX/UI 기능 갭 | 6건 | +80줄 (신규 구현) |
| **합계** | **25건** | 순감 ~200줄 |
