'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/confirm-modal'
import PlaceMergeModal from '@/components/ui/place-merge-modal'
import PlaceFacilityEditor from '@/components/features/place-facility-editor'
import ErrorBanner from '@/components/ui/error-banner'
import { findNearbyPlaces, mergeWithPlace, createNewPlace } from '@/lib/places-service'
import { grantReward } from '@/lib/reward-service'
import { captureError } from '@/lib/error-logger'
import { supabase } from '@/lib/supabase'
import { useConfirmableExit } from '@/hooks/use-confirmable-exit'
import type { Place, FacilityType, BathPolicy } from '@/types'
import BottomCTA from '@/components/ui/bottom-cta'

// API 검색 결과 타입
interface SearchResult {
  name: string
  address: string
  shortAddress: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  source: 'naver' | 'google'
  external_id: string
}

export default function AddPlace() {
  const router = useRouter()

  // 검색 엔진 선택 (Naver: 한국어 결과, Google: 영어 결과)
  const [source, setSource] = useState<'naver' | 'google'>('naver')

  // 검색 관련
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)  // 검색 실행 여부 추적
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null)

  // 수동 입력 모드 (기본 숨김, 검색 실패 시 노출)
  const [manualMode, setManualMode] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  // Google reverse-geocode 결과 (country_code/city). Naver는 'KR'/null로 간주
  const [resolvedCountryCode, setResolvedCountryCode] = useState<string>('')
  const [resolvedCity, setResolvedCity] = useState<string | null>(null)

  // Manual 입력의 forward-geocode 결과 (handleSave 시 1회 fetch, 모달 분기에서도 재사용)
  const [manualGeocode, setManualGeocode] = useState<{
    country_code: string
    city: string | null
    latitude: number | null
    longitude: number | null
  } | null>(null)

  // 장소 정보 등록 (5개 섹션 통합)
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [is24h, setIs24h] = useState(false)
  const [venueType, setVenueType] = useState<FacilityType>('public-bath')
  const [bathPolicy, setBathPolicy] = useState<BathPolicy>('gender-bath')

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mergeCandidates, setMergeCandidates] = useState<Place[] | null>(null)

  // 입력이 시작되었는지 (워닝 표시 기준)
  const hasInput = Boolean(name || selectedPlace || manualMode || selectedFacilities.length > 0)

  const canSave = name && address && selectedFacilities.length >= 2 && !isSaving
  const exitConfirm = useConfirmableExit({
    shouldConfirm: hasInput || Boolean(canSave),
    onExit: () => router.back(),
  })

  // 검색 실행 (debounce)
  const executeSearch = useCallback(async (query: string, searchSource: 'naver' | 'google') => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}&source=${searchSource}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      const results = data.results || []
      setSearchResults(results)
      if (results.length === 0) setHasSearched(true)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // 검색어 변경 시 debounce 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        executeSearch(searchQuery, source)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, source, executeSearch])

  // 검색 결과 선택
  const handleSelectResult = async (result: SearchResult) => {
    setSelectedPlace(result)
    setName(result.name)
    setManualMode(false)
    setHasSearched(false)
    // 검색 결과 닫기
    setSearchResults([])
    setSearchQuery('')

    // Naver 결과는 'KR'/네이버 주소 그대로
    if (result.source === 'naver') {
      setAddress(result.address)
      setResolvedCountryCode('KR')
      setResolvedCity(null)
      return
    }

    // Google 결과 — reverse-geocode로 country_code/city/정제된 주소 획득
    setAddress(result.address) // fallback으로 원본 먼저 보여주기
    setResolvedCountryCode('')
    setResolvedCity(null)

    if (result.latitude && result.longitude) {
      try {
        const resp = await fetch(
          `/api/places/reverse-geocode?lat=${result.latitude}&lng=${result.longitude}&name=${encodeURIComponent(result.name)}`
        )
        if (resp.ok) {
          const data: { country_code: string; city: string | null; address: string } = await resp.json()
          if (data.address) setAddress(data.address)
          if (data.country_code) setResolvedCountryCode(data.country_code)
          setResolvedCity(data.city)
        }
      } catch {
        // 네트워크 실패 → 원본 주소/빈 country_code 유지 (유저가 수동 저장 가능)
      }
    }
  }

  // 저장 완료 후 공통 처리
  const navigateToLog = (place: Place) => {
    localStorage.removeItem('currentLog')
    localStorage.setItem('selectedPlace', JSON.stringify({ id: place.id, name: place.name, countryCode: place.country_code, facilityType: place.facility_type, bathPolicy: place.bath_policy }))
    router.push('/log')
  }

  // 현재 입력값으로 공통 파라미터 생성
  // 우선순위: 검색 결과의 reverse-geocode (resolvedCountryCode) > manual forward-geocode > Naver 결과 폴백.
  // Naver 폴백은 selectedPlace.source === 'naver'일 때만 적용 (검색엔진 토글 state만으로는 manual 입력을 KR로 잘못 라벨함).
  const buildParams = () => ({
    name,
    address,
    latitude: selectedPlace?.latitude ?? manualGeocode?.latitude ?? null,
    longitude: selectedPlace?.longitude ?? manualGeocode?.longitude ?? null,
    facilities: selectedFacilities,
    is_24h: is24h,
    facility_type: venueType,
    bath_policy: bathPolicy,
    country_code: resolvedCountryCode || manualGeocode?.country_code || (selectedPlace?.source === 'naver' ? 'KR' : undefined),
    city: resolvedCity ?? manualGeocode?.city ?? null,
    source: (selectedPlace ? selectedPlace.source : 'manual') as 'naver' | 'google' | 'manual',
    external_id: selectedPlace?.external_id,
  })

  // 저장 — 검사 → 모달 or 직접 생성
  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const currentSource = selectedPlace ? selectedPlace.source : 'manual'
      const externalId = selectedPlace?.external_id

      // Stage 0: manual 입력은 forward-geocode로 country/city/lat/lng 보강 (실패해도 저장 진행)
      let geocode = manualGeocode
      if (!selectedPlace && !geocode && address.trim()) {
        try {
          const resp = await fetch(`/api/places/forward-geocode?address=${encodeURIComponent(address)}&name=${encodeURIComponent(name)}`)
          if (resp.ok) {
            const data: { country_code: string; city: string | null; latitude: number | null; longitude: number | null } = await resp.json()
            if (data.country_code) {
              geocode = data
              setManualGeocode(data)
            }
          }
        } catch (e) {
          captureError(e, { label: 'forward-geocode call', extra: { address } })
        }
      }

      // Stage 1: source + external_id 정확 매칭
      if (externalId) {
        const { data: existing } = await supabase
          .from('place_sources')
          .select('place_id')
          .eq('source', currentSource)
          .eq('external_id', externalId)
          .single()

        if (existing) {
          // 이미 등록된 장소 → 바로 이동
          const { getPlaceById } = await import('@/lib/places-service')
          const place = await getPlaceById(existing.place_id)
          if (place) {
            navigateToLog(place)
            return
          }
        }
      }

      // Stage 2: 좌표 기반 근처 장소 검색 (manual forward-geocode 결과도 사용)
      const lat = selectedPlace?.latitude ?? geocode?.latitude ?? undefined
      const lng = selectedPlace?.longitude ?? geocode?.longitude ?? undefined
      if (lat && lng) {
        try {
          const nearby = await findNearbyPlaces(lat, lng)
          if (nearby.length > 0) {
            // 후보 있음 → 모달 표시, 유저가 판단
            setMergeCandidates(nearby)
            setIsSaving(false)
            return
          }
        } catch {
          // 검색 실패 → 신규 생성으로 폴백
        }
      }

      // Stage 3: 신규 생성
      const place = await createNewPlace(buildParams())
      grantReward('place_created').catch(() => { })
      navigateToLog(place)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장에 실패했어요')
      setIsSaving(false)
    }
  }

  // 모달: "같은 장소" 선택 → 병합
  const handleMerge = async (placeId: string) => {
    setMergeCandidates(null)
    setIsSaving(true)
    setSaveError(null)

    try {
      const params = buildParams()
      const place = await mergeWithPlace(
        placeId,
        { source: params.source, external_id: params.external_id, name, address, latitude: params.latitude, longitude: params.longitude },
        params.facilities,
        params.is_24h,
        params.facility_type,
        params.bath_policy as BathPolicy,
      )
      grantReward('place_merged').catch(() => { })
      navigateToLog(place)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '병합에 실패했어요')
      setIsSaving(false)
    }
  }

  // 모달: "새 장소" 선택 → 신규 생성
  const handleNewPlace = async () => {
    setMergeCandidates(null)
    setIsSaving(true)
    setSaveError(null)

    try {
      const place = await createNewPlace(buildParams())
      grantReward('place_created').catch(() => { })
      navigateToLog(place)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장에 실패했어요')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bath-tile-bg pb-24">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={exitConfirm.requestExit}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            ADD PLACE
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* 저장 에러 */}
        {saveError && <ErrorBanner message={saveError} />}

        {/* 검색 엔진 선택 */}
        <div className="glass-card-light rounded-xl p-4">
          <label className="block text-sm font-medium text-stone-700 mb-3">
            검색 엔진
          </label>
          <div className="flex bg-stone-100 rounded-xl p-1">
            <button
              onClick={() => {
                setSource('naver')
                setSearchResults([])
                setSelectedPlace(null)
                setHasSearched(false)
              }}
              className={`
                flex-1 py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                ${source === 'naver'
                  ? 'bg-white text-stone-700 shadow-sm'
                  : 'text-stone-500'
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">location_on</span>
                Naver
              </span>
              <span className="text-[10px] text-stone-400">국내 전용 · 한국어</span>
            </button>
            <button
              onClick={() => {
                setSource('google')
                setSearchResults([])
                setSelectedPlace(null)
                setHasSearched(false)
              }}
              className={`
                flex-1 py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                ${source === 'google'
                  ? 'bg-white text-stone-700 shadow-sm'
                  : 'text-stone-500'
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">public</span>
                Google
              </span>
              <span className="text-[10px] text-stone-400">Worldwide · English</span>
            </button>
          </div>
        </div>

        {/* 장소 검색 */}
        <div className="glass-card-light rounded-xl p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            장소 검색
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={source === 'naver' ? '사우나/목욕탕 이름 검색...' : 'Search sauna/spa name...'}
              className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700"
            />
            {isSearching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 animate-spin">
                progress_activity
              </span>
            )}
          </div>

          {/* 검색 에러 */}
          {searchError && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {searchError}
            </p>
          )}

          {/* 검색 결과 목록 (결과 있을 때) 또는 0건 + 직접 입력 폴백 */}
          {(searchResults.length > 0 || (hasSearched && searchResults.length === 0 && !isSearching && searchQuery.length >= 2)) && (
            <div className="mt-3 border border-stone-200 rounded-xl overflow-hidden">
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.source}-${result.external_id}-${idx}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full p-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-stone-400 mt-0.5">location_on</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 truncate">{result.name}</p>
                      <p className="text-sm text-stone-400 truncate">{result.address}</p>
                    </div>
                    <span className="text-xs text-stone-300 uppercase">{result.source}</span>
                  </div>
                </button>
              ))}
              {/* 검색 결과 0건일 때 직접 입력 폴백 */}
              {hasSearched && searchResults.length === 0 && !isSearching && (
                <button
                  onClick={() => {
                    setManualMode(true)
                    setSearchQuery('')
                    setHasSearched(false)
                  }}
                  className="w-full p-3 text-center hover:bg-stone-50 transition-colors"
                >
                  <p className="text-stone-400 text-xs mb-0.5">검색 결과가 없습니다</p>
                  <span className="text-xs font-medium text-stone-600 underline underline-offset-2">
                    직접 입력하기
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 선택된 장소 표시 */}
          {selectedPlace && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-3 bg-stone-100">
              <span className="material-symbols-outlined text-stone-500">check_circle</span>
              <div className="flex-1">
                <p className="font-medium text-stone-700">{selectedPlace.name}</p>
                <p className="text-sm text-stone-500">{selectedPlace.address}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPlace(null)
                  setName('')
                  setAddress('')
                }}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

        </div>

        {/* 수동 입력 필드 (manualMode일 때만 노출) */}
        {manualMode && !selectedPlace && (
          <div className="glass-card-light rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-stone-700">장소 직접 등록</label>
              <button
                onClick={() => { setManualMode(false); setName(''); setAddress('') }}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                장소 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="장소 이름을 입력하세요"
                className="w-full px-4 py-3 glass-input rounded-xl text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                전체 주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소를 입력하세요"
                className="w-full px-4 py-3 glass-input rounded-xl text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all"
              />
            </div>
          </div>
        )}

        {/* 장소 정보 등록 섹션 */}
        <div>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap px-2">당신은 사-피 개척자! 어떤 장소인가요?</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <PlaceFacilityEditor
            selectedFacilities={selectedFacilities}
            onFacilitiesChange={setSelectedFacilities}
            is24h={is24h}
            onIs24hChange={setIs24h}
            venueType={venueType}
            onVenueTypeChange={setVenueType}
            bathPolicy={bathPolicy}
            onBathPolicyChange={setBathPolicy}
            countryCode={resolvedCountryCode || (source === 'naver' ? 'KR' : '')}
          />
        </div>
      </main>

      <BottomCTA onClick={handleSave} disabled={!canSave}>
        {isSaving ? (
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
        ) : (
          '장소 저장'
        )}
      </BottomCTA>

      {exitConfirm.confirmOpen && (
        <ConfirmModal
          message={"입력한 내용이 저장되지 않습니다.\n나가시겠습니까?"}
          confirmLabel="나가기"
          cancelLabel="계속 입력"
          onConfirm={exitConfirm.confirmExit}
          onCancel={exitConfirm.cancelExit}
        />
      )}

      {mergeCandidates && (
        <PlaceMergeModal
          candidates={mergeCandidates}
          newPlaceName={name}
          onMerge={handleMerge}
          onNewPlace={handleNewPlace}
          onCancel={() => setMergeCandidates(null)}
        />
      )}
    </div>
  )
}
