/**
 * Sauner 파도 그래프 SVG 컴포넌트
 * - ΔT(사우나-냉탕 온도차)를 파도 높이로 표현
 * - sets를 파도 반복 횟수로 표현
 * - totono 점수에 따라 곡선의 매끄러움이 달라짐
 */

interface SaunerGraphProps {
  saunaTemp: number
  coldBathTemp: number
  sets: number
  totono: number
}

// 시드 기반 의사 난수 (렌더링 안정성 위해 Math.random 대신 사용)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function SaunerGraph({ saunaTemp, coldBathTemp, sets, totono }: SaunerGraphProps) {
  const deltaT = saunaTemp - coldBathTemp
  // 파도 높이: ΔT를 20~80 범위로 매핑 (최소 10, 최대 60px 진폭)
  const amplitude = Math.min(60, Math.max(10, (deltaT / 100) * 60))
  const width = 300
  const height = 200
  const centerY = height / 2

  // 파도 경로 생성
  const generateWavePath = (): string => {
    const points: { x: number; y: number }[] = []
    const frequency = sets
    const totalPoints = frequency * 20 // 각 파도당 20개 포인트

    for (let i = 0; i <= totalPoints; i++) {
      const x = (i / totalPoints) * width
      let y = centerY + Math.sin((i / totalPoints) * frequency * Math.PI * 2) * amplitude

      // totono에 따른 노이즈 추가
      if (totono <= 2) {
        // 거친 선: 강한 노이즈
        const noise = (seededRandom(i * 7 + 3) - 0.5) * 6
        y += noise
      } else if (totono === 3) {
        // 중간: 약한 노이즈
        const noise = (seededRandom(i * 7 + 3) - 0.5) * 2
        y += noise
      }
      // totono >= 4: 노이즈 없음 (매끄러운 곡선)

      points.push({ x, y })
    }

    // 경로 생성: totono에 따라 bezier 또는 직선
    if (totono >= 4) {
      // 부드러운 cubic bezier 곡선
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2
        const yc = (points[i].y + points[i + 1].y) / 2
        d += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`
      }
      const last = points[points.length - 1]
      d += ` L ${last.x} ${last.y}`
      return d
    } else {
      // 직선 연결 (노이즈가 거친 느낌을 살림)
      return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    }
  }

  const wavePath = generateWavePath()

  // 채우기용 경로 (파도 아래 영역)
  const fillPath = `${wavePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        {/* 상단 warm → 하단 cool 그라데이션 */}
        <linearGradient id="sauner-wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="sauner-wave-stroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* 파도 채우기 */}
      <path d={fillPath} fill="url(#sauner-wave-fill)" />

      {/* 파도 선 */}
      <path
        d={wavePath}
        fill="none"
        stroke="url(#sauner-wave-stroke)"
        strokeWidth={totono >= 4 ? 2.5 : 1.5}
        strokeLinecap="round"
      />

      {/* 중앙 ΔT 수치 */}
      <text
        x={width / 2}
        y={centerY - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <tspan fontSize="10" fill="#6b7280" dy="-18">
          ΔT
        </tspan>
        <tspan x={width / 2} fontSize="36" fontWeight="bold" fill="#1f2937" dy="30">
          {deltaT}
        </tspan>
        <tspan fontSize="14" fill="#6b7280">°C</tspan>
      </text>
    </svg>
  )
}
