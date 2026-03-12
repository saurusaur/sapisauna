'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, TRIBE_COLORS, TRIBE_IDS, MESSAGES, NAV } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import HomeCalendar from '@/components/features/home-calendar'
import { useUserLogs } from '@/hooks/use-logs'
import type { LogWithPlace } from '@/types'
import RecordCard from '@/components/features/record-card'

// 뷰 모드: 리스트 or 캘린더
type ViewMode = 'list' | 'calendar'

// 타입 필터 옵션 (이모지는 TRIBE_EMOJI_MAP에서 참조)
const TRIBE_FILTER_IDS = ['all', ...TRIBE_IDS] as const

export default function History() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  // 기본 뷰: list (홈 달력에서 "전체보기"로 진입하므로 리스트가 자연스러움)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // DB 로그 로드
  const { data: allLogs, loading, error } = useUserLogs()

  // 캘린더: 선택된 날짜 (오늘 기본)
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(todayKey)

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

  // 선택된 날짜의 로그
  const selectedDateLogs = useMemo(() => {
    return typeFilteredLogs.filter((l) => l.date.slice(0, 10) === selectedDate)
  }, [typeFilteredLogs, selectedDate])

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      {/* 헤더 — tribe picks 전체보기와 동일 스타일 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            HISTORY
          </h1>

          {/* 뷰 모드 토글 — 우측 정렬 */}
          <div className="flex bg-stone-100/60 backdrop-blur-sm rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white/80 shadow-sm text-stone-700' : 'text-stone-400'
                }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>list</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-white/80 shadow-sm text-stone-700' : 'text-stone-400'
                }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
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
              label={emoji ? `${emoji} ${label.toUpperCase()}` : label}
              active={typeFilter === id}
              onClick={() => setTypeFilter(id)}
              color={id === 'all' ? 'var(--color-primary)' : TRIBE_COLORS[id]}
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
            {/* HomeCalendar 재사용 — 월간 뷰 기본 */}
            <HomeCalendar
              logs={typeFilteredLogs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              defaultExpanded
            />

            {/* 선택된 날짜의 기록 */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-stone-500 mb-3">
                {new Date(selectedDate + 'T00:00:00').getMonth() + 1}월 {new Date(selectedDate + 'T00:00:00').getDate()}일 기록
              </h3>

              {selectedDateLogs.length === 0 ? (
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
          </DataState>
        </main>
      )}

      <BottomNav />
    </div>
  )
}
