'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEEP_LOG, PLACE_SPECS, LOG_BATH_GENDER } from '@/constants/content'
import { Slider } from '@/components/slider'
import ChipSelect from '@/components/ui/chip-select'
import SelectButton from '@/components/ui/select-button'
import ConfirmModal from '@/components/ui/confirm-modal'
import { formatCostInput, safeParse } from '@/lib/utils'
import type { BathGender } from '@/types'

export default function DeepLog() {
  const router = useRouter()

  // 편집 모드 여부
  const [isEditMode, setIsEditMode] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // 탕 선택 (남탕/여탕/혼탕) - 직전 선택값 기본 적용
  const [bathGender, setBathGender] = useState<BathGender | null>(null)

  // 오늘의 경험
  const [companion, setCompanion] = useState<string | null>(null)
  const [purposes, setPurposes] = useState<string[]>([])
  const [cost, setCost] = useState('')
  const [crowd, setCrowd] = useState<string | null>(null)
  const [memo, setMemo] = useState('')

  // 세신
  const [hasScrub, setHasScrub] = useState(false)
  const [scrubSatisfaction, setScrubSatisfaction] = useState(3)

  // 매점
  const [hasStore, setHasStore] = useState(false)
  const [storeScore, setStoreScore] = useState(3)
  const [storeMemo, setStoreMemo] = useState('')

  // 이전 입력 복원 (편집 모드 또는 뒤로가기 시)
  useEffect(() => {
    let restoredGender: BathGender | null = null

    // currentLog에서 편집 모드 확인 + deep_log 복원 (편집 모드일 때만)
    const currentLog = localStorage.getItem('currentLog')
    if (currentLog) {
      const parsed = safeParse(currentLog, null)
      if (!parsed) return
      const isEdit = Boolean(parsed._editId)
      if (isEdit) setIsEditMode(true)
      // 편집 모드일 때만 기존 딥로그 데이터 복원
      const dl = isEdit ? parsed.deep_log : null
      if (dl) {
        if (dl.bath_gender) { setBathGender(dl.bath_gender as BathGender); restoredGender = dl.bath_gender }
        if (dl.companion) setCompanion(dl.companion)
        if (dl.purposes) setPurposes(dl.purposes)
        if (dl.cost) setCost(dl.cost.toLocaleString())
        if (dl.crowd) setCrowd(dl.crowd)
        if (dl.memo) setMemo(dl.memo)
        if (dl.has_scrub) { setHasScrub(true); setScrubSatisfaction(dl.scrub_satisfaction || 3) }
        if (dl.has_store) { setHasStore(true); setStoreScore(dl.store_score || 3); setStoreMemo(dl.store_memo || '') }
      }
    }

    // 직전 탕 선택값 폴백 (deep_log에 bath_gender가 없을 때만)
    if (!restoredGender) {
      const lastBathGender = localStorage.getItem('lastBathGender')
      if (lastBathGender) {
        setBathGender(lastBathGender as BathGender)
      }
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
      // 세신
      has_scrub: hasScrub,
      scrub_satisfaction: hasScrub ? scrubSatisfaction : null,
      // 매점
      has_store: hasStore,
      store_score: hasStore ? storeScore : null,
      store_memo: hasStore ? storeMemo : null,
    }

    // 기존 로그 데이터와 병합
    const currentLog = localStorage.getItem('currentLog')
    if (currentLog) {
      const merged = { ...safeParse(currentLog, {}), deep_log: deepLogData }
      localStorage.setItem('currentLog', JSON.stringify(merged))
    }

    router.back()
  }

  // 취소: 딥로그 입력 내용 버리고 돌아가기
  const handleCancelConfirm = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bath-tile-bg pb-8">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">Deep Log</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-2 text-stone-400 hover:text-stone-600 text-xs transition-colors"
          >
            {isEditMode ? '편집 취소' : '입력 취소'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            {isEditMode ? '편집 저장' : '기록 저장'}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* 오늘의 경험 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
          {/* 탕 선택 — 섹션 상단 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {DEEP_LOG.BATH_GENDER.label}
            </label>
            <ChipSelect
              options={LOG_BATH_GENDER}
              selected={bathGender}
              onSelect={(id) => setBathGender(id as BathGender)}
            />
            {bathGender && (
              <p className="text-xs text-stone-400 mt-1.5">
                다음 기록 시 기본값으로 적용돼요
              </p>
            )}
          </div>

          <div className="border-t border-stone-100" />

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
            {/* 세신 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-stone-700">{DEEP_LOG.SCRUB.label}</label>
                <SelectButton
                  label={DEEP_LOG.SCRUB.toggleLabel}
                  icon={hasScrub ? 'check_box' : 'check_box_outline_blank'}
                  selected={hasScrub}
                  onClick={() => setHasScrub(!hasScrub)}
                />
              </div>

              {hasScrub && (
                <div className="pl-4 border-l-2 border-green-light">
                  <Slider
                    label={DEEP_LOG.SCRUB.satisfaction.label}
                    value={scrubSatisfaction}
                    min={DEEP_LOG.SCRUB.satisfaction.min}
                    max={DEEP_LOG.SCRUB.satisfaction.max}
                    steps={DEEP_LOG.SCRUB.satisfaction.steps}
                    onChange={setScrubSatisfaction}
                  />
                </div>
              )}
            </div>
            {/* 매점 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-stone-700">{PLACE_SPECS.STORE.label}</label>
                <SelectButton
                  label={PLACE_SPECS.STORE.toggleLabel}
                  icon={hasStore ? 'check_box' : 'check_box_outline_blank'}
                  selected={hasStore}
                  onClick={() => setHasStore(!hasStore)}
                />
              </div>

              {hasStore && (
                <div className="space-y-3 pl-4 border-l-2 border-green-light">
                  <Slider
                    label={PLACE_SPECS.STORE.rating.label}
                    value={storeScore}
                    min={PLACE_SPECS.STORE.rating.min}
                    max={PLACE_SPECS.STORE.rating.max}
                    steps={PLACE_SPECS.STORE.rating.steps}
                    onChange={setStoreScore}
                  />

                  {/* 추천메뉴 메모 */}
                  <div>
                    <input
                      type="text"
                      value={storeMemo}
                      onChange={(e) => setStoreMemo(e.target.value)}
                      placeholder={PLACE_SPECS.STORE.memoPlaceholder}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
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

      {/* 취소 확인 모달 */}
      {showCancelConfirm && (
        <ConfirmModal
          message={isEditMode
            ? '편집 내용을 취소하시겠습니까?'
            : '입력 내용을 취소하시겠습니까?\n입력한 내용이 저장되지 않습니다.'}
          confirmLabel={isEditMode ? '편집 취소' : '입력 취소'}
          cancelLabel="돌아가기"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}
