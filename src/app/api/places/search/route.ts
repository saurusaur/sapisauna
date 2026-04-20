/**
 * 장소 검색 API Route
 * - mode=domestic: Naver Search API (국내)
 * - mode=overseas: Google Places API (해외)
 *
 * 응답은 places 테이블 형식에 맞게 정제하여 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { captureError } from '@/lib/error-logger'

// 정제된 장소 데이터 타입 (places 테이블 호환)
// 카테고리는 장소가 아닌 logs.log_type으로 관리
interface PlaceResult {
  name: string
  address: string
  shortAddress: string   // 카드 미리보기용 짧은 주소
  countryCode: string    // ISO 2자리 국가코드 (예: 'KR', 'JP')
  latitude: number | null
  longitude: number | null
  source: 'naver' | 'google'
  external_id: string
}

/**
 * 짧은 주소 생성 — Naver 전용 (국내)
 * 예: "서울특별시 강남구 신사동 ..." → "서울 강남구"
 *
 * Google 결과는 여기서 shortAddress를 만들지 않음. 선택 시점에
 * /api/places/reverse-geocode 호출로 city/country_code 구조화 획득 후
 * `${city}, ${country_name}` 형태로 구성.
 */
function generateNaverShortAddress(address: string): string {
  const parts = address.split(' ')
  // 시/도 이름에서 "특별시/광역시" 등 접미사 제거
  const city = (parts[0] || '').replace(/특별시|광역시|특별자치시|특별자치도/, '')
  const district = parts[1] || ''
  return `${city} ${district}`.trim()
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
 * HTML 태그 제거 + HTML 엔티티 디코딩
 * Naver 응답에 <b> 태그와 &amp; 등 HTML 엔티티가 포함됨
 */
function stripHtml(str: string): string {
  const HTML_ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  }
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (m) => HTML_ENTITIES[m] ?? m)
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
  // sort 파라미터 생략 → 기본(관련도순) 사용
  // sort=comment는 대형 워터파크/스파 위주로 편향됨

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
    const fullAddress = item.roadAddress || item.address
    return {
      name: stripHtml(item.title),
      address: fullAddress,
      shortAddress: generateNaverShortAddress(fullAddress),
      countryCode: 'KR', // Naver API = 국내 전용
      latitude: coords.lat,
      longitude: coords.lng,
      source: 'naver' as const,
      external_id: `${item.mapx}_${item.mapy}`,
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
  url.searchParams.set('query', `${query} sauna`)
  url.searchParams.set('language', 'en')
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

  // Google 결과는 이 시점에 country_code/shortAddress를 확정하지 않음.
  // 유저 선택 시점에 /api/places/reverse-geocode로 lat/lng → 구조화 획득.
  return results.map((item) => ({
    name: item.name,
    address: item.formatted_address,
    shortAddress: item.formatted_address, // 검색 결과 목록 표시용 (원본 그대로)
    countryCode: '',
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
    captureError(error, { label: 'Place search', extra: { source, query: query ?? '' } })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
