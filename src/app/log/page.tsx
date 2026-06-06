'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Slider } from '@/components/slider'
import { useUser } from '@/contexts/user-context'
import type { BathGender, BathPolicy, TribeId } from '@/types'
import {
  BLOCK_TYPES,
  BLOCK_TYPE_MAP,
  TRIBE_DEFAULT_BLOCKS,
  BLOCK_CATEGORY_META,
  TRIBE_EMOJI_MAP,
  TRIBE_COLORS,
  TRIBE_IDS,
  QUICK_LOG,
  DEEP_LOG,
  PLACE_SPECS,
  type BlockCategory,
} from '@/constants/content'
import {
  insertLogWithBlocks,
  updateLogWithBlocks,
  type LogBlockInput,
  type LogSessionInput,
} from '@/lib/logs-service'
import { grantReward } from '@/lib/reward-service'
import { readEditSession, clearLogSessionAfterSave } from '@/lib/log-edit-session'
import { captureError } from '@/lib/error-logger'
import BottomCTA from '@/components/ui/bottom-cta'
import ErrorBanner from '@/components/ui/error-banner'
import ConfirmModal from '@/components/ui/confirm-modal'

// ── 앱 기존 토큰만 사용 (하드코딩 금지) ──
const T = {
  slot: 'var(--color-muted)',
  slot2: 'var(--color-border)',
  card: 'var(--color-card)',
  tint: 'var(--color-primary-light)',
  primary: 'var(--color-primary)',
  muted: 'var(--color-muted-fg)',
}

const QUALITY: Record<TribeId, { label: string; steps: { value: number; label: string }[] }> = {
  saunner: { label: QUICK_LOG.SAUNER.TOTONO.label, steps: QUICK_LOG.SAUNER.TOTONO.steps },
  bather: { label: QUICK_LOG.BATHER.WATER_QUALITY.label, steps: QUICK_LOG.BATHER.WATER_QUALITY.steps },
  jimi: { label: QUICK_LOG.JIMI.SWEAT_QUALITY.label, steps: QUICK_LOG.JIMI.SWEAT_QUALITY.steps },
}
const REVISIT_STEPS = QUICK_LOG.COMMON.REVISIT.steps
const CLEAN_STEPS = DEEP_LOG.CLEANLINESS.steps
const REST_STEPS = QUICK_LOG.JIMI.REST_QUALITY.steps
const SCRUB_STEPS = DEEP_LOG.SCRUB.satisfaction.steps
const STORE_STEPS = PLACE_SPECS.STORE.rating.steps // 맛없음/아쉬움/평범/맛있음/꿀맛집
const CATEGORY_ORDER: BlockCategory[] = ['heat', 'ice', 'rest', 'beyond']
const PRICE_BLOCKS = new Set(['scrub', 'massage'])
const MEMO_BLOCKS = new Set(['snack', 'restaurant'])
const REST_EVAL = new Set(['rest', 'outdoor-rest', 'indoor-rest', 'sleep-room'])
const DAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일']
const BATH_OPTIONS: { value: BathGender | null; label: string }[] = [
  { value: null, label: '자동' }, { value: 'male', label: '남탕' }, { value: 'female', label: '여탕' }, { value: 'mixed', label: '혼탕' }, { value: 'private', label: '개인' },
]
const bathLabel = (g: BathGender | null): string =>
  g == null ? '자동' : g.startsWith('male') || g === 'male' ? '남탕' : g.startsWith('female') || g === 'female' ? '여탕' : g.startsWith('mixed') ? '혼탕' : g.startsWith('private') ? '개인' : '자동'

interface Picked {
  catalogId: string
  temp: number | null
  durationSec: number | null
  score: number | null
  cost: number | null
  memo: string | null
  norepeat: boolean
}

function makePicked(catalogId: string): Picked {
  const d = BLOCK_TYPE_MAP[catalogId]
  const temp = d.tempRange ? Math.round((d.tempRange[0] + d.tempRange[1]) / 2) : null
  const durationSec = d.durUnit === 'sec' ? 30 : d.durUnit === 'min' ? 480 : null
  // 1회성 활동(beyond: 세신·마사지·매점·식당·수면)은 자동 반복 제외. 아우프구스는 사우나 사이클 일부라 반복 포함.
  return { catalogId, temp, durationSec, score: null, cost: null, memo: null, norepeat: d.category === 'beyond' && d.blockType !== 'aufguss' }
}

export default function LogPage() {
  const router = useRouter()
  const { primaryTribe, user } = useUser()

  // 장소
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [facilityType, setFacilityType] = useState<string | null>(null)
  const [bathPolicy, setBathPolicy] = useState<string | null>(null)
  const [bathOverride, setBathOverride] = useState<BathGender | null>(null)

  // 트라이브
  const [logType, setLogType] = useState<TribeId>(primaryTribe as TribeId)
  const [personaOpen, setPersonaOpen] = useState(false)

  // 블록
  const [picked, setPicked] = useState<Picked[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const [routineDetail, setRoutineDetail] = useState(false)
  const [primarySaunaKind, setPrimarySaunaKind] = useState<'dry' | 'steam' | null>(null)
  const [repeat, setRepeat] = useState(1)
  const dragFrom = useRef<number | null>(null)

  // 평가 (0 = 미선택)
  const [revisit, setRevisit] = useState(0)
  const [quality, setQuality] = useState(0)

  // 더자세히
  const [detailOpen, setDetailOpen] = useState(false)
  const [cleanliness, setCleanliness] = useState(0)
  const [companion, setCompanion] = useState<string | null>(null)
  const [crowd, setCrowd] = useState<string | null>(null)
  const [cost, setCost] = useState('')
  const [currency, setCurrency] = useState('KRW')
  const [memo, setMemo] = useState('')

  // 날짜·시간
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [recordDate, setRecordDate] = useState(todayStr)
  const [recordHour, setRecordHour] = useState<number | null>(now.getHours())
  const [showChange, setShowChange] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(todayStr)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  // 상태
  const [editId, setEditId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [showPlaceConfirm, setShowPlaceConfirm] = useState(false)

  const deriveBathGender = (ft: string | null, bp: string | null, g?: 'male' | 'female'): BathGender | null => {
    if (ft === 'private-sauna') return g === 'male' ? 'private_male' : g === 'female' ? 'private_female' : 'private'
    switch (bp as BathPolicy) {
      case 'male-only': return 'male'
      case 'female-only': return 'female'
      case 'mixed': return g === 'male' ? 'mixed_male' : g === 'female' ? 'mixed_female' : 'mixed'
      default: return g === 'male' ? 'male' : g === 'female' ? 'female' : null
    }
  }
  const effectiveBath = bathOverride ?? deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined)

  useEffect(() => {
    const presetDate = localStorage.getItem('selectedRecordDate')
    if (presetDate) { setRecordDate(presetDate); localStorage.removeItem('selectedRecordDate') }
    const { currentLog: log, selectedPlace: place } = readEditSession()
    if (place) {
      setPlaceName(place.name || '')
      if (place.id) setPlaceId(place.id)
      if (place.facilityType) setFacilityType(place.facilityType)
      if (place.bathPolicy) setBathPolicy(place.bathPolicy)
    } else if (!log) { router.replace('/place'); return }
    if (log) {
      if (log._editId) setEditId(log._editId)
      if (log.record_date) { setRecordDate(log.record_date.slice(0, 10)); setRecordHour(new Date(log.record_date).getHours()) }
      const tribe = (log.tribe_id as TribeId) || (primaryTribe as TribeId)
      if (log.tribe_id) setLogType(tribe)
      if (log.revisit_score) setRevisit(log.revisit_score)
      if (log.repeat) setRepeat(log.repeat)
      if (log.primary_sauna_kind) setPrimarySaunaKind(log.primary_sauna_kind)
      const q = tribe === 'saunner' ? log.totono_score : tribe === 'bather' ? log.water_quality : log.sweat_quality
      if (q) setQuality(q)
      if (log.cleanliness) setCleanliness(log.cleanliness)
      if (log.companion) setCompanion(log.companion)
      if (log.crowd) setCrowd(log.crowd)
      if (log.cost != null) setCost(String(log.cost))
      if (log.currency) setCurrency(log.currency)
      if (log.memo) setMemo(log.memo)
      if (log.blocks && log.blocks.length) {
        setRoutineDetail(true)
        setPicked(log.blocks.map(b => {
          let catalogId = b.block_type
          if (b.block_type === 'scrub' && b.variant === 'withmassage') catalogId = 'scrub-withmassage'
          if (!BLOCK_TYPE_MAP[catalogId]) catalogId = b.block_type
          return { catalogId, temp: b.temp ?? null, durationSec: b.duration_sec ?? null, score: b.score ?? null, cost: b.cost ?? null, memo: b.memo ?? null, norepeat: b.norepeat ?? false }
        }))
      }
    }
  }, [router, primaryTribe])

  const togglePick = (catalogId: string) => setPicked(prev => {
    const i = prev.findIndex(p => p.catalogId === catalogId)
    return i > -1 ? prev.filter((_, idx) => idx !== i) : [...prev, makePicked(catalogId)]
  })
  const isPicked = (catalogId: string) => picked.some(p => p.catalogId === catalogId)
  const seqOf = (catalogId: string) => picked.findIndex(p => p.catalogId === catalogId) + 1
  const updatePicked = (i: number, patch: Partial<Picked>) => setPicked(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  const handleDrop = (to: number) => {
    const from = dragFrom.current
    if (from == null || from === to) return
    setPicked(prev => { const arr = [...prev]; const [it] = arr.splice(from, 1); arr.splice(to > from ? to - 1 : to, 0, it); return arr })
    dragFrom.current = null
  }
  const bothSauna = isPicked('dry-sauna') && isPicked('steam-sauna')

  const buildRecordDate = () => recordHour !== null ? `${recordDate}T${String(recordHour).padStart(2, '0')}:00:00` : `${recordDate}T00:00:00`
  const buildSession = (): LogSessionInput => ({
    place_id: placeId as string,
    tribe_id: logType,
    record_date: buildRecordDate(),
    revisit_score: revisit,
    bath_gender: effectiveBath,
    primary_sauna_kind: bothSauna ? (primarySaunaKind ?? 'dry') : null,
    totono_score: logType === 'saunner' ? quality : null,
    water_quality: logType === 'bather' ? quality : null,
    sweat_quality: logType === 'jimi' ? quality : null,
    cleanliness: cleanliness || null,
    crowd, companion,
    cost: cost ? Number(cost) : null,
    currency: cost ? currency : null,
    memo: memo || null,
    repeat: picked.length > 1 ? repeat : null,
  })
  const buildBlocks = (): LogBlockInput[] => picked.map(p => {
    const d = BLOCK_TYPE_MAP[p.catalogId]
    return { blockType: d.blockType, category: d.category, variant: d.variant ?? null, temp: p.temp, durationSec: p.durationSec, score: p.score, cost: p.cost, memo: p.memo, norepeat: p.norepeat }
  })
  const handleSave = async () => {
    if (!placeId) { setSaveError('장소 정보가 없습니다.'); return }
    if (picked.length === 0) { setSaveError('활동을 하나 이상 선택해주세요.'); return }
    if (!revisit) { setSaveError('"또 갈래요?"를 입력해주세요.'); return }
    setIsSaving(true); setSaveError(null)
    try {
      const session = buildSession(); const blocks = buildBlocks()
      let logId: string
      if (editId) { await updateLogWithBlocks(editId, session, blocks); logId = editId }
      else {
        logId = await insertLogWithBlocks(session, blocks)
        const reward = await grantReward('short_log', { tribeId: logType })
        if (reward) localStorage.setItem('pendingReward', JSON.stringify(reward))
      }
      localStorage.setItem('savedLogId', logId)
      localStorage.setItem('isNewLog', editId ? 'false' : 'true')
      clearLogSessionAfterSave()
      router.push('/story')
    } catch (err) {
      captureError(err, { label: '로그 저장 실패(블록)' })
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally { setIsSaving(false) }
  }

  const cancelLog = () => { clearLogSessionAfterSave(); router.back() }
  const hasInput = picked.length > 0 || !!memo || !!cost || !!companion || !!crowd || cleanliness > 0
  const goReselectPlace = () => { if (hasInput) setShowPlaceConfirm(true); else router.push('/place') }

  const displayDate = recordDate.replace(/-/g, '.')
  const formatHour = (h: number) => h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`
  const displayTime = recordHour !== null ? formatHour(recordHour) : '미지정'
  const buildCalendarDays = () => {
    const { year, month } = calendarMonth
    const firstSun = new Date(year, month, 1).getDay()
    const firstDay = firstSun === 0 ? 6 : firstSun - 1
    const daysIn = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysIn; d++) days.push(d)
    return days
  }
  const calendarDays = buildCalendarDays()
  const monthLabel = `${calendarMonth.year}.${String(calendarMonth.month + 1).padStart(2, '0')}`
  const tribeColor = TRIBE_COLORS[logType]

  const BlockChip = ({ catalogId, small }: { catalogId: string; small?: boolean }) => {
    const d = BLOCK_TYPE_MAP[catalogId]
    const sel = isPicked(catalogId)
    const sz = small ? 46 : 54
    return (
      <button type="button" onClick={() => togglePick(catalogId)} className="flex flex-col items-center gap-1.5 shrink-0 relative" style={{ width: small ? 50 : undefined }}>
        {sel && <span className="absolute -top-1 right-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shadow z-10" style={{ background: T.card, color: T.primary }}>{seqOf(catalogId)}</span>}
        <span className="rounded-full flex items-center justify-center relative" style={{ width: sz, height: sz, background: sel ? T.primary : T.slot }}>
          {sel && <span className="absolute rounded-full pointer-events-none" style={{ inset: 5, border: `2px solid ${T.card}` }} />}
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: sel ? T.card : undefined }}>{d.icon}</span>
        </span>
        <span className="text-[11px] font-semibold" style={sel ? { color: T.primary } : undefined}>{d.label}</span>
      </button>
    )
  }
  return (
    <div className="min-h-dvh pb-28 bath-tile-bg">
      {/* 페르소나 밴드 */}
      <header className="px-5 pt-7 pb-4 text-white relative" style={{ background: tribeColor, borderRadius: '0 0 28px 28px' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setShowBackConfirm(true)} className="w-8 h-8 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
          <span className="font-semibold text-sm tracking-wide opacity-90">오늘의 사-첵</span>
          <span className="w-8" />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="text-[11px] tracking-widest opacity-85 font-semibold">LOGGING AS</div>
            <div className="text-2xl font-extrabold italic font-heading flex items-center gap-2">{logType.toUpperCase()} <span className="not-italic">{TRIBE_EMOJI_MAP[logType]}</span></div>
          </div>
          <button onClick={() => setPersonaOpen(o => !o)} className="text-[11px] font-bold rounded-full px-3 py-2 flex items-center gap-1 bg-white/25">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>swap_horiz</span>바꾸기
          </button>
        </div>
        {/* 트라이브 카드 (홈 TRIBE PICKS 비주얼 통일) */}
        {personaOpen && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {TRIBE_IDS.map(t => {
              const on = t === logType
              return (
                <button key={t} onClick={() => { setLogType(t as TribeId); setPersonaOpen(false); setQuality(0) }}
                  className="relative h-16 rounded-2xl overflow-hidden flex flex-col justify-end p-2.5 text-white transition-opacity shadow-lg"
                  style={{ background: TRIBE_COLORS[t], opacity: on ? 1 : 0.55 }}>
                  {on && <span className="absolute inset-0 rounded-2xl pointer-events-none z-20" style={{ border: `2.5px solid ${T.card}` }} />}
                  <span className="font-heading italic font-bold text-sm tracking-wide relative z-10">{t.toUpperCase()}</span>
                  <span className="absolute text-[40px] leading-none" style={{ right: -6, bottom: -8, transform: 'rotate(-8deg)' }}>{TRIBE_EMOJI_MAP[t]}</span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      <main className="px-5 pt-4 space-y-6">
        {/* 장소·날짜·시간·탕 요약 + 변경 */}
        <div className="rounded-2xl px-3.5 py-3" style={{ background: T.card }}>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.tint, color: T.primary }}><span className="material-symbols-outlined">location_on</span></span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] truncate text-stone-800">{placeName}</div>
              <div className="text-[11px] text-stone-500">{displayDate} · {displayTime} · {bathLabel(effectiveBath)}</div>
            </div>
            <button onClick={() => setShowChange(s => !s)} className="text-[11px] font-bold rounded-full px-3 py-1.5 text-stone-600" style={{ background: T.slot }}>변경</button>
          </div>

          {showChange && (
            <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${T.slot}` }}>
              <div className="flex items-center gap-2 text-xs relative">
                <button onClick={() => { setShowDatePicker(v => !v); setShowTimePicker(false) }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ background: T.slot }}><span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>{displayDate}</button>
                <button onClick={() => { setShowTimePicker(v => !v); setShowDatePicker(false) }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ background: T.slot }}><span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>{displayTime}</button>
                <select value={bathOverride ?? ''} onChange={e => setBathOverride((e.target.value || null) as BathGender | null)} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: T.slot }}>
                  {BATH_OPTIONS.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}{o.value === null ? `(${bathLabel(deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined))})` : ''}</option>)}
                </select>

                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 rounded-xl shadow-lg z-30 p-4 w-[280px]" style={{ background: T.card }}>
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalendarMonth(p => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center"><span className="material-symbols-outlined text-stone-400" style={{ fontSize: 18 }}>chevron_left</span></button>
                      <span className="text-sm font-semibold text-stone-700">{monthLabel}</span>
                      <button onClick={() => setCalendarMonth(p => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center"><span className="material-symbols-outlined text-stone-400" style={{ fontSize: 18 }}>chevron_right</span></button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">{DAY_HEADERS.map(d => <span key={d} className="text-[10px] text-stone-400 text-center font-medium">{d}</span>)}</div>
                    <div className="grid grid-cols-7 gap-y-1">
                      {calendarDays.map((day, i) => {
                        if (day === null) return <span key={`e-${i}`} />
                        const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const seld = dateStr === recordDate, isToday = dateStr === todayStr
                        return <button key={day} onClick={() => { setRecordDate(dateStr); setShowDatePicker(false) }} className={`w-8 h-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center ${seld ? 'text-white' : isToday ? 'font-bold text-stone-700 ring-1 ring-stone-300' : 'text-stone-600 hover:bg-stone-100'}`} style={seld ? { background: T.primary } : undefined}>{day}</button>
                      })}
                    </div>
                  </div>
                )}
                {showTimePicker && (
                  <div className="absolute top-full left-0 mt-2 rounded-xl shadow-lg z-30 p-4 w-[280px]" style={{ background: T.card }}>
                    <button onClick={() => { setRecordHour(null); setShowTimePicker(false) }} className={`w-full mb-3 py-2 rounded-lg text-xs font-medium ${recordHour === null ? 'text-white' : 'text-stone-500 bg-stone-50'}`} style={recordHour === null ? { background: T.primary } : undefined}>미지정</button>
                    <p className="text-[10px] text-stone-400 mb-1.5">오전</p>
                    <div className="grid grid-cols-6 gap-1.5 mb-3">{Array.from({ length: 12 }, (_, h) => <button key={h} onClick={() => { setRecordHour(h); setShowTimePicker(false) }} className={`py-1.5 rounded-lg text-[11px] font-medium ${recordHour === h ? 'text-white' : 'text-stone-600 bg-stone-50'}`} style={recordHour === h ? { background: T.primary } : undefined}>{h === 0 ? '12' : h}</button>)}</div>
                    <p className="text-[10px] text-stone-400 mb-1.5">오후</p>
                    <div className="grid grid-cols-6 gap-1.5">{Array.from({ length: 12 }, (_, i) => { const h = i + 12; return <button key={h} onClick={() => { setRecordHour(h); setShowTimePicker(false) }} className={`py-1.5 rounded-lg text-[11px] font-medium ${recordHour === h ? 'text-white' : 'text-stone-600 bg-stone-50'}`} style={recordHour === h ? { background: T.primary } : undefined}>{h === 12 ? '12' : h - 12}</button> })}</div>
                  </div>
                )}
              </div>
              <button onClick={goReselectPlace} className="text-xs font-bold flex items-center gap-1" style={{ color: T.primary }}><span className="material-symbols-outlined" style={{ fontSize: 15 }}>search</span>장소 다시 선택</button>
            </div>
          )}
        </div>

        {/* 블록 선택 */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-stone-800">오늘 뭐 했어요? <span className="text-[11px] font-normal text-stone-400">누른 순서가 루틴이 돼요</span></h2>
            <button onClick={() => setMoreOpen(o => !o)} className="text-xs font-bold flex items-center gap-0.5" style={{ color: T.primary }}>{moreOpen ? '접기' : '활동 전체보기'}<span className="material-symbols-outlined" style={{ fontSize: 16, transform: moreOpen ? 'rotate(180deg)' : undefined }}>expand_more</span></button>
          </div>
          {!moreOpen && <div className="flex justify-between">{TRIBE_DEFAULT_BLOCKS[logType].map(id => <BlockChip key={id} catalogId={id} />)}</div>}
          {moreOpen && (
            <div className="space-y-3">
              {CATEGORY_ORDER.map(cat => {
                const meta = BLOCK_CATEGORY_META[cat]
                const ids = BLOCK_TYPES.filter(b => b.category === cat).map(b => b.id)
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 w-11 shrink-0"><span className="material-symbols-outlined text-stone-500" style={{ fontSize: 18 }}>{meta.icon}</span><span className="text-[9px] font-bold text-stone-500">{meta.label}</span></div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">{ids.map(id => <BlockChip key={id} catalogId={id} small />)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 메인 사우나 */}
        {bothSauna && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-stone-700">{QUICK_LOG.SAUNER.PRIMARY_PROMPT}</span>
            {(['dry', 'steam'] as const).map(k => <button key={k} onClick={() => setPrimarySaunaKind(k)} className="px-3 py-1 rounded-full text-xs font-bold border text-stone-500" style={primarySaunaKind === k ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{k === 'dry' ? '건식' : '습식'}</button>)}
          </div>
        )}

        {/* 내 루틴 토글 + 요약 */}
        {picked.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5" style={{ background: routineDetail ? T.tint : T.slot }}>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                {!routineDetail
                  ? picked.map((p, i) => <span key={i} className="rounded-full px-2.5 py-1 text-xs font-bold text-stone-700" style={{ background: T.card }}>{BLOCK_TYPE_MAP[p.catalogId].label}</span>)
                  : <span className="text-[13px] font-extrabold" style={{ color: T.primary }}>루틴 <span className="text-[10px] font-medium text-stone-400">· 스탬프 드래그=순서 · 1회=반복제외</span></span>}
              </div>
              <button onClick={() => setRoutineDetail(v => !v)} className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold" style={routineDetail ? { color: T.primary } : undefined}>온도·시간 기록하기</span>
                <span className="w-10 h-6 rounded-full relative transition-colors" style={{ background: routineDetail ? T.primary : T.slot2 }}><span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: routineDetail ? 22 : 2, background: T.card }} /></span>
              </button>
            </div>

            {routineDetail && (
              <div className="flex flex-col gap-5 pt-1">
                {picked.map((p, i) => {
                  const d = BLOCK_TYPE_MAP[p.catalogId]
                  const evalSteps = REST_EVAL.has(d.blockType) ? REST_STEPS : (d.blockType === 'scrub' || d.blockType === 'massage') ? SCRUB_STEPS : MEMO_BLOCKS.has(d.blockType) ? STORE_STEPS : null
                  return (
                    <div key={i} className="grid items-center gap-3 relative" style={{ gridTemplateColumns: '46px 1fr 84px' }} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(i)}>
                      {/* 노드 + 라벨 + 연결선 */}
                      <div className="relative flex items-center justify-center" style={{ height: 44 }}>
                        {i < picked.length - 1 && <span className="absolute w-0.5" style={{ top: '50%', height: 'calc(100% + 20px)', left: '50%', transform: 'translateX(-50%)', background: T.slot2 }} />}
                        <span draggable onDragStart={() => { dragFrom.current = i }} onClick={() => updatePicked(i, { norepeat: !p.norepeat })} title="탭=반복 제외 / 드래그=순서" className="w-10 h-10 rounded-full flex items-center justify-center cursor-grab relative z-10" style={{ background: p.norepeat ? T.card : T.primary, border: p.norepeat ? `2px dashed ${T.slot2}` : undefined, color: p.norepeat ? T.muted : T.card }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{d.icon}</span>
                        </span>
                        <span className="absolute text-[10px] font-bold text-stone-700 whitespace-nowrap text-center z-10" style={{ top: 'calc(50% + 22px)', left: '50%', transform: 'translateX(-50%)', maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}{p.norepeat ? '·1회' : ''}</span>
                      </div>
                      {/* 온도 / 평가 / 플레인 */}
                      {d.tempRange
                        ? <Slider variant="stamp" label="" value={p.temp ?? d.tempRange[0]} min={d.tempRange[0]} max={d.tempRange[1]} unit="°C" steps={d.tempSteps ?? []} onChange={v => updatePicked(i, { temp: v })} />
                        : evalSteps
                          ? <Slider variant="seal" label="" value={p.score ?? 0} min={1} max={5} steps={evalSteps} onChange={v => updatePicked(i, { score: v })} />
                          : <div className="h-11 rounded-xl flex items-center px-3 text-[11px] font-semibold text-stone-400" style={{ background: T.slot }}>시간만 기록</div>}
                      {/* 시간 / 가격 / 메모 */}
                      {d.durUnit
                        ? <div className="flex items-center justify-center gap-1 h-11 rounded-xl" style={{ background: T.slot }}>
                            <button onClick={() => updatePicked(i, { durationSec: Math.max(0, (p.durationSec ?? 0) - (d.durUnit === 'sec' ? 10 : 60)) })} className="w-6 h-6 rounded-md text-sm" style={{ background: T.card }}>−</button>
                            <b className="text-[11px] text-stone-800 tabular-nums text-center" style={{ minWidth: 24 }}>{d.durUnit === 'sec' ? `${p.durationSec ?? 0}초` : `${Math.round((p.durationSec ?? 0) / 60)}분`}</b>
                            <button onClick={() => updatePicked(i, { durationSec: (p.durationSec ?? 0) + (d.durUnit === 'sec' ? 10 : 60) })} className="w-6 h-6 rounded-md text-sm" style={{ background: T.card }}>+</button>
                          </div>
                        : PRICE_BLOCKS.has(d.blockType)
                          ? <input inputMode="numeric" placeholder="₩" value={p.cost ?? ''} onChange={e => updatePicked(i, { cost: e.target.value ? Number(e.target.value) : null })} className="h-11 rounded-xl px-2 text-sm text-center w-full" style={{ background: T.slot }} />
                          : MEMO_BLOCKS.has(d.blockType)
                            ? <input placeholder="메뉴" value={p.memo ?? ''} onChange={e => updatePicked(i, { memo: e.target.value || null })} className="h-11 rounded-xl px-2.5 text-sm w-full" style={{ background: T.slot }} />
                            : <span />}
                    </div>
                  )
                })}
                {picked.length > 1 && (
                  <div className="flex items-center justify-center gap-3 text-sm font-semibold text-stone-500">
                    <span>반복</span>
                    <button onClick={() => setRepeat(r => Math.max(1, r - 1))} className="w-7 h-7 rounded-lg" style={{ background: T.card }}>−</button><b>{repeat}</b><button onClick={() => setRepeat(r => r + 1)} className="w-7 h-7 rounded-lg" style={{ background: T.card }}>+</button>
                    <span>세트</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 평가 */}
        <section className="space-y-4 rounded-2xl p-4" style={{ background: T.card }}>
          <Slider variant="seal" label={QUALITY[logType].label} value={quality} min={1} max={5} steps={QUALITY[logType].steps} onChange={setQuality} />
          <Slider variant="seal" label="또 갈래요?" value={revisit} min={1} max={5} steps={REVISIT_STEPS} onChange={setRevisit} />
        </section>

        {/* 더 자세히 */}
        <section>
          <button onClick={() => setDetailOpen(o => !o)} className="w-full flex items-center justify-center gap-1 text-sm font-semibold py-2 text-stone-500"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>{detailOpen ? 'expand_less' : 'expand_more'}</span>더 자세히 (청결·동행·입장료·메모)</button>
          {detailOpen && (
            <div className="space-y-4 rounded-2xl p-4" style={{ background: T.card }}>
              <Slider variant="seal" label="청결도" value={cleanliness} min={1} max={5} steps={CLEAN_STEPS} onChange={setCleanliness} />
              <div className="grid items-start gap-3" style={{ gridTemplateColumns: '62px 1fr' }}>
                <span className="text-xs font-bold text-stone-700 pt-1.5">동행</span>
                <div className="flex flex-wrap gap-2">{DEEP_LOG.COMPANION.options.map(o => <button key={o.id} onClick={() => setCompanion(companion === o.id ? null : o.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border text-stone-500" style={companion === o.id ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{o.label}</button>)}</div>
              </div>
              <div className="grid items-start gap-3" style={{ gridTemplateColumns: '62px 1fr' }}>
                <span className="text-xs font-bold text-stone-700 pt-1.5">혼잡도</span>
                <div className="flex flex-wrap gap-2">{DEEP_LOG.CROWD.options.map(o => <button key={o.id} onClick={() => setCrowd(crowd === o.id ? null : o.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border text-stone-500" style={crowd === o.id ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{o.label}</button>)}</div>
              </div>
              <div className="grid items-center gap-3" style={{ gridTemplateColumns: '62px 1fr' }}>
                <span className="text-xs font-bold text-stone-700">입장료</span>
                <div className="flex items-center gap-2">
                  <input inputMode="numeric" placeholder="금액" value={cost} onChange={e => setCost(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: T.slot }} />
                  <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-20 rounded-lg px-3 py-2 text-sm text-center" style={{ background: T.slot }} />
                </div>
              </div>
              <div className="grid items-start gap-3" style={{ gridTemplateColumns: '62px 1fr' }}>
                <span className="text-xs font-bold text-stone-700 pt-1.5">메모</span>
                <textarea placeholder="오늘의 한 줄 메모" value={memo} onChange={e => setMemo(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm h-16 resize-none" style={{ background: T.slot }} />
              </div>
            </div>
          )}
        </section>

        {saveError && <ErrorBanner message={saveError} />}
      </main>

      <BottomCTA onClick={() => { void handleSave() }} disabled={isSaving || picked.length === 0 || !revisit}>
        {isSaving ? '저장 중…' : editId ? '수정 완료' : '사-첵 완료'}
      </BottomCTA>

      {showBackConfirm && (
        <ConfirmModal
          message={editId ? '편집을 취소할까요?\n변경사항이 저장되지 않습니다.' : '기록을 취소할까요?\n입력한 내용이 사라집니다.'}
          onConfirm={cancelLog}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}
      {showPlaceConfirm && (
        <ConfirmModal
          message={'장소를 다시 선택하면\n입력한 내용이 사라져요.'}
          onConfirm={() => router.push('/place')}
          onCancel={() => setShowPlaceConfirm(false)}
        />
      )}
    </div>
  )
}
