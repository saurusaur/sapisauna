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
 * 날짜를 "YYYY.MM.DD (요일) 오전/오후 H시" 형식으로 포맷
 */
export function formatDateTime(date: Date): string {
  const datePart = formatDate(date)
  const hour = date.getHours()
  const period = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 || 12
  return `${datePart} ${period} ${hour12}시`
}

/**
 * 날짜를 "M/D" 형식으로 포맷 (리스트용)
 */
export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 상대 시간 포맷 (방금/N분 전/N시간 전/N일 전/M/D)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
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
// JSON 안전 파싱 — localStorage 등에서 읽은 문자열을 파싱할 때 사용
// 파싱 실패 시 fallback 반환 (크래시 방지)
// fallback이 null이면 any | null 반환 (JSON.parse의 원래 동작 유지)
export function safeParse(json: string | null, fallback: null): any | null
export function safeParse<T>(json: string | null, fallback: T): T
export function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) } catch { return fallback }
}

// 로컬 스토리지 헬퍼
// ============================================
export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    const item = localStorage.getItem(key)
    return safeParse<T | null>(item, null)
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
import { QUICK_LOG, FACILITY_LABEL_MAP } from '@/constants/content'

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
 * 휴식 퀄리티 레이블 반환 (content.ts SSOT)
 */
export function getRestQualityLabel(score: number): string {
  return getStepLabel(QUICK_LOG.JIMI.REST_QUALITY.steps, score)
}

/**
 * 주소에서 짧은 주소 생성
 * - 한국: "서울특별시 강남구 영동대로 513" → "서울 강남구"
 * - 해외: "123 Main St, Brooklyn, New York" → "Brooklyn, New York"
 */
export function generateShortAddress(address: string, countryCode?: string): string {
  if (!address) return ''

  // 해외 주소: 숫자/기호 제거 → 콤마 있으면 콤마로, 없으면 공백으로 분리 → 뒤에서 2개
  if (countryCode && countryCode !== 'KR') {
    const cleaned = address.replace(/[〒#\d-]+/g, '').replace(/\s+/g, ' ').trim()
    const hasComma = cleaned.includes(',')
    const parts = hasComma
      ? cleaned.split(',').map(p => p.trim()).filter(Boolean)
      : cleaned.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return parts.slice(-2).join(hasComma ? ', ' : ' ')
    return parts[0] || address
  }

  // 한국 주소: 앞에서 2개(시/도, 구/군)
  const parts = address.split(/\s+/)
  if (parts.length < 2) return address
  const city = parts[0]
    .replace(/특별시|광역시|특별자치시|특별자치도/, '')
    .replace(/도$/, '')
  const district = parts[1]
  return `${city} ${district}`
}

/**
 * 시설 라벨 (영어 id → 한국어)
 */
export function getFacilityLabel(id: string): string {
  return FACILITY_LABEL_MAP[id] || id
}

/**
 * 로그 타입별 상세 텍스트 생성 (record-card, history 상세 등에서 공유)
 */
// 트라이브별 숏로그에 표시할 필드 순서 — shortLabel은 QUICK_LOG SSOT 참조
const DETAIL_FIELDS: Record<string, { field: string; shortLabel: string; unit: string }[]> = {
  saunner: [
    { field: 'sauna_temp', shortLabel: QUICK_LOG.SAUNER.SAUNA_TEMP.shortLabel, unit: '°' },
    { field: 'cold_bath_temp', shortLabel: QUICK_LOG.COMMON.COLD_BATH_TEMP.shortLabel, unit: '°' },
    { field: 'totono_score', shortLabel: QUICK_LOG.SAUNER.TOTONO.shortLabel, unit: '/5' },
  ],
  bather: [
    { field: 'hot_bath_temp', shortLabel: QUICK_LOG.BATHER.HOT_BATH_TEMP.shortLabel, unit: '°' },
    { field: 'cold_bath_temp', shortLabel: QUICK_LOG.COMMON.COLD_BATH_TEMP.shortLabel, unit: '°' },
    { field: 'water_quality', shortLabel: QUICK_LOG.BATHER.WATER_QUALITY.shortLabel, unit: '/5' },
  ],
  jimi: [
    { field: 'jjim_temp', shortLabel: QUICK_LOG.JIMI.JJIM_TEMP.shortLabel, unit: '°' },
    { field: 'sweat_quality', shortLabel: QUICK_LOG.JIMI.SWEAT_QUALITY.shortLabel, unit: '/5' },
    { field: 'rest_quality', shortLabel: QUICK_LOG.JIMI.REST_QUALITY.shortLabel, unit: '/5' },
  ],
}

export function getDetailText(log: { tribe_id: string; sauna_temp?: number; cold_bath_temp?: number; repeat?: number; hot_bath_temp?: number; water_quality?: number; jjim_temp?: number; sweat_quality?: number; rest_quality?: number; totono_score?: number }): string {
  const fields = DETAIL_FIELDS[log.tribe_id] || []
  const parts: string[] = []
  for (const { field, shortLabel, unit } of fields) {
    const val = (log as Record<string, unknown>)[field]
    if (val != null) parts.push(`${shortLabel} ${val}${unit}`)
  }
  return parts.join(' · ')
}
