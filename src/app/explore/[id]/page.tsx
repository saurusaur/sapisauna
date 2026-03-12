'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE, PLACE_DETAIL, PLACE_SPECS, QUICK_LOG,
  TRIBE_EMOJI_MAP, DEEP_LOG,
} from '@/constants/content'
import { getStepLabel } from '@/lib/utils'
import { usePlace, usePlaceStats } from '@/hooks/use-places'
import { useLogsByPlace } from '@/hooks/use-logs'
import { useFavorites } from '@/hooks/use-favorites'
import Badge24h from '@/components/ui/badge-24h'
import Chip from '@/components/ui/chip'
import DataState from '@/components/ui/data-state'
import RecordCard from '@/components/features/record-card'
import { useAuth } from '@/contexts/auth-context'
import BottomCTA from '@/components/ui/bottom-cta'

// PLACE_SPECS 섹션별로 시설 분류 (AMENITIES 포함)
const specSections = ['HEAT', 'ICE', 'PAUSE', 'BEYOND', 'AMENITIES'] as const

export default function PlaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const { data: place, loading: placeLoading, error: placeError } = usePlace(placeId)
  const { data: placeLogs, loading: logsLoading } = useLogsByPlace(placeId)
  const { stats } = usePlaceStats(placeId)
  const { toggleFavorite, isFavorited } = useFavorites()
  const { user: authUser } = useAuth()
  const [showAllLogs, setShowAllLogs] = useState(false)

  // 로딩/에러/없음 상태
  if (placeLoading) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  if (placeError || !place) {
    return (
      <div className="min-h-dvh bath-tile-bg flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-accent)' }}>location_off</span>
        <p className="text-stone-500 text-sm">장소를 찾을 수 없습니다</p>
        <a href="/explore" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mt-2">탐색으로 돌아가기</a>
      </div>
    )
  }

  const isFavoritedPlace = isFavorited(placeId)

  // 시설 분류
  const facilityGroups: { label: string; items: { id: string; label: string; icon: string }[] }[] = []
  for (const key of specSections) {
    const section = PLACE_SPECS[key]
    const items = section.options.filter((opt) => place.facilities.includes(opt.id))
    if (items.length > 0) {
      facilityGroups.push({ label: section.label, items: items.map((o) => ({ id: o.id, label: o.label, icon: o.icon })) })
    }
  }

  // 표시할 기록 (기본 3개, 더보기 시 전체)
  const displayedLogs = showAllLogs ? placeLogs : placeLogs.slice(0, 3)

  // ── 더미 통계 데이터 (추후 실제 데이터로 교체) ──
  const dummyStats = {
    totalCount: 42,
    tribeDistribution: [
      { tribeId: 'saunner', count: 24 },
      { tribeId: 'bather', count: 12 },
      { tribeId: 'jimi', count: 6 },
    ] as { tribeId: string; count: number }[],
    tribeMetrics: [
      { tribeId: 'saunner', label: '사우나 온도', avg: 92, unit: '°C' },
      { tribeId: 'saunner', label: '냉탕 온도', avg: 14, unit: '°C' },
      { tribeId: 'saunner', label: '토토노우', avg: 3.8, unit: '/5' },
      { tribeId: 'bather', label: '목욕물 온도', avg: 41, unit: '°C' },
      { tribeId: 'bather', label: '수질', avg: 3.5, unit: '/5' },
      { tribeId: 'jimi', label: '한증막 온도', avg: 88, unit: '°C' },
      { tribeId: 'jimi', label: '땀 만족도', avg: 4.1, unit: '/5' },
    ],
    avgCost: { amount: 12000, currency: 'KRW', count: 28 },
    crowdDistribution: [
      { id: 'empty', count: 8 },
      { id: 'moderate', count: 18 },
      { id: 'busy', count: 10 },
      { id: 'full', count: 2 },
    ],
    scrub: { avgSatisfaction: 3.6, usageRate: 45, totalUsed: 19 },
    reviews: [
      {
        nickname: '사우나왕',
        tribeId: 'saunner',
        date: '2026-03-10',
        memo: '불가마 온도가 정말 완벽했어요. 냉탕도 차갑고 시원해서 토토노우 3세트 돌았습니다.',
        recommendMenu: null,
      },
      {
        nickname: '목욕좋아',
        tribeId: 'bather',
        date: '2026-03-08',
        memo: '세신 아주머니 솜씨가 좋아요. 수질도 깨끗하고 전체적으로 만족!',
        recommendMenu: null,
      },
      {
        nickname: '찜질매니아',
        tribeId: 'jimi',
        date: '2026-03-05',
        memo: '한증막 온도 딱 좋고, 식혜가 맛있어요.',
        recommendMenu: '식혜, 구운 계란',
      },
      {
        nickname: '초보사우너',
        tribeId: 'saunner',
        date: '2026-02-28',
        memo: '처음 와봤는데 시설이 깔끔하고 좋았어요. 다음엔 아우프구스 시간 맞춰서 올 예정.',
        recommendMenu: null,
      },
    ],
  }

  const [showAllReviews, setShowAllReviews] = useState(false)
  const displayedReviews = showAllReviews ? dummyStats.reviews : dummyStats.reviews.slice(0, 2)
  const crowdTotal = dummyStats.crowdDistribution.reduce((s, c) => s + c.count, 0)
  const crowdLabelMap = Object.fromEntries(DEEP_LOG.CROWD.options.map(o => [o.id, o.label]))
  const scrubStepLabel = getStepLabel(DEEP_LOG.SCRUB.satisfaction.steps, Math.round(dummyStats.scrub.avgSatisfaction))

  // 지도 URL — external_id(place_id) 우선, fallback은 좌표/이름 기반
  const googleSource = place.sources.find(s => s.source === 'google')

  // Naver external_id는 좌표 조합(mapx_mapy)이라 place URL로 사용 불가 → 검색 URL 사용
  const naverMapUrl = place.latitude
    ? `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}?c=${place.longitude},${place.latitude},17`
    : `https://map.naver.com/v5/search/${encodeURIComponent(place.name + ' ' + place.address)}`

  const googleMapUrl = googleSource?.external_id
    ? `https://www.google.com/maps/place/?q=place_id:${googleSource.external_id}`
    : place.latitude
      ? `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.latitude},${place.longitude},17z`
      : `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`

  // "기록하기" CTA — 미인증 시 로그인 리다이렉트
  const handleRecord = () => {
    if (!authUser) {
      router.push('/login?next=/log')
      return
    }
    localStorage.removeItem('currentLog')
    localStorage.setItem('selectedPlace', JSON.stringify({ id: place.id, name: place.name, countryCode: place.country_code }))
    router.push('/log')
  }

  return (
    <div className="min-h-dvh pb-24 bath-tile-bg">
      {/* A. 헤더 — 서브페이지 스타일 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">{ICONS.BACK}</span>
          </button>

          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            PLACE
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* B. 장소 정보 카드 — 평점 통합 + 하트 이름과 같은 줄 */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-700">{place.name}</h2>
            {place.is_24h && <Badge24h />}
            <div onClick={() => toggleFavorite(placeId)} className="ml-auto flex-shrink-0 cursor-pointer">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: isFavoritedPlace ? 'var(--color-primary)' : 'var(--color-icon-inactive)' }}
              >
                {isFavoritedPlace ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2">{place.address}</p>

          {/* 평점 통합 */}
          {stats.count > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)', fontSize: '16px' }}>move</span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                {stats.avg}
              </span>
              <span className="text-xs text-stone-400">
                · {EXPLORE.LOG_COUNT(stats.count)}
              </span>
            </div>
          )}

          {/* 지도 링크 — 국내: 네이버+구글, 해외: 구글만 */}
          <div className="flex items-center gap-3 mt-2">
            {place.country_code === 'KR' && (
              <>
                <a
                  href={naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {PLACE_DETAIL.NAVER_MAP}
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                </a>
                <span className="text-stone-300">|</span>
              </>
            )}
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              {PLACE_DETAIL.GOOGLE_MAP}
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
            </a>
          </div>
        </div>

        {/* C. 시설 정보 — glass-card */}
        {facilityGroups.length > 0 && (
          <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3">시설 정보</h3>
          <div className="glass-card p-4">
            <div className="space-y-3">
              {facilityGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-stone-400 mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <Chip key={item.id} label={item.label} icon={item.icon} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* D. 통계 섹션 — 사-피엔스의 통계 */}
        {dummyStats.totalCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-stone-500 mb-3">사-피엔스의 통계</h3>

            {/* D-1. 기록 건수 + 트라이브 분포 */}
            <div className="glass-card p-4 space-y-4">
              <div>
                <p className="text-xs text-stone-400 mb-2">기록 분포</p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-stone-700">{dummyStats.totalCount}<span className="text-sm font-normal text-stone-400 ml-1">건</span></span>
                  <div className="flex items-center gap-3">
                    {dummyStats.tribeDistribution.map(({ tribeId, count }) => (
                      <span key={tribeId} className="flex items-center gap-1 text-sm">
                        <span>{TRIBE_EMOJI_MAP[tribeId]}</span>
                        <span className="font-medium text-stone-600">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
                {/* 비율 바 */}
                <div className="flex h-2 rounded-full overflow-hidden mt-2">
                  {dummyStats.tribeDistribution.map(({ tribeId, count }) => (
                    <div
                      key={tribeId}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(count / dummyStats.totalCount) * 100}%`,
                        backgroundColor: `var(--color-${tribeId})`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* D-2. 트라이브별 핵심 메트릭 평균 */}
              <div>
                <p className="text-xs text-stone-400 mb-2">평균 메트릭</p>
                <div className="grid grid-cols-2 gap-2">
                  {dummyStats.tribeMetrics.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-xs">{TRIBE_EMOJI_MAP[m.tribeId]}</span>
                      <span className="text-xs text-stone-500">{m.label}</span>
                      <span className="text-xs font-bold text-stone-700 ml-auto">{m.avg}{m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* D-3. 평균 비용 */}
              <div className="flex items-center justify-between py-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '16px' }}>payments</span>
                  <span className="text-xs text-stone-500">평균 비용</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-stone-700">
                    {dummyStats.avgCost.currency === 'KRW'
                      ? `₩${dummyStats.avgCost.amount.toLocaleString()}`
                      : `${dummyStats.avgCost.amount} ${dummyStats.avgCost.currency}`
                    }
                  </span>
                  <span className="text-xs text-stone-400 ml-1">({dummyStats.avgCost.count}건 기준)</span>
                </div>
              </div>

              {/* D-4. 혼잡도 분포 */}
              <div className="py-2 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-2">혼잡도</p>
                <div className="flex gap-2">
                  {dummyStats.crowdDistribution.map(({ id, count }) => {
                    const pct = Math.round((count / crowdTotal) * 100)
                    return (
                      <div key={id} className="flex-1 text-center">
                        <div className="relative h-16 flex items-end justify-center">
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${Math.max(pct, 8)}%`,
                              backgroundColor: 'var(--color-primary)',
                              opacity: 0.15 + (pct / 100) * 0.6,
                            }}
                          />
                        </div>
                        <p className="text-xs font-medium text-stone-600 mt-1">{crowdLabelMap[id]}</p>
                        <p className="text-[10px] text-stone-400">{pct}%</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* D-5. 세신 만족도 */}
              <div className="flex items-center justify-between py-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '16px' }}>spa</span>
                  <span className="text-xs text-stone-500">세신 만족도</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-700">{dummyStats.scrub.avgSatisfaction.toFixed(1)}/5</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{scrubStepLabel}</span>
                  <span className="text-xs text-stone-400">· 이용률 {dummyStats.scrub.usageRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E. 유저 메모 (리뷰) */}
        {dummyStats.reviews.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-stone-500 mb-3">사-피엔스의 한마디</h3>
            <div className="space-y-2">
              {displayedReviews.map((review, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{TRIBE_EMOJI_MAP[review.tribeId]}</span>
                    <span className="text-sm font-medium text-stone-700">{review.nickname}</span>
                    <span className="text-xs text-stone-300 ml-auto">{review.date}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{review.memo}</p>
                  {review.recommendMenu && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-100">
                      <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '14px' }}>restaurant</span>
                      <span className="text-xs text-stone-500">추천 메뉴:</span>
                      <span className="text-xs font-medium text-stone-600">{review.recommendMenu}</span>
                    </div>
                  )}
                </div>
              ))}

              {!showAllReviews && dummyStats.reviews.length > 2 && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="w-full pt-2 pb-1 text-center text-xs font-medium underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  한마디 더보기 ({dummyStats.reviews.length - 2}건 더)
                </button>
              )}
            </div>
          </div>
        )}

        {/* F. 이 장소의 기록 리스트 */}
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3">{PLACE_DETAIL.LOGS_TITLE}</h3>

          <DataState loading={logsLoading} error={null} isEmpty={placeLogs.length === 0} emptyMessage={PLACE_DETAIL.NO_LOGS}>
            <div className="space-y-3">
              {displayedLogs.map((log) => (
                <RecordCard
                  key={log.id}
                  log={log}
                  onClick={() => router.push(`/history/${log.id}`)}
                />
              ))}

              {/* 더보기 — 레드 텍스트 링크 */}
              {!showAllLogs && placeLogs.length > 3 && (
                <button
                  onClick={() => setShowAllLogs(true)}
                  className="w-full pt-2 pb-1 text-center text-xs font-medium underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {PLACE_DETAIL.MORE_LOGS} ({placeLogs.length - 3}건 더)
                </button>
              )}
            </div>
          </DataState>
        </div>
      </main>

      <BottomCTA onClick={handleRecord}>{PLACE_DETAIL.RECORD_CTA}</BottomCTA>
    </div>
  )
}
