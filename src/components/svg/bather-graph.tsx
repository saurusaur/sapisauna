/**
 * Bather 동심원 물결 SVG 컴포넌트
 * - waterQuality 점수에 비례하여 동심원 개수가 늘어남
 * - 중심에서 바깥으로 갈수록 투명도가 낮아짐
 * - 중앙에 입욕 온도 수치 강조
 */

interface BatherGraphProps {
  waterQuality: number  // 1-5
  hotBathTemp: number   // °C
}

export default function BatherGraph({ waterQuality, hotBathTemp }: BatherGraphProps) {
  const size = 300
  const center = size / 2

  // 동심원 설정: waterQuality 값만큼 원을 그림
  const circleCount = waterQuality
  const radii = [30, 55, 80, 105, 130]
  const baseOpacity = 1.0
  const opacityStep = 0.2

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <defs>
        {/* 동심원 애니메이션용 (선택적) */}
        {Array.from({ length: circleCount }).map((_, i) => (
          <radialGradient key={`grad-${i}`} id={`bather-ring-${i}`}>
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0} />
            <stop offset="80%" stopColor="#3B82F6" stopOpacity={baseOpacity - i * opacityStep} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      {/* 동심원: 바깥부터 그려서 안쪽이 위에 오도록 */}
      {Array.from({ length: circleCount })
        .map((_, i) => i)
        .reverse()
        .map((i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radii[i]}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeOpacity={baseOpacity - i * opacityStep}
          />
        ))}

      {/* 중앙 온도 수치 */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <tspan fontSize="36" fontWeight="bold" fill="#1f2937">
          {hotBathTemp}
        </tspan>
        <tspan fontSize="14" fill="#6b7280">°C</tspan>
      </text>
      <text
        x={center}
        y={center + 22}
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        입욕 온도
      </text>
    </svg>
  )
}
