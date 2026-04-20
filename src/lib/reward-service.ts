/**
 * 리워드 서비스 — grantReward() 오케스트레이터
 * DB 읽기/쓰기를 포함하는 비즈니스 로직
 */

import { supabase } from './supabase'
import { captureError } from './error-logger'
import { XP_VALUES, type XpAction, TRIBE_LOG_MILESTONES, ACTIVITY_MILESTONES, LIST_MILESTONES } from '@/constants/rewards'
import { levelFromXp, generateRandomTitle, addAdjectivePrefix } from './reward-engine'
import type { TribeId, RewardResult, SaList } from '@/types'

/**
 * XP 지급 + 레벨업 체크 + 칭호 드롭
 * @param action - XP 행동 종류
 * @param meta - 추가 정보 (tribeId 등)
 * @returns RewardResult | null (로그인 안 됐으면 null)
 */
export async function grantReward(
  action: XpAction,
  meta?: { tribeId?: TribeId }
): Promise<RewardResult | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. 현재 XP/레벨 조회
  const { data: profile } = await supabase
    .from('users')
    .select('xp, level')
    .eq('id', user.id)
    .single()

  const oldXp = profile?.xp ?? 0
  const oldLevel = profile?.level ?? 0
  const xpGained = XP_VALUES[action]
  const newTotalXp = oldXp + xpGained
  const newLevel = levelFromXp(newTotalXp)
  const leveledUp = newLevel > oldLevel

  // 2. XP + 레벨 업데이트
  await supabase
    .from('users')
    .update({ xp: newTotalXp, level: newLevel })
    .eq('id', user.id)

  // 3. 칭호 드롭
  const newTitles: string[] = []

  // 레벨업 시 랜덤 칭호 1개
  if (leveledUp) {
    const randomTitle = generateRandomTitle()
    await insertTitle(user.id, randomTitle, 'random')
    newTitles.push(randomTitle)
  }

  // 마일스톤 칭호 체크
  const milestoneTitles = await checkMilestones(user.id, action, meta)
  newTitles.push(...milestoneTitles)

  // 첫 칭호면 active_title 자동 설정
  if (newTitles.length > 0) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('active_title')
      .eq('id', user.id)
      .single()

    if (!currentUser?.active_title) {
      await supabase
        .from('users')
        .update({ active_title: newTitles[0] })
        .eq('id', user.id)
    }
  }

  return {
    xpGained,
    newTotalXp,
    oldLevel,
    newLevel,
    leveledUp,
    newTitles,
  }
}

// ============================================
// 마일스톤 체크 (action 기반)
// ============================================
async function checkMilestones(
  userId: string,
  action: XpAction,
  meta?: { tribeId?: TribeId }
): Promise<string[]> {
  const titles: string[] = []

  // 로그 관련 마일스톤 (short_log, deep_log)
  if ((action === 'short_log' || action === 'deep_log') && meta?.tribeId) {
    const tribeId = meta.tribeId
    const milestones = TRIBE_LOG_MILESTONES[tribeId]
    if (milestones) {
      // 해당 tribe 로그 수 조회
      const { count } = await supabase
        .from('logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tribe_id', tribeId)

      const logCount = count ?? 0
      for (const m of milestones) {
        if (logCount === m.count) {
          const title = addAdjectivePrefix(m.title)
          const inserted = await insertTitle(userId, title, 'milestone', m.title)
          if (inserted) titles.push(title)
        }
      }
    }

    // 3트라이브 노마드 체크
    const { data: tribeTypes } = await supabase
      .from('logs')
      .select('tribe_id')
      .eq('user_id', userId)

    if (tribeTypes) {
      const uniqueTribes = new Set(tribeTypes.map(r => r.tribe_id))
      if (uniqueTribes.size >= 3) {
        const base = ACTIVITY_MILESTONES.all_tribes.title
        const title = addAdjectivePrefix(base)
        const inserted = await insertTitle(userId, title, 'milestone', base)
        if (inserted) titles.push(title)
      }
    }
  }

  // 장소 관련 마일스톤
  if (action === 'place_created') {
    const { count } = await supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)

    const placeCount = count ?? 0

    if (placeCount === 1) {
      const base = ACTIVITY_MILESTONES.first_place.title
      const title = addAdjectivePrefix(base)
      const inserted = await insertTitle(userId, title, 'milestone', base)
      if (inserted) titles.push(title)
    }
    if (placeCount === 10) {
      const base = ACTIVITY_MILESTONES.places_10.title
      const title = addAdjectivePrefix(base)
      const inserted = await insertTitle(userId, title, 'milestone', base)
      if (inserted) titles.push(title)
    }
    if (placeCount === 30) {
      const base = ACTIVITY_MILESTONES.places_30.title
      const title = addAdjectivePrefix(base)
      const inserted = await insertTitle(userId, title, 'milestone', base)
      if (inserted) titles.push(title)
    }
  }

  // 사-리스트 생성 마일스톤 — 큐레이터(1) / 컬렉터(5)
  if (action === 'list_created') {
    const { count } = await supabase
      .from('lists')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('type', 'user')

    const listCount = count ?? 0

    if (listCount >= 1) {
      const base = LIST_MILESTONES.first_list.title
      const title = addAdjectivePrefix(base)
      const inserted = await insertTitle(userId, title, 'milestone', base)
      if (inserted) titles.push(title)
    }
    if (listCount >= 5) {
      const base = LIST_MILESTONES.lists_5.title
      const title = addAdjectivePrefix(base)
      const inserted = await insertTitle(userId, title, 'milestone', base)
      if (inserted) titles.push(title)
    }
  }

  return titles
}

// ============================================
// 사-리스트 마일스톤 헬퍼 — XP 없이 칭호만 부여
// ============================================

/**
 * 백과사전 마일스톤 — addPlaceToList 직후 호출
 * 그 리스트의 place_count >= 30 이면 부여 (중복은 base_title로 dedup)
 */
export async function checkPlaceInListMilestone(
  userId: string,
  newPlaceCount: number
): Promise<void> {
  if (newPlaceCount < 30) return
  const base = LIST_MILESTONES.places_in_list_30.title
  const title = addAdjectivePrefix(base)
  await insertTitle(userId, title, 'milestone', base)
  await ensureActiveTitle(userId, title)
}

/**
 * 구독자 마일스톤 lazy 체크 — getMyLists 후 호출
 * 본인 리스트 중 가장 큰 subscriber_count 기준으로 1/10/50 단계 부여
 */
export async function checkSubscriberMilestones(
  userId: string,
  lists: SaList[]
): Promise<void> {
  const owned = lists.filter((l) => l.owner_id === userId)
  if (owned.length === 0) return
  const maxSubs = owned.reduce((m, l) => Math.max(m, l.subscriber_count ?? 0), 0)

  const tiers: Array<{ threshold: number; base: string }> = [
    { threshold: 1,  base: LIST_MILESTONES.subscribers_1.title },
    { threshold: 10, base: LIST_MILESTONES.subscribers_10.title },
    { threshold: 50, base: LIST_MILESTONES.subscribers_50.title },
  ]

  for (const t of tiers) {
    if (maxSubs < t.threshold) continue
    const title = addAdjectivePrefix(t.base)
    const inserted = await insertTitle(userId, title, 'milestone', t.base)
    if (inserted) await ensureActiveTitle(userId, title)
  }
}

// 첫 칭호면 active_title로 자동 설정
async function ensureActiveTitle(userId: string, title: string): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('active_title')
    .eq('id', userId)
    .single()
  if (!data?.active_title) {
    await supabase.from('users').update({ active_title: title }).eq('id', userId)
  }
}

// ============================================
// 칭호 DB 삽입 (중복 무시)
// baseTitle: 마일스톤 칭호의 원본명 (형용사 제외). 이미 같은 base_title이 있으면 skip
// ============================================
async function insertTitle(
  userId: string,
  title: string,
  source: string,
  baseTitle?: string
): Promise<boolean> {
  // 마일스톤: base_title로 중복 체크 (형용사 달라도 같은 칭호면 skip)
  if (baseTitle) {
    const { data: existing } = await supabase
      .from('user_titles')
      .select('id')
      .eq('user_id', userId)
      .eq('base_title', baseTitle)
      .limit(1)
      .single()

    if (existing) return false
  }

  const { error } = await supabase
    .from('user_titles')
    .insert({ user_id: userId, title, source, base_title: baseTitle || null })

  if (error) {
    if (error.code === '23505') return false
    captureError(error, { label: '칭호 삽입 실패' })
    return false
  }
  return true
}
