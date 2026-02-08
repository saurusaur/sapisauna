/**
 * Bather 동심원 SVG 컴포넌트
 * - 온도에 따른 절대적인 원 크기 (온도 높으면 크게)
 * - 수질에 따른 색상 (탁함 → 흰색 빛남)
 * - 거의 연속된 선 (dash 5% 수준으로 미세하게만)
 * - 가장자리 fade out
 */

interface BatherGraphProps {
  waterQuality: number
  hotBathTemp: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function BatherGraph({ waterQuality, hotBathTemp }: BatherGraphProps) {
  const size = 280
  const center = size / 2

  // 동심원 개수는 고정 (8개)
  const circleCount = 8
  // 온도에 따른 원 크기 (핵심!)
  // 온도 35°C: 작음 (maxRadius 60) / 온도 45°C: 크게 (maxRadius 125)
  const tempNormalized = Math.min(Math.max((hotBathTemp - 35) / 10, 0), 1) // 0~1
  const minRadius = 25
  const maxRadius = 80 + tempNormalized * 80 // 60 ~ 125
  const radiusStep = (maxRadius - minRadius) / Math.max(circleCount - 1, 1)

  // 수질에 따른 색상 (컬러로만 표현)
  // 1: 탁한 노란빛 → 5: 흰색으로 빛남
  const getColor = (quality: number) => {
    const colors = [
      { h: 45, s: 30, l: 65 },   // 1: 탁한 황톤
      { h: 80, s: 30, l: 70 },   // 2: 연한 올리브
      { h: 150, s: 25, l: 75 },  // 3: 중간 민트
      { h: 180, s: 20, l: 82 },  // 4: 연한 청록
      { h: 195, s: 10, l: 95 },  // 5: 거의 흰색 (빛남)
    ]
    return colors[quality - 1] || colors[2]
  }

  const color = getColor(waterQuality)

  // 미세한 dash 패턴 (기존의 5% 수준 - 거의 연속선)
  // dash 200, gap 2~4 정도로 거의 안 끊김
  const getSubtleDash = (circleIndex: number, radius: number): string => {
    const circumference = 2 * Math.PI * radius
    // 전체 둘레의 95%는 선, 5%만 끊김
    const dashLen = circumference * 0.18 + seededRandom(circleIndex * 13) * circumference * 0.05
    const gapLen = 1 + seededRandom(circleIndex * 19) * 2 // 1~3px 아주 짧은 끊김
    return `${dashLen} ${gapLen}`
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* 가장자리 페이드아웃 마스크 */}
        <radialGradient id="bather-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="white" stopOpacity="1" />
          <stop offset="80%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="bather-mask">
          <circle cx={center} cy={center} r={maxRadius + 15} fill="url(#bather-fade)" />
        </mask>
      </defs>

      {/* 동심원들 */}
      <g mask="url(#bather-mask)">
        {Array.from({ length: circleCount }).map((_, i) => {
          const radius = minRadius + i * radiusStep
          const distanceRatio = i / Math.max(circleCount - 1, 1)

          // 중심에서 멀어질수록 연해짐
          const opacity = 0.9 - distanceRatio * 0.5

          // 미세한 dash 패턴
          const dashPattern = getSubtleDash(i, radius)
          const dashOffset = seededRandom(i * 31) * 20

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`hsl(${color.h}, ${color.s}%, ${color.l}%)`}
              strokeWidth={1.8}
              strokeOpacity={opacity}
              strokeDasharray={dashPattern}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </svg>
  )
}
