# Handoff: 버그픽스 + 기능 이슈 (2026-04-18)

## 완료된 작업 (이번 세션)

- Featured 카드 설명 min-height 2줄 고정 (제목 높이 통일)
- 검색 결과 선택 배경색 레드 → 그레이
- window.confirm 6곳 → ConfirmModal 교체 (sa-list/my, list-manage-sheet x2, save-flow, explore/type, use-list-actions)
- 이모지 팔레트 카테고리 대표성 반영 (10개)

---

## 미완료 이슈 (다음 세션)

### 0. 인기 태그 검색 시 사-리스트 미노출 (P1)

**현상:**
- 인기 태그 칩 클릭 시 피드에 사-리스트가 안 뜸
- 어드민이 만든 사-리스트여서 필터링되는 건지 확인 필요

**확인 포인트:**
- `getPublicLists`의 search/tag 쿼리에서 어드민 ID 제외 로직이 있는지
- `tags @> ARRAY[search]` 쿼리가 정상 동작하는지 (RPC 실행 여부)
- Featured 리스트가 피드에서 `is_featured` 필터로 제외되고 있는데, 태그 검색에서도 제외되는지

**관련 파일:**
- `src/lib/lists-service.ts` (getPublicLists search 로직)
- `src/app/sa-list/page.tsx` (feedLists에서 is_featured 필터)

### 1. Google 주소 포맷팅 + country_code 이슈 (P0)

**현상:**
- Google Places에서 가져온 주소가 `"Japan, 〒210-0023 Kanagawa, Kawasaki..."` 식으로 전체 formatted_address 저장
- country_code 추출 로직(`extractCountryCode`)이 formatted_address 마지막 콤마 항목 파싱 → 일부 케이스에서 실패
- country_code 실패 시 기본값 'KR' → 일본 장소에 네이버 지도 링크 표시, 타투 커버 모달 미트리거

**관련 파일:**
- `src/app/api/places/search/route.ts` (L44-69: extractCountryCode, generateShortAddress)
- `src/app/explore/[id]/page.tsx` (L329-346: 네이버 지도 조건 country_code === 'KR')
- `src/app/place/add/page.tsx` (L520: 타투 모달 cc === 'JP' 조건)

**해결 방향:**
- Google API 응답의 `address_components`에서 country short_name 직접 추출 (formatted_address 파싱 대신)
- 주소 표시: `generateShortAddress()` 결과를 UI에 우선 표시, formatted_address는 상세에서만
- country_code 기본값 'KR' → '' 로 변경하고, 빈 값이면 네이버 지도 숨김

### 2. place_count 실시간 싱크 이슈 (P1)

**현상:**
- 리스트에서 장소 삭제 후에도 place_count가 업데이트 안 됨 (캐시 문제)
- DB에서는 `removePlaceFromList` 호출 시 정확한 COUNT로 업데이트됨 (코드 확인 완료)

**추정 원인:**
- 삭제 후 리스트 목록/상세의 데이터를 리프레시하지 않아서 화면에 이전 값이 남아있음
- save-flow의 `removeFromAll` 후 useSavePlace/useMyLists 등의 refresh 누락 가능

**관련 파일:**
- `src/lib/lists-service.ts` (L242-262: removePlaceFromList + countPlaces)
- `src/components/features/save-flow.tsx` (removeFromAll 호출 후 refresh 흐름)
- `src/hooks/use-save-place.ts` (저장 상태 캐시)
- `src/app/sa-list/[id]/sa-list-detail-client.tsx` (장소 제거 후 refresh)

**해결 방향:**
- save-flow에서 removeFromAll 완료 후 useSavePlace.refresh() 호출 확인
- sa-list-detail에서 장소 제거 후 list 데이터도 refresh (place_count 반영)
- 전체 저장/삭제 흐름 다이어그램 필요

### 3. 트라이브 픽 → 사-리스트 이동 (P2)

**유저 요청:**
- 현재 홈에 있는 "추천 사우나" 트라이브 픽 섹션을 사-리스트 탭으로 이동
- 추천 로직 자체가 리스트 기반이므로 사-리스트에 자연스럽게 통합

**영향 범위:**
- `src/app/home/page.tsx` — 트라이브 픽 섹션 제거
- `src/app/sa-list/page.tsx` — 트라이브 픽 섹션 추가 (Featured 아래 또는 별도 섹션)
- 관련 훅/서비스 이동

### 4. 탐색 탭 → 지도 뷰 전환 (P2)

**유저 요청:**
- 탐색 탭을 "주변 사우나 찾기 + 장소 정보 보기" 지도 중심 뷰로 변경
- 현재 리스트형 탐색 → 지도 + 마커 + 바텀시트 패턴

**필요 작업:**
- 지도 API 선정 (Naver Map 1순위, Mapbox 2순위)
- 유저 위치 기반 주변 장소 조회
- 지도 컴포넌트 + 마커 + 장소 카드 바텀시트
- 기존 리스트형 탐색은 서브뷰 또는 토글로 유지 여부 결정 필요

### 5. 급냉탕 필드 추가 (P1)

**유저 요청:**
- 탕온도 세부정보에 급냉탕(ice bath) 온도 필드 추가

**필요 작업:**
- DB 마이그레이션: `logs` 또는 `deep_logs`에 `ice_bath_temp` 컬럼 추가
- 로그 폼 UI: ICE 섹션에 급냉탕 온도 입력 추가
- 장소 상세: ICE 냉각 카테고리에 급냉탕 표시
- `PLACE_SPECS.ICE.options`에 ice-bath 항목 추가 (현재 있는지 확인 필요)

**관련 파일:**
- `supabase/` — 새 마이그레이션
- `src/constants/content.ts` — PLACE_SPECS.ICE
- `src/app/log/page.tsx` — 온도 입력 폼
- `src/types/index.ts` — Log/DeepLog 타입

---

## 커밋 안 된 변경 (이번 세션)

| 파일 | 변경 |
|------|------|
| `src/components/features/featured-sa-list-card.tsx` | 설명 min-height 2줄 |
| `src/app/place/add/page.tsx` | 선택 장소 배경 그레이 |
| `src/app/sa-list/my/page.tsx` | window.confirm → ConfirmModal |
| `src/components/features/list-manage-sheet.tsx` | window.confirm → ConfirmModal (2곳) |
| `src/components/features/save-flow.tsx` | window.confirm → ConfirmModal |
| `src/app/explore/type/[type]/page.tsx` | window.confirm → ConfirmModal |
| `src/hooks/use-list-actions.ts` | confirm 제거 (호출부에서 처리) |
| `src/components/features/list-form-sheet.tsx` | 이모지 팔레트 업데이트 |
