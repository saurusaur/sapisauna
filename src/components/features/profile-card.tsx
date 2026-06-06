'use client'

/**
 * 프로필(스탬프) 카드 — 홈 상단, 살짝 기울인 카드.
 * 로그인/비로그인 동일 레이아웃(이름 위치 일치):
 *   [아바타] 이름 · Lv.N(작게)
 *            칭호 chip  (게스트: "나만의 사우나 도장판 채우기!")
 * 카드 하단 빈 캔버스는 홈에서 도장(체크인 데코)이 찍히는 영역.
 */

import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { TRIBE_EMOJI_MAP, MESSAGES } from '@/constants/content'
import { profileBgColor } from '@/lib/utils'

const HOME = MESSAGES.HOME

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(251,250,248,0.96)',
  border: '0.5px solid hsl(0 0% 100% / 0.85)',
  boxShadow: 'var(--glass-shadow)',
  borderRadius: 'var(--radius)',
}

export default function ProfileCard() {
  const router = useRouter()
  const { user } = useUser()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  const isGuest = !user

  // 아바타 (게스트/로그인 동일 위치·크기)
  const avatar = (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: isGuest
          ? 'var(--color-primary)'
          : profileBgColor(user!.profile_hue, `var(--color-${user!.primary_type || 'saunner'})`),
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      <span className="text-[24px] leading-none">
        {isGuest ? '🧖' : user!.profile_emoji || TRIBE_EMOJI_MAP[user!.primary_type || 'saunner']}
      </span>
    </div>
  )

  // 동일 스켈레톤: [아바타] [이름row + 서브라인]
  const body = (
    <div className="flex items-center gap-3">
      {avatar}
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* 이름 (+ 로그인 시 레벨 작게) */}
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-base font-bold text-stone-700 truncate">
            {isGuest ? HOME.STAMP_GUEST_NAME : user!.nickname}
          </span>
          {!isGuest && (
            <button
              onClick={() => router.push('/settings/titles')}
              className="text-[11px] font-semibold text-stone-400 font-heading flex-shrink-0 hover:text-stone-500"
            >
              Lv.{user!.level ?? 0}
            </button>
          )}
        </div>
        {/* 서브라인: 칭호 chip / 스탬프 유도 문구 */}
        {!isGuest && user!.active_title ? (
          <span className="text-xs text-amber-600/90 px-2 py-0.5 rounded-full bg-amber-50 w-fit truncate">
            {user!.active_title}
          </span>
        ) : (
          <span
            className="text-xs font-medium"
            style={{ color: isGuest ? 'var(--color-primary)' : '#a8a29e' }}
          >
            {HOME.STAMP_FILL_PROMPT}
          </span>
        )}
      </div>
    </div>
  )

  if (isGuest) {
    return (
      <>
        <button
          onClick={() => requireAuth()}
          className="w-full min-h-[176px] p-4 flex flex-col text-left transition-all active:scale-[0.98]"
          style={CARD_STYLE}
        >
          {body}
        </button>
        <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
      </>
    )
  }

  return (
    <div className="w-full min-h-[176px] p-4 flex flex-col" style={CARD_STYLE}>
      {body}
    </div>
  )
}
