/**
 * 리워드 서비스 — grantReward() 오케스트레이터
 * DB 읽기/쓰기를 포함하는 비즈니스 로직
 */

import { supabase } from './supabase'
import { XP_VALUES, type XpAction, TRIBE_LOG_MILESTONES, ACTIVITY_MILESTONES } from '@/constants/rewards'
import { levelFromXp, generateRandomTitle, addAdjectivePrefix } from './reward-engine'
import type { TribeId, RewardResult } from '@/types'

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

  return titles
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
    console.error('칭호 삽입 실패:', error)
    return false
  }
  return true
}
