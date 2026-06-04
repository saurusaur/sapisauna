'use client'

/**
 * 프로필(스탬프) 카드 — 홈 상단, 살짝 기울인 카드.
 * 프로필 이미지 + 닉네임 + 칭호 + 레벨만 (통계는 /history 대시보드로 분리).
 * 카드 하단 빈 캔버스는 홈 레이아웃에서 도장(체크인 데코)이 찍히는 영역.
 * 비로그인: "나만의 사우나 카드" 예시 variant → 탭 시 로그인 유도.
 */

import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { levelProgress } from '@/lib/reward-engine'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { profileBgColor } from '@/lib/utils'

// 카드 공통 스타일 — 거의 불투명(베이지 위에서 또렷) + 글래스 섀도
const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(251,250,248,0.95)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '0.5px solid hsl(0 0% 100% / 0.8)',
  boxShadow: 'var(--glass-shadow)',
  borderRadius: 'var(--radius)',
}

export default function ProfileCard() {
  const router = useRouter()
  const { user } = useUser()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // 비로그인 — 예시 카드
  if (!user) {
    return (
      <>
        <button
          onClick={() => requireAuth()}
          className="relative w-full min-h-[140px] p-4 text-left transition-all active:scale-[0.98] overflow-hidden"
          style={CARD_STYLE}
        >
          <div className="opacity-40 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)', opacity: 0.5 }}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-stone-700">SA-PIEN</span>
              <span className="text-[11px] text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50 w-fit">
                예비 사-피엔스
              </span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
            <p className="text-sm font-medium text-stone-600">나만의 사우나 카드를 만들어보세요</p>
          </div>
        </button>
        <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
      </>
    )
  }

  // 로그인 — 프로필 + 칭호 + 레벨
  const progress = levelProgress(user.xp ?? 0)
  const percent = Math.round(progress * 100)

  return (
    <div className="w-full min-h-[158px] p-4 flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center gap-3">
        {/* 프로필 아바타 → (향후 유저 홈) */}
        <button
          onClick={() => {/* TODO: router.push('/user/home') */}}
          className="flex items-center gap-3 min-w-0 active:scale-[0.98] transition-transform"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: profileBgColor(user.profile_hue, `var(--color-${user.primary_type || 'saunner'})`),
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <span className="text-[22px] leading-none">
              {user.profile_emoji || TRIBE_EMOJI_MAP[user.primary_type || 'saunner']}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            {/* 닉네임 + 칭호 */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[15px] font-bold text-stone-700 truncate">{user.nickname}</span>
              {user.active_title && (
                <span className="text-[11px] text-amber-600/90 px-2 py-0.5 rounded-full bg-amber-50 truncate flex-shrink-0">
                  {user.active_title}
                </span>
              )}
            </div>
            {/* 레벨 */}
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/settings/titles') }}
              className="flex items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-[70px] h-1 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: 'var(--color-primary)' }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-500 font-heading">Lv.{user.level ?? 0}</span>
            </button>
          </div>
        </button>
      </div>
    </div>
  )
}
