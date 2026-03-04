'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ICONS, EXPLORE,
  TRIBE_EMOJI_MAP, TRIBE_COLORS,
} from '@/constants/content'
import { usePlaces } from '@/hooks/use-places'
import { useLogs } from '@/hooks/use-logs'
import { useFavorites } from '@/hooks/use-favorites'
import type { Place } from '@/types'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import { useUser } from '@/contexts/user-context'
import PlaceCard from '@/components/features/place-card'
import FilterControls from '@/components/features/filter-controls'
import { useExploreFilters } from '@/hooks/use-explore-filters'



// 추천 탭 라벨 매핑
const recTabLabel: Record<string, string> = {
  saunner: `${TRIBE_EMOJI_MAP['saunner']} Saunner`,
  bather: `${TRIBE_EMOJI_MAP['bather']} Bather`,
  jimi: `${TRIBE_EMOJI_MAP['jimi']} Jimi`,
}

export default function ExplorePage() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const {
    showFilters, setShowFilters, toggleFiltersPanel,
    selectedFilters, toggleFilter,
    is24hOnly, setIs24hOnly,
    sortType, setSortType,
    filterCount, hasActiveFilters, resetFilters,
  } = useExploreFilters()
  const { favorites, toggleFavorite, isFavorited, getFavoriteCount } = useFavorites()
  const { primaryTribe } = useUser()
  const [activeTab, setActiveTab] = useState<string>('')
  const [showRecommendations, setShowRecommendations] = useState(true)

  // DB 데이터 로드
  const { data: places, loading: placesLoading, error: placesError } = usePlaces()
  const { data: logs, loading: logsLoading, error: logsError } = useLogs(100)

  const loading = placesLoading || logsLoading
  const error = placesError || logsError


  // 추천 섹션 데이터 (기본 조건: 평균 revisit_score ≥ 3.5, sortType에 따라 정렬)
  const recommendations = useMemo(() => {
    const typeKeys = ['saunner', 'bather', 'jimi'] as const
    const result: Record<string, Place[]> = {}

    for (const type of typeKeys) {
      // 해당 타입의 모든 로그 집계
      const typeLogs = logs.filter((log) => log.tribe_id === type)
      const placeStats: Record<string, { count: number; sum: number; highScoreCount: number }> = {}
      for (const log of typeLogs) {
        const key = log.place_id
        if (!placeStats[key]) placeStats[key] = { count: 0, sum: 0, highScoreCount: 0 }
        placeStats[key].count++
        placeStats[key].sum += log.revisit_score
        if (log.revisit_score >= 4) placeStats[key].highScoreCount++
      }

      // 기본 조건: 평균 revisit_score ≥ 3.5인 장소만 필터
      const qualified = places.filter((place) => {
        const stats = placeStats[place.id]
        return stats && (stats.sum / stats.count) >= 3.5
      })

      // sortType에 따라 정렬
      result[type] = qualified.sort((a, b) => {
        const sa = placeStats[a.id]
        const sb = placeStats[b.id]

        if (sortType === 'recommended') {
          // 추천순: 4점 이상 로그 수 ↓ → 평균 점수 ↓
          if (sb.highScoreCount !== sa.highScoreCount) return sb.highScoreCount - sa.highScoreCount
          return (sb.sum / sb.count) - (sa.sum / sa.count)
        }

        if (sortType === 'popular') {
          // 인기순: 즐겨찾기 수 ↓ → 평균 점수 ↓
          const favA = getFavoriteCount(a.id)
          const favB = getFavoriteCount(b.id)
          if (favB !== favA) return favB - favA
          return (sb.sum / sb.count) - (sa.sum / sa.count)
        }

        return 0
      })
    }

    return result
  }, [places, logs, sortType, favorites])

  // 유저 타입 기준 추천 섹션 순서 (추천 장소 없는 타입은 숨김)
  const recommendationOrder = useMemo(() => {
    const types = ['saunner', 'bather', 'jimi']
    const sorted = [primaryTribe, ...types.filter((t) => t !== primaryTribe)]
    return sorted.filter((t) => recommendations[t]?.length > 0)
  }, [primaryTribe, recommendations])

  // activeTab 초기화: 추천 탭 순서가 결정되면 첫 번째 탭 선택
  useEffect(() => {
    if (recommendationOrder.length > 0 && !activeTab) {
      setActiveTab(recommendationOrder[0])
    }
  }, [recommendationOrder, activeTab])

  // 장소별 통계 (로그 기반 계산)
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

  // 검색/필터 적용된 장소 리스트
  const filteredPlaces = useMemo(() => {
    let filtered = [...places]

    // 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      )
    }

    // 시설 필터 + 탕 구분 필터 (AND 조건)
    if (selectedFilters.length > 0) {
      const genderFilters = selectedFilters.filter((f) =>
        ['male-only', 'female-only', 'private', 'mixed'].includes(f)
      )
      const facilityFilters = selectedFilters.filter((f) =>
        !['male-only', 'female-only', 'private', 'mixed'].includes(f)
      )

      if (facilityFilters.length > 0) {
        filtered = filtered.filter((p) =>
          facilityFilters.every((f) => p.facilities.includes(f))
        )
      }
      if (genderFilters.length > 0) {
        filtered = filtered.filter((p) =>
          p.facility_type ? genderFilters.includes(p.facility_type) : false
        )
      }
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
  }, [places, searchQuery, selectedFilters, is24hOnly, sortType, favorites, placeStatsMap])

  // 검색/필터가 활성화되어 있는지
  const isSearchOrFilterActive = searchQuery || selectedFilters.length > 0 || is24hOnly

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-xl font-bold text-stone-700">{EXPLORE.TITLE}</h1>
      </header>

      <main className="p-4">
        {/* 검색바 */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">
            {ICONS.SEARCH}
          </span>
          <input
            ref={searchRef}
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

        {/* 데이터 로딩/에러 상태 */}
        <DataState loading={loading} error={error} isEmpty={false}>
          {/* 추천 섹션: 탭 기반 컴팩트 프리뷰 (검색/필터 미활성 시) */}
          {!isSearchOrFilterActive && recommendationOrder.length > 0 && (
            <div className="mb-6">
              {/* 섹션 헤더 + 접기/펼치기 */}
              <button
                onClick={() => setShowRecommendations((prev) => !prev)}
                className="flex items-center gap-1.5 mb-3"
              >
                <h2 className="text-sm font-semibold text-stone-500">
                  TRIBE PICKS {recommendationOrder.map((type) => TRIBE_EMOJI_MAP[type]).join('')}
                </h2>
                <span className="material-symbols-outlined text-base text-stone-400">
                  {showRecommendations ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showRecommendations && (
                <>
                  {/* 탭 버튼 (타입별 컬러) */}
                  <div className="flex gap-1.5 pb-3">
                    {recommendationOrder.map((type) => (
                      <TypeTab
                        key={type}
                        label={recTabLabel[type]}
                        active={activeTab === type}
                        onClick={() => setActiveTab(type)}
                        color={TRIBE_COLORS[type]}
                      />
                    ))}
                  </div>

                  {/* 선택된 탭의 추천 장소 세로 리스트 (상위 3개) */}
                  {activeTab && recommendations[activeTab] && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      {recommendations[activeTab].slice(0, 3).map((place, idx) => (
                        <div key={place.id} className={idx < Math.min(recommendations[activeTab].length, 3) - 1 ? 'border-b border-dashed border-stone-200' : ''}>
                          <PlaceCard
                            place={place}
                            isFavorited={isFavorited(place.id)}
                            onToggleFavorite={() => toggleFavorite(place.id)}
                            onClick={() => router.push(`/explore/${place.id}`)}
                            variant="minimal"
                          />
                        </div>
                      ))}

                      {/* 전체 보기 버튼 */}
                      <button
                        onClick={() => router.push(`/explore/type/${activeTab}`)}
                        className="w-full py-3 text-center text-sm font-medium text-stone-500 hover:text-stone-700 border-t border-stone-100 transition-colors flex items-center justify-center gap-1"
                      >
                        {EXPLORE.VIEW_ALL}
                        <span className="material-symbols-outlined text-base">{ICONS.CHEVRON_RIGHT}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 장소 카드 리스트 (검색/필터 적용 시) */}
          {isSearchOrFilterActive && (
            <div>
              {filteredPlaces.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-stone-300 mb-2 block">
                    search_off
                  </span>
                  <p className="text-stone-400 text-sm">{EXPLORE.NO_RESULTS}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isFavorited={isFavorited(place.id)}
                      onToggleFavorite={() => toggleFavorite(place.id)}
                      onClick={() => router.push(`/explore/${place.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 전체 장소 프리뷰 (검색/필터 미활성 시 상위 3개 + 검색 유도) */}
          {!isSearchOrFilterActive && (
            <div>
              <h2 className="text-sm font-semibold text-stone-500 mb-3">전체 장소</h2>
              {places.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-3xl text-stone-300 mb-2 block">location_off</span>
                  <p className="text-stone-400 text-sm">등록된 장소가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPlaces.slice(0, 3).map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isFavorited={isFavorited(place.id)}
                      onToggleFavorite={() => toggleFavorite(place.id)}
                      onClick={() => router.push(`/explore/${place.id}`)}
                    />
                  ))}

                  {filteredPlaces.length > 3 && (
                    <button
                      onClick={() => {
                        searchRef.current?.focus()
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="w-full py-4 rounded-xl border border-dashed border-stone-300 flex items-center justify-center gap-2 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-all text-sm"
                    >
                      <span className="material-symbols-outlined text-base">{ICONS.SEARCH}</span>
                      검색으로 더 찾아보세요
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </DataState>
      </main>

      <BottomNav />
    </div>
  )
}
