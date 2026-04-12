'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, TRIBE_COLORS, TRIBE_IDS, MESSAGES } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import HomeCalendar from '@/components/features/home-calendar'
import RecordCard from '@/components/features/record-card'
import { useUserLogs } from '@/hooks/use-logs'
import type { LogWithPlace, TribeId } from '@/types'
import {
  KpiRow,
  PeriodToggle,
  RoutineCard,
  InsightCard,
} from '@/components/features/history-dashboard'
import type { Period } from '@/components/features/history-dashboard'
import {
  getMonthRange,
  getISOWeekRange,
  filterByDateRange,
  computeKpi,
  computeRoutine,
  computeWeeklyHeatMinutes,
  computeMonthWeekRings,
  computeAllInsight,
  computeBatherInsight,
  computeSaunnerInsight,
  computeJimiInsight,
} from '@/lib/history-stats'

// 뷰 모드: 리스트 or 캘린더
type ViewMode = 'list' | 'calendar'

// 타입 필터 옵션
const TRIBE_FILTER_IDS = ['all', ...TRIBE_IDS] as const

export default function History() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // DB 로그 로드
  const { data: allLogs, loading, error } = useUserLogs()

  // 캘린더: 선택된 날짜
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(todayKey)

  // 대시보드: 캘린더 현재 월 (onMonthChange로 동기화)
  const [calendarMonth, setCalendarMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  })

  // 대시보드: 기간 토글 (WEEK / MONTH)
  const [period, setPeriod] = useState<Period>('week')

  // 타입 필터 적용
  const typeFilteredLogs = typeFilter === 'all'
    ? allLogs
    : allLogs.filter((log) => log.tribe_id === typeFilter)

  // 검색어 + 타입 필터 적용 (리스트 뷰용)
  const filteredLogs = searchQuery
    ? typeFilteredLogs.filter((log) =>
      log.place_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : typeFilteredLogs

  // 월별 그룹화 (리스트 뷰용)
  const groupByMonth = (logs: LogWithPlace[]) => {
    const groups: Record<string, LogWithPlace[]> = {}
    logs.forEach((log) => {
      const date = new Date(log.date)
      const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`
      if (!groups[key]) groups[key] = []
      groups[key].push(log)
    })
    return groups
  }
  const groupedLogs = groupByMonth(filteredLogs)

  // ============================================
  // 대시보드 계산 (캘린더 뷰에서만 사용)
  // ============================================

  // 현재 월 범위
  const monthRange = useMemo(
    () => getMonthRange(calendarMonth.year, calendarMonth.month),
    [calendarMonth],
  )

  // 현재 월 로그 (tribe 필터 적용)
  const monthLogs = useMemo(
    () => filterByDateRange(typeFilteredLogs, monthRange),
    [typeFilteredLogs, monthRange],
  )

  // 기간 범위 (WEEK or MONTH)
  const periodRange = useMemo(
    () => period === 'week' ? getISOWeekRange(selectedDate) : monthRange,
    [period, selectedDate, monthRange],
  )

  // 기간별 로그 (루틴/인사이트용)
  const periodLogs = useMemo(
    () => filterByDateRange(typeFilteredLogs, periodRange),
    [typeFilteredLogs, periodRange],
  )

  // KPI (항상 월 기준)
  const kpi = useMemo(
    () => computeKpi(typeFilteredLogs, monthLogs, calendarMonth.year, calendarMonth.month),
    [typeFilteredLogs, monthLogs, calendarMonth],
  )

  // 루틴 (기간별)
  const routine = useMemo(() => computeRoutine(periodLogs), [periodLogs])

  // 인사이트 (트라이브별, 기간별)
  const allInsight = useMemo(() => {
    if (typeFilter !== 'all') return undefined
    // 해당 기간 이전의 로그
    const priorLogs = allLogs.filter((l) => l.date.slice(0, 10) < periodRange.start)
    return computeAllInsight(periodLogs, priorLogs)
  }, [typeFilter, periodLogs, allLogs, periodRange])

  const batherInsight = useMemo(() => {
    if (typeFilter !== 'bather') return undefined
    return computeBatherInsight(periodLogs)
  }, [typeFilter, periodLogs])

  const saunnerInsight = useMemo(() => {
    if (typeFilter !== 'saunner') return undefined
    return computeSaunnerInsight(periodLogs)
  }, [typeFilter, periodLogs])

  const jimiInsight = useMemo(() => {
    if (typeFilter !== 'jimi') return undefined
    return computeJimiInsight(periodLogs)
  }, [typeFilter, periodLogs])

  // 주간 링 데이터 (MONTH 모드일 때 2x2 그리드용)
  const weekRings = useMemo(() => {
    if (period !== 'month') return undefined
    return computeMonthWeekRings(typeFilteredLogs, calendarMonth.year, calendarMonth.month, typeFilter)
  }, [period, typeFilteredLogs, calendarMonth])

  // 트라이브 컬러
  const currentColor = typeFilter === 'all'
    ? 'var(--color-primary)'
    : TRIBE_COLORS[typeFilter as TribeId]

  // dotColor: 전체 탭이면 undefined (캘린더 내부에서 트라이브별 자동 결정)
  const dotColor = typeFilter === 'all' ? undefined : TRIBE_COLORS[typeFilter as TribeId]

  // 해당 기간에 기록이 없는지 (루틴/인사이트 흐림 처리용)
  const isPeriodEmpty = periodLogs.length === 0

  // 트라이브명 (KPI 헤더용)
  const tribeName = typeFilter === 'all' ? 'ALL' : TRIBE_PERSONA_MAP[typeFilter] || 'ALL'

  // 선택된 날짜의 로그
  const selectedDateLogs = useMemo(
    () => typeFilteredLogs.filter((l) => l.date.slice(0, 10) === selectedDate),
    [typeFilteredLogs, selectedDate],
  )

  // 최근 기록: 선택 날짜 로그가 있으면 그것, 없으면 현재 월 최근 3개
  const recentLogs = useMemo(() => {
    if (selectedDateLogs.length > 0) return selectedDateLogs
    // fallback: 현재 월 최근 3개
    return monthLogs.slice(0, 3)
  }, [selectedDateLogs, monthLogs])

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold italic font-heading">
            HISTORY
          </h1>
          {/* 뷰 모드 토글 */}
          <div className="flex bg-stone-100/60 backdrop-blur-sm rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-white/80 shadow-sm text-stone-700' : 'text-stone-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white/80 shadow-sm text-stone-700' : 'text-stone-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>list</span>
            </button>
          </div>
        </div>
      </header>

      {/* 타입 필터 (이모지 칩) */}
      <div className="px-4 pt-3 flex gap-1.5">
        {TRIBE_FILTER_IDS.map((id) => {
          const emoji = id !== 'all' ? TRIBE_EMOJI_MAP[id] : ''
          const label = id === 'all' ? '전체' : TRIBE_PERSONA_MAP[id]
          return (
            <TypeTab
              key={id}
              label={emoji ? `${emoji} ${label}` : label}
              active={typeFilter === id}
              onClick={() => setTypeFilter(id)}
              color={id === 'all' ? 'var(--color-primary)' : TRIBE_COLORS[id]}
            />
          )
        })}
      </div>

      {/* ===== 리스트 뷰 (기존 그대로) ===== */}
      {viewMode === 'list' && (
        <>
          <div className="px-4 pt-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="장소명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 glass-input rounded-full text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>
          </div>
          <main className="p-4">
            <DataState loading={loading} error={error} isEmpty={Object.keys(groupedLogs).length === 0} emptyIcon="search_off" emptyMessage={searchQuery ? `'${searchQuery}'에 대한 기록이 없습니다` : '기록이 없습니다'}>
              {Object.entries(groupedLogs).map(([month, logs]) => (
                <div key={month} className="mb-6">
                  <h2 className="text-sm font-semibold text-stone-500 mb-3">
                    {month} <span className="text-stone-400 font-normal">(총 {logs.length}회)</span>
                  </h2>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <RecordCard
                        key={log.id}
                        log={log}
                        onClick={() => router.push(`/history/${log.id}`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </DataState>
          </main>
        </>
      )}

      {/* ===== 캘린더 뷰 (대시보드) ===== */}
      {viewMode === 'calendar' && (
        <main className="p-4 space-y-3">
          <DataState loading={loading} error={error} isEmpty={false}>
            {/* KPI (헤더 "이번 달 요약" + "기록의 역사" 내장) */}
            <KpiRow {...kpi} accentColor={currentColor} tribeName={tribeName} />

            {/* 캘린더 (기존 HomeCalendar) */}
            <HomeCalendar
              logs={typeFilteredLogs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              defaultExpanded={false}
              onMonthChange={setCalendarMonth}
              dotColor={dotColor}
            />

            {/* 기간 토글 */}
            <PeriodToggle value={period} onChange={setPeriod} />

            {/* 인사이트 카드 (먼저) */}
            <InsightCard
              tribe={typeFilter}
              period={period}
              color={currentColor}
              weekRings={weekRings}
              allInsight={allInsight}
              batherInsight={batherInsight}
              saunnerInsight={saunnerInsight}
              jimiInsight={jimiInsight}
              isEmpty={isPeriodEmpty}
            />

            {/* 루틴 카드 (전체 탭에서는 미표시) */}
            {typeFilter !== 'all' && (
              <RoutineCard
                tribe={typeFilter}
                routine={routine}
                color={currentColor}
                isEmpty={isPeriodEmpty}
              />
            )}

            {/* 최근 기록 */}
            <div className="mt-1">
              <p className="text-[11px] font-bold text-stone-500 px-1 mb-2">
                {selectedDateLogs.length > 0
                  ? `${new Date(selectedDate + 'T00:00:00').getMonth() + 1}월 ${new Date(selectedDate + 'T00:00:00').getDate()}일 기록`
                  : '최근 기록'
                }
              </p>
              {recentLogs.length === 0 ? (
                <button
                  onClick={() => {
                    localStorage.setItem('selectedRecordDate', selectedDate)
                    router.push('/place')
                  }}
                  className="w-full h-[104px] rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/30 transition-colors"
                >
                  <p className="text-stone-400 text-sm mb-2">
                    {typeFilter !== 'all' && (MESSAGES.HOME.EMPTY_RECORD as Record<string, string>)[typeFilter]
                      ? (MESSAGES.HOME.EMPTY_RECORD as Record<string, string>)[typeFilter]
                      : MESSAGES.HOME.NO_RECORDS}
                  </p>
                  <span
                    className="text-sm font-medium underline underline-offset-2"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    기록하기
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <RecordCard
                      key={log.id}
                      log={log}
                      onClick={() => router.push(`/history/${log.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </DataState>
        </main>
      )}

      <BottomNav />
    </div>
  )
}
