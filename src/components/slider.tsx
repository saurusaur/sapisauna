/**
 * 슬라이더 / 카운터 컴포넌트
 *
 * - Slider: 가로 한 줄 [라벨] [슬라이더] [디스크립터 값]
 *   inactive 옵션: 활성화 전 흐릿하게 표시, 탭하면 활성화
 *   variant="chip": 원형 넘버 칩 (1-5), 선택 시 빨간 배경
 * - RoutineCounter: 가로 한 줄 [라벨] [-] [값 mins] [+]
 *   value=null → 비활성(흐릿), 탭하면 예시값으로 활성화
 * - Counter: 가로 한 줄 [라벨] [-] [값] [+] [단위]
 */

// ─────────────────────────────────────────────────────────
// Slider
// ─────────────────────────────────────────────────────────
export function Slider({
  label,
  value,
  min,
  max,
  unit = '',
  steps = [],
  onChange,
  inactive = false,
  onActivate,
  showReset = false,
  onReset,
  variant = 'slider',
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  steps?: { value: number; label: string }[]
  onChange: (v: number) => void
  /** true이면 흐릿하게 표시, 탭하면 onActivate 호출 */
  inactive?: boolean
  onActivate?: () => void
  /** true이면 우측에 × 리셋 버튼 표시 */
  showReset?: boolean
  onReset?: () => void
  /** "slider" = 기본 슬라이더, "chip" = 원형 넘버 칩 */
  variant?: 'slider' | 'chip'
}) {
  // 현재 값 이하인 step 중 가장 큰 value의 label
  const descriptor = steps.length > 0
    ? [...steps].filter(s => s.value <= value).sort((a, b) => b.value - a.value)[0]?.label
      ?? steps[0]?.label
    : null

  // ── chip variant ──
  if (variant === 'chip') {
    const isInactive = inactive
    return (
      <div
        className={`py-3 ${label ? 'border-b border-stone-100' : ''} ${isInactive ? 'cursor-pointer' : ''}`}
        onClick={isInactive ? onActivate : undefined}
      >
        {label && <span className="text-sm font-medium text-stone-700">{label}</span>}
        <div className={`flex items-start gap-3 justify-center ${label ? 'mt-3' : 'mt-1'} transition-opacity ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
          {steps.map((step) => (
            <button
              key={step.value}
              onClick={() => onChange(step.value)}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  !isInactive && value === step.value
                    ? 'text-white shadow-md scale-110'
                    : 'bg-stone-100 text-stone-500'
                }`}
                style={!isInactive && value === step.value ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                {step.value}
              </div>
              <span className={`text-[10px] ${
                !isInactive && value === step.value ? 'font-semibold text-stone-700' : 'text-stone-400'
              }`}>
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── slider variant (기본) ──
  return (
    <div
      className={`py-3 border-b border-stone-100 ${inactive ? 'cursor-pointer select-none' : ''}`}
      onClick={inactive ? onActivate : undefined}
    >
      {/* 상단: 라벨(좌) + descriptor·값(우) */}
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <div className={`flex items-baseline gap-1.5 transition-opacity ${inactive ? 'opacity-30' : ''}`}>
          {descriptor && (
            <span className="text-xs text-stone-400">{descriptor}</span>
          )}
          <span
            className={`font-bold tabular-nums ${unit ? 'text-2xl' : 'text-sm'}`}
            style={{ color: inactive ? undefined : 'var(--color-primary)' }}
          >
            {value}
            {unit && <span className="text-base font-semibold ml-0.5">{unit}</span>}
          </span>
          {/* × 리셋 버튼 (활성 optional 슬라이더에만) */}
          {showReset && onReset && (
            <button
              onClick={(e) => { e.stopPropagation(); onReset() }}
              className="text-stone-400 hover:text-stone-600 transition-colors ml-0.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* 하단: 슬라이더 — 항상 full width = 모든 항목 동일 길이 */}
      <div className={`transition-opacity ${inactive ? 'opacity-30 pointer-events-none' : ''}`}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// RoutineCounter
// ─────────────────────────────────────────────────────────
// value=null → 비활성 상태 (컨트롤 흐릿, 탭하면 예시값으로 활성화)
// value=number → 활성 상태 (-/+ + × 초기화)
export function RoutineCounter({
  label,
  value,
  placeholder,
  min,
  max,
  unit = '분',
  onChange,
}: {
  label: string
  value: number | null
  placeholder: number
  min: number
  max: number
  unit?: string
  onChange: (v: number | null) => void
}) {
  const isActive = value !== null
  const displayValue = isActive ? value : placeholder

  return (
    <div
      className={`py-2.5 border-b border-stone-100 flex items-center gap-2 min-h-[44px] ${!isActive ? 'cursor-pointer select-none' : ''}`}
      onClick={!isActive ? () => onChange(placeholder) : undefined}
    >
      {/* 라벨 — 항상 진하게 */}
      <span className="text-sm font-medium text-stone-700 flex-shrink-0 w-12">{label}</span>

      {/* 컨트롤 — 비활성 시 흐릿 */}
      <div className={`flex items-center gap-2 ml-auto transition-opacity ${!isActive ? 'opacity-30' : ''}`}>
        {/* × 초기화 버튼 (활성 시만) */}
        {isActive && (
          <button
            onClick={() => onChange(null)}
            className="text-stone-300 hover:text-stone-500 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          </button>
        )}

        <button
          onClick={isActive ? (e) => { e.stopPropagation(); onChange(Math.max(min, displayValue - 1)) } : undefined}
          className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
        </button>

        <span
          className="text-sm font-bold w-8 text-center tabular-nums"
          style={{ color: isActive ? 'var(--color-primary)' : undefined }}
        >
          {displayValue}
        </span>

        <button
          onClick={isActive ? (e) => { e.stopPropagation(); onChange(Math.min(max, displayValue + 1)) } : undefined}
          className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        </button>

        <span className="text-xs text-stone-400 w-6">{unit}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Counter (세트 등 정수 카운터)
// ─────────────────────────────────────────────────────────
export function Counter({
  label,
  value,
  min,
  max,
  unit = '세트',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="py-2.5 border-b border-stone-100 flex items-center gap-2 min-h-[44px]">
      <span className="text-sm font-medium text-stone-700 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
        </button>
        <span className="text-sm font-bold w-8 text-center tabular-nums" style={{ color: 'var(--color-primary)' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        </button>
        <span className="text-xs text-stone-400 w-6">{unit}</span>
      </div>
    </div>
  )
}
