'use client'

/**
 * Chip — 필터/태그용 작은 알약형 버튼
 *
 * 사용처:
 * - explore 필터 패널 시설 칩 (interactive)
 * - explore/[id] 시설 상세 태그 (static)
 * - PlaceCard 시설 미니 태그 (static, mini)
 */

interface ChipProps {
  label: string
  icon?: string              // Material Symbols 아이콘명
  selected?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'        // sm: 카드 미니태그, md: 필터/상세 (기본)
  color?: string             // active 배경색 (기본: var(--color-green))
}

export default function Chip({
  label,
  icon,
  selected = false,
  onClick,
  size = 'md',
  color = 'var(--color-green)',
}: ChipProps) {
  const isInteractive = !!onClick

  const sizeClass = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'px-2.5 py-1 text-xs'

  const stateClass = selected
    ? 'text-white shadow-sm'
    : isInteractive
      ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      : 'bg-stone-100 text-stone-500'

  const Tag = isInteractive ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={`
        ${sizeClass} rounded-full font-medium transition-all
        inline-flex items-center gap-0.5
        ${stateClass}
      `}
      style={selected ? { backgroundColor: color } : {}}
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? '12px' : '14px' }}>{icon}</span>}
      {label}
    </Tag>
  )
}
