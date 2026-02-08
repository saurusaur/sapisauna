// 슬라이더 컴포넌트 (부모 밖에 정의하여 불필요한 리마운트 방지)
export function Slider({
  label,
  value,
  min,
  max,
  unit = '',
  steps = [],
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  steps?: { value: number; label: string }[]
  onChange: (v: number) => void
}) {
  // 현재 value 이하인 step 중 가장 큰 value의 label 사용
  const descriptor = steps.length > 0
    ? [...steps].filter(s => s.value <= value).sort((a, b) => b.value - a.value)[0]?.label
      ?? steps[0]?.label
    : null

  return (
    <div className="py-4 border-b border-stone-100">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>
          {descriptor && <span className="text-stone-500 font-normal mr-1">{descriptor}</span>}
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

// 카운터 컴포넌트
export function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="py-4 border-b border-stone-100">
      <div className="flex justify-between items-center">
        <span className="font-medium text-stone-700">{label}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <span className="text-xl font-bold w-8 text-center" style={{ color: 'var(--color-orange)' }}>
            {value}
          </span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </div>
  )
}
