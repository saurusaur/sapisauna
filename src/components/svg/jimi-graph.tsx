/**
 * Jimi 프로그레스 링 SVG 컴포넌트
 * - 링: 얇은 흰색 테두리, 바깥으로 넓게 퍼지는 세련된 디퓨즈 글로우
 * - 내부: 액체가 아래에서 위로 차오르는 느낌 (출렁이는 두 겹의 반투명 물 표면)
 * - jjimTemp 높을수록 동그라미가 꽉 참 (60°C ≈ 10%, 100°C = 100%)
 * - cleanliness → 글로우 색상/강도
 */

interface JimiGraphProps {
  cleanliness: number
  jjimTemp?: number  // 선택 — 한증막 없는 찜질방 또는 미입력 시 undefined
}

export default function JimiGraph({ cleanliness, jjimTemp }: JimiGraphProps) {
  const size = 280
  const center = size / 2
  const ringRadius = 90
  const strokeWidth = 1.2 // 얇은 테두리

  // 청결도에 따른 글로우 색상 (링은 흰색, 글로우만 색상)
  // 1: 탁한 올리브 → 5: 빛나는 에메랄드
  const getGlowColor = (clean: number) => {
    const colors = [
      { glow: '#9AA87A', blur: 12 },   // 1: 탁함
      { glow: '#A4BA84', blur: 16 },   // 2
      { glow: '#AEDA8C', blur: 20 },   // 3: 중간
      { glow: '#90EAB2', blur: 26 },   // 4
      { glow: '#88FFB8', blur: 35 },   // 5: 빛남
    ]
    return colors[clean - 1] || colors[2]
  }

  const glowStyle = getGlowColor(cleanliness)

  // 글로우 강도 (크기가 아닌 짙기로 표현)
  const glowIntensity = 0.15 + cleanliness * 0.12 // 0.27 ~ 0.75

  // 물 채워짐 높이 — jjimTemp 기반
  // 60°C → fillRatio 0.1 (거의 빔), 100°C → fillRatio 1.0 (꽉 참)
  // 미입력(undefined) → 0.35 (기본 상태)
  const fillRatio = jjimTemp !== undefined
    ? Math.min(Math.max((jjimTemp - 60) / 40, 0), 1) * 0.9 + 0.1
    : 0.35

  // 아래에서 위로 채워짐: fillRatio가 높을수록 waterTopY가 위로 올라감
  const waterTopY = center + ringRadius * (1 - fillRatio * 2)

  // 출렁이는 물결 경로 생성 - 아래에서 위로 채워지는 방식
  const generateWavePath = (topY: number, phase: number, amplitude: number): string => {
    const innerRadius = ringRadius - 2
    const points: string[] = []
    const segments = 80

    // 물 표면의 좌우 끝점 계산 (원과 수평선의 교점)
    const clampedTopY = Math.max(center - innerRadius, Math.min(center + innerRadius, topY))
    const dy = clampedTopY - center
    const halfWidth = Math.sqrt(Math.max(0, innerRadius * innerRadius - dy * dy))

    if (halfWidth <= 0) {
      return '' // 물이 없음
    }

    const leftX = center - halfWidth
    const rightX = center + halfWidth

    // 물결 표면 그리기 (왼쪽에서 오른쪽으로)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = leftX + t * (rightX - leftX)
      const waveOffset = Math.sin(t * Math.PI * 3 + phase) * amplitude
      const y = clampedTopY + waveOffset

      if (i === 0) {
        points.push(`M ${x} ${y}`)
      } else {
        points.push(`L ${x} ${y}`)
      }
    }

    // 큰 호로 아래쪽을 감싸기
    points.push(`A ${innerRadius} ${innerRadius} 0 1 1 ${leftX} ${clampedTopY}`)
    points.push('Z')

    return points.join(' ')
  }

  // 물결 진폭 (채워진 양이 적을수록 더 많이 출렁임)
  const waveAmplitude = 4 + (1 - fillRatio) * 6

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* 세련된 디퓨즈 글로우 */}
        <filter id="jimi-diffuse-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={12} result="blur1" />
          <feGaussianBlur stdDeviation={5} result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
          </feMerge>
        </filter>

        {/* 원 안쪽만 보이도록 클리핑 */}
        <clipPath id="jimi-clip">
          <circle cx={center} cy={center} r={ringRadius - 2} />
        </clipPath>

        {/* 물 그라데이션 (청결도 색상 기반) - 위에서 아래로 진해짐 */}
        <linearGradient id="jimi-water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={glowStyle.glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={glowStyle.glow} stopOpacity="0.7" />
        </linearGradient>

        {/* 글로우 그라데이션 - 더 넓게 퍼짐 (짙기로 표현) */}
        <radialGradient id="jimi-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={glowStyle.glow} stopOpacity="0" />
          <stop offset="75%" stopColor={glowStyle.glow} stopOpacity={glowIntensity * 0.7} />
          <stop offset="88%" stopColor={glowStyle.glow} stopOpacity={glowIntensity * 0.35} />
          <stop offset="100%" stopColor={glowStyle.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 디퓨즈 글로우 - 더 넓게 */}
      <circle
        cx={center}
        cy={center}
        r={ringRadius + 35}
        fill="url(#jimi-glow-grad)"
        filter="url(#jimi-diffuse-glow)"
      />

      {/* 물 채워짐 - 뒤쪽 레이어 (더 진하고 느린 물결) */}
      <g clipPath="url(#jimi-clip)">
        <path
          d={generateWavePath(waterTopY + 4, 0, waveAmplitude * 0.6)}
          fill={glowStyle.glow}
          fillOpacity={0.4}
        />
      </g>

      {/* 물 채워짐 - 앞쪽 레이어 (더 연하고 빠른 물결) */}
      <g clipPath="url(#jimi-clip)">
        <path
          d={generateWavePath(waterTopY, Math.PI * 0.7, waveAmplitude)}
          fill="url(#jimi-water-grad)"
        />
      </g>

      {/* 메인 링 (얇고 흰색) */}
      <circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.95)"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}
