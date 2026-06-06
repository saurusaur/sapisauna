'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/bottom-nav'
import { useFeaturedPublicLists } from '@/hooks/use-lists'
import { useUserLogs } from '@/hooks/use-logs'
import { useAuth } from '@/contexts/auth-context'
import ProfileCard from '@/components/features/profile-card'
import TribePicksCard from '@/components/features/tribe-picks-card'
import FeaturedSaListCarousel from '@/components/features/featured-sa-list-carousel'
import SaunaStamp from '@/components/svg/sauna-stamp'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { MESSAGES } from '@/constants/content'

const HOME = MESSAGES.HOME

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { data: featuredLists, loading: featuredLoading } = useFeaturedPublicLists()
  const { data: userLogs } = useUserLogs()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // CTA(포스트잇) 상태 적응형
  const hasRecords = userLogs.length > 0
  const recordedToday = userLogs.some((l) => l.date.slice(0, 10) === getTodayKey())
  // 노출: 비로그인=항상 / 로그인=오늘 미기록일 때
  const showCta = authUser ? !recordedToday : true
  // 문구: 로그인+기록 있음="오늘도", 그 외="사우나"
  const ctaWord = authUser && hasRecords ? HOME.CTA_PREFIX_RETURNING : HOME.CTA_PREFIX_NEW

  // 사-첵 팝: 페이지(데이터 포함) 로딩 완료 후 1회만 재생
  const [popReady, setPopReady] = useState(false)
  useEffect(() => {
    if (featuredLoading || popReady) return
    const t = setTimeout(() => setPopReady(true), 150)
    return () => clearTimeout(t)
  }, [featuredLoading, popReady])

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
      <header className="relative z-[3] px-6 pt-8 pb-2">
        <h1 className="text-[40px] leading-none italic font-heading text-white">
          <span className="font-medium">{HOME.HERO_HELLO}</span>{' '}
          <span className="font-bold">{HOME.HERO_BRAND}</span>
        </h1>
        <p className="text-white/90 text-sm font-medium mt-2.5">{HOME.HERO_SUBTITLE}</p>
      </header>

      {/* ── 스탬프 카드 슬롯 (프로필 카드 + 도장 + 사-첵 CTA) ── */}
      <div className="relative z-[5] mx-4 mt-6 h-[214px]">
        {/* 유저(스탬프) 카드 — 살짝 기울임 */}
        <div className="absolute left-0 top-1.5 w-[78%] origin-center" style={{ transform: 'rotate(-3.5deg)' }}>
          <ProfileCard />
        </div>

        {/* 흰 도장 — 헤더↔사첵 사이, 사첵 위쪽 레드에 걸치게 (우측 살짝 클립) */}
        <SaunaStamp
          color="#ffffff"
          steamRotate={-40}
          className="absolute w-[78px] h-[78px]"
          style={{ right: '-10px', top: '-72px', transform: 'rotate(16deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
        />

        {/* 블루 도장 — 카드 하단 캔버스 (체크인 데코) */}
        <SaunaStamp
          color="var(--color-bather)"
          steamRotate={15}
          className="absolute w-[46px] h-[46px]"
          style={{ left: '9%', top: '116px', transform: 'rotate(-16deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
        />

        {/* 포스트잇 CTA — 도장 뒤에서 왼쪽으로 슬라이드(로딩 후 1회) */}
        {/* 도장(right 기준)과 동일하게 right 앵커 → 화면 폭 무관하게 도장 옆 고정(분리 방지), 오른쪽 ~14px만 도장 뒤로 */}
        {popReady && showCta && (
          <div className="cta-postit is-play" style={{ right: '170px', top: '174px' }} aria-hidden="true">
            {ctaWord} <b>{HOME.CTA_SUFFIX}</b>
          </div>
        )}

        {/* 사-첵 CTA — 기록하기 진입(엄지존, 오른쪽 일부 크롭, 움찔+호버/누름 애니메이션) */}
        <button
          type="button"
          onClick={handleRecord}
          aria-label="사우나 기록하기"
          className="group absolute z-[4]"
          style={{ right: '-32px', top: '56px', width: '212px', height: '212px', transform: 'rotate(10deg)' }}
        >
          <div className={`w-full h-full ${popReady ? 'sachek-nudge' : ''}`}>
            <div
              className="w-full h-full rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-[1.05] group-active:scale-95"
              style={{ boxShadow: '0 14px 32px -10px rgba(204,26,26,0.4), 0 5px 14px -5px rgba(0,0,0,0.12)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/sapi-chek-logo.svg" alt="" className="block w-full h-full" />
            </div>
          </div>
        </button>
      </div>

      {/* ── 섹션 ── */}
      <main className="relative z-[1] px-5 pt-5 space-y-8">
        <TribePicksCard />
        <FeaturedSaListCarousel lists={featuredLists} home />
      </main>

      <BottomNav />
      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </div>
  )
}
