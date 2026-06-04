'use client'

/**
 * 프로필(스탬프) 카드 — 홈 상단, 살짝 기울인 카드.
 * 로그인/비로그인 동일 레이아웃(이름 위치 일치):
 *   [아바타] 이름 · Lv.N(작게)
 *            칭호 chip  (게스트: "사우나 스탬프 모아보세요!")
 * 카드 하단 빈 캔버스는 홈에서 도장(체크인 데코)이 찍히는 영역.
 */

import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { profileBgColor } from '@/lib/utils'

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

  // 비로그인 — 동일 레이아웃, 이름 SA-PIEN + 스탬프 유도 문구 (블러 없음)
  if (!user) {
    return (
      <>
        <button
          onClick={() => requireAuth()}
          className="w-full min-h-[176px] p-4 text-left transition-all active:scale-[0.98]"
          style={CARD_STYLE}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            >
              <span className="text-[24px] leading-none">🧖</span>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-base font-bold text-stone-700">SA-PIEN</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                사우나 스탬프 모아보세요!
              </span>
            </div>
          </div>
        </button>
        <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
      </>
    )
  }

  // 로그인
  return (
    <div className="w-full min-h-[176px] p-4 flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {/* TODO: router.push('/user/home') */}}
          className="flex-shrink-0 active:scale-95 transition-transform"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: profileBgColor(user.profile_hue, `var(--color-${user.primary_type || 'saunner'})`),
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <span className="text-[24px] leading-none">
              {user.profile_emoji || TRIBE_EMOJI_MAP[user.primary_type || 'saunner']}
            </span>
          </div>
        </button>

        <div className="flex flex-col gap-1.5 min-w-0">
          {/* 이름 + 레벨(작게) */}
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-base font-bold text-stone-700 truncate">{user.nickname}</span>
            <button
              onClick={() => router.push('/settings/titles')}
              className="text-[11px] font-semibold text-stone-400 font-heading flex-shrink-0 hover:text-stone-500"
            >
              Lv.{user.level ?? 0}
            </button>
          </div>
          {/* 칭호 */}
          {user.active_title ? (
            <span className="text-xs text-amber-600/90 px-2 py-0.5 rounded-full bg-amber-50 w-fit truncate">
              {user.active_title}
            </span>
          ) : (
            <span className="text-xs font-medium text-stone-400">사우나 스탬프 모아보세요!</span>
          )}
        </div>
      </div>
    </div>
  )
}
