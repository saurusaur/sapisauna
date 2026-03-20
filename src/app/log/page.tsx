'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP, TRIBE_CATEGORY_MAP, TRIBE_PERSONA_MAP, TRIBE_IDS, QUICK_LOG } from '@/constants/content'
import { Slider, Counter, RoutineCounter } from '@/components/slider'
import { useUser } from '@/contexts/user-context'
import type { BathGender, BathPolicy } from '@/types'
import ConfirmModal from '@/components/ui/confirm-modal'
import { insertLog, updateLog } from '@/lib/logs-service'
import { grantReward } from '@/lib/reward-service'
import { safeParse } from '@/lib/utils'
import type { TribeId } from '@/types'
import BottomCTA from '@/components/ui/bottom-cta'

export default function QuickLog() {
  const router = useRouter()
  const { primaryTribe, user } = useUser()
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeCountryCode, setPlaceCountryCode] = useState<string | undefined>(undefined)
  const [bathPolicy, setBathPolicy] = useState<string | null>(null)

  // bath_gender 자동 계산 (bath_policy 기반)
  const deriveBathGender = (bp: string | null, userGender?: 'male' | 'female'): BathGender | null => {
    switch (bp as BathPolicy) {
      case 'male-only': return 'male'
      case 'female-only': return 'female'
      case 'mixed':
        if (userGender === 'male') return 'mixed_male'
        if (userGender === 'female') return 'mixed_female'
        return 'mixed'
      case 'gender-bath':
      default:
        if (userGender === 'male') return 'male'
        if (userGender === 'female') return 'female'
        return null
    }
  }
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
  const [jjimTemp, setJjimTemp] = useState(85)
  const [sweatQuality, setSweatQuality] = useState(3)
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
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // --- 방문 날짜·시간 ---
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [recordDate, setRecordDate] = useState(todayStr)
  const [recordHour, setRecordHour] = useState<number | null>(now.getHours())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)
  // 달력 네비용: 표시 중인 월
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(todayStr)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

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
      const place = safeParse<{ name?: string; id?: string; countryCode?: string; facilityType?: string; bathPolicy?: string } | null>(placeData, null)
      if (!place) return
      setPlaceName(place.name || '')
      if (place.id) setPlaceId(place.id)
      setPlaceCountryCode(place.countryCode)
      if (place.bathPolicy) setBathPolicy(place.bathPolicy)
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
        setRecordDate(log.record_date.slice(0, 10))
        setRecordHour(rd.getHours())
      }
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
      if (log.sweat_quality) setSweatQuality(log.sweat_quality)
      if (log.rest_quality) setRestQuality(log.rest_quality)
    }
  }, [])

  // 피커 바깥 클릭 닫기
  useEffect(() => {
    if (!showDatePicker && !showTimePicker) return
    const handleClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
        setShowTimePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDatePicker, showTimePicker])

  // record_date 생성: 날짜 + 시간(선택) → 로컬 시간 문자열 (TZ 변환 없음)
  const buildRecordDate = (): string => {
    if (recordHour !== null) {
      return `${recordDate}T${String(recordHour).padStart(2, '0')}:00:00`
    }
    return `${recordDate}T00:00:00`
  }

  // 폼 데이터 수집
  const buildLogData = () => ({
    ...(editId && { _editId: editId }),
    place_id: placeId,
    place_name: placeName,
    place_country_code: placeCountryCode,
    tribe_id: logType,
    bath_gender: deriveBathGender(bathPolicy, user?.gender ?? undefined),
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
      sweat_quality: sweatQuality,
      rest_quality: restQuality,
    }),
  })

  // 완료 버튼 → 분기 모달 열기
  const handleComplete = () => {
    const logData = buildLogData()
    // 기존 deep_log 보존 (편집 모드에서 히스토리가 넣어준 deep_log가 유실되지 않도록)
    const existing = safeParse<Record<string, unknown>>(localStorage.getItem('currentLog') || '{}', {})
    if (existing.deep_log) {
      (logData as Record<string, unknown>).deep_log = existing.deep_log
    }
    localStorage.setItem('currentLog', JSON.stringify(logData))
    setSaveError(null)
    setShowBranchModal(true)
  }

  // "바로 스토리로" → DB 저장 후 스토리 이동
  const handleDirectStory = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const logData = buildLogData()
      let logId: string

      if (editId) {
        await updateLog(editId, logData)
        logId = editId
      } else {
        logId = await insertLog(logData)
        // 새 기록 XP 지급
        const reward = await grantReward('short_log', { tribeId: logType })
        if (reward) {
          localStorage.setItem('pendingReward', JSON.stringify(reward))
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

  // "상세 기록 추가" → 딥로그 페이지로 이동 (localStorage는 이미 저장됨)
  const handleGoDeepLog = () => {
    setShowBranchModal(false)
    router.push('/log/deep')
  }

  // 날짜 표시 포맷: 2026.03.08
  const displayDate = recordDate.replace(/-/g, '.')

  // 시간 표시 포맷
  const formatHour = (h: number) =>
    h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`
  const displayTime = recordHour !== null ? formatHour(recordHour) : '미지정'

  // 달력 생성 헬퍼
  const buildCalendarDays = () => {
    const { year, month } = calendarMonth
    const firstDaySun = new Date(year, month, 1).getDay() // 0=일
    const firstDay = firstDaySun === 0 ? 6 : firstDaySun - 1 // 월=0 기준으로 변환
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }
  const calendarDays = buildCalendarDays()
  const monthLabel = `${calendarMonth.year}.${String(calendarMonth.month + 1).padStart(2, '0')}`
  const DAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <div className="min-h-dvh bath-tile-bg pb-24">
      {/* 헤더 — 장소명 크게 + 기록 취소 */}
      <header className="px-5 pt-8 pb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-stone-800">{placeName}</h1>
        <button
          onClick={() => setShowBackConfirm(true)}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          기록 취소
        </button>
      </header>

      <main className="px-5">
        {/* 방문 날짜·시간 — 인라인 커스텀 피커 */}
        <div className="relative mb-4" ref={datePickerRef}>
          <div className="flex items-center gap-1.5 text-stone-500">
            <button
              onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false) }}
              className="flex items-center gap-1 hover:text-stone-700 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>calendar_today</span>
              <span className="text-xs underline underline-offset-2 decoration-stone-300">{displayDate}</span>
            </button>
            <span className="text-stone-300 text-xs">·</span>
            <button
              onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false) }}
              className="flex items-center gap-1 hover:text-stone-700 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
              <span className="text-xs underline underline-offset-2 decoration-stone-300">{displayTime}</span>
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit_square</span>
          </div>

          {/* 날짜 피커 — 미니 달력 */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg z-30 p-4 w-[280px]">
              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month - 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })}
                  className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
                <span className="text-sm font-semibold text-stone-700">{monthLabel}</span>
                <button
                  onClick={() => setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month + 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })}
                  className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_HEADERS.map((d) => (
                  <span key={d} className="text-[10px] text-stone-400 text-center font-medium">{d}</span>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <span key={`e-${i}`} />
                  const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isSelected = dateStr === recordDate
                  const isToday = dateStr === todayStr
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setRecordDate(dateStr)
                        setShowDatePicker(false)
                      }}
                      className={`w-8 h-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-all ${
                        isSelected
                          ? 'text-white'
                          : isToday
                            ? 'font-bold text-stone-700 ring-1 ring-stone-300'
                            : 'text-stone-600 hover:bg-stone-100'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--color-primary)' } : undefined}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 시간 피커 — 칩 그리드 */}
          {showTimePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg z-30 p-4 w-[280px]">
              <p className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase mb-2.5">시간 선택</p>

              {/* 미지정 옵션 */}
              <button
                onClick={() => { setRecordHour(null); setShowTimePicker(false) }}
                className={`w-full mb-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  recordHour === null
                    ? 'text-white'
                    : 'text-stone-500 bg-stone-50 hover:bg-stone-100'
                }`}
                style={recordHour === null ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                미지정
              </button>

              {/* 오전 */}
              <p className="text-[10px] text-stone-400 mb-1.5">오전</p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {Array.from({ length: 12 }, (_, h) => (
                  <button
                    key={h}
                    onClick={() => { setRecordHour(h); setShowTimePicker(false) }}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      recordHour === h
                        ? 'text-white'
                        : 'text-stone-600 bg-stone-50 hover:bg-stone-100'
                    }`}
                    style={recordHour === h ? { backgroundColor: 'var(--color-primary)' } : undefined}
                  >
                    {h === 0 ? '12' : String(h)}
                  </button>
                ))}
              </div>

              {/* 오후 */}
              <p className="text-[10px] text-stone-400 mb-1.5">오후</p>
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => {
                  const h = i + 12
                  return (
                    <button
                      key={h}
                      onClick={() => { setRecordHour(h); setShowTimePicker(false) }}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        recordHour === h
                          ? 'text-white'
                          : 'text-stone-600 bg-stone-50 hover:bg-stone-100'
                      }`}
                      style={recordHour === h ? { backgroundColor: 'var(--color-primary)' } : undefined}
                    >
                      {h === 12 ? '12' : String(h - 12)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 타입 선택 — 인라인 드롭다운 */}
        <div className="relative mb-5">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            <span className="text-base">{TRIBE_EMOJI_MAP[logType]}</span>
            <span>{TRIBE_PERSONA_MAP[logType]}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>expand_more</span>
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg overflow-hidden z-10 min-w-[180px]">
              {([...TRIBE_IDS] as TribeId[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTribeId(type)
                    setShowTypeDropdown(false)
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-base">{TRIBE_EMOJI_MAP[type]}</span>
                    {TRIBE_PERSONA_MAP[type]}
                  </span>
                  {logType === type && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 입력 폼 — 카드 */}
        <div className="glass-card-light rounded-xl p-5">

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
                variant="chip"
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
                variant="chip"
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
                label={QUICK_LOG.JIMI.SWEAT_QUALITY.label}
                value={sweatQuality}
                min={QUICK_LOG.JIMI.SWEAT_QUALITY.min}
                max={QUICK_LOG.JIMI.SWEAT_QUALITY.max}
                steps={[...QUICK_LOG.JIMI.SWEAT_QUALITY.steps]}
                onChange={setSweatQuality}
                variant="chip"
              />
              <Slider
                label={QUICK_LOG.JIMI.REST_QUALITY.label}
                value={restQuality}
                min={QUICK_LOG.JIMI.REST_QUALITY.min}
                max={QUICK_LOG.JIMI.REST_QUALITY.max}
                steps={[...QUICK_LOG.JIMI.REST_QUALITY.steps]}
                onChange={setRestQuality}
                variant="chip"
              />
            </>
          )}

          {/* ── 공통 루틴 (전 타입) — 글래스 카드 ── */}
          <div className="mt-3 glass-card-light px-4 py-3">
            <p className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase pb-0.5">
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
            {logType !== 'jimi' && (
              <RoutineCounter
                label={QUICK_LOG.COMMON.ROUTINE.ICE.label}
                value={iceTime}
                placeholder={QUICK_LOG.COMMON.ROUTINE.ICE.placeholder}
                min={QUICK_LOG.COMMON.ROUTINE.ICE.min}
                max={QUICK_LOG.COMMON.ROUTINE.ICE.max}
                unit={QUICK_LOG.COMMON.ROUTINE.ICE.unit}
                onChange={setIceTime}
              />
            )}
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
          <div className="mt-1">
            <Slider
              label={QUICK_LOG.COMMON.REVISIT.label}
              value={revisit}
              min={QUICK_LOG.COMMON.REVISIT.min}
              max={QUICK_LOG.COMMON.REVISIT.max}
              steps={QUICK_LOG.COMMON.REVISIT.steps}
              onChange={setRevisit}
              variant="chip"
            />
          </div>
        </div>
      </main>

      <BottomCTA onClick={handleComplete}>다음</BottomCTA>

      {/* 뒤로가기 확인 모달 */}
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

      {/* 분기 모달: 상세 기록 vs 바로 스토리 */}
      {showBranchModal && (
        <ConfirmModal onCancel={() => setShowBranchModal(false)}>
          <p className="text-sm font-semibold text-stone-700 text-center mb-6">
            {editId ? '수정 완료!' : '기록 성공!'}
          </p>

          {saveError && (
            <p className="text-xs text-center mb-4" style={{ color: 'var(--color-accent)' }}>{saveError}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoDeepLog}
              disabled={isSaving}
              className="w-full py-3 rounded-xl text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
              {editId ? '상세 기록 편집하기' : '상세 기록 추가하기'}
            </button>
            <button
              onClick={handleDirectStory}
              disabled={isSaving}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all active:brightness-125 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              )}
              바로 기록 카드 생성
            </button>
          </div>
        </ConfirmModal>
      )}
    </div>
  )
}
