/**
 * InsightCard — 트라이브별 인사이트 카드
 *
 * 링 있는 카드 (전체/Saunner/Jimi):
 *   WEEK → 큰 링 (상단 전체) + 메트릭 (하단 가로)
 *   MONTH → 미니 링 그리드 (4주=2x2, 5주=2+3) + 메트릭 (하단 가로)
 *
 * Bather: 총 입수 시간 (큰 숫자) + 메트릭 (하단 가로)
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

// 하단 메트릭 행 (가로 2칸)
function MetricBar({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="flex gap-4 pt-3 border-t border-stone-200/30">
      {items.map((item) => (
        <div key={item.label} className="flex-1">
          <p className="text-[9px] font-bold text-stone-500 tracking-wide mb-0.5">{item.label}</p>
          <p className="font-heading text-xl font-semibold" style={{ color: item.color || '#292524' }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// 월간 멀티 링: 4주=2x2, 5주=2행(상2+하3)
function MultiRingGrid({ rings, color }: { rings: WeekRingData[]; color: string }) {
  const count = rings.length

  if (count >= 5) {
    // 5주: 상단 2개 + 하단 3개
    const topRow = rings.slice(0, 2)
    const bottomRow = rings.slice(2, 5)
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3 justify-center">
          {topRow.map((ring) => (
            <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
              <HeatRing
                current={ring.heatMinutes}
                target={ring.target}
                size={48}
                strokeWidth={4}
                color={ring.heatMinutes > 0 ? color : '#d6d3d1'}
                showLabel
              />
              <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          {bottomRow.map((ring) => (
            <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
              <HeatRing
                current={ring.heatMinutes}
                target={ring.target}
                size={48}
                strokeWidth={4}
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

  // 4주 이하: 2x2
  return (
    <div className="grid grid-cols-2 gap-3 justify-items-center">
      {rings.map((ring) => (
        <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
          <HeatRing
            current={ring.heatMinutes}
            target={ring.target}
            size={52}
            strokeWidth={4}
            color={ring.heatMinutes > 0 ? color : '#d6d3d1'}
            showLabel
          />
          <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
        </div>
      ))}
    </div>
  )
}

// 링 카드 공통 레이아웃: 링(상단, 세로 중앙) + 라벨 + 메트릭(하단)
function RingInsightCard({
  period, color, heatMinutes, heatTarget, weekRings, metrics, isEmpty,
}: {
  period: Period; color: string; heatMinutes: number; heatTarget: number
  weekRings?: WeekRingData[]
  metrics: { label: string; value: string; color?: string }[]
  isEmpty?: boolean
}) {
  if (isEmpty) {
    return (
      <div className="glass-card-light p-4 rounded-xl opacity-50 relative">
        <div className="h-32" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-stone-400">아직 기록이 없어요..</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card-light p-4 rounded-xl">
      {/* 링 영역 (상단, 중앙 정렬) */}
      <div className="flex flex-col items-center gap-1 mb-3">
        <p className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase mb-1">
          WEEKLY HEAT EXPOSURE
        </p>
        {period === 'week' ? (
          <HeatRing current={heatMinutes} target={heatTarget} size={120} strokeWidth={8} color={color} />
        ) : weekRings ? (
          <MultiRingGrid rings={weekRings} color={color} />
        ) : null}
      </div>
      {/* 메트릭 (하단 가로) */}
      <MetricBar items={metrics} />
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
    return (
      <RingInsightCard
        period={period}
        color={color}
        heatMinutes={allInsight?.weeklyHeatMinutes ?? 0}
        heatTarget={allInsight?.heatTarget ?? 57}
        weekRings={weekRings}
        isEmpty={isEmpty || !allInsight}
        metrics={[
          { label: '신규 방문 장소', value: `${allInsight?.newPlaces ?? 0}곳` },
          { label: '재방문 점수', value: fmtVal(allInsight?.avgRevisitScore, '/5'), color },
        ]}
      />
    )
  }

  // === Bather (링 없음, 큰 숫자) ===
  if (tribe === 'bather') {
    if (isEmpty || !batherInsight) {
      return (
        <div className="glass-card-light p-4 rounded-xl opacity-50 relative">
          <div className="h-32" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-stone-400">아직 기록이 없어요..</p>
          </div>
        </div>
      )
    }
    return (
      <div className="glass-card-light p-4 rounded-xl">
        {/* 큰 숫자 (상단) */}
        <div className="text-center mb-3">
          <p className="text-[9px] font-bold text-stone-500 tracking-wide mb-1">총 입수 시간</p>
          <p className="font-heading text-[48px] font-semibold leading-none" style={{ color }}>
            {batherInsight.totalImmersionTime != null ? batherInsight.totalImmersionTime : '-'}
            <span className="text-lg text-stone-400 font-normal"> MIN</span>
          </p>
        </div>
        {/* 메트릭 (하단 가로) */}
        <MetricBar items={[
          { label: '평균 수온', value: fmtVal(batherInsight.avgHotBathTemp, '°C') },
          { label: '수질 만족도', value: fmtVal(batherInsight.avgWaterQuality, '/5'), color },
        ]} />
      </div>
    )
  }

  // === Saunner ===
  if (tribe === 'saunner') {
    return (
      <RingInsightCard
        period={period}
        color={color}
        heatMinutes={saunnerInsight?.weeklyHeatMinutes ?? 0}
        heatTarget={saunnerInsight?.heatTarget ?? 57}
        weekRings={weekRings}
        isEmpty={isEmpty || !saunnerInsight}
        metrics={[
          { label: '평균 온도차', value: fmtVal(saunnerInsight?.avgTempDiff, '°C') },
          { label: '토토노이 점수', value: fmtVal(saunnerInsight?.avgTotonoScore, '/5'), color },
        ]}
      />
    )
  }

  // === Jimi ===
  if (tribe === 'jimi') {
    return (
      <RingInsightCard
        period={period}
        color={color}
        heatMinutes={jimiInsight?.weeklyHeatMinutes ?? 0}
        heatTarget={jimiInsight?.heatTarget ?? 57}
        weekRings={weekRings}
        isEmpty={isEmpty || !jimiInsight}
        metrics={[
          { label: '평균 찜질 온도', value: fmtVal(jimiInsight?.avgJjimTemp, '°C') },
          { label: '발한 점수', value: fmtVal(jimiInsight?.avgSweatQuality, '/5'), color },
        ]}
      />
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
