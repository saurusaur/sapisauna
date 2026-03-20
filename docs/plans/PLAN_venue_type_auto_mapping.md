# Venue Type 자동매핑 플랜

> 장소 등록 시 API 카테고리 → 시설 유형 태그 자동 부여

## 현재 상태

- Naver API `category` 필드 (예: "사우나,찜질방,온천") — **응답에 있지만 버려지고 있음**
- Google API `types` 필드 (예: ["spa", "lodging"]) — **마찬가지로 버려짐**
- `PlaceResult`에 카테고리 정보 미포함 → DB에도 미저장

## 매핑 테이블

| 태그 | 한글 | Naver 키워드 | Google types |
|------|------|-------------|-------------|
| `hotel-sauna` | 호텔 사우나 | 호텔+사우나/스파 | lodging+spa |
| `resort-spa` | 리조트 스파 | 리조트+스파/웰니스 | resort+spa |
| `gym-sauna` | 헬스장 사우나 | 헬스/피트니스+사우나 | gym+spa |
| `jjimjilbang` | 찜질방 | 찜질방 | — |
| `bulgama-house` | 불가마/한증막 | 불가마, 한증막 | — |
| `oncheon` | 온천 | 온천 | hot_spring |
| `waterpark` | 워터파크 | 워터파크 | water_park |
| `public-bath` | 대중목욕탕 | 목욕탕, 대중탕 | — |
| `private-sauna` | 프라이빗 사우나 | 프라이빗, 개인, 독채 | — |

## 구현 단계

### Step 1: 매핑 함수 (신규)
- `src/lib/venue-mapping.ts`
- `mapNaverCategory(category: string): string | null`
- `mapGoogleTypes(types: string[]): string | null`
- 우선순위: 구체적 규칙 먼저 (hotel-sauna > 일반 sauna)

### Step 2: API 라우트 수정
- `src/app/api/places/search/route.ts`
- `PlaceResult`에 `suggestedVenueTag?: string` 추가
- `searchNaver()`: item.category → mapNaverCategory() → suggestedVenueTag
- `searchGoogle()`: item.types → mapGoogleTypes() → suggestedVenueTag

### Step 3: 장소 등록 UI
- `src/app/place/add/page.tsx`
- `handleSelectResult()`에서 suggestedVenueTag → facilities에 자동 추가
- 유저가 수정/제거 가능

### Step 4: 상수 + 필터 UI
- `src/constants/content.ts` PLACE_SPECS에 VENUE 섹션 추가
- EXPLORE_FILTERS에 장소 유형 필터 추가

### Step 5: 시드 데이터 백필
- seed 스크립트에서 theme_keyword 기반 매핑 적용

## 데이터 플로우

```
유저 "설해원" 검색
→ Naver API → category: "사우나,숙박"
→ mapNaverCategory() → "hotel-sauna"
→ PlaceResult.suggestedVenueTag: "hotel-sauna"
→ 등록 UI에서 "호텔 사우나" 칩 자동선택
→ 유저 확인 → places.facilities: ["hotel-sauna", "dry-sauna", ...]
→ 탐색 페이지에서 장소 유형 필터 사용 가능
```

## 변경 파일 (5개)

| 파일 | 변경 |
|------|------|
| `src/lib/venue-mapping.ts` | 신규 — 매핑 규칙 + 함수 |
| `src/app/api/places/search/route.ts` | PlaceResult 확장, 매핑 호출 |
| `src/constants/content.ts` | PLACE_SPECS VENUE 섹션, EXPLORE_FILTERS |
| `src/app/place/add/page.tsx` | 자동선택 로직 |
| `src/types/index.ts` | PlaceResult 타입 확장 |

## 난이도/일정

- 구현: ~반나절 (매핑 함수 + API 수정 + UI)
- 리스크: Naver 카테고리 문자열 변동 가능 → best-effort, 유저 최종 확인
