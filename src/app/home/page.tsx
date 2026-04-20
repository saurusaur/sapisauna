'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import { useUserLogs, useCommunityFeed } from '@/hooks/use-logs'
import { useFeaturedPublicLists } from '@/hooks/use-lists'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'
import RecordCard from '@/components/features/record-card'
import UserLogCard from '@/components/features/user-log-card'
import DataState from '@/components/ui/data-state'
import ProfileCard from '@/components/features/profile-card'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import TribePicksCard from '@/components/features/tribe-picks-card'
import FeaturedSaListCarousel from '@/components/features/featured-sa-list-carousel'

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const { primaryTribe } = useUser()
  const { user: authUser } = useAuth()
  const { data: userLogs, loading, error } = useUserLogs()
  const { data: communityLogs, loading: communityLoading } = useCommunityFeed(10)
  const { data: featuredLists } = useFeaturedPublicLists()

  const todayKey = getTodayKey()

  const todayLogs = useMemo(
    () => userLogs.filter((log) => log.date.slice(0, 10) === todayKey),
    [userLogs, todayKey]
  )

  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  const hasTodayRecord = todayLogs.length > 0
  const emptyMessage = MESSAGES.HOME.EMPTY_RECORD[primaryTribe] || MESSAGES.HOME.NO_RECORDS

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <h1 className="text-3xl font-extrabold italic font-heading">
          HELLO{' '}
          <span style={{ color: 'var(--color-primary)' }}>SA-PIEN</span>
        </h1>
      </header>

      <main className="p-4 space-y-6">
        {/* 프로필 카드 */}
        <ProfileCard />

        {/* 오늘의 기록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-stone-500">{MESSAGES.HOME.TODAY_HEADING}</h2>
            {authUser && (
              <button
                onClick={() => router.push('/history')}
                className="text-xs font-medium hover:opacity-70 transition-colors flex items-center gap-0.5"
                style={{ color: 'var(--color-accent)' }}
              >
                {MESSAGES.HOME.VIEW_ALL}
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
              </button>
            )}
          </div>

          {!authUser ? null : loading ? (
            <div className="h-[104px] glass-card-light flex items-center justify-center">
              <span className="text-stone-300 text-sm">{MESSAGES.HOME.LOADING}</span>
            </div>
          ) : todayLogs.length === 0 ? (
            <div className="rounded-xl py-6 flex flex-col items-center justify-center text-center">
              <p className="text-stone-400 text-sm">{emptyMessage}</p>
            </div>
          ) : todayLogs.length === 1 ? (
            <RecordCard
              log={todayLogs[0]}
              onClick={() => router.push(`/history/${todayLogs[0].id}`)}
            />
          ) : (
            <div
              className="flex gap-3 snap-x snap-mandatory"
              style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}
            >
              {todayLogs.map((log) => (
                <div key={log.id} className="min-w-[85%] snap-start flex-shrink-0">
                  <RecordCard
                    log={log}
                    onClick={() => router.push(`/history/${log.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기록하기 CTA */}
        <button
          onClick={() => {
            if (!authUser) {
              requireAuth()
              return
            }
            localStorage.setItem('selectedRecordDate', todayKey)
            router.push('/place')
          }}
          className="btn-primary"
        >
          {authUser ? MESSAGES.HOME.CTA_BUTTON : '오늘 사우나 기록하기'}
        </button>

        {/* TRIBE PICKS — 비로그인 전용 */}
        {!authUser && <TribePicksCard />}

        {/* SA-PI FEATURED — 로그인 컴팩트 캐러셀 + '더 보러가기' 링크 */}
        {authUser && <FeaturedSaListCarousel lists={featuredLists} compact showSubtitle={false} />}

        {/* 비로그인 — TribePicks 아래 '더 보러가기' 링크만 */}
        {!authUser && (
          <button
            type="button"
            onClick={() => router.push('/sa-list')}
            className="mx-auto flex items-center gap-0.5 px-4 py-1.5 text-[12px] font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            사-피엔스 추천 사우나 리스트 더 보러가기
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>chevron_right</span>
          </button>
        )}

        {/* 사-피엔스의 흔적 */}
        {!communityLoading && communityLogs.length === 0 ? null : (
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-2">{MESSAGES.HOME.COMMUNITY_HEADING}</h2>
            {communityLoading ? (
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-[260px] max-w-[300px] h-[124px] glass-card-light animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : communityLogs.length === 0 ? (
              <div className="glass-card-light p-6 text-center">
                <p className="text-stone-300 text-xs">{MESSAGES.HOME.COMMUNITY_EMPTY}</p>
              </div>
            ) : (
              <div
                className="flex gap-3 snap-x snap-mandatory"
                style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}
              >
                {communityLogs.map((log) => (
                  <div key={log.id} className="min-w-[260px] max-w-[300px] snap-start flex-shrink-0">
                    <UserLogCard
                      log={log}
                      showPlace
                      compact
                      onClick={() => router.push(`/explore/${log.place_id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </div>
  )
}
