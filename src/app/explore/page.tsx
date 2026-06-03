'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ICONS, EXPLORE, EXPLORE_FILTERS } from '@/constants/content'
import { usePlaces } from '@/hooks/use-places'
import { useLogs } from '@/hooks/use-logs'
import { useSavePlace } from '@/hooks/use-save-place'
import { getPlaceSaveCounts } from '@/lib/lists-service'
import { distanceMeters, formatDistance } from '@/lib/geo/distance'
import { captureError } from '@/lib/error-logger'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import PlaceCard from '@/components/features/place-card'
import FilterControls from '@/components/features/filter-controls'
import { useExploreFilters } from '@/hooks/use-explore-filters'
import { useUserLocation } from '@/hooks/use-user-location'
import { useUser } from '@/contexts/user-context'
import { SaveFlow } from '@/components/features/save-flow'
import { useToast } from '@/contexts/toast-context'


const DISTANCE_MUTED_THRESHOLD_M = 10000
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const googleMapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || ''

const ExploreMapView = dynamic(() => import('@/components/features/explore-map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-[clamp(420px,calc(100dvh-220px),640px)] rounded-xl glass-card-light flex flex-col items-center justify-center gap-2 text-stone-400">
      <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
      <span className="text-sm">지도 불러오는 중...</span>
    </div>
  ),
})

export default function ExplorePage() {
  const router = useRouter()
  const { showNotice } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)
  const locationNoticeShownRef = useRef(false)
  const mapLocationNoticeShownRef = useRef(false)
  const mapLoadErrorReportedRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map')
  const {
    location,
    status: locationStatus,
    permissionState,
    requestLocation,
  } = useUserLocation()
  const {
    showFilters, toggleFiltersPanel,
    selectedFilters, toggleFilter,
    is24hOnly, setIs24hOnly,
    sortType, setSortType,
    resetFilters,
  } = useExploreFilters({
    // 위치 있으면 가까운 순, 없으면 추천 순 (권한 확정 후 자동 결정)
    dynamicDefault: {
      locationAvailable: !!location || permissionState === 'granted',
      resolved: permissionState !== 'unknown',
    },
  })
  const { isSaved } = useSavePlace()
  const { user } = useUser()
  const [visibleCount, setVisibleCount] = useState(3)
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({})

  // DB 데이터 로드
  const { data: places, loading: placesLoading, error: placesError } = usePlaces()
  const { data: logs, loading: logsLoading, error: logsError } = useLogs(100)

  const loading = placesLoading || logsLoading
  const error = placesError || logsError
  const isRequestingLocation = locationStatus === 'requesting'
  const isNearbyPermissionDenied = permissionState === 'denied' || locationStatus === 'denied'
  const canUseMap = Boolean(googleMapsApiKey && googleMapId)

  // 장소별 저장 횟수 로드 (고유 유저 기반)
  useEffect(() => {
    if (places.length === 0) return
    const ids = places.map((p) => p.id)
    getPlaceSaveCounts(ids).then(setSaveCounts).catch(() => {})
  }, [places])

  const distanceMap = useMemo(() => {
    if (!location) return null
    const map: Record<string, number | null> = {}
    for (const place of places) {
      map[place.id] = distanceMeters(location, place)
    }
    return map
  }, [location, places])

  const distanceLabelMap = useMemo(() => {
    if (!distanceMap) return {}
    const map: Record<string, string | null> = {}
    for (const [placeId, meters] of Object.entries(distanceMap)) {
      map[placeId] = formatDistance(meters)
    }
    return map
  }, [distanceMap])

  const handleSortChange = (nextSortType: typeof sortType) => {
    if (nextSortType === 'nearby') {
      if (isNearbyPermissionDenied) {
        showNotice('브라우저 설정에서 위치 권한을 켜주세요')
        return
      }
      if (!location) requestLocation()
    }
    setSortType(nextSortType)
  }

  const handleRequestUserLocation = () => {
    if (isNearbyPermissionDenied) {
      showNotice('브라우저 설정에서 위치 권한을 켜주세요')
      return
    }

    if (!location) {
      showNotice('위치 권한을 허용하면 현재 위치와 가까운 사우나를 찾아드릴게요!')
    }
    requestLocation()
  }

  const handleMapLoadError = () => {
    setViewMode('list')
    // 로드 실패 콜백(APIProvider onError · error boundary · load gate)이
    // 여러 번 불려도 토스트/리포트는 1회만 — 토스트 누적 방지
    if (mapLoadErrorReportedRef.current) return
    mapLoadErrorReportedRef.current = true
    showNotice('지도를 불러올 수 없어 리스트로 전환했어요')
    captureError(new Error('map.load.fail'), { label: 'map.load.fail' })
  }

  const handleAddPlace = () => {
    if (location) {
      router.push(`/place/add?lat=${location.latitude}&lng=${location.longitude}`)
      return
    }
    router.push('/place/add')
  }

  useEffect(() => {
    if (sortType !== 'nearby') return
    if (locationStatus === 'granted' || locationStatus === 'requesting') return
    if (locationStatus === 'idle') return
    if (locationNoticeShownRef.current) return

    locationNoticeShownRef.current = true
    if (locationStatus === 'denied') {
      showNotice('브라우저 설정에서 위치 권한을 켜주세요')
    } else {
      showNotice('위치를 허용하면 가까운 순으로 볼 수 있어요')
    }
  }, [locationStatus, showNotice, sortType])

  // 리스트뷰 기본 정렬이 '가까운 순'이라, 위치 권한이 이미 허용돼 있으면 자동으로 위치를 가져온다.
  // (granted 상태면 프롬프트 없이 즉시 반환 — iOS의 자동 프롬프트 무시 이슈를 피함)
  useEffect(() => {
    if (viewMode !== 'list' || sortType !== 'nearby') return
    if (permissionState === 'granted' && !location && locationStatus !== 'requesting') {
      requestLocation()
    }
  }, [viewMode, sortType, permissionState, location, locationStatus, requestLocation])

  useEffect(() => {
    if (viewMode !== 'map') return

    if (permissionState === 'granted' && !location && locationStatus !== 'requesting') {
      requestLocation()
      return
    }

    if (
      !mapLocationNoticeShownRef.current &&
      !location &&
      (permissionState === 'prompt' || permissionState === 'unknown')
    ) {
      mapLocationNoticeShownRef.current = true
      showNotice('위치 권한을 허용하면 현재 위치와 가까운 사우나를 찾아드릴게요!')
    }

    if (!mapLocationNoticeShownRef.current && isNearbyPermissionDenied) {
      mapLocationNoticeShownRef.current = true
      showNotice('브라우저 설정에서 위치 권한을 켜주세요')
    }
  }, [isNearbyPermissionDenied, location, locationStatus, permissionState, requestLocation, showNotice, viewMode])

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

      if (sortType === 'nearby') {
        const distA = distanceMap?.[a.id] ?? Infinity
        const distB = distanceMap?.[b.id] ?? Infinity
        if (distA !== distB) return distA - distB
        return statsB.avg - statsA.avg
      }

      return 0
    })

    return filtered
  }, [places, searchQuery, selectedFilters, is24hOnly, sortType, saveCounts, placeStatsMap, distanceMap])

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

            {/* 보기 전환 */}
            <div className="flex bg-stone-100 rounded-xl p-1 mb-4">
              {([
                { key: 'list' as const, label: '리스트', icon: 'view_list' },
                { key: 'map' as const, label: '지도', icon: ICONS.MAP },
              ]).map((mode) => {
                const disabled = mode.key === 'map' && !canUseMap
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => {
                      if (disabled) {
                        showNotice('지도 준비 중입니다')
                        return
                      }
                      setViewMode(mode.key)
                    }}
                    aria-disabled={disabled}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      viewMode === mode.key
                        ? 'bg-white text-stone-700 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">{mode.icon}</span>
                    {mode.label}
                  </button>
                )
              })}
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
              onSortChange={handleSortChange}
              isNearbyPermissionDenied={isNearbyPermissionDenied}
              isRequestingLocation={isRequestingLocation}
              hideSort={viewMode === 'map'}
            />

            {/* 데이터 로딩/에러 상태 */}
            <DataState loading={loading} error={error} isEmpty={false}>
              {viewMode === 'map' && canUseMap ? (
                <ExploreMapView
                  apiKey={googleMapsApiKey}
                  mapId={googleMapId}
                  places={filteredPlaces}
                  userLocation={location}
                  profileEmoji={user?.profile_emoji ?? null}
                  distanceLabels={distanceLabelMap}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                  onOpenPlace={(placeId) => router.push(`/explore/${placeId}`)}
                  onAddPlace={handleAddPlace}
                  onRequestUserLocation={handleRequestUserLocation}
                  isRequestingLocation={isRequestingLocation}
                  onMapLoadError={handleMapLoadError}
                />
              ) : (
                <>
              {/* 장소 카드 리스트 (검색/필터 적용 시) */}
              {isSearchOrFilterActive && (
                <div>
                  {filteredPlaces.length === 0 ? (
                    <button
                      onClick={handleAddPlace}
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
                          distanceLabel={distanceLabelMap[place.id]}
                          distanceLabelMuted={(distanceMap?.[place.id] ?? 0) > DISTANCE_MUTED_THRESHOLD_M}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 전체 장소 프리뷰 (검색/필터 미활성 시 상위 3개 + 검색 유도) */}
              {!isSearchOrFilterActive && (
                <div>
                  <h2 className="text-sm font-bold text-stone-600 mb-3">전체 장소</h2>
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
                          distanceLabel={distanceLabelMap[place.id]}
                          distanceLabelMuted={(distanceMap?.[place.id] ?? 0) > DISTANCE_MUTED_THRESHOLD_M}
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
                </>
              )}
            </DataState>
          </main>

          <BottomNav />
        </div>
      )}
    </SaveFlow>
  )
}
