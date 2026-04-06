'use client'

/**
 * 프로필 카드 — 홈 헤더 아래 미니멀 글래스 카드
 * 닉네임 · 칭호 | 기록 · 방문 · Lv (각각 독립 탭 영역)
 */

import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useUserLogs } from '@/hooks/use-logs'
import { levelProgress } from '@/lib/reward-engine'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { TRIBE_EMOJI_MAP } from '@/constants/content'

export default function ProfileCard() {
  const router = useRouter()
  const { user } = useUser()
  const { data: logs } = useUserLogs()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  if (!user) {
    return (
      <>
        <button
          onClick={() => requireAuth()}
          className="w-full glass-card-light p-5 transition-all active:scale-[0.98] text-center"
        >
          <span
            className="material-symbols-outlined mb-1"
            style={{ fontSize: '28px', color: 'var(--color-primary)' }}
          >
            person
          </span>
          <p className="text-sm text-stone-500">나만의 사우나 카드를 만들어보세요</p>
        </button>
        <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
      </>
    )
  }

  const logCount = logs.length
  const placeCount = new Set(logs.map(l => l.place_id)).size
  const progress = levelProgress(user.xp ?? 0)
  const percent = Math.round(progress * 100)

  return (
    <div className="w-full glass-card-light p-4 transition-all">
      {/* 1줄: 아이콘 + 닉네임 · 칭호 */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: user.profile_color || `var(--color-${user.primary_type || 'saunner'})` }}
        >
          <span className="text-lg leading-none">{user.profile_emoji || TRIBE_EMOJI_MAP[user.primary_type || 'saunner']}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-bold text-stone-700 truncate">
            {user.nickname}
          </span>
          {user.active_title && (
            <span className="text-[11px] text-amber-600/70 px-1.5 py-0.5 rounded-full bg-amber-50 truncate flex-shrink-0">
              {user.active_title}
            </span>
          )}
        </div>
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
