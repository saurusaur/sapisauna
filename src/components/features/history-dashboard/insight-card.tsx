/**
 * InsightCard — 트라이브별 인사이트 카드
 *
 * 링 카드 (전체/Saunner/Jimi):
 *   좌측: 링 영역 (WEEK=큰 링, MONTH=미니 링 2줄)
 *   우측: 서브 메트릭 2개
 *
 * Bather: 좌측 큰 숫자 + 우측 메트릭
 */

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

// 월간 미니 링: 좌측 영역 안에서 위아래 줄 배치
// 4주 = 위 2개 + 아래 2개, 5주 = 위 2개 + 아래 3개
function MultiRingGrid({ rings, color }: { rings: WeekRingData[]; color: string }) {
  const count = rings.length
  const topRow = rings.slice(0, 2)
  const bottomRow = rings.slice(2) // 4주면 2개, 5주면 3개

  const ringSize = count >= 5 ? 44 : 48
  const sw = count >= 5 ? 3.5 : 4

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-2 justify-center">
        {topRow.map((ring) => (
          <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
            <HeatRing
              current={ring.heatMinutes}
              target={ring.target}
              size={ringSize}
              strokeWidth={sw}
              color={ring.heatMinutes > 0 ? color : '#d6d3d1'}
              showLabel
            />
            <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        {bottomRow.map((ring) => (
          <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
            <HeatRing
              current={ring.heatMinutes}
              target={ring.target}
              size={ringSize}
              strokeWidth={sw}
              color={ring.heatMinutes > 0 ? color : '#d6d3d1'}
              showLabel
            />
            <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 링 + 라벨 (좌측 영역)
function RingArea({
  period, color, heatMinutes, heatTarget, weekRings,
}: {
  period: Period; color: string; heatMinutes: number; heatTarget: number
  weekRings?: WeekRingData[]
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
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

export default function InsightCard({
  tribe, period, color, weekRings,
  allInsight, batherInsight, saunnerInsight, jimiInsight,
  isEmpty,
}: InsightCardProps) {

  // 기록 없을 때
  if (isEmpty) {
    return (
      <div className="glass-card-light p-4 rounded-xl opacity-50 relative">
        <div className="h-28" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-stone-400">아직 기록이 없어요..</p>
        </div>
      </div>
    )
  }

  // === 전체 ===
  if (tribe === 'all' && allInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <RingArea
            period={period} color={color}
            heatMinutes={allInsight.weeklyHeatMinutes}
            heatTarget={allInsight.heatTarget}
            weekRings={weekRings}
          />
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow label="신규 방문 장소" value={`${allInsight.newPlaces}곳`} />
            <MetricRow label="재방문 점수" value={fmtVal(allInsight.avgRevisitScore, '/5')} color={color} />
          </div>
        </div>
      </div>
    )
  }

  // === Bather (링 없음, 큰 숫자) ===
  if (tribe === 'bather' && batherInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[9px] font-bold text-stone-500 tracking-wide">총 입수 시간</p>
            <p className="font-heading text-[42px] font-semibold leading-none" style={{ color }}>
              {batherInsight.totalImmersionTime != null ? batherInsight.totalImmersionTime : '-'}
              <span className="text-base text-stone-400 font-normal"> MIN</span>
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow label="평균 수온" value={fmtVal(batherInsight.avgHotBathTemp, '°C')} />
            <MetricRow label="수질 만족도" value={fmtVal(batherInsight.avgWaterQuality, '/5')} color={color} />
          </div>
        </div>
      </div>
    )
  }

  // === Saunner ===
  if (tribe === 'saunner' && saunnerInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <RingArea
            period={period} color={color}
            heatMinutes={saunnerInsight.weeklyHeatMinutes}
            heatTarget={saunnerInsight.heatTarget}
            weekRings={weekRings}
          />
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow label="평균 온도차" value={fmtVal(saunnerInsight.avgTempDiff, '°C')} />
            <MetricRow label="토토노이 점수" value={fmtVal(saunnerInsight.avgTotonoScore, '/5')} color={color} />
          </div>
        </div>
      </div>
    )
  }

  // === Jimi ===
  if (tribe === 'jimi' && jimiInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <RingArea
            period={period} color={color}
            heatMinutes={jimiInsight.weeklyHeatMinutes}
            heatTarget={jimiInsight.heatTarget}
            weekRings={weekRings}
          />
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow label="평균 찜질 온도" value={fmtVal(jimiInsight.avgJjimTemp, '°C')} />
            <MetricRow label="발한 점수" value={fmtVal(jimiInsight.avgSweatQuality, '/5')} color={color} />
          </div>
        </div>
      </div>
    )
  }

  // fallback
  return (
    <div className="glass-card-light p-4 rounded-xl">
      <div className="text-center py-6 text-stone-400">
        <span className="material-symbols-outlined text-3xl opacity-30 block mb-2">water_drop</span>
        <p className="text-sm">기록이 더 쌓이면 보여드릴게요</p>
      </div>
    </div>
  )
}
