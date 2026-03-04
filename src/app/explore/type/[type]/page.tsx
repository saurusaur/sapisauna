'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE,
  TRIBE_EMOJI_MAP,
} from '@/constants/content'
import { getFacilityLabel } from '@/lib/utils'
import { usePlaces } from '@/hooks/use-places'
import { useLogs } from '@/hooks/use-logs'
import { useFavorites } from '@/hooks/use-favorites'
import type { Place } from '@/types'
import Chip from '@/components/ui/chip'
import DataState from '@/components/ui/data-state'
import FilterControls from '@/components/features/filter-controls'
import PlaceStatsDisplay from '@/components/features/place-stats-display'
import { useExploreFilters } from '@/hooks/use-explore-filters'


const VALID_TYPES = ['saunner', 'bather', 'jimi'] as const



// 타입 드롭다운 라벨 매핑
const typeDropdownLabel: Record<string, string> = {
  saunner: `${TRIBE_EMOJI_MAP['saunner']} Saunner 추천`,
  bather: `${TRIBE_EMOJI_MAP['bather']} Bather 추천`,
  jimi: `${TRIBE_EMOJI_MAP['jimi']} Jimi 추천`,
}

export default function TypeListPage() {
  const router = useRouter()
  const params = useParams()
  const initialType = (params.type as string) || 'saunner'

  const [currentType, setCurrentType] = useState(
    VALID_TYPES.includes(initialType as typeof VALID_TYPES[number]) ? initialType : 'saunner'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const {
    showFilters, setShowFilters, toggleFiltersPanel,
    selectedFilters, toggleFilter,
    is24hOnly, setIs24hOnly,
    sortType, setSortType,
    filterCount, hasActiveFilters, resetFilters,
  } = useExploreFilters()
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const { favorites, toggleFavorite, isFavorited, getFavoriteCount } = useFavorites()

  // DB 데이터 로드
  const { data: places, loading: placesLoading, error: placesError } = usePlaces()
  const { data: logs, loading: logsLoading } = useLogs(100)
  const loading = placesLoading || logsLoading

  // 장소별 통계 캐시
  const placeStatsMap = useMemo(() => {
    const map: Record<string, { avg: number; count: number }> = {}
    for (const log of logs) {
      if (!map[log.place_id]) map[log.place_id] = { avg: 0, count: 0 }
      map[log.place_id].count++
      map[log.place_id].avg += log.revisit_score
    }
    for (const key of Object.keys(map)) {
      map[key].avg = Math.round((map[key].avg / map[key].count) * 10) / 10
    }
    return map
  }, [logs])

  // 해당 타입의 추천 장소 (≥4점 건수 내림차순 → 평균 점수 내림차순)
  const recommendedPlaces = useMemo(() => {
    const qualifiedLogs = logs.filter(
      (log) => log.tribe_id === currentType && log.revisit_score >= 4
    )
    const placeStats: Record<string, { count: number; sum: number }> = {}
    for (const log of qualifiedLogs) {
      if (!placeStats[log.place_id]) placeStats[log.place_id] = { count: 0, sum: 0 }
      placeStats[log.place_id].count++
      placeStats[log.place_id].sum += log.revisit_score
    }
    return places
      .filter((place) => placeStats[place.id])
      .sort((a, b) => {
        const sa = placeStats[a.id]
        const sb = placeStats[b.id]
        if (sb.count !== sa.count) return sb.count - sa.count
        return (sb.sum / sb.count) - (sa.sum / sa.count)
      })
  }, [places, logs, currentType])

  // 검색/필터 적용
  const filteredPlaces = useMemo(() => {
    let filtered = [...recommendedPlaces]

    // 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      )
    }

    // 시설 필터 (AND 조건)
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((p) =>
        selectedFilters.every((f) => p.facilities.includes(f))
      )
    }

    // 24시 토글
    if (is24hOnly) {
      filtered = filtered.filter((p) => p.is_24h)
    }

    // 정렬
    filtered.sort((a, b) => {
      const statsA = placeStatsMap[a.id] || { avg: 0, count: 0 }
      const statsB = placeStatsMap[b.id] || { avg: 0, count: 0 }

      if (sortType === 'recommended') {
        if (statsA.count === 0 && statsB.count > 0) return 1
        if (statsB.count === 0 && statsA.count > 0) return -1
        if (statsA.avg !== statsB.avg) return statsB.avg - statsA.avg
        return statsB.count - statsA.count
      }

      if (sortType === 'popular') {
        const favA = getFavoriteCount(a.id)
        const favB = getFavoriteCount(b.id)
        if (favA !== favB) return favB - favA
        return statsB.avg - statsA.avg
      }

      return 0
    })

    return filtered
  }, [recommendedPlaces, searchQuery, selectedFilters, is24hOnly, sortType, favorites, placeStatsMap])

  return (
    <div className="min-h-screen pb-8 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">{ICONS.BACK}</span>
          </button>

          {/* 타입 드롭다운 */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 text-lg font-bold text-stone-700"
            >
              {typeDropdownLabel[currentType]}
              <span className="material-symbols-outlined text-base text-stone-400">
                {ICONS.CHEVRON_DOWN}
              </span>
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden z-30 min-w-[200px]">
                {VALID_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCurrentType(type)
                      setShowTypeDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${currentType === type
                      ? 'bg-stone-100 font-semibold text-stone-700'
                      : 'text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    {typeDropdownLabel[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 드롭다운 오버레이 */}
      {showTypeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTypeDropdown(false)}
        />
      )}

      <main className="p-4">
        {/* 검색바 */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">
            {ICONS.SEARCH}
          </span>
          <input
            type="text"
            placeholder={EXPLORE.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white rounded-xl shadow-sm text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <span className="material-symbols-outlined text-xl">{ICONS.CLOSE}</span>
            </button>
          )}
        </div>

        {/* 필터/정렬 컨트롤 */}
        <FilterControls
          showFilters={showFilters}
          onToggleFilters={toggleFiltersPanel}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onResetFilters={resetFilters}
          is24hOnly={is24hOnly}
          onToggle24h={setIs24hOnly}
          sortType={sortType}
          onSortChange={setSortType}
        />

        {/* 장소 리스트 */}
        <DataState loading={loading} error={placesError} isEmpty={filteredPlaces.length === 0} emptyIcon="search_off" emptyMessage={EXPLORE.NO_RESULTS}>
          <div className="space-y-3">
            {filteredPlaces.map((place) => {
              const mainFacilities = place.facilities.slice(0, 5)

              return (
                <button
                  key={place.id}
                  onClick={() => router.push(`/explore/${place.id}`)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(place.id)
                      }}
                      className="p-1"
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: isFavorited(place.id) ? 'var(--color-green)' : '#d6d3d1' }}
                      >
                        {isFavorited(place.id) ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
                      </span>
                    </button>
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

                  {/* 평점 */}
                  <PlaceStatsDisplay placeId={place.id} />
                </button>
              )
            })}
          </div>
        </DataState>
      </main>
    </div>
  )
}
