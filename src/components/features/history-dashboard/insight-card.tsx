/**
 * InsightCard — 트라이브별 인사이트 카드
 *
 * 링 카드 (전체/Saunner/Jimi):
 *   좌측: 링 영역 (WEEK=큰 링, MONTH=미니 링 2줄)
 *   우측: 서브 메트릭 2개
 *
 * Bather: 좌측 큰 숫자 + 우측 메트릭
 *
 * isEmpty: 기본 레이아웃 유지 + 흐림 + "기록을 추가해보세요!" 오버레이
 */

import { useState, useEffect } from 'react'
import HeatRing from './heat-ring'
import type { Period } from './period-toggle'
import type {
  AllInsight,
  BatherInsight,
  SaunnerInsight,
  JimiInsight,
  WeekRingData,
} from '@/lib/history-stats'

interface InsightCardProps {
  tribe: string
  period: Period
  color: string
  weekRings?: WeekRingData[]
  allInsight?: AllInsight
  batherInsight?: BatherInsight
  saunnerInsight?: SaunnerInsight
  jimiInsight?: JimiInsight
  isEmpty?: boolean
}

function fmtVal(v: number | null | undefined, suffix = ''): string {
  if (v == null) return '-'
  return `${v % 1 === 0 ? v : v.toFixed(1)}${suffix}`
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-stone-500 tracking-wide">{label}</p>
      <p className="font-heading text-2xl font-semibold" style={{ color: color || '#292524' }}>
        {value}
      </p>
    </div>
  )
}

// 월간 미니 링: 4주=위2+아래2, 5주=위2+아래3
function MultiRingGrid({ rings, color }: { rings: WeekRingData[]; color: string }) {
  const count = rings.length
  // 균등 분배: 4주=2+2, 5주=2+3, 6주=3+3
  const half = Math.ceil(count / 2)
  const topRow = rings.slice(0, half)
  const bottomRow = rings.slice(half)

  // 130px 영역: 4주=56px(2개/줄), 5~6주=40px(3개/줄)
  const ringSize = count <= 4 ? 56 : 40
  const sw = count <= 4 ? 4 : 3

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-2 justify-center">
        {topRow.map((ring) => (
          <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
            <HeatRing current={ring.heatMinutes} target={ring.target} size={ringSize} strokeWidth={sw}
              color={ring.heatMinutes > 0 ? color : '#d6d3d1'} showLabel />
            <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        {bottomRow.map((ring) => (
          <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
            <HeatRing current={ring.heatMinutes} target={ring.target} size={ringSize} strokeWidth={sw}
              color={ring.heatMinutes > 0 ? color : '#d6d3d1'} showLabel />
            <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 링 영역: 고정 너비+높이 → WEEK/MONTH 토글 시 카드 크기 고정
const RING_AREA_WIDTH = 130
const RING_AREA_HEIGHT = 148

function RingArea({
  period, color, heatMinutes, heatTarget, weekRings,
}: {
  period: Period; color: string; heatMinutes: number; heatTarget: number
  weekRings?: WeekRingData[]
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 flex-shrink-0"
      style={{ width: RING_AREA_WIDTH, minHeight: RING_AREA_HEIGHT }}
    >
      {period === 'week' ? (
        <HeatRing current={heatMinutes} target={heatTarget} size={120} strokeWidth={8} color={color} />
      ) : weekRings ? (
        <MultiRingGrid rings={weekRings} color={color} />
      ) : null}
      <span className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase text-center leading-tight">
        WEEKLY HEAT<br />EXPOSURE
      </span>
    </div>
  )
}

// 흐림 + 오버레이 래퍼
function EmptyOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card-light p-4 rounded-xl relative">
      <div className="opacity-30 blur-[2px] pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-stone-500 font-medium">기록을 추가해보세요!</p>
      </div>
    </div>
  )
}

// Saunner 전용 콘텐츠 — 평균 온도차 행에 건식/습식 토글
function SaunnerContent({
  period, color, heatMinutes, heatTarget, weekRings, saunnerInsight,
}: {
  period: Period; color: string; heatMinutes: number; heatTarget: number
  weekRings?: WeekRingData[]
  saunnerInsight?: SaunnerInsight
}) {
  const dryAvail = saunnerInsight?.avgDryTempDiff != null
  const steamAvail = saunnerInsight?.avgSteamTempDiff != null
  const initialKind: 'dry' | 'steam' = saunnerInsight?.defaultKind ?? 'dry'
  const [kind, setKind] = useState<'dry' | 'steam'>(initialKind)

  // 데이터 새로고침 시 디폴트가 바뀌면 active도 동기화
  useEffect(() => {
    if (saunnerInsight?.defaultKind) setKind(saunnerInsight.defaultKind)
  }, [saunnerInsight?.defaultKind])

  const tempDiff = kind === 'dry' ? saunnerInsight?.avgDryTempDiff : saunnerInsight?.avgSteamTempDiff

  const TogBtn = ({ k, label }: { k: 'dry' | 'steam'; label: string }) => {
    const available = k === 'dry' ? dryAvail : steamAvail
    const active = kind === k
    return (
      <button
        type="button"
        disabled={!available}
        onClick={() => available && setKind(k)}
        className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide transition-colors ${
          active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
        } ${!available ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <RingArea period={period} color={color} heatMinutes={heatMinutes} heatTarget={heatTarget} weekRings={weekRings} />
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[9px] font-bold text-stone-500 tracking-wide">평균 온도차</p>
            <div className="inline-flex bg-stone-200 rounded p-0.5">
              <TogBtn k="dry" label="건식" />
              <TogBtn k="steam" label="습식" />
            </div>
          </div>
          <p className="font-heading text-2xl font-semibold" style={{ color: '#292524' }}>
            {fmtVal(tempDiff, '°C')}
          </p>
        </div>
        <MetricRow label="토토노이 점수" value={fmtVal(saunnerInsight?.avgTotonoScore, '/5')} color={color} />
      </div>
    </div>
  )
}

// 링 카드 내부 콘텐츠 (전체/Saunner/Jimi 공통)
function RingCardContent({
  period, color, heatMinutes, heatTarget, weekRings, metrics,
}: {
  period: Period; color: string; heatMinutes: number; heatTarget: number
  weekRings?: WeekRingData[]
  metrics: { label: string; value: string; color?: string }[]
}) {
  return (
    <div className="flex items-center gap-4">
      <RingArea period={period} color={color} heatMinutes={heatMinutes} heatTarget={heatTarget} weekRings={weekRings} />
      <div className="flex-1 flex flex-col gap-4">
        {metrics.map((m) => (
          <MetricRow key={m.label} label={m.label} value={m.value} color={m.color} />
        ))}
      </div>
    </div>
  )
}

export default function InsightCard({
  tribe, period, color, weekRings,
  allInsight, batherInsight, saunnerInsight, jimiInsight,
  isEmpty,
}: InsightCardProps) {

  // === 전체 ===
  if (tribe === 'all') {
    const metrics = [
      { label: '신규 방문 장소', value: `${allInsight?.newPlaces ?? 0}곳` },
      { label: '재방문 점수', value: fmtVal(allInsight?.avgRevisitScore, '/5'), color },
    ]
    const content = (
      <RingCardContent
        period={period} color={color}
        heatMinutes={allInsight?.weeklyHeatMinutes ?? 0}
        heatTarget={57}
        weekRings={weekRings}
        metrics={metrics}
      />
    )
    if (isEmpty) return <EmptyOverlay>{content}</EmptyOverlay>
    return <div className="glass-card-light p-4 rounded-xl">{content}</div>
  }

  // === Bather ===
  if (tribe === 'bather') {
    const bi = batherInsight
    const metrics = [
      { label: '평균 수온', value: fmtVal(bi?.avgHotBathTemp, '°C') },
      { label: '수질 만족도', value: fmtVal(bi?.avgWaterQuality, '/5'), color },
    ]
    const content = (
      <RingCardContent
        period={period} color={color}
        heatMinutes={bi?.weeklyHeatMinutes ?? 0}
        heatTarget={57}
        weekRings={weekRings}
        metrics={metrics}
      />
    )
    if (isEmpty) return <EmptyOverlay>{content}</EmptyOverlay>
    return <div className="glass-card-light p-4 rounded-xl">{content}</div>
  }

  // === Saunner ===
  if (tribe === 'saunner') {
    const si = saunnerInsight
    const content = (
      <SaunnerContent
        period={period} color={color}
        heatMinutes={si?.weeklyHeatMinutes ?? 0} heatTarget={57}
        weekRings={weekRings}
        saunnerInsight={si}
      />
    )
    if (isEmpty) return <EmptyOverlay>{content}</EmptyOverlay>
    return <div className="glass-card-light p-4 rounded-xl">{content}</div>
  }

  // === Jimi ===
  if (tribe === 'jimi') {
    const ji = jimiInsight
    const metrics = [
      { label: '평균 찜질 온도', value: fmtVal(ji?.avgJjimTemp, '°C') },
      { label: '발한 점수', value: fmtVal(ji?.avgSweatQuality, '/5'), color },
    ]
    const content = (
      <RingCardContent
        period={period} color={color}
        heatMinutes={ji?.weeklyHeatMinutes ?? 0}
        heatTarget={57}
        weekRings={weekRings}
        metrics={metrics}
      />
    )
    if (isEmpty) return <EmptyOverlay>{content}</EmptyOverlay>
    return <div className="glass-card-light p-4 rounded-xl">{content}</div>
  }

  return null
}
