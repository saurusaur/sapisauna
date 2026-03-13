/**
 * 리워드 시스템 상수
 * XP 지급량, 레벨 커브, 칭호 풀, 마일스톤 맵
 */
import type { TribeId } from '@/types'

// ============================================
// XP 지급량
// ============================================
export const XP_VALUES = {
  welcome: 20,        // 가입 즉시
  short_log: 20,      // 숏로그 INSERT
  deep_log: 30,       // 딥로그 INSERT (독립 지급)
  place_created: 50,  // 장소 신규등록
  place_merged: 20,   // 장소 merge
} as const

export type XpAction = keyof typeof XP_VALUES

// ============================================
// 랜덤 칭호 풀 (형용사 15 × 명사 10 = 150가지)
// ============================================
export const ADJECTIVES = [
  '뜨거운', '은은한', '전설의', '촉촉한', '몽환적인',
  '끈기있는', '투명한', '고요한', '열정적인', '냉철한',
  '미지근한', '청량한', '불타는', '깊은', '고독한',
] as const

export const NOUNS = [
  '사우나러', '뢰일리 마스터', '증기술사', '입욕객', '냉탕고수',
  '찜질요정', '수질감별사', '토토노이스트', '한증막러', '물의 현자',
] as const

// ============================================
// 확정 마일스톤 칭호
// ============================================

// 기본 마일스톤
export const BASE_MILESTONES: Record<string, { condition: string; title: string }> = {
  signup: { condition: '가입', title: '사-피엔스' },
  beta_signup: { condition: '베타 기간 가입', title: '첫 사-피엔스' },
}

// 트라이브별 로그 수 마일스톤
export const TRIBE_LOG_MILESTONES: Record<TribeId, { count: number; title: string }[]> = {
  saunner: [
    { count: 1, title: '사우나돌' },
    { count: 10, title: '열기 수련생' },
    { count: 30, title: '증기의 제왕' },
  ],
  bather: [
    { count: 1, title: '물두꺼비' },
    { count: 10, title: '탕의 수호자' },
    { count: 30, title: '용왕의 후예' },
  ],
  jimi: [
    { count: 1, title: '구운달걀' },
    { count: 10, title: '불가마 단골' },
    { count: 30, title: '불의 지배자' },
  ],
}

// 장소·활동 마일스톤 (조건 판별은 서비스에서)
export const ACTIVITY_MILESTONES = {
  all_tribes: { condition: '3트라이브 모두 기록', title: '노마드' },
  first_place: { condition: '첫 장소 등록', title: '개척자' },
  places_10: { condition: '장소 10개', title: '탐험가' },
  places_30: { condition: '장소 30개', title: '지도제작자' },
} as const
