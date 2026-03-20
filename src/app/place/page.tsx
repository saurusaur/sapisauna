'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES, ICONS } from '@/constants/content'
import { usePlaces } from '@/hooks/use-places'
import { useUserLogs } from '@/hooks/use-logs'
import DataState from '@/components/ui/data-state'
import PlaceCard from '@/components/features/place-card'

export default function PlaceSelection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  // DB 데이터 로드
  const { data: places, loading, error } = usePlaces()
  const { data: userLogs } = useUserLogs()

  // 최근 기록 장소: 유저 본인이 마지막으로 기록한 순서대로 2개
  const recentPlaces = useMemo(() => {
    const seen = new Set<string>()
    const result: typeof places = []
    for (const log of userLogs) {
      if (!seen.has(log.place_id)) {
        seen.add(log.place_id)
        const place = places.find(p => p.id === log.place_id)
        if (place) result.push(place)
        if (result.length >= 2) break
      }
    }
    return result
  }, [userLogs, places])

  // 검색 필터링 (검색 중이 아닐 때는 내 주변 3개만)
  const filteredPlaces = searchQuery
    ? places.filter(place =>
        place.name.includes(searchQuery) || place.address.includes(searchQuery)
      )
    : places.slice(0, 3)

  // 장소 선택
  const handlePlaceSelect = (placeId: string, placeName: string, countryCode?: string, bathPolicy?: string) => {
    localStorage.removeItem('currentLog')
    localStorage.setItem('selectedPlace', JSON.stringify({ id: placeId, name: placeName, countryCode, bathPolicy }))
    router.push('/log')
  }

  return (
    <div className="min-h-dvh bath-tile-bg">
      {/* 헤더 — 앱 통일 패턴 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            SELECT PLACE
          </h1>
        </div>
      </header>

      <main className="p-4">
        {/* 검색창 */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={MESSAGES.LOG.SEARCH_PLACEHOLDER}
            className="w-full pl-12 pr-4 py-3 glass-input rounded-xl focus:outline-none text-stone-700 placeholder-stone-400"
          />
        </div>

        {/* 최근 등록 장소 (검색 중이 아닐 때만) */}
        {!searchQuery && recentPlaces.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-stone-500" style={{ fontSize: '18px' }}>history</span>
              <span className="text-sm font-medium text-stone-500">최근 기록 장소</span>
            </div>
            <div className="space-y-2">
              {recentPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handlePlaceSelect(place.id, place.name, place.country_code, place.bath_policy)}
                  className="w-full glass-card-light p-3 rounded-xl text-left hover:shadow-md transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '20px' }}>
                    {ICONS.PLACE}
                  </span>
                  <div>
                    <div className="font-medium text-stone-700 text-sm">{place.name}</div>
                    {(place.short_address || place.address) && (
                      <div className="text-xs text-stone-400">{place.short_address || place.address}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 내 주변 라벨 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-stone-500">location_on</span>
          <span className="text-sm font-medium text-stone-500">{MESSAGES.LOG.NEARBY}</span>
        </div>

        {/* 장소 목록 또는 빈 상태 + 직접 추가 */}
        {loading || error ? (
          <DataState loading={loading} error={error} isEmpty={false} />
        ) : filteredPlaces.length === 0 ? (
          <button
            onClick={() => router.push('/place/add')}
            className="w-full flex flex-col items-center justify-center gap-1 pt-6 pb-4 transition-colors hover:opacity-70"
          >
            <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">location_off</span>
            <p className="text-stone-400 text-sm">찾으시는 장소가 없나요?</p>
            <span
              className="text-xs font-medium underline underline-offset-2"
              style={{ color: 'var(--color-primary)' }}
            >
              직접 장소 추가
            </span>
          </button>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={() => handlePlaceSelect(place.id, place.name, place.country_code, place.bath_policy)}
                />
              ))}
            </div>
            <button
              onClick={() => router.push('/place/add')}
              className="w-full flex flex-col items-center justify-center gap-1 py-4 transition-colors hover:opacity-70"
            >
              <p className="text-stone-400 text-sm">찾으시는 장소가 없나요?</p>
              <span
                className="text-xs font-medium underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                직접 장소 추가
              </span>
            </button>
          </>
        )}
      </main>
    </div>
  )
}
