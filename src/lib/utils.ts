/**
 * 유틸리티 함수
 */

// 클래스명 합치기
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// 날짜 포맷
export function formatDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = days[date.getDay()]

  return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${dayOfWeek})`
}

// 시간 포맷
export function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? '오전' : '오후'
  const displayHours = hours % 12 || 12

  return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`
}

// 숫자 포맷 (천 단위 콤마)
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

// 거리 포맷
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// 로컬 스토리지 헬퍼
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

// 스토리지 키
export const STORAGE_KEYS = {
  USER_PROFILE: 'sauna-log-user-profile',
  LAST_TYPE: 'sauna-log-last-type',
  ONBOARDING_DONE: 'sauna-log-onboarding-done',
}
