'use client'

import { useState, useMemo, useCallback } from 'react'
import ConfirmModal from '@/components/ui/confirm-modal'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE,
  TRIBE_EMOJI_MAP, TRIBE_COLORS, TRIBE_IDS, FALLBACK_TRIBE,
} from '@/constants/content'
import { usePlaces } from '@/hooks/use-places'
import { useLogs } from '@/hooks/use-logs'
import { useSavePlace } from '@/hooks/use-save-place'
import type { Place } from '@/types'
import DataState from '@/components/ui/data-state'
import FilterControls from '@/components/features/filter-controls'
import PlaceCard from '@/components/features/place-card'
import { useExploreFilters } from '@/hooks/use-explore-filters'
import { SaveSnackbar } from '@/components/ui/snackbar'
import { SaveBottomSheet } from '@/components/features/save-bottom-sheet'


const VALID_TYPES = TRIBE_IDS



// 타입 드롭다운 라벨 매핑 (영문 대문자)
const typeDropdownLabel: Record<string, string> = {
  saunner: 'SAUNNER',
  bather: 'BATHER',
  jimi: 'JIMI',
}

// 헤딩용: tribe 이름 / PICKS 분리 (트라이브 컬러 적용용)
const typeTribeName: Record<string, string> = {
  saunner: 'SAUNNER',
  bather: 'BATHER',
  jimi: 'JIMI',
}

// 헤딩용 영문 대문자
const typeHeading: Record<string, string> = {
  saunner: 'SAUNNER PICKS',
  bather: 'BATHER PICKS',
  jimi: 'JIMI PICKS',
}

export default function TypeListPage() {
  const router = useRouter()
  const params = useParams()
  const initialType = (params.type as string) || FALLBACK_TRIBE

  const [currentType, setCurrentType] = useState(
    VALID_TYPES.includes(initialType as typeof VALID_TYPES[number]) ? initialType : FALLBACK_TRIBE
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
  const { isSaved, toggleDefaultSave, myLists, defaultListId, getSavedListIds, toggleListSave, removeFromAll } = useSavePlace()

  // 다중 리스트 제거 확인
  const [removeConfirm, setRemoveConfirm] = useState<{ placeId: string; count: number } | null>(null)

  // 스낵바 + 바텀시트 상태
  const [snackbarPlaceId, setSnackbarPlaceId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'save' | 'remove'>('save')
  const [sheetPlaceId, setSheetPlaceId] = useState<string>('')
  const [sheetCreateMode, setSheetCreateMode] = useState(false)

  const userCollections = useMemo(
    () => myLists.filter((l) => l.type !== 'default'),
    [myLists]
  )

  const handleToggleSave = useCallback(async (placeId: string) => {
    const wasSaved = isSaved(placeId)
    if (wasSaved) {
      const savedListIds = getSavedListIds(placeId)
      const inCustomLists = savedListIds.filter((id) => id !== defaultListId)
      if (inCustomLists.length === 0) {
        await toggleDefaultSave(placeId)
      } else {
        setRemoveConfirm({ placeId, count: inCustomLists.length })
      }
    } else {
      await toggleDefaultSave(placeId)
      if (userCollections.length === 0) {
        setSnackbarPlaceId(placeId)
      } else {
        setSheetPlaceId(placeId)
        setSheetMode('save')
        setSheetCreateMode(false)
        setSheetOpen(true)
      }
    }
  }, [isSaved, toggleDefaultSave, getSavedListIds, defaultListId, removeFromAll, userCollections.length])

  const handleSnackbarToggle = useCallback(async (listId: string) => {
    if (!snackbarPlaceId) return
    await toggleListSave(snackbarPlaceId, listId)
  }, [snackbarPlaceId, toggleListSave])

  const handleShowMore = useCallback(() => {
    if (!snackbarPlaceId) return
    const pid = snackbarPlaceId
    setSnackbarPlaceId(null)
    setSheetPlaceId(pid)
    setSheetMode('save')
    setSheetCreateMode(true)
    setSheetOpen(true)
  }, [snackbarPlaceId])

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
        // 인기순: 로그 수 ↓ → 평균 점수 ↓ (TODO: DB save_count로 교체)
        if (statsA.count !== statsB.count) return statsB.count - statsA.count
        return statsB.avg - statsA.avg
      }

      return 0
    })

    return filtered
  }, [recommendedPlaces, searchQuery, selectedFilters, is24hOnly, sortType, placeStatsMap])

  return (
    <div className="min-h-dvh pb-8 bath-tile-bg">
      {/* 헤더 — 뒤로가기 + 헤딩 같은 라인 */}
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
            <span style={{ color: TRIBE_COLORS[currentType as keyof typeof TRIBE_COLORS] }}>
              {typeTribeName[currentType]}
            </span>
            {' '}PICKS
          </h1>

          {/* 타입 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center text-stone-400 hover:text-stone-600 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {ICONS.CHEVRON_DOWN}
              </span>
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full right-0 mt-1 glass-card-light rounded-xl overflow-hidden z-30 min-w-[180px]">
                {VALID_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCurrentType(type)
                      setShowTypeDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${currentType === type
                      ? 'bg-[var(--color-primary-light)] text-stone-700'
                      : 'text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    {TRIBE_EMOJI_MAP[type]} {typeDropdownLabel[type]}
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
        <div className="relative mb-4 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl transition-colors group-focus-within:text-[var(--color-primary)]">
            {ICONS.SEARCH}
          </span>
          <input
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

        {/* 장소 리스트 */}
        <DataState loading={loading} error={placesError} isEmpty={filteredPlaces.length === 0} emptyIcon="search_off" emptyMessage={EXPLORE.NO_RESULTS}>
          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onClick={() => router.push(`/explore/${place.id}`)}
                isSaved={isSaved(place.id)}
                onToggleSave={() => handleToggleSave(place.id)}
              />
            ))}
          </div>
        </DataState>
      </main>

      {/* 스낵바 (컬렉션 없는 유저만) */}
      <SaveSnackbar
        visible={!!snackbarPlaceId}
        onDismiss={() => setSnackbarPlaceId(null)}
        savedListIds={snackbarPlaceId ? getSavedListIds(snackbarPlaceId) : []}
        userLists={[]}
        onToggleList={handleSnackbarToggle}
        onShowMore={handleShowMore}
        onMemo={handleShowMore}
      />

      {/* 인스타식 저장 바텀시트 */}
      {sheetPlaceId && (
        <SaveBottomSheet
          mode={sheetMode}
          placeId={sheetPlaceId}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          startInCreateMode={sheetCreateMode}
        />
      )}

      {removeConfirm && (
        <ConfirmModal
          message={`이 장소가 ${removeConfirm.count}개 리스트에도 포함되어 있어요.\n모두에서 제거할까요?`}
          confirmLabel="모두 제거"
          cancelLabel="취소"
          onConfirm={async () => {
            const pid = removeConfirm.placeId
            setRemoveConfirm(null)
            await removeFromAll(pid)
          }}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </div>
  )
}
