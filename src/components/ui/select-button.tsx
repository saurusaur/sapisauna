'use client'

/**
 * SelectButton — 아이콘+텍스트 선택 버튼 (알약형)
 *
 * 사용처:
 * - log/deep 옵션 선택 (동행자, 목적, 혼잡도)
 * - log/deep 체크박스 토글 (세신, 매점)
 * - place/add 시설 선택 칩
 */

interface SelectButtonProps {
  label: string
  icon?: string              // Material Symbols 아이콘명
  selected?: boolean
  onClick: () => void
  color?: string             // active 배경색 (기본: var(--color-primary))
}

export default function SelectButton({
  label,
  icon,
  selected = false,
  onClick,
  color = 'var(--color-primary)',
}: SelectButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium transition-all
        inline-flex items-center gap-1
        ${selected
          ? 'text-white shadow-md'
          : 'text-stone-600 hover:shadow-md'
        }
      `}
      style={selected
        ? { backgroundColor: color }
        : { background: 'hsl(0 0% 100% / .65)', border: '0.5px solid hsl(0 0% 100% / .8)', boxShadow: '0 2px 8px -2px hsl(0 10% 15% / .08)' }
      }
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>}
      {label}
    </button>
  )
}
