'use client'

/**
 * 프로필 카드 — 홈 헤더 아래 글래스 카드
 * Row 1: 아바타 + 닉네임/칭호 (→ 유저 홈) + 레벨 프로그레스바 (→ 칭호)
 * Row 2: 이번 주 열기 링 + 총 기록 + 방문 장소 (→ 내 기록)
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useUserLogs } from '@/hooks/use-logs'
import { levelProgress } from '@/lib/reward-engine'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { HeatRing } from '@/components/features/history-dashboard'
import { getISOWeekRange, filterByDateRange, computeWeeklyHeatMinutes, getHeatTarget } from '@/lib/history-stats'

export default function ProfileCard() {
  const router = useRouter()
  const { user } = useUser()
  const { data: logs } = useUserLogs()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // 이번 주 열기 계산 (전체 기록 기준)
  const todayKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const weeklyHeat = useMemo(() => {
    const range = getISOWeekRange(todayKey)
    const weekLogs = filterByDateRange(logs, range)
    return computeWeeklyHeatMinutes(weekLogs)
  }, [logs, todayKey])

  const heatTarget = getHeatTarget('all')

  if (!user) {
    return (
      <>
        <button
          onClick={() => requireAuth()}
          className="relative w-full glass-card-light p-4 transition-all active:scale-[0.98] overflow-hidden"
        >
          <div className="opacity-40">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.5 }} />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-stone-700">SA-PIEN</span>
                <span className="text-[11px] text-amber-600/70 px-1.5 py-0.5 rounded-full bg-amber-50">예비 사-피엔스</span>
              </div>
            </div>
            <div className="grid grid-cols-3 h-[52px]">
              <div className="flex items-center justify-center">
                <HeatRing current={0} target={57} size={44} strokeWidth={4} color="var(--color-primary)" showLabel={false} />
              </div>
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold text-stone-700 font-heading">0</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold text-stone-700 font-heading">0</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl">
            <p className="text-sm font-medium text-stone-600">나만의 사우나 카드를 만들어보세요</p>
          </div>
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
      {/* Row 1: 프로필 (→ 유저 홈) + 레벨 (→ 칭호) */}
      <div className="flex items-center gap-2.5 mb-4">
        {/* 프로필 영역 — 향후 유저 홈으로 링크 */}
        <button
          onClick={() => {/* TODO: router.push('/user/home') */}}
          className="flex items-center gap-2.5 min-w-0 flex-1 active:scale-[0.98] transition-transform"
        >
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
        </button>

        {/* 레벨 → 칭호 선택 */}
        <button
          onClick={() => router.push('/settings/titles')}
          className="flex items-center gap-2 flex-shrink-0 active:scale-95 transition-transform"
        >
          <div className="w-6 h-[3px] rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, backgroundColor: 'var(--color-primary)' }}
            />
          </div>
          <span className="text-xs font-semibold text-stone-500 font-heading">
            Lv.{user.level ?? 0}
          </span>
        </button>
      </div>

      {/* Row 2: 링 + 총 기록 + 방문 장소 (전부 → 내 기록) */}
      <button
        onClick={() => router.push('/history')}
        className="w-full active:scale-[0.98] transition-transform"
      >
        {/* 값 줄 */}
        <div className="grid grid-cols-3 h-[52px]">
          <div className="flex items-center justify-center">
            <HeatRing
              current={weeklyHeat}
              target={heatTarget}
              size={44}
              strokeWidth={4}
              color="var(--color-primary)"
            />
          </div>
          <div className="flex items-center justify-center">
            <span className="text-xl font-bold text-stone-700 font-heading leading-none">
              {logCount}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-xl font-bold text-stone-700 font-heading leading-none">
              {placeCount}
            </span>
          </div>
        </div>
        {/* 라벨 줄 */}
        <div className="grid grid-cols-3 mt-1">
          <div className="flex justify-center">
            <span className="text-[9px] text-stone-400 font-medium">이번 주 열기</span>
          </div>
          <div className="flex justify-center">
            <span className="text-[9px] text-stone-400 font-medium">총 기록</span>
          </div>
          <div className="flex justify-center">
            <span className="text-[9px] text-stone-400 font-medium">방문 장소</span>
          </div>
        </div>
      </button>
    </div>
  )
}
