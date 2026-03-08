/**
 * 스티커 타입별 렌더링 컴포넌트
 * 숫자/그래프/정보/루틴 등 각 스티커의 실제 콘텐츠를 렌더링
 */
'use client'

import { TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, EXPLORE, APP } from '@/constants/content'
import type { TribeId } from '@/types'
import SaunnerGraph from '@/components/svg/saunner-graph'
import BatherGraph from '@/components/svg/bather-graph'
import JimiGraph from '@/components/svg/jimi-graph'
import type { StickerType } from '@/lib/sticker-templates'

// 로그 데이터 타입 (story page의 LogData와 동일)
export type LogData = {
  _editId?: string
  place_name: string
  tribe_id: TribeId
  created_at?: string
  date?: string
  sauna_temp?: number
  cold_bath_temp?: number
  repeat?: number
  totono_score?: number
  water_quality?: number
  hot_bath_temp?: number
  refreshed_score?: number
  rest_quality?: number
  cleanliness?: number
  jjim_temp?: number
  revisit_score: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  deep_log?: { [key: string]: unknown }
}

interface StickerContentProps {
  type: StickerType
  log: LogData
  nickname?: string
  text?: string         // comment 스티커용
  isPreview?: boolean   // 드로어 미리보기용 (작은 크기)
}

export default function StickerContent({ type, log, nickname, text, isPreview }: StickerContentProps) {
  switch (type) {
    case 'temp-delta':
      return <TempDeltaSticker log={log} isPreview={isPreview} />
    case 'heat-temp':
      return <HeatTempSticker log={log} isPreview={isPreview} />
    case 'graph':
      return <GraphSticker log={log} isPreview={isPreview} />
    case 'location':
      return <LocationSticker log={log} isPreview={isPreview} />
    case 'timestamp':
      return <TimestampSticker log={log} isPreview={isPreview} />
    case 'comment':
      return <CommentSticker text={text} isPreview={isPreview} />
    case 'score':
      return <ScoreSticker log={log} isPreview={isPreview} />
    case 'nickname':
      return <NicknameSticker nickname={nickname} isPreview={isPreview} />
    case 'tribe':
      return <TribeSticker log={log} isPreview={isPreview} />
    case 'ritual-2line':
      return <Ritual2LineSticker log={log} isPreview={isPreview} />
    case 'ritual-1col':
      return <Ritual1ColSticker log={log} isPreview={isPreview} />
    default:
      return null
  }
}

// ── 숫자 스티커 ──

function TempDeltaSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  let delta: number | null = null

  if (log.tribe_id === 'saunner') {
    delta = (log.sauna_temp || 80) - (log.cold_bath_temp || 15)
  } else if (log.tribe_id === 'bather' && log.cold_bath_temp != null) {
    delta = (log.hot_bath_temp || 40) - log.cold_bath_temp
  }

  if (delta === null) return <HeatTempSticker log={log} isPreview={isPreview} />

  return (
    <div className="text-center select-none" style={{ fontFamily: 'var(--font-serif)' }}>
      <p className={`text-white/40 tracking-[0.2em] uppercase mb-1 ${isPreview ? 'text-[7px]' : 'text-[10px]'}`}>
        temperature delta
      </p>
      <div className="flex items-baseline justify-center">
        <span className={`text-white font-light tracking-tight ${isPreview ? 'text-3xl' : 'text-8xl'}`}>
          {delta}
        </span>
        <span className={`text-white/70 font-light ml-1 ${isPreview ? 'text-sm' : 'text-2xl'}`}>
          °C
        </span>
      </div>
    </div>
  )
}

function HeatTempSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  let temp: number | null = null
  let label = 'heat temperature'

  switch (log.tribe_id) {
    case 'saunner':
      temp = log.sauna_temp || 80
      break
    case 'bather':
      temp = log.hot_bath_temp || 40
      label = 'immersion temperature'
      break
    case 'jimi':
      temp = log.jjim_temp ?? null
      label = 'jjimjilbang temperature'
      break
  }

  return (
    <div className="text-center select-none" style={{ fontFamily: 'var(--font-serif)' }}>
      <p className={`text-white/40 tracking-[0.2em] uppercase mb-1 ${isPreview ? 'text-[7px]' : 'text-[10px]'}`}>
        {label}
      </p>
      <div className="flex items-baseline justify-center">
        <span className={`text-white font-light tracking-tight ${isPreview ? 'text-3xl' : 'text-8xl'}`}>
          {temp ?? '—'}
        </span>
        {temp != null && (
          <span className={`text-white/70 font-light ml-1 ${isPreview ? 'text-sm' : 'text-2xl'}`}>
            °C
          </span>
        )}
      </div>
    </div>
  )
}

// ── 그래프 스티커 ──

function GraphSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const size = isPreview ? 'w-[80px] h-[60px]' : 'w-[200px] h-[140px]'

  switch (log.tribe_id) {
    case 'saunner':
      return (
        <div className={size}>
          <SaunnerGraph
            saunaTemp={log.sauna_temp || 80}
            coldBathTemp={log.cold_bath_temp || 15}
            repeat={log.repeat || 3}
            totono_score={log.totono_score || 3}
          />
        </div>
      )
    case 'bather':
      return (
        <div className={size}>
          <BatherGraph
            waterQuality={log.water_quality || 3}
            hotBathTemp={log.hot_bath_temp || 40}
            coldBathTemp={log.cold_bath_temp}
            refreshedScore={log.refreshed_score}
          />
        </div>
      )
    case 'jimi':
      return (
        <div className={size}>
          <JimiGraph
            cleanliness={log.cleanliness || 3}
            jjimTemp={log.jjim_temp}
          />
        </div>
      )
    default:
      return null
  }
}

// ── 정보 스티커 ──

function LocationSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1 select-none">
      <span
        className="material-symbols-outlined text-white/50 leading-none"
        style={{ fontSize: isPreview ? '10px' : '12px' }}
      >
        onsen
      </span>
      <span
        className={`text-white/50 font-normal ${isPreview ? 'text-[9px]' : 'text-xs'}`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {log.place_name}
      </span>
    </div>
  )
}

function TimestampSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const dateStr = new Date(log.created_at || log.date || '')
    .toISOString().slice(0, 10).replace(/-/g, '.')

  return (
    <p
      className={`text-white/50 italic select-none ${isPreview ? 'text-[9px]' : 'text-[12.5px]'}`}
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {dateStr}
    </p>
  )
}

function CommentSticker({ text, isPreview }: { text?: string; isPreview?: boolean }) {
  return (
    <p
      className={`text-white/80 italic select-none ${isPreview ? 'text-[9px]' : 'text-sm'}`}
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      &ldquo;{text || '탭하여 입력'}&rdquo;
    </p>
  )
}

function ScoreSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const score = log.revisit_score || 3
  const dots = Array.from({ length: 5 }, (_, i) => i < score ? '●' : '○').join('')

  return (
    <div className={`flex items-center gap-1.5 select-none ${isPreview ? 'text-[9px]' : 'text-xs'}`}
      style={{ fontFamily: 'var(--font-sans)' }}>
      <span className="text-white/60">{EXPLORE.REVISIT_LABEL}</span>
      <span className="text-white/80 tracking-wider">{dots}</span>
    </div>
  )
}

function NicknameSticker({ nickname, isPreview }: { nickname?: string; isPreview?: boolean }) {
  return (
    <span
      className={`text-white/60 select-none ${isPreview ? 'text-[9px]' : 'text-xs'}`}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      @{nickname || 'nickname'}
    </span>
  )
}

function TribeSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const emoji = TRIBE_EMOJI_MAP[log.tribe_id] || '🔥'
  const persona = TRIBE_PERSONA_MAP[log.tribe_id] || 'Saunner'

  return (
    <p
      className={`text-white/60 italic select-none ${isPreview ? 'text-[9px]' : 'text-xs'}`}
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {emoji} {persona}
    </p>
  )
}

// ── 루틴 스티커 ──

// 루틴 라벨과 값 정의
function getRoutineItems(log: LogData) {
  return [
    { label: 'HEAT', value: log.heat_time, unit: log.heat_time === 1 ? 'min' : 'mins' },
    { label: 'ICE', value: log.ice_time, unit: log.ice_time === 1 ? 'min' : 'mins' },
    { label: 'PAUSE', value: log.pause_time, unit: log.pause_time === 1 ? 'min' : 'mins' },
    { label: 'REPEAT', value: log.repeat, unit: 'sets' },
  ]
}

function Ritual2LineSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const items = getRoutineItems(log)

  return (
    <div className="text-center select-none" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* 라벨 라인 */}
      <p className={`text-white/40 tracking-[0.2em] uppercase ${isPreview ? 'text-[6px]' : 'text-[9px]'}`}>
        {items.map(i => i.label).join(' · ')}
      </p>
      {/* 값 라인 */}
      <p className={`text-white/90 font-medium mt-0.5 ${isPreview ? 'text-[8px]' : 'text-xs'}`}>
        {items.map(i => i.value != null ? `${i.value} ${i.unit}` : ' ').join(' · ')}
      </p>
    </div>
  )
}

function Ritual1ColSticker({ log, isPreview }: { log: LogData; isPreview?: boolean }) {
  const items = getRoutineItems(log)

  return (
    <div className="text-center select-none space-y-1" style={{ fontFamily: 'var(--font-sans)' }}>
      {items.map(item => (
        <div key={item.label}>
          <p className={`text-white/40 tracking-[0.2em] uppercase ${isPreview ? 'text-[5px]' : 'text-[9px]'}`}>
            {item.label}
          </p>
          <p className={`text-white/90 font-medium ${isPreview ? 'text-[8px] min-h-[10px]' : 'text-base min-h-[20px]'}`}>
            {item.value != null ? `${item.value} ${item.unit}` : ''}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── 워터마크 (고정, 비스티커) ──

export function Watermark() {
  return (
    <div
      className="absolute bottom-4 right-2 z-50 pointer-events-none select-none"
      style={{
        writingMode: 'vertical-rl',
        fontFamily: 'var(--font-serif)',
      }}
    >
      <span className="text-white/20 text-[9px] tracking-[0.25em]">
        {APP.NAME}
      </span>
    </div>
  )
}
