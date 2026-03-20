# 타투 가능/커버 UI 구현 플랜

## 태그 체계
- `tattoo-friendly`: 타투 무조건 OK
- `tattoo-cover`: 타투 커버(시트/래시가드) 필요

## 사용자 플로우
1. 시설 등록/수정 → AMENITIES 칩 중 "타투 가능" 클릭
2. ConfirmModal 팝업: "타투 커버가 필요한가요?"
   - "예" → `tattoo-cover` 태그, 칩 표시: "타투 가능(커버)"
   - "아니오" → `tattoo-friendly` 태그, 칩 표시: "타투 가능"
3. 다시 클릭하면 태그 해제

## 변경 파일

### 1. `src/constants/content.ts`
- PLACE_SPECS.AMENITIES: `tattoo-friendly` 항목 유지 (UI 진입점)
- FACILITY_LABEL_MAP에 추가:
  - `'tattoo-friendly'` → '타투 가능'
  - `'tattoo-cover'` → '타투 가능(커버)'
- FACILITY_ICON_MAP: 둘 다 동일 아이콘 'brush'
- EXPLORE_FILTERS: "타투 가능" 필터 → `tattoo-friendly`, `tattoo-cover` 둘 다 매칭

### 2. `src/app/place/add/page.tsx`
- "타투 가능" 칩 클릭 핸들러 수정:
  - 이미 `tattoo-friendly` 또는 `tattoo-cover` 선택 상태 → 해제
  - 미선택 → ConfirmModal 열기
  - 모달 "예" → `tattoo-cover` 추가
  - 모달 "아니오" → `tattoo-friendly` 추가

### 3. `src/app/place/[id]/edit/page.tsx`
- 동일 로직 적용

### 4. `src/app/explore/page.tsx`
- 필터 로직: `tattoo-friendly` OR `tattoo-cover` 매칭
  ```
  if (selectedFilters.includes('tattoo-friendly')) {
    // tattoo-friendly OR tattoo-cover 둘 다 포함
    filtered = filtered.filter(p =>
      p.facilities.includes('tattoo-friendly') || p.facilities.includes('tattoo-cover')
    )
  }
  ```

### 5. `src/components/features/place-card.tsx` + `src/app/explore/[id]/page.tsx`
- 칩/배지 표시 시 FACILITY_LABEL_MAP 참조하면 자동 반영됨
  - `tattoo-friendly` → "타투 가능"
  - `tattoo-cover` → "타투 가능(커버)"

## 시드 데이터 현황
- tattoo-friendly: 211건 (한국 182 + 해외 OK 29)
- tattoo-cover: 4건 (kolme kylä, 太閤の湯, 野乃なんば, スパメッツァ仙台)
- 없음: 15건 (NG 8 + UNKNOWN 6 + SAKURADO 1)
