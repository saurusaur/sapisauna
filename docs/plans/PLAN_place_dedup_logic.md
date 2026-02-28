# 장소 중복 제거 (Dedup) 로직 설계

## 검증 결과

명동황금사우나 동일 장소 좌표 비교:
| API | lat | lng |
|-----|-----|-----|
| Naver (KATEC 변환) | 37.5619212 | 126.9866243 |
| Google (WGS84) | 37.5619308 | 126.9865577 |
| **오차** | 0.0000096 | 0.0000666 |
| **실제 거리** | **~7m** | |

→ 현재 KATEC÷10000000 근사 변환도 50m 반경 매칭에 충분

## DB 구조 (places + place_sources)

```sql
-- places: 통합 장소 (소스 무관, 1장소 = 1레코드)
places (
  id UUID PK,
  name TEXT,            -- 대표 이름 (최초 등록자 기준)
  address TEXT,         -- 대표 주소
  latitude DECIMAL,     -- WGS84
  longitude DECIMAL,
  ...
)

-- place_sources: 외부 API 출처 추적 (1장소 = N소스)
place_sources (
  id UUID PK,
  place_id UUID FK → places.id,
  source TEXT,          -- 'naver' | 'google' | 'manual'
  external_id TEXT,     -- Naver: mapx_mapy, Google: place_id
  name_original TEXT,
  address_original TEXT,
  UNIQUE(source, external_id)
)
```

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
2단계: 좌표 근접 매칭 (크로스 소스)
    SELECT * FROM places
    WHERE earth_distance(ll_to_earth(latitude, longitude),
                         ll_to_earth({lat}, {lng})) < 50
    │
    ├─ 1건 매칭 → 기존 place에 새 source 추가 (완료)
    │
    ├─ 다건 매칭 → 가장 가까운 place에 추가
    │
    └─ 0건 → 3단계로
    │
    ▼
3단계: 신규 장소 생성
    INSERT INTO places (...) → new place_id
    INSERT INTO place_sources (place_id, source, external_id, ...)
```

## Supabase 구현 (PostGIS 없이)

Supabase 무료 플랜에서 earth_distance 대신 Haversine 근사:

```sql
-- RPC 함수: 반경 내 장소 검색
CREATE OR REPLACE FUNCTION find_nearby_place(
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
  )
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

## 프론트엔드 저장 로직 (의사 코드)

```typescript
async function savePlace(place: PlaceResult) {
  // 1단계: 동일 소스 체크
  const { data: existing } = await supabase
    .from('place_sources')
    .select('place_id')
    .eq('source', place.source)
    .eq('external_id', place.external_id)
    .single()

  if (existing) return existing.place_id

  // 2단계: 좌표 근접 매칭 (50m)
  const { data: nearby } = await supabase
    .rpc('find_nearby_place', {
      p_lat: place.latitude,
      p_lng: place.longitude,
      p_radius_m: 50
    })

  let placeId: string

  if (nearby?.length > 0) {
    // 기존 장소에 새 소스 추가
    placeId = nearby[0].id
  } else {
    // 3단계: 신규 장소 생성
    const { data } = await supabase
      .from('places')
      .insert({
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      })
      .select('id')
      .single()
    placeId = data.id
  }

  // 소스 링크 추가
  await supabase.from('place_sources').insert({
    place_id: placeId,
    source: place.source,
    external_id: place.external_id,
    name_original: place.name,
    address_original: place.address,
  })

  return placeId
}
```

## 엣지 케이스 처리

| 케이스 | 처리 |
|--------|------|
| 좌표 없음 (null) | 2단계 스킵 → 바로 신규 생성 |
| 50m 내 여러 장소 | 가장 가까운 1개에 매칭 |
| 수동 입력 (API 검색 안 함) | source='manual', external_id=null → 좌표 매칭만 |
| 동일 소스 재등록 | UNIQUE(source, external_id)로 DB 레벨 차단 |
