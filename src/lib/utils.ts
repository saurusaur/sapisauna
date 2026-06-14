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
// 색상 변환 (Hue 슬라이더용)
// — 프로필: HSL 파스텔, 리스트: OKLCH perceptual-uniform
// DB에는 hue(0~360)만 저장. hex는 렌더 시점에 계산.
// ============================================
import { formatHex, formatRgb, clampChroma } from 'culori'

/** 프로필 아이콘 색상 톤 — 맑은 파스텔 (HSL) */
export const COVER_TONE = { s: 38, l: 82 } as const

/** hue → 프로필 커버 색상 Hex (파스텔) */
export function coverHex(hue: number): string {
  return hslToHex(hue, COVER_TONE.s, COVER_TONE.l)
}

/**
 * 사-리스트 커버 색상 톤 — OKLCH 기반.
 * HSL 대비 모든 hue에서 체감 밝기 균일 (라임/시안 눈부심 해결).
 * l: lightness (0~1), c: chroma (0~0.4)
 */
export const LIST_COVER_TONE = { l: 0.70, c: 0.15 } as const

/** hue → 리스트 커버 색상 Hex (OKLCH). sRGB gamut 밖이면 chroma 클램핑. */
export function listCoverHex(hue: number): string {
  const color = clampChroma(
    { mode: 'oklch', l: LIST_COVER_TONE.l, c: LIST_COVER_TONE.c, h: hue },
    'oklch'
  )
  return formatHex(color) ?? '#78716c'
}

/** 리스트 커버 배경색 — hue NULL이면 기본 스톤 회색 */
export function listBgColor(hue: number | null | undefined): string {
  return hue == null ? '#78716c' : listCoverHex(hue)
}

// ============================================
// 리스트 hue 4톤 파생 (사리스트 리디자인)
// — 유저가 고른 cover_hue 하나에서 화면 전체 톤을 함수로 생성.
//   bg: 연한 파스텔(잉크 글자용 헤더/카드 배경)
//   accent: 라벨·아이콘·버튼 텍스트
//   accentSoft: 비활성/placeholder
//   tint: 메모 박스 등 반투명 배경 (rgba)
// 기존 LIST_COVER_TONE(l .70)은 흰 글자용 진한 커버 — 용도가 다르므로 유지.
// ============================================
// 파스텔(밝고 옅음) 회피 — 앱의 따뜻하고 단단한 톤에 맞춰 더 깊고 채도 있게.
// bg는 어두운 잉크색 제목이 읽히는 한도에서 최대한 낮춘 명도.
export const LIST_DERIVED_TONES = {
  bg: { l: 0.8, c: 0.1 },
  accent: { l: 0.48, c: 0.13 },
  accentSoft: { l: 0.62, c: 0.1 },
  tint: { l: 0.78, c: 0.1, alpha: 0.34 },
} as const

export interface ListToneColors {
  bg: string
  accent: string
  accentSoft: string
  tint: string
}

/** OKLCH(l, c, hue) → hex. gamut 밖이면 chroma 클램핑 */
function listToneHex(hue: number, l: number, c: number): string {
  const color = clampChroma({ mode: 'oklch', l, c, h: hue }, 'oklch')
  return formatHex(color) ?? '#78716c'
}

/** cover_hue → 4톤 세트. hue NULL이면 스톤 계열 폴백 */
export function listToneColors(hue: number | null | undefined): ListToneColors {
  if (hue == null) {
    return {
      bg: '#e8e4e0',
      accent: '#78716c',
      accentSoft: '#a8a29e',
      tint: 'rgba(168, 162, 158, 0.18)',
    }
  }
  const t = LIST_DERIVED_TONES
  const tintColor = clampChroma(
    { mode: 'oklch', l: t.tint.l, c: t.tint.c, h: hue },
    'oklch'
  )
  const tintRgb = formatRgb({ ...tintColor, alpha: t.tint.alpha })
  return {
    bg: listToneHex(hue, t.bg.l, t.bg.c),
    accent: listToneHex(hue, t.accent.l, t.accent.c),
    accentSoft: listToneHex(hue, t.accentSoft.l, t.accentSoft.c),
    tint: tintRgb ?? 'rgba(168, 162, 158, 0.18)',
  }
}

/** 태그 문자열 → 결정적 hue(0~360). 태그 타일 색상용 */
export function tagHue(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

/** 프로필 아이콘 배경색 — hue NULL이면 fallback(트라이브 색 등) */
export function profileBgColor(
  hue: number | null | undefined,
  fallback: string
): string {
  return hue == null ? fallback : coverHex(hue)
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// ============================================
// 점수 관련 유틸
// ============================================
import { QUICK_LOG, FACILITY_LABEL_MAP, BLOCK_TYPE_MAP } from '@/constants/content'

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
 * 한국 주소에서 통용 도시명 추출 (네이버 지도 검색용)
 * - "서울특별시 용산구 ..." → "서울"
 * - "경상북도 경주시 ..." → "경주"
 * - "경기도 수원시 장안구 ..." → "수원"
 */
export function getCommonCityName(address: string): string {
  if (!address) return ''

  const cityMap: Record<string, string> = {
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '제주특별자치도': '제주',
  }

  const parts = address.split(/\s+/)
  const sido = parts[0]

  if (cityMap[sido]) return cityMap[sido]

  // 도 단위 (경기도 수원시 → 수원)
  if (sido.endsWith('도') && parts.length > 1) {
    return parts[1].replace(/시$/, '')
  }

  return sido
}

/**
 * 시설 라벨 (영어 id → 한국어)
 */
export function getFacilityLabel(id: string): string {
  const clean = id.replace(/"/g, '')
  return FACILITY_LABEL_MAP[clean] || clean
}

/**
 * 로그 타입별 상세 텍스트 생성 (record-card, history 상세 등에서 공유)
 */
// 트라이브별 숏로그에 표시할 필드 순서
// 온도 시설 라벨 = BLOCK_TYPES(SSOT)의 label, 평가 항목 라벨 = QUICK_LOG
const DETAIL_FIELDS: Record<string, { field: string; shortLabel: string; unit: string }[]> = {
  saunner: [
    // 사우너의 사우나(건식/습식) 표시는 getDetailText 내부에서 primary 기반으로 처리.
    // 여기에 sauna_temp를 두지 않음 (중복 방지).
    { field: 'cold_bath_temp', shortLabel: BLOCK_TYPE_MAP['cold-bath'].label, unit: '°' },
    { field: 'totono_score', shortLabel: QUICK_LOG.SAUNER.TOTONO.shortLabel, unit: '/5' },
  ],
  bather: [
    { field: 'hot_bath_temp', shortLabel: BLOCK_TYPE_MAP['hot-bath'].label, unit: '°' },
    { field: 'cold_bath_temp', shortLabel: BLOCK_TYPE_MAP['cold-bath'].label, unit: '°' },
    { field: 'water_quality', shortLabel: QUICK_LOG.BATHER.WATER_QUALITY.shortLabel, unit: '/5' },
  ],
  jimi: [
    { field: 'bulgama_temp', shortLabel: BLOCK_TYPE_MAP['bulgama'].label, unit: '°' },
    { field: 'sweat_quality', shortLabel: QUICK_LOG.JIMI.SWEAT_QUALITY.shortLabel, unit: '/5' },
    { field: 'rest_quality', shortLabel: QUICK_LOG.JIMI.REST_QUALITY.shortLabel, unit: '/5' },
  ],
}

export function getDetailText(log: { tribe_id: string; dry_sauna_temp?: number | null; steam_sauna_temp?: number; primary_sauna_kind?: 'dry' | 'steam'; cold_bath_temp?: number; repeat?: number; hot_bath_temp?: number; water_quality?: number; bulgama_temp?: number | null; sweat_quality?: number; rest_quality?: number; totono_score?: number }): string {
  const parts: string[] = []
  // 사우너: 주 이용 사우나(건식/습식) 우선 표시
  if (log.tribe_id === 'saunner') {
    const isSteam = log.primary_sauna_kind === 'steam'
      || (log.primary_sauna_kind == null && log.dry_sauna_temp == null && log.steam_sauna_temp != null)
    const value = isSteam ? log.steam_sauna_temp : log.dry_sauna_temp
    if (value != null) {
      const label = isSteam ? '습식' : BLOCK_TYPE_MAP['dry-sauna'].label
      parts.push(`${label} ${value}°`)
    }
  }
  const fields = DETAIL_FIELDS[log.tribe_id] || []
  for (const { field, shortLabel, unit } of fields) {
    const val = (log as Record<string, unknown>)[field]
    if (val != null) parts.push(`${shortLabel} ${val}${unit}`)
  }
  return parts.join(' · ')
}

/**
 * 상세 기록(구 딥로그) 존재 여부 — 평탄 캐시 필드 기준.
 * record-card 이중링/캘린더 점/히스토리 상세 카드 노출 판단에 공유.
 */
export function hasLogDetail(log: {
  cleanliness?: number | null; crowd?: string | null; companion?: string | null
  cost?: number | null; memo?: string | null
  scrub_score?: number | null; massage_score?: number | null
  snack_score?: number | null; restaurant_score?: number | null
}): boolean {
  return log.cleanliness != null || log.crowd != null || log.companion != null
    || log.cost != null || log.memo != null
    || log.scrub_score != null || log.massage_score != null
    || log.snack_score != null || log.restaurant_score != null
}
