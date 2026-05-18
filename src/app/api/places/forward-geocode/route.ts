/**
 * Forward Geocoding API Route
 *
 * GET /api/places/forward-geocode?address=..&name=..
 *
 * address text → Google Geocoding API → 구조화된 주소 + 좌표
 * - country_code (ISO 2-letter)
 * - city (locality/postal_town)
 * - address (재조립된 clean full)
 * - latitude, longitude
 *
 * 서버 사이드에서 Google API 키 보호.
 * 클라이언트는 manual 장소 등록 시 호출.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardGeocode } from '@/lib/geo/forward-geocode'
import { captureError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const name = searchParams.get('name') ?? undefined

  if (!address || !address.trim()) {
    return NextResponse.json(
      { error: 'Missing address' },
      { status: 400 }
    )
  }

  try {
    const result = await forwardGeocode(address, name)
    if (!result) {
      // fallback — 구조화 실패 시 빈 값 (클라이언트는 manual 저장 진행)
      return NextResponse.json({
        country_code: '',
        city: null,
        address: '',
        latitude: null,
        longitude: null,
      })
    }
    return NextResponse.json(result)
  } catch (e) {
    captureError(e, { label: 'forward-geocode route', extra: { address } })
    return NextResponse.json(
      {
        country_code: '',
        city: null,
        address: '',
        latitude: null,
        longitude: null,
      },
      { status: 500 }
    )
  }
}
