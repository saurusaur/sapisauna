'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES, FACILITY_LABEL_MAP, EXPLORE, ICONS } from '@/constants/content'
import { usePlaces, usePlaceStats } from '@/hooks/use-places'
import DataState from '@/components/ui/data-state'
import Chip from '@/components/ui/chip'

// 시설 라벨 (영어 id → 한국어)
function getFacilityLabel(id: string): string {
  return FACILITY_LABEL_MAP[id] || id
}

// 장소 통계 표시용 컴포넌트
function PlaceStatsDisplay({ placeId }: { placeId: string }) {
  const { stats } = usePlaceStats(placeId)
  if (stats.count === 0) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-medium" style={{ color: 'var(--color-orange)' }}>
        {EXPLORE.REVISIT_LABEL} {stats.avg}
      </span>
      <span className="text-stone-300">·</span>
      <span className="text-stone-500">{EXPLORE.LOG_COUNT(stats.count)}</span>
    </div>
  )
}

// localStorage에 저장된 사용자 등록 장소
interface SavedPlace {
  id: string
  name: string
  address?: string
}

export default function PlaceSelection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [recentPlaces, setRecentPlaces] = useState<SavedPlace[]>([])

  // DB 데이터 로드
  const { data: places, loading, error } = usePlaces()

  // 최근 등록 장소 로드
  useEffect(() => {
    const saved = localStorage.getItem('places')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedPlace[]
        // 최근 5개만
        setRecentPlaces(parsed.slice(-5).reverse())
      } catch { /* ignore */ }
    }
  }, [])

  // 검색 필터링
  const filteredPlaces = places.filter(place =>
    place.name.includes(searchQuery) || place.address.includes(searchQuery)
  )

  // 장소 선택
  const handlePlaceSelect = (placeId: string, placeName: string) => {
    localStorage.setItem('selectedPlace', JSON.stringify({ id: placeId, name: placeName }))
    router.push('/log')
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-700">{MESSAGES.LOG.SELECT_PLACE}</h1>
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
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 placeholder-stone-400"
          />
        </div>

        {/* 최근 등록 장소 (검색 중이 아닐 때만) */}
        {!searchQuery && recentPlaces.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-stone-500" style={{ fontSize: '18px' }}>history</span>
              <span className="text-sm font-medium text-stone-500">최근 등록 장소</span>
            </div>
            <div className="space-y-2">
              {recentPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handlePlaceSelect(place.id, place.name)}
                  className="w-full bg-white p-3 rounded-xl shadow-sm text-left hover:shadow-md transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '20px' }}>
                    {ICONS.PLACE}
                  </span>
                  <div>
                    <div className="font-medium text-stone-700 text-sm">{place.name}</div>
                    {place.address && (
                      <div className="text-xs text-stone-400">{place.address}</div>
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

        {/* 장소 목록 */}
        <DataState loading={loading} error={error} isEmpty={filteredPlaces.length === 0} emptyIcon="location_off" emptyMessage="등록된 장소가 없습니다">
          <div className="space-y-3 mb-6">
            {filteredPlaces.map((place) => {
              const mainFacilities = place.facilities.slice(0, 5)

              return (
                <button
                  key={place.id}
                  onClick={() => handlePlaceSelect(place.id, place.name)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-700">{place.name}</span>
                        {place.is_24h && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                            24h
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{place.short_address || place.address}</p>
                    </div>
                  </div>

                  {/* 시설 칩 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {mainFacilities.map((f) => (
                      <Chip key={f} label={getFacilityLabel(f)} size="sm" />
                    ))}
                    {place.facilities.length > 5 && (
                      <Chip label={`+${place.facilities.length - 5}`} size="sm" />
                    )}
                  </div>

                  {/* 또갈래요 평점 */}
                  <PlaceStatsDisplay placeId={place.id} />
                </button>
              )
            })}
          </div>
        </DataState>

        {/* 직접 장소 추가 */}
        <button
          onClick={() => router.push('/place/add')}
          className="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center gap-2 text-stone-500 hover:border-stone-400 hover:text-stone-600 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{MESSAGES.LOG.ADD_PLACE}</span>
        </button>
      </main>
    </div>
  )
}
