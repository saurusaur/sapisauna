'use client'

/**
 * 프로필 카드 — 홈 헤더 아래 미니멀 글래스 카드
 * 닉네임 · 칭호 | 기록 · 방문 · Lv (각각 독립 탭 영역)
 */

import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useUserLogs } from '@/hooks/use-logs'
import { levelProgress } from '@/lib/reward-engine'

export default function ProfileCard() {
  const router = useRouter()
  const { user } = useUser()
  const { data: logs } = useUserLogs()

  if (!user) return null

  const logCount = logs.length
  const placeCount = new Set(logs.map(l => l.place_id)).size
  const progress = levelProgress(user.xp ?? 0)
  const percent = Math.round(progress * 100)

  return (
    <div className="w-full glass-card-light p-4 transition-all">
      {/* 1줄: 닉네임 · 칭호 */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-stone-700">
          {user.nickname}
        </span>
        {user.active_title && (
          <span className="text-sm text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50 truncate">
            {user.active_title}
          </span>
        )}
      </div>

      {/* 2줄: 3컬럼 — 기록 / 방문 / 레벨 (각각 독립 탭 영역) */}
      <div className="grid grid-cols-3">
        {/* 기록 → 내 기록 보기 */}
        <button
          onClick={() => router.push('/history')}
          className="flex flex-col items-center active:scale-95 transition-transform"
        >
          <span className="text-lg font-bold text-stone-700 font-heading leading-none">
            {logCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">기록</span>
        </button>
        {/* 방문 → 탐색 */}
        <button
          onClick={() => router.push('/explore')}
          className="flex flex-col items-center active:scale-95 transition-transform"
        >
          <span className="text-lg font-bold text-stone-700 font-heading leading-none">
            {placeCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">방문</span>
        </button>
        {/* 레벨 → 칭호 선택 */}
        <button
          onClick={() => router.push('/settings/titles')}
          className="flex flex-col items-center active:scale-95 transition-transform"
        >
          <span className="text-lg font-bold text-stone-700 font-heading leading-none">
            Lv.{user.level ?? 0}
          </span>
          <div className="w-12 h-1.5 rounded-full bg-stone-200 overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
        </button>
      </div>
    </div>
  )
}
