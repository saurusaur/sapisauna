/**
 * KpiRow — 이번 달 요약 KPI 3칸
 * 기록한 날 | 다녀온 곳 | 역대 방문
 */

import type { KpiData } from '@/lib/history-stats'

interface KpiRowProps extends KpiData {
  accentColor?: string // 트라이브 컬러 (기본: stone)
}

export default function KpiRow({
  recordedDays,
  daysInMonth,
  uniquePlaces,
  allTimeCount,
  accentColor,
}: KpiRowProps) {
  const items = [
    {
      label: '기록한 날',
      value: String(recordedDays),
      sub: `/${daysInMonth}`,
    },
    {
      label: '다녀온 곳',
      value: String(uniquePlaces).padStart(2, '0'),
      sub: null,
    },
    {
      label: '역대 방문',
      value: String(allTimeCount),
      sub: null,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass-card-light p-3 rounded-xl"
        >
          <p
            className="text-[10px] font-semibold mb-1"
            style={{ color: accentColor || '#78716c' }}
          >
            {item.label}
          </p>
          <p className="font-heading text-2xl font-semibold text-stone-800">
            {item.value}
            {item.sub && (
              <span className="text-sm text-stone-400 font-normal">{item.sub}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
