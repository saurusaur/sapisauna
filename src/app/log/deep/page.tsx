'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DEEP_LOG, PLACE_SPECS, LOG_BATH_GENDER } from '@/constants/content'
import countryToCurrency from 'country-to-currency'
import { Slider } from '@/components/slider'
import ChipSelect from '@/components/ui/chip-select'
import ConfirmModal from '@/components/ui/confirm-modal'
import { insertLog, updateLog, saveOrUpdateDeepLog } from '@/lib/logs-service'
import { formatCostInput, safeParse } from '@/lib/utils'
import type { BathGender } from '@/types'

export default function DeepLog() {
  const router = useRouter()

  // 편집 모드 여부
  const [isEditMode, setIsEditMode] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // 장소명 (currentLog에서 복원)
  const [placeName, setPlaceName] = useState('')

  // 탕 선택 (남탕/여탕/혼탕) - 직전 선택값 기본 적용
  const [bathGender, setBathGender] = useState<BathGender | null>(null)

  // 오늘의 경험
  const [companion, setCompanion] = useState<string | null>(null)
  const [purposes, setPurposes] = useState<string[]>([])
  const [cost, setCost] = useState('')
  const [currency, setCurrency] = useState('KRW')
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [currencySearch, setCurrencySearch] = useState('')
  const currencyRef = useRef<HTMLDivElement>(null)
  const [crowd, setCrowd] = useState<string | null>(null)
  const [memo, setMemo] = useState('')

  // 통화 목록 (고정 + 전체)
  const allCurrencies = useMemo(() => {
    const pinned = [...DEEP_LOG.COST.pinnedCurrencies] as string[]
    const rest = Array.from(new Set(Object.values(countryToCurrency as Record<string, string>)))
      .filter((c) => !pinned.includes(c))
      .sort()
    return { pinned, rest }
  }, [])

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
      if (isEdit) {
        setIsEditMode(true)
        setEditId(parsed._editId as string)
      }

      // 장소명 복원
      if (parsed.place_name) setPlaceName(parsed.place_name as string)

      // 장소 countryCode 기반 기본 통화 설정
      const countryCode = parsed.place_country_code as string | undefined
      if (countryCode) {
        const mapped = (countryToCurrency as Record<string, string>)[countryCode]
        if (mapped) setCurrency(mapped)
      }

      // 기존 딥로그 데이터 복원 (편집 모드 + 세션 내 재진입 모두)
      const dl = parsed.deep_log ?? null
      if (dl) {
        if (dl.bath_gender) { setBathGender(dl.bath_gender as BathGender); restoredGender = dl.bath_gender }
        if (dl.companion) setCompanion(dl.companion)
        if (dl.purposes) setPurposes(dl.purposes)
        if (dl.cost) setCost(dl.cost.toLocaleString())
        if (dl.currency) setCurrency(dl.currency)
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

  // 통화 피커 바깥 클릭 닫기
  useEffect(() => {
    if (!showCurrencyPicker) return
    const handleClick = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyPicker(false)
        setCurrencySearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCurrencyPicker])

  // 저장 처리: 숏로그 + 딥로그를 DB에 저장 후 스토리로 이동
  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)

    // 탕 선택값 저장 (다음에 기본값으로 사용)
    if (bathGender) {
      localStorage.setItem('lastBathGender', bathGender)
    }

    const deepLogData = {
      bath_gender: bathGender,
      companion,
      purposes,
      cost: cost ? parseInt(cost.replace(/,/g, '')) : null,
      currency,
      crowd,
      memo,
      has_scrub: hasScrub,
      scrub_satisfaction: hasScrub ? scrubSatisfaction : null,
      has_store: hasStore,
      store_score: hasStore ? storeScore : null,
      store_memo: hasStore ? storeMemo : null,
    }

    try {
      const currentLog = localStorage.getItem('currentLog')
      if (!currentLog) throw new Error('기록 데이터가 없습니다')
      const logData = safeParse<Record<string, unknown>>(currentLog, {})

      let logId: string

      if (editId) {
        // 편집 모드: UPDATE
        await updateLog(editId, logData)
        await saveOrUpdateDeepLog(editId, deepLogData)
        logId = editId
      } else {
        // 새 기록: INSERT
        logId = await insertLog(logData)
        await saveOrUpdateDeepLog(logId, deepLogData)
      }

      // 저장 성공 → 정리 후 스토리로
      localStorage.setItem('savedLogId', logId)
      localStorage.removeItem('currentLog')
      localStorage.removeItem('selectedPlace')
      localStorage.removeItem('selectedRecordDate')
      router.push('/story')
    } catch (err) {
      console.error('저장 실패:', err)
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  // 취소: 딥로그 입력 내용 버리고 돌아가기
  const handleCancelConfirm = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bath-tile-bg pb-24">
      {/* 헤더 — 장소명 + 딥로그 취소 */}
      <header className="px-5 pt-8 pb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-stone-800">{placeName || 'Deep Log'}</h1>
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          딥로그 취소
        </button>
      </header>

      <main className="px-5 space-y-5">
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl">
            {saveError}
          </div>
        )}

        {/* 탕 선택 */}
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

        <div className="border-t border-stone-200/60" />

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
        <div className="relative z-40">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            {DEEP_LOG.COST.label}
          </label>
          <div
            className="flex gap-2"
            style={{ filter: 'drop-shadow(0 2px 6px hsl(0 10% 15% / .06))' }}
          >
            {/* 통화 선택 — 커스텀 드롭다운 */}
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => { setShowCurrencyPicker(!showCurrencyPicker); setCurrencySearch('') }}
                className="glass-input h-full px-3 py-3 flex items-center gap-1 text-sm font-medium text-stone-700 cursor-pointer transition-all"
              >
                {currency}
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>expand_more</span>
              </button>

              {showCurrencyPicker && (
                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg z-50 w-[200px] overflow-hidden">
                  {/* 검색 입력 */}
                  <div className="p-2 border-b border-stone-100">
                    <input
                      type="text"
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value.toUpperCase())}
                      placeholder="통화 검색..."
                      className="w-full px-3 py-2 text-xs rounded-lg bg-stone-50 focus:outline-none text-stone-700 placeholder:text-stone-400"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-[200px] overflow-y-auto">
                    {/* 고정 통화 */}
                    {allCurrencies.pinned
                      .filter(c => !currencySearch || c.includes(currencySearch))
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCurrency(c); setShowCurrencyPicker(false); setCurrencySearch('') }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 transition-colors ${
                            currency === c ? 'font-bold' : 'text-stone-600'
                          }`}
                          style={currency === c ? { color: 'var(--color-primary)' } : undefined}
                        >
                          {c}
                        </button>
                      ))}

                    {/* 구분선 (검색 중이 아닐 때) */}
                    {!currencySearch && <div className="border-t border-stone-100" />}

                    {/* 나머지 통화 */}
                    {allCurrencies.rest
                      .filter(c => !currencySearch || c.includes(currencySearch))
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCurrency(c); setShowCurrencyPicker(false); setCurrencySearch('') }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 transition-colors ${
                            currency === c ? 'font-bold' : 'text-stone-600'
                          }`}
                          style={currency === c ? { color: 'var(--color-primary)' } : undefined}
                        >
                          {c}
                        </button>
                      ))}

                    {/* 검색 결과 없음 */}
                    {currencySearch &&
                      allCurrencies.pinned.filter(c => c.includes(currencySearch)).length === 0 &&
                      allCurrencies.rest.filter(c => c.includes(currencySearch)).length === 0 && (
                        <p className="px-4 py-3 text-xs text-stone-400 text-center">결과 없음</p>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* 금액 입력 */}
            <input
              type="text"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(formatCostInput(e.target.value))}
              placeholder={DEEP_LOG.COST.placeholder}
              className="flex-1 glass-input px-4 py-3 focus:outline-none text-stone-700 text-right"
            />
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

        <div className="border-t border-stone-200/60" />

        {/* 세신 — 토글 시 라벨 변경 + 만족도 칩 인라인 */}
        <div className="glass-card-light px-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              {hasScrub ? '세신 만족도' : DEEP_LOG.SCRUB.label}
            </label>
            <button
              onClick={() => setHasScrub(!hasScrub)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                hasScrub ? 'text-white' : 'glass-chip text-stone-500'
              }`}
              style={hasScrub ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {hasScrub ? '이용 함' : '이용'}
            </button>
          </div>

          {hasScrub && (
            <div>
              <Slider
                label=""
                value={scrubSatisfaction}
                min={DEEP_LOG.SCRUB.satisfaction.min}
                max={DEEP_LOG.SCRUB.satisfaction.max}
                steps={DEEP_LOG.SCRUB.satisfaction.steps}
                onChange={setScrubSatisfaction}
                variant="chip"
              />
            </div>
          )}
        </div>

        {/* 매점 — 토글 시 라벨 변경 + 만족도 칩 인라인 */}
        <div className="glass-card-light px-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              {hasStore ? '매점 만족도' : PLACE_SPECS.STORE.label}
            </label>
            <button
              onClick={() => setHasStore(!hasStore)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                hasStore ? 'text-white' : 'glass-chip text-stone-500'
              }`}
              style={hasStore ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {hasStore ? '이용 함' : '이용'}
            </button>
          </div>

          {hasStore && (
            <div className="space-y-3">
              <Slider
                label=""
                value={storeScore}
                min={PLACE_SPECS.STORE.rating.min}
                max={PLACE_SPECS.STORE.rating.max}
                steps={PLACE_SPECS.STORE.rating.steps}
                onChange={setStoreScore}
                variant="chip"
              />
              <input
                type="text"
                value={storeMemo}
                onChange={(e) => setStoreMemo(e.target.value)}
                placeholder={PLACE_SPECS.STORE.memoPlaceholder}
                className="w-full glass-input px-4 py-3 focus:outline-none text-stone-700 text-sm"
              />
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            {DEEP_LOG.MEMO.label}
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={DEEP_LOG.MEMO.placeholder}
            rows={3}
            className="w-full glass-input px-4 py-3 focus:outline-none text-stone-700 resize-none"
          />
        </div>
      </main>

      {/* 하단 고정 저장 버튼 — 플로팅 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 pointer-events-auto"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 8px 30px -4px rgba(204, 26, 26, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.12)' }}
        >
          {isSaving && (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isEditMode ? '수정 저장' : '기록 저장'}
        </button>
      </div>

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
