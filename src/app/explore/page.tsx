'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ICONS, EXPLORE, EXPLORE_FILTERS } from '@/constants/content'
import { usePlaces } from '@/hooks/use-places'
import { useLogs } from '@/hooks/use-logs'
import { useSavePlace } from '@/hooks/use-save-place'
import { getPlaceSaveCounts } from '@/lib/lists-service'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import PlaceCard from '@/components/features/place-card'
import FilterControls from '@/components/features/filter-controls'
import { useExploreFilters } from '@/hooks/use-explore-filters'
import { SaveFlow } from '@/components/features/save-flow'


export default function ExplorePage() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const {
    showFilters, toggleFiltersPanel,
    selectedFilters, toggleFilter,
    is24hOnly, setIs24hOnly,
    sortType, setSortType,
    resetFilters,
  } = useExploreFilters()
  const { isSaved } = useSavePlace()
  const [visibleCount, setVisibleCount] = useState(3)
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({})

  // DB 데이터 로드
  const { data: places, loading: placesLoading, error: placesError } = usePlaces()
  const { data: logs, loading: logsLoading, error: logsError } = useLogs(100)

  const loading = placesLoading || logsLoading
  const error = placesError || logsError

  // 장소별 저장 횟수 로드 (고유 유저 기반)
  useEffect(() => {
    if (places.length === 0) return
    const ids = places.map((p) => p.id)
    getPlaceSaveCounts(ids).then(setSaveCounts).catch(() => {})
  }, [places])


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
      const genderSet = new Set<string>(EXPLORE_FILTERS.GENDER.options)
      const genderFilters = selectedFilters.filter((f) => genderSet.has(f))
      const facilityFilters = selectedFilters.filter((f) => !genderSet.has(f))

      if (facilityFilters.length > 0) {
        filtered = filtered.filter((p) =>
          facilityFilters.every((f) => {
            // 타투 가능 필터: tattoo-friendly OR tattoo-cover 매칭
            if (f === 'tattoo-friendly') {
              return p.facilities.includes('tattoo-friendly') || p.facilities.includes('tattoo-cover')
            }
            return p.facilities.includes(f)
          })
        )
      }
      if (genderFilters.length > 0) {
        filtered = filtered.filter((p) =>
          p.bath_policy ? genderFilters.includes(p.bath_policy) : false
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
        const savA = saveCounts[a.id] || 0
        const savB = saveCounts[b.id] || 0
        if (savA !== savB) return savB - savA
        return statsB.avg - statsA.avg
      }

      return 0
    })

    return filtered
  }, [places, searchQuery, selectedFilters, is24hOnly, sortType, saveCounts, placeStatsMap])

  // 검색/필터가 활성화되어 있는지
  const isSearchOrFilterActive = searchQuery || selectedFilters.length > 0 || is24hOnly

  return (
    <SaveFlow>
      {(handleToggleSave) => (
        <div className="min-h-dvh pb-20 bath-tile-bg">
          {/* 헤더 — 홈과 동일 스타일 */}
          <header className="p-5 pt-8">
            <h1
              className="text-3xl font-extrabold italic font-heading"
            >
              EXPLORE
            </h1>
          </header>

          <main className="p-4">
            {/* 검색바 */}
            <div className="relative mb-4 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl transition-colors group-focus-within:text-[var(--color-primary)]">
                {ICONS.SEARCH}
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder={EXPLORE.SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 glass-input text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
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
              {/* 장소 카드 리스트 (검색/필터 적용 시) */}
              {isSearchOrFilterActive && (
                <div>
                  {filteredPlaces.length === 0 ? (
                    <button
                      onClick={() => router.push('/place/add')}
                      className="w-full flex flex-col items-center justify-center gap-1 pt-10 pb-6 transition-colors hover:opacity-70"
                    >
                      <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">search_off</span>
                      <p className="text-stone-400 text-sm">{EXPLORE.NO_RESULTS}</p>
                      <span
                        className="text-xs font-medium underline underline-offset-2 mt-1"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        직접 장소 추가
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {filteredPlaces.map((place) => (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          isSaved={isSaved(place.id)}
                          onToggleSave={() => handleToggleSave(place.id)}
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
                      {filteredPlaces.slice(0, visibleCount).map((place) => (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          isSaved={isSaved(place.id)}
                          onToggleSave={() => handleToggleSave(place.id)}
                          onClick={() => router.push(`/explore/${place.id}`)}
                        />
                      ))}

                      {filteredPlaces.length > visibleCount && (
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="text-xs font-medium underline underline-offset-2 transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            더 보기 ({filteredPlaces.length - visibleCount}곳 남음)
                          </button>
                          {visibleCount > 3 && (
                            <button
                              onClick={() => {
                                setVisibleCount(3)
                                searchRef.current?.focus()
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="flex items-center gap-0.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_upward</span>
                              위로가기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DataState>
          </main>

          <BottomNav />
        </div>
      )}
    </SaveFlow>
  )
}
