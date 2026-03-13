'use client'

/**
 * XP 프로그레스바 — 미니멀 인라인 표시
 * Lv.N [██▌ 67%] 형태
 */

interface XpProgressBarProps {
  level: number
  progress: number // 0~1
}

export default function XpProgressBar({ level, progress }: XpProgressBarProps) {
  const percent = Math.round(progress * 100)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-bold text-stone-600 font-heading">
        Lv.{level}
      </span>
      <div className="w-12 h-1.5 rounded-full bg-stone-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: 'var(--color-primary)',
          }}
        />
      </div>
    </div>
  )
}
