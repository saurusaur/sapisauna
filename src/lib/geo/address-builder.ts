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
  const admin1Early = getLong('administrative_area_level_1')
  let city = getLong('locality') ?? getLong('postal_town') ?? null
  // 일본 도쿄 23특별구 보정: Google이 locality를 구(예: "Minato City")로 반환하므로
  // 도도부현(admin1)이 Tokyo면 city를 'Tokyo'로 롤업한다. (오사카/교토 등은 영향 없음)
  if (country_code === 'JP' && admin1Early === 'Tokyo') city = 'Tokyo'

  const parts: string[] = []
  const seen = new Set<string>()
  const add = (s?: string) => {
    if (!s) return
    if (seen.has(s)) return
    seen.add(s)
    parts.push(s)
  }

  // 1. Street level
  const num = getLong('street_number')
  const route = getLong('route')
  if (num || route) {
    // US/EU 스타일: 번지 + 도로명
    add([num, route].filter(Boolean).join(' '))
  } else {
    // JP/KR 스타일 — 블록 번지: premise + sublocality_level_3/4/5 복원.
    // Google이 "18-9" 같은 블록을 여러 컴포넌트로 쪼개 반환하므로 다시 '-'로 결합.
    const deepSubs = ['sublocality_level_3', 'sublocality_level_4', 'sublocality_level_5']
      .map(t => getLong(t))
      .filter((v): v is string => !!v)
    const premises = components
      .filter(c => c.types.includes('premise'))
      .map(c => c.long_name)
      .filter(n => !isLikelyPOIName(n, placeName))
    const blockStr = [...deepSubs, ...premises].join('-')
    if (blockStr) add(blockStr)
  }

  // 2. Sublocality — 명시적 level_2, level_1, neighborhood만.
  // base 'sublocality' 타입을 types 배열에 포함한 level_3/4/5와 겹치므로 제외.
  for (const t of ['sublocality_level_2', 'sublocality_level_1', 'neighborhood']) {
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

/**
 * premise 값이 POI 이름일 가능성 판정.
 * - placeName과 매칭되면 POI
 * - 숫자가 하나도 없고 4자 이상이면 POI (예: "サウナアルプス", "Sky Building")
 * - 주소 번지는 거의 항상 숫자 포함 → 번지는 걸러지지 않음
 */
function isLikelyPOIName(value: string, placeName?: string): boolean {
  if (!value) return false
  if (placeName) {
    const v = value.toLowerCase()
    const n = placeName.toLowerCase()
    if (v === n || v.includes(n) || n.includes(v)) return true
  }
  return !/\d/.test(value) && value.length >= 4
}
