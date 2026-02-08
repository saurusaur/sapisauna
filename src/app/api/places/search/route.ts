/**
 * 장소 검색 API Route
 * - mode=domestic: Naver Search API (국내)
 * - mode=overseas: Google Places API (해외)
 *
 * 응답은 places 테이블 형식에 맞게 정제하여 반환
 */

import { NextRequest, NextResponse } from 'next/server'

// 정제된 장소 데이터 타입 (places 테이블 호환)
// 카테고리는 장소가 아닌 logs.log_type으로 관리
interface PlaceResult {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  source: 'naver' | 'google'
  external_id: string
}

// Naver 검색 API 응답 타입
interface NaverPlace {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
}

// Google Places API 응답 타입
interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
}

/**
 * Naver 좌표 변환 (KATEC → WGS84 근사 변환)
 * Naver mapx/mapy는 KATEC 좌표계 사용
 */
function convertNaverCoords(mapx: string, mapy: string): { lat: number; lng: number } {
  // Naver API는 좌표를 10000000으로 나눈 값으로 반환
  const x = parseInt(mapx) / 10000000
  const y = parseInt(mapy) / 10000000
  return { lat: y, lng: x }
}

/**
 * HTML 태그 제거 (Naver 응답에 <b> 태그 포함됨)
 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}


/**
 * Naver Search API 호출
 */
async function searchNaver(query: string): Promise<PlaceResult[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Naver API credentials not configured')
  }

  const url = new URL('https://openapi.naver.com/v1/search/local.json')
  url.searchParams.set('query', `${query} 사우나`)
  url.searchParams.set('display', '10')
  url.searchParams.set('sort', 'comment') // 리뷰 많은 순

  const response = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })

  if (!response.ok) {
    throw new Error(`Naver API error: ${response.status}`)
  }

  const data = await response.json()
  const items: NaverPlace[] = data.items || []

  return items.map((item) => {
    const coords = convertNaverCoords(item.mapx, item.mapy)
    return {
      name: stripHtml(item.title),
      address: item.roadAddress || item.address,
      latitude: coords.lat,
      longitude: coords.lng,
      source: 'naver' as const,
      external_id: `${item.mapx}_${item.mapy}`, // 고유 ID로 좌표 조합 사용
    }
  })
}

/**
 * Google Places API 호출 (Text Search)
 */
async function searchGoogle(query: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', `${query} sauna spa`)
  url.searchParams.set('type', 'spa')
  url.searchParams.set('language', 'en') // 영어로 주소 반환 (일관성)
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google API error: ${data.status}`)
  }

  const results: GooglePlace[] = data.results || []

  return results.map((item) => ({
    name: item.name,
    address: item.formatted_address,
    latitude: item.geometry?.location?.lat || null,
    longitude: item.geometry?.location?.lng || null,
    source: 'google' as const,
    external_id: item.place_id,
  }))
}

/**
 * GET /api/places/search?q=검색어&source=naver|google
 * source: 검색 엔진 선택 (유저가 직접 선택)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const source = searchParams.get('source') || 'naver'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  try {
    let results: PlaceResult[]

    if (source === 'google') {
      results = await searchGoogle(query)
    } else {
      results = await searchNaver(query)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Place search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
