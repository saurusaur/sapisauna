'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE, PLACE_DETAIL, PLACE_SPECS,
} from '@/constants/content'
import { usePlace, usePlaceStats } from '@/hooks/use-places'
import { useLogsByPlace } from '@/hooks/use-logs'
import { useFavorites } from '@/hooks/use-favorites'
import Badge24h from '@/components/ui/badge-24h'
import Chip from '@/components/ui/chip'
import DataState from '@/components/ui/data-state'
import RecordCard from '@/components/features/record-card'
import { useAuth } from '@/contexts/auth-context'

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
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  if (placeError || !place) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">장소를 찾을 수 없습니다</p>
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
    <div className="min-h-screen pb-24 bath-tile-bg">
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
            className="text-2xl font-extrabold italic"
            style={{ fontFamily: 'var(--font-heading)' }}
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
                style={{ color: isFavoritedPlace ? 'var(--color-primary)' : '#d6d3d1' }}
              >
                {isFavoritedPlace ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2">{place.address}</p>

          {/* 평점 통합 */}
          {stats.count > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                또 갈래요 {stats.avg}
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

        {/* D. 이 장소의 기록 리스트 */}
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

      {/* G. CTA 버튼 — 퀵/딥로그와 동일 스타일 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 pointer-events-none">
        <button
          onClick={handleRecord}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 text-base pointer-events-auto"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: '0 8px 30px -4px rgba(204, 26, 26, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.12)',
          }}
        >
          {PLACE_DETAIL.RECORD_CTA}
        </button>
      </div>
    </div>
  )
}
