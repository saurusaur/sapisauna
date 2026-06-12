/**
 * 로그 서비스 — Supabase logs + deep_logs 연동
 */

import { supabase } from './supabase'
import { ADMIN_USER_ID, BLOCK_TYPES } from '@/constants/content'
import type { LogWithPlace, BathGender, FacilityType, BathPolicy } from '@/types'

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

  // public_profiles 조인 (닉네임 + 칭호)
  const userJoin = row.public_profiles as Record<string, unknown> | null
  const userNickname = (userJoin?.nickname as string) || undefined
  const userTitle = (userJoin?.active_title as string) || undefined

  // deep_logs 조인 (1:1) — 030 DROP 전까지 레거시 폴백 소스로만 사용
  const deepLogs = row.deep_logs as Array<Record<string, unknown>> | null
  const dl = deepLogs?.[0]

  // 레거시 세신 분리 규칙 (029 백필과 동일): 둘 다→scrub(withmassage), 세신만→scrub(basic), 마사지만→massage
  const legacyScrubTypes = (dl?.scrub_types as string[]) || []
  const legacyHasScrub = legacyScrubTypes.includes('scrub')
  const legacyHasMassage = legacyScrubTypes.includes('massage')

  // log_blocks 조인 (1:N, seq 정렬)
  const blockRows = (row.log_blocks as Array<Record<string, unknown>> | null) || []
  const blocks = blockRows
    .slice()
    .sort((a, b) => (a.seq as number) - (b.seq as number))
    .map(b => ({
      id: b.id as string,
      log_id: b.log_id as string,
      seq: b.seq as number,
      block_type: b.block_type as string,
      category: b.category as string,
      temp: b.temp as number | null,
      duration_sec: b.duration_sec as number | null,
      score: b.score as number | null,
      cost: b.cost as number | null,
      memo: b.memo as string | null,
      variant: b.variant as string | null,
      norepeat: (b.norepeat as boolean) ?? false,
    }))

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    place_id: row.place_id as string,
    place_name: placeName,
    place_country_code: (place?.country_code as string) || '',
    place_facility_type: typeof place?.facility_type === 'string' ? (place.facility_type as FacilityType) : undefined,
    place_bath_policy: typeof place?.bath_policy === 'string' ? (place.bath_policy as BathPolicy) : undefined,
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
    steam_sauna_temp: row.steam_sauna_temp as number | undefined,
    primary_sauna_kind: row.primary_sauna_kind as ('dry' | 'steam' | undefined),
    cold_bath_temp: row.cold_bath_temp as number | undefined,
    totono_score: row.totono_score as number | undefined,
    water_quality: row.water_quality as number | undefined,
    hot_bath_temp: row.hot_bath_temp as number | undefined,
    rest_quality: row.rest_quality as number | undefined,
    sweat_quality: row.sweat_quality as number | undefined,
    jjim_temp: row.jjim_temp as number | undefined,
    bath_gender: row.bath_gender as BathGender | undefined,
    // ── 신규 평탄 캐시 (029, 블록서 파생) ──
    // 새 캐시 우선 + 레거시(구컬럼·deep_logs) 폴백 — 030 백필·DROP 후 폴백 제거 가능.
    // 표시면은 전부 이 평탄 필드만 읽는다 (deep_log 직접 참조 금지).
    dry_sauna_temp: (row.dry_sauna_temp ?? row.sauna_temp) as number | null,
    bulgama_temp: (row.bulgama_temp ?? row.jjim_temp) as number | null,
    rest_time: (row.rest_time ?? row.pause_time) as number | null,
    very_hot_bath_temp: (row.very_hot_bath_temp ?? dl?.very_hot_bath_temp ?? null) as number | null,
    ice_bath_temp: (row.ice_bath_temp ?? dl?.ice_bath_temp ?? null) as number | null,
    salt_sauna_temp: row.salt_sauna_temp as number | null,
    open_air_bath_temp: row.open_air_bath_temp as number | null,
    ice_room_temp: row.ice_room_temp as number | null,
    cleanliness: (row.cleanliness ?? dl?.cleanliness ?? null) as number | null,
    crowd: (row.crowd ?? dl?.crowd ?? null) as string | null,
    companion: (row.companion ?? dl?.companion ?? null) as string | null,
    cost: (row.cost ?? dl?.cost ?? null) as number | null,
    currency: (row.currency ?? dl?.currency ?? null) as string | null,
    memo: (row.memo ?? dl?.memo ?? null) as string | null,
    scrub_score: (row.scrub_score ?? (legacyHasScrub ? dl?.scrub_satisfaction : null) ?? null) as number | null,
    scrub_cost: (row.scrub_cost ?? (legacyHasScrub ? dl?.scrub_cost : null) ?? null) as number | null,
    scrub_type: (row.scrub_type ?? (legacyHasScrub ? (legacyHasMassage ? 'withmassage' : 'basic') : null)) as string | null,
    massage_score: (row.massage_score ?? (legacyHasMassage && !legacyHasScrub ? dl?.scrub_satisfaction : null) ?? null) as number | null,
    massage_cost: (row.massage_cost ?? (legacyHasMassage && !legacyHasScrub ? dl?.scrub_cost : null) ?? null) as number | null,
    snack_score: (row.snack_score ?? dl?.store_score ?? null) as number | null,
    snack_memo: (row.snack_memo ?? dl?.store_memo ?? null) as string | null,
    restaurant_score: row.restaurant_score as number | null,
    restaurant_memo: row.restaurant_memo as string | null,
    blocks,
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
      has_very_hot_bath: dl.has_very_hot_bath as boolean | undefined,
      very_hot_bath_temp: dl.very_hot_bath_temp as number | null,
      has_ice_bath: dl.has_ice_bath as boolean | undefined,
      ice_bath_temp: dl.ice_bath_temp as number | null,
      scrub_types: (dl.scrub_types as string[]) || [],
      scrub_cost: dl.scrub_cost as number | null,
    } : undefined,
  }
}

const LOG_SELECT = '*, public_profiles(nickname, active_title), places!inner(*, place_sources(*)), deep_logs(*), log_blocks(*)'

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
      steam_sauna_temp: logData.steam_sauna_temp ?? null,
      primary_sauna_kind: logData.primary_sauna_kind ?? null,
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
      steam_sauna_temp: logData.steam_sauna_temp ?? null,
      primary_sauna_kind: logData.primary_sauna_kind ?? null,
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
    has_very_hot_bath: deepData.has_very_hot_bath ?? false,
    very_hot_bath_temp: deepData.very_hot_bath_temp ?? null,
    has_ice_bath: deepData.has_ice_bath ?? false,
    ice_bath_temp: deepData.ice_bath_temp ?? null,
    scrub_types: deepData.scrub_types ?? [],
    scrub_cost: deepData.scrub_cost ?? null,
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

  // 탕/사우나 온도: 딥로그에서 입력받아 logs 테이블에 저장
  // ── key-presence semantics ──
  // deepData에 키가 있으면 deep page가 해당 필드의 편집 권한이 있고 의도적으로 값 설정
  //  → null이면 클리어, number/문자열이면 업데이트
  // 키 자체가 없으면 quick log 소유 영역이라 절대 안 건드림 (quick에서 입력한 값 보존)
  const logsUpdate: Record<string, unknown> = {}
  const setIfPresent = (key: keyof typeof deepData) => {
    if (key in deepData) logsUpdate[key as string] = deepData[key] ?? null
  }
  setIfPresent('hot_bath_temp')
  setIfPresent('cold_bath_temp')
  setIfPresent('sauna_temp')
  setIfPresent('steam_sauna_temp')
  setIfPresent('primary_sauna_kind')
  if (Object.keys(logsUpdate).length > 0) {
    await supabase.from('logs').update(logsUpdate).eq('id', logId)
  }

  // 시설 자동태그 (deep page가 해당 필드 편집 권한이 있고 값을 입력한 경우에만)
  const autoTags: string[] = []
  if (deepData.sauna_temp != null) autoTags.push('dry-sauna')
  if (deepData.steam_sauna_temp != null) autoTags.push('steam-sauna')
  if (deepData.has_very_hot_bath) autoTags.push('very-hot-bath')
  if (deepData.has_ice_bath) autoTags.push('ice-bath')
  if (deepData.cold_bath_temp != null) autoTags.push('cold-bath')
  if (deepData.hot_bath_temp != null) autoTags.push('hot-bath')
  if (deepData.has_scrub) {
    const types = (deepData.scrub_types as string[]) || []
    if (types.includes('scrub')) autoTags.push('scrub')
    if (types.includes('massage')) autoTags.push('massage')
  }

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

// ============================================================
// 블록 기반 쓰기 (v6 단일 폼) — log_blocks 정正 + logs 캐시 파생
// 설계: docs/po/PLAN_로그_컷오버_20260606.md
// ============================================================

// 폼이 보내는 블록 1개
export interface LogBlockInput {
  blockType: string            // log_blocks.block_type
  category: string             // 'heat' | 'ice' | 'rest' | 'beyond'
  variant?: string | null      // 세신 종류 등 ('basic' | 'withmassage')
  temp?: number | null
  durationSec?: number | null  // 초 (UI: 냉탕/급냉=초, 그외 분→초 변환 후 전달)
  score?: number | null
  cost?: number | null
  memo?: string | null
  norepeat?: boolean
}

// 폼이 보내는 세션 메타
export interface LogSessionInput {
  place_id: string
  tribe_id: string
  record_date?: string | null
  revisit_score: number
  bath_gender?: string | null
  primary_sauna_kind?: 'dry' | 'steam' | null
  totono_score?: number | null
  water_quality?: number | null
  sweat_quality?: number | null
  cleanliness?: number | null
  crowd?: string | null
  companion?: string | null
  cost?: number | null
  currency?: string | null
  memo?: string | null
  repeat?: number | null
}

// block_type → 온도 캐시 컬럼 (온도시설은 id == block_type)
const CACHE_COL_BY_BLOCKTYPE: Record<string, string> = Object.fromEntries(
  BLOCK_TYPES.filter(b => b.cacheCol).map(b => [b.blockType, b.cacheCol as string]),
)
// 시설 아님(카탈로그/순수행동) — 자동태깅 제외
const NON_FACILITY_BLOCKS = new Set(['rest', 'other'])
const REST_BLOCKS = new Set(['rest', 'outdoor-rest', 'indoor-rest', 'sleep-room'])
// ice_time 캐시 = 침수 냉각(초)만 — 아이스방(분 체류)은 성격이 달라 제외 (2026-06-12 확정)
const SUBMERSION_ICE_BLOCKS = new Set(['cold-bath', 'ice-bath'])

// 블록 + 세션 → logs 캐시 컬럼 일괄 산출 (전 캐시 명시 → 편집 시 제거분 클리어)
function buildLogCaches(blocks: LogBlockInput[], s: LogSessionInput): Record<string, unknown> {
  const c: Record<string, unknown> = {
    revisit_score: s.revisit_score,
    bath_gender: s.bath_gender ?? null,
    primary_sauna_kind: s.primary_sauna_kind ?? null,
    totono_score: s.totono_score ?? null,
    water_quality: s.water_quality ?? null,
    sweat_quality: s.sweat_quality ?? null,
    cleanliness: s.cleanliness ?? null,
    crowd: s.crowd ?? null,
    companion: s.companion ?? null,
    cost: s.cost ?? null,
    currency: s.currency ?? null,
    memo: s.memo ?? null,
    repeat: s.repeat ?? null,
    // 온도 캐시 10 — 우선 null
    dry_sauna_temp: null, steam_sauna_temp: null, hot_bath_temp: null, very_hot_bath_temp: null,
    bulgama_temp: null, salt_sauna_temp: null, open_air_bath_temp: null,
    cold_bath_temp: null, ice_bath_temp: null, ice_room_temp: null,
    // 루틴 캐시
    heat_time: null, ice_time: null, rest_time: null,
    // 평가 파생
    rest_quality: null,
    scrub_score: null, scrub_cost: null, scrub_type: null,
    massage_score: null, massage_cost: null,
    snack_score: null, snack_memo: null,
    restaurant_score: null, restaurant_memo: null,
  }
  let heatSec = 0, iceSec = 0, restSec = 0
  for (const b of blocks) {
    const col = CACHE_COL_BY_BLOCKTYPE[b.blockType]
    if (col && b.temp != null) c[col] = b.temp
    if (b.category === 'heat') heatSec += b.durationSec ?? 0
    else if (SUBMERSION_ICE_BLOCKS.has(b.blockType)) iceSec += b.durationSec ?? 0
    else if (b.category === 'rest') restSec += b.durationSec ?? 0
    if (REST_BLOCKS.has(b.blockType) && b.score != null) c.rest_quality = b.score
    if (b.blockType === 'scrub') { c.scrub_score = b.score ?? null; c.scrub_cost = b.cost ?? null; c.scrub_type = b.variant ?? 'basic' }
    else if (b.blockType === 'massage') { c.massage_score = b.score ?? null; c.massage_cost = b.cost ?? null }
    else if (b.blockType === 'snack') { c.snack_score = b.score ?? null; c.snack_memo = b.memo ?? null }
    else if (b.blockType === 'restaurant') { c.restaurant_score = b.score ?? null; c.restaurant_memo = b.memo ?? null }
  }
  if (heatSec > 0) c.heat_time = Math.round(heatSec / 60)  // 분
  if (iceSec > 0) c.ice_time = iceSec                       // 초
  if (restSec > 0) c.rest_time = Math.round(restSec / 60)   // 분
  return c
}

async function insertBlocks(logId: string, blocks: LogBlockInput[]): Promise<void> {
  if (!blocks.length) return
  const rows = blocks.map((b, i) => ({
    log_id: logId,
    seq: i + 1,
    block_type: b.blockType,
    category: b.category,
    temp: b.temp ?? null,
    duration_sec: b.durationSec ?? null,
    score: b.score ?? null,
    cost: b.cost ?? null,
    memo: b.memo ?? null,
    variant: b.variant ?? null,
    norepeat: b.norepeat ?? false,
  }))
  const { error } = await supabase.from('log_blocks').insert(rows)
  if (error) throw error
}

// 블록 기준 시설 자동태깅 (block_type == PLACE_SPECS id, 건강세신=scrub만)
async function autoTagFromBlocks(placeId: string, blocks: LogBlockInput[]): Promise<void> {
  const tags = new Set<string>()
  for (const b of blocks) {
    if (NON_FACILITY_BLOCKS.has(b.blockType)) continue
    tags.add(b.blockType)  // scrub-withmassage 는 blockType='scrub' → scrub만 태깅
  }
  if (!tags.size) return
  const { data: place } = await supabase.from('places').select('facilities').eq('id', placeId).single()
  if (!place) return
  const current = (place.facilities as string[]) || []
  const newTags = [...tags].filter(t => !current.includes(t))
  if (newTags.length > 0) {
    await supabase.from('places').update({ facilities: [...current, ...newTags] }).eq('id', placeId)
  }
}

// 신규 로그 저장 (세션 + 블록 한 번에)
export async function insertLogWithBlocks(session: LogSessionInput, blocks: LogBlockInput[]): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')

  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: user.id,
      place_id: session.place_id,
      tribe_id: session.tribe_id,
      record_date: session.record_date ?? null,
      ...buildLogCaches(blocks, session),
    })
    .select('id')
    .single()

  if (error) throw error
  const logId = data.id as string
  await insertBlocks(logId, blocks)
  await autoTagFromBlocks(session.place_id, blocks)
  return logId
}

// 로그 편집 (캐시 갱신 + 블록 교체)
export async function updateLogWithBlocks(logId: string, session: LogSessionInput, blocks: LogBlockInput[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')

  const { error } = await supabase
    .from('logs')
    .update({
      place_id: session.place_id,
      tribe_id: session.tribe_id,
      record_date: session.record_date ?? null,
      ...buildLogCaches(blocks, session),
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) throw error
  await supabase.from('log_blocks').delete().eq('log_id', logId)
  await insertBlocks(logId, blocks)
  await autoTagFromBlocks(session.place_id, blocks)
}
