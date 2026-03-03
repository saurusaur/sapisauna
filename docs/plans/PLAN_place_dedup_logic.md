# 장소 중복 제거 (Dedup) 로직 설계

> 최종 업데이트: 2026-03-01

## 좌표 검증 결과

실제 API 호출 기반 크로스 소스 좌표 비교:

| 장소 | Naver (KATEC→WGS84) | Google (WGS84) | 오차 | 거리 |
|------|---------------------|----------------|------|------|
| 삼영사우나 | 37.5888630, 127.0102249 | 37.5889016, 127.0103009 | 0.0000386 / 0.0000760 | **8.0m** |
| 주영여성대중목욕탕 | 37.5442864, 126.9693815 | 37.5442281, 126.9693667 | 0.0000583 / 0.0000148 | **6.5m** |
| 유라이크스파 | 37.5442864, 126.9693815 (동일 건물) | 37.5442605, 126.9693700 | — | **3.1m** |

→ KATEC÷10000000 근사 변환도 50m 반경 매칭에 충분
→ **같은 건물 다른 업체(주영 vs 유라이크)도 50m 내에 잡힘 — 자동 병합하면 오매칭**

## API별 수집 데이터 비교

### Naver Search Local API

```
응답 필드:
  title          → place_sources.name_original (HTML 태그 제거 필요)
  address        → (지번 주소, fallback용)
  roadAddress    → place_sources.address_original
  mapx / mapy    → place_sources.latitude/longitude (÷10000000 변환)
                 → external_id: "{mapx}_{mapy}"
  link           → place_sources.link (업체 홈페이지/SNS, 빈 문자열일 수 있음)
  category       → 현재 미저장 (예: "생활,편의>목욕탕,사우나")
  telephone      → 현재 미저장
  description    → 현재 미저장 (대부분 빈 문자열)
```

| 있는 것 | 없는 것 |
|---------|---------|
| 이름, 주소(도로명+지번), 좌표, 링크 | 영업 상태, 영업시간, 평점, 리뷰 수, 사진 |

### Google Places Text Search API

```
응답 필드:
  name               → place_sources.name_original (영문 또는 한글)
  formatted_address  → place_sources.address_original (영문 도로명)
  geometry.location   → place_sources.latitude/longitude (WGS84 원본)
  place_id           → place_sources.external_id
  plus_code          → place_sources.plus_code
  business_status    → 폐업 확인용 (OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY)
  opening_hours      → 현재 미저장 (open_now만 포함, 상세 시간은 Details API 필요)
  rating             → 현재 미저장 (예: 4.7)
  user_ratings_total → 현재 미저장 (예: 3)
  types              → 현재 미저장 (예: ["spa", "establishment"])
  photos             → 현재 미저장 (photo_reference로 이미지 조회 가능)
```

| 있는 것 | 없는 것 (Details API 필요) |
|---------|--------------------------|
| 이름, 주소, 좌표, place_id, 영업 상태, 평점, 리뷰 수, 사진 ref | 전화번호, 상세 영업시간, 리뷰 본문, 웹사이트 URL |

### 비교 요약

| 데이터 | Naver | Google Text Search | Google Details (추가 호출) |
|--------|-------|--------------------|--------------------------|
| 이름 | ✅ 한글 | ✅ 영문/한글 혼재 | ✅ |
| 주소 | ✅ 한글 도로명+지번 | ✅ 영문 도로명 (가끔 잘림) | ✅ |
| 좌표 | ✅ KATEC→WGS84 변환 | ✅ WGS84 원본 | ✅ |
| 영업 상태 | ❌ | ✅ business_status | ✅ |
| 영업 시간 | ❌ | ⚠️ open_now만 | ✅ 상세 |
| 평점 | ❌ | ✅ rating | ✅ |
| 리뷰 수 | ❌ | ✅ user_ratings_total | ✅ |
| 전화번호 | ✅ telephone | ❌ | ✅ |
| 사진 | ❌ | ✅ photo_reference | ✅ |
| 카테고리 | ✅ category | ✅ types | ✅ |
| 링크 | ✅ link (홈페이지) | ❌ | ✅ website |
| API 비용 | 무료 (일 25,000건) | $32/1000건 | $17/1000건 |

## 핵심 설계 원칙

**"불확실하면 사람에게 물어본다"**

- 자동 병합의 오매칭은 나중에 풀기 어려움
- 병합 전 유저 확인이 데이터 품질에 유리
- 한국 유저가 메인이므로 한글 확인 UI로 충분 (외국인 다국어 대응은 후순위)

## DB 구조 (places + place_sources)

```sql
-- places: 통합 장소 (소스 무관, 1장소 = 1레코드)
places (
  id UUID PK,
  name TEXT,                    -- 대표 이름 (최초 등록자 기준)
  address TEXT,                 -- 대표 주소
  latitude DECIMAL,             -- 대표 좌표 (WGS84)
  longitude DECIMAL,
  coordinate_source TEXT,       -- 대표 좌표 출처: 'naver' | 'google' | 'manual'
  status TEXT DEFAULT 'active', -- 'active' | 'closed_permanently' | 'closed_temporarily' | 'under_review'
  merged BOOLEAN DEFAULT false, -- 병합 이력 플래그 (어드민 리뷰용)
  ...
)

-- place_sources: 외부 API 출처 추적 (1장소 = N소스)
place_sources (
  id UUID PK,
  place_id UUID FK → places.id,
  source TEXT,                  -- 'naver' | 'google' | 'manual'
  external_id TEXT,             -- Naver: mapx_mapy, Google: place_id
  name_original TEXT,
  address_original TEXT,
  latitude DECIMAL(10, 8),      -- 소스별 원본 좌표
  longitude DECIMAL(11, 8),
  link TEXT,
  plus_code TEXT,
  UNIQUE(source, external_id)
)
```

### 좌표 저장 정책

- `places.latitude/longitude` → 대표 좌표 (지도 표시, dedup 매칭용)
- `places.coordinate_source` → 대표 좌표가 어느 API에서 온 것인지
- `place_sources[].latitude/longitude` → 소스별 원본 좌표 보존
  - Naver: KATEC÷10000000 변환값
  - Google: WGS84 원본 (더 정확)
  - 향후 대표 좌표를 더 정확한 소스로 업데이트할 때 비교용

## 장소 등록 시 Dedup 플로우

```
사용자가 검색 결과에서 장소 선택
    │
    ▼
1단계: 동일 소스 중복 체크 (빠름, 정확)
    SELECT * FROM place_sources
    WHERE source = {source} AND external_id = {external_id}
    │
    ├─ 있음 → 기존 place_id 반환 (완료)
    │
    └─ 없음 → 2단계로
    │
    ▼
2단계: 좌표 근접 매칭 (50m 반경)
    SELECT * FROM places WHERE 좌표 ±0.0005 이내
    │
    ├─ 0건 → 3단계 (신규 생성)
    │
    └─ 1건 이상 → 유저 확인 UI 표시
                   "이미 등록된 장소가 있습니다. 같은 장소인가요?"
                   [기존 장소 이름 + 주소 표시]
                   │
                   ├─ "네, 같은 장소입니다" → 소스 병합 (merged=true)
                   │
                   └─ "아니오, 다른 장소입니다" → 3단계 (신규 생성)
    │
    ▼
3단계: 신규 장소 생성
    INSERT INTO places (..., coordinate_source={source}) → new place_id
    INSERT INTO place_sources (place_id, source, external_id, latitude, longitude, ...)
```

## Supabase 구현 (PostGIS 없이)

```sql
-- RPC 함수: 반경 내 장소 검색 (후보 목록 반환)
CREATE OR REPLACE FUNCTION find_nearby_places(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_m INTEGER DEFAULT 50
)
RETURNS SETOF places AS $$
  SELECT *
  FROM places
  WHERE (
    6371000 * acos(
      cos(radians(p_lat)) * cos(radians(latitude))
      * cos(radians(longitude) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(latitude))
    )
  ) < p_radius_m
  ORDER BY (
    6371000 * acos(
      cos(radians(p_lat)) * cos(radians(latitude))
      * cos(radians(longitude) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(latitude))
    )
  );
$$ LANGUAGE sql STABLE;
```

> 기존 `find_nearby_place` (단수) → `find_nearby_places` (복수)로 변경.
> LIMIT 1 제거 — 후보 전체를 반환하여 유저에게 보여줌.

## 프론트엔드 저장 로직 (의사 코드)

```typescript
async function savePlace(place: PlaceResult): Promise<string> {
  // 1단계: 동일 소스 체크
  const { data: existing } = await supabase
    .from('place_sources')
    .select('place_id')
    .eq('source', place.source)
    .eq('external_id', place.external_id)
    .single()

  if (existing) return existing.place_id

  // 2단계: 좌표 근접 후보 조회
  let candidates: Place[] = []
  if (place.latitude && place.longitude) {
    const { data } = await supabase
      .rpc('find_nearby_places', {
        p_lat: place.latitude,
        p_lng: place.longitude,
        p_radius_m: 50
      })
    candidates = data || []
  }

  // 후보가 있으면 → 유저 확인 (UI에서 처리)
  if (candidates.length > 0) {
    const userChoice = await showMergeConfirmation(candidates)

    if (userChoice.merge && userChoice.selectedPlaceId) {
      const placeId = userChoice.selectedPlaceId
      // 소스 추가 (원본 좌표 포함)
      await supabase.from('place_sources').insert({
        place_id: placeId,
        source: place.source,
        external_id: place.external_id,
        name_original: place.name,
        address_original: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      })
      // 병합 플래그 + 시설 정보 병합
      await supabase.from('places').update({
        merged: true,
        facilities: mergedFacilities,
      }).eq('id', placeId)
      return placeId
    }
  }

  // 3단계: 신규 장소 생성
  const { data: newPlace } = await supabase
    .from('places')
    .insert({
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      coordinate_source: place.source,
    })
    .select('id')
    .single()

  await supabase.from('place_sources').insert({
    place_id: newPlace.id,
    source: place.source,
    external_id: place.external_id,
    name_original: place.name,
    address_original: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  })

  return newPlace.id
}
```

## 폐업 확인 플로우

```
유저가 "폐업했어요" 클릭
    │
    ▼
place_sources에 google 소스 있나?
    │
    ├─ 있음 → Place Details API(place_id) → business_status 확인
    │         ├─ CLOSED_PERMANENTLY → places.status = 'closed_permanently'
    │         ├─ CLOSED_TEMPORARILY → places.status = 'closed_temporarily'
    │         └─ OPERATIONAL → 구글은 영업중 → places.status = 'under_review' (어드민 큐)
    │
    └─ 없음 (Naver only) → places.status = 'under_review' (어드민 큐)
```

> Place Details API: $17/1000건. 유저가 버튼 누를 때만 호출.

## 어드민 리뷰

병합된 장소(`merged=true`) 또는 리뷰 대기(`status='under_review'`)는 어드민에서 리뷰:

```sql
SELECT p.id, p.status, p.merged, ps.name_original, ps.source, ps.address_original
FROM places p
JOIN place_sources ps ON ps.place_id = p.id
WHERE p.merged = true OR p.status = 'under_review'
ORDER BY p.updated_at DESC;
```

## 엣지 케이스 처리

| 케이스 | 처리 |
|--------|------|
| 좌표 없음 (null) | 2단계 스킵 → 바로 신규 생성 |
| 50m 내 여러 장소 | 후보 전체를 유저에게 표시 |
| 수동 입력 (API 검색 안 함) | source='manual', external_id=null → 좌표 매칭 |
| 동일 소스 재등록 | UNIQUE(source, external_id)로 DB 레벨 차단 |
| 같은 건물 다른 업체 | 유저가 "다른 장소" 선택 → 신규 생성 |
| 같은 업체 다른 이름 (리브랜딩) | 유저가 "같은 장소" 선택 → 소스 병합 |

## 테스트 시나리오 (검증 완료)

| # | 시나리오 | 기대 동작 | 검증 |
|---|---------|----------|------|
| 1 | 삼영사우나 Naver 등록 → Google 재검색 | 8.0m 매칭 → 유저 확인 → 병합 | ✅ |
| 2 | 주영여성대중목욕탕 Naver → 유라이크스파 Google | 3.1m 매칭 → 유저 확인 → "다른 장소" → 신규 | ✅ |
| 3 | 동일 Naver 결과 재등록 | 1단계 external_id 매칭 → 기존 반환 | ✅ |

## 미결 사항 (후순위)

- [ ] 자동 크로스 소스 매칭 (등록 시 백그라운드 Google 검색으로 place_id 확보)
- [ ] 외국인 UX (다국어 확인 UI) — 한국 유저 메인 확립 후
- [ ] "다른 장소에요" 유저 신고 기능
- [ ] 어드민 대시보드 병합/폐업 리뷰 화면
- [ ] Google 평점/리뷰 수/사진 저장 활용
