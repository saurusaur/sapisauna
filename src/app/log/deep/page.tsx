'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DEEP_LOG, PLACE_SPECS } from '@/constants/content'
import countryToCurrency from 'country-to-currency'
import { Slider } from '@/components/slider'
import ChipSelect from '@/components/ui/chip-select'
import ConfirmModal from '@/components/ui/confirm-modal'
import { insertLog, updateLog, saveOrUpdateDeepLog } from '@/lib/logs-service'
import { grantReward } from '@/lib/reward-service'
import { formatCostInput, safeParse } from '@/lib/utils'
import BottomCTA from '@/components/ui/bottom-cta'

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

  // 오늘의 경험
  const [companion, setCompanion] = useState<string | null>(null)
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

  // 청결도 (기본 미선택)
  const [cleanliness, setCleanliness] = useState<number | null>(null)
  const [cleanlinessActive, setCleanlinessActive] = useState(false)

  // 사우나 온도 통합 토글 (사우너: 습식만, 목욕파/찜질파: 건식+습식)
  const [hasSaunaTemps, setHasSaunaTemps] = useState(false)
  const [drySaunaTemp, setDrySaunaTemp] = useState<number | null>(null)
  const [wetSaunaTemp, setWetSaunaTemp] = useState<number | null>(null)

  // 탕 온도 통합 토글
  const [hasBathTemps, setHasBathTemps] = useState(false)
  const [hotBathTemp, setHotBathTemp] = useState<number | null>(null)
  const [veryHotBathTemp, setVeryHotBathTemp] = useState<number | null>(null)
  const [coldBathTemp, setColdBathTemp] = useState<number | null>(null)

  // 세신/마사지
  const [hasScrub, setHasScrub] = useState(false)
  const [scrubTypes, setScrubTypes] = useState<string[]>([])
  const [scrubCost, setScrubCost] = useState('')
  const [scrubSatisfaction, setScrubSatisfaction] = useState<number | null>(null)
  const [scrubSatisfactionActive, setScrubSatisfactionActive] = useState(false)

  // 매점
  const [hasStore, setHasStore] = useState(false)
  const [storeScore, setStoreScore] = useState<number | null>(null)
  const [storeScoreActive, setStoreScoreActive] = useState(false)
  const [storeMemo, setStoreMemo] = useState('')

  // tribe 조건부 표시용
  const [tribeId, setTribeId] = useState<string | null>(null)

  // 이전 입력 복원 (편집 모드 또는 뒤로가기 시)
  useEffect(() => {
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

      // 장소명 + tribe 복원
      if (parsed.place_name) setPlaceName(parsed.place_name as string)
      if (parsed.tribe_id) setTribeId(parsed.tribe_id as string)

      // 장소 countryCode 기반 기본 통화 설정
      const countryCode = parsed.place_country_code as string | undefined
      if (countryCode) {
        const mapped = (countryToCurrency as Record<string, string>)[countryCode]
        if (mapped) setCurrency(mapped)
      }

      // 기존 딥로그 데이터 복원 (편집 모드 + 세션 내 재진입 모두)
      const dl = parsed.deep_log ?? null
      if (dl) {
        if (dl.companion) setCompanion(dl.companion)
        if (dl.cost) setCost(dl.cost.toLocaleString())
        if (dl.currency) setCurrency(dl.currency)
        if (dl.crowd) setCrowd(dl.crowd)
        if (dl.memo) setMemo(dl.memo)
        if (dl.cleanliness != null) { setCleanliness(dl.cleanliness); setCleanlinessActive(true) }
        // 사우나 온도 복원
        const hasSaunaData = dl.has_wet_sauna || (parsed.sauna_temp != null && parsed.tribe_id !== 'saunner')
        if (hasSaunaData) {
          setHasSaunaTemps(true)
          if (dl.has_wet_sauna) setWetSaunaTemp(dl.wet_sauna_temp as number)
          if (parsed.sauna_temp != null && parsed.tribe_id !== 'saunner') setDrySaunaTemp(parsed.sauna_temp as number)
        }
        // 탕 온도 복원
        const hasAnyBathTemp = dl.has_very_hot_bath || (parsed.hot_bath_temp != null) || (parsed.cold_bath_temp != null && parsed.tribe_id === 'jimi')
        if (hasAnyBathTemp) {
          setHasBathTemps(true)
          if (dl.has_very_hot_bath) setVeryHotBathTemp(dl.very_hot_bath_temp as number)
          if (parsed.hot_bath_temp != null) setHotBathTemp(parsed.hot_bath_temp as number)
          if (parsed.cold_bath_temp != null && parsed.tribe_id === 'jimi') setColdBathTemp(parsed.cold_bath_temp as number)
        }
        if (dl.has_scrub) {
          setHasScrub(true)
          if (dl.scrub_types?.length) setScrubTypes(dl.scrub_types)
          if (dl.scrub_cost) setScrubCost(dl.scrub_cost.toLocaleString())
          if (dl.scrub_satisfaction != null) { setScrubSatisfaction(dl.scrub_satisfaction); setScrubSatisfactionActive(true) }
        }
        if (dl.has_store) {
          setHasStore(true)
          if (dl.store_score != null) { setStoreScore(dl.store_score); setStoreScoreActive(true) }
          setStoreMemo(dl.store_memo || '')
        }
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

    const deepLogData = {
      companion,
      cost: cost ? parseInt(cost.replace(/,/g, '')) : null,
      currency,
      crowd,
      memo,
      cleanliness: cleanlinessActive ? cleanliness : null,
      has_wet_sauna: hasSaunaTemps && wetSaunaTemp != null,
      wet_sauna_temp: hasSaunaTemps ? wetSaunaTemp : null,
      // 건식 사우나 (목욕파/찜질파 딥로그 → logs.sauna_temp에 저장)
      sauna_temp: hasSaunaTemps ? drySaunaTemp : null,
      // 탕 온도: 토글 ON + 값 있는 것만 저장
      has_hot_bath: hasBathTemps && hotBathTemp != null,
      hot_bath_temp: hasBathTemps ? hotBathTemp : null,
      has_very_hot_bath: hasBathTemps && veryHotBathTemp != null,
      very_hot_bath_temp: hasBathTemps ? veryHotBathTemp : null,
      // 냉탕: logs 테이블에 저장 (saveOrUpdateDeepLog에서 처리)
      cold_bath_temp: hasBathTemps ? coldBathTemp : null,
      has_scrub: hasScrub,
      scrub_types: hasScrub ? scrubTypes : [],
      scrub_cost: hasScrub && scrubCost ? parseInt(scrubCost.replace(/,/g, '')) : null,
      scrub_satisfaction: hasScrub && scrubSatisfactionActive ? scrubSatisfaction : null,
      has_store: hasStore,
      store_score: hasStore && storeScoreActive ? storeScore : null,
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
        // 숏로그 + 딥로그 XP 각각 지급
        const tribeId = (logData.tribe_id as string) || undefined
        const shortReward = await grantReward('short_log', { tribeId: tribeId as import('@/types').TribeId })
        const deepReward = await grantReward('deep_log', { tribeId: tribeId as import('@/types').TribeId })
        // 최종 결과만 pendingReward에 저장 (더 높은 레벨업 반영)
        const finalReward = deepReward || shortReward
        if (finalReward) {
          localStorage.setItem('pendingReward', JSON.stringify(finalReward))
        }
      }

      // 저장 성공 → 정리 후 스토리로
      localStorage.setItem('savedLogId', logId)
      localStorage.setItem('isNewLog', 'true')
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
    <div className="min-h-dvh bath-tile-bg pb-24">
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

        {/* 청결도 — 기본 미선택 */}
        <div>
          <Slider
            label={DEEP_LOG.CLEANLINESS.label}
            value={cleanliness ?? 3}
            min={DEEP_LOG.CLEANLINESS.min}
            max={DEEP_LOG.CLEANLINESS.max}
            steps={DEEP_LOG.CLEANLINESS.steps}
            onChange={(v) => {
              if (cleanlinessActive && cleanliness === v) { setCleanliness(null); setCleanlinessActive(false) }
              else { setCleanliness(v); setCleanlinessActive(true) }
            }}
            inactive={!cleanlinessActive}
            onActivate={() => { setCleanlinessActive(true); setCleanliness(3) }}
            variant="chip"
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

        <div className="border-t border-stone-200/60" />

        {/* 사우나 온도 — 사우너: 습식만 / 목욕파·찜질파: 건식+습식 */}
        <div className="glass-card-light px-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              {DEEP_LOG.SAUNA_TEMPS.label}
            </label>
            <button
              onClick={() => setHasSaunaTemps(!hasSaunaTemps)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                hasSaunaTemps ? 'text-white' : 'glass-chip text-stone-500'
              }`}
              style={hasSaunaTemps ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {hasSaunaTemps ? DEEP_LOG.SAUNA_TEMPS.toggleLabelActive : DEEP_LOG.SAUNA_TEMPS.toggleLabel}
            </button>
          </div>

          {hasSaunaTemps && (
            <div className="space-y-1 mt-2">
              {/* 건식 — 사우너파는 퀵로그에서 이미 입력하므로 숨김 */}
              {tribeId !== 'saunner' && (
                <Slider
                  label={DEEP_LOG.SAUNA_TEMPS.DRY.label}
                  value={drySaunaTemp ?? 85}
                  min={DEEP_LOG.SAUNA_TEMPS.DRY.min}
                  max={DEEP_LOG.SAUNA_TEMPS.DRY.max}
                  unit={DEEP_LOG.SAUNA_TEMPS.DRY.unit}
                  steps={DEEP_LOG.SAUNA_TEMPS.DRY.steps}
                  onChange={(v) => setDrySaunaTemp(v)}
                  inactive={drySaunaTemp == null}
                  onActivate={() => setDrySaunaTemp(85)}
                  showReset={drySaunaTemp != null}
                  onReset={() => setDrySaunaTemp(null)}
                />
              )}
              {/* 습식 — 전원 */}
              <Slider
                label={DEEP_LOG.SAUNA_TEMPS.WET.label}
                value={wetSaunaTemp ?? 53}
                min={DEEP_LOG.SAUNA_TEMPS.WET.min}
                max={DEEP_LOG.SAUNA_TEMPS.WET.max}
                unit={DEEP_LOG.SAUNA_TEMPS.WET.unit}
                steps={DEEP_LOG.SAUNA_TEMPS.WET.steps}
                onChange={(v) => setWetSaunaTemp(v)}
                inactive={wetSaunaTemp == null}
                onActivate={() => setWetSaunaTemp(53)}
                showReset={wetSaunaTemp != null}
                onReset={() => setWetSaunaTemp(null)}
              />
            </div>
          )}
        </div>

        {/* 탕 온도 통합 섹션 */}
        {(() => {
          const quickHasCold = tribeId === 'saunner' || tribeId === 'bather'
          const quickHasHot = tribeId === 'bather'
          const showHot = !quickHasHot
          const showVeryHot = true
          const showCold = !quickHasCold
          // 표시할 슬라이더가 있을 때만 섹션 표시
          if (!showHot && !showVeryHot && !showCold) return null
          return (
            <div className="glass-card-light px-4 py-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700">
                  {DEEP_LOG.BATH_TEMPS.label}
                </label>
                <button
                  onClick={() => setHasBathTemps(!hasBathTemps)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    hasBathTemps ? 'text-white' : 'glass-chip text-stone-500'
                  }`}
                  style={hasBathTemps ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  {hasBathTemps ? DEEP_LOG.BATH_TEMPS.toggleLabelActive : DEEP_LOG.BATH_TEMPS.toggleLabel}
                </button>
              </div>

              {hasBathTemps && (
                <div className="space-y-1 mt-2">
                  {showHot && (
                    <Slider
                      label={DEEP_LOG.BATH_TEMPS.HOT_BATH.label}
                      value={hotBathTemp ?? 39}
                      min={DEEP_LOG.BATH_TEMPS.HOT_BATH.min}
                      max={DEEP_LOG.BATH_TEMPS.HOT_BATH.max}
                      unit={DEEP_LOG.BATH_TEMPS.HOT_BATH.unit}
                      steps={DEEP_LOG.BATH_TEMPS.HOT_BATH.steps}
                      onChange={(v) => setHotBathTemp(v)}
                      inactive={hotBathTemp == null}
                      onActivate={() => setHotBathTemp(39)}
                      showReset={hotBathTemp != null}
                      onReset={() => setHotBathTemp(null)}
                    />
                  )}
                  {showVeryHot && (
                    <Slider
                      label={DEEP_LOG.BATH_TEMPS.VERY_HOT_BATH.label}
                      value={veryHotBathTemp ?? 42}
                      min={DEEP_LOG.BATH_TEMPS.VERY_HOT_BATH.min}
                      max={DEEP_LOG.BATH_TEMPS.VERY_HOT_BATH.max}
                      unit={DEEP_LOG.BATH_TEMPS.VERY_HOT_BATH.unit}
                      steps={DEEP_LOG.BATH_TEMPS.VERY_HOT_BATH.steps}
                      onChange={(v) => setVeryHotBathTemp(v)}
                      inactive={veryHotBathTemp == null}
                      onActivate={() => setVeryHotBathTemp(42)}
                      showReset={veryHotBathTemp != null}
                      onReset={() => setVeryHotBathTemp(null)}
                    />
                  )}
                  {showCold && (
                    <Slider
                      label={DEEP_LOG.BATH_TEMPS.COLD_BATH.label}
                      value={coldBathTemp ?? 15}
                      min={DEEP_LOG.BATH_TEMPS.COLD_BATH.min}
                      max={DEEP_LOG.BATH_TEMPS.COLD_BATH.max}
                      unit={DEEP_LOG.BATH_TEMPS.COLD_BATH.unit}
                      steps={DEEP_LOG.BATH_TEMPS.COLD_BATH.steps}
                      onChange={(v) => setColdBathTemp(v)}
                      inactive={coldBathTemp == null}
                      onActivate={() => setColdBathTemp(15)}
                      showReset={coldBathTemp != null}
                      onReset={() => setColdBathTemp(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* 세신/마사지 */}
        <div className="glass-card-light px-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              {DEEP_LOG.SCRUB.label}
            </label>
            <button
              onClick={() => setHasScrub(!hasScrub)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                hasScrub ? 'text-white' : 'glass-chip text-stone-500'
              }`}
              style={hasScrub ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {hasScrub ? DEEP_LOG.SCRUB.toggleLabelActive : DEEP_LOG.SCRUB.toggleLabel}
            </button>
          </div>

          {hasScrub && (
            <div className="space-y-3 mt-2">
              {/* 종류 칩 */}
              <div className="flex gap-1.5">
                {DEEP_LOG.SCRUB.types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setScrubTypes(prev =>
                      prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                    )}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      scrubTypes.includes(t.id) ? 'text-white' : 'glass-chip text-stone-500'
                    }`}
                    style={scrubTypes.includes(t.id) ? { backgroundColor: 'var(--color-primary)' } : undefined}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 가격 — 입장료 통화 자동 적용 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 shrink-0">{currency}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={scrubCost}
                  onChange={(e) => setScrubCost(formatCostInput(e.target.value))}
                  placeholder={
                    scrubTypes.includes('scrub') && scrubTypes.includes('massage')
                      ? '마사지 세신 가격을 입력해주세요'
                      : scrubTypes.includes('massage')
                        ? '마사지 가격을 입력해주세요'
                        : '기본 세신 가격을 입력해주세요'
                  }
                  className="flex-1 glass-input px-4 py-3 focus:outline-none text-stone-700 text-right text-sm"
                />
              </div>

              {/* 만족도 — 기본 미선택 */}
              <Slider
                label={DEEP_LOG.SCRUB.satisfaction.label}
                value={scrubSatisfaction ?? 3}
                min={DEEP_LOG.SCRUB.satisfaction.min}
                max={DEEP_LOG.SCRUB.satisfaction.max}
                steps={DEEP_LOG.SCRUB.satisfaction.steps}
                onChange={(v) => {
                  if (scrubSatisfactionActive && scrubSatisfaction === v) { setScrubSatisfaction(null); setScrubSatisfactionActive(false) }
                  else { setScrubSatisfaction(v); setScrubSatisfactionActive(true) }
                }}
                variant="chip"
                inactive={!scrubSatisfactionActive}
                onActivate={() => { setScrubSatisfactionActive(true); setScrubSatisfaction(3) }}
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
                value={storeScore ?? 3}
                min={PLACE_SPECS.STORE.rating.min}
                max={PLACE_SPECS.STORE.rating.max}
                steps={PLACE_SPECS.STORE.rating.steps}
                onChange={(v) => {
                  if (storeScoreActive && storeScore === v) { setStoreScore(null); setStoreScoreActive(false) }
                  else { setStoreScore(v); setStoreScoreActive(true) }
                }}
                variant="chip"
                inactive={!storeScoreActive}
                onActivate={() => { setStoreScoreActive(true); setStoreScore(3) }}
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

      <BottomCTA onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2">
        {isSaving && (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {isEditMode ? '수정 저장' : '기록 저장'}
      </BottomCTA>

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
