/**
 * Google Geocoding API (forward) wrapper
 *
 * address text → address_components + geometry → ResolvedAddress + lat/lng
 *
 * 무료 한도: 10K/월 (Essentials 티어, 2025-03 이후)
 * 현재 예상 볼륨: ~수십/월 (manual 장소 등록 시)
 *
 * 서버 사이드 전용 (API route에서만 호출). 클라이언트에서 직접 호출 금지.
 */

import { resolveAddress, type ResolvedAddress, type AddressComponent } from './address-builder'

interface GeocodingResult {
  address_components: AddressComponent[]
  formatted_address: string
  geometry?: {
    location?: { lat: number; lng: number }
  }
}

interface GeocodingResponse {
  status: string
  results: GeocodingResult[]
  error_message?: string
}

export interface ForwardGeocodeResult extends ResolvedAddress {
  latitude: number | null
  longitude: number | null
}

/**
 * address text → 구조화된 주소 + 좌표. 실패 시 null.
 */
export async function forwardGeocode(
  address: string,
  placeName?: string
): Promise<ForwardGeocodeResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null
  if (!address.trim()) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', key)

  try {
    const resp = await fetch(url.toString())
    if (!resp.ok) return null
    const data: GeocodingResponse = await resp.json()
    if (data.status !== 'OK') return null

    const first = data.results?.[0]
    if (!first) return null

    const resolved = resolveAddress(first.address_components, placeName)
    return {
      ...resolved,
      latitude: first.geometry?.location?.lat ?? null,
      longitude: first.geometry?.location?.lng ?? null,
    }
  } catch {
    return null
  }
}
