/**
 * 유틸리티 함수
 * 앱 전반에서 재사용되는 헬퍼 함수들
 */

// ============================================
// 클래스명 합치기
// ============================================
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// 날짜/시간 포맷
// ============================================
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 날짜를 "YYYY.MM.DD (요일)" 형식으로 포맷
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const dayOfWeek = DAYS_KO[date.getDay()]
  return `${year}.${month}.${day} (${dayOfWeek})`
}

/**
 * 날짜를 "YYYY.MM.DD (요일) 오전/오후 HH:MM" 형식으로 포맷
 */
export function formatDateTime(date: Date): string {
  const datePart = formatDate(date)
  const hour = date.getHours()
  const period = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 || 12
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${datePart} ${period} ${hour12}:${minute}`
}

/**
 * 날짜를 "M/D" 형식으로 포맷 (리스트용)
 */
export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * ISO 문자열을 Date로 파싱
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

// ============================================
// 숫자 포맷
// ============================================

/**
 * 숫자를 천 단위 콤마가 있는 문자열로 포맷
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 거리를 m/km 형식으로 포맷
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * 비용 입력값 포맷 (숫자만 추출 후 콤마 추가)
 */
export function formatCostInput(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '')
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// ============================================
// 로컬 스토리지 헬퍼
// ============================================
export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },
}

// 스토리지 키 상수
export const STORAGE_KEYS = {
  USER: 'user',
  CURRENT_LOG: 'currentLog',
  SELECTED_PLACE: 'selectedPlace',
  SELECTED_TEMPLATE: 'selectedTemplate',
  LAST_BATH_GENDER: 'lastBathGender',
  FAVORITES: 'favorites',
} as const

// ============================================
// 점수 관련 유틸
// ============================================

/**
 * 또올래요 점수에 따른 이모지 반환
 */
export function getRevisitEmoji(score: number): string {
  if (score <= 2) return '😐'
  if (score >= 4) return '😍'
  return '🙂'
}

/**
 * 토토노이 강도 레이블 반환
 */
export function getTotonoLabel(score: number): string {
  const labels = ['', '그냥저냥', '나쁘지않음', '좋음', '최고', '승천']
  return labels[score] || ''
}

/**
 * 수질 레이블 반환
 */
export function getWaterQualityLabel(score: number): string {
  const labels = ['', '탁함', '조금탁함', '보통', '맑음', '아주맑음']
  return labels[score] || ''
}

/**
 * 휴식 퀄리티 레이블 반환
 */
export function getRestQualityLabel(score: number): string {
  const labels = ['', '별로', '그냥저냥', '괜찮음', '편안함', '꿀잠']
  return labels[score] || ''
}

/**
 * 청결도 레이블 반환
 */
export function getCleanlinessLabel(score: number): string {
  const labels = ['', '별로', '아쉬움', '보통', '깨끗', '완벽']
  return labels[score] || ''
}
