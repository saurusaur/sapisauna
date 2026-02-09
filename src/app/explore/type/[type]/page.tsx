'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE, EXPLORE_FILTERS, AMENITY_LABEL_MAP,
  TYPE_EMOJI_MAP, PLACE_SPECS, TYPE_NAME_MAP,
} from '@/constants/content'
import { storage, STORAGE_KEYS } from '@/lib/utils'
import { DUMMY_PLACES } from '@/data/dummy-places'
import { DUMMY_LOGS } from '@/data/dummy-logs'
import type { DummyPlace, FavoritesData, FavoriteCollection } from '@/types'
import Chip from '@/components/ui/chip'
import ToggleSwitch from '@/components/ui/toggle-switch'

type SortType = 'recommended' | 'popular'

const VALID_TYPES = ['saunner', 'bather', 'jimi'] as const

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

function loadFavorites(): FavoritesData {
  const data = storage.get<FavoritesData>(STORAGE_KEYS.FAVORITES)
  if (data && data.collections?.length > 0) return data
  return { collections: [getDefaultCollection()] }
}

function saveFavorites(data: FavoritesData) {
  storage.set(STORAGE_KEYS.FAVORITES, data)
}

// 장소별 평균 revisit_score 계산
function getPlaceStats(placeName: string) {
  const logs = DUMMY_LOGS.filter((log) => log.place_name === placeName)
  if (logs.length === 0) return { avg: 0, count: 0 }
  const sum = logs.reduce((acc, log) => acc + log.revisit_score, 0)
  return { avg: Math.round((sum / logs.length) * 10) / 10, count: logs.length }
}

// 장소별 즐겨찾기 수
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

// 시설 라벨
function getFacilityLabel(id: string): string {
  return AMENITY_LABEL_MAP[id] || id
}

// 타입 드롭다운 라벨 매핑
const typeDropdownLabel: Record<string, string> = {
  saunner: `${TYPE_EMOJI_MAP['saunner']} Saunner 추천`,
  bather: `${TYPE_EMOJI_MAP['bather']} Bather 추천`,
  jimi: `${TYPE_EMOJI_MAP['jimi']} Jimi 추천`,
}

export default function TypeListPage() {
  const router = useRouter()
  const params = useParams()
  const initialType = (params.type as string) || 'saunner'

  const [currentType, setCurrentType] = useState(
    VALID_TYPES.includes(initialType as typeof VALID_TYPES[number]) ? initialType : 'saunner'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [sortType, setSortType] = useState<SortType>('recommended')
  const [is24hOnly, setIs24hOnly] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [favorites, setFavorites] = useState<FavoritesData>({ collections: [getDefaultCollection()] })

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

  // 해당 타입의 추천 장소 (≥4점 건수 내림차순 → 평균 점수 내림차순)
  const recommendedPlaces = useMemo(() => {
    const qualifiedLogs = DUMMY_LOGS.filter(
      (log) => log.log_type === currentType && log.revisit_score >= 4
    )
    const placeStats: Record<string, { count: number; sum: number }> = {}
    for (const log of qualifiedLogs) {
      if (!placeStats[log.place_name]) placeStats[log.place_name] = { count: 0, sum: 0 }
      placeStats[log.place_name].count++
      placeStats[log.place_name].sum += log.revisit_score
    }
    return DUMMY_PLACES
      .filter((place) => placeStats[place.name])
      .sort((a, b) => {
        const sa = placeStats[a.name]
        const sb = placeStats[b.name]
        if (sb.count !== sa.count) return sb.count - sa.count
        return (sb.sum / sb.count) - (sa.sum / sa.count)
      })
  }, [currentType])

  // 검색/필터 적용
  const filteredPlaces = useMemo(() => {
    let places = [...recommendedPlaces]

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
      const statsA = getPlaceStats(a.name)
      const statsB = getPlaceStats(b.name)

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
  }, [recommendedPlaces, searchQuery, selectedFilters, is24hOnly, sortType, favorites])

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
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      currentType === type
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortType === s.key
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

        {/* 장소 리스트 */}
        {filteredPlaces.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-4xl text-stone-300 mb-2 block">
              search_off
            </span>
            <p className="text-stone-400 text-sm">{EXPLORE.NO_RESULTS}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaces.map((place) => {
              const stats = getPlaceStats(place.name)
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
                      <p className="text-xs text-stone-400 mt-0.5">{place.shortAddress || place.address}</p>
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
                  {stats.count > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-medium" style={{ color: 'var(--color-orange)' }}>
                        {EXPLORE.REVISIT_LABEL} {stats.avg}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-stone-500">{EXPLORE.LOG_COUNT(stats.count)}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
