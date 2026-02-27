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
import { QUICK_LOG } from '@/constants/content'
import type { DummyLog } from '@/data/dummy-logs'

/**
 * steps 배열에서 value 이하인 가장 가까운 라벨을 반환
 */
export function getStepLabel(steps: readonly { value: number; label: string }[], value: number): string {
  return [...steps].filter(s => s.value <= value).sort((a, b) => b.value - a.value)[0]?.label
    ?? steps[0]?.label ?? ''
}

/**
 * 수질 레이블 반환 (content.ts SSOT)
 */
export function getWaterQualityLabel(score: number): string {
  return getStepLabel(QUICK_LOG.BATHER.WATER_QUALITY.steps, score)
}

/**
 * 청결도 레이블 반환 (content.ts SSOT)
 */
export function getCleanlinessLabel(score: number): string {
  return getStepLabel(QUICK_LOG.JIMI.CLEANLINESS.steps, score)
}

/**
 * 로그 타입별 상세 텍스트 생성 (record-card, history 상세 등에서 공유)
 */
export function getDetailText(log: Pick<DummyLog, 'tribe_id' | 'sauna_temp' | 'cold_bath_temp' | 'repeat' | 'hot_bath_temp' | 'water_quality' | 'jjim_temp' | 'cleanliness'>): string {
  switch (log.tribe_id) {
    case 'saunner':
      return `사우나 ${log.sauna_temp}°C · 냉탕 ${log.cold_bath_temp}°C · ${log.repeat}세트`
    case 'bather':
      return `수질 ${getWaterQualityLabel(log.water_quality || 3)} · 온탕 ${log.hot_bath_temp}°C`
    case 'jimi':
      return log.jjim_temp
        ? `한증막 ${log.jjim_temp}°C · 청결 ${getCleanlinessLabel(log.cleanliness || 3)}`
        : `청결 ${getCleanlinessLabel(log.cleanliness || 3)}`
    default:
      return ''
  }
}
