'use client'

/**
 * ToggleSwitch — on/off 토글 스위치
 *
 * 사용처:
 * - explore 24h 필터
 * - explore/type 24h 필터
 * - place/add 24시 영업
 * - settings 알림 토글
 */

interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  color?: string             // on 상태 배경색 (기본: var(--color-primary))
}

export default function ToggleSwitch({
  checked,
  onChange,
  color = 'var(--color-primary)',
}: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
      style={{ backgroundColor: checked ? color : '#d6d3d1' }}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
