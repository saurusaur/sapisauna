'use client'

/**
 * 사-리스트 피드 상단 필터 캡슐 (내 리스트 / 최신 / 인기)
 */

interface SaListFilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

export default function SaListFilterChip({ label, active, onClick }: SaListFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border
        ${active
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white/90 text-stone-600 border-stone-200 hover:border-stone-300'}
      `}
      style={active ? { backgroundColor: 'var(--color-primary)' } : {}}
    >
      {label}
    </button>
  )
}
