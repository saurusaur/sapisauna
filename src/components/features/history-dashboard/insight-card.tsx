/**
 * InsightCard — 트라이브별 인사이트 카드
 * 전체: 링 + 신규 방문 장소 + 재방문 점수
 * Bather: 총 입수 시간 (큰 숫자) + 평균 수온 + 수질 만족도
 * Saunner: 링 + 평균 온도차 + 토토노이 점수
 * Jimi: 링 + 평균 찜질 온도 + 발한 점수
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
}

// 값 포맷: null이면 '-'
function fmtVal(v: number | null | undefined, suffix = ''): string {
  if (v == null) return '-'
  return `${v % 1 === 0 ? v : v.toFixed(1)}${suffix}`
}

// 메트릭 행 (라벨 + 값)
function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-stone-500 tracking-wide">{label}</p>
      <p
        className="font-heading text-2xl font-semibold"
        style={{ color: color || '#292524' }}
      >
        {value}
      </p>
    </div>
  )
}

// 2x2 미니 링 그리드 (MONTH 뷰)
function MiniRingGrid({ rings, color }: { rings: WeekRingData[]; color: string }) {
  // 최대 4개 (5주인 경우도 4개까지)
  const displayed = rings.slice(0, 4)
  return (
    <div className="grid grid-cols-2 gap-1" style={{ width: 100, height: 100 }}>
      {displayed.map((ring) => (
        <div key={ring.weekLabel} className="flex flex-col items-center gap-0.5">
          <HeatRing
            current={ring.heatMinutes}
            target={ring.target}
            size={42}
            strokeWidth={3.5}
            color={ring.heatMinutes > 0 ? color : '#d6d3d1'}
            showLabel
          />
          <span className="text-[7px] text-stone-400 font-semibold">{ring.weekLabel}</span>
        </div>
      ))}
    </div>
  )
}

export default function InsightCard({
  tribe,
  period,
  color,
  weekRings,
  allInsight,
  batherInsight,
  saunnerInsight,
  jimiInsight,
}: InsightCardProps) {

  // === 전체 탭 ===
  if (tribe === 'all' && allInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          {/* 좌측: 링 */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {period === 'week' ? (
              <HeatRing
                current={allInsight.weeklyHeatMinutes}
                target={allInsight.heatTarget}
                size={100}
                color={color}
              />
            ) : weekRings ? (
              <MiniRingGrid rings={weekRings} color={color} />
            ) : null}
            <span className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase text-center leading-tight">
              WEEKLY HEAT<br />EXPOSURE
            </span>
          </div>
          {/* 우측: 메트릭 */}
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow
              label="신규 방문 장소"
              value={`${allInsight.newPlaces}곳`}
            />
            <MetricRow
              label="재방문 점수"
              value={fmtVal(allInsight.avgRevisitScore, '/5')}
              color={color}
            />
          </div>
        </div>
      </div>
    )
  }

  // === Bather ===
  if (tribe === 'bather' && batherInsight) {
    return (
      <div className="glass-card-light p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[9px] font-bold text-stone-500 tracking-wide">총 입수 시간</p>
            <p
              className="font-heading text-[42px] font-semibold leading-none"
              style={{ color }}
            >
              {batherInsight.totalImmersionTime != null
                ? batherInsight.totalImmersionTime
                : '-'}
              <span className="text-base text-stone-400 font-normal"> MIN</span>
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow
              label="평균 수온"
              value={fmtVal(batherInsight.avgHotBathTemp, '°C')}
            />
            <MetricRow
              label="수질 만족도"
              value={fmtVal(batherInsight.avgWaterQuality, '/5')}
              color={color}
            />
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
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {period === 'week' ? (
              <HeatRing
                current={saunnerInsight.weeklyHeatMinutes}
                target={saunnerInsight.heatTarget}
                size={100}
                color={color}
              />
            ) : weekRings ? (
              <MiniRingGrid rings={weekRings} color={color} />
            ) : null}
            <span className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase text-center leading-tight">
              WEEKLY HEAT<br />EXPOSURE
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow
              label="평균 온도차"
              value={fmtVal(saunnerInsight.avgTempDiff, '°C')}
            />
            <MetricRow
              label="토토노이 점수"
              value={fmtVal(saunnerInsight.avgTotonoScore, '/5')}
              color={color}
            />
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
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {period === 'week' ? (
              <HeatRing
                current={jimiInsight.weeklyHeatMinutes}
                target={jimiInsight.heatTarget}
                size={100}
                color={color}
              />
            ) : weekRings ? (
              <MiniRingGrid rings={weekRings} color={color} />
            ) : null}
            <span className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase text-center leading-tight">
              WEEKLY HEAT<br />EXPOSURE
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <MetricRow
              label="평균 찜질 온도"
              value={fmtVal(jimiInsight.avgJjimTemp, '°C')}
            />
            <MetricRow
              label="발한 점수"
              value={fmtVal(jimiInsight.avgSweatQuality, '/5')}
              color={color}
            />
          </div>
        </div>
      </div>
    )
  }

  // 데이터 없음 fallback
  return (
    <div className="glass-card-light p-4 rounded-xl">
      <div className="text-center py-6 text-stone-400">
        <span className="material-symbols-rounded text-3xl opacity-30 block mb-2">water_drop</span>
        <p className="text-sm">기록이 더 쌓이면 보여드릴게요</p>
      </div>
    </div>
  )
}
