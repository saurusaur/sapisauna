'use client'

import { useRouter } from 'next/navigation'
import BottomNav from '@/components/bottom-nav'
import { useFeaturedPublicLists } from '@/hooks/use-lists'
import { useAuth } from '@/contexts/auth-context'
import ProfileCard from '@/components/features/profile-card'
import TribePicksCard from '@/components/features/tribe-picks-card'
import FeaturedSaListCarousel from '@/components/features/featured-sa-list-carousel'
import SaunaStamp from '@/components/svg/sauna-stamp'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { data: featuredLists } = useFeaturedPublicLists()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  const handleRecord = () => {
    if (!authUser) {
      requireAuth()
      return
    }
    localStorage.setItem('selectedRecordDate', getTodayKey())
    router.push('/place')
  }

  return (
    <div className="relative min-h-dvh pb-24 bath-tile-bg overflow-hidden">
      {/* ── 상단 레드 영역 + 살짝 곡선 ── */}
      <div className="absolute top-0 left-0 right-0 h-[286px] z-0" style={{ backgroundColor: 'var(--color-primary)' }} />
      <div className="absolute left-0 right-0 z-0 leading-none" style={{ top: '278px' }} aria-hidden>
        <svg viewBox="0 0 393 34" preserveAspectRatio="none" className="block w-full h-[34px]">
          <path d="M0,0 H393 V12 C300,30 110,30 0,16 Z" fill="var(--color-primary)" />
        </svg>
      </div>

      {/* ── 헤더 ── */}
      <header className="relative z-[3] px-6 pt-8">
        <h1 className="text-[40px] leading-none italic font-heading text-white">
          <span className="font-medium">HELLO</span>{' '}
          <span className="font-bold">SA-PIEN</span>
        </h1>
        <p className="text-white/90 text-sm font-medium mt-2.5">우리는 사우나 신인류</p>
      </header>

      {/* ── 스탬프 카드 슬롯 (프로필 카드 + 도장 + 사-첵 CTA) ── */}
      <div className="relative z-[2] mx-[18px] mt-6 h-[184px]">
        {/* 유저(스탬프) 카드 — 살짝 기울임 */}
        <div className="absolute left-0 top-1.5 w-[74%] origin-center" style={{ transform: 'rotate(-3.5deg)' }}>
          <ProfileCard />
        </div>

        {/* 흰 도장 — 우측 위 레드 영역 배경 장식 */}
        <SaunaStamp
          color="#ffffff"
          steamRotate={-40}
          className="absolute w-[56px] h-[56px]"
          style={{ right: '4px', top: '-52px', transform: 'rotate(16deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
        />

        {/* 블루 도장 — 카드 하단 캔버스 (체크인 데코) */}
        <SaunaStamp
          color="var(--color-bather)"
          steamRotate={15}
          className="absolute w-[44px] h-[44px]"
          style={{ left: '10%', top: '92px', transform: 'rotate(-16deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
        />

        {/* 사-첵 CTA — 기록하기 진입(엄지존, 오른쪽 일부 크롭) */}
        <button
          type="button"
          onClick={handleRecord}
          aria-label="사우나 기록하기"
          className="absolute rounded-full overflow-hidden active:scale-[0.96] transition-transform z-[4]"
          style={{
            right: '-28px',
            top: '40px',
            width: '152px',
            height: '152px',
            transform: 'rotate(10deg)',
            boxShadow: '0 12px 28px -10px rgba(204,26,26,0.34), 0 4px 12px -5px rgba(0,0,0,0.10)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/sapi-chek-logo.svg" alt="" className="block w-full h-full" />
        </button>
      </div>

      {/* ── 섹션 ── */}
      <main className="relative z-[1] px-5 pt-6 space-y-8">
        <TribePicksCard />
        <FeaturedSaListCarousel lists={featuredLists} home />
      </main>

      <BottomNav />
      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </div>
  )
}
