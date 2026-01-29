'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEEP_LOG, PLACE_SPECS, BATH_GENDER_OPTIONS } from '@/constants/content'
import { formatCostInput } from '@/lib/utils'

// 탕 선택 타입
type BathGender = 'male' | 'female' | 'mixed'

export default function DeepLog() {
  const router = useRouter()

  // 탕 선택 (남탕/여탕/혼탕) - 직전 선택값 기본 적용
  const [bathGender, setBathGender] = useState<BathGender | null>(null)

  // 오늘의 경험
  const [companion, setCompanion] = useState<string | null>(null)
  const [purposes, setPurposes] = useState<string[]>([])
  const [cost, setCost] = useState('')
  const [crowd, setCrowd] = useState<string | null>(null)
  const [memo, setMemo] = useState('')

  // 편의시설
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  // 장소 정보
  const [selectedBaths, setSelectedBaths] = useState<string[]>([])
  const [selectedSaunas, setSelectedSaunas] = useState<string[]>([])
  const [hasStore, setHasStore] = useState(false)
  const [storeScore, setStoreScore] = useState(3)
  const [storeMemo, setStoreMemo] = useState('')

  // 직전 탕 선택값 불러오기
  useEffect(() => {
    const lastBathGender = localStorage.getItem('lastBathGender')
    if (lastBathGender) {
      setBathGender(lastBathGender as BathGender)
    }
  }, [])

  // 저장 처리
  const handleSave = () => {
    // 탕 선택값 저장 (다음에 기본값으로 사용)
    if (bathGender) {
      localStorage.setItem('lastBathGender', bathGender)
    }

    const deepLogData = {
      bath_gender: bathGender,
      companion,
      purposes,
      cost: cost ? parseInt(cost.replace(/,/g, '')) : null,
      crowd,
      memo,
      amenities: selectedAmenities,
      // 장소 정보
      selected_baths: selectedBaths,
      selected_saunas: selectedSaunas,
      has_store: hasStore,
      store_score: hasStore ? storeScore : null,
      store_memo: hasStore ? storeMemo : null,
    }

    // 기존 로그 데이터와 병합
    const currentLog = localStorage.getItem('currentLog')
    if (currentLog) {
      const merged = { ...JSON.parse(currentLog), deep_log: deepLogData }
      localStorage.setItem('currentLog', JSON.stringify(merged))
    }

    router.push('/complete')
  }

  // 칩 선택 컴포넌트 (Material Symbols 아이콘 사용)
  const ChipSelect = ({
    options,
    selected,
    onSelect,
    multiple = false,
  }: {
    options: readonly { id: string; label: string; icon: string }[]
    selected: string | string[] | null
    onSelect: (id: string) => void
    multiple?: boolean
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = multiple
          ? (selected as string[])?.includes(option.id)
          : selected === option.id

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

  // 탕 선택 버튼 컴포넌트 (페이지 기본 포인트 컬러 사용)
  const BathGenderSelect = () => (
    <div className="flex gap-3">
      {BATH_GENDER_OPTIONS.map((option) => {
        const isSelected = bathGender === option.id

        return (
          <button
            key={option.id}
            onClick={() => setBathGender(option.id as BathGender)}
            className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all
              flex flex-col items-center gap-1
              ${isSelected
                ? 'text-white shadow-md'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
              }
            `}
            style={isSelected ? { backgroundColor: 'var(--color-green)' } : {}}
          >
            <span className="material-symbols-outlined">{option.icon}</span>
            <span className="text-sm">{option.label}</span>
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
          <h1 className="text-lg font-bold text-stone-700">Deep Log</h1>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-green)' }}
        >
          저장
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* 탕 선택 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-3">
            {DEEP_LOG.BATH_GENDER.label}
          </label>
          <BathGenderSelect />
          {bathGender && (
            <p className="text-xs text-stone-400 mt-2 text-center">
              다음 기록 시 기본값으로 적용돼요
            </p>
          )}
        </div>

        {/* 오늘의 경험 섹션 */}
        <div>
          <h2 className="text-sm font-bold text-stone-500 mb-4 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap px-2">오늘의 경험</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
            {/* 동행자 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {DEEP_LOG.COMPANION.label}
              </label>
              <ChipSelect
                options={DEEP_LOG.COMPANION.options}
                selected={companion}
                onSelect={setCompanion}
              />
            </div>

            {/* 방문 목적 (복수 선택) */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {DEEP_LOG.PURPOSE.label}
              </label>
              <ChipSelect
                options={DEEP_LOG.PURPOSE.options}
                selected={purposes}
                onSelect={(id) => {
                  setPurposes(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  )
                }}
                multiple
              />
            </div>

            {/* 비용 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {DEEP_LOG.COST.label}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => setCost(formatCostInput(e.target.value))}
                  placeholder={DEEP_LOG.COST.placeholder}
                  className="w-full px-4 py-3 pr-12 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">원</span>
              </div>
            </div>

            {/* 혼잡도 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {DEEP_LOG.CROWD.label}
              </label>
              <ChipSelect
                options={DEEP_LOG.CROWD.options}
                selected={crowd}
                onSelect={setCrowd}
              />
            </div>
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
            첫 방문 시 표시 · 다른 사용자에게 도움이 돼요
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
                multiple
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
                multiple
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
                  {/* 매점 평점 */}
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

                  {/* 추천메뉴 메모 */}
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

        {/* 편의시설 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
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
            multiple
          />
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            {DEEP_LOG.MEMO.label}
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={DEEP_LOG.MEMO.placeholder}
            rows={3}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 resize-none"
          />
        </div>
      </main>
    </div>
  )
}
