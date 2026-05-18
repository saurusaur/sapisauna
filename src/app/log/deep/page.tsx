'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DEEP_LOG, PLACE_SPECS } from '@/constants/content'
import countryToCurrency from 'country-to-currency'
import { Slider } from '@/components/slider'
import ChipSelect from '@/components/ui/chip-select'
import ConfirmModal from '@/components/ui/confirm-modal'
import ErrorBanner from '@/components/ui/error-banner'
import { insertLog, updateLog, saveOrUpdateDeepLog } from '@/lib/logs-service'
import { grantReward } from '@/lib/reward-service'
import { readEditSession, clearLogSessionAfterSave } from '@/lib/log-edit-session'
import { formatCostInput, safeParse } from '@/lib/utils'
import { captureError } from '@/lib/error-logger'
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

  // 사우나 온도 통합 토글 (사우너: 퀵에 없는 종류만, 목욕파/찜질파: 건식+습식)
  const [hasSaunaTemps, setHasSaunaTemps] = useState(false)
  const [drySaunaTemp, setDrySaunaTemp] = useState<number | null>(null)
  const [steamSaunaTemp, setSteamSaunaTemp] = useState<number | null>(null)
  // 퀵로그에서 이미 입력된 사우나 (saunner의 경우 둘 다 가능)
  const [quickHasDry, setQuickHasDry] = useState(false)
  const [quickHasSteam, setQuickHasSteam] = useState(false)

  // 탕 온도 통합 토글
  const [hasBathTemps, setHasBathTemps] = useState(false)
  const [hotBathTemp, setHotBathTemp] = useState<number | null>(null)
  const [veryHotBathTemp, setVeryHotBathTemp] = useState<number | null>(null)
  const [coldBathTemp, setColdBathTemp] = useState<number | null>(null)
  const [iceBathTemp, setIceBathTemp] = useState<number | null>(null)

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
    const { currentLog: parsed } = readEditSession()
    if (!parsed) return

    if (parsed._editId) {
      setIsEditMode(true)
      setEditId(parsed._editId)
    }

    // 장소명 + tribe 복원
    if (parsed.place_name) setPlaceName(parsed.place_name)
    if (parsed.tribe_id) setTribeId(parsed.tribe_id)

    // 장소 countryCode 기반 기본 통화 설정
    if (parsed.place_country_code) {
      const mapped = (countryToCurrency as Record<string, string>)[parsed.place_country_code]
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
      // 퀵로그 입력 상태 트래킹 (saunner는 quick에 dry/steam 둘 다 가능)
      const qHasDry = parsed.sauna_temp != null
      const qHasSteam = parsed.steam_sauna_temp != null
      setQuickHasDry(qHasDry)
      setQuickHasSteam(qHasSteam)

      // 사우나 온도 복원:
      //  - saunner: 퀵로그에 없는 종류만 deep log에서 입력 가능 → 그 값 복원
      //  - bather/jimi: 퀵로그에 사우나 없음, deep log에서 입력한 값(logs 테이블 기준) 복원
      const isSaunner = parsed.tribe_id === 'saunner'
      const deepDryShown = !isSaunner || !qHasDry
      const deepSteamShown = !isSaunner || !qHasSteam
      const hasDeepDryValue = deepDryShown && qHasDry && !isSaunner  // bather/jimi가 deep에서 입력한 건식
      const hasDeepSteamValue = deepSteamShown && qHasSteam          // saunner가 deep에서 추가한 습식이거나 bather/jimi 습식
      if (hasDeepDryValue || hasDeepSteamValue) {
        setHasSaunaTemps(true)
        if (hasDeepDryValue) setDrySaunaTemp(parsed.sauna_temp ?? null)
        if (hasDeepSteamValue) setSteamSaunaTemp(parsed.steam_sauna_temp ?? null)
      }
      // 탕 온도 복원
      const hasAnyBathTemp = dl.has_very_hot_bath || dl.has_ice_bath || (parsed.hot_bath_temp != null) || (parsed.cold_bath_temp != null && parsed.tribe_id === 'jimi')
      if (hasAnyBathTemp) {
        setHasBathTemps(true)
        if (dl.has_very_hot_bath && dl.very_hot_bath_temp != null) setVeryHotBathTemp(dl.very_hot_bath_temp)
        if (dl.has_ice_bath && dl.ice_bath_temp != null) setIceBathTemp(dl.ice_bath_temp)
        if (parsed.hot_bath_temp != null) setHotBathTemp(parsed.hot_bath_temp)
        if (parsed.cold_bath_temp != null && parsed.tribe_id === 'jimi') setColdBathTemp(parsed.cold_bath_temp)
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
      // 사우나 온도 (logs 테이블에 저장됨 — saveOrUpdateDeepLog에서 처리)
      //  - saunner: 퀵에 없던 종류만 deep에서 추가 가능 (그 종류만 채워서 보냄)
      //  - bather/jimi: 둘 다 deep에서 입력 가능
      sauna_temp: hasSaunaTemps ? drySaunaTemp : null,
      steam_sauna_temp: hasSaunaTemps ? steamSaunaTemp : null,
      // primary_sauna_kind: saunner는 퀵에서 이미 결정됨 (덮어쓰지 않음).
      // bather/jimi가 deep에서 새로 사우나 추가하면 여기서 결정.
      primary_sauna_kind: (() => {
        if (!hasSaunaTemps) return null
        const tid = tribeId
        if (tid === 'saunner') return null // 퀵로그 primary 유지 (service가 null이면 update 건너뜀)
        // bather/jimi: 입력된 쪽으로 결정. 둘 다면 dry 우선
        if (drySaunaTemp != null) return 'dry'
        if (steamSaunaTemp != null) return 'steam'
        return null
      })(),
      // 탕 온도: 토글 ON + 값 있는 것만 저장
      has_hot_bath: hasBathTemps && hotBathTemp != null,
      hot_bath_temp: hasBathTemps ? hotBathTemp : null,
      has_very_hot_bath: hasBathTemps && veryHotBathTemp != null,
      very_hot_bath_temp: hasBathTemps ? veryHotBathTemp : null,
      has_ice_bath: hasBathTemps && iceBathTemp != null,
      ice_bath_temp: hasBathTemps ? iceBathTemp : null,
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
      clearLogSessionAfterSave()
      router.push('/story')
    } catch (err) {
      captureError(err, { label: '딥로그 저장 실패' })
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
          {isEditMode ? '편집 취소' : '딥로그 취소'}
        </button>
      </header>

      <main className="px-5 space-y-5">
        {saveError && <ErrorBanner message={saveError} />}

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

        {/* 사우나 온도 섹션
            - saunner: 퀵로그에 없는 종류만 deep에서 추가 가능. 둘 다 있으면 섹션 자체 숨김.
            - bather/jimi: 건식+습식 둘 다 deep에서 입력 가능. */}
        {(() => {
          const isSaunner = tribeId === 'saunner'
          const showDry = !isSaunner || !quickHasDry
          const showSteam = !isSaunner || !quickHasSteam
          // saunner가 quick에 둘 다 입력했다면 섹션 통째로 숨김 (수정은 quick log로)
          if (!showDry && !showSteam) return null
          return (
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
                  {showDry && (
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
                  {showSteam && (
                    <Slider
                      label={DEEP_LOG.SAUNA_TEMPS.STEAM.label}
                      value={steamSaunaTemp ?? 53}
                      min={DEEP_LOG.SAUNA_TEMPS.STEAM.min}
                      max={DEEP_LOG.SAUNA_TEMPS.STEAM.max}
                      unit={DEEP_LOG.SAUNA_TEMPS.STEAM.unit}
                      steps={DEEP_LOG.SAUNA_TEMPS.STEAM.steps}
                      onChange={(v) => setSteamSaunaTemp(v)}
                      inactive={steamSaunaTemp == null}
                      onActivate={() => setSteamSaunaTemp(53)}
                      showReset={steamSaunaTemp != null}
                      onReset={() => setSteamSaunaTemp(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* 탕 온도 통합 섹션 */}
        {(() => {
          const quickHasCold = tribeId === 'saunner' || tribeId === 'bather'
          const quickHasHot = tribeId === 'bather'
          const showHot = !quickHasHot
          const showVeryHot = true
          const showCold = !quickHasCold
          const showIce = true
          // 표시할 슬라이더가 있을 때만 섹션 표시
          if (!showHot && !showVeryHot && !showCold && !showIce) return null
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
                  {showIce && (
                    <Slider
                      label={DEEP_LOG.BATH_TEMPS.ICE_BATH.label}
                      value={iceBathTemp ?? 5}
                      min={DEEP_LOG.BATH_TEMPS.ICE_BATH.min}
                      max={DEEP_LOG.BATH_TEMPS.ICE_BATH.max}
                      unit={DEEP_LOG.BATH_TEMPS.ICE_BATH.unit}
                      steps={DEEP_LOG.BATH_TEMPS.ICE_BATH.steps}
                      onChange={(v) => setIceBathTemp(v)}
                      inactive={iceBathTemp == null}
                      onActivate={() => setIceBathTemp(5)}
                      showReset={iceBathTemp != null}
                      onReset={() => setIceBathTemp(null)}
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
            ? '편집 내용이 저장되지 않습니다.\n나가시겠습니까?'
            : '입력한 내용이 저장되지 않습니다.\n나가시겠습니까?'}
          confirmLabel={isEditMode ? '편집 취소' : '입력 취소'}
          cancelLabel="돌아가기"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}
