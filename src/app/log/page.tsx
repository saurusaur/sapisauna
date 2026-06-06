'use client'

import { useState, useEffect } from 'react'
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
  TRIBE_IDS,
  QUICK_LOG,
  DEEP_LOG,
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

// ── 트라이브 품질 (1-5) ──
const QUALITY: Record<TribeId, { label: string; steps: { value: number; label: string }[] }> = {
  saunner: { label: QUICK_LOG.SAUNER.TOTONO.label, steps: QUICK_LOG.SAUNER.TOTONO.steps },
  bather: { label: QUICK_LOG.BATHER.WATER_QUALITY.label, steps: QUICK_LOG.BATHER.WATER_QUALITY.steps },
  jimi: { label: QUICK_LOG.JIMI.SWEAT_QUALITY.label, steps: QUICK_LOG.JIMI.SWEAT_QUALITY.steps },
}
const REVISIT_STEPS = QUICK_LOG.COMMON.REVISIT.steps
const CLEAN_STEPS = DEEP_LOG.CLEANLINESS.steps
const REST_STEPS = QUICK_LOG.JIMI.REST_QUALITY.steps
const SCRUB_STEPS = DEEP_LOG.SCRUB.satisfaction.steps
const STORE_STEPS = QUICK_LOG.COMMON.REVISIT.steps // placeholder 1-5 라벨 없는 단순 칩
const CATEGORY_ORDER: BlockCategory[] = ['heat', 'ice', 'rest', 'beyond']
const PRICE_BLOCKS = new Set(['scrub', 'massage'])
const MEMO_BLOCKS = new Set(['snack', 'restaurant'])
const REST_EVAL = new Set(['rest', 'outdoor-rest', 'indoor-rest', 'sleep-room'])

// 폼 내부 블록 인스턴스
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
  return { catalogId, temp, durationSec, score: null, cost: null, memo: null, norepeat: false }
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

  // 트라이브 / 페르소나
  const [logType, setLogType] = useState<TribeId>(primaryTribe as TribeId)
  const [personaOpen, setPersonaOpen] = useState(false)

  // 블록
  const [picked, setPicked] = useState<Picked[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const [routineDetail, setRoutineDetail] = useState(false)
  const [primarySaunaKind, setPrimarySaunaKind] = useState<'dry' | 'steam' | null>(null)
  const [repeat, setRepeat] = useState(1)

  // 평가
  const [revisit, setRevisit] = useState(3)
  const [quality, setQuality] = useState(3)

  // 더자세히
  const [detailOpen, setDetailOpen] = useState(false)
  const [cleanliness, setCleanliness] = useState(0)
  const [companion, setCompanion] = useState<string | null>(null)
  const [crowd, setCrowd] = useState<string | null>(null)
  const [cost, setCost] = useState<string>('')
  const [currency, setCurrency] = useState('KRW')
  const [memo, setMemo] = useState('')

  // 날짜·시간
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [recordDate, setRecordDate] = useState(todayStr)
  const [recordHour, setRecordHour] = useState<number>(now.getHours())

  // 상태
  const [editId, setEditId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // bath_gender 자동
  const deriveBathGender = (ft: string | null, bp: string | null, g?: 'male' | 'female'): BathGender | null => {
    if (ft === 'private-sauna') {
      if (g === 'male') return 'private_male'
      if (g === 'female') return 'private_female'
      return 'private'
    }
    switch (bp as BathPolicy) {
      case 'male-only': return 'male'
      case 'female-only': return 'female'
      case 'mixed':
        if (g === 'male') return 'mixed_male'
        if (g === 'female') return 'mixed_female'
        return 'mixed'
      case 'gender-bath':
      default:
        if (g === 'male') return 'male'
        if (g === 'female') return 'female'
        return null
    }
  }

  // 장소 / 편집 복원
  useEffect(() => {
    const presetDate = localStorage.getItem('selectedRecordDate')
    if (presetDate) {
      setRecordDate(presetDate)
      localStorage.removeItem('selectedRecordDate')
    }
    const { currentLog: log, selectedPlace: place } = readEditSession()
    if (place) {
      setPlaceName(place.name || '')
      if (place.id) setPlaceId(place.id)
      setPlaceCountryCode(place.countryCode)
      if (place.facilityType) setFacilityType(place.facilityType)
      if (place.bathPolicy) setBathPolicy(place.bathPolicy)
    } else if (!log) {
      router.replace('/place')
      return
    }
    if (log) {
      if (log._editId) setEditId(log._editId)
      if (log.record_date) {
        setRecordDate(log.record_date.slice(0, 10))
        setRecordHour(new Date(log.record_date).getHours())
      }
      const tribe = (log.tribe_id as TribeId) || (primaryTribe as TribeId)
      if (log.tribe_id) setLogType(tribe)
      if (log.revisit_score) setRevisit(log.revisit_score)
      if (log.repeat) setRepeat(log.repeat)
      if (log.primary_sauna_kind) setPrimarySaunaKind(log.primary_sauna_kind)
      // 품질
      const q = tribe === 'saunner' ? log.totono_score : tribe === 'bather' ? log.water_quality : log.sweat_quality
      if (q) setQuality(q)
      if (log.cleanliness) setCleanliness(log.cleanliness)
      if (log.companion) setCompanion(log.companion)
      if (log.crowd) setCrowd(log.crowd)
      if (log.cost != null) setCost(String(log.cost))
      if (log.currency) setCurrency(log.currency)
      if (log.memo) setMemo(log.memo)
      // 블록 복원
      if (log.blocks && log.blocks.length) {
        setRoutineDetail(true)
        setPicked(log.blocks.map(b => {
          // block_type(+variant) → 카탈로그 id
          let catalogId = b.block_type
          if (b.block_type === 'scrub' && b.variant === 'withmassage') catalogId = 'scrub-withmassage'
          if (!BLOCK_TYPE_MAP[catalogId]) catalogId = b.block_type
          return {
            catalogId,
            temp: b.temp ?? null,
            durationSec: b.duration_sec ?? null,
            score: b.score ?? null,
            cost: b.cost ?? null,
            memo: b.memo ?? null,
            norepeat: b.norepeat ?? false,
          }
        }))
      }
    }
  }, [router, primaryTribe])

  // ── 블록 조작 ──
  const togglePick = (catalogId: string) => {
    setPicked(prev => {
      const i = prev.findIndex(p => p.catalogId === catalogId)
      if (i > -1) return prev.filter((_, idx) => idx !== i)
      return [...prev, makePicked(catalogId)]
    })
  }
  const isPicked = (catalogId: string) => picked.some(p => p.catalogId === catalogId)
  const seqOf = (catalogId: string) => picked.findIndex(p => p.catalogId === catalogId) + 1
  const updatePicked = (i: number, patch: Partial<Picked>) =>
    setPicked(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const movePicked = (i: number, dir: -1 | 1) =>
    setPicked(prev => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  // 건식+습식 둘 다면 메인 선택 필요
  const bothSauna = isPicked('dry-sauna') && isPicked('steam-sauna')

  // ── 저장 ──
  const buildRecordDate = () => `${recordDate}T${String(recordHour).padStart(2, '0')}:00:00`

  const buildSession = (): LogSessionInput => ({
    place_id: placeId as string,
    tribe_id: logType,
    record_date: buildRecordDate(),
    revisit_score: revisit,
    bath_gender: deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined),
    primary_sauna_kind: bothSauna ? (primarySaunaKind ?? 'dry') : null,
    totono_score: logType === 'saunner' ? quality : null,
    water_quality: logType === 'bather' ? quality : null,
    sweat_quality: logType === 'jimi' ? quality : null,
    cleanliness: cleanliness || null,
    crowd: crowd,
    companion: companion,
    cost: cost ? Number(cost) : null,
    currency: cost ? currency : null,
    memo: memo || null,
    repeat: picked.length > 1 ? repeat : null,
  })

  const buildBlocks = (): LogBlockInput[] =>
    picked.map(p => {
      const d = BLOCK_TYPE_MAP[p.catalogId]
      return {
        blockType: d.blockType,
        category: d.category,
        variant: d.variant ?? null,
        temp: p.temp,
        durationSec: p.durationSec,
        score: p.score,
        cost: p.cost,
        memo: p.memo,
        norepeat: p.norepeat,
      }
    })

  const handleSave = async () => {
    if (!placeId) { setSaveError('장소 정보가 없습니다.'); return }
    if (picked.length === 0) { setSaveError('활동을 하나 이상 선택해주세요.'); return }
    setIsSaving(true)
    setSaveError(null)
    try {
      const session = buildSession()
      const blocks = buildBlocks()
      let logId: string
      if (editId) {
        await updateLogWithBlocks(editId, session, blocks)
        logId = editId
      } else {
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
    } finally {
      setIsSaving(false)
    }
  }

  const tribeColor = logType === 'saunner' ? '#E8702A' : logType === 'bather' ? '#2E86DE' : '#8A6FB0'

  // ── 블록 칩(원형) ──
  const BlockChip = ({ catalogId, small }: { catalogId: string; small?: boolean }) => {
    const d = BLOCK_TYPE_MAP[catalogId]
    const sel = isPicked(catalogId)
    const size = small ? 'w-12 h-12' : 'w-14 h-14'
    return (
      <button
        type="button"
        onClick={() => togglePick(catalogId)}
        className="flex flex-col items-center gap-1.5 shrink-0 relative"
        style={{ width: small ? 50 : undefined }}
      >
        {sel && (
          <span className="absolute -top-1 right-0 w-5 h-5 rounded-full bg-white text-[11px] font-bold flex items-center justify-center shadow z-10"
            style={{ color: 'var(--color-primary)' }}>{seqOf(catalogId)}</span>
        )}
        <span className={`${size} rounded-full flex items-center justify-center transition-colors`}
          style={sel ? { background: 'var(--color-primary)' } : { background: '#ECE4D5' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: sel ? '#fff' : '#7d756a' }}>{d.icon}</span>
        </span>
        <span className="text-[11px] font-semibold" style={{ color: sel ? 'var(--color-primary)' : '#221C17' }}>{d.label}</span>
      </button>
    )
  }

  // ── 1-5 칩 행 ──
  const ChipRow = ({ value, steps, onChange, label }: { value: number; steps: { value: number; label: string }[]; onChange: (v: number) => void; label: string }) => (
    <Slider label={label} value={value || 1} min={1} max={5} steps={steps} onChange={onChange} variant="chip" inactive={value === 0} onActivate={() => onChange(3)} />
  )

  return (
    <div className="min-h-dvh bath-tile-bg pb-28">
      {/* 페르소나 밴드 */}
      <header className="px-5 pt-7 pb-4 text-white relative" style={{ background: tribeColor, borderRadius: '0 0 24px 24px' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-semibold text-sm tracking-wide opacity-90">오늘의 사-첵</span>
          <span className="w-8" />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="text-[11px] tracking-widest opacity-85 font-semibold">LOGGING AS</div>
            <div className="text-2xl font-extrabold flex items-center gap-2">
              {logType.toUpperCase()} <span>{TRIBE_EMOJI_MAP[logType]}</span>
            </div>
          </div>
          <button onClick={() => setPersonaOpen(o => !o)} className="text-[11px] font-bold rounded-full px-3 py-2 flex items-center gap-1" style={{ background: 'rgba(255,255,255,.22)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>swap_horiz</span>SWITCH
          </button>
        </div>
        {personaOpen && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {TRIBE_IDS.map(t => (
              <button key={t} onClick={() => { setLogType(t as TribeId); setPersonaOpen(false); setQuality(3) }}
                className="rounded-xl py-2.5 text-xs font-bold flex flex-col items-center gap-1"
                style={t === logType ? { background: '#fff', color: tribeColor } : { background: 'rgba(255,255,255,.16)', color: '#fff' }}>
                <span className="text-lg">{TRIBE_EMOJI_MAP[t]}</span>{t.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-5 pt-4 space-y-6">
        {/* 장소 요약 */}
        <div className="flex items-center gap-3 bg-white/70 rounded-2xl px-3 py-2.5">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>location_on</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-stone-800 text-[15px] truncate">{placeName}</div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="bg-transparent" />
              <select value={recordHour} onChange={e => setRecordHour(Number(e.target.value))} className="bg-transparent">
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 블록 선택 */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-stone-800">오늘 뭐 했어요? <span className="text-[11px] font-normal text-stone-400">누른 순서가 곧 동선</span></h2>
            <button onClick={() => setMoreOpen(o => !o)} className="text-xs font-bold flex items-center gap-0.5" style={{ color: 'var(--color-primary)' }}>
              {moreOpen ? '접기' : '활동 전체보기'}
              <span className="material-symbols-outlined" style={{ fontSize: 16, transform: moreOpen ? 'rotate(180deg)' : undefined }}>expand_more</span>
            </button>
          </div>

          {!moreOpen && (
            <div className="flex justify-between">
              {TRIBE_DEFAULT_BLOCKS[logType].map(id => <BlockChip key={id} catalogId={id} />)}
            </div>
          )}

          {moreOpen && (
            <div className="space-y-3">
              {CATEGORY_ORDER.map(cat => {
                const meta = BLOCK_CATEGORY_META[cat]
                const ids = BLOCK_TYPES.filter(b => b.category === cat).map(b => b.id)
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 w-11 shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#7d756a' }}>{meta.icon}</span>
                      <span className="text-[9px] font-bold text-stone-500">{meta.label}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {ids.map(id => <BlockChip key={id} catalogId={id} small />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 메인 사우나 선택 (건식+습식 둘 다) */}
        {bothSauna && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-stone-700">{QUICK_LOG.SAUNER.PRIMARY_PROMPT}</span>
            {(['dry', 'steam'] as const).map(k => (
              <button key={k} onClick={() => setPrimarySaunaKind(k)}
                className="px-3 py-1 rounded-full text-xs font-bold border"
                style={primarySaunaKind === k ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' } : { borderColor: '#ddd2bf', color: '#8b8175' }}>
                {k === 'dry' ? '건식' : '습식'}
              </button>
            ))}
          </div>
        )}

        {/* 내 루틴 토글 + 요약 */}
        {picked.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5" style={{ background: '#ECE4D5' }}>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                {!routineDetail
                  ? picked.map((p, i) => <span key={i} className="bg-white rounded-full px-2.5 py-1 text-xs font-bold text-stone-700">{BLOCK_TYPE_MAP[p.catalogId].label}</span>)
                  : <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-primary)' }}>루틴 <span className="text-[10px] font-medium text-stone-400">· 순서 ↑↓ · 1회 제외 토글</span></span>}
              </div>
              <button onClick={() => setRoutineDetail(v => !v)} className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-stone-500">온도·시간</span>
                <span className="w-10 h-6 rounded-full relative transition-colors" style={{ background: routineDetail ? 'var(--color-primary)' : '#E1D7C5' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: routineDetail ? 22 : 2 }} />
                </span>
              </button>
            </div>

            {/* 리추얼 */}
            {routineDetail && (
              <div className="space-y-3">
                {picked.map((p, i) => {
                  const d = BLOCK_TYPE_MAP[p.catalogId]
                  const evalSteps = REST_EVAL.has(d.blockType) ? REST_STEPS
                    : (d.blockType === 'scrub' || d.blockType === 'massage') ? SCRUB_STEPS
                    : MEMO_BLOCKS.has(d.blockType) ? STORE_STEPS : null
                  return (
                    <div key={i} className="bg-white/70 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: p.norepeat ? '#bbb' : 'var(--color-primary)' }}>{i + 1}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>{d.icon}</span>
                        <span className="font-bold text-sm flex-1">{d.label}</span>
                        <button onClick={() => movePicked(i, -1)} className="w-6 h-6 text-stone-400"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>keyboard_arrow_up</span></button>
                        <button onClick={() => movePicked(i, 1)} className="w-6 h-6 text-stone-400"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>keyboard_arrow_down</span></button>
                        <button onClick={() => updatePicked(i, { norepeat: !p.norepeat })} className="text-[10px] font-bold px-2 py-1 rounded-full" style={p.norepeat ? { background: 'var(--color-primary)', color: '#fff' } : { background: '#ECE4D5', color: '#8b8175' }}>1회</button>
                        <button onClick={() => togglePick(p.catalogId)} className="text-stone-300"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span></button>
                      </div>
                      {/* 온도 */}
                      {d.tempRange && (
                        <Slider label="온도" value={p.temp ?? d.tempRange[0]} min={d.tempRange[0]} max={d.tempRange[1]} unit="°C" steps={d.tempSteps ?? []} onChange={v => updatePicked(i, { temp: v })} />
                      )}
                      {/* 시간 */}
                      {d.durUnit && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xs font-semibold text-stone-500 w-12">시간</span>
                          <button onClick={() => updatePicked(i, { durationSec: Math.max(0, (p.durationSec ?? 0) - (d.durUnit === 'sec' ? 10 : 60)) })} className="w-7 h-7 rounded-lg bg-stone-100">−</button>
                          <b className="min-w-[44px] text-center font-bold">{d.durUnit === 'sec' ? `${p.durationSec ?? 0}초` : `${Math.round((p.durationSec ?? 0) / 60)}분`}</b>
                          <button onClick={() => updatePicked(i, { durationSec: (p.durationSec ?? 0) + (d.durUnit === 'sec' ? 10 : 60) })} className="w-7 h-7 rounded-lg bg-stone-100">+</button>
                        </div>
                      )}
                      {/* 평가 */}
                      {evalSteps && (
                        <ChipRow label={REST_EVAL.has(d.blockType) ? '휴식 질' : MEMO_BLOCKS.has(d.blockType) ? '만족' : '만족도'} value={p.score ?? 0} steps={evalSteps} onChange={v => updatePicked(i, { score: v })} />
                      )}
                      {/* 가격 (세신/마사지) */}
                      {PRICE_BLOCKS.has(d.blockType) && (
                        <input inputMode="numeric" placeholder="₩ 가격" value={p.cost ?? ''} onChange={e => updatePicked(i, { cost: e.target.value ? Number(e.target.value) : null })} className="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm" />
                      )}
                      {/* 메모 (매점/식당 추천메뉴) */}
                      {MEMO_BLOCKS.has(d.blockType) && (
                        <input placeholder="추천메뉴 (예: 식혜가 시원)" value={p.memo ?? ''} onChange={e => updatePicked(i, { memo: e.target.value || null })} className="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm" />
                      )}
                    </div>
                  )
                })}
                {picked.length > 1 && (
                  <div className="flex items-center justify-center gap-3 text-sm text-stone-500 font-semibold">
                    <span>반복</span>
                    <button onClick={() => setRepeat(r => Math.max(1, r - 1))} className="w-7 h-7 rounded-lg bg-stone-100">−</button>
                    <b>{repeat}</b>
                    <button onClick={() => setRepeat(r => r + 1)} className="w-7 h-7 rounded-lg bg-stone-100">+</button>
                    <span>세트</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 평가 */}
        <section className="space-y-4 bg-white/60 rounded-2xl p-4">
          <ChipRow label={QUALITY[logType].label} value={quality} steps={QUALITY[logType].steps} onChange={setQuality} />
          <ChipRow label="또 갈래요?" value={revisit} steps={REVISIT_STEPS} onChange={setRevisit} />
        </section>

        {/* 더 자세히 */}
        <section>
          <button onClick={() => setDetailOpen(o => !o)} className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-stone-500 py-2">
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{detailOpen ? 'expand_less' : 'expand_more'}</span>
            더 자세히 (청결·동행·입장료·메모)
          </button>
          {detailOpen && (
            <div className="space-y-4 bg-white/60 rounded-2xl p-4">
              <ChipRow label="청결도" value={cleanliness} steps={CLEAN_STEPS} onChange={setCleanliness} />
              <div className="flex flex-wrap gap-2">
                {DEEP_LOG.COMPANION.options.map(o => (
                  <button key={o.id} onClick={() => setCompanion(companion === o.id ? null : o.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={companion === o.id ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' } : { borderColor: '#ddd2bf', color: '#8b8175' }}>{o.label}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {DEEP_LOG.CROWD.options.map(o => (
                  <button key={o.id} onClick={() => setCrowd(crowd === o.id ? null : o.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={crowd === o.id ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' } : { borderColor: '#ddd2bf', color: '#8b8175' }}>{o.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input inputMode="numeric" placeholder="입장료" value={cost} onChange={e => setCost(e.target.value)} className="flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm" />
                <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-20 bg-stone-100 rounded-lg px-3 py-2 text-sm text-center" />
              </div>
              <textarea placeholder="오늘의 한 줄 메모" value={memo} onChange={e => setMemo(e.target.value)} className="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm h-16 resize-none" />
            </div>
          )}
        </section>

        {saveError && <ErrorBanner message={saveError} />}
      </main>

      <BottomCTA onClick={() => { void handleSave() }} disabled={isSaving || picked.length === 0}>
        {isSaving ? '저장 중…' : editId ? '수정 완료' : '사-첵 완료'}
      </BottomCTA>
    </div>
  )
}
