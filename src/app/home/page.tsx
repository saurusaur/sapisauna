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

  const emptyMessage = MESSAGES.HOME.EMPTY_RECORD[primaryTribe] || MESSAGES.HOME.NO_RECORDS

  // 비로그인 → 로그인 페이지로 이동
  // TODO: 비로그인 홈 UI 복원 필요 시 git history 참조
  if (!authUser) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-dvh pb-24 bath-tile-bg">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <h1
          className="text-3xl font-extrabold italic font-heading"
        >
          HELLO{' '}
          <span style={{ color: 'var(--color-primary)' }}>SA-PIEN</span>
        </h1>
      </header>

      <main className="p-4 space-y-4">
        {/* 달력 섹션 */}
        <div>
          {/* "○○의 기록" + "전체 보기" — 카드 바깥 */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-stone-500">{MESSAGES.HOME.CALENDAR_HEADING(user?.nickname)}</h2>
            <button
              onClick={() => router.push('/history')}
              className="text-xs font-medium hover:opacity-70 transition-colors flex items-center gap-0.5"
              style={{ color: 'var(--color-accent)' }}
            >
              {MESSAGES.HOME.VIEW_ALL}
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            </button>
          </div>
          <DataState loading={loading} error={error} isEmpty={false}>
            <HomeCalendar
              logs={userLogs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </DataState>
        </div>

        {/* 선택 날짜의 기록 — 고정 높이 영역 */}
        <div className="h-[104px]">
          {loading ? (
            <div className="h-full glass-card flex items-center justify-center">
              <span className="text-stone-300 text-sm">{MESSAGES.HOME.LOADING}</span>
            </div>
          ) : selectedDateLogs.length === 0 ? (
            <button
              onClick={() => {
                localStorage.setItem('selectedRecordDate', selectedDate)
                router.push('/place')
              }}
              className="w-full h-full rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/30 transition-colors"
            >
              <p className="text-stone-400 text-sm mb-3">{emptyMessage}</p>
              <span
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                기록하기
              </span>
            </button>
          ) : selectedDateLogs.length === 1 ? (
            <RecordCard
              log={selectedDateLogs[0]}
              onClick={() => router.push(`/history/${selectedDateLogs[0].id}`)}
            />
          ) : (
            <div
              className="h-full flex gap-3 snap-x snap-mandatory"
              style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}
            >
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

        {/* 추천 섹션 placeholder */}
        {!loading && (
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-2">{MESSAGES.HOME.RECOMMEND_HEADING}</h2>
            <div className="glass-card p-6 text-center">
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
