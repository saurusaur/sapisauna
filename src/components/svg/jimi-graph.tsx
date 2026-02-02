/**
 * Jimi 원형 프로그레스 바 SVG 컴포넌트
 * - restQuality 점수를 0~100%로 환산하여 원형 프로그레스
 * - 채워진 영역 내부에 입자(particle) 효과
 * - 중앙에 휴식 완충률(%) 수치 강조
 */

interface JimiGraphProps {
  restQuality: number  // 1-5
  cleanliness: number  // 1-5
}

// 시드 기반 의사 난수 (렌더링 안정성 위해)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function JimiGraph({ restQuality }: JimiGraphProps) {
  const size = 300
  const center = size / 2
  const radius = 120
  const strokeWidth = 12
  const percentage = (restQuality / 5) * 100

  // 원형 프로그레스 계산
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // 입자 효과: percentage에 비례하는 개수
  const particleCount = Math.floor(percentage / 5) // 0~20개
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    // 프로그레스 영역 내부에 배치 (원 안쪽)
    const angle = seededRandom(i * 13 + 7) * Math.PI * 2
    const dist = seededRandom(i * 17 + 3) * (radius - strokeWidth - 10) * 0.8
    const x = center + Math.cos(angle) * dist
    const y = center + Math.sin(angle) * dist
    const r = 2 + seededRandom(i * 23 + 11) * 2 // 2~4px
    const opacity = 0.3 + seededRandom(i * 31 + 5) * 0.4 // 0.3~0.7

    return { x, y, r, opacity }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* 배경 트랙 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e5e5e5"
        strokeWidth={strokeWidth}
      />

      {/* 프로그레스 바 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#22C55E"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${center} ${center})`}
      />

      {/* 입자 효과 */}
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="#22C55E"
          fillOpacity={p.opacity}
        />
      ))}

      {/* 중앙 퍼센트 수치 */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <tspan fontSize="36" fontWeight="bold" fill="#1f2937">
          {Math.round(percentage)}
        </tspan>
        <tspan fontSize="16" fill="#6b7280">%</tspan>
      </text>
      <text
        x={center}
        y={center + 22}
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        휴식 완충률
      </text>
    </svg>
  )
}
