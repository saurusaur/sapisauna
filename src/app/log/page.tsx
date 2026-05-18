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
import { readEditSession, clearLogSessionAfterSave } from '@/lib/log-edit-session'
import { safeParse } from '@/lib/utils'
import { captureError } from '@/lib/error-logger'
import type { TribeId } from '@/types'
import BottomCTA from '@/components/ui/bottom-cta'
import ErrorBanner from '@/components/ui/error-banner'

export default function QuickLog() {
  const router = useRouter()
  const { primaryTribe, user } = useUser()
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeCountryCode, setPlaceCountryCode] = useState<string | undefined>(undefined)
  const [facilityType, setFacilityType] = useState<string | null>(null)
  const [bathPolicy, setBathPolicy] = useState<string | null>(null)

  // bath_gender 자동 계산 (facility_type + bath_policy 기반)
  const deriveBathGender = (ft: string | null, bp: string | null, userGender?: 'male' | 'female'): BathGender | null => {
    // 개인 사우나는 bath_policy와 관계없이 private
    if (ft === 'private-sauna') {
      if (userGender === 'male') return 'private_male'
      if (userGender === 'female') return 'private_female'
      return 'private'
    }
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
  // 건식·습식 둘 다 입력 가능. 둘 다 있을 때 primarySaunaKind로 주 이용 명시.
  // 슬라이더는 단일이고 activeSaunaKind에 따라 그쪽 값을 편집.
  const [saunaTemp, setSaunaTemp] = useState<number | null>(null)
  const [steamSaunaTemp, setSteamSaunaTemp] = useState<number | null>(null)
  const [primarySaunaKind, setPrimarySaunaKind] = useState<'dry' | 'steam' | null>(null)
  const [activeSaunaKind, setActiveSaunaKind] = useState<'dry' | 'steam'>('dry')
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

    // 장소 정보 + 이전 입력 복원
    const { currentLog: log, selectedPlace: place } = readEditSession()

    if (place) {
      setPlaceName(place.name || '')
      if (place.id) setPlaceId(place.id)
      setPlaceCountryCode(place.countryCode)
      if (place.facilityType) setFacilityType(place.facilityType)
      if (place.bathPolicy) setBathPolicy(place.bathPolicy)
    } else if (!log) {
      // 편집 모드(currentLog 있음)가 아닌데 장소도 없으면 → 장소 선택으로
      router.replace('/place')
      return
    }

    if (log) {
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
      // 사우너 (사우나 종류별 복원)
      if (log.sauna_temp != null) setSaunaTemp(log.sauna_temp)
      if (log.steam_sauna_temp != null) setSteamSaunaTemp(log.steam_sauna_temp)
      if (log.primary_sauna_kind) {
        setPrimarySaunaKind(log.primary_sauna_kind)
        setActiveSaunaKind(log.primary_sauna_kind)
      }
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
  }, [router])

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
    bath_gender: deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined),
    record_date: buildRecordDate(),
    revisit_score: revisit,
    // 루틴 (입력된 경우만 포함)
    ...(heatTime !== null && { heat_time: heatTime }),
    ...(iceTime !== null && { ice_time: iceTime }),
    ...(pauseTime !== null && { pause_time: pauseTime }),
    ...(repeat !== null && { repeat }),
    // 타입별 데이터
    ...(logType === 'saunner' && {
      // 입력된 사우나만 포함 (null이면 컬럼 미설정 → DB에는 NULL)
      ...(saunaTemp != null && { sauna_temp: saunaTemp }),
      ...(steamSaunaTemp != null && { steam_sauna_temp: steamSaunaTemp }),
      ...(primarySaunaKind != null && { primary_sauna_kind: primarySaunaKind }),
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
    // 사우너: 사우나(건식 또는 습식) 최소 하나 필수
    if (logType === 'saunner' && saunaTemp == null && steamSaunaTemp == null) {
      setSaveError('사우나(건식 또는 습식) 중 하나는 입력해주세요.')
      return
    }
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
      clearLogSessionAfterSave()
      router.push('/story')
    } catch (err) {
      captureError(err, { label: '로그 저장 실패' })
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
          {editId ? '편집 취소' : '기록 취소'}
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
              {/* 사우나 종류 토글 (건식/습식) + 슬라이더 단일.
                  - active 토글: 슬라이더가 어느 종류 값을 편집하는지
                  - 입력된 쪽에 ✓ 표시 (주황=주 이용, 회색=보조)
                  - 둘 다 입력 시 "주 이용 사우나를 선택해주세요" 메시지
                  - × 클릭으로 그쪽 값 클리어 */}
              {(() => {
                const dryActive = activeSaunaKind === 'dry'
                const activeValue = dryActive ? saunaTemp : steamSaunaTemp
                const activeCfg = dryActive ? QUICK_LOG.SAUNER.SAUNA_TEMP : QUICK_LOG.SAUNER.STEAM_SAUNA_TEMP
                const activeDefault = dryActive ? 80 : 55
                const dryHas = saunaTemp != null
                const steamHas = steamSaunaTemp != null
                const bothEntered = dryHas && steamHas

                const setActiveValue = (v: number) => {
                  const wasEmpty = (dryActive ? saunaTemp : steamSaunaTemp) == null
                  if (dryActive) setSaunaTemp(v)
                  else setSteamSaunaTemp(v)
                  if (wasEmpty && primarySaunaKind == null) {
                    setPrimarySaunaKind(activeSaunaKind)
                  }
                }
                const clearKind = (kind: 'dry' | 'steam') => {
                  if (kind === 'dry') setSaunaTemp(null)
                  else setSteamSaunaTemp(null)
                  if (primarySaunaKind === kind) {
                    const otherHas = kind === 'dry' ? steamHas : dryHas
                    setPrimarySaunaKind(otherHas ? (kind === 'dry' ? 'steam' : 'dry') : null)
                  }
                }
                const setPrimary = (kind: 'dry' | 'steam') => {
                  const has = kind === 'dry' ? dryHas : steamHas
                  if (!has) return
                  setPrimarySaunaKind(kind)
                }

                const ToggleBtn = ({ kind, label }: { kind: 'dry' | 'steam'; label: string }) => {
                  const isActive = activeSaunaKind === kind
                  const has = kind === 'dry' ? dryHas : steamHas
                  const isPrimary = primarySaunaKind === kind
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveSaunaKind(kind)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isActive ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                      }`}
                    >
                      <span
                        onClick={(e) => { e.stopPropagation(); setPrimary(kind) }}
                        className="text-[11px] leading-none font-bold transition-colors"
                        style={{
                          visibility: has ? 'visible' : 'hidden',
                          color: isPrimary ? 'var(--color-primary)' : '#a8a29e',
                          cursor: bothEntered ? 'pointer' : 'default',
                        }}
                      >
                        ✓
                      </span>
                      {label}
                      <span
                        onClick={(e) => { e.stopPropagation(); clearKind(kind) }}
                        className="inline-flex items-center text-stone-400 hover:text-stone-600 cursor-pointer transition-colors leading-none"
                        style={{ visibility: has ? 'visible' : 'hidden' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </span>
                    </button>
                  )
                }

                return (
                  <div className="py-3 border-b border-stone-100">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-stone-700">사우나</span>
                      <div className="inline-flex bg-stone-200 rounded-md p-0.5">
                        <ToggleBtn kind="dry" label={QUICK_LOG.SAUNER.TOGGLE_DRY_LABEL} />
                        <ToggleBtn kind="steam" label={QUICK_LOG.SAUNER.TOGGLE_STEAM_LABEL} />
                      </div>
                      {bothEntered && (
                        <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>
                          {(() => {
                            const text = QUICK_LOG.SAUNER.PRIMARY_PROMPT
                            const idx = text.indexOf('선택')
                            if (idx < 0) return text
                            return (
                              <>
                                {text.slice(0, idx)}
                                <span className="font-bold">✓ </span>
                                {text.slice(idx)}
                              </>
                            )
                          })()}
                        </span>
                      )}
                    </div>
                    <Slider
                      label={activeCfg.label}
                      value={activeValue ?? activeDefault}
                      min={activeCfg.min}
                      max={activeCfg.max}
                      unit={activeCfg.unit}
                      steps={[...activeCfg.steps]}
                      onChange={setActiveValue}
                      inactive={activeValue == null}
                      onActivate={() => setActiveValue(activeDefault)}
                      showReset={activeValue != null}
                      onReset={() => clearKind(activeSaunaKind)}
                    />
                  </div>
                )
              })()}
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
              placeholder={QUICK_LOG.COMMON.ROUTINE.PLACEHOLDER_BY_TRIBE[logType]?.HEAT ?? QUICK_LOG.COMMON.ROUTINE.HEAT.placeholder}
              min={QUICK_LOG.COMMON.ROUTINE.HEAT.min}
              max={QUICK_LOG.COMMON.ROUTINE.HEAT.max}
              unit={QUICK_LOG.COMMON.ROUTINE.HEAT.unit}
              onChange={setHeatTime}
            />
            {logType !== 'jimi' && (
              <RoutineCounter
                label={QUICK_LOG.COMMON.ROUTINE.ICE.label}
                value={iceTime}
                placeholder={QUICK_LOG.COMMON.ROUTINE.PLACEHOLDER_BY_TRIBE[logType]?.ICE ?? QUICK_LOG.COMMON.ROUTINE.ICE.placeholder}
                min={QUICK_LOG.COMMON.ROUTINE.ICE.min}
                max={QUICK_LOG.COMMON.ROUTINE.ICE.max}
                step={QUICK_LOG.COMMON.ROUTINE.ICE.step}
                unit={QUICK_LOG.COMMON.ROUTINE.ICE.unit}
                onChange={setIceTime}
              />
            )}
            <RoutineCounter
              label={QUICK_LOG.COMMON.ROUTINE.PAUSE.label}
              value={pauseTime}
              placeholder={QUICK_LOG.COMMON.ROUTINE.PLACEHOLDER_BY_TRIBE[logType]?.PAUSE ?? QUICK_LOG.COMMON.ROUTINE.PAUSE.placeholder}
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

      <BottomCTA
        onClick={handleComplete}
        disabled={logType === 'saunner' && saunaTemp == null && steamSaunaTemp == null}
      >
        {logType === 'saunner' && saunaTemp == null && steamSaunaTemp == null
          ? '사우나 입력 필요'
          : '다음'}
      </BottomCTA>

      {/* 뒤로가기 확인 모달 */}
      {showBackConfirm && (
        <ConfirmModal
          message={editId
            ? '편집 내용이 저장되지 않습니다.\n나가시겠습니까?'
            : '입력한 내용이 저장되지 않습니다.\n나가시겠습니까?'}
          confirmLabel="나가기"
          cancelLabel="계속 입력"
          onConfirm={() => router.back()}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}

      {/* 분기 모달: 상세 기록 vs 바로 스토리 */}
      {showBranchModal && (
        <ConfirmModal onCancel={() => setShowBranchModal(false)}>
          <p className="text-sm font-semibold text-stone-700 text-center mb-6 whitespace-pre-line">
            {editId ? '수정 확인! 이대로 저장할까요?\n상세 정보도 수정 가능해요!' : '멋져요! 바로 카드로 만들어볼까요?\n오늘에 대해 더 알려주셔도 좋아요!'}
          </p>

          {saveError && <ErrorBanner message={saveError} variant="inline" />}

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
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.96] active:brightness-90 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              )}
              {editId ? '바로 새 기록 카드 생성' : '바로 기록 카드 생성'}
            </button>
          </div>
        </ConfirmModal>
      )}
    </div>
  )
}
