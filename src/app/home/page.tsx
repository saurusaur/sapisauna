'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES, BUTTONS, NAV, ICONS, TYPE_DEFAULTS, TYPE_EMOJI_MAP, TYPE_PERSONA_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'

// 사용자 타입
type UserData = {
  nickname: string
  user_types: string[]
  primary_type: 'bather' | 'saunner' | 'jimi'
}

// 최근 기록 타입
type RecentLog = {
  id: string
  place_name: string
  date: string
  log_type: 'bather' | 'saunner' | 'jimi'
  revisit_score: number
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // 더미 데이터 (MVP)
    setRecentLogs([
      { id: '1', place_name: '스파랜드', date: '1/25 (토)', log_type: 'saunner', revisit_score: 4 },
      { id: '2', place_name: '청학동목욕탕', date: '1/20 (월)', log_type: 'bather', revisit_score: 3 },
    ])
  }, [])

  const primaryType = user?.primary_type || 'saunner'
  const typeDefaults = TYPE_DEFAULTS[primaryType]

  // 또올래요 점수 표시
  const renderRevisitScore = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i <= score ? 'bg-orange' : 'bg-stone-200'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-700">
          {user ? `Hello, ${TYPE_PERSONA_MAP[primaryType]}` : '안녕하세요'}
        </h1>
        <button
          onClick={() => router.push('/settings')}
          className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined">person</span>
        </button>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {/* 인사말 */}
        {user && (
          <p className="text-stone-500 mb-6">{typeDefaults.greeting}</p>
        )}

        {/* 오늘의 기록 버튼 */}
        <button
          onClick={() => router.push('/place')}
          className="w-full py-12 mb-8 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--color-green-light)' }}
        >
          <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-green)' }}>add</span>
          <span className="font-semibold text-lg" style={{ color: 'var(--color-green)' }}>{BUTTONS.ADD_RECORD}</span>
        </button>

        {/* 최근 기록 */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 mb-3">{MESSAGES.HOME.RECENT_RECORDS}</h2>

          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => router.push(`/history/${log.id}`)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-sm">location_on</span>
                      <span className="font-medium text-stone-700">{log.place_name}</span>
                    </div>
                    <span className="text-sm text-stone-400">{log.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {TYPE_EMOJI_MAP[log.log_type]} {TYPE_CATEGORY_MAP[log.log_type]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">또올래요</span>
                      {renderRevisitScore(log.revisit_score)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-stone-400 mb-4">{MESSAGES.HOME.NO_RECORDS}</p>
            </div>
          )}
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200">
        <div className="flex justify-around py-3 max-w-md mx-auto">
          <button className="flex flex-col items-center" style={{ color: 'var(--color-green)' }}>
            <span className="material-symbols-outlined">{ICONS.HOME}</span>
            <span className="text-xs mt-1">{NAV.HOME}</span>
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex flex-col items-center text-stone-400 hover:text-stone-600"
          >
            <span className="material-symbols-outlined">{ICONS.HISTORY}</span>
            <span className="text-xs mt-1">{NAV.HISTORY}</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center text-stone-400 hover:text-stone-600"
          >
            <span className="material-symbols-outlined">{ICONS.SETTINGS}</span>
            <span className="text-xs mt-1">{NAV.SETTINGS}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
