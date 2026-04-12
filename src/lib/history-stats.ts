/**
 * history-stats.ts
 * History Dashboard 통계 계산 유틸리티
 * React 의존 없음 — 순수 함수만 포함
 */

import type { LogWithPlace, TribeId } from '@/types'

// ============================================
// 타입 정의
// ============================================

export interface DateRange {
  start: string // 'YYYY-MM-DD' inclusive
  end: string   // 'YYYY-MM-DD' inclusive
}

export interface KpiData {
  recordedDays: number    // 기록한 날 (unique dates)
  daysInMonth: number     // 해당 월 총 일수
  uniquePlaces: number    // 다녀온 곳 (unique place_id)
  allTimeCount: number    // 역대 방문 (전체 기간 로그 수)
}

export interface RoutineData {
  avgHeatTime: number | null
  avgIceTime: number | null
  avgPauseTime: number | null
  avgRepeat: number | null
}

export interface WeekRingData {
  weekLabel: string       // "W1", "W2", ...
  heatMinutes: number     // 해당 주 heat exposure (분)
  target: number          // 목표 (57분)
}

// ============================================
// 날짜 헬퍼
// ============================================

/** 해당 월의 총 일수 */
export function getDaysInMonth(year: number, month: number): number {
  // month: 0-based (0=1월, 11=12월)
  return new Date(year, month + 1, 0).getDate()
}

/** 해당 월의 날짜 범위 (0-based month) */
export function getMonthRange(year: number, month: number): DateRange {
  const lastDay = getDaysInMonth(year, month)
  const m = String(month + 1).padStart(2, '0')
  return {
    start: `${year}-${m}-01`,
    end: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

/** 주어진 날짜가 속한 ISO 주의 월~일 범위 */
export function getISOWeekRange(dateStr: string): DateRange {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  // 월요일 = 1, 일요일 = 0 → 월요일 기준으로 변환
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: toDateKey(monday),
    end: toDateKey(sunday),
  }
}

/** 해당 월에 포함된 주(week) 목록 반환 (월요일~일요일 전체, clamp 없음)
 * W1의 월요일이 전달에 있어도 그 주 전체(월~일)를 범위로 반환
 * → 월간 뷰에서 각 주의 heat exposure를 실제 한 주 기준으로 계산 */
export function getWeeksInMonth(year: number, month: number): DateRange[] {
  const weeks: DateRange[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 1일이 속한 주의 월요일 찾기
  const current = new Date(firstDay)
  const dow = current.getDay()
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  current.setDate(current.getDate() + diffToMonday)

  while (current <= lastDay) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // clamp 없이 전체 주 범위 사용
    weeks.push({
      start: toDateKey(weekStart),
      end: toDateKey(weekEnd),
    })

    current.setDate(current.getDate() + 7)
  }

  return weeks
}

/** Date → 'YYYY-MM-DD' */
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ============================================
// 필터링
// ============================================

/** 날짜 범위로 로그 필터링 */
export function filterByDateRange(logs: LogWithPlace[], range: DateRange): LogWithPlace[] {
  return logs.filter((log) => {
    const d = log.date.slice(0, 10)
    return d >= range.start && d <= range.end
  })
}

/** 트라이브로 필터링 ('all'이면 전체 반환) */
export function filterByTribe(logs: LogWithPlace[], tribe: string): LogWithPlace[] {
  if (tribe === 'all') return logs
  return logs.filter((log) => log.tribe_id === tribe)
}

// ============================================
// KPI 계산
// ============================================

/** KPI 데이터 계산 (월 기준 + 역대 방문) */
export function computeKpi(
  allLogs: LogWithPlace[],     // 전체 기간 로그 (tribe 필터 적용 후)
  monthLogs: LogWithPlace[],   // 현재 월 로그
  year: number,
  month: number,
): KpiData {
  const dates = new Set(monthLogs.map((l) => l.date.slice(0, 10)))
  const places = new Set(monthLogs.map((l) => l.place_id))
  return {
    recordedDays: dates.size,
    daysInMonth: getDaysInMonth(year, month),
    uniquePlaces: places.size,
    allTimeCount: allLogs.length,
  }
}

// ============================================
// 루틴 계산
// ============================================

/** 안전한 평균 계산 (유효 값만, 없으면 null) */
function safeAvg(values: (number | undefined | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0)
  if (valid.length === 0) return null
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
}

/** 안전한 합계 */
function safeSum(values: (number | undefined | null)[]): number {
  return values.filter((v): v is number => v != null).reduce((a, b) => a + b, 0)
}

/** 루틴 평균 계산 */
export function computeRoutine(logs: LogWithPlace[]): RoutineData {
  return {
    avgHeatTime: safeAvg(logs.map((l) => l.heat_time)),
    avgIceTime: safeAvg(logs.map((l) => l.ice_time)),
    avgPauseTime: safeAvg(logs.map((l) => l.pause_time)),
    avgRepeat: safeAvg(logs.map((l) => l.repeat)),
  }
}

// ============================================
// 히트 링 계산
// ============================================

const HEAT_TARGET = 57 // 주간 목표 분

/** 주간 heat exposure 계산: sum(heat_time * repeat), 둘 다 있는 로그만 */
export function computeWeeklyHeatMinutes(logs: LogWithPlace[]): number {
  return logs.reduce((sum, log) => {
    if (log.heat_time != null && log.repeat != null) {
      return sum + log.heat_time * log.repeat
    }
    return sum
  }, 0)
}

/** 월간 주별 링 데이터 (2x2 그리드용) */
export function computeMonthWeekRings(
  logs: LogWithPlace[],
  year: number,
  month: number,
): WeekRingData[] {
  const weeks = getWeeksInMonth(year, month)
  return weeks.map((range, i) => {
    const weekLogs = filterByDateRange(logs, range)
    return {
      weekLabel: `W${i + 1}`,
      heatMinutes: computeWeeklyHeatMinutes(weekLogs),
      target: HEAT_TARGET,
    }
  })
}

// ============================================
// 인사이트 계산 — 트라이브별
// ============================================

export interface AllInsight {
  weeklyHeatMinutes: number
  heatTarget: number
  newPlaces: number
  avgRevisitScore: number | null
}

/** 전체 탭 인사이트 */
export function computeAllInsight(
  periodLogs: LogWithPlace[],
  allLogsBeforePeriod: LogWithPlace[],
): AllInsight {
  // 신규 방문 장소: 이 기간에 방문했지만 이전에 방문한 적 없는 장소
  const priorPlaces = new Set(allLogsBeforePeriod.map((l) => l.place_id))
  const periodPlaces = new Set(periodLogs.map((l) => l.place_id))
  let newPlaces = 0
  periodPlaces.forEach((pid) => {
    if (!priorPlaces.has(pid)) newPlaces++
  })

  return {
    weeklyHeatMinutes: computeWeeklyHeatMinutes(periodLogs),
    heatTarget: HEAT_TARGET,
    newPlaces,
    avgRevisitScore: safeAvg(periodLogs.map((l) => l.revisit_score)),
  }
}

export interface BatherInsight {
  weeklyHeatMinutes: number
  heatTarget: number
  avgHotBathTemp: number | null
  avgWaterQuality: number | null
}

/** Bather 인사이트 */
export function computeBatherInsight(logs: LogWithPlace[]): BatherInsight {
  return {
    weeklyHeatMinutes: computeWeeklyHeatMinutes(logs),
    heatTarget: HEAT_TARGET,
    avgHotBathTemp: safeAvg(logs.map((l) => l.hot_bath_temp)),
    avgWaterQuality: safeAvg(logs.map((l) => l.water_quality)),
  }
}

export interface SaunnerInsight {
  weeklyHeatMinutes: number
  heatTarget: number
  avgTempDiff: number | null
  avgTotonoScore: number | null
}

/** Saunner 인사이트 */
export function computeSaunnerInsight(logs: LogWithPlace[]): SaunnerInsight {
  // 평균 온도차: sauna_temp - cold_bath_temp (둘 다 있는 로그만)
  const tempDiffs = logs
    .filter((l) => l.sauna_temp != null && l.cold_bath_temp != null)
    .map((l) => l.sauna_temp! - l.cold_bath_temp!)
  const avgTempDiff = tempDiffs.length > 0
    ? Math.round((tempDiffs.reduce((a, b) => a + b, 0) / tempDiffs.length) * 10) / 10
    : null

  return {
    weeklyHeatMinutes: computeWeeklyHeatMinutes(logs),
    heatTarget: HEAT_TARGET,
    avgTempDiff,
    avgTotonoScore: safeAvg(logs.map((l) => l.totono_score)),
  }
}

export interface JimiInsight {
  weeklyHeatMinutes: number
  heatTarget: number
  avgJjimTemp: number | null
  avgSweatQuality: number | null
}

/** Jimi 인사이트 */
export function computeJimiInsight(logs: LogWithPlace[]): JimiInsight {
  return {
    weeklyHeatMinutes: computeWeeklyHeatMinutes(logs),
    heatTarget: HEAT_TARGET,
    avgJjimTemp: safeAvg(logs.map((l) => l.jjim_temp)),
    avgSweatQuality: safeAvg(logs.map((l) => l.sweat_quality)),
  }
}
