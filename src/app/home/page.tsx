'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES, LOGIN, NAV } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import { useUserLogs } from '@/hooks/use-logs'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'
import HomeCalendar from '@/components/features/home-calendar'
import RecordCard from '@/components/features/record-card'
import DataState from '@/components/ui/data-state'

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const { user, primaryTribe } = useUser()
  const { user: authUser } = useAuth()
  const { data: userLogs, loading, error } = useUserLogs()
  const [selectedDate, setSelectedDate] = useState(getTodayKey)

  const selectedDateLogs = useMemo(
    () => userLogs.filter((log) => log.date.slice(0, 10) === selectedDate),
    [userLogs, selectedDate]
  )

  const todayKey = getTodayKey()
  const hasTodayRecord = useMemo(
    () => userLogs.some((log) => log.date.slice(0, 10) === todayKey),
    [userLogs, todayKey]
  )

  const selectedDateDisplay = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }, [selectedDate])

  const emptyMessage = MESSAGES.HOME.EMPTY_RECORD[primaryTribe] || MESSAGES.HOME.NO_RECORDS

  // 비로그인
  if (!authUser) {
    return (
      <div className="min-h-screen pb-24 bath-tile-bg">
        <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <h1 className="text-xl font-bold text-stone-700">{LOGIN.HOME_TITLE}</h1>
        </header>
        <main className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-stone-500 text-center mb-8">{LOGIN.HOME_SUBTITLE}</p>
          <button
            onClick={() => router.push('/explore')}
            className="w-full max-w-xs py-4 px-6 bg-white rounded-2xl shadow-md text-stone-700 font-semibold mb-4 hover:shadow-lg transition-all"
          >
            {LOGIN.EXPLORE_CTA}
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full max-w-xs py-4 px-6 rounded-2xl text-white font-semibold hover:opacity-90 transition-all"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            {LOGIN.LOGIN_CTA}
          </button>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-xl font-bold text-stone-700">{MESSAGES.HOME.GREETING}</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* 달력 섹션 */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 mb-2">{MESSAGES.HOME.CALENDAR_HEADING(user?.nickname)}</h2>
          <DataState loading={loading} error={error} isEmpty={false}>
            <HomeCalendar
              logs={userLogs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onViewAll={() => router.push('/history')}
            />
          </DataState>
        </div>

        {/* 선택 날짜의 기록 — 고정 높이 영역 */}
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-2">
            {selectedDateDisplay}
          </h3>

          <div className="h-[104px]">
            {loading ? (
              <div className="h-full bg-white rounded-xl shadow-sm flex items-center justify-center">
                <span className="text-stone-300 text-sm">{MESSAGES.HOME.LOADING}</span>
              </div>
            ) : selectedDateLogs.length === 0 ? (
              <button
                onClick={() => {
                  // 선택한 날짜를 기록 페이지에 전달
                  localStorage.setItem('selectedRecordDate', selectedDate)
                  router.push('/place')
                }}
                className="w-full h-full bg-white/60 rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/80 transition-colors"
              >
                <p className="text-stone-400 text-sm mb-2">{emptyMessage}</p>
                <span className="text-stone-400 text-xs underline underline-offset-2">
                  {NAV.ADD_RECORD}
                </span>
              </button>
            ) : selectedDateLogs.length === 1 ? (
              <RecordCard
                log={selectedDateLogs[0]}
                onClick={() => router.push(`/history/${selectedDateLogs[0].id}`)}
              />
            ) : (
              <div className="h-full flex gap-3 overflow-x-auto snap-x snap-mandatory">
                {selectedDateLogs.map((log) => (
                  <div key={log.id} className="min-w-[85%] snap-start flex-shrink-0">
                    <RecordCard
                      log={log}
                      onClick={() => router.push(`/history/${log.id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 추천 섹션 placeholder */}
        {!loading && (
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-2">{MESSAGES.HOME.RECOMMEND_HEADING}</h2>
            <div className="bg-white/40 rounded-xl p-6 text-center border border-dashed border-stone-200">
              <span className="material-symbols-outlined text-stone-300 text-2xl mb-1 block">
                explore
              </span>
              <p className="text-stone-300 text-xs">{MESSAGES.HOME.RECOMMEND_PLACEHOLDER}</p>
            </div>
          </div>
        )}
      </main>

      <BottomNav showTooltip={!hasTodayRecord} />
    </div>
  )
}
