'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE, PLACE_DETAIL, PLACE_SPECS,
} from '@/constants/content'
import { storage, STORAGE_KEYS } from '@/lib/utils'
import { usePlace, usePlaceStats } from '@/hooks/use-places'
import { useLogsByPlace } from '@/hooks/use-logs'
import type { FavoritesData, FavoriteCollection } from '@/types'
import Chip from '@/components/ui/chip'
import DataState from '@/components/ui/data-state'
import RecordCard from '@/components/features/record-card'
import { useAuth } from '@/contexts/auth-context'

// 기본 즐겨찾기 컬렉션
function getDefaultCollection(): FavoriteCollection {
  return {
    id: 'default',
    name: '좋아요',
    icon: 'favorite',
    placeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function loadFavorites(): FavoritesData {
  const data = storage.get<FavoritesData>(STORAGE_KEYS.FAVORITES)
  if (data && data.collections?.length > 0) return data
  return { collections: [getDefaultCollection()] }
}

function saveFavorites(data: FavoritesData) {
  storage.set(STORAGE_KEYS.FAVORITES, data)
}

// PLACE_SPECS 섹션별로 시설 분류
const specSections = ['HEAT', 'ICE', 'PAUSE', 'BEYOND'] as const
const amenitiesSection = 'AMENITIES' as const

export default function PlaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const { data: place, loading: placeLoading, error: placeError } = usePlace(placeId)
  const { data: placeLogs, loading: logsLoading } = useLogsByPlace(placeId)
  const { stats } = usePlaceStats(placeId)
  const [favorites, setFavorites] = useState<FavoritesData>({ collections: [getDefaultCollection()] })
  const { user: authUser } = useAuth()
  const [showAllLogs, setShowAllLogs] = useState(false)

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

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

  // 하트 토글
  const toggleFavorite = () => {
    setFavorites((prev) => {
      const updated = { ...prev, collections: [...prev.collections] }
      const defaultCol = { ...updated.collections[0] }
      if (defaultCol.placeIds.includes(placeId)) {
        defaultCol.placeIds = defaultCol.placeIds.filter((id) => id !== placeId)
      } else {
        defaultCol.placeIds = [...defaultCol.placeIds, placeId]
      }
      defaultCol.updatedAt = new Date().toISOString()
      updated.collections[0] = defaultCol
      saveFavorites(updated)
      return updated
    })
  }

  const isFavorited = favorites.collections[0]?.placeIds.includes(placeId) || false

  // 시설 분류
  const facilityGroups: { label: string; items: { id: string; label: string; icon: string }[] }[] = []
  for (const key of specSections) {
    const section = PLACE_SPECS[key]
    const items = section.options.filter((opt) => place.facilities.includes(opt.id))
    if (items.length > 0) {
      facilityGroups.push({ label: section.label, items: items.map((o) => ({ id: o.id, label: o.label, icon: o.icon })) })
    }
  }

  // 편의시설
  const amenities = PLACE_SPECS[amenitiesSection].options.filter((opt) =>
    place.facilities.includes(opt.id)
  )

  // 표시할 기록 (기본 3개, 더보기 시 전체)
  const displayedLogs = showAllLogs ? placeLogs : placeLogs.slice(0, 3)

  // 지도 URL — external_id(place_id) 우선, fallback은 좌표/이름 기반
  const naverSource = place.sources.find(s => s.source === 'naver')
  const googleSource = place.sources.find(s => s.source === 'google')

  const naverMapUrl = naverSource?.external_id
    ? `https://map.naver.com/v5/entry/place/${naverSource.external_id}`
    : place.latitude
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
    localStorage.setItem('selectedPlace', JSON.stringify({ id: place.id, name: place.name }))
    router.push('/log')
  }

  return (
    <div className="min-h-screen pb-24 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">{ICONS.BACK}</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">{place.name}</h1>
        </div>
        <button onClick={toggleFavorite} className="p-2">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: isFavorited ? 'var(--color-green)' : '#d6d3d1' }}
          >
            {isFavorited ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
          </span>
        </button>
      </header>

      <main className="p-4 space-y-4">
        {/* 장소 정보 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-700">{place.name}</h2>
              <p className="text-sm text-stone-500 mt-1">{place.address}</p>
              {place.is_24h && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                  24h 영업
                </span>
              )}
            </div>
          </div>

          {/* 지도 링크 */}
          <div className="flex gap-3 mt-4">
            <a
              href={naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">{ICONS.MAP}</span>
              {PLACE_DETAIL.NAVER_MAP}
            </a>
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">public</span>
              {PLACE_DETAIL.GOOGLE_MAP}
            </a>
          </div>
        </div>

        {/* 시설 정보 */}
        {facilityGroups.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">{PLACE_DETAIL.FACILITIES}</h3>
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
        )}

        {/* 편의시설 */}
        {amenities.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">{PLACE_DETAIL.AMENITIES}</h3>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((a) => (
                <Chip key={a.id} label={a.label} icon={a.icon} />
              ))}
            </div>
          </div>
        )}

        {/* 평균 평가 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">{PLACE_DETAIL.AVG_RATING}</h3>
          {stats.count > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>
                {stats.avg} (&ldquo;또 갈래요&rdquo;)
              </span>
              <span className="text-sm text-stone-400">
                · {EXPLORE.LOG_COUNT(stats.count)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-stone-400">{PLACE_DETAIL.NO_LOGS}</p>
          )}
        </div>

        {/* 이 장소의 기록 리스트 */}
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

              {/* 더보기 */}
              {!showAllLogs && placeLogs.length > 3 && (
                <button
                  onClick={() => setShowAllLogs(true)}
                  className="w-full text-center text-sm text-stone-400 hover:text-stone-600 py-2 bg-white rounded-xl shadow-sm"
                >
                  {PLACE_DETAIL.MORE_LOGS} ({placeLogs.length - 3}건 더)
                </button>
              )}
            </div>
          </DataState>
        </div>
      </main>

      {/* CTA 버튼 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-stone-200">
        <button
          onClick={handleRecord}
          className="w-full py-3 rounded-xl text-white font-semibold text-base hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-green)' }}
        >
          {PLACE_DETAIL.RECORD_CTA}
        </button>
      </div>
    </div>
  )
}
