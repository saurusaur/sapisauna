/**
 * 로그 서비스 — Supabase logs + deep_logs 연동
 */

import { supabase } from './supabase'
import { ADMIN_USER_ID } from '@/constants/content'
import type { LogWithPlace, BathGender } from '@/types'

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

  // users 조인 (닉네임 + 칭호)
  const userJoin = row.users as Record<string, unknown> | null
  const userNickname = (userJoin?.nickname as string) || undefined
  const userTitle = (userJoin?.active_title as string) || undefined

  // deep_logs 조인 (1:1)
  const deepLogs = row.deep_logs as Array<Record<string, unknown>> | null
  const dl = deepLogs?.[0]

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    place_id: row.place_id as string,
    place_name: placeName,
    place_country_code: (place?.country_code as string) || 'KR',
    address,
    user_nickname: userNickname,
    user_title: userTitle,
    date: row.record_date as string,
    tribe_id: row.tribe_id as LogWithPlace['tribe_id'],
    revisit_score: (row.revisit_score as number) || 0,
    heat_time: row.heat_time as number | undefined,
    ice_time: row.ice_time as number | undefined,
    pause_time: row.pause_time as number | undefined,
    repeat: row.repeat as number | undefined,
    sauna_temp: row.sauna_temp as number | undefined,
    cold_bath_temp: row.cold_bath_temp as number | undefined,
    totono_score: row.totono_score as number | undefined,
    water_quality: row.water_quality as number | undefined,
    hot_bath_temp: row.hot_bath_temp as number | undefined,
    rest_quality: row.rest_quality as number | undefined,
    sweat_quality: row.sweat_quality as number | undefined,
    jjim_temp: row.jjim_temp as number | undefined,
    bath_gender: row.bath_gender as BathGender | undefined,
    deep_log: dl ? {
      companion: dl.companion as string | null,
      cost: dl.cost as number | null,
      currency: dl.currency as string | null,
      crowd: dl.crowd as string | null,
      memo: dl.memo as string | undefined,
      has_scrub: dl.has_scrub as boolean | undefined,
      scrub_satisfaction: dl.scrub_satisfaction as number | null,
      has_store: dl.has_store as boolean | undefined,
      store_score: dl.store_score as number | null,
      store_memo: dl.store_memo as string | null,
      cleanliness: dl.cleanliness as number | null,
      has_wet_sauna: dl.has_wet_sauna as boolean | undefined,
      wet_sauna_temp: dl.wet_sauna_temp as number | null,
      has_very_hot_bath: dl.has_very_hot_bath as boolean | undefined,
      very_hot_bath_temp: dl.very_hot_bath_temp as number | null,
    } : undefined,
  }
}

const LOG_SELECT = '*, users(nickname, active_title), places!inner(*, place_sources(*)), deep_logs(*)'

// 최근 로그 (전체 공개용 — explore 등, 어드민 제외)
export async function getRecentLogs(limit = 20): Promise<LogWithPlace[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .neq('user_id', ADMIN_USER_ID)
    .order('record_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 커뮤니티 피드 (현재 유저 + 어드민 제외, 최신순)
export async function getCommunityFeed(limit = 10): Promise<LogWithPlace[]> {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('logs')
    .select(LOG_SELECT)
    .neq('user_id', ADMIN_USER_ID)
    .order('record_date', { ascending: false })
    .limit(limit)

  if (user) {
    query = query.neq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 현재 유저의 로그 (본인만)
export async function getUserLogs(): Promise<LogWithPlace[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('user_id', user.id)
    .order('record_date', { ascending: false })

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 단일 로그 조회 (본인만 — history, story)
export async function getMyLogById(id: string): Promise<LogWithPlace | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return toLogWithPlace(data)
}

// 단일 로그 조회 (공개 — explore)
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

// 장소별 로그 (전체 유저 — explore 장소 상세)
export async function getLogsByPlace(placeId: string): Promise<LogWithPlace[]> {
  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('place_id', placeId)
    .order('record_date', { ascending: false })

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 장소별 로그 (본인만 — history 기록 상세)
export async function getMyLogsByPlace(placeId: string): Promise<LogWithPlace[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('logs')
    .select(LOG_SELECT)
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .order('record_date', { ascending: false })

  if (error) throw error
  return (data || []).map(toLogWithPlace)
}

// 로그 INSERT — DB 컬럼명과 키 동일
export async function insertLog(logData: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')

  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: user.id,
      place_id: logData.place_id,
      tribe_id: logData.tribe_id,
      revisit_score: logData.revisit_score,
      heat_time: logData.heat_time ?? null,
      ice_time: logData.ice_time ?? null,
      pause_time: logData.pause_time ?? null,
      repeat: logData.repeat ?? null,
      sauna_temp: logData.sauna_temp ?? null,
      cold_bath_temp: logData.cold_bath_temp ?? null,
      totono_score: logData.totono_score ?? null,
      water_quality: logData.water_quality ?? null,
      hot_bath_temp: logData.hot_bath_temp ?? null,
      jjim_temp: logData.jjim_temp ?? null,
      sweat_quality: logData.sweat_quality ?? null,
      rest_quality: logData.rest_quality ?? null,
      bath_gender: logData.bath_gender ?? null,
      record_date: logData.record_date ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

// 로그 삭제 — deep_logs는 ON DELETE CASCADE로 자동 삭제
export async function deleteLog(logId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) throw error
}

// 로그 UPDATE — 편집 모드에서 사용
export async function updateLog(logId: string, logData: Record<string, unknown>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')

  // tribe 변경 시 이전 tribe 전용 필드를 null로 초기화
  const { error } = await supabase
    .from('logs')
    .update({
      place_id: logData.place_id,
      tribe_id: logData.tribe_id,
      revisit_score: logData.revisit_score,
      heat_time: logData.heat_time ?? null,
      ice_time: logData.ice_time ?? null,
      pause_time: logData.pause_time ?? null,
      repeat: logData.repeat ?? null,
      // 모든 tribe 필드를 명시 — 해당 tribe가 아니면 null로 클리어
      sauna_temp: logData.sauna_temp ?? null,
      cold_bath_temp: logData.cold_bath_temp ?? null,
      totono_score: logData.totono_score ?? null,
      water_quality: logData.water_quality ?? null,
      hot_bath_temp: logData.hot_bath_temp ?? null,
      jjim_temp: logData.jjim_temp ?? null,
      sweat_quality: logData.sweat_quality ?? null,
      rest_quality: logData.rest_quality ?? null,
      bath_gender: logData.bath_gender ?? null,
      record_date: logData.record_date ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) throw error
}

// 딥로그 저장 (INSERT 또는 UPDATE — 기존 존재 여부에 따라 분기)
export async function saveOrUpdateDeepLog(logId: string, deepData: Record<string, unknown>): Promise<void> {
  // 기존 딥로그 존재 확인
  const { data: existing } = await supabase
    .from('deep_logs')
    .select('id')
    .eq('log_id', logId)
    .single()

  const payload = {
    log_id: logId,
    companion: deepData.companion ?? null,
    cost: deepData.cost ?? null,
    currency: deepData.currency ?? 'KRW',
    memo: deepData.memo ?? null,
    crowd: deepData.crowd ?? null,
    has_scrub: deepData.has_scrub ?? false,
    scrub_satisfaction: deepData.scrub_satisfaction ?? null,
    has_store: deepData.has_store ?? false,
    store_score: deepData.store_score ?? null,
    store_memo: deepData.store_memo ?? null,
    food_eaten: deepData.food_eaten ?? [],
    cleanliness: deepData.cleanliness ?? null,
    has_wet_sauna: deepData.has_wet_sauna ?? false,
    wet_sauna_temp: deepData.wet_sauna_temp ?? null,
    has_very_hot_bath: deepData.has_very_hot_bath ?? false,
    very_hot_bath_temp: deepData.very_hot_bath_temp ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('deep_logs')
      .update(payload)
      .eq('log_id', logId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('deep_logs')
      .insert(payload)
    if (error) throw error
  }

  // 온탕: 딥로그에서 입력받아 logs 테이블에 저장 (사우너파용)
  if (deepData.has_hot_bath && deepData.hot_bath_temp != null) {
    await supabase
      .from('logs')
      .update({ hot_bath_temp: deepData.hot_bath_temp })
      .eq('id', logId)
  }

  // 시설 자동태그: 습식/열탕/온탕 토글 ON 시 place.facilities에 태그 추가
  const autoTags: string[] = []
  if (deepData.has_wet_sauna) autoTags.push('wet-sauna')
  if (deepData.has_very_hot_bath) autoTags.push('very-hot-bath')
  if (deepData.has_hot_bath) autoTags.push('hot-bath')

  if (autoTags.length > 0) {
    // logId로 place_id 조회
    const { data: log } = await supabase
      .from('logs')
      .select('place_id')
      .eq('id', logId)
      .single()

    if (log) {
      const { data: place } = await supabase
        .from('places')
        .select('facilities')
        .eq('id', log.place_id)
        .single()

      if (place) {
        const current = (place.facilities as string[]) || []
        const newTags = autoTags.filter(t => !current.includes(t))
        if (newTags.length > 0) {
          await supabase
            .from('places')
            .update({ facilities: [...current, ...newTags] })
            .eq('id', log.place_id)
        }
      }
    }
  }
}
