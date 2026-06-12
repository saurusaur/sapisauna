/**
 * 리워드 시스템 상수
 * XP 지급량, 레벨 커브, 칭호 풀, 마일스톤 맵
 */
import type { TribeId } from '@/types'

// 베타 기간 플래그 — false로 바꾸면 랜덤 형용사 칭호로 복원
export const IS_BETA = true

// ============================================
// XP 지급량
// ============================================
export const XP_VALUES = {
  welcome: 20,        // 가입 즉시
  // 로그 = 단일 행동 (구 short_log/deep_log 2단 폐기 — v6 단일 폼)
  log: 20,            // 로그 INSERT (기본 체크인)
  log_routine: 15,    // 보너스: 루틴 상세(내 활동 블록의 온도·시간) 1개 이상 입력
  log_detail: 15,     // 보너스: 세부 기록(더자세히·블록 평가·시설 온도) 1개 이상 입력
  place_created: 50,  // 장소 신규등록
  place_merged: 20,   // 장소 merge
  list_created: 30,   // 사-리스트 생성 (default 제외, user-type만)
} as const

export type XpAction = keyof typeof XP_VALUES

// ============================================
// 랜덤 칭호 풀 (형용사 20 × 명사 17 = 340가지)
// ============================================
export const ADJECTIVES = [
  '뜨거운', '은은한', '전설의', '촉촉한', '순수한',
  '투명한', '고요한', '열정적인', '냉철한', '묵직한',
  '청량한', '불타는', '깊은', '고독한', '고귀한',
  '상쾌한', '신비한', '정결한', '강렬한', '황홀한',
] as const

export const NOUNS = [
  '사우너', '증기술사', '입욕객', '냉탕고수', '찜질요정',
  '수질감별사', '반신욕도사', '식혜감별사', '습도감정관', '냉온달인',
  '양머리도사', '세신이모', '타올장인', '온도평론가', '사-덕',
  '단골', '동네주민',
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
    { count: 1, title: '맥반석란' },
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

// 사-리스트 마일스톤 (조건 판별은 reward-service에서)
// 큐레이터/컬렉터: createList 직후, 백과사전: addPlaceToList 직후, 구독자 시리즈: getMyLists lazy
export const LIST_MILESTONES = {
  first_list:       { condition: '첫 리스트 생성',     title: '큐레이터' },
  lists_5:          { condition: '리스트 5개 생성',    title: '컬렉터' },
  places_in_list_30:{ condition: '리스트에 장소 30개', title: '백과사전' },
  subscribers_1:    { condition: '첫 구독자 달성',     title: '안내자' },
  subscribers_10:   { condition: '구독자 10명 달성',   title: '촌장' },
  subscribers_50:   { condition: '구독자 50명 달성',   title: '사플루언서' },
} as const

// ============================================
// base_title → 사유 매핑 (titles 페이지용)
// ============================================
const TRIBE_LABELS: Record<TribeId, string> = {
  saunner: '사우나',
  bather: '목욕',
  jimi: '찜질',
}

/** 마일스톤 칭호의 획득 사유를 반환. 매칭 안 되면 null */
export function getMilestoneCondition(baseTitle: string): string | null {
  for (const m of Object.values(BASE_MILESTONES)) {
    if (m.title === baseTitle) return m.condition
  }
  for (const m of Object.values(ACTIVITY_MILESTONES)) {
    if (m.title === baseTitle) return m.condition
  }
  for (const m of Object.values(LIST_MILESTONES)) {
    if (m.title === baseTitle) return m.condition
  }
  for (const [tribeId, milestones] of Object.entries(TRIBE_LOG_MILESTONES) as [TribeId, { count: number; title: string }[]][]) {
    for (const m of milestones) {
      if (m.title === baseTitle) {
        return `${TRIBE_LABELS[tribeId]} ${m.count === 1 ? '첫 기록' : `${m.count}회 기록`}`
      }
    }
  }
  return null
}
