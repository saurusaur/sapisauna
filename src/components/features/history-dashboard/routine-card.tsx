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
  const fmtRepeat = (v: number) => `x${v % 1 === 0 ? v : v.toFixed(1)}`

  if (tribe === 'jimi') {
    // Jimi: 3슬롯 (ICE 없음)
    return [
      { iconKey: hotKey, value: routine.avgHeatTime, format: fmtMin },
      { iconKey: 'rest', value: routine.avgPauseTime, format: fmtMin },
      { iconKey: 'repeat', value: routine.avgRepeat, format: fmtRepeat },
    ]
  }
  // Bather, Saunner: 4슬롯
  return [
    { iconKey: hotKey, value: routine.avgHeatTime, format: fmtMin },
    { iconKey: 'ice', value: routine.avgIceTime, format: fmtMin },
    { iconKey: 'rest', value: routine.avgPauseTime, format: fmtMin },
    { iconKey: 'repeat', value: routine.avgRepeat, format: fmtRepeat },
  ]
}

export default function RoutineCard({ tribe, routine, color }: RoutineCardProps) {
  const slots = getSlots(tribe, routine)

  return (
    <div className="glass-card-light p-4 rounded-xl">
      <p className="text-[11px] font-bold text-stone-500 text-center mb-3">
        나의 평균 루틴
      </p>
      <div className={`grid ${tribe === 'jimi' ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
        {slots.map((slot) => {
          const mapping = ICON_MAP[slot.iconKey]
          if (!mapping) return null
          const hasValue = slot.value != null

          return (
            <div key={slot.iconKey} className="flex flex-col items-center gap-1.5">
              {/* 아이콘 박스 */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={
                  hasValue
                    ? { backgroundColor: color, color: '#fff' }
                    : { border: '1.5px solid #d6d3d1', color: '#a8a29e' }
                }
              >
                <span
                  className={`material-symbols-rounded ${hasValue ? 'filled' : ''}`}
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
              {/* 값 */}
              <span
                className="font-heading text-[15px] font-semibold"
                style={{ color: hasValue ? color : '#d6d3d1' }}
              >
                {hasValue ? slot.format(slot.value!) : '-'}
              </span>
              {/* 라벨 */}
              <span className="text-[8px] text-stone-400 font-medium tracking-wider uppercase">
                {mapping.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
