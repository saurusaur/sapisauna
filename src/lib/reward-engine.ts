/**
 * 리워드 엔진 — 순수 함수 (DB 접근 없음)
 * XP 계산, 레벨 계산, 칭호 생성
 */

import { ADJECTIVES, NOUNS } from '@/constants/rewards'

// ============================================
// 피보나치 (메모이제이션)
// ============================================
const fibCache: Record<number, number> = { 0: 0, 1: 1 }
function fib(n: number): number {
  if (n in fibCache) return fibCache[n]
  fibCache[n] = fib(n - 1) + fib(n - 2)
  return fibCache[n]
}

// ============================================
// 레벨별 필요 XP (해당 레벨→다음 레벨)
// ============================================
export function xpForLevel(lv: number): number {
  // Lv0→1: 웰컴 20XP로 즉시 달성 (계산에서는 20)
  if (lv === 0) return 20
  // Tier 1 (Lv 1-10): 40 고정
  if (lv <= 10) return 40
  // Tier 2 (Lv 11-30): fib(lv - 9) × 30
  if (lv <= 30) return fib(lv - 9) * 30
  // Tier 3 (Lv 31+): 2000 + (lv - 30)² × 10
  return 2000 + Math.pow(lv - 30, 2) * 10
}

// ============================================
// 누적 XP → 레벨 계산
// ============================================
export function levelFromXp(totalXp: number): number {
  let remaining = totalXp
  let lv = 0
  while (remaining >= xpForLevel(lv)) {
    remaining -= xpForLevel(lv)
    lv++
  }
  return lv
}

// ============================================
// 현재 레벨 내 진행률 (0~1)
// ============================================
export function levelProgress(totalXp: number): number {
  let remaining = totalXp
  let lv = 0
  while (remaining >= xpForLevel(lv)) {
    remaining -= xpForLevel(lv)
    lv++
  }
  const needed = xpForLevel(lv)
  return needed > 0 ? remaining / needed : 0
}

// ============================================
// 현재 레벨 내 잔여 XP / 필요 XP
// ============================================
export function levelXpInfo(totalXp: number): { current: number; needed: number } {
  let remaining = totalXp
  let lv = 0
  while (remaining >= xpForLevel(lv)) {
    remaining -= xpForLevel(lv)
    lv++
  }
  return { current: remaining, needed: xpForLevel(lv) }
}

// ============================================
// 랜덤 칭호 생성 (형용사 + 명사)
// ============================================
export function generateRandomTitle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj} ${noun}`
}

// ============================================
// 마일스톤 칭호에 랜덤 형용사 prefix 부착
// ============================================
export function addAdjectivePrefix(title: string): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  return `${adj} ${title}`
}
