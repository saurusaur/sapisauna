/**
 * 로그 서비스 — Supabase logs + deep_logs 연동
 */

import { supabase } from './supabase'
import type { LogWithPlace } from '@/types'

// DB 행 → LogWithPlace 변환
function toLogWithPlace(row: Record<string, unknown>): LogWithPlace {
  // place 조인 데이터에서 name/address 추출
  const place = row.places as Record<string, unknown> | null
  const placeSources = place?.place_sources as Array<Record<string, unknown>> | null
  const preferred = placeSources?.find(s => s.source === 'naver')
    || placeSources?.find(s => s.source === 'google')
    || placeSources?.[0]

  const placeName = (preferred?.name_original as string) || '알 수 없는 장소'
  const address = (preferred?.address_original as string) || ''

  // deep_logs 조인 (1:1)
  const deepLogs = row.deep_logs as Array<Record<string, unknown>> | null
  const dl = deepLogs?.[0]

  return {
    id: row.id as string,
    place_id: row.place_id as string,
    place_name: placeName,
    address,
    date: (row.logged_at as string) || (row.created_at as string),
    tribe_id: row.log_type as LogWithPlace['tribe_id'],
    revisit_score: (row.revisit_score as number) || 0,
    heat_time: row.heat_time as number | undefined,
    ice_time: row.ice_time as number | undefined,
    pause_time: row.pause_time as number | undefined,
    repeat: row.repeat as number | undefined,
    sauna_temp: row.sauna_temp as number | undefined,
    cold_bath_temp: row.cold_bath_temp as number | undefined,
    totono: row.totono_score as number | undefined,
    water_quality: row.water_quality as number | undefined,
    hot_bath_temp: row.hot_bath_temp as number | undefined,
    cleanliness: row.cleanliness as number | undefined,
    jjim_temp: row.jjim_temp as number | undefined,
    deep_log: dl ? {
      bath_gender: dl.bath_gender as 'male' | 'female' | 'mixed' | 'private' | undefined,
      companion: dl.companion as string | null,
      purposes: dl.purpose ? [dl.purpose as string] : [],
      cost: dl.cost as number | null,
      crowd: dl.crowd as string | null,
      memo: dl.memo as string | undefined,
      has_scrub: dl.had_scrub as boolean | undefined,
      scrub_satisfaction: dl.scrub_satisfaction as number | null,
    } : undefined,
  }
}

const LOG_SELECT = '*, places!inner(*, place_sources(*)), deep_logs(*)'

// 최근 로그 (전체 공개용 — explore 등)
export async function getRecentLogs(limit = 20): Promise<LogWithPlace[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .order('logged_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 현재 유저의 로그
export async function getUserLogs(): Promise<LogWithPlace[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 단일 로그 조회
export async function getLogById(id: string): Promise<LogWithPlace | null> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return toLogWithPlace(data)
}

// 장소별 로그
export async function getLogsByPlace(placeId: string): Promise<LogWithPlace[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('place_id', placeId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}
