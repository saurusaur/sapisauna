dlrh # 탐색탭 Geolocation + Google Maps 지도뷰 플랜

**상태:** 계획 단계 (자기검토 3회 완료, 2026-05-24)
**작성:** 2026-05-24 (코덱스 초안) → v2 (1차) → v3 (UX 결정 명시) → v4 (클러스터링 V1 도입, cap 10km, denied 처리, 에러 경계) → v4.1 (코덱스 confirm 결정 반영: prefill=쿼리, 검증=mjs, Sentry 정책, 키 분리 정공법)
**예상 소요:** 2.5~3.5일 (PR1 1일 + PR2 1.5~2일)
**영향 범위:** Explore 화면, `/place` 장소 선택 화면, 장소 서비스, 신규 지도 컴포넌트, 환경변수
**명시적 제외:** Routes API / Route Matrix / 실제 이동시간, 미등록 장소 발견 CTA(별도 PR)

---

## 0. 목적과 두 가지 사용자 목표

이 플랜은 다음 두 사용자 목표를 한 흐름으로 묶는다.

1. **탐색 탭에서 “지금 내 근처 사우나” 발견** — 거리순 정렬 + 지도뷰 옵션
2. **신규 로그 작성 시 가까운 사우나 우선 노출** — `/place` 장소 선택 화면

코드베이스 검토 결과 ②의 진입점은 `src/app/place/page.tsx`이다. 이 페이지엔 “내 주변” 라벨이 이미 있지만 실제 동작은 `places.slice(0, 3)`(created_at DESC)에 그치므로 같은 PR에서 거리 정렬을 끼워 넣어야 가치 회수가 빠르다.

---

## 1. 핵심 판단

### Google API 역할 분리

| 기능 | 선택 | 이유 |
|---|---|---|
| 현재 위치 획득 | Browser Geolocation API | 위치 권한은 브라우저 표준. Google API 불필요 |
| 가까운 장소 정렬 | 우리 DB 좌표 + Haversine (클라이언트) | 좌표가 이미 DB에 있고 V1 데이터 규모는 작다 |
| 지도 표시 | Google Maps JavaScript API (Dynamic Maps SKU) | 타일/마커/상호작용에 적합, Naver Map은 JS API 한국 IP 제한 + 가입 비용 |
| 미등록 장소 발견 | Google Places Nearby Search (별도 PR) | UX/중복관리 복잡도 분리 |
| 실제 이동시간 | 제외 | 국내 커버리지/비용 대비 베타 가치 낮음 |

### 왜 V1에서 Places Nearby Search를 안 쓰는가

Places Nearby Search 결과는 Google POI라 우리 `/explore/[id]` 상세·저장·로그·SA-LIST에 연결되지 않는다. 탐색 메인 결과에 Google POI를 섞으면 즉시 중복 등록/병합 플로우를 설계해야 한다. V1은 **우리 DB 장소의 근처 탐색**에 집중하고 Google POI는 “근처에 등록된 곳이 없을 때 제안” 후속 PR로 둔다.

### 왜 클라이언트 Haversine이 V1에 옳은가

V0 데이터 규모를 우선 측정한다(Phase 0). 좌표 있는 장소가 1,000개 미만이면:

- DB 마이그레이션 0개
- 검색/필터 결과 배열 위에서 즉시 정렬
- 좌표 한 번 받으면 추가 RPC 호출 0
- 코드 변경 최소

수천 개를 넘으면 그때 RPC `find_places_by_distance`를 추가한다(Phase 후속).

---

## 2. 현재 코드 기반 (확인 완료)

| 항목 | 상태 | 위치 |
|---|---|---|
| `places.latitude/longitude` | `DECIMAL` (PostgREST는 string으로 직렬화 가능) | `supabase/001_schema.sql:48-49` |
| `usePlaces()` | 전체 + place_sources join 1회 fetch | `src/hooks/use-places.ts:12` |
| Explore 정렬 | `recommended | popular` 두 종 | `src/hooks/use-explore-filters.ts:5` |
| `/place` “내 주변” | 라벨만 있음, 실제는 created_at 기준 3개 | `src/app/place/page.tsx:38` |
| 중복탐지 RPC | 50m 반경 | `find_nearby_places` (`001_schema.sql:223`) |
| 서버용 Google Key | `GOOGLE_PLACES_API_KEY` (실제 검증: 일반 API key, **Application restrictions=None**, Maps JS API 호출도 가능한 상태) | `.env.local` |
| 기존 키 사용처 (서버) | `reverse-geocode.ts`, `forward-geocode.ts`, `api/places/search/route.ts` | 3곳 |
| 기존 키 사용처 (스크립트) | `bulk-register-places`, `migrate-existing-addresses`, `audit-manual-places`, `fix-missing-latlng`, `debug-jp-all`, `debug-components`, `verify-vs-google`, `sample-before-after` | 8곳 |
| 브라우저 Maps Key | **신규 발급 (보안상 분리, 사용성 영향 0)** | — |
| `place.latitude` 산술 사용처 | 0건(URL 템플릿 보간만) | `src/app/explore/[id]/page.tsx:265` |

요지: 좌표가 string으로 들어와도 현재는 표면 버그 없음. 거리 계산이 첫 산술 연산이므로 Phase 0 스파이크에서 직렬화 형태를 1회 확인하고 방어 추가한다.

---

## 3. UX 목표

### 리스트 모드 (Explore)

- 기본은 기존 탐색 UX 유지
- 정렬 토글에 `가까운` 추가
- 위치 허용 후:
  - 카드에 `1.2km` 직선거리 표시
  - 거리 오름차순(좌표 없는 장소는 뒤)
- 위치 거부/타임아웃:
  - 추천/인기 정렬 유지
  - 짧은 안내(`위치를 허용하면 가까운 순으로 볼 수 있어요`) 1회

### 지도 모드 (Explore)

- 검색바 아래 segmented control: `리스트` / `지도`
- 지도는 **검색/필터 적용 결과와 같은 장소 세트** 사용
- 마커 클릭 → 하단 미니 카드(상세 이동 / 저장 토글)
- 내 위치 마커는 장소 마커와 시각적으로 분리
- 지도 모드 진입 시 위치 자동 요청 안 함 — “내 위치” 버튼 또는 가까운 정렬 클릭 시 요청
- API key 없거나 maps JS 로딩 실패 → 자동 리스트 fallback

### `/place` 장소 선택 (로그 작성 흐름)

- 검색이 비어있고 위치 허용된 경우, **“최근 기록 장소”(2개) 다음**에 “내 주변”(거리순 상위 5개) 노출
- 위치 거부/실패 시 현재 동작(상위 3개) 유지
- 지도 모드는 도입하지 않는다(작성 흐름은 list-only로 단순 유지)

### UX 결정 — 모호함 제거 (v3·v4)

코덱스 자율 판단으로 어긋날 수 있는 결정들을 미리 못 박는다.

| 항목 | 결정 |
|---|---|
| **거리 cap (리스트 모드)** | **10km**. 10km 초과 장소는 거리순 정렬 결과에서 제외하지 않고, 라벨 글자색을 회색 톤(`text-stone-400`)으로 약화. 헤더는 추가하지 않는다(단순화) |
| **거리 cap (지도 모드)** | **cap 미적용**. 지도는 viewport 기반 + 클러스터링이 자연스럽게 처리. 10km 안팎 마커가 한 화면에 다 들어옴 |
| **거리 cap (`/place` 로그 작성)** | 10km 이내 거리순 상위 5개만. 결과 0건이면 “내 주변에 등록된 곳이 없어요. 직접 추가하기” CTA(좌표 prefill로 `/place/add` 이동) |
| **검색 + 거리 정렬** | 검색이 active일 때 nearby 정렬은 **검색 결과 안에서만** 거리 정렬한다. 검색 없을 때는 전체 장소에서. 두 정렬 우선순위(매치 vs 거리)를 섞지 않는다 |
| **마커 클릭 UX** | Google `InfoWindow`를 쓰지 않는다. 지도 하단에 `PlaceCard variant='minimal'` 미니 카드 1장(고정 위치, BottomNav 위). 마커 다시 클릭 / 빈 영역 탭으로 닫힘 |
| **마커 클러스터링 (V1)** | `@googlemaps/markerclusterer`로 도입. 줌 아웃 시 자동 그룹, 클러스터 클릭 시 줌 인 + 분리 |
| **지도 zoom** | 결과 N≥1이면 `useMap()` + `map.fitBounds(bounds)`로 모든 마커가 보이도록 적응형. minZoom=8 / maxZoom=17 cap. 결과 0이면 center=서울시청, zoom=11 |
| **Google POI 표시** | Cloud Console Map Style에서 `POI - Business` 카테고리를 OFF (다른 POI 유지) |
| **자기 위치 마커** | `<AdvancedMarker>`에 다른 색(파랑 계열) + 작은 점. 사우나 마커는 브랜드 primary |
| **위치 권한 'denied' 처리 (v4)** | `navigator.permissions.query({ name: 'geolocation' })`로 사전 조회. denied면 “가까운” 버튼 disabled + 라벨 “위치 권한 필요”, 클릭 시 “브라우저 설정에서 위치 권한을 켜주세요” 토스트 1회. 무한 클릭 방지 |
| **Maps 로딩 상태 (v4)** | Maps JS load 동안 placeholder(`<div>지도 불러오는 중...</div>` + 작은 스피너). vis.gl `useApiLoadingState()`로 상태 감지 |
| **Maps 에러 처리 (v4)** | `<ExploreMapView>`를 React error boundary로 감싸 throw 시 자동 리스트 모드 fallback + Sentry `map.load.fail` 이벤트. APIProvider `onError` 콜백도 같은 fallback 트리거 |

---

## 4. Phase 0 — 스파이크 (구현 직전 30분)

### 4-1. 좌표 직렬화 1회 확인

브라우저 콘솔 또는 임시 스크립트로:

```ts
const { data } = await supabase.from('places').select('latitude').limit(1).single()
console.log(typeof data.latitude, data.latitude)
```

- `'number'` → `Place` 타입과 일치, 방어 코드 단순 가드만
- `'string'` → `toPlace()` + distance util에 `Number()` 변환 필수

어느 쪽이든 distance util에는 `Number.isFinite()` 가드를 둔다(0 비용).

### 4-2. 데이터 볼륨 측정

```sql
SELECT
  count(*) FILTER (WHERE status='active') AS active_count,
  count(*) FILTER (WHERE status='active' AND latitude IS NOT NULL) AS active_with_coord
FROM places;
```

- `active_with_coord < 1000` → 클라이언트 정렬(이번 플랜 기본 경로)
- `1000–5000` → 클라이언트 정렬 + 다음 분기에 RPC 마이그레이션 백로그 등록
- `5000+` → V1에서 RPC 도입(거의 없을 시나리오)

결과는 PR 설명에 1줄로 기록.

---

## 5. 구현 계획

### Phase 1 — 위치 hook + 거리 유틸 (PR1)

#### `src/hooks/use-user-location.ts`

```ts
export type LocationStatus =
  | 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'error'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}
```

- `navigator.geolocation.getCurrentPosition()` 래핑
- 옵션: `{ enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 8000 }`
- 액션: `requestLocation()`, `clearLocation()`
- 좌표는 **모듈 스코프 변수(또는 React Context)에 캐시** — 페이지 이동 간 prompt 재요청 방지(`maximumAge` 5분과 함께 동작). `sessionStorage`까지는 불필요.
- `requestLocation()`은 **사용자 click 핸들러 안에서만 호출**한다는 규약을 hook 주석에 명시(useEffect 자동호출 금지)

#### `src/lib/geo/distance.ts`

```ts
export function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number | string | null; longitude: number | string | null }
): number | null

export function formatDistance(meters: number | null): string | null
```

규칙:
- 어느 한쪽이라도 좌표가 없거나 `Number.isFinite`가 false면 `null`
- `< 1000m` → `350m`, `>= 1000m` → `1.2km`
- 입력은 `number | string` 모두 받음(`Number()` 변환). PostgREST가 string으로 보내도 동작.

검증 스크립트 `scripts/check-distance.mjs`(node로 직접 실행, devDependency 추가 X):
- 서울역(37.5547, 126.9707) ↔ 강남역(37.4979, 127.0276) ≈ 8,500–8,800m
- string 좌표 입력 → 같은 값
- null/NaN 입력 → null

`distance.ts`는 ESM 형태로 작성(혹은 `.mjs`에서 동일 Haversine 로직 복제). 실행: `node scripts/check-distance.mjs`. AssertionError 발생 시 비-0 exit code.

### Phase 2 — Explore 거리정렬 + 카드 라벨 (PR1)

#### 2-1. SortType 확장

```ts
// src/hooks/use-explore-filters.ts
export type SortType = 'recommended' | 'popular' | 'nearby'
```

`EXPLORE.SORT.NEARBY = '가까운'` 라벨 추가(`src/constants/content.ts`).

#### 2-2. `places-service.ts` 좌표 정규화 (Phase 0 결과에 따라)

```ts
// toPlace() 안
const lat = row.latitude == null ? null : Number(row.latitude)
const lng = row.longitude == null ? null : Number(row.longitude)
return {
  ...,
  latitude: Number.isFinite(lat) ? lat : null,
  longitude: Number.isFinite(lng) ? lng : null,
}
```

#### 2-3. Explore page

`src/app/explore/page.tsx`:

```ts
const { location, status, requestLocation } = useUserLocation()

const distanceMap = useMemo(() => {
  if (!location) return null
  const map: Record<string, number | null> = {}
  for (const p of places) map[p.id] = distanceMeters(location, p)
  return map
}, [location, places])

// filteredPlaces 정렬 분기에 추가
if (sortType === 'nearby') {
  filtered.sort((a, b) => {
    const da = distanceMap?.[a.id] ?? Infinity
    const db = distanceMap?.[b.id] ?? Infinity
    if (da === db) return 0
    return da - db
  })
}
```

“가까운” 클릭 핸들러:
- 위치 없음 → `requestLocation()` 호출 + `sortType='nearby'` 설정. 좌표 도착 시 자동 재정렬(상태 변화로 `useMemo` 재계산).
- 거부/타임아웃 → 안내 토스트 1회, 정렬은 유지(거리 없는 결과는 모두 `Infinity`라 기존 순서 보존).

거리 cap 처리 (10km):
- 10,000m 초과 결과는 정렬에서 제외하지 않고, 라벨 색만 회색 톤으로(`distanceLabelMuted: true` prop을 PlaceCard에 추가).
- 검색이 active이면 nearby 정렬은 검색 결과 배열 위에서만 동작. 검색 비활성 시는 전체 장소에서.

권한 'denied' 분기:
```ts
const [permState, setPermState] = useState<'unknown' | 'prompt' | 'granted' | 'denied'>('unknown')
useEffect(() => {
  if (!('permissions' in navigator)) return
  navigator.permissions.query({ name: 'geolocation' })
    .then(p => {
      setPermState(p.state)
      p.onchange = () => setPermState(p.state)
    })
    .catch(() => {})
}, [])
```
- "가까운" 버튼은 `permState === 'denied'`일 때 disabled + 라벨 변경.
- click 핸들러는 denied일 때 토스트만 띄우고 `requestLocation()` 호출하지 않는다(prompt 안 뜸 → 무한 클릭 방지).

#### 2-4. PlaceCard 거리 라벨

`distanceLabel?: string | null` prop 추가. `short_address` 옆에 ` · 1.2km` 형태로 표시. 카드 높이 흔들림 방지를 위해 한 줄 영역 유지.

라벨 계산은 Explore에서 이미 만든 `distanceMap`을 `formatDistance`로 변환한 `Record<string, string>`을 prop으로 주입(PlaceCard는 위치를 모른다 → 책임 분리).

### Phase 2.5 — `/place` 거리정렬 (PR1, 사용자 목표 ②)

`src/app/place/page.tsx`:

- 같은 `useUserLocation` + `permState` 재사용
- 검색이 비었을 때만 동작
- 위치 fetching 중(1~3초): 기존 동작(`places.slice(0,3)`) 유지. 좌표 도착 시 “내 주변” 섹션으로 즉시 교체. 로딩 표시는 “내 주변” 라벨 옆 작은 dot 1개.

#### 2.5-1. 위치 도착 후 동작

```ts
const recentIds = new Set(recentPlaces.map(p => p.id))
const nearby = places
  .filter(p => p.latitude != null && p.longitude != null)
  .filter(p => !recentIds.has(p.id))             // recent 중복 제거
  .map(p => ({ place: p, d: distanceMeters(location, p) }))
  .filter(({ d }) => d != null && d <= 10_000)   // 10km cap
  .sort((a, b) => a.d! - b.d!)
  .slice(0, 5)                                   // 최대 5
```

- recent와 중복 제거 후 거리순 상위 **최대 5개**(부족하면 부족한 대로 노출, 빈자리 채우지 않음)
- 거리 라벨은 “내 주변” 섹션의 카드에만 표시. recentPlaces 카드는 거리 라벨 없음(섹션 의미는 “기억 기반”)
- 1km 이내 강조 등 추가 위계는 두지 않음(과한 정보)

#### 2.5-2. 결과 0건 처리

10km 이내 + recent 제외 결과가 0이면 빈 상태:

```
🔍  내 주변에 등록된 곳이 없어요
    [직접 추가하기]    ← /place/add로 사용자 좌표 prefill
```

좌표 prefill은 **쿼리 파라미터** `/place/add?lat=...&lng=...`로 전달한다(결정 완료). `/place/add` 페이지에서 `useSearchParams()`로 수신 후 기존 add 플로우의 좌표 입력란에 채운다. localStorage 방식은 의도치 않은 다음 진입 시 발동 위험이 있어 사용하지 않는다.

#### 2.5-3. 권한별 분기

| 상태 | 동작 |
|---|---|
| `granted` | 위 2.5-1 적용. “내 주변” 라벨 자동 표시 |
| `prompt`(미요청) | 현재 동작(`slice(0,3)`) + “내 주변” 라벨 옆 `위치 허용` 작은 액션. click 시 `requestLocation()` |
| `denied` | 현재 동작 + 한 줄 안내(`브라우저 설정에서 위치 권한을 켜주세요`). 추가 prompt 시도 X |
| `unavailable`/`timeout`/`error` | 현재 동작 + 한 줄 안내(`위치를 가져올 수 없어요`) |

click 핸들러에서만 `requestLocation()` 호출(자동 호출 금지).

이 한 변경이 사용자가 가장 자주 도는 흐름(주 5–10회)의 가치를 만든다.

### Phase 3 — Google Maps 지도뷰 (PR2)

#### 3-1. 환경변수

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAP_ID=
```

`.env.example`도 동기화. 키 없을 때:
- `<Map>` 컴포넌트는 mount하지 않음
- segmented control의 `지도` 버튼은 disabled + tooltip(`준비 중`)

키 발급/설정 (Google Cloud Console) — v4.1 결정 사항:

**왜 키 분리가 정공법인가**
- Google API key는 “Application restrictions”를 한 번에 한 종류만 선택 가능(`None` / `HTTP referrers` / `IP addresses` / `Android` / `iOS`).
- 서버 호출엔 referrer 헤더가 없어 referrer 제한이 켜지면 깨짐 → 기존 키엔 referrer 못 켬.
- Vercel serverless는 IP가 가변이라 IP 제한도 사실상 불가 → 기존 키는 `None` 유지가 강제.
- 결과: 한 키로 서버+브라우저 보안 둘 다 충족 불가능. 키 분리가 유일한 안전 경로(Stripe·Mapbox 등 모든 SaaS의 표준 패턴).

**기존 키** `GOOGLE_PLACES_API_KEY` (코드 변경 0)
- Application restrictions: `None` 유지 (Vercel serverless 특성상 강제)
- **API restrictions** 추가: Geocoding API + Places API "두 개만" 허용 (도용 시 피해 한도 축소)
- 코드·기능 영향: 0. `.env` 변수명·값 모두 그대로

**신규 키** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (브라우저 전용)
- Application restrictions: HTTP referrers — `http://localhost:3000/*`, `https://*.vercel.app/*`, 프로덕션 도메인(있으면)
- API restrictions: Maps JavaScript API "하나만" (Phase 5에서 Places API New 필요해지면 그때 추가)

**Map ID** `NEXT_PUBLIC_GOOGLE_MAP_ID` (1회 생성, 무료)
- Map type: JavaScript / Vector
- Map Style 편집 → POI - Business 카테고리 OFF (Google이 띄우는 카페·식당 마커 제거 → 사우나 마커와 시각적 분리)
- `AdvancedMarker` 사용 시 필수(미지정 시 콘솔 경고 + 레거시 핀 fallback)

#### 3-2. 패키지

```bash
npm i @vis.gl/react-google-maps @googlemaps/markerclusterer
```

선택 이유:
- `@vis.gl/react-google-maps` — Google이 권장하는 React 통합 라이브러리, App Router 호환
- `@googlemaps/markerclusterer` — vis.gl는 클러스터링 자체 컴포넌트가 없어 Google 공식 라이브러리를 같이 사용. peer 의존성 없음

#### 3-2-1. 클러스터링 통합 패턴

vis.gl는 React 컴포넌트지만 markerclusterer는 imperative API라 `useEffect`로 wiring한다.

```tsx
'use client'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { useMap } from '@vis.gl/react-google-maps'

function ClusteredMarkers({ places, onSelectPlace }: Props) {
  const map = useMap()
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({})
  const clusterer = useRef<MarkerClusterer | null>(null)

  useEffect(() => {
    if (!map) return
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map })
    }
  }, [map])

  useEffect(() => {
    clusterer.current?.clearMarkers()
    clusterer.current?.addMarkers(Object.values(markers))
  }, [markers])

  // <AdvancedMarker> ref callback으로 markers state 채움
  return (
    <>
      {places.map(p => (
        <AdvancedMarker
          key={p.id}
          position={{ lat: p.latitude!, lng: p.longitude! }}
          ref={(m) => setMarkerRef(p.id, m)}
          onClick={() => onSelectPlace(p.id)}
        />
      ))}
    </>
  )
}
```

`setMarkerRef`는 `markers` state에 `{ [placeId]: markerInstance }` 형태로 등록·해제하는 헬퍼. 마커 unmount 시 `addMarker`/`removeMarker` 호출.

#### 3-3. `src/components/features/explore-map-view.tsx`

```ts
'use client'
import dynamic from 'next/dynamic'
// APIProvider/Map은 클라이언트 전용 + 지도 모드일 때만 로드
```

전체 컴포넌트를 `next/dynamic(..., { ssr: false })`으로 lazy import해서, 리스트만 쓰는 사용자에게는 maps JS(약 600KB)가 다운로드되지 않게 한다.

```tsx
<APIProvider apiKey={KEY}>
  <Map
    mapId={MAP_ID}
    defaultCenter={initialCenter}
    defaultZoom={11}
    gestureHandling="greedy"
    disableDefaultUI
    zoomControl
    style={{ width: '100%', height: 'calc(100dvh - 220px)' }}
  >
    <FitBoundsToPlaces places={placesWithCoord} userLocation={location} />
    {placesWithCoord.map(p => <AdvancedMarker ... onClick={() => setSelectedId(p.id)} />)}
    {location && <AdvancedMarker pin="user" position={location} />}
  </Map>
  {selectedId && (
    <div className="fixed bottom-20 left-3 right-3 z-30">
      <PlaceCard variant="minimal" place={placesById[selectedId]} ... />
    </div>
  )}
</APIProvider>
```

`FitBoundsToPlaces` 내부:
```ts
const map = useMap()
useEffect(() => {
  if (!map || places.length === 0) return
  const bounds = new google.maps.LatLngBounds()
  places.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }))
  if (userLocation) bounds.extend(userLocation)
  map.fitBounds(bounds, 64) // 64px padding
  // zoom cap
  const z = map.getZoom() ?? 13
  if (z > 17) map.setZoom(17)
  if (z < 8) map.setZoom(8)
}, [map, places, userLocation])
```

옵션 결정:
- 초기 center: `userLocation` → 첫 결과 좌표 → 서울 시청(37.5666, 126.9784)
- 초기 zoom 11 + `fitBounds`로 즉시 보정
- `gestureHandling="greedy"` — 모바일 한 손가락 이동
- `disableDefaultUI` + `zoomControl`만 — 화면 절약
- height — `calc(100dvh - 220px)` (헤더 + 검색바 + 필터 + BottomNav 합) 모바일 검증 후 미세조정
- 선택된 마커의 미니 카드는 BottomNav(`bottom-16`) 위 `bottom-20` 고정. 마커 재클릭 또는 빈 지도 탭으로 닫힘.

#### 3-3-1. Map Style ID 설정 (Cloud Console)

Map ID 생성 시 다음을 적용:
- **Map type**: Roadmap
- **POI - Business**: OFF (Google이 띄우는 카페·식당 마커 제거 → 우리 사우나 마커와 시각적 분리)
- 그 외 POI(공원, 지하철역 등)는 유지 — 사용자 위치 인지에 도움

#### 3-4. 마커 수 — 클러스터링이 처리

V1에 클러스터링을 도입했으므로 마커 cap은 두지 않는다. 좌표 있는 장소 전체를 마커로 띄우고 줌 레벨에 따라 자동 그룹.

성능 검증 기준(Phase 0 측정 결과 기반):
- ~500개 미만: 부드럽게 동작 예상
- 500개+: 모바일에서 첫 렌더 끊김 가능 → 그때 viewport bounds 기반 마커 필터링 도입(별도 백로그)

#### 3-5. 로딩/에러 처리

```tsx
import { useApiLoadingState, APILoadingStatus } from '@vis.gl/react-google-maps'
import { captureError } from '@/lib/error-logger'

function MapWithLoadingState() {
  const status = useApiLoadingState()
  if (status === APILoadingStatus.LOADING) return <MapSkeleton />
  if (status === APILoadingStatus.FAILED) {
    captureError(new Error('map.load.fail'), { label: 'map.load.fail' })
    return null  // 부모가 listMode로 fallback
  }
  return <Map ... />
}
```

`<ExploreMapView>` 전체를 React error boundary로 감싸 throw 시에도 자동 fallback. 부모(Explore page)는 이 에러를 받아 `viewMode='list'`로 강제 전환 + 토스트.

Sentry 정책 (확정):
- PR1: Sentry 이벤트 0건 (토스트만으로 사용자 안내)
- PR2: `map.load.fail` 1건만 `captureError`로. `geo.permission.denied`는 토스트만, Sentry 이벤트 X.
- 추후 PR3 의사결정 시점에 `geo.permission.granted`/`nearby_sort.click` 등 추가 검토.

### Phase 4 — segmented control 통합 (PR2)

`src/app/explore/page.tsx`:

```ts
const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
```

UI:
- 검색바 아래에 segmented control(`리스트` / `지도`)
- 지도 모드에서는 검색/필터만 유지하고 정렬 컨트롤은 숨김
- 지도 모드 진입 시 위치 자동 요청 안 함. `내 위치로 보기` 토스트 후 위치 요청
- 지도 모드 빈 결과 → “이 영역에는 등록된 장소가 없어요. 직접 추가하기” → `/place/add`

### Phase 5 — 후속(별도 PR3, 데이터 보고 결정)

미등록 장소 발견 CTA — Places Nearby Search (New). PR1·PR2 머지 후 1주 데이터(권한 허용률, 거리 정렬 클릭률, 빈 결과 빈도)를 보고 진행 여부 결정.

본 플랜에 상세 설계는 포함하지 않는다.

TODO: `지금 영업중` 필터는 PR2 범위에서 제외. 현재 DB에는 `is_24h`만 있고 요일별 영업시간/Google `openNow`가 저장되어 있지 않다. 후속 PR에서 서버 API route가 기존 서버용 `GOOGLE_PLACES_API_KEY`로 Google Place Details `currentOpeningHours.openNow`를 상위 N개 또는 지도 bounds 내 장소에만 조회하고 짧게 캐싱하는 방식으로 검토한다.

---

## 6. PR 분할

| PR | 내용 | 환경 의존 | 위험 |
|---|---|---|---|
| PR1 | Phase 0 결과 + Phase 1·2·2.5 | 없음 | 낮음 |
| PR2 | Phase 3·4 (지도 + segmented control) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `MAP_ID` | 중 |
| PR3 | Phase 5 (별도, 1주 데이터 본 뒤) | 추가 키 검토 | 높음 |

PR1 단독으로 BACKLOG `[기능] 장소 탐색 강화`의 가치 대부분을 회수한다. PR2는 키 발급이 늦어도 PR1을 차단하지 않는다.

---

## 7. DB/RPC 결정

V1: **클라이언트 Haversine** (Phase 0의 데이터 볼륨 측정 결과 1,000개 미만일 때 확정).

V1.5(필요 시): 별도 RPC `find_places_by_distance(lat, lng, limit)` — 중복탐지용 `find_nearby_places`와 분리. 본 PR에 포함 안 함, 백로그.

---

## 8. 환경변수 요약

```env
# 기존 (v4.1: API restrictions만 Geocoding+Places로 좁히고, 변수·값은 그대로)
GOOGLE_PLACES_API_KEY=...                     # 서버용. Application restrictions=None 유지.

# 신규(PR2)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...          # 브라우저용. HTTP referrer 제한 + Maps JS API only.
NEXT_PUBLIC_GOOGLE_MAP_ID=...                # AdvancedMarker용 Map Style ID. 무료.
```

`.env.example` 신규 생성(없으면) 또는 갱신. 키 없는 환경에서 `npm run build`가 깨지지 않도록 코드는 모두 optional 처리.

`.env.local`과 Vercel project Environment Variables 양쪽에 동일 추가. Production + Preview 둘 다 적용.

---

## 9. Acceptance Criteria

### 기능
- 위치 허용 시 Explore에서 `가까운` 정렬이 동작하고 카드에 거리 라벨이 표시된다.
- 10km 초과 결과는 거리 라벨이 회색 톤으로 약화 표시된다.
- 검색이 active일 때 nearby 정렬은 검색 결과 안에서만 거리 정렬한다.
- `/place`(로그 작성)에서 위치 허용 시 “내 주변” 섹션이 10km 이내 거리순 최대 5개(recent와 중복 제거)로 정렬된다.
- `/place`의 “내 주변” 섹션은 recentPlaces와 중복되는 장소를 표시하지 않는다.
- `/place`에서 10km 이내(+ recent 제외) 결과 0건이면 빈 상태 + 직접 추가 CTA가 좌표 prefill로 동작한다.
- `/place`에서 위치 fetching 중에도 기존 동작(상위 3개)이 유지되어 화면이 비지 않는다.
- 위치 권한 'denied' 상태에서 “가까운” 버튼이 disabled로 바뀌고, 클릭 시 안내 토스트만 표시된다(prompt 무한 시도 없음).
- 지도 모드에서 마커가 클러스터링되며, 줌 인 시 분리된다.
- 지도 모드에서 마커 클릭 시 화면 하단에 PlaceCard minimal 미니 카드가 떠서 상세 이동이 가능하다.
- 지도 진입 시 `fitBounds`로 모든 결과 마커가 한 화면에 들어오게 자동 조정된다(zoom 8~17 cap).
- Maps JS 로딩 중 placeholder가 표시되고, 로딩 실패 시 자동 리스트 모드로 fallback된다.
- Cloud Console Map Style에서 POI Business가 OFF되어 Google 비즈니스 마커가 보이지 않는다.

### 안전망
- 위치 거부/실패 시 기존 탐색·`/place` UX가 깨지지 않는다.
- API key 없거나 Maps JS 로딩 실패 시 앱이 크래시하지 않고 자동 리스트 모드로 fallback.
- API key 미설정 환경(CI, 로컬 미설정)에서 `npm run build`가 통과한다.
- 좌표가 string으로 들어오는 케이스에서도 거리 계산이 NaN을 반환하지 않는다.

### 비용/성능
- Explore 외 페이지(home, log, sa-list, history, settings, `/place`)에서 `maps.googleapis.com` 네트워크 호출이 발생하지 않는다(devtools Network 검증).

### 범위
- Routes API, Route Matrix, Directions, 실제 이동시간은 구현하지 않는다.
- V1에 viewport bounds 기반 마커 필터링은 도입하지 않는다(500개+ 시 검토).
- V1에 Places Nearby Search는 도입하지 않는다.

---

## 10. 테스트 계획

### 자동
- `npm run lint`, `npm run build`
- `node scripts/check-distance.mjs` (devDep 0, 서울역↔강남역, string 좌표, null 입력)

### 수동
- 위치 허용 / 거부 / timeout 각 시나리오 — Explore와 `/place`
- 검색·필터·거리순 조합 정렬 결과
- 지도 모드 진입 시 maps JS 1회 로드, 다른 페이지 이동 후 재진입 시 추가 로드 0
- 다른 페이지에서 maps.googleapis.com 호출 0건 확인
- 모바일 viewport(iOS Safari, Android Chrome)에서 검색바·필터·지도·BottomNav 겹침 없음
- API key 미설정 상태로 `npm run build` 성공 + UI에 “지도 준비 중” 표시

---

## 11. 리스크와 완화 (자기검토 통과 항목)

| 리스크 | 완화 |
|---|---|
| Maps JS Dynamic Maps SKU 비용 폭발(10K/월 무료, $7/1K 이후) | `<APIProvider>`를 Explore 지도 모드에서만 mount, `next/dynamic`으로 분리 |
| 브라우저 Maps API key 도용 | 별도 key + HTTP referrer 제한 + Maps JS API restriction |
| PostgREST가 numeric을 string으로 반환 | Phase 0에서 1회 확인, distance util은 `Number()` + `Number.isFinite` 방어 |
| iOS Safari PWA 권한 prompt 무응답 | `requestLocation()`은 click 핸들러 안에서만 호출(hook 주석으로 강제) |
| 권한 영구 거부 사용자 — 같은 prompt 반복 시도 | `permissions.query()` 사전조회로 denied 감지, 버튼 disabled + 토스트만 |
| 지도 모드 마커 폭증 시 모바일 끊김 | V1에 `markerclusterer` 도입. 500개 넘어가면 viewport bounds 필터 백로그 |
| Maps JS load 실패 시 페이지 크래시 | error boundary + `useApiLoadingState()` FAILED 분기로 자동 list fallback |
| `/place`에서 10km 이내 결과 0건 | 빈 상태 + 직접 추가 CTA(좌표 prefill)로 등록 유도 |

### 자기검토에서 제외한 항목 (의도적으로 V1에 포함 안 함)

- `sessionStorage` 좌표 캐시 — 브라우저 `maximumAge: 5min` + 모듈 스코프 캐시로 충분. 추가 저장소는 오버엔지니어링.
- 정식 테스트 인프라(Jest, tsx) — 새 devDep 추가 없이 `node scripts/check-distance.mjs`로 검증.
- Sentry breadcrumb 다종 — PR1엔 0건(토스트만), PR2엔 `map.load.fail` 1건만. PR3 의사결정 시 `nearby_sort.click`, `geo.permission.granted/denied` 추가 검토.
- 페이지네이션·viewport bounds 마커 필터 — 좌표 있는 장소 500개 넘어가면 도입(별도 백로그).
- 저장된 장소 마커 색상 구분 — V1엔 통일 색. 디자인 단계에서 별도 결정.
- 위치 정확도(`accuracy`) UI 노출 — 일반 사용자 혼란. 내부 모니터링용으로만(추후).

---

## 12. 작업 체크리스트 (코덱스 구현용)

### PR1 — Geolocation + 거리 정렬

- [ ] Phase 0 스파이크: 좌표 직렬화 + 데이터 볼륨 1줄 기록
- [ ] `src/hooks/use-user-location.ts` 신규 (모듈 스코프 캐시 + `permState` 사전조회)
- [ ] `src/lib/geo/distance.ts` 신규 + 검증 스크립트(`scripts/check-distance.mjs`, `node`로 실행, devDep 0)
- [ ] `src/lib/places-service.ts` `toPlace()` 좌표 `Number()` 정규화
- [ ] `src/hooks/use-explore-filters.ts` `SortType` 확장
- [ ] `src/constants/content.ts` `EXPLORE.SORT.NEARBY` 추가
- [ ] `src/components/features/filter-controls.tsx` 가까운 버튼 + denied 상태 disabled + 클릭 핸들러
- [ ] `src/components/features/place-card.tsx` `distanceLabel` + `distanceLabelMuted` prop
- [ ] `src/app/explore/page.tsx` 거리 맵 + nearby 정렬 + 10km cap muted + 검색결과 내 거리정렬
- [ ] `src/app/place/page.tsx` 내 주변 10km 이내 + recent 중복 제거 + 거리순 최대 5 + 빈 상태 직접 추가 CTA(좌표 prefill)
- [ ] `src/app/place/add/page.tsx` 좌표 prefill 수신(`?lat=&lng=` 쿼리 파라미터) — 기존 코드 영향 최소화
- [ ] 수동 시나리오 9종 통과(허용/거부/timeout/denied/검색+가까운/검색없음+가까운/`/place` 결과있음/`/place` 0건/`/place` recent와 중복)

### PR2 — Google Maps 지도뷰

- [ ] Cloud Console: 브라우저 키 발급(referrer 제한) + Map ID 생성 + Map Style에서 POI Business OFF
- [ ] `.env.local` / `.env.example` 갱신
- [ ] `npm i @vis.gl/react-google-maps @googlemaps/markerclusterer`
- [ ] `src/components/features/explore-map-view.tsx` (`next/dynamic`, `fitBounds`, 클러스터링, 로딩/에러 상태 포함)
- [ ] React error boundary로 감싸 자동 list fallback
- [ ] `map.load.fail`만 `captureError` 1건. 그 외 Sentry 이벤트 추가 X
- [ ] 마커 클릭 시 하단 PlaceCard minimal 미니 카드
- [ ] `src/app/explore/page.tsx` segmented control + viewMode
- [ ] 다른 페이지 maps.googleapis.com 호출 0건 검증
- [ ] 빈 결과 / 키 미설정 / 로딩 실패 / API 에러 fallback 검증
- [ ] 클러스터링 동작 검증(여러 줌 레벨)

---

## 참고 문서

- MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API
- @vis.gl/react-google-maps: https://visgl.github.io/react-google-maps/
- Maps JavaScript API 비용: https://developers.google.com/maps/documentation/javascript/usage-and-billing
- Maps Platform 가격: https://developers.google.com/maps/billing-and-pricing/pricing
- Map ID(Advanced Markers): https://developers.google.com/maps/documentation/javascript/advanced-markers/start
- Places Nearby Search(후속): https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby
