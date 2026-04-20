/**
 * Google Geocoding API address_components → 구조화/정제된 주소 추출
 *
 * - country_code: country.short_name (ISO 2-letter)
 * - city: locality 또는 postal_town(UK) 순
 * - address: universal order로 재조립 (dedup + POI-name 배제)
 *
 * 관련 플랜: docs/plans/PLAN_geocoding_migration.md
 */

export interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface ResolvedAddress {
  country_code: string      // ISO 2-letter ('JP', 'KR', 'US', '')
  city: string | null       // locality or postal_town
  address: string           // 재조립된 전체 주소 (우편번호 제외)
}

/**
 * address_components를 국가 공통 포맷으로 재조립.
 * placeName이 주어지면 premise 중 POI 이름과 매칭되는 건 제외.
 */
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

  const parts: string[] = []
  const seen = new Set<string>()
  const add = (s?: string) => {
    if (!s) return
    if (seen.has(s)) return
    seen.add(s)
    parts.push(s)
  }

  // 1. Street level — 번지 + 도로명을 공백으로 결합
  const num = getLong('street_number')
  const route = getLong('route')
  if (num || route) {
    add([num, route].filter(Boolean).join(' '))
  } else {
    // JP-style: premise 중 POI 이름이 아닌 것만
    const premises = components
      .filter(c => c.types.includes('premise'))
      .map(c => c.long_name)
      .filter(n => !isLikelyPOIName(n, placeName))
    if (premises.length > 0) add(premises.join(' '))
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

  // 3. City (locality or postal_town)
  add(city ?? undefined)

  // 4. Admin level 1 — city와 동일 이름이면 skip (Berlin/NY 중복 해결)
  const admin1 = getLong('administrative_area_level_1')
  if (admin1 && admin1 !== city) add(admin1)

  // 5. Country (long_name)
  add(getLong('country'))

  return {
    country_code,
    city,
    address: parts.join(', '),
  }
}

function isLikelyPOIName(value: string, placeName?: string): boolean {
  if (!placeName) return false
  const v = value.toLowerCase()
  const n = placeName.toLowerCase()
  return v === n || v.includes(n) || n.includes(v)
}
