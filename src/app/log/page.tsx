'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP, TRIBE_CATEGORY_MAP, QUICK_LOG } from '@/constants/content'
import { Slider, Counter, RoutineCounter } from '@/components/slider'
import { useUser } from '@/contexts/user-context'
import ConfirmModal from '@/components/ui/confirm-modal'

type LogType = 'bather' | 'saunner' | 'jimi'

export default function QuickLog() {
  const router = useRouter()
  const { primaryTribe } = useUser()
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeCountryCode, setPlaceCountryCode] = useState<string | undefined>(undefined)
  const [logType, setLogType] = useState<LogType>(primaryTribe as LogType)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // --- 사우너파 ---
  const [saunaTemp, setSaunaTemp] = useState(80)
  const [coldBathTemp, setColdBathTemp] = useState(15)
  const [totono, setTotono] = useState(3)

  // --- 목욕파 ---
  const [hotBathTemp, setHotBathTemp] = useState(40)
  const [batherColdBathTemp, setBatherColdBathTemp] = useState(20)
  const [batherColdEnabled, setBatherColdEnabled] = useState(false)
  const [waterQuality, setWaterQuality] = useState(3)

  // --- 찜질파 ---
  const [jjimTemp, setJjimTemp] = useState(80)
  const [jjimTempEnabled, setJjimTempEnabled] = useState(false)
  const [cleanliness, setCleanliness] = useState(3)

  // --- 공통 루틴 (null = 미입력/흐릿 상태) ---
  const [heatTime, setHeatTime] = useState<number | null>(null)
  const [iceTime, setIceTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [repeat, setRepeat] = useState(3)

  // --- 공통 ---
  const [revisit, setRevisit] = useState(3)

  // 편집 모드에서 기존 값 보존
  const [editId, setEditId] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null)
  const [existingDeepLog, setExistingDeepLog] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    // 장소 정보 복원 — 없으면 장소 선택 페이지로 redirect
    const placeData = localStorage.getItem('selectedPlace')
    if (placeData) {
      const place = JSON.parse(placeData)
      setPlaceName(place.name)
      if (place.id) setPlaceId(place.id)
      setPlaceCountryCode(place.countryCode)
    } else if (!localStorage.getItem('currentLog')) {
      // 편집 모드(currentLog 있음)가 아닌데 장소도 없으면 → 장소 선택으로
      router.replace('/place')
      return
    }

    // 이전 입력 복원 (스토리에서 뒤로가기 또는 편집 모드 진입 시)
    const savedLog = localStorage.getItem('currentLog')
    if (savedLog) {
      const log = JSON.parse(savedLog)
      // 편집 모드: 기존 값 보존
      if (log._editId) {
        setEditId(log._editId)
        if (log.created_at) setExistingCreatedAt(log.created_at)
      }
      if (log.deep_log) setExistingDeepLog(log.deep_log)
      if (log.tribe_id) setLogType(log.tribe_id as LogType)
      if (log.revisit_score) setRevisit(log.revisit_score)
      if (log.repeat) setRepeat(log.repeat)
      if (log.heat_time) setHeatTime(log.heat_time)
      if (log.ice_time) setIceTime(log.ice_time)
      if (log.pause_time) setPauseTime(log.pause_time)
      // 사우너
      if (log.sauna_temp) setSaunaTemp(log.sauna_temp)
      if (log.cold_bath_temp && log.tribe_id === 'saunner') setColdBathTemp(log.cold_bath_temp)
      if (log.totono_score) setTotono(log.totono_score)
      // 목욕파
      if (log.hot_bath_temp) setHotBathTemp(log.hot_bath_temp)
      if (log.cold_bath_temp && log.tribe_id === 'bather') {
        setBatherColdBathTemp(log.cold_bath_temp)
        setBatherColdEnabled(true)
      }
      if (log.water_quality) setWaterQuality(log.water_quality)
      // 찜질파
      if (log.jjim_temp) {
        setJjimTemp(log.jjim_temp)
        setJjimTempEnabled(true)
      }
      if (log.cleanliness) setCleanliness(log.cleanliness)
    }
  }, [])

  // 저장 처리
  const handleSave = () => {
    const logData = {
      ...(editId && { _editId: editId }),
      place_id: placeId,
      place_name: placeName,
      tribe_id: logType,
      created_at: existingCreatedAt ?? new Date().toISOString(),
      revisit_score: revisit,
      // 루틴 (입력된 경우만 포함)
      ...(heatTime !== null && { heat_time: heatTime }),
      ...(iceTime !== null && { ice_time: iceTime }),
      ...(pauseTime !== null && { pause_time: pauseTime }),
      repeat,
      // 타입별 데이터
      ...(logType === 'saunner' && {
        sauna_temp: saunaTemp,
        cold_bath_temp: coldBathTemp,
        totono_score: totono,
      }),
      ...(logType === 'bather' && {
        hot_bath_temp: hotBathTemp,
        ...(batherColdEnabled && { cold_bath_temp: batherColdBathTemp }),
        water_quality: waterQuality,
      }),
      ...(logType === 'jimi' && {
        ...(jjimTempEnabled && { jjim_temp: jjimTemp }),
        cleanliness,
      }),
      // 기존 deep_log 보존 (숏기록 수정 후 다시 저장할 때 deep_log가 날아가지 않도록)
      ...(existingDeepLog && { deep_log: existingDeepLog }),
    }

    localStorage.setItem('currentLog', JSON.stringify(logData))
    router.push('/story')
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowBackConfirm(true)}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">{placeName}</h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-stone-600 bg-white border border-stone-200 transition-all hover:bg-stone-50"
        >
          카드 생성
        </button>
      </header>

      <main className="p-4">
        {/* 타입 선택 드롭다운 */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"
          >
            <span className="flex items-center gap-2 font-medium text-stone-700">
              <span className="text-xl">{TRIBE_EMOJI_MAP[logType]}</span>
              {TRIBE_CATEGORY_MAP[logType]}
            </span>
            <span className="material-symbols-outlined text-stone-400">expand_more</span>
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
              {(['bather', 'saunner', 'jimi'] as LogType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setLogType(type)
                    setShowTypeDropdown(false)
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{TRIBE_EMOJI_MAP[type]}</span>
                    {TRIBE_CATEGORY_MAP[type]}
                  </span>
                  {logType === type && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-sm p-4">

          {/* ── 목욕파 ── */}
          {logType === 'bather' && (
            <>
              <Slider
                label={QUICK_LOG.BATHER.HOT_BATH_TEMP.label}
                value={hotBathTemp}
                min={QUICK_LOG.BATHER.HOT_BATH_TEMP.min}
                max={QUICK_LOG.BATHER.HOT_BATH_TEMP.max}
                unit={QUICK_LOG.BATHER.HOT_BATH_TEMP.unit}
                steps={[...QUICK_LOG.BATHER.HOT_BATH_TEMP.steps]}
                onChange={setHotBathTemp}
              />
              {/* 냉탕 온도 (선택 — 탭으로 활성화) */}
              <Slider
                label={QUICK_LOG.COMMON.COLD_BATH_TEMP.label}
                value={batherColdBathTemp}
                min={QUICK_LOG.COMMON.COLD_BATH_TEMP.min}
                max={QUICK_LOG.COMMON.COLD_BATH_TEMP.max}
                unit={QUICK_LOG.COMMON.COLD_BATH_TEMP.unit}
                steps={[...QUICK_LOG.COMMON.COLD_BATH_TEMP.steps]}
                onChange={setBatherColdBathTemp}
                inactive={!batherColdEnabled}
                onActivate={() => setBatherColdEnabled(true)}
                showReset={batherColdEnabled}
                onReset={() => setBatherColdEnabled(false)}
              />
              <Slider
                label={QUICK_LOG.BATHER.WATER_QUALITY.label}
                value={waterQuality}
                min={QUICK_LOG.BATHER.WATER_QUALITY.min}
                max={QUICK_LOG.BATHER.WATER_QUALITY.max}
                steps={[...QUICK_LOG.BATHER.WATER_QUALITY.steps]}
                onChange={setWaterQuality}
              />
            </>
          )}

          {/* ── 사우너파 ── */}
          {logType === 'saunner' && (
            <>
              <Slider
                label={QUICK_LOG.SAUNER.SAUNA_TEMP.label}
                value={saunaTemp}
                min={QUICK_LOG.SAUNER.SAUNA_TEMP.min}
                max={QUICK_LOG.SAUNER.SAUNA_TEMP.max}
                unit={QUICK_LOG.SAUNER.SAUNA_TEMP.unit}
                steps={[...QUICK_LOG.SAUNER.SAUNA_TEMP.steps]}
                onChange={setSaunaTemp}
              />
              <Slider
                label={QUICK_LOG.COMMON.COLD_BATH_TEMP.label}
                value={coldBathTemp}
                min={QUICK_LOG.COMMON.COLD_BATH_TEMP.min}
                max={QUICK_LOG.COMMON.COLD_BATH_TEMP.max}
                unit={QUICK_LOG.COMMON.COLD_BATH_TEMP.unit}
                steps={[...QUICK_LOG.COMMON.COLD_BATH_TEMP.steps]}
                onChange={setColdBathTemp}
              />
              <Slider
                label={QUICK_LOG.SAUNER.TOTONO.label}
                value={totono}
                min={QUICK_LOG.SAUNER.TOTONO.min}
                max={QUICK_LOG.SAUNER.TOTONO.max}
                steps={[...QUICK_LOG.SAUNER.TOTONO.steps]}
                onChange={setTotono}
              />
            </>
          )}

          {/* ── 찜질파 ── */}
          {logType === 'jimi' && (
            <>
              {/* 한증막 온도 (선택 — 탭으로 활성화) */}
              <Slider
                label={QUICK_LOG.JIMI.JJIM_TEMP.label}
                value={jjimTemp}
                min={QUICK_LOG.JIMI.JJIM_TEMP.min}
                max={QUICK_LOG.JIMI.JJIM_TEMP.max}
                unit={QUICK_LOG.JIMI.JJIM_TEMP.unit}
                steps={[...QUICK_LOG.JIMI.JJIM_TEMP.steps]}
                onChange={setJjimTemp}
                inactive={!jjimTempEnabled}
                onActivate={() => setJjimTempEnabled(true)}
                showReset={jjimTempEnabled}
                onReset={() => setJjimTempEnabled(false)}
              />
              <Slider
                label={QUICK_LOG.JIMI.CLEANLINESS.label}
                value={cleanliness}
                min={QUICK_LOG.JIMI.CLEANLINESS.min}
                max={QUICK_LOG.JIMI.CLEANLINESS.max}
                steps={[...QUICK_LOG.JIMI.CLEANLINESS.steps]}
                onChange={setCleanliness}
              />
            </>
          )}

          {/* ── 공통 루틴 (전 타입) ── */}
          <div className="border-t border-stone-100 mt-1">
            <p className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase pt-2.5 pb-0.5">
              ROUTINE
            </p>
            <RoutineCounter
              label={QUICK_LOG.COMMON.ROUTINE.HEAT.label}
              value={heatTime}
              placeholder={QUICK_LOG.COMMON.ROUTINE.HEAT.placeholder}
              min={QUICK_LOG.COMMON.ROUTINE.HEAT.min}
              max={QUICK_LOG.COMMON.ROUTINE.HEAT.max}
              unit={QUICK_LOG.COMMON.ROUTINE.HEAT.unit}
              onChange={setHeatTime}
            />
            <RoutineCounter
              label={QUICK_LOG.COMMON.ROUTINE.ICE.label}
              value={iceTime}
              placeholder={QUICK_LOG.COMMON.ROUTINE.ICE.placeholder}
              min={QUICK_LOG.COMMON.ROUTINE.ICE.min}
              max={QUICK_LOG.COMMON.ROUTINE.ICE.max}
              unit={QUICK_LOG.COMMON.ROUTINE.ICE.unit}
              onChange={setIceTime}
            />
            <RoutineCounter
              label={QUICK_LOG.COMMON.ROUTINE.PAUSE.label}
              value={pauseTime}
              placeholder={QUICK_LOG.COMMON.ROUTINE.PAUSE.placeholder}
              min={QUICK_LOG.COMMON.ROUTINE.PAUSE.min}
              max={QUICK_LOG.COMMON.ROUTINE.PAUSE.max}
              unit={QUICK_LOG.COMMON.ROUTINE.PAUSE.unit}
              onChange={setPauseTime}
            />
            <Counter
              label={QUICK_LOG.COMMON.ROUTINE.REPEAT.label}
              value={repeat}
              min={QUICK_LOG.COMMON.ROUTINE.REPEAT.min}
              max={QUICK_LOG.COMMON.ROUTINE.REPEAT.max}
              unit={QUICK_LOG.COMMON.ROUTINE.REPEAT.unit}
              onChange={setRepeat}
            />
          </div>

          {/* ── 공통: 또 갈래요 ── */}
          <div className="border-t border-stone-100 mt-1">
            <Slider
              label={QUICK_LOG.COMMON.REVISIT.label}
              value={revisit}
              min={QUICK_LOG.COMMON.REVISIT.min}
              max={QUICK_LOG.COMMON.REVISIT.max}
              steps={QUICK_LOG.COMMON.REVISIT.steps}
              onChange={setRevisit}
            />
          </div>
        </div>
      </main>

      {showBackConfirm && (
        <ConfirmModal
          message={editId
            ? '편집 내용이 저장되지 않습니다. 나가시겠습니까?'
            : '입력한 내용이 저장되지 않습니다. 나가시겠습니까?'}
          confirmLabel="나가기"
          cancelLabel="계속 입력"
          onConfirm={() => router.back()}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}
    </div>
  )
}
