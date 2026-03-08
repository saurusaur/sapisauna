'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP, TRIBE_CATEGORY_MAP, TRIBE_IDS, QUICK_LOG } from '@/constants/content'
import { Slider, Counter, RoutineCounter } from '@/components/slider'
import { useUser } from '@/contexts/user-context'
import ConfirmModal from '@/components/ui/confirm-modal'
import { safeParse } from '@/lib/utils'
import type { TribeId } from '@/types'

export default function QuickLog() {
  const router = useRouter()
  const { primaryTribe } = useUser()
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeCountryCode, setPlaceCountryCode] = useState<string | undefined>(undefined)
  const [logType, setTribeId] = useState<TribeId>(primaryTribe as TribeId)
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
  const [restQuality, setRestQuality] = useState(3)

  // --- 공통 루틴 (null = 미입력/흐릿 상태) ---
  const [heatTime, setHeatTime] = useState<number | null>(null)
  const [iceTime, setIceTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [repeat, setRepeat] = useState<number | null>(primaryTribe === 'saunner' ? 3 : null)

  // --- 공통 ---
  const [revisit, setRevisit] = useState(3)

  // 편집 모드에서 기존 값 보존
  const [editId, setEditId] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [existingDeepLog, setExistingDeepLog] = useState<Record<string, unknown> | null>(null)

  // --- 방문 날짜·시간 ---
  const todayStr = new Date().toISOString().slice(0, 10)
  const [recordDate, setRecordDate] = useState(todayStr)
  const [recordHour, setRecordHour] = useState<number | null>(null) // null = 미지정

  useEffect(() => {
    // 달력에서 선택한 날짜 복원
    const presetDate = localStorage.getItem('selectedRecordDate')
    if (presetDate) {
      setRecordDate(presetDate)
      localStorage.removeItem('selectedRecordDate')
    }

    // 장소 정보 복원 — 없으면 장소 선택 페이지로 redirect
    const placeData = localStorage.getItem('selectedPlace')
    if (placeData) {
      const place = safeParse<{ name?: string; id?: string; countryCode?: string } | null>(placeData, null)
      if (!place) return
      setPlaceName(place.name || '')
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
      const log = safeParse(savedLog, null)
      if (!log) return
      // 편집 모드: 기존 값 보존
      if (log._editId) {
        setEditId(log._editId)
      }
      // record_date 복원
      if (log.record_date) {
        const rd = new Date(log.record_date)
        setRecordDate(rd.toISOString().slice(0, 10))
        setRecordHour(rd.getHours())
      }
      if (log.deep_log) setExistingDeepLog(log.deep_log)
      if (log.tribe_id) setTribeId(log.tribe_id as TribeId)
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
      if (log.jjim_temp) setJjimTemp(log.jjim_temp)
      if (log.rest_quality) setRestQuality(log.rest_quality)
    }
  }, [])

  // record_date 생성: 날짜 + 시간(선택) → ISO 문자열
  const buildRecordDate = (): string => {
    const date = new Date(recordDate + 'T00:00:00')
    if (recordHour !== null) date.setHours(recordHour)
    return date.toISOString()
  }

  // 저장 처리
  const handleSave = () => {
    const logData = {
      ...(editId && { _editId: editId }),
      place_id: placeId,
      place_name: placeName,
      place_country_code: placeCountryCode,
      tribe_id: logType,
      record_date: buildRecordDate(),
      revisit_score: revisit,
      // 루틴 (입력된 경우만 포함)
      ...(heatTime !== null && { heat_time: heatTime }),
      ...(iceTime !== null && { ice_time: iceTime }),
      ...(pauseTime !== null && { pause_time: pauseTime }),
      ...(repeat !== null && { repeat }),
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
        jjim_temp: jjimTemp,
        rest_quality: restQuality,
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
        {/* 방문 날짜·시간 */}
        <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 mb-4">
          <p className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase mb-1.5">방문일시</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '16px' }}>calendar_today</span>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="text-xs text-stone-700 bg-transparent border-none outline-none"
            />
            <span className="text-stone-200 text-xs">|</span>
            <select
              value={recordHour ?? ''}
              onChange={(e) => setRecordHour(e.target.value === '' ? null : Number(e.target.value))}
              className="text-xs text-stone-500 bg-transparent border-none outline-none appearance-none cursor-pointer"
            >
              <option value="">시간 미지정</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              {([...TRIBE_IDS] as TribeId[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTribeId(type)
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
              <Slider
                label={QUICK_LOG.JIMI.JJIM_TEMP.label}
                value={jjimTemp}
                min={QUICK_LOG.JIMI.JJIM_TEMP.min}
                max={QUICK_LOG.JIMI.JJIM_TEMP.max}
                unit={QUICK_LOG.JIMI.JJIM_TEMP.unit}
                steps={[...QUICK_LOG.JIMI.JJIM_TEMP.steps]}
                onChange={setJjimTemp}
              />
              <Slider
                label={QUICK_LOG.JIMI.REST_QUALITY.label}
                value={restQuality}
                min={QUICK_LOG.JIMI.REST_QUALITY.min}
                max={QUICK_LOG.JIMI.REST_QUALITY.max}
                steps={[...QUICK_LOG.JIMI.REST_QUALITY.steps]}
                onChange={setRestQuality}
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
            {/* 세트 수 — 사우너: 필수(Counter), 목욕파/찜질파: 옵셔널(RoutineCounter) */}
            {logType === 'saunner' ? (
              <Counter
                label={QUICK_LOG.COMMON.ROUTINE.REPEAT.label}
                value={repeat ?? 3}
                min={QUICK_LOG.COMMON.ROUTINE.REPEAT.min}
                max={QUICK_LOG.COMMON.ROUTINE.REPEAT.max}
                unit={QUICK_LOG.COMMON.ROUTINE.REPEAT.unit}
                onChange={setRepeat}
              />
            ) : (
              <RoutineCounter
                label={QUICK_LOG.COMMON.ROUTINE.REPEAT.label}
                value={repeat}
                placeholder={QUICK_LOG.COMMON.ROUTINE.REPEAT.min}
                min={QUICK_LOG.COMMON.ROUTINE.REPEAT.min}
                max={QUICK_LOG.COMMON.ROUTINE.REPEAT.max}
                unit={QUICK_LOG.COMMON.ROUTINE.REPEAT.unit}
                onChange={setRepeat}
              />
            )}
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
