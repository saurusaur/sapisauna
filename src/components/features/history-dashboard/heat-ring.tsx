/**
 * HeatRing — SVG 도넛 링 컴포넌트
 * 주간 heat exposure 진행도를 시각적으로 표시
 * 단독 (WEEK 뷰)과 미니 (MONTH 2x2 그리드) 겸용
 */

interface HeatRingProps {
  current: number        // 달성 분
  target: number         // 목표 분 (57)
  size?: number          // px (기본 100)
  strokeWidth?: number   // 기본 7
  color?: string         // 링 색상 (기본 var(--color-primary))
  showLabel?: boolean    // 중앙에 분 표시 (기본 true)
}

export default function HeatRing({
  current,
  target,
  size = 100,
  strokeWidth = 7,
  color = 'var(--color-primary)',
  showLabel = true,
}: HeatRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // 100% 넘어도 링은 꽉 참 상태로 표시
  const percent = Math.min(current / target, 1)
  const dashoffset = circumference * (1 - percent)

  // 미니 사이즈 판별 (50px 이하)
  const isMini = size <= 50

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ width: size, height: size }}
      >
        {/* 배경 링 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-stone-200/40"
          strokeWidth={strokeWidth}
        />
        {/* 진행 링 */}
        {current > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>

      {/* 중앙 텍스트 */}
      {showLabel && (
        <div className="relative z-10 flex flex-col items-center">
          <span
            className={`font-heading font-semibold text-stone-700 ${
              isMini ? 'text-[11px]' : 'text-2xl'
            }`}
          >
            {current > 0 ? (current >= target ? `${current}` : current) : '0'}
          </span>
          {!isMini && (
            <span className="text-[10px] text-stone-400">/{target}M</span>
          )}
        </div>
      )}
    </div>
  )
}
