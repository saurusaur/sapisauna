/**
 * Reverse Geocoding API Route
 *
 * GET /api/places/reverse-geocode?lat=..&lng=..&name=..
 *
 * lat/lng → Google Geocoding API → 구조화된 주소 반환
 * - country_code (ISO 2-letter)
 * - city (locality/postal_town)
 * - address (재조립된 clean full)
 *
 * 서버 사이드에서 Google API 키 보호.
 * 장소 신규 등록 시 1회 호출 → DB에 영속 저장.
 */

import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/geo/reverse-geocode'
import { captureError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')
  const name = searchParams.get('name') ?? undefined

  const lat = latStr ? parseFloat(latStr) : NaN
  const lng = lngStr ? parseFloat(lngStr) : NaN

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: 'Invalid lat/lng' },
      { status: 400 }
    )
  }

  try {
    const result = await reverseGeocode(lat, lng, name)
    if (!result) {
      // fallback — 구조화 실패 시 빈 값 (클라이언트는 formatted_address 원본 사용)
      return NextResponse.json({ country_code: '', city: null, address: '' })
    }
    return NextResponse.json(result)
  } catch (e) {
    captureError(e, { label: 'reverse-geocode route' })
    return NextResponse.json(
      { country_code: '', city: null, address: '' },
      { status: 500 }
    )
  }
}
