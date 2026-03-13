'use client'

/**
 * 프로필 카드 — 홈 헤더 아래 미니멀 글래스 카드
 * 닉네임 · 칭호 | 기록 N건 · 방문 N곳 · Lv.N + 프로그레스바
 * 탭 → 칭호 인벤토리
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
    <button
      onClick={() => router.push('/settings/titles')}
      className="w-full glass-card p-4 text-left transition-all hover:shadow-md active:scale-[0.98]"
    >
      {/* 1줄: 닉네임 · 칭호 */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-stone-700">
          {user.nickname}
        </span>
        {user.active_title && (
          <>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-500 truncate">
              {user.active_title}
            </span>
          </>
        )}
      </div>

      {/* 2줄: 3컬럼 균등 배분 */}
      <div className="grid grid-cols-3">
        {/* 기록 */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-stone-700 font-heading leading-none">
            {logCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">기록</span>
        </div>
        {/* 방문 */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-stone-700 font-heading leading-none">
            {placeCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">방문</span>
        </div>
        {/* 레벨 + 프로그레스바 */}
        <div className="flex flex-col items-center">
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
        </div>
      </div>
    </button>
  )
}
