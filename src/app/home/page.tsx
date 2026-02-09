'use client'

import { useRouter } from 'next/navigation'
import { MESSAGES, TYPE_DEFAULTS, TYPE_PERSONA_MAP } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import { DUMMY_LOGS } from '@/data/dummy-logs'
import { useUser } from '@/contexts/user-context'
import AddRecordCard from '@/components/features/add-record-card'
import RecordCard from '@/components/features/record-card'

export default function Home() {
  const router = useRouter()
  const { user, primaryType } = useUser()

  // 최신 3건 표시 (dummy-logs.ts와 동기화)
  const recentLogs = DUMMY_LOGS.slice(0, 3)
  const typeDefaults = TYPE_DEFAULTS[primaryType]

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-xl font-bold text-stone-700">
          {user ? `Hello, ${TYPE_PERSONA_MAP[primaryType]}` : '안녕하세요'}
        </h1>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {/* 인사말 */}
        {user && (
          <p className="text-stone-500 mb-6">{typeDefaults.greeting}</p>
        )}

        {/* 오늘의 기록 버튼 */}
        <AddRecordCard onClick={() => router.push('/place')} />

        {/* 최근 기록 */}
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
