'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import countryToCurrency from 'country-to-currency'
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
  type BlockCategory,
  type BlockTypeDef,
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
const SCRUB_STEPS = [{ value: 1, label: '별로' }, { value: 2, label: '아쉽' }, { value: 3, label: '만족' }, { value: 4, label: '시원' }, { value: 5, label: '극락' }]
const STORE_STEPS = [{ value: 1, label: '맛없' }, { value: 2, label: '아쉽' }, { value: 3, label: '평범' }, { value: 4, label: '맛남' }, { value: 5, label: '맛집' }]
const CATEGORY_ORDER: BlockCategory[] = ['heat', 'ice', 'rest', 'beyond']
// 온도 시설 등장 빈도 순(흔한 것 위로) — 활동 레인·시설온도 정렬용
const TEMP_ORDER: Record<string, number> = { 'hot-bath': 0, 'very-hot-bath': 1, 'cold-bath': 2, 'dry-sauna': 3, 'steam-sauna': 4, 'salt-sauna': 5, 'bulgama': 6, 'ice-bath': 7, 'open-air-bath': 8, 'ice-room': 9 }
const byTempOrder = (a: string, b: string) => (TEMP_ORDER[a] ?? 99) - (TEMP_ORDER[b] ?? 99)
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
  category?: string  // 'other' 블록의 사용자 선택 카테고리
}

function makePicked(catalogId: string): Picked {
  const d = BLOCK_TYPE_MAP[catalogId]
  // 온도·시간은 옵셔널 → 기본 미입력(null). 필요시 입력·초기화.
  // 1회성 활동(beyond: 세신·마사지·매점·식당·수면)은 자동 반복 제외. 아우프구스는 사우나 사이클 일부라 반복 포함.
  return { catalogId, temp: null, durationSec: null, score: null, cost: null, memo: null, norepeat: d.category === 'beyond' && d.blockType !== 'aufguss', category: d.blockType === 'other' ? 'beyond' : undefined }
}

// ＋시간 처음 누를 때의 블록별 기본 시작값 (8분 일괄 → 블록 특성 반영)
//  · heat(건식·온탕·한증막 등) 10분 · 냉탕/급냉 60초 · 아이스방 3분 · 휴식계열 7분
function defaultDurSec(d: BlockTypeDef): number {
  if (d.durUnit === 'sec') return 60
  if (d.id === 'ice-room') return 180
  if (d.category === 'rest') return 420
  return 600
}

export default function LogPage() {
  const router = useRouter()
  const { primaryTribe, user } = useUser()

  // 장소
  const [placeName, setPlaceName] = useState('장소')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeCountryCode, setPlaceCountryCode] = useState<string | undefined>(undefined)
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

  // 평가 (0 = 미선택)
  const [revisit, setRevisit] = useState(0)
  const [quality, setQuality] = useState(0)

  // 더자세히
  const [detailOpen, setDetailOpen] = useState(false)
  const [facTempOpen, setFacTempOpen] = useState(false)
  const [facTemps, setFacTemps] = useState<Record<string, number>>({})  // 루틴 외 시설 온도(온도만, temp-only 블록)
  const [cleanliness, setCleanliness] = useState(0)
  const [companion, setCompanion] = useState<string | null>(null)
  const [crowd, setCrowd] = useState<string | null>(null)
  const [cost, setCost] = useState('')
  const [currency, setCurrency] = useState('KRW')
  const [memo, setMemo] = useState('')
  // 통화 선택기 (자동감지 + 검색 드롭다운)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [currencySearch, setCurrencySearch] = useState('')
  const currencyRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const allCurrencies = useMemo(() => {
    const pinned = [...DEEP_LOG.COST.pinnedCurrencies] as string[]
    const rest = Array.from(new Set(Object.values(countryToCurrency as Record<string, string>))).filter(c => !pinned.includes(c)).sort()
    return { pinned, rest }
  }, [])
  // 순서변경 (포인터 드래그)
  const dragInfo = useRef<{ idx: number; x: number; y: number; moved: boolean } | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)  // 손가락 따라오는 고스트 위치

  // 날짜·시간
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [recordDate, setRecordDate] = useState(todayStr)
  const [recordHour, setRecordHour] = useState<number | null>(now.getHours())
  const [showChange, setShowChange] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showBathPicker, setShowBathPicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(todayStr)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  // 상태
  const [editId, setEditId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)

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
      setPlaceCountryCode(place.countryCode)
      const mapped = place.countryCode ? (countryToCurrency as Record<string, string>)[place.countryCode] : undefined
      if (mapped) setCurrency(mapped)
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

  // 통화 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!showCurrencyPicker) return
    const handle = (e: MouseEvent) => { if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) { setShowCurrencyPicker(false); setCurrencySearch('') } }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showCurrencyPicker])

  // 헤더 트라이브/변경 패널 — 영역 밖 클릭 시 자동 닫기
  useEffect(() => {
    if (!personaOpen && !showChange) return
    const handle = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setPersonaOpen(false); setShowChange(false); setShowDatePicker(false); setShowTimePicker(false); setShowBathPicker(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [personaOpen, showChange])

  const togglePick = (catalogId: string) => setPicked(prev => {
    const i = prev.findIndex(p => p.catalogId === catalogId)
    return i > -1 ? prev.filter((_, idx) => idx !== i) : [...prev, makePicked(catalogId)]
  })
  const isPicked = (catalogId: string) => picked.some(p => p.catalogId === catalogId)
  const seqOf = (catalogId: string) => picked.findIndex(p => p.catalogId === catalogId) + 1
  const updatePicked = (i: number, patch: Partial<Picked>) => setPicked(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  // 노드 포인터 드래그 = 순서변경(라이브 리오더: 손가락 위 행으로 즉시 이동). 이동 없으면 탭=반복제외. 모바일 터치 지원.
  const nodePointerDown = (i: number) => (e: React.PointerEvent) => {
    dragInfo.current = { idx: i, x: e.clientX, y: e.clientY, moved: false }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
    setDragIdx(i)
  }
  const nodePointerMove = (e: React.PointerEvent) => {
    const info = dragInfo.current; if (!info) return
    if (!info.moved && (Math.abs(e.clientY - info.y) > 6 || Math.abs(e.clientX - info.x) > 6)) info.moved = true
    if (!info.moved) return
    setDragPos({ x: e.clientX, y: e.clientY })  // 고스트가 손가락 따라옴
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-rrow]') as HTMLElement | null
    let target = el ? Number(el.dataset.rrow) : null
    if (target == null) {  // 마지막 행보다 아래면 맨 끝으로
      const last = document.querySelector(`[data-rrow="${picked.length - 1}"]`)
      if (last && e.clientY > last.getBoundingClientRect().bottom) target = picked.length - 1
    }
    // 손가락 위 행으로 즉시 이동(미리 이동된 상태로 보임). 이동 후 손가락은 그 항목 위 → 오실레이션 없음
    if (target != null && target !== info.idx) {
      const from = info.idx
      setPicked(prev => { const arr = [...prev]; const [it] = arr.splice(from, 1); arr.splice(target as number, 0, it); return arr })
      info.idx = target
      setDragIdx(target)
    }
  }
  const nodePointerUp = (i: number) => (e: React.PointerEvent) => {
    const info = dragInfo.current
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
    if (info && !info.moved) updatePicked(info.idx, { norepeat: !picked[info.idx].norepeat })
    dragInfo.current = null; setDragIdx(null); setDragPos(null)
  }
  const bothSauna = isPicked('dry-sauna') && isPicked('steam-sauna')
  // 주 이용 사우나 선택은 '온도를 둘 다 입력했을 때'만 의미 있음 → 그때만 노출·필수
  const needPrimary = bothSauna && picked.find(p => p.catalogId === 'dry-sauna')?.temp != null && picked.find(p => p.catalogId === 'steam-sauna')?.temp != null

  // 모바일: 입력창 포커스 시 키보드에 가리지 않도록 화면 가운데로 스크롤(키보드 애니메이션 후)
  const scrollIntoCenter = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
  }

  // 루틴 입력값(온도·시간·평가·가격·메모·세트) 한 번에 초기화 — 개별 × 대신
  const resetRoutine = () => {
    setPicked(prev => prev.map(p => ({ ...p, temp: null, durationSec: null, score: null, cost: null, memo: null })))
    setRepeat(1)
  }
  // 선택한 활동 전체 해제 ('오늘 뭐 했어요?' 초기화)
  const resetBlocks = () => { setPicked([]); setRepeat(1); setPrimarySaunaKind(null); setRoutineDetail(false) }

  // 리추얼 셀 — 온도·시간 옵셔널(미입력 시 ＋버튼, 입력 후 × 초기화)
  const tempCell = (i: number, d: BlockTypeDef, temp: number | null) => temp == null
    ? <button onClick={() => updatePicked(i, { temp: Math.round(((d.tempRange![0]) + (d.tempRange![1])) / 2) })} className="h-11 rounded-xl w-full flex items-center px-3 text-sm font-semibold text-stone-400 transition-transform active:scale-[0.97]" style={{ background: T.slot }}>＋ 온도</button>
    : <Slider variant="stamp" label="" value={temp} min={d.tempRange![0]} max={d.tempRange![1]} unit="°C" steps={d.tempSteps ?? []} onChange={v => updatePicked(i, { temp: v })} />
  const timeCell = (i: number, d: BlockTypeDef, dur: number | null) => {
    const unit = d.durUnit as 'min' | 'sec'
    return dur == null
    ? <button onClick={() => updatePicked(i, { durationSec: defaultDurSec(d) })} className="h-11 rounded-xl w-full flex items-center justify-center text-sm font-semibold text-stone-400 transition-transform active:scale-[0.97]" style={{ background: T.slot }}>＋시간</button>
    : <div className="flex items-center justify-between h-11">
        <button onClick={() => { const nv = dur - (unit === 'sec' ? 10 : 60); updatePicked(i, { durationSec: nv <= 0 ? null : nv }) }} className="w-7 h-7 rounded-full text-base shrink-0 transition-transform active:scale-90" style={{ background: T.slot }}>−</button>
        <b className="font-heading tabular-nums text-stone-800 whitespace-nowrap text-center flex-1 px-0.5"><span className="text-base">{unit === 'sec' ? dur : Math.round(dur / 60)}</span><span className="text-[11px] font-sans font-bold ml-px">{unit === 'sec' ? '초' : '분'}</span></b>
        <button onClick={() => updatePicked(i, { durationSec: dur + (unit === 'sec' ? 10 : 60) })} className="w-7 h-7 rounded-full text-base shrink-0 transition-transform active:scale-90" style={{ background: T.slot }}>＋</button>
      </div>
  }

  const buildRecordDate = () => recordHour !== null ? `${recordDate}T${String(recordHour).padStart(2, '0')}:00:00` : `${recordDate}T00:00:00`
  const buildSession = (): LogSessionInput => ({
    place_id: placeId as string,
    tribe_id: logType,
    record_date: buildRecordDate(),
    revisit_score: revisit,
    bath_gender: effectiveBath,
    primary_sauna_kind: bothSauna ? primarySaunaKind : null,
    totono_score: logType === 'saunner' ? quality : null,
    water_quality: logType === 'bather' ? quality : null,
    sweat_quality: logType === 'jimi' ? quality : null,
    cleanliness: cleanliness || null,
    crowd, companion,
    cost: cost ? Number(cost) : null,
    currency: cost ? currency : null,
    memo: memo || null,
    repeat: picked.length > 1 && picked.some(p => !p.norepeat) ? repeat : null,
  })
  const buildBlocks = (): LogBlockInput[] => {
    const main = picked.map(p => {
      const d = BLOCK_TYPE_MAP[p.catalogId]
      return { blockType: d.blockType, category: d.blockType === 'other' ? (p.category ?? 'beyond') : d.category, variant: d.variant ?? null, temp: p.temp, durationSec: p.durationSec, score: p.score, cost: p.cost, memo: p.memo, norepeat: p.norepeat }
    })
    // 시설 온도(더자세히): 루틴 외 시설을 temp-only·반복제외 블록으로 추가
    const fac: LogBlockInput[] = Object.entries(facTemps)
      .filter(([id]) => BLOCK_TYPE_MAP[id] && !isPicked(id))
      .map(([id, temp]) => {
        const d = BLOCK_TYPE_MAP[id]
        return { blockType: d.blockType, category: d.category, variant: d.variant ?? null, temp, durationSec: null, score: null, cost: null, memo: null, norepeat: true }
      })
    return [...main, ...fac]
  }
  const handleSave = async () => {
    if (!placeId) { setSaveError('장소 정보가 없습니다.'); return }
    if (picked.length === 0) { setSaveError('활동을 하나 이상 선택해주세요.'); return }
    if (needPrimary && !primarySaunaKind) { setSaveError('주로 이용한 사우나(건식/습식)를 선택해주세요.'); return }
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
      <button type="button" onClick={() => togglePick(catalogId)} className="flex flex-col items-center gap-1.5 shrink-0 relative transition-transform active:scale-90 px-0.5">
        {sel && <span className="absolute -top-1 right-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shadow z-10" style={{ background: T.card, color: T.primary }}>{seqOf(catalogId)}</span>}
        <span className={`rounded-full flex items-center justify-center relative ${sel ? 'shadow-md' : ''}`} style={{ width: sz, height: sz, background: sel ? T.primary : T.slot }}>
          {sel && <span className="absolute rounded-full pointer-events-none" style={{ inset: 5, border: `2px solid ${T.card}` }} />}
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: sel ? T.card : undefined }}>{d.icon}</span>
        </span>
        <span className="text-[11px] font-semibold whitespace-nowrap" style={sel ? { color: T.primary } : undefined}>{d.label}</span>
      </button>
    )
  }
  return (
    <div className="min-h-dvh pb-40 bath-tile-bg">
      {/* 페르소나 돔 — 트라이브 컬러 영역에 사우나명·시간·탕까지 중앙정렬 */}
      <header ref={headerRef} className="relative text-white text-center px-7 pt-14 pb-2" style={{ background: tribeColor }}>
        <button onClick={() => setShowBackConfirm(true)} className="absolute left-3 top-3 w-9 h-9 flex items-center justify-center z-10"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="text-[10px] tracking-[0.2em] font-bold opacity-85">LOGGING AS</div>

        {/* 트라이브명 + 바꾸기(스왑) */}
        <div className="inline-flex items-center justify-center gap-2 text-3xl font-extrabold italic font-heading mt-0.5">
          {logType.toUpperCase()} <span className="not-italic text-[26px]">{TRIBE_EMOJI_MAP[logType]}</span>
          <button onClick={() => setPersonaOpen(o => !o)} title="트라이브 바꾸기" className="not-italic w-7 h-7 rounded-full flex items-center justify-center bg-white/25 transition-transform active:scale-90"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_horiz</span></button>
        </div>

        {/* 트라이브 선택 — 컬러 영역 내 인라인 펼침/접힘 (별도 박스 X) */}
        <div className={`overflow-hidden transition-all duration-300 ${personaOpen ? 'max-h-44 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-3 gap-2">
            {TRIBE_IDS.map(t => {
              const on = t === logType
              return (
                <button key={t} onClick={() => { setLogType(t as TribeId); setPersonaOpen(false); setQuality(0) }}
                  className={`relative h-16 rounded-2xl overflow-hidden flex flex-col justify-end p-2.5 text-white transition-all active:scale-95 ${on ? 'shadow-lg' : ''}`}
                  style={{ background: TRIBE_COLORS[t], opacity: on ? 1 : 0.5 }}>
                  {on && <span className="absolute inset-0 rounded-2xl pointer-events-none z-20" style={{ border: '2.5px solid #fff' }} />}
                  <span className="font-heading italic font-bold text-sm tracking-wide relative z-10">{t.toUpperCase()}</span>
                  <span className="absolute text-[40px] leading-none" style={{ right: -6, bottom: -8, transform: 'rotate(-8deg)' }}>{TRIBE_EMOJI_MAP[t]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="font-bold text-xl mt-[21px] px-4 break-keep">{placeName}</div>

        {/* 메타 + 작은 연필 */}
        <div className="inline-flex items-center justify-center gap-1.5 mt-1.5">
          <span className="text-xs font-semibold opacity-90">{displayDate} · {displayTime} · {bathLabel(effectiveBath)}</span>
          <button onClick={() => setShowChange(s => !s)} title="날짜·시간·탕 변경" className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 transition-transform active:scale-90"><span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span></button>
        </div>

        {/* 날짜·시간·탕 — 컬러 영역 내 인라인 펼침/접힘 (반투명, 별도 박스 X) */}
        <div className={`overflow-hidden transition-all duration-300 ${showChange ? 'max-h-[440px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center justify-center gap-2 text-xs">
            <button onClick={() => { setShowDatePicker(v => !v); setShowTimePicker(false); setShowBathPicker(false) }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 bg-white/20 text-white transition-transform active:scale-95"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>{displayDate}</button>
            <button onClick={() => { setShowTimePicker(v => !v); setShowDatePicker(false); setShowBathPicker(false) }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 bg-white/20 text-white transition-transform active:scale-95"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>{displayTime}</button>
            <button onClick={() => { setShowBathPicker(v => !v); setShowDatePicker(false); setShowTimePicker(false) }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 bg-white/20 text-white transition-transform active:scale-95"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>wc</span>{bathLabel(effectiveBath)}<span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span></button>
          </div>

          {showDatePicker && (
            <div className="mt-3 mx-auto w-[252px]">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCalendarMonth(p => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-white/15"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                <span className="text-sm font-semibold">{monthLabel}</span>
                <button onClick={() => setCalendarMonth(p => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-white/15"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
              </div>
              <div className="grid grid-cols-7 mb-1">{DAY_HEADERS.map(d => <span key={d} className="text-[10px] text-white/60 text-center font-medium">{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <span key={`e-${i}`} />
                  const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const seld = dateStr === recordDate, isToday = dateStr === todayStr
                  return <button key={day} onClick={() => { setRecordDate(dateStr); setShowDatePicker(false) }} className={`w-7 h-7 mx-auto rounded-full text-xs font-medium flex items-center justify-center ${seld ? 'bg-white text-stone-800 font-bold' : isToday ? 'ring-1 ring-white/60 text-white' : 'text-white/85 active:bg-white/15'}`}>{day}</button>
                })}
              </div>
            </div>
          )}
          {showTimePicker && (
            <div className="mt-3 mx-auto w-[252px]">
              <button onClick={() => { setRecordHour(null); setShowTimePicker(false) }} className={`w-full mb-2 py-2 rounded-lg text-xs font-medium ${recordHour === null ? 'bg-white text-stone-800 font-bold' : 'text-white/80 bg-white/10'}`}>미지정</button>
              <p className="text-[10px] text-white/60 mb-1.5 text-left">오전</p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">{Array.from({ length: 12 }, (_, h) => <button key={h} onClick={() => { setRecordHour(h); setShowTimePicker(false) }} className={`py-1.5 rounded-lg text-[11px] font-medium ${recordHour === h ? 'bg-white text-stone-800 font-bold' : 'text-white/85 bg-white/10'}`}>{h === 0 ? '12' : h}</button>)}</div>
              <p className="text-[10px] text-white/60 mb-1.5 text-left">오후</p>
              <div className="grid grid-cols-6 gap-1.5">{Array.from({ length: 12 }, (_, i) => { const h = i + 12; return <button key={h} onClick={() => { setRecordHour(h); setShowTimePicker(false) }} className={`py-1.5 rounded-lg text-[11px] font-medium ${recordHour === h ? 'bg-white text-stone-800 font-bold' : 'text-white/85 bg-white/10'}`}>{h === 12 ? '12' : h - 12}</button> })}</div>
            </div>
          )}
          {showBathPicker && (() => {
            const autoVal = deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined)
            // 자동값과 중복되는 명시 옵션은 숨김(자동에 이미 그 값이 표시됨)
            const opts = BATH_OPTIONS.filter(o => o.value === null || o.value !== autoVal)
            return (
              <div className="mt-3 mx-auto w-[252px] grid grid-cols-3 gap-1.5">
                {opts.map(o => {
                  const sel = (bathOverride ?? null) === o.value
                  const autoSuffix = o.value === null ? `(${bathLabel(autoVal)})` : ''
                  return <button key={o.label} onClick={() => { setBathOverride(o.value); setShowBathPicker(false) }} className={`py-1.5 rounded-lg text-[11px] font-medium ${sel ? 'bg-white text-stone-800 font-bold' : 'text-white/85 bg-white/10'}`}>{o.label}{autoSuffix}</button>
                })}
              </div>
            )
          })()}
        </div>
        {/* 바닥 곡선 — 홈 상단과 동일(가운데가 볼록한 타원 느낌) */}
        <svg viewBox="0 0 393 24" preserveAspectRatio="none" className="absolute left-0 right-0 w-full h-[24px] pointer-events-none" style={{ top: '100%', marginTop: -1 }} aria-hidden>
          <path d="M0,0 H393 V8 C300,21 110,21 0,11 Z" fill={tribeColor} />
        </svg>
      </header>

      <main className="px-5 pt-[54px] space-y-10">
        {/* 블록 선택 */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-stone-800">오늘 어떻게 즐겼나요?</h2>
            <div className="flex items-center gap-2 shrink-0">
              {picked.length > 0 && <button onClick={resetBlocks} className="flex items-center gap-0.5 text-[11px] font-bold text-stone-500 rounded-full px-2 py-0.5 transition-transform active:scale-95" style={{ background: T.slot }}><span className="material-symbols-outlined" style={{ fontSize: 13 }}>restart_alt</span>초기화</button>}
              <button onClick={() => setMoreOpen(o => !o)} className="text-xs font-bold flex items-center gap-0.5" style={{ color: T.primary }}>{moreOpen ? '접기' : '활동 전체보기'}<span className="material-symbols-outlined" style={{ fontSize: 16, transform: moreOpen ? 'rotate(180deg)' : undefined }}>expand_more</span></button>
            </div>
          </div>
          {!moreOpen && <div className="flex justify-between">{TRIBE_DEFAULT_BLOCKS[logType].map(id => <BlockChip key={id} catalogId={id} />)}</div>}
          {moreOpen && (
            <div className="space-y-2.5">
              {CATEGORY_ORDER.map(cat => {
                const meta = BLOCK_CATEGORY_META[cat]
                const ids = BLOCK_TYPES.filter(b => b.category === cat).map(b => b.id).sort(byTempOrder)
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 w-11 shrink-0"><span className="material-symbols-outlined text-stone-500" style={{ fontSize: 18 }}>{meta.icon}</span><span className="text-[9px] font-bold text-stone-500">{meta.label}</span></div>
                    <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto no-scrollbar py-1 pr-1" style={{ WebkitMaskImage: 'linear-gradient(to right, #000 72%, transparent)', maskImage: 'linear-gradient(to right, #000 72%, transparent)' }}>{ids.map(id => <BlockChip key={id} catalogId={id} small />)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 내 루틴 토글 + 요약 */}
        {picked.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5" style={{ background: routineDetail ? T.card : T.slot }}>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center min-w-0">
                {!routineDetail
                  ? picked.map((p, i) => <span key={i} className="rounded-full px-2.5 py-1 text-xs font-bold text-stone-700" style={{ background: T.card }}>{BLOCK_TYPE_MAP[p.catalogId].label}</span>)
                  : <span className="text-[11px] font-bold" style={{ color: T.primary }}>오늘의 루틴을 기록해보세요</span>}
              </div>
              <button onClick={() => setRoutineDetail(v => !v)} className="flex items-center gap-2 shrink-0 transition-transform active:scale-95">
                <span className="text-[11px] font-bold" style={routineDetail ? { color: T.primary } : undefined}>온도·시간 기록하기</span>
                <span className="w-10 h-6 rounded-full relative transition-colors" style={{ background: routineDetail ? T.primary : T.slot2 }}><span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: routineDetail ? 22 : 2, background: T.card }} /></span>
              </button>
            </div>

            {routineDetail && (
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500">드래그로 순서 변경</span>
                  <button onClick={resetRoutine} className="flex items-center gap-0.5 text-[11px] font-bold text-stone-500 rounded-full px-2 py-0.5 transition-transform active:scale-95" style={{ background: T.slot }}><span className="material-symbols-outlined" style={{ fontSize: 13 }}>restart_alt</span>초기화</button>
                </div>
                {picked.map((p, i) => {
                  const d = BLOCK_TYPE_MAP[p.catalogId]
                  const evalSteps = REST_EVAL.has(d.blockType) ? REST_STEPS : (d.blockType === 'scrub' || d.blockType === 'massage') ? SCRUB_STEPS : MEMO_BLOCKS.has(d.blockType) ? STORE_STEPS : null
                  const isOther = d.blockType === 'other'
                  return (
                    <div key={i} data-rrow={i} className={`grid items-center gap-2 relative transition-opacity ${dragIdx === i ? 'opacity-40' : ''}`} style={{ gridTemplateColumns: '52px 1fr 86px' }}>
                      {/* 노드(아이콘+한글 라벨 내부) + 연결선(진한 빨강) */}
                      <div className="relative flex items-center justify-center" style={{ height: 44 }}>
                        {i < picked.length - 1 && <span className="absolute" style={{ width: 4, top: '100%', height: 10, left: '50%', transform: 'translateX(-50%)', borderRadius: 2, background: T.primary }} />}
                        <span onPointerDown={nodePointerDown(i)} onPointerMove={nodePointerMove} onPointerUp={nodePointerUp(i)} title="탭=1회 / 끌어서 순서" className={`w-11 h-11 rounded-full flex flex-col items-center justify-center cursor-grab relative z-10 touch-none select-none transition-transform active:scale-95 ${p.norepeat ? '' : 'shadow-md'}`} style={{ background: p.norepeat ? T.card : T.primary, border: p.norepeat ? `2px dashed ${T.slot2}` : undefined, color: p.norepeat ? T.muted : T.card }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{d.icon}</span>
                          <span className="text-[9px] font-bold leading-none mt-0.5 px-0.5 text-center" style={{ maxWidth: 46 }}>{d.label}</span>
                        </span>
                      </div>
                      {/* 미들: 기타=카테고리+메모 / 온도 / 평가 / 플레인 */}
                      {isOther
                        ? <div className="flex gap-1.5 items-center min-w-0">
                            <select value={p.category ?? 'beyond'} onChange={e => updatePicked(i, { category: e.target.value })} className="h-11 rounded-xl pl-2 pr-0.5 text-[11px] font-semibold w-[68px] shrink-0" style={{ background: T.slot }}>
                              <option value="heat">HEAT</option><option value="ice">ICE</option><option value="rest">PAUSE</option><option value="beyond">BEYOND</option>
                            </select>
                            <input placeholder="뭐 했어요?" value={p.memo ?? ''} onFocus={scrollIntoCenter} onChange={e => updatePicked(i, { memo: e.target.value || null })} className="h-11 rounded-xl px-2.5 text-sm flex-1 min-w-0" style={{ background: T.slot }} />
                          </div>
                        : d.tempRange
                          ? tempCell(i, d, p.temp)
                          : evalSteps
                            ? <Slider variant="seal" label="" value={p.score ?? 0} min={1} max={5} steps={evalSteps} onChange={v => updatePicked(i, { score: v })} />
                            : <div className="h-11 rounded-xl flex items-center px-3 text-sm font-semibold text-stone-400" style={{ background: T.slot }}>기록</div>}
                      {/* 오른쪽: 시간 / 가격 / 메모 */}
                      {d.durUnit
                        ? timeCell(i, d, p.durationSec)
                        : PRICE_BLOCKS.has(d.blockType)
                          ? <input inputMode="numeric" placeholder="₩" value={p.cost ?? ''} onFocus={scrollIntoCenter} onChange={e => updatePicked(i, { cost: e.target.value ? Number(e.target.value) : null })} className="h-11 rounded-xl px-2 text-sm text-center w-full" style={{ background: T.slot }} />
                          : MEMO_BLOCKS.has(d.blockType)
                            ? <input placeholder="추천메뉴" value={p.memo ?? ''} onFocus={scrollIntoCenter} onChange={e => updatePicked(i, { memo: e.target.value || null })} className="h-11 rounded-xl px-2 text-sm text-center w-full" style={{ background: T.slot }} />
                            : <span />}
                    </div>
                  )
                })}
                {/* 반복 세트 행 — 위 리추얼과 동일한 빨강 노드('반복', 이동 불가) + 같은 줄 세트 카운터 + 오른쪽 조작 범례 */}
                {picked.length > 1 && picked.some(p => !p.norepeat) && (
                  <div className="grid items-center gap-2 mt-1 pt-4" style={{ gridTemplateColumns: '52px 1fr', borderTop: `1px dashed ${T.slot2}` }}>
                    <div className="relative flex items-center justify-center" style={{ height: 44 }}>
                      <span className="w-11 h-11 rounded-full flex flex-col items-center justify-center shadow-md relative z-10" style={{ background: T.primary, color: T.card }}><span className="material-symbols-outlined" style={{ fontSize: 17 }}>repeat</span><span className="text-[9px] font-bold leading-none mt-0.5">루틴</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setRepeat(r => Math.max(1, r - 1))} className="w-7 h-7 rounded-full text-base transition-transform active:scale-90" style={{ background: T.slot }}>−</button>
                        <span className="text-lg font-bold font-heading tabular-nums" style={{ color: T.primary, minWidth: 20, textAlign: 'center' }}>{repeat}</span>
                        <button onClick={() => setRepeat(r => r + 1)} className="w-7 h-7 rounded-full text-base transition-transform active:scale-90" style={{ background: T.slot }}>＋</button>
                        <span className="text-xs font-bold text-stone-500">세트</span>
                      </div>
                      {/* 조작 범례(가이드) — 얇은 테두리 박스 */}
                      <div className="flex items-center gap-1 shrink-0 rounded-xl border border-stone-300 px-2 py-1">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: T.primary, color: T.card }}>루틴</span>
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-xs font-bold text-stone-500">탭</span>
                          <span className="material-symbols-outlined text-stone-600" style={{ fontSize: 18 }}>swap_horiz</span>
                        </div>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-500 border-2 border-dashed border-stone-400 shrink-0">1회</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* 주 이용 사우나 — 건식·습식 온도 둘 다 입력했을 때만(필수) */}
                {needPrimary && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[13px] font-bold text-stone-700">{QUICK_LOG.SAUNER.PRIMARY_PROMPT}</span>
                    {(['dry', 'steam'] as const).map(k => <button key={k} onClick={() => setPrimarySaunaKind(k)} className={`px-3 py-1 rounded-full text-xs font-bold border text-stone-500 transition-transform active:scale-95 ${primarySaunaKind === k ? 'shadow-md' : ''}`} style={primarySaunaKind === k ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{k === 'dry' ? '건식' : '습식'}</button>)}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 평가 */}
        <section className="space-y-2.5 rounded-2xl p-4" style={{ background: T.card }}>
          <Slider variant="seal" label={QUALITY[logType].label} value={quality} min={1} max={5} steps={QUALITY[logType].steps} onChange={setQuality} />
          <Slider variant="seal" label="또 갈래요?" value={revisit} min={1} max={5} steps={REVISIT_STEPS} onChange={setRevisit} />
          <div className="grid items-start gap-3" style={{ gridTemplateColumns: '60px 1fr' }}>
            <span className="text-[13px] font-bold text-stone-700 pt-1.5">메모</span>
            <textarea placeholder="오늘 사우나는 어떠셨나요?" value={memo} onFocus={scrollIntoCenter} onChange={e => setMemo(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm h-16 resize-none" style={{ background: T.slot }} />
          </div>
        </section>

        {/* 더 자세히 */}
        <section>
          <button onClick={() => setDetailOpen(o => !o)} className="w-full flex items-center justify-center gap-1 text-sm font-semibold py-2 text-stone-500"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>{detailOpen ? 'expand_less' : 'expand_more'}</span>(선택) 더 자세히 기록하실래요?</button>
          {detailOpen && (
            <div className="space-y-2.5 rounded-2xl p-4" style={{ background: T.card }}>
              <Slider variant="seal" label="청결도" value={cleanliness} min={1} max={5} steps={CLEAN_STEPS} onChange={setCleanliness} />
              <div className="grid items-center gap-3" style={{ gridTemplateColumns: '60px 1fr' }}>
                <span className="text-[13px] font-bold text-stone-700">동행</span>
                <div className="flex flex-wrap gap-2">{DEEP_LOG.COMPANION.options.map(o => <button key={o.id} onClick={() => setCompanion(companion === o.id ? null : o.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border text-stone-500 transition-transform active:scale-95 ${companion === o.id ? 'shadow-md' : ''}`} style={companion === o.id ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{o.label}</button>)}</div>
              </div>
              <div className="grid items-center gap-3" style={{ gridTemplateColumns: '60px 1fr' }}>
                <span className="text-[13px] font-bold text-stone-700">혼잡도</span>
                <div className="flex flex-wrap gap-2">{DEEP_LOG.CROWD.options.map(o => <button key={o.id} onClick={() => setCrowd(crowd === o.id ? null : o.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border text-stone-500 transition-transform active:scale-95 ${crowd === o.id ? 'shadow-md' : ''}`} style={crowd === o.id ? { background: T.primary, color: T.card, borderColor: 'transparent' } : { borderColor: T.slot2 }}>{o.label}</button>)}</div>
              </div>
              <div className="grid items-center gap-3" style={{ gridTemplateColumns: '60px 1fr' }}>
                <span className="text-[13px] font-bold text-stone-700">입장료</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0" ref={currencyRef}>
                    <button onClick={() => { setShowCurrencyPicker(v => !v); setCurrencySearch('') }} className="rounded-lg px-2.5 py-1.5 flex items-center gap-0.5 text-sm font-semibold text-stone-700 transition-transform active:scale-95" style={{ background: T.slot }}>
                      {currency}<span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>expand_more</span>
                    </button>
                    {showCurrencyPicker && (
                      <div className="absolute bottom-full left-0 mb-1.5 rounded-xl shadow-lg z-50 w-[180px] overflow-hidden" style={{ background: T.card }}>
                        <div className="p-2 border-b border-stone-100">
                          <input value={currencySearch} onChange={e => setCurrencySearch(e.target.value.toUpperCase())} placeholder="통화 검색…" autoFocus className="w-full px-3 py-2 text-xs rounded-lg bg-stone-50 focus:outline-none text-stone-700" />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {allCurrencies.pinned.filter(c => !currencySearch || c.includes(currencySearch)).map(c => (
                            <button key={c} onClick={() => { setCurrency(c); setShowCurrencyPicker(false); setCurrencySearch('') }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 ${currency === c ? 'font-bold' : 'text-stone-600'}`} style={currency === c ? { color: T.primary } : undefined}>{c}</button>
                          ))}
                          {!currencySearch && <div className="border-t border-stone-100" />}
                          {allCurrencies.rest.filter(c => !currencySearch || c.includes(currencySearch)).map(c => (
                            <button key={c} onClick={() => { setCurrency(c); setShowCurrencyPicker(false); setCurrencySearch('') }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 ${currency === c ? 'font-bold' : 'text-stone-600'}`} style={currency === c ? { color: T.primary } : undefined}>{c}</button>
                          ))}
                          {currencySearch && allCurrencies.pinned.filter(c => c.includes(currencySearch)).length === 0 && allCurrencies.rest.filter(c => c.includes(currencySearch)).length === 0 && <p className="px-4 py-3 text-xs text-stone-400 text-center">결과 없음</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <input inputMode="numeric" placeholder="금액" value={cost} onFocus={scrollIntoCenter} onChange={e => setCost(e.target.value.replace(/[^0-9]/g, ''))} className="flex-1 min-w-0 rounded-lg px-3 py-1.5 text-sm text-right" style={{ background: T.slot }} />
                </div>
              </div>

              {/* 시설 온도 (선택) — 루틴에 온도 입력 안 한 시설만, 온도만 기록 */}
              <div className="pt-1" style={{ borderTop: `1px solid ${T.slot}` }}>
                <button onClick={() => setFacTempOpen(o => !o)} className="w-full flex items-center justify-center gap-1 text-xs font-bold text-stone-500 pt-3"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>{facTempOpen ? 'expand_less' : 'expand_more'}</span>시설 온도 추가</button>
                {facTempOpen && (
                  <div className="mt-2.5 space-y-2.5">
                    {BLOCK_TYPES.filter(b => b.tempRange && !isPicked(b.id)).sort((a, b) => byTempOrder(a.id, b.id)).map(b => {
                      const t = facTemps[b.id] ?? null
                      return (
                        <div key={b.id} className="grid items-center gap-3" style={{ gridTemplateColumns: '60px 1fr 24px' }}>
                          <span className="text-[13px] font-bold text-stone-700">{b.label}</span>
                          {t == null
                            ? <button onClick={() => setFacTemps(m => ({ ...m, [b.id]: Math.round((b.tempRange![0] + b.tempRange![1]) / 2) }))} className="h-11 rounded-xl w-full flex items-center px-3 text-sm font-semibold text-stone-400 transition-transform active:scale-[0.97]" style={{ background: T.slot }}>＋ 온도</button>
                            : <Slider variant="stamp" label="" value={t} min={b.tempRange![0]} max={b.tempRange![1]} unit="°C" steps={b.tempSteps ?? []} onChange={v => setFacTemps(m => ({ ...m, [b.id]: v }))} />}
                          {t != null
                            ? <button onClick={() => setFacTemps(m => { const n = { ...m }; delete n[b.id]; return n })} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.slot }}><span className="material-symbols-outlined text-stone-500" style={{ fontSize: 13 }}>close</span></button>
                            : <span />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {saveError && <ErrorBanner message={saveError} />}
      </main>

      {/* 사-첵 완료 — 홈 사첵 로고 버튼을 플로팅으로. 비활성=무색(grayscale), 활성=레드 */}
      {(() => {
        const disabled = isSaving || picked.length === 0 || !revisit || (needPrimary && !primarySaunaKind)
        return (
          <button
            type="button"
            onClick={() => { void handleSave() }}
            disabled={disabled}
            aria-label={isSaving ? '저장 중' : editId ? '수정 완료' : '사-첵 완료'}
            className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-40 w-[134px] h-[134px] rounded-full overflow-hidden transition-all rotate-[15deg] ${disabled ? 'grayscale' : 'active:scale-95'}`}
            style={{ boxShadow: disabled ? '0 8px 18px -10px rgba(0,0,0,0.18)' : '0 16px 36px -10px rgba(204,26,26,0.45), 0 6px 16px -6px rgba(0,0,0,0.18)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/sapi-chek-logo.svg" alt="" className="block w-full h-full" />
          </button>
        )
      })()}

      {showBackConfirm && (
        <ConfirmModal
          message={editId ? '편집을 취소할까요?\n변경사항이 저장되지 않습니다.' : '기록을 취소할까요?\n입력한 내용이 사라집니다.'}
          onConfirm={cancelLog}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}

      {/* 드래그 고스트 — 손가락(포인터)을 실제로 따라오는 노드 */}
      {dragIdx != null && dragPos && picked[dragIdx] && (
        <div className="fixed z-50 pointer-events-none" style={{ left: dragPos.x, top: dragPos.y, transform: 'translate(-50%,-50%) scale(1.1)' }}>
          <span className="w-11 h-11 rounded-full flex flex-col items-center justify-center shadow-lg" style={{ background: T.primary, color: T.card }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{BLOCK_TYPE_MAP[picked[dragIdx].catalogId].icon}</span>
            <span className="text-[9px] font-bold leading-none mt-0.5">{BLOCK_TYPE_MAP[picked[dragIdx].catalogId].label}</span>
          </span>
        </div>
      )}
    </div>
  )
}
