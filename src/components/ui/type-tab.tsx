'use client'

/**
 * TypeTab — 타입별 컬러 탭 버튼
 *
 * 사용처:
 * - history 타입 필터 (🔥 Saunner / 🛁 Bather / 🥚 Jimi / 전체)
 * - explore 추천 탭
 */

interface TypeTabProps {
  label: string
  active?: boolean
  onClick: () => void
  color?: string             // active 배경색 (기본: var(--color-green))
}

export default function TypeTab({
  label,
  active = false,
  onClick,
  color = 'var(--color-primary)',
}: TypeTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap
        ${active
          ? 'text-white shadow-md'
          : 'glass-card-light text-stone-500 hover:text-stone-700'
        }
      `}
      style={active ? { backgroundColor: color } : {}}
    >
      {label}
    </button>
  )
}
