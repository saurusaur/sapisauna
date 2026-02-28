'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PLACE_SPECS } from '@/constants/content'
import SelectButton from '@/components/ui/select-button'
import ToggleSwitch from '@/components/ui/toggle-switch'
import { addPlace } from '@/lib/places-service'
import { PLACE_BATH_TYPE } from '@/constants/content'

// API 검색 결과 타입
interface SearchResult {
  name: string
  address: string
  shortAddress: string
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
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null)

  // 수동 입력 (검색 결과 선택 후 수정 가능)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  // 장소 정보 등록 (5개 섹션 통합)
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [is24h, setIs24h] = useState(false)
  const [bathGender, setBathGender] = useState<'male-only' | 'female-only' | 'private' | 'mixed' | null>(null)

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canSave = name && address && !isSaving

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

      setSearchResults(data.results || [])
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
  const handleSelectResult = (result: SearchResult) => {
    setSelectedPlace(result)
    setName(result.name)
    setAddress(result.address)

    // 검색 결과 닫기
    setSearchResults([])
    setSearchQuery('')
  }

  // 저장 — Supabase places + place_sources
  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const newPlace = await addPlace({
        name,
        address,
        latitude: selectedPlace?.latitude || null,
        longitude: selectedPlace?.longitude || null,
        facilities: selectedFacilities,
        is_24h: is24h,
        bath_gender: bathGender,
        country_code: source === 'naver' ? 'KR' : undefined,
        source: selectedPlace ? selectedPlace.source : 'manual',
        external_id: selectedPlace?.external_id,
      })

      localStorage.setItem('selectedPlace', JSON.stringify({ id: newPlace.id, name: newPlace.name }))
      router.push('/log')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장에 실패했어요')
      setIsSaving(false)
    }
  }

  // 칩 선택 래퍼
  const ChipSelect = ({
    options,
    selected,
    onSelect,
  }: {
    options: readonly { id: string; label: string; icon: string }[]
    selected: string[]
    onSelect: (id: string) => void
  }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <SelectButton
          key={option.id}
          label={option.label}
          icon={option.icon}
          selected={selected.includes(option.id)}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bath-tile-bg pb-8">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">장소 추가</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`
            px-4 py-2 rounded-xl font-semibold transition-all
            ${canSave
              ? 'text-white hover:opacity-90'
              : 'bg-stone-200 text-stone-400'
            }
          `}
          style={canSave ? { backgroundColor: 'var(--color-green)' } : {}}
        >
          {isSaving ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined">check</span>
          )}
        </button>
      </header>

      <main className="p-4 space-y-4">
        {/* 저장 에러 */}
        {saveError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {saveError}
          </div>
        )}

        {/* 검색 엔진 선택 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-3">
            검색 엔진
          </label>
          <div className="flex bg-stone-100 rounded-xl p-1">
            <button
              onClick={() => {
                setSource('naver')
                setSearchResults([])
                setSelectedPlace(null)
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
        <div className="bg-white rounded-xl shadow-sm p-4">
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

          {/* 검색 결과 목록 */}
          {searchResults.length > 0 && (
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
            </div>
          )}

          {/* 선택된 장소 표시 */}
          {selectedPlace && (
            <div className="mt-3 p-3 bg-green-light rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
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

        {/* 장소 이름 (수동 입력/수정) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            장소 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="장소 이름을 입력하세요"
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700"
          />
        </div>

        {/* 주소 (수동 입력/수정) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            주소/위치 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="주소를 입력하세요"
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700"
          />
        </div>

        {/* 장소 정보 등록 섹션 */}
        <div>
          <h2 className="text-sm font-bold text-stone-500 mb-4 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap px-2">장소 정보 등록</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <p className="text-xs text-stone-400 mb-3 text-center">
            다른 사용자에게 도움이 돼요 (선택)
          </p>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
            {/* 5개 섹션: HEAT → ICE → PAUSE → BEYOND → AMENITIES */}
            {(['HEAT', 'ICE', 'PAUSE', 'BEYOND', 'AMENITIES'] as const).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  {PLACE_SPECS[key].label}
                </label>
                <ChipSelect
                  options={PLACE_SPECS[key].options}
                  selected={selectedFacilities}
                  onSelect={(id) => {
                    setSelectedFacilities(prev =>
                      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                    )
                  }}
                />
              </div>
            ))}

            {/* 24시 영업 토글 */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                24시 영업
              </label>
              <ToggleSwitch checked={is24h} onChange={setIs24h} />
            </div>

            {/* 탕 성별 선택 */}
            <div className="pt-2 border-t border-stone-100">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                탕 구분
              </label>
              <div className="flex gap-1.5">
                {PLACE_BATH_TYPE.map((option) => (
                  <SelectButton
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    selected={bathGender === option.id}
                    onClick={() => setBathGender(
                      bathGender === option.id ? null : option.id as 'male-only' | 'female-only' | 'private' | 'mixed'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
