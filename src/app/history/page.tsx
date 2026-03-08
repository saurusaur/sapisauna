'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ICONS, TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, TRIBE_COLORS, TRIBE_IDS, MESSAGES } from '@/constants/content'
import { useUser } from '@/contexts/user-context'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import { useUserLogs } from '@/hooks/use-logs'
import type { LogWithPlace } from '@/types'
import RecordCard from '@/components/features/record-card'

// 뷰 모드: 리스트 or 캘린더
type ViewMode = 'list' | 'calendar'

// 타입 필터 옵션 (이모지는 TRIBE_EMOJI_MAP에서 참조)
const TRIBE_FILTER_IDS = ['all', ...TRIBE_IDS] as const

// 요일 헤더 (월요일 시작)
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

// 해당 월의 캘린더 그리드 생성 (월요일 시작)
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 월요일=0, 화요일=1, ..., 일요일=6
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6 // 일요일이면 6

  const days: (number | null)[] = []

  // 이전 달의 빈칸
  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  // 현재 달의 날짜
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d)
  }

  return days
}

// 월별로 로그의 날짜→타입 매핑
function getLogsByDate(logs: LogWithPlace[]) {
  const map: Record<string, LogWithPlace[]> = {}
  logs.forEach((log) => {
    const dateKey = log.date.slice(0, 10) // YYYY-MM-DD
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push(log)
  })
  return map
}

export default function History() {
  const router = useRouter()
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  // 기본 뷰: list (홈 달력에서 "전체보기"로 진입하므로 리스트가 자연스러움)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // DB 로그 로드
  const { data: allLogs, loading, error } = useUserLogs()

  // 캘린더: 현재 표시 월
  const today = new Date()
  const [calendarMonth, setCalendarMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 타입 필터 적용
  const typeFilteredLogs = typeFilter === 'all'
    ? allLogs
    : allLogs.filter((log) => log.tribe_id === typeFilter)

  // 검색어 + 타입 필터 적용
  const filteredLogs = searchQuery
    ? typeFilteredLogs.filter((log) =>
      log.place_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : typeFilteredLogs

  // 월별로 그룹화
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

  // 캘린더 데이터
  const logsByDate = useMemo(() => getLogsByDate(typeFilteredLogs), [typeFilteredLogs])
  const calendarDays = getCalendarDays(calendarMonth.year, calendarMonth.month)

  // 선택된 날짜의 로그
  const selectedDateLogs = selectedDate ? (logsByDate[selectedDate] || []) : []

  // 월별 요약
  const monthlySummary = useMemo(() => {
    const monthKey = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}`
    const monthLogs = typeFilteredLogs.filter((l) => l.date.startsWith(monthKey))
    const total = monthLogs.length
    const byType: Record<string, number> = {}
    monthLogs.forEach((l) => {
      byType[l.tribe_id] = (byType[l.tribe_id] || 0) + 1
    })
    return { total, byType }
  }, [calendarMonth, typeFilteredLogs])

  // 월 이동
  const goToPrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
    setSelectedDate(null)
  }

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/home')}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">{MESSAGES.HOME.CALENDAR_HEADING(user?.nickname)}</h1>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-stone-700' : 'text-stone-400'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>list</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-stone-700' : 'text-stone-400'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
          </button>
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
              color={id === 'all' ? 'var(--color-green)' : TRIBE_COLORS[id]}
            />
          )
        })}
      </div>

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <>
          {/* 검색 */}
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
                className="w-full pl-10 pr-10 py-3 bg-white rounded-xl shadow-sm text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
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
                  <h2 className="text-sm font-semibold text-stone-500 mb-3">{month}</h2>

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

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <main className="p-4">
          <DataState loading={loading} error={error} isEmpty={false}>
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow-sm p-3">
              <button
                onClick={goToPrevMonth}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="font-bold text-stone-700">
                {calendarMonth.year}년 {calendarMonth.month + 1}월
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* 월별 요약 */}
            {monthlySummary.total > 0 && (
              <div className="text-center text-sm text-stone-500 mb-4">
                <span className="font-medium">{calendarMonth.month + 1}월</span>
                <span className="text-stone-300 mx-1">·</span>
                <span>{monthlySummary.total}회 방문</span>
                {Object.entries(monthlySummary.byType).length > 0 && (
                  <>
                    <span className="text-stone-300 mx-1">·</span>
                    {Object.entries(monthlySummary.byType).map(([type, count]) => (
                      <span key={type} className="mx-0.5">
                        {TRIBE_EMOJI_MAP[type]}{count}
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* 캘린더 그리드 */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-stone-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="py-2" />
                  }

                  const dateKey = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayLogs = logsByDate[dateKey] || []
                  const isSelected = selectedDate === dateKey
                  const isToday =
                    today.getFullYear() === calendarMonth.year &&
                    today.getMonth() === calendarMonth.month &&
                    today.getDate() === day

                  // 해당 날짜의 고유 타입들 (dot 표시용)
                  const uniqueTypes = Array.from(new Set(dayLogs.map((l) => l.tribe_id)))

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                      className={`py-2 flex flex-col items-center gap-1 rounded-lg transition-all ${isSelected ? 'bg-stone-100' : ''
                        }`}
                    >
                      <span
                        className={`text-sm ${isToday
                          ? 'font-bold text-white bg-stone-700 w-6 h-6 rounded-full flex items-center justify-center'
                          : isSelected
                            ? 'font-bold text-stone-700'
                            : 'text-stone-600'
                          }`}
                      >
                        {day}
                      </span>

                      {/* 타입별 컬러 dot */}
                      <div className="flex gap-0.5 h-2 items-center">
                        {uniqueTypes.map((type) => (
                          <span
                            key={type}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: TRIBE_COLORS[type] || '#d6d3d1' }}
                          />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 선택된 날짜의 기록 */}
            {selectedDate && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-stone-500 mb-3">
                  {new Date(selectedDate + 'T00:00:00').getMonth() + 1}월 {new Date(selectedDate + 'T00:00:00').getDate()}일 기록
                </h3>

                {selectedDateLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-stone-400 text-sm">이 날의 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateLogs.map((log) => (
                      <RecordCard
                        key={log.id}
                        log={log}
                        onClick={() => router.push(`/history/${log.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 기록 없는 달 안내 */}
            {monthlySummary.total === 0 && !selectedDate && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-stone-300 mb-2 block">event_busy</span>
                <p className="text-stone-400 text-sm">이 달의 기록이 없습니다</p>
              </div>
            )}
          </DataState>
        </main>
      )}

      <BottomNav />
    </div>
  )
}
