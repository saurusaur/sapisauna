'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ICONS, EXPLORE, EXPLORE_FILTERS, AMENITY_LABEL_MAP,
  TYPE_EMOJI_MAP, PLACE_SPECS,
} from '@/constants/content'
import { storage, STORAGE_KEYS } from '@/lib/utils'
import { DUMMY_PLACES } from '@/data/dummy-places'
import { DUMMY_LOGS, getPlaceStats } from '@/data/dummy-logs'
import type { DummyPlace, FavoritesData, FavoriteCollection } from '@/types'
import BottomNav from '@/components/bottom-nav'
import Chip from '@/components/ui/chip'
import TypeTab from '@/components/ui/type-tab'
import ToggleSwitch from '@/components/ui/toggle-switch'
import { useUser } from '@/contexts/user-context'
import PlaceCard from '@/components/features/place-card'

type SortType = 'recommended' | 'popular'

// 기본 즐겨찾기 컬렉션 생성
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

// 즐겨찾기 데이터 로드
function loadFavorites(): FavoritesData {
  const data = storage.get<FavoritesData>(STORAGE_KEYS.FAVORITES)
  if (data && data.collections?.length > 0) return data
  return { collections: [getDefaultCollection()] }
}

// 즐겨찾기 저장
function saveFavorites(data: FavoritesData) {
  storage.set(STORAGE_KEYS.FAVORITES, data)
}

// 장소별 즐겨찾기 수 (전체 유저 = 현재 유저만)
function getFavoriteCount(placeId: string, favorites: FavoritesData): number {
  return favorites.collections.reduce((count, col) =>
    count + (col.placeIds.includes(placeId) ? 1 : 0), 0
  )
}

// PLACE_SPECS에서 시설 id → 아이콘 찾기
const facilityIconMap: Record<string, string> = {}
for (const section of Object.values(PLACE_SPECS)) {
  if ('options' in section && Array.isArray(section.options)) {
    for (const opt of section.options) {
      facilityIconMap[opt.id] = opt.icon
    }
  }
}

// 시설 라벨 (AMENITIES는 영어 id → 한국어 매핑 필요)
function getFacilityLabel(id: string): string {
  return AMENITY_LABEL_MAP[id] || id
}

// 타입별 탭 컬러 (공용)
const TYPE_TAB_COLORS: Record<string, string> = {
  saunner: 'var(--color-saunner)',
  bather: 'var(--color-bather)',
  jimi: 'var(--color-jimi)',
}

// 추천 탭 라벨 매핑
const recTabLabel: Record<string, string> = {
  saunner: `${TYPE_EMOJI_MAP['saunner']} Saunner`,
  bather: `${TYPE_EMOJI_MAP['bather']} Bather`,
  jimi: `${TYPE_EMOJI_MAP['jimi']} Jimi`,
}

export default function ExplorePage() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [sortType, setSortType] = useState<SortType>('recommended')
  const [is24hOnly, setIs24hOnly] = useState(false)
  const [favorites, setFavorites] = useState<FavoritesData>({ collections: [getDefaultCollection()] })
  const { primaryType } = useUser()
  const [activeTab, setActiveTab] = useState<string>('')
  const [showRecommendations, setShowRecommendations] = useState(true)

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  // 하트 토글
  const toggleFavorite = (placeId: string) => {
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

  const isFavorited = (placeId: string) => {
    return favorites.collections[0]?.placeIds.includes(placeId) || false
  }

  // 필터 토글
  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    )
  }

  // 추천 섹션 데이터 (≥4점 건수 내림차순 → 평균 점수 내림차순)
  const recommendations = useMemo(() => {
    const typeKeys = ['saunner', 'bather', 'jimi'] as const
    const result: Record<string, DummyPlace[]> = {}

    for (const type of typeKeys) {
      // 해당 타입 기록 중 revisit_score ≥ 4인 로그만 추출
      const qualifiedLogs = DUMMY_LOGS.filter(
        (log) => log.log_type === type && log.revisit_score >= 4
      )
      // 장소명별 건수 & 평균 점수 집계 (Note: using place_id for better accuracy)
      const placeStats: Record<string, { count: number; sum: number }> = {}
      for (const log of qualifiedLogs) {
        // Fallback to place_name for aggregation if place_id mapping is incomplete in logs (though we fixed it)
        // But here we need to map back to DUMMY_PLACES. DUMMY_PLACES has IDs.
        // Let's use place_id for aggregation.
        const key = log.place_id
        if (!placeStats[key]) placeStats[key] = { count: 0, sum: 0 }
        placeStats[key].count++
        placeStats[key].sum += log.revisit_score
      }

      // 장소 매칭 후 건수 내림차순 → 평균 점수 내림차순 정렬
      result[type] = DUMMY_PLACES
        .filter((place) => placeStats[place.id])
        .sort((a, b) => {
          const sa = placeStats[a.id]
          const sb = placeStats[b.id]
          if (sb.count !== sa.count) return sb.count - sa.count
          return (sb.sum / sb.count) - (sa.sum / sa.count)
        })
    }

    return result
  }, [])

  // 유저 타입 기준 추천 섹션 순서 (추천 장소 없는 타입은 숨김)
  const recommendationOrder = useMemo(() => {
    const types = ['saunner', 'bather', 'jimi']
    const sorted = [primaryType, ...types.filter((t) => t !== primaryType)]
    return sorted.filter((t) => recommendations[t]?.length > 0)
  }, [primaryType, recommendations])

  // activeTab 초기화: 추천 탭 순서가 결정되면 첫 번째 탭 선택
  useEffect(() => {
    if (recommendationOrder.length > 0 && !activeTab) {
      setActiveTab(recommendationOrder[0])
    }
  }, [recommendationOrder, activeTab])

  // 검색/필터 적용된 장소 리스트
  const filteredPlaces = useMemo(() => {
    let places = [...DUMMY_PLACES]

    // 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      )
    }

    // 시설 필터 (AND 조건)
    if (selectedFilters.length > 0) {
      places = places.filter((p) =>
        selectedFilters.every((f) => p.facilities.includes(f))
      )
    }

    // 24시 토글
    if (is24hOnly) {
      places = places.filter((p) => p.is_24h)
    }

    // 정렬
    places.sort((a, b) => {
      const statsA = getPlaceStats(a.id)
      const statsB = getPlaceStats(b.id)

      if (sortType === 'recommended') {
        if (statsA.count === 0 && statsB.count > 0) return 1
        if (statsB.count === 0 && statsA.count > 0) return -1
        if (statsA.avg !== statsB.avg) return statsB.avg - statsA.avg
        return statsB.count - statsA.count
      }

      if (sortType === 'popular') {
        const favA = getFavoriteCount(a.id, favorites)
        const favB = getFavoriteCount(b.id, favorites)
        if (favA !== favB) return favB - favA
        return statsB.avg - statsA.avg
      }

      return 0
    })

    return places
  }, [searchQuery, selectedFilters, is24hOnly, sortType, favorites])

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

        {/* 필터 버튼 + 정렬 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all
                ${selectedFilters.length > 0 || is24hOnly
                  ? 'text-white'
                  : 'bg-white text-stone-600'
                }
              `}
              style={selectedFilters.length > 0 || is24hOnly ? { backgroundColor: 'var(--color-green)' } : {}}
            >
              <span className="material-symbols-outlined text-sm">{ICONS.FILTER}</span>
              {EXPLORE.FILTER_BUTTON}
              {(selectedFilters.length > 0 || is24hOnly) && (
                <span className="bg-white/30 px-1 rounded-full text-[10px]">
                  {selectedFilters.length + (is24hOnly ? 1 : 0)}
                </span>
              )}
            </button>

            {/* 필터 일괄 취소 X: 필터 버튼에 붙어서 같은 색으로 표시 */}
            {(selectedFilters.length > 0 || is24hOnly) && (
              <button
                onClick={() => {
                  setSelectedFilters([])
                  setIs24hOnly(false)
                }}
                className="flex items-center px-1.5 py-1.5 text-white/80 hover:text-white border-l border-white/30 transition-all"
                style={{ backgroundColor: 'var(--color-green)' }}
              >
                <span className="material-symbols-outlined text-sm">{ICONS.CLOSE}</span>
              </button>
            )}
          </div>

          {/* 정렬 선택 */}
          <div className="flex items-center gap-1 ml-auto">
            {([
              { key: 'recommended', label: EXPLORE.SORT.RECOMMENDED },
              { key: 'popular', label: EXPLORE.SORT.POPULAR },
            ] as const).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortType(s.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${sortType === s.key
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowFilters(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--color-green)' }}
              >
                적용
              </button>
            </div>

            {(Object.entries(EXPLORE_FILTERS) as [string, { label: string; options: readonly string[] }][]).map(
              ([key, section]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {section.label}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {section.options.map((optionId) => (
                      <Chip
                        key={optionId}
                        label={getFacilityLabel(optionId)}
                        icon={facilityIconMap[optionId]}
                        selected={selectedFilters.includes(optionId)}
                        onClick={() => toggleFilter(optionId)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 24시 토글 */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                {EXPLORE.TOGGLE_24H}
              </label>
              <ToggleSwitch checked={is24hOnly} onChange={setIs24hOnly} />
            </div>
          </div>
        )}

        {/* 추천 섹션: 탭 기반 컴팩트 프리뷰 (검색/필터 미활성 시) */}
        {!isSearchOrFilterActive && recommendationOrder.length > 0 && (
          <div className="mb-6">
            {/* 섹션 헤더 + 접기/펼치기 */}
            <button
              onClick={() => setShowRecommendations((prev) => !prev)}
              className="flex items-center gap-1.5 mb-3"
            >
              <h2 className="text-sm font-semibold text-stone-500">
                TRIBE PICKS {recommendationOrder.map((type) => TYPE_EMOJI_MAP[type]).join('')}
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
                      color={TYPE_TAB_COLORS[type]}
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
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
