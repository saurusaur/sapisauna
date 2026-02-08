/**
 * Saunner 웨이브 그래프 SVG 컴포넌트
 * - sets = peak 개수
 * - totono = amplitude + 두께 + 글로우 강도
 * - 매끄럽지만 불규칙하게 교차하는 꾸밈 웨이브
 * - 디퓨즈 글로우 (네온 X)
 */

interface SaunnerGraphProps {
  saunaTemp: number
  coldBathTemp: number
  sets: number
  totono: number
}

export default function SaunnerGraph({ saunaTemp, coldBathTemp, sets, totono }: SaunnerGraphProps) {
  const width = 300
  const height = 260  // 200 → 260 (상하 30px 여백 추가)
  const padding = 12 // 좌우 여백
  const centerY = height / 2

  // sets = upward peak 개수
  // frequency 조정: 시작(상승 중)과 끝(하강 중)이 보이도록
  const frequency = 2 * sets - 0.5
  const phaseShift = -Math.PI / 4  // 상승 라인부터 시작

  // totono = amplitude (18~38px, 약 2배 차이)
  const maxAmplitude = (height / 2) - 18 // 상하 여백 확보
  const baseAmplitude = 18 + (totono - 1) * 5 // 18, 23, 28, 33, 38
  const amplitude = Math.min(baseAmplitude, maxAmplitude)

  // 웨이브 두께 고정 (얇게)
  const mainStrokeWidth = 2.5

  // totono = 글로우 강도 (디퓨즈)
  const glowIntensity = 0.25 + (totono - 1) * 0.15 // 0.25 ~ 0.85

  // totono = 블러 크기 (축소하여 경계선 방지)
  const glowBlur = 4 + totono * 1.5 // 5.5 ~ 10

  // 온도차에 따른 글로우 색상
  const deltaT = saunaTemp - coldBathTemp
  const tempRatio = Math.min(Math.max((deltaT - 40) / 40, 0), 1)
  const glowColor = tempRatio > 0.6 ? '#FF6B4A' : tempRatio > 0.3 ? '#FF8B6A' : '#FFAB8A'

  // 메인 웨이브 경로 생성 (padding + phase shift 적용)
  // 각 피크마다 자연스러운 높낮이 차이를 위한 진폭 변조
  const getAmplitudeAt = (t: number): number => {
    // 양쪽 끝이 자연스럽게 줄어드는 포물선 엔벨로프
    const envelope = 0.55 + 0.45 * Math.sin(t * Math.PI)
    // 피크마다 높이 차이 (주파수를 비정수로 설정해 반복감 제거)
    const variation = 1 + 0.25 * Math.sin(t * Math.PI * 4.3 + 0.7)
    return amplitude * envelope * variation
  }

  const generateMainWave = (): string => {
    const points: string[] = []
    const segments = 100

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = padding + t * (width - 2 * padding)
      const angle = t * Math.PI * frequency + phaseShift
      const amp = getAmplitudeAt(t)
      const y =
        centerY -
        Math.sin(angle) * amp -
        Math.sin(angle * 2) * (amp * 0.12)

      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    }

    return points.join(' ')
  }

  // 매끄러운 꾸밈 웨이브 1 (진폭 모듈레이션으로 불규칙 교차)
  const generateSmoothWave1 = (): string => {
    const points: string[] = []
    const segments = 100
    const baseAmp = 15

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = padding + t * (width - 2 * padding)
      const angle = t * Math.PI * frequency + phaseShift

      // 메인 웨이브의 y 위치 (진폭 변조 적용)
      const amp = getAmplitudeAt(t)
      const mainY =
        centerY -
        Math.sin(angle) * amp -
        Math.sin(angle * 2) * (amp * 0.12)

      // 진폭 모듈레이션: 느린 사인파로 진폭이 변화 → 불규칙 교차
      const ampModulation = 0.4 + Math.sin(t * Math.PI * 2.3 + 0.5) * 0.6
      const offset = Math.sin(angle * 1.4) * baseAmp * ampModulation

      const y = mainY + offset

      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    }

    return points.join(' ')
  }

  // 매끄러운 꾸밈 웨이브 2 (다른 모듈레이션 패턴)
  const generateSmoothWave2 = (): string => {
    const points: string[] = []
    const segments = 100
    const baseAmp = 14

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = padding + t * (width - 2 * padding)
      const angle = t * Math.PI * frequency + phaseShift

      // 메인 웨이브의 y 위치 (진폭 변조 적용)
      const amp = getAmplitudeAt(t)
      const mainY =
        centerY -
        Math.sin(angle) * amp -
        Math.sin(angle * 2) * (amp * 0.12)

      // 다른 모듈레이션 패턴
      const ampModulation = 0.3 + Math.sin(t * Math.PI * 1.7 + 2.1) * 0.7
      const offset = Math.sin(angle * 1.6 + Math.PI * 0.6) * baseAmp * ampModulation

      const y = mainY + offset

      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    }

    return points.join(' ')
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* 디퓨즈 글로우 필터 (totono에 따라 블러 크기 조절) */}
        <filter id="saunner-diffuse" x="-50%" y="-40%" width="160%" height="190%">
          <feGaussianBlur stdDeviation={glowBlur} result="blur1" />
          <feGaussianBlur stdDeviation={glowBlur * 0.2} result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
          </feMerge>
        </filter>

        {/* 메인 웨이브 그라데이션 (양끝 자연스러운 페이드아웃) */}
        <linearGradient id="saunner-main-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFD8C8" stopOpacity="0" />
          <stop offset="10%" stopColor="#FFD8C8" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFC8B4" stopOpacity="1" />
          <stop offset="90%" stopColor="#FFD8C8" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD8C8" stopOpacity="0" />
        </linearGradient>

        {/* 꾸밈 웨이브 그라데이션 (양끝 자연스러운 페이드아웃) */}
        <linearGradient id="saunner-sub-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE0D4" stopOpacity="0" />
          <stop offset="10%" stopColor="#FFE0D4" stopOpacity="0.6" />
          <stop offset="90%" stopColor="#FFE0D4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFE0D4" stopOpacity="0" />
        </linearGradient>

        {/* 디퓨즈 글로우 그라데이션 (양끝 완전 페이드아웃) */}
        <linearGradient id="saunner-glow-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0" />
          <stop offset="12%" stopColor={glowColor} stopOpacity={glowIntensity * 0.6} />
          <stop offset="50%" stopColor={glowColor} stopOpacity={glowIntensity * 0.7} />
          <stop offset="88%" stopColor={glowColor} stopOpacity={glowIntensity * 0.6} />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 디퓨즈 글로우 레이어 (totono에 따라 강도 변화) */}
      <path
        d={generateMainWave()}
        fill="none"
        stroke="url(#saunner-glow-grad)"
        strokeWidth={12 + totono * 4}
        strokeLinecap="round"
        filter="url(#saunner-diffuse)"
      />

      {/* 매끄러운 꾸밈 웨이브 1 */}
      <path
        d={generateSmoothWave1()}
        fill="none"
        stroke="url(#saunner-sub-grad)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* 매끄러운 꾸밈 웨이브 2 */}
      <path
        d={generateSmoothWave2()}
        fill="none"
        stroke="url(#saunner-sub-grad)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* 메인 웨이브 (totono에 따라 두께 변화) */}
      <path
        d={generateMainWave()}
        fill="none"
        stroke="url(#saunner-main-grad)"
        strokeWidth={mainStrokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}
