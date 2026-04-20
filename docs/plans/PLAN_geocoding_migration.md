# Geocoding 마이그레이션 플랜 — formatted_address 파싱 → Google Geocoding API

**상태:** 계획 단계
**작성일:** 2026-04-20
**예상 소요:** 3~4시간
**영향 범위:** 10~12 파일, DB 1 컬럼 추가

## Context

현재 `/api/places/search`가 Google Text Search legacy를 호출해 받은 `formatted_address` 문자열을 regex로 파싱해 `country_code`를 추출. Google 공식 문서 명시: "formatted_address 포맷 일관성 보장 안 됨, 파싱 금지, `address_components`를 써라". 실제로 일본/한국 장소가 `"Japan, 〒210-..."`식 reversed order로 반환되면서 파싱 실패 → 기본값 `'KR'` 오염 → 일본 장소가 국내로 인식되어 네이버 지도 링크 표시, 타투 모달 미트리거 등 버그.

**해결 방향**: Text Search 응답은 `address_components` 없음(유료 Details API 필요) → Google **Geocoding API reverse** (2025-03 이후 Essentials 티어 **월 10,000회 무료**) 로 lat/lng를 역추적해 구조화된 필드를 얻는다. 우리 월 등록량 ~100건 대비 100× 여유 → 실질 $0 영구.

## 핵심 설계

- **Text Search 유지**: POI 검색(이름+lat/lng+place_id)는 그대로
- **Reverse Geocoding 신규**: 유저가 등록 폼 진입 시점에 1회 호출, `address_components` 획득
- **`address_components` → 구조화 파생**:
  - `country_code`: `country.short_name` (ISO 2-letter)
  - `city`: `locality.long_name` (없으면 `postal_town.long_name`)
  - `full address`: components를 universal order로 재조립 (dedup + POI-name 배제)
- **DB 영속 저장**: 결과를 `places.country_code`, `places.city`, `place_sources.address_original`에 1회 INSERT → 이후 모든 조회는 SELECT만
- **short_address**: 저장 안 함, read-time `{city}, {COUNTRY_NAME[cc]}` 조합
- **기존 `extractCountryCode`, `generateShortAddress` 제거**

## 변경 파일

### 1. DB 마이그레이션

**`supabase/021_place_city.sql`**
```sql
-- 021: places 테이블에 city 컬럼 추가 (Geocoding 마이그레이션 일환)
-- 기존 country_code 컬럼 재사용 (오염값은 마이그레이션 스크립트로 교정)

ALTER TABLE places ADD COLUMN IF NOT EXISTS city TEXT;
```

### 2. 신규 모듈

**`src/lib/geo/address-builder.ts`** — components → clean address 빌더
```ts
export interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface ResolvedAddress {
  country_code: string   // ISO 2-letter ('JP', 'KR', 'US', ...)
  city: string | null    // locality or postal_town
  address: string        // full cleaned address (one-line)
}

export function resolveAddress(
  components: AddressComponent[],
  placeName?: string
): ResolvedAddress {
  const getLong = (type: string) =>
    components.find(c => c.types.includes(type))?.long_name
  const getShort = (type: string) =>
    components.find(c => c.types.includes(type))?.short_name

  const country_code = (getShort('country') ?? '').toUpperCase()
  const city = getLong('locality') ?? getLong('postal_town') ?? null

  // universal order 재조립
  const parts: string[] = []
  const seen = new Set<string>()
  const add = (s: string | undefined) => {
    if (!s) return
    if (seen.has(s)) return
    seen.add(s)
    parts.push(s)
  }

  // 1. Street: number + route (공백 결합)
  const num = getLong('street_number')
  const route = getLong('route')
  if (num || route) {
    add([num, route].filter(Boolean).join(' '))
  } else {
    // JP-style: premise 중 POI 이름 아닌 것만
    const premises = components
      .filter(c => c.types.includes('premise'))
      .map(c => c.long_name)
      .filter(n => !isLikelyPOIName(n, placeName))
    if (premises.length) add(premises.join(' '))
  }

  // 2. Sublocality (most specific → broad)
  for (const t of [
    'sublocality_level_2',
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
  ]) {
    add(getLong(t))
  }

  // 3. City (locality 또는 postal_town)
  add(city ?? undefined)

  // 4. Admin level 1 — city와 동일 이름이면 skip
  const admin1 = getLong('administrative_area_level_1')
  if (admin1 && admin1 !== city) add(admin1)

  // 5. Country (long name)
  add(getLong('country'))

  return { country_code, city, address: parts.join(', ') }
}

function isLikelyPOIName(value: string, placeName?: string): boolean {
  if (!placeName) return false
  const v = value.toLowerCase()
  const n = placeName.toLowerCase()
  return v === n || v.includes(n) || n.includes(v)
}
```

**`src/lib/geo/reverse-geocode.ts`** — Geocoding API wrapper
```ts
export async function reverseGeocode(
  lat: number,
  lng: number,
  placeName?: string
): Promise<ResolvedAddress | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${key}`
  const resp = await fetch(url)
  if (!resp.ok) return null
  const data = await resp.json()
  if (data.status !== 'OK') return null

  const first = data.results?.[0]
  if (!first) return null

  return resolveAddress(first.address_components, placeName)
}
```

**`src/constants/country-names.ts`** — ISO → display name 매핑 (한국어/영어 택1, 현재 영어 통일)
```ts
export const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan', KR: 'South Korea', US: 'USA',
  HK: 'Hong Kong', TW: 'Taiwan', GB: 'UK',
  DE: 'Germany', FR: 'France', IT: 'Italy',
  ES: 'Spain', NL: 'Netherlands', CA: 'Canada',
  // 필요 시 추가
}
```

### 3. API Route 신규

**`src/app/api/places/reverse-geocode/route.ts`**
- GET 파라미터: `lat`, `lng`, `name` (optional placeName)
- 서버사이드에서 `reverseGeocode(lat, lng, name)` 호출
- JSON 응답: `{ country_code, city, address }`
- 에러 시 `{ country_code: '', city: null, address: '' }` fallback

### 4. 기존 파일 수정

**`src/app/api/places/search/route.ts`** — 정리
- `extractCountryCode` 제거
- `generateShortAddress` 제거 (해외 경로)
- Google 결과에서 `countryCode: ''`, `shortAddress: formatted_address` 그대로 반환 (임시 — 최종은 reverse-geocode가 덮어씀)
- Naver 결과는 그대로 (`countryCode: 'KR'` 유지)

**`src/app/place/add/page.tsx`**
- 컴포넌트 mount 시 selectedPlace가 `source === 'google'`이면 `/api/places/reverse-geocode?lat=..&lng=..&name=..` 호출
- 응답으로 country_code, city, address 상태 업데이트
- 저장 submit 시 해당 값들 DB insert payload에 포함
- JP 타투 모달 분기는 reverse-geocode 응답의 country_code 사용

**`src/lib/places-service.ts`**
- `country_code || 'KR'` fallback 제거 → `country_code || ''`
- `toPlace` 매핑에 `city` 필드 추가
- `generateShortAddress` 호출부를 새 함수로 교체 (아래)
- 신규 export: `getShortAddress(city, country_code)` = `${city}, ${COUNTRY_NAMES[cc] ?? cc}`

**`src/lib/logs-service.ts`**
- `place_country_code: ... || 'KR'` fallback 제거

**`src/types/index.ts`**
- `Place` 인터페이스에 `city: string | null` 추가
- `LogWithPlace`는 조인 필드라 영향 없음 (필요 시 `place_city` 추가 검토)

**`src/app/explore/[id]/page.tsx`** 및 리스트 뷰
- `place.short_address` 참조를 `getShortAddress(place.city, place.country_code)`로 교체
- Naver 지도 링크 조건(`country_code === 'KR'`) 유지

### 5. 기존 데이터 교정 스크립트

**`scripts/migrate-existing-addresses.ts`**
- Supabase admin client로 `places` 전수 조회
- 각 row: lat/lng 있으면 `reverseGeocode(lat, lng, name)` 호출
- 결과로 `places.country_code`, `places.city` UPDATE + `place_sources.address_original` UPDATE
- 멱등성: 이미 올바른 country_code (`!= 'KR'` 또는 GeoNames로 교차검증) 있으면 skip 옵션
- `--dry-run` 지원
- API 호출 rate limit 고려 (queries-per-second ~50 안전)

## 실행 순서

```
Phase 1: 기반 준비 (GCP + SQL)
  a. GCP 콘솔: Geocoding API 활성화
  b. GOOGLE_PLACES_API_KEY에 Geocoding API 추가 (제한 설정)
  c. Cloud Billing 예산 알림 $1 설정 (안전장치)
  d. 021_place_city.sql 적용 (Supabase)

Phase 2: 코드 구현
  a. src/lib/geo/{address-builder,reverse-geocode}.ts 신규
  b. src/constants/country-names.ts 신규
  c. /api/places/reverse-geocode route 신규
  d. /api/places/search 정리 (extractCountryCode 제거)
  e. place/add/page.tsx 수정 (mount 시 reverse-geocode 호출)
  f. 서비스 레이어 fallback 제거
  g. 렌더 지점 short_address 로직 교체
  h. types 업데이트
  i. 타입 체크 + 린트

Phase 3: 데이터 교정
  a. 변환 스크립트 dry-run → 결과 검토
  b. 실제 실행 → 샘플 5건 sanity check
  c. 프로덕션 배포 (코드 + DB)

Phase 4: 검증
  a. 해외 (Google) 장소 신규 등록 테스트: JP/US/EU 각 1건
  b. 기존 장소 상세 페이지 열기: country_code·city·address 정상
  c. Naver 지도 링크 (KR 장소만) / Google 지도 링크 정상
  d. JP 타투 모달 정상 트리거
  e. Cloud Console에서 Geocoding API 호출량 확인 (수십~수백)

Phase 5: 마무리
  a. docs/plans/archive/ 로 플랜 이동
  b. BACKLOG.md Done 반영
  c. Cloud Billing 모니터링 1주일
```

## 검증 체크리스트

- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run lint` 신규 경고 없음
- [ ] 신규 JP 사우나 등록 → country_code='JP', address 재조립 정상
- [ ] 신규 US 사우나 등록 → country_code='US', `"... , USA"` 정상
- [ ] 신규 DE/EU 사우나 등록 → country_code/city 정상
- [ ] 기존 오염 데이터 교정 후 상세 페이지 정상 (오매칭 'KR' → 실제 JP 등)
- [ ] JP 타투 모달 트리거
- [ ] Naver 지도 링크는 `country_code === 'KR'`일 때만
- [ ] Google 지도 링크 place_id 경로 정상 (기존 유지)
- [ ] Cloud Console Geocoding 호출량 모니터링 (월 100 내외)

## 롤백 전략

| 단계 | 롤백 |
|---|---|
| 021 SQL 적용 후 | `ALTER TABLE places DROP COLUMN city` |
| 코드 배포 후 이슈 | `git revert <commit>` |
| 교정 스크립트 후 오염 | `places` 테이블 PG dump 백업을 스크립트 실행 전에 받아둠 |

**안전장치:** 교정 스크립트 실행 직전에 `supabase db dump > backup_20260420.sql` 수동 실행 (Supabase 관리 대시보드에서도 가능).

## 리스크 및 주의

1. **Geocoding API 활성화 누락**: GCP 콘솔에서 API를 enable 안 하면 404. 체크리스트 Phase 1에 명시됨
2. **API 키 오남용 방지**: HTTP referer 제한 + Geocoding API only 제한 설정
3. **10K 무료 한도**: 월 100건 대비 100× 여유지만, 교정 스크립트 실행 시 1회 대량 호출 (기존 건수 × 1) → 한도 내. 실행 후 월 사용량 모니터링
4. **Rate limit**: Geocoding API는 공식적으로 50 QPS. 교정 스크립트는 250ms 간격 둬서 안전
5. **`address_components` 누락 케이스**: 간혹 Geocoding이 정확한 결과 못 찾으면 빈 응답. fallback으로 기존 formatted_address + country_code='' 저장 (추후 수동 교정 가능)
6. **Google 약관 변경**: 10K 무료 한도가 축소될 가능성 (현재 기준 2025-03 개편). 예산 알림 $1로 조기 감지

## 미결정 사항 (확정 필요)

- [x] Country display 언어 — **영어 통일** (`'Japan'`, `'USA'`, `'South Korea'`). 한국어 원할 시 `COUNTRY_NAMES` 맵 교체로 쉽게 전환 가능
- [x] City 추출 우선순위 — **locality → postal_town** (일본 Tokyo 중심부 "Minato City" 이슈는 실사용 확인 후 별도 조정)
- [x] 기존 데이터 교정 — **즉시 실행** (유저 데이터 적음)
- [x] Fallback 색/city 기본값 — **country_code=''/city=null 허용**, UI에서 조건 분기 유지

## 예상 소요 시간

- Phase 1 (GCP+SQL): 20분
- Phase 2 (코드): 1.5~2시간
- Phase 3 (교정): 30분
- Phase 4 (검증): 30분
- Phase 5 (정리): 10분
- **총 3~4시간**

## 진행 단계 (커밋 단위)

1. 플랜 문서 + 021 SQL + GCP 체크리스트
2. `src/lib/geo/*` 신규 (address-builder + reverse-geocode) + 단위 테스트
3. `/api/places/reverse-geocode` route + types 업데이트
4. `/api/places/search` 정리 + place/add 호출 로직
5. 서비스 레이어 + 렌더 지점 short_address 교체
6. 기존 데이터 교정 스크립트 + 실행
7. 검증 완료 → 플랜 archive
