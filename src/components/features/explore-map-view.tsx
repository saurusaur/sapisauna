'use client'

import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AdvancedMarker,
  APIProvider,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps'
import { MarkerClusterer, SuperClusterAlgorithm, type Marker } from '@googlemaps/markerclusterer'
import type { Place } from '@/types'
import type { UserLocation } from '@/hooks/use-user-location'
import PlaceCard from '@/components/features/place-card'

// 위치 권한이 없을 때 기본으로 보여줄 기준점 — 남산공원(N서울타워)
const NAMSAN_PARK = { lat: 37.5512, lng: 126.9882 }
const DEFAULT_ZOOM = 13

// 클러스터 튜닝 — radius(px): 작을수록 덜 묶임 / maxZoom: 이 줌을 넘으면 개별 핀으로 분리.
// 기본값(radius 60·maxZoom 16)이 너무 공격적("툭하면 클러스터")이라 낮춤. 프리뷰에서 값 조정해 테스트.
const CLUSTER_RADIUS = 40
const CLUSTER_MAX_ZOOM = 15

interface ExploreMapViewProps {
  apiKey: string
  mapId: string
  places: Place[]
  userLocation: UserLocation | null
  profileEmoji: string | null
  distanceLabels: Record<string, string | null>
  isSaved: (placeId: string) => boolean
  onToggleSave: (placeId: string) => void
  onOpenPlace: (placeId: string) => void
  onAddPlace: () => void
  onRequestUserLocation: () => void
  isRequestingLocation: boolean
  onMapLoadError: () => void
}

interface MapErrorBoundaryProps {
  children: ReactNode
  onError: () => void
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function MapLoadingFallback() {
  return (
    <div className="h-[clamp(420px,calc(100dvh-220px),640px)] rounded-xl glass-card-light flex flex-col items-center justify-center gap-2 text-stone-400">
      <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
      <span className="text-sm">지도 불러오는 중...</span>
    </div>
  )
}

function MapLoadGate({
  children,
  onMapLoadError,
}: {
  children: ReactNode
  onMapLoadError: () => void
}) {
  const status = useApiLoadingStatus()
  const reportedRef = useRef(false)

  useEffect(() => {
    if (
      !reportedRef.current &&
      (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE)
    ) {
      reportedRef.current = true
      onMapLoadError()
    }
  }, [onMapLoadError, status])

  if (status === APILoadingStatus.NOT_LOADED || status === APILoadingStatus.LOADING) {
    return <MapLoadingFallback />
  }

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return null
  }

  return <>{children}</>
}

function FitBoundsToPlaces({
  userLocation,
}: {
  userLocation: UserLocation | null
}) {
  const map = useMap()

  // 내 위치가 있으면 내 위치를 중심으로 이동 (Google 지도 "내 위치" 동작).
  // requestLocation()은 성공 시마다 새 location 객체를 만들므로, "내 위치" 버튼을
  // 다시 눌러 좌표가 같아도 이 효과가 재실행되어 다시 센터링된다.
  useEffect(() => {
    if (!map || !userLocation) return
    map.panTo({ lat: userLocation.latitude, lng: userLocation.longitude })
    map.setZoom(14)
  }, [map, userLocation])

  // 내 위치가 없으면 남산공원을 기준으로 보여준다 (사우나 찾기 기본 뷰).
  // 내 위치 있으면 위 효과가 처리하므로 건드리지 않음 — 검색/필터로 장소가 바뀌어도 튕기지 않음.
  useEffect(() => {
    if (!map || userLocation) return
    map.setCenter(NAMSAN_PARK)
    map.setZoom(DEFAULT_ZOOM)
  }, [map, userLocation])

  return null
}

// 사우나 증기 — 사-피 로고에서 추출한 벡터(potrace). 선택 핀에만 표시.
function SteamLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 625) / 490} viewBox="107 0 490 625" fill="#fff" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <g transform="translate(0,702) scale(0.1,-0.1)">
        <path d="M4312 6965 c-525 -280 -978 -753 -1204 -1258 -228 -507 -266 -1026 -123 -1657 14 -63 44 -185 65 -270 196 -784 225 -1078 150 -1518 -86 -498 -272 -967 -555 -1397 -19 -28 -13 -26 105 36 698 365 1178 917 1337 1539 55 219 67 325 67 615 1 378 -22 523 -184 1185 -130 528 -160 706 -160 943 0 558 226 1235 604 1810 25 37 16 35 -102 -28z" />
        <path d="M2400 6562 c-648 -437 -976 -870 -1091 -1439 -26 -131 -35 -382 -20 -538 19 -184 45 -313 131 -656 108 -430 121 -509 127 -759 6 -243 -5 -344 -71 -604 -59 -234 -124 -407 -233 -626 -50 -101 -91 -186 -89 -187 5 -5 286 166 371 226 417 296 650 634 746 1081 20 89 23 136 23 310 0 278 -23 411 -159 929 -116 436 -142 612 -132 886 17 472 192 966 499 1412 16 24 25 43 21 43 -4 0 -60 -35 -123 -78z" />
        <path d="M5801 5789 c-579 -368 -931 -806 -1060 -1317 -82 -324 -67 -653 54 -1162 26 -107 62 -260 81 -340 63 -267 83 -490 65 -715 -40 -482 -151 -814 -398 -1182 l-102 -153 50 25 c27 14 88 48 136 77 684 402 1010 877 1062 1546 22 276 -14 542 -135 988 -167 616 -190 784 -149 1074 50 352 245 834 483 1198 19 29 21 30 -87 -39z" />
      </g>
    </svg>
  )
}

// 저장(좋아요) 핀 아이콘 — 통통한 하트. viewBox 위쪽 여백(-2)으로 머리 중앙 정렬
function HeartGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -2 24 24" fill="#fff">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

// 사우나 마커 — 물방울 핀. 비선택=심플 핀 / 저장=하트 / 선택=확대+로고 증기. 그림자 없음.
// 24시 영업이면 핀 위 "24h" 라벨. 아이콘은 박스 정중앙(=둥근 머리 중심)에 정렬.
const SaunaPin = memo(function SaunaPin({ saved, selected, is24h }: { saved: boolean; selected: boolean; is24h: boolean }) {
  const dropSize = selected ? 34 : 26
  const borderW = selected ? 3 : 2.5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {is24h && (
        <span style={{ background: '#fff', color: 'var(--color-primary)', fontSize: 9, fontWeight: 800, lineHeight: 1, padding: '2px 6px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
          24h
        </span>
      )}
      <div style={{ position: 'relative', width: dropSize, height: dropSize }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50% 50% 50% 0',
            background: 'var(--color-primary)',
            border: `${borderW}px solid #fff`,
            transform: 'rotate(-45deg)',
          }}
        />
        {(selected || saved) && (
          <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'block' }}>
            {selected ? <SteamLogo size={14} /> : <HeartGlyph size={11} />}
          </span>
        )}
      </div>
    </div>
  )
})

// 개별 사우나 마커 — React.memo로 감싸 자신의 selected/saved가 바뀐 마커만 리렌더된다.
// (selectedPlaceId 변경 시 238개 전체가 아니라 선택/해제된 2개만 다시 그림)
const PlaceMarker = memo(function PlaceMarker({
  place,
  selected,
  saved,
  onSelect,
  markerRef,
}: {
  place: Place
  selected: boolean
  saved: boolean
  onSelect: (placeId: string) => void
  markerRef: (marker: google.maps.marker.AdvancedMarkerElement | null) => void
}) {
  return (
    <AdvancedMarker
      position={{ lat: place.latitude!, lng: place.longitude! }}
      ref={markerRef}
      zIndex={selected ? 10 : 1}
      onClick={() => onSelect(place.id)}
    >
      <SaunaPin saved={saved} selected={selected} is24h={place.is_24h} />
    </AdvancedMarker>
  )
})

// '나' 마커 — 유저 프로필 이모지가 있으면 흰 원 배지 + 파란 링, 없으면 파란 점.
function UserLocationMarker({
  location,
  profileEmoji,
}: {
  location: UserLocation | null
  profileEmoji: string | null
}) {
  if (!location) return null
  const position = { lat: location.latitude, lng: location.longitude }

  if (profileEmoji) {
    return (
      <AdvancedMarker position={position} zIndex={20}>
        <div
          className="grid place-items-center rounded-full bg-white"
          style={{
            height: 32,
            width: 32,
            fontSize: 17,
            lineHeight: 1,
            border: '2.5px solid var(--color-bather)',
            boxShadow:
              '0 0 0 6px color-mix(in srgb, var(--color-bather) 18%, transparent), 0 3px 10px rgba(0,0,0,0.24)',
          }}
        >
          {profileEmoji}
        </div>
      </AdvancedMarker>
    )
  }

  return (
    <AdvancedMarker position={position} zIndex={20}>
      <div
        className="h-[18px] w-[18px] rounded-full border-[3px] border-white"
        style={{
          backgroundColor: 'var(--color-bather)',
          boxShadow:
            '0 0 0 8px color-mix(in srgb, var(--color-bather) 16%, transparent), 0 4px 12px color-mix(in srgb, var(--color-bather) 24%, transparent)',
        }}
      />
    </AdvancedMarker>
  )
}

function ClusteredMarkers({
  places,
  selectedPlaceId,
  isSaved,
  onSelectPlace,
}: {
  places: Place[]
  selectedPlaceId: string | null
  isSaved: (placeId: string) => boolean
  onSelectPlace: (placeId: string | null) => void
}) {
  const map = useMap()
  const clusterer = useRef<MarkerClusterer | null>(null)
  const [markers, setMarkers] = useState<Record<string, Marker>>({})

  // ── 뷰포트 컬링 ── 화면(+여유 패딩) 안의 장소만 마커로 마운트.
  // 도시 단위로 줌인해 둘러볼 때 238개 전체가 아니라 화면 근처 수십 개만 React 마커로 유지.
  const [viewBounds, setViewBounds] = useState<google.maps.LatLngBounds | null>(null)
  useEffect(() => {
    if (!map) return
    const update = () => setViewBounds(map.getBounds() ?? null)
    update()
    const listener = map.addListener('idle', update)
    return () => listener.remove()
  }, [map])

  const visiblePlaces = useMemo(() => {
    if (!viewBounds) return places
    const ne = viewBounds.getNorthEast()
    const sw = viewBounds.getSouthWest()
    // 가장자리 마커가 팬 시 갑자기 튀어나오지 않도록 20% 패딩
    const latPad = (ne.lat() - sw.lat()) * 0.2
    const lngPad = (ne.lng() - sw.lng()) * 0.2
    const padded = new google.maps.LatLngBounds(
      { lat: sw.lat() - latPad, lng: sw.lng() - lngPad },
      { lat: ne.lat() + latPad, lng: ne.lng() + lngPad }
    )
    return places.filter((p) => padded.contains({ lat: p.latitude!, lng: p.longitude! }))
  }, [places, viewBounds])

  useEffect(() => {
    if (!map) return
    clusterer.current = new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM }),
      renderer: {
        render: ({ count, position }) => {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position,
            content: createClusterElement(count),
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          })
          return marker
        },
      },
    })

    return () => {
      clusterer.current?.clearMarkers()
      clusterer.current?.setMap(null)
      clusterer.current = null
    }
  }, [map])

  useEffect(() => {
    if (!clusterer.current) return
    clusterer.current.clearMarkers()
    clusterer.current.addMarkers(Object.values(markers))
  }, [markers])

  const setMarkerRef = useCallback((placeId: string, marker: google.maps.marker.AdvancedMarkerElement | null) => {
    setMarkers((prev) => {
      if (marker && prev[placeId] === marker) return prev
      if (!marker && !prev[placeId]) return prev

      const next = { ...prev }
      if (marker) {
        next[placeId] = marker
      } else {
        delete next[placeId]
      }
      return next
    })
  }, [])

  // place별로 "안정적인" ref 콜백을 캐시한다.
  // 인라인 `ref={(m) => setMarkerRef(id, m)}`는 매 렌더마다 함수 정체성이 바뀌어
  // React가 detach(null)+attach(instance)를 반복 → setMarkers churn → 무한 리렌더(React #185).
  // placeId당 콜백을 1회만 만들어 재사용하면 mount/unmount에서만 실행된다.
  // 주의: 이 파일은 vis.gl의 `Map` 컴포넌트를 import하므로 JS `Map` 대신 plain object로 캐시한다.
  const markerRefCallbacks = useRef<
    Record<string, (marker: google.maps.marker.AdvancedMarkerElement | null) => void>
  >({})
  const getMarkerRef = useCallback(
    (placeId: string) => {
      const cache = markerRefCallbacks.current
      if (!cache[placeId]) {
        cache[placeId] = (marker) => setMarkerRef(placeId, marker)
      }
      return cache[placeId]
    },
    [setMarkerRef]
  )

  // 선택 토글 콜백 — onSelectPlace(useState setter)는 안정 참조. 최신 선택값은 ref로 읽어
  // handleSelect 정체성을 유지 → 메모된 PlaceMarker가 선택 변경마다 전부 리렌더되지 않는다.
  const selectedIdRef = useRef(selectedPlaceId)
  selectedIdRef.current = selectedPlaceId
  const handleSelect = useCallback(
    (placeId: string) => {
      onSelectPlace(selectedIdRef.current === placeId ? null : placeId)
    },
    [onSelectPlace]
  )

  return (
    <>
      {visiblePlaces.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={selectedPlaceId === place.id}
          saved={isSaved(place.id)}
          onSelect={handleSelect}
          markerRef={getMarkerRef(place.id)}
        />
      ))}
    </>
  )
}

function createClusterElement(count: number) {
  // 클러스터는 개별 사우나 핀과 위계가 구분되도록 링형(흰 바탕 + 빨강 링) + 숫자.
  // 개수 많을수록 살짝 크게. (:root CSS 변수는 인라인 스타일에서도 해석됨)
  const big = count >= 25
  const d = big ? 40 : 34
  const el = document.createElement('div')
  el.textContent = String(count)
  el.style.width = `${d}px`
  el.style.height = `${d}px`
  el.style.borderRadius = '9999px'
  el.style.background = '#ffffff'
  el.style.border = '2.5px solid var(--color-primary)'
  el.style.color = 'var(--color-primary)'
  el.style.display = 'grid'
  el.style.placeItems = 'center'
  el.style.fontSize = big ? '14px' : '12px'
  el.style.fontWeight = '800'
  return el
}

function MyLocationControl({
  onRequestUserLocation,
  isRequesting,
}: {
  onRequestUserLocation: () => void
  isRequesting: boolean
}) {
  return (
    <button
      type="button"
      onClick={onRequestUserLocation}
      aria-label="내 위치"
      className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-stone-600 shadow-md transition-colors hover:bg-white"
    >
      <span className={`material-symbols-outlined text-xl ${isRequesting ? 'animate-spin' : ''}`}>
        {isRequesting ? 'progress_activity' : 'my_location'}
      </span>
    </button>
  )
}

function ExploreMapInner({
  places,
  selectedPlace,
  userLocation,
  profileEmoji,
  distanceLabels,
  mapId,
  isSaved,
  isRequestingLocation,
  onToggleSave,
  onSelectPlace,
  onOpenPlace,
  onAddPlace,
  onRequestUserLocation,
}: {
  places: Place[]
  selectedPlace: Place | null
  userLocation: UserLocation | null
  profileEmoji: string | null
  distanceLabels: Record<string, string | null>
  mapId: string
  isSaved: (placeId: string) => boolean
  isRequestingLocation: boolean
  onToggleSave: (placeId: string) => void
  onSelectPlace: (placeId: string | null) => void
  onOpenPlace: (placeId: string) => void
  onAddPlace: () => void
  onRequestUserLocation: () => void
}) {
  const placesWithCoordinates = useMemo(
    () => places.filter((place) => place.latitude !== null && place.longitude !== null),
    [places]
  )
  // 위치 없으면 남산공원 기준 (FitBoundsToPlaces와 일치 → 초기 깜빡임 방지)
  const initialCenter = userLocation
    ? { lat: userLocation.latitude, lng: userLocation.longitude }
    : NAMSAN_PARK

  return (
    <div className="relative">
      {placesWithCoordinates.length === 0 ? (
        <button
          type="button"
          onClick={onAddPlace}
          className="h-[clamp(420px,calc(100dvh-220px),640px)] min-h-[420px] max-h-[640px] w-full rounded-xl glass-card-light flex flex-col items-center justify-center gap-2 text-stone-400"
        >
          <span className="material-symbols-outlined text-4xl text-stone-300">location_off</span>
          <span className="text-sm">이 영역에는 등록된 장소가 없어요</span>
          <span className="text-xs underline underline-offset-2" style={{ color: 'var(--color-primary)' }}>
            직접 장소 추가
          </span>
        </button>
      ) : (
        <div className="relative h-[clamp(420px,calc(100dvh-220px),640px)] min-h-[420px] max-h-[640px] overflow-hidden rounded-xl glass-card-light">
          <Map
            defaultCenter={initialCenter}
            defaultZoom={DEFAULT_ZOOM}
            mapId={mapId}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
            onClick={() => onSelectPlace(null)}
            style={{ width: '100%', height: '100%' }}
          >
            <FitBoundsToPlaces userLocation={userLocation} />
            <ClusteredMarkers
              places={placesWithCoordinates}
              selectedPlaceId={selectedPlace?.id ?? null}
              isSaved={isSaved}
              onSelectPlace={onSelectPlace}
            />
            <UserLocationMarker location={userLocation} profileEmoji={profileEmoji} />
          </Map>
          <MyLocationControl
            onRequestUserLocation={onRequestUserLocation}
            isRequesting={isRequestingLocation}
          />
        </div>
      )}

      {selectedPlace && (
        <div className="fixed left-3 right-3 bottom-20 z-30 max-w-md mx-auto">
          <PlaceCard
            variant="minimal"
            place={selectedPlace}
            isSaved={isSaved(selectedPlace.id)}
            onToggleSave={() => onToggleSave(selectedPlace.id)}
            onClick={() => onOpenPlace(selectedPlace.id)}
            distanceLabel={distanceLabels[selectedPlace.id]}
          />
        </div>
      )}
    </div>
  )
}

export default function ExploreMapView({
  apiKey,
  mapId,
  places,
  userLocation,
  profileEmoji,
  distanceLabels,
  isSaved,
  onToggleSave,
  onOpenPlace,
  onAddPlace,
  onRequestUserLocation,
  isRequestingLocation,
  onMapLoadError,
}: ExploreMapViewProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  )

  useEffect(() => {
    if (selectedPlaceId && !places.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(null)
    }
  }, [places, selectedPlaceId])

  return (
    <MapErrorBoundary onError={onMapLoadError}>
      <APIProvider apiKey={apiKey} libraries={['marker']} onError={onMapLoadError}>
        <MapLoadGate onMapLoadError={onMapLoadError}>
          <ExploreMapInner
            places={places}
            selectedPlace={selectedPlace}
            userLocation={userLocation}
            profileEmoji={profileEmoji}
            distanceLabels={distanceLabels}
            mapId={mapId}
            isSaved={isSaved}
            isRequestingLocation={isRequestingLocation}
            onToggleSave={onToggleSave}
            onSelectPlace={setSelectedPlaceId}
            onOpenPlace={onOpenPlace}
            onAddPlace={onAddPlace}
            onRequestUserLocation={onRequestUserLocation}
          />
        </MapLoadGate>
      </APIProvider>
    </MapErrorBoundary>
  )
}
