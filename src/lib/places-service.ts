/**
 * 장소 서비스 — Supabase places + place_sources 연동
 */

import { supabase } from './supabase'
import { generateShortAddress } from './utils'
import { countryName } from '@/constants/country-names'
import type { Place, PlaceSource, FacilityType, BathPolicy } from '@/types'

// DB 행 → Place 변환 (place_sources 조인 포함)
export function toPlace(row: Record<string, unknown>): Place {
  const sources = (row.place_sources as PlaceSource[] | null) || []
  // 표시용 이름/주소: naver 우선 → google → manual → 첫 번째 소스
  const preferred = sources.find(s => s.source === 'naver')
    || sources.find(s => s.source === 'google')
    || sources[0]

  const name = preferred?.name_original || '이름 없음'
  const address = preferred?.address_original || ''
  const country_code = (row.country_code as string) || ''
  const city = (row.city as string | null) ?? null

  // short_address 로직:
  //   · primary source가 naver → "서울 강남구" 스타일 (기존)
  //   · 그 외 + city 있음 → "Tokyo, Japan" 스타일
  //   · 둘 다 아니면 address 전체로 fallback
  let short_address = ''
  if (preferred?.source === 'naver') {
    short_address = generateShortAddress(address, 'KR')
  } else if (city) {
    short_address = `${city}, ${countryName(country_code)}`.replace(/,\s*$/, '')
  } else {
    short_address = address
  }

  return {
    id: row.id as string,
    country_code,
    city,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    facilities: Array.from(new Set(((row.facilities as string[]) || []).map(f => f.replace(/"/g, '')))),
    is_24h: (row.is_24h as boolean) || false,
    facility_type: (row.facility_type as FacilityType) || 'public-bath',
    bath_policy: (row.bath_policy as BathPolicy) || 'gender-bath',
    coordinate_source: (row.coordinate_source as 'naver' | 'google' | 'manual' | null) || null,
    status: (row.status as string) || 'active',
    merged: (row.merged as boolean) || false,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    name,
    address,
    short_address,
    sources,
  }
}

const PLACE_SELECT = '*, place_sources(*)'

// 전체 장소 목록
export async function getPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select(PLACE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(toPlace)
}

// 단일 장소 조회
export async function getPlaceById(id: string): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select(PLACE_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }
  return toPlace(data)
}

// 장소 검색 (이름/주소)
export async function searchPlaces(query: string): Promise<Place[]> {
  // place_sources의 name_original/address_original에서 검색
  const { data, error } = await supabase
    .from('place_sources')
    .select('place_id, place:places!inner(*, place_sources(*))')
    .or(`name_original.ilike.%${query}%,address_original.ilike.%${query}%`)

  if (error) throw error
  if (!data) return []

  // 중복 place 제거
  const seen = new Set<string>()
  const places: Place[] = []
  for (const row of data) {
    const placeData = row.place as unknown as Record<string, unknown>
    if (placeData && !seen.has(placeData.id as string)) {
      seen.add(placeData.id as string)
      places.push(toPlace(placeData))
    }
  }
  return places
}

// 좌표 기반 근처 장소 검색 (RPC — 반경 50m 이내, 복수 후보)
export async function findNearbyPlaces(
  lat: number,
  lng: number,
  radiusM = 50
): Promise<Place[]> {
  const { data, error } = await supabase
    .rpc('find_nearby_places', { p_lat: lat, p_lng: lng, p_radius_m: radiusM })

  if (error) throw error
  if (!data || data.length === 0) return []

  // RPC는 places만 반환하므로, place_sources를 별도 조인
  const placeIds = data.map((d: Record<string, unknown>) => d.id as string)
  const { data: sources } = await supabase
    .from('place_sources')
    .select('*')
    .in('place_id', placeIds)

  return data.map((row: Record<string, unknown>) => {
    const rowSources = (sources || []).filter(
      (s: Record<string, unknown>) => s.place_id === row.id
    )
    return toPlace({ ...row, place_sources: rowSources })
  })
}

// 기존 장소에 새 소스를 병합 (Stage 2 추출)
export async function mergeWithPlace(
  placeId: string,
  sourceInfo: {
    source: 'naver' | 'google' | 'manual'
    external_id?: string
    name: string
    address: string
    latitude?: number | null
    longitude?: number | null
    plus_code?: string
  },
  facilities: string[],
  is_24h: boolean,
  facility_type?: FacilityType,
  bath_policy?: BathPolicy,
): Promise<Place> {
  const existing = await getPlaceById(placeId)
  if (!existing) throw new Error('병합 대상 장소를 찾을 수 없습니다')

  // 소스 추가
  await supabase.from('place_sources').insert({
    place_id: placeId,
    source: sourceInfo.source,
    external_id: sourceInfo.external_id || null,
    name_original: sourceInfo.name,
    address_original: sourceInfo.address,
    latitude: sourceInfo.latitude || null,
    longitude: sourceInfo.longitude || null,
    plus_code: sourceInfo.plus_code || null,
  })

  // 시설 정보 병합 + merged 플래그
  const mergedFacilities = Array.from(new Set([...existing.facilities, ...facilities]))
  await supabase
    .from('places')
    .update({
      facilities: mergedFacilities,
      is_24h: is_24h || existing.is_24h,
      merged: true,
      facility_type: facility_type || 'public-bath',
      bath_policy: bath_policy || 'gender-bath',
    })
    .eq('id', placeId)

  const updated = await getPlaceById(placeId)
  return updated!
}

// 신규 장소 + 소스 생성 (Stage 3 추출)
export async function createNewPlace(params: {
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  facilities: string[]
  is_24h: boolean
  facility_type?: FacilityType
  bath_policy?: BathPolicy
  country_code?: string
  city?: string | null
  source?: 'naver' | 'google' | 'manual'
  external_id?: string
  plus_code?: string
}): Promise<Place> {
  const {
    name, address, latitude, longitude,
    facilities, is_24h, facility_type, bath_policy,
    country_code = '',
    city = null,
    source = 'manual', external_id, plus_code,
  } = params

  // 현재 유저 ID (장소 마일스톤 체크용)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: newPlace, error: placeError } = await supabase
    .from('places')
    .insert({
      country_code,
      city,
      latitude: latitude || null,
      longitude: longitude || null,
      facilities,
      is_24h,
      coordinate_source: source,
      facility_type: facility_type || 'public-bath',
      bath_policy: bath_policy || 'gender-bath',
      created_by: authUser?.id || null,
    })
    .select()
    .single()

  if (placeError) throw placeError

  await supabase.from('place_sources').insert({
    place_id: newPlace.id,
    source,
    external_id: external_id || null,
    name_original: name,
    address_original: address,
    latitude: latitude || null,
    longitude: longitude || null,
    plus_code: plus_code || null,
  })

  const result = await getPlaceById(newPlace.id)
  return result!
}

// 장소 정보 수정
export async function updatePlace(placeId: string, updates: {
  facilities: string[]
  is_24h: boolean
  facility_type: string
  bath_policy: string
}): Promise<void> {
  const { error } = await supabase
    .from('places')
    .update({
      facilities: updates.facilities,
      is_24h: updates.is_24h,
      facility_type: updates.facility_type,
      bath_policy: updates.bath_policy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', placeId)

  if (error) throw error
}

// 장소별 통계 (RPC)
export async function getPlaceStats(placeId: string): Promise<{ avg: number; count: number }> {
  const { data, error } = await supabase
    .rpc('get_place_stats', { p_place_id: placeId })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    avg: Number(row?.avg_score) || 0,
    count: Number(row?.log_count) || 0,
  }
}
