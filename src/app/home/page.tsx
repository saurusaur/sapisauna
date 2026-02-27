'use client'

import { useRouter } from 'next/navigation'
import { MESSAGES, TRIBE_DEFAULTS, TRIBE_PERSONA_MAP, LOGIN } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import { DUMMY_LOGS } from '@/data/dummy-logs'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'
import AddRecordCard from '@/components/features/add-record-card'
import RecordCard from '@/components/features/record-card'

export default function Home() {
  const router = useRouter()
  const { user, primaryTribe } = useUser()
  const { user: authUser } = useAuth()

  // 비로그인 상태: 공개 CTA
  if (!authUser) {
    return (
      <div className="min-h-screen pb-20 bath-tile-bg">
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

  // 로그인 상태: 기존 홈
  const recentLogs = DUMMY_LOGS.slice(0, 3)
  const tribeDefaults = TRIBE_DEFAULTS[primaryTribe]

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-xl font-bold text-stone-700">
          {user ? `Hello, ${TRIBE_PERSONA_MAP[primaryTribe]}` : '안녕하세요'}
        </h1>
      </header>

      <main className="p-6">
        {user && (
          <p className="text-stone-500 mb-6">{tribeDefaults.greeting}</p>
        )}

        <AddRecordCard onClick={() => router.push('/place')} />

        <div>
          <h2 className="text-sm font-semibold text-stone-500 mb-3">{MESSAGES.HOME.RECENT_RECORDS}</h2>

          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <RecordCard
                  key={log.id}
                  log={log}
                  onClick={() => router.push(`/history/${log.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-stone-400 mb-4">{MESSAGES.HOME.NO_RECORDS}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
