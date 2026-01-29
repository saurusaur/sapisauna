'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLACE_SPECS, DEEP_LOG } from '@/constants/content'

export default function AddPlace() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // 장소 정보 등록
  const [selectedBaths, setSelectedBaths] = useState<string[]>([])
  const [selectedSaunas, setSelectedSaunas] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [hasStore, setHasStore] = useState(false)
  const [storeScore, setStoreScore] = useState(3)
  const [storeMemo, setStoreMemo] = useState('')

  const canSave = name && address && categories.length > 0

  const handleSave = () => {
    if (!canSave) return

    const newPlace = {
      id: Date.now().toString(),
      name,
      address,
      categories,
      // 장소 정보
      baths: selectedBaths,
      saunas: selectedSaunas,
      amenities: selectedAmenities,
      has_store: hasStore,
      store_score: hasStore ? storeScore : null,
      store_memo: hasStore ? storeMemo : null,
    }

    localStorage.setItem('selectedPlace', JSON.stringify({ id: newPlace.id, name: newPlace.name }))
    // 장소 상세정보도 저장
    const places = JSON.parse(localStorage.getItem('places') || '[]')
    places.push(newPlace)
    localStorage.setItem('places', JSON.stringify(places))

    router.push('/log')
  }

  // 칩 선택 컴포넌트 (Material Symbols 아이콘 사용)
  const ChipSelect = ({
    options,
    selected,
    onSelect,
  }: {
    options: readonly { id: string; label: string; icon: string }[]
    selected: string[]
    onSelect: (id: string) => void
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.id)
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
              ${isSelected
                ? 'text-white shadow-md'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
              }
            `}
            style={isSelected ? { backgroundColor: 'var(--color-green)' } : {}}
          >
            <span className="material-symbols-outlined text-base">{option.icon}</span>
            {option.label}
          </button>
        )
      })}
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
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      <main className="p-4 space-y-4">
        {/* 장소 이름 */}
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

        {/* 주소 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            주소/위치 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">
              search
            </span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소 검색..."
              className="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700"
            />
          </div>

          {/* 지도 미리보기 (placeholder) */}
          <div className="mt-3 h-32 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
            <span className="material-symbols-outlined mr-2">map</span>
            지도 미리보기
          </div>
        </div>

        {/* 카테고리 (복수 선택 가능) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-3">
            카테고리 <span className="text-red-500">*</span>
            <span className="text-stone-400 font-normal ml-1">(복수 선택 가능)</span>
          </label>
          <div className="flex gap-2">
            {[
              { id: 'bath', emoji: '🛁', label: '목욕탕' },
              { id: 'sauna', emoji: '🔥', label: '사우나' },
              { id: 'jjim', emoji: '🥚', label: '찜질방' },
            ].map((cat) => {
              const isSelected = categories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategories(prev =>
                      prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id]
                    )
                  }}
                  className={`
                    flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1
                    ${isSelected
                      ? 'text-white shadow-md'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }
                  `}
                  style={isSelected ? { backgroundColor: 'var(--color-green)' } : {}}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              )
            })}
          </div>
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
            {/* 탕 구성 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {PLACE_SPECS.BATHS.label} (있는 것 선택)
              </label>
              <ChipSelect
                options={PLACE_SPECS.BATHS.options}
                selected={selectedBaths}
                onSelect={(id) => {
                  setSelectedBaths(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  )
                }}
              />
            </div>

            {/* 사우나 구성 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {PLACE_SPECS.SAUNAS.label}
              </label>
              <ChipSelect
                options={PLACE_SPECS.SAUNAS.options}
                selected={selectedSaunas}
                onSelect={(id) => {
                  setSelectedSaunas(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  )
                }}
              />
            </div>

            {/* 편의시설 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {DEEP_LOG.AMENITIES.label}
              </label>
              <ChipSelect
                options={DEEP_LOG.AMENITIES.options}
                selected={selectedAmenities}
                onSelect={(id) => {
                  setSelectedAmenities(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  )
                }}
              />
            </div>

            {/* 매점 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-stone-700">매점</label>
                <button
                  onClick={() => setHasStore(!hasStore)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                    ${hasStore
                      ? 'text-white'
                      : 'bg-stone-100 text-stone-500'
                    }
                  `}
                  style={hasStore ? { backgroundColor: 'var(--color-green)' } : {}}
                >
                  <span className="material-symbols-outlined text-sm">
                    {hasStore ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  이용 함
                </button>
              </div>

              {hasStore && (
                <div className="space-y-3 pl-4 border-l-2 border-green-light">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-stone-600">매점 평점</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>
                        {storeScore}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">☆</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={storeScore}
                        onChange={(e) => setStoreScore(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm">★</span>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={storeMemo}
                      onChange={(e) => setStoreMemo(e.target.value)}
                      placeholder="추천 메뉴 메모 (예: 식혜가 시원하고 맛있음)"
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
