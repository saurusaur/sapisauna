/**
 * RoutineCard — 나의 평균 루틴
 * 트라이브별 HOT/ICE/REST/REPEAT 아이콘 슬롯
 * 데이터 있으면 채색, 없으면 outline
 */

import type { RoutineData } from '@/lib/history-stats'

interface RoutineCardProps {
  tribe: string        // 'bather' | 'saunner' | 'jimi'
  routine: RoutineData
  color: string        // 트라이브 CSS 컬러 변수
  isEmpty?: boolean    // 해당 기간 기록 없음 → 흐림 처리
}

// 트라이브별 아이콘 매핑
const ICON_MAP: Record<string, { icon: string; label: string }> = {
  'bather-hot': { icon: 'hot_tub', label: 'HOT' },
  'saunner-hot': { icon: 'sauna', label: 'HOT' },
  'jimi-hot': { icon: 'local_fire_department', label: 'HOT' },
  'ice': { icon: 'ac_unit', label: 'ICE' },
  'rest': { icon: 'airline_seat_recline_extra', label: 'REST' },
  'repeat': { icon: 'loop', label: 'REPEAT' },
}

interface SlotConfig {
  iconKey: string
  value: number | null
  format: (v: number) => string
}

function getSlots(tribe: string, routine: RoutineData): SlotConfig[] {
  const hotKey = `${tribe}-hot`
  const fmtMin = (v: number) => `${Math.round(v)}m`
  const fmtSec = (v: number) => `${Math.round(v)}s`
  const fmtRepeat = (v: number) => `x${v % 1 === 0 ? v : v.toFixed(1)}`

  if (tribe === 'jimi') {
    return [
      { iconKey: hotKey, value: routine.avgHeatTime, format: fmtMin },
      { iconKey: 'rest', value: routine.avgPauseTime, format: fmtMin },
      { iconKey: 'repeat', value: routine.avgRepeat, format: fmtRepeat },
    ]
  }
  return [
    { iconKey: hotKey, value: routine.avgHeatTime, format: fmtMin },
    { iconKey: 'ice', value: routine.avgIceTime, format: fmtSec },
    { iconKey: 'rest', value: routine.avgPauseTime, format: fmtMin },
    { iconKey: 'repeat', value: routine.avgRepeat, format: fmtRepeat },
  ]
}

export default function RoutineCard({ tribe, routine, color, isEmpty }: RoutineCardProps) {
  const slots = getSlots(tribe, routine)

  return (
    <div className="glass-card-light p-4 rounded-xl relative">
      {/* 카드 본체 — isEmpty면 흐림 처리 */}
      <div className={isEmpty ? 'opacity-30 pointer-events-none' : ''}>
        <p className="text-[11px] font-bold text-stone-500 text-center mb-3">
          나의 평균 루틴
        </p>
        <div className={`grid ${tribe === 'jimi' ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
          {slots.map((slot) => {
            const mapping = ICON_MAP[slot.iconKey]
            if (!mapping) return null
            const hasValue = slot.value != null && !isEmpty

            return (
              <div key={slot.iconKey} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={
                    hasValue
                      ? { backgroundColor: color, color: '#fff' }
                      : { border: '1.5px solid #d6d3d1', color: '#a8a29e' }
                  }
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '22px',
                      fontVariationSettings: hasValue
                        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    {mapping.icon}
                  </span>
                </div>
                <span
                  className="font-heading text-[15px] font-semibold"
                  style={{ color: hasValue ? color : '#d6d3d1' }}
                >
                  {hasValue ? slot.format(slot.value!) : '-'}
                </span>
                <span className="text-[8px] text-stone-400 font-medium tracking-wider uppercase">
                  {mapping.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {/* 기록 없을 때 오버레이 */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-stone-500 font-medium">기록을 추가해보세요!</p>
        </div>
      )}
    </div>
  )
}
