/**
 * Google Geocoding API (reverse) wrapper
 *
 * lat/lng → address_components → ResolvedAddress
 *
 * 무료 한도: 10K/월 (Essentials 티어, 2025-03 이후)
 * 현재 예상 볼륨: ~100/월 (신규 장소 등록 시)
 *
 * 서버 사이드 전용 (API route에서만 호출). 클라이언트에서 직접 호출 금지.
 */

import { resolveAddress, type ResolvedAddress, type AddressComponent } from './address-builder'

interface GeocodingResult {
  address_components: AddressComponent[]
  formatted_address: string
}

interface GeocodingResponse {
  status: string
  results: GeocodingResult[]
  error_message?: string
}

/**
 * lat/lng → 구조화된 주소. 실패 시 null.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  placeName?: string
): Promise<ResolvedAddress | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${lat},${lng}`)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', key)

  try {
    const resp = await fetch(url.toString())
    if (!resp.ok) return null
    const data: GeocodingResponse = await resp.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null

    const first = data.results?.[0]
    if (!first) return null

    return resolveAddress(first.address_components, placeName)
  } catch {
    return null
  }
}
