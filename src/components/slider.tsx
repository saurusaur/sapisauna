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
import { useRef } from 'react'

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
  /** "slider"=기본, "chip"=넘버 칩, "seal"=도장 씰 평가, "stamp"=통일 온도 슬라이더 */
  variant?: 'slider' | 'chip' | 'seal' | 'stamp'
}) {
  // 현재 값 이하인 step 중 가장 큰 value의 label
  const descriptor = steps.length > 0
    ? [...steps].filter(s => s.value <= value).sort((a, b) => b.value - a.value)[0]?.label
      ?? steps[0]?.label
    : null

  // ── seal / stamp 공용: 온도 바 드래그 ──
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const applyBar = (clientX: number) => {
    const el = barRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    onChange(Math.round(min + p * (max - min)))
  }

  // ── seal variant (도장 씰 평가) ──
  if (variant === 'seal') {
    // 라벨 없는 리추얼 씰은 좁은 가운데 칸이라 약간 작게(22), 라벨 있는 평가/더자세히는 24
    const cs = label ? 24 : 22
    // 씰은 칸을 가득 채워 펼침 + 각 버튼 flex-1·py-2.5로 히트존 확대(원 크기는 유지)
    const sealBtns = () => (
      <div className={`flex items-center flex-1 min-w-0 ${inactive ? 'opacity-50' : ''}`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} type="button" onClick={() => onChange(value === v ? 0 : v)} className="flex-1 flex items-center justify-center py-2.5 transition-transform active:scale-90">
            <span className={`rounded-full relative shrink-0 ${value >= v ? 'shadow-sm' : ''}`} style={{ width: cs, height: cs, backgroundColor: value >= v ? 'var(--color-primary)' : 'var(--color-border)' }}>
              {value >= v && <span className="absolute rounded-full pointer-events-none" style={{ inset: 6, border: '1.5px solid var(--color-card)' }} />}
            </span>
          </button>
        ))}
      </div>
    )
    // 라벨 없음(리추얼): 좌측 스텝 코멘트(빈 값이면 공백 — '—' 안 보임, 한 줄 고정), 씰을 칸 끝까지 펼침
    if (!label) {
      return (
        <div className="flex items-center gap-2 h-11">
          <span className="text-xs font-bold shrink-0 text-left pl-3 whitespace-nowrap overflow-hidden" style={{ width: 40, color: 'var(--color-primary)' }}>{value ? (descriptor ?? '') : ''}</span>
          {sealBtns()}
        </div>
      )
    }
    // 라벨 있음(수질/또갈래요/청결도): 라벨 | [씰(칸 채움) + 단어(우측 끝, 폭 고정·2줄 고정 박스 → 줄바꿈해도 행 안 밀림)]
    return (
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: '60px 1fr' }}>
        <span className="text-[13px] font-bold text-stone-700 whitespace-nowrap">{label}</span>
        <div className="flex items-center gap-2 min-w-0">
          {sealBtns()}
          <span className="text-[10px] font-bold shrink-0 flex items-center justify-end text-right" style={{ width: 50, height: 26, lineHeight: '12px', wordBreak: 'keep-all', color: value ? 'var(--color-primary)' : 'var(--color-muted-fg)' }}>{value ? (descriptor ?? '') : ''}</span>
        </div>
      </div>
    )
  }

  // ── stamp variant (통일 온도 슬라이더: t-stamp 트랙 + 드래그 + D2 라벨) ──
  if (variant === 'stamp') {
    const pct = Math.round(((value - min) / (max - min)) * 100)
    return (
      <div ref={barRef} className="relative h-11 rounded-xl overflow-hidden cursor-ew-resize touch-none select-none" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); applyBar(e.clientX) }}
        onPointerMove={(e) => { if (dragging.current) applyBar(e.clientX) }}
        onPointerUp={() => { dragging.current = false }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)', opacity: 0.9 }} />
        {/* 채움(빨강)이 덮으면 흰 글씨, 흰 트랙 위면 어두운 글씨로 자동 전환 */}
        {descriptor && <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${pct > 12 ? 'text-white' : 'text-stone-700'}`}>{descriptor}</span>}
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold font-heading tabular-nums pointer-events-none ${pct > 88 ? 'text-white' : 'text-stone-800'}`}>{value}{unit}</span>
        {/* 핸들 = 평가 씰 동그라미와 동일 그래픽·크기(24px, 빨강+흰 이너링) */}
        <span className="absolute top-1/2 rounded-full pointer-events-none shadow-md" style={{ left: `${pct}%`, width: 24, height: 24, transform: 'translate(-50%,-50%)', backgroundColor: 'var(--color-primary)' }}>
          <span className="absolute rounded-full" style={{ inset: 6, border: '1.5px solid var(--color-card)' }} />
        </span>
      </div>
    )
  }

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
  step = 1,
  unit = '분',
  onChange,
}: {
  label: string
  value: number | null
  placeholder: number
  min: number
  max: number
  step?: number
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
          onClick={isActive ? (e) => { e.stopPropagation(); onChange(Math.max(min, displayValue - step)) } : undefined}
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
          onClick={isActive ? (e) => { e.stopPropagation(); onChange(Math.min(max, displayValue + step)) } : undefined}
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
