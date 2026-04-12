/**
 * PeriodToggle — WEEK / MONTH 기간 토글
 * 루틴/인사이트 카드의 데이터 기간을 전환
 */

export type Period = 'week' | 'month'

interface PeriodToggleProps {
  value: Period
  onChange: (period: Period) => void
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const options: { key: Period; label: string }[] = [
    { key: 'week', label: 'WEEK' },
    { key: 'month', label: 'MONTH' },
  ]

  return (
    <div className="flex justify-center">
      <div className="flex bg-stone-100/60 backdrop-blur-sm rounded-lg p-0.5">
        {options.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-semibold tracking-wide transition-all ${
              value === key
                ? 'bg-white/80 shadow-sm text-stone-700'
                : 'text-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
