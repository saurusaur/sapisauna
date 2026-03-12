/**
 * 스토리 오버레이용 SVG 그래프 문자열 생성 헬퍼
 * saunner-graph.tsx / bather-graph.tsx의 수학 로직을 순수 함수로 포팅
 * Puppeteer HTML 템플릿에 인라인 삽입용
 */

// ─── Saunner 웨이브 그래프 ───

interface SaunnerParams {
  saunaTemp: number
  coldBathTemp: number
  repeat: number
  totono_score: number
}

export function renderSaunnerSvg({ saunaTemp, coldBathTemp, repeat, totono_score }: SaunnerParams): string {
  const width = 300
  const height = 260
  const padding = 12
  const centerY = height / 2

  const frequency = 2 * repeat - 0.5
  const phaseShift = -Math.PI / 4

  const maxAmplitude = (height / 2) - 18
  const baseAmplitude = 18 + (totono_score - 1) * 5
  const amplitude = Math.min(baseAmplitude, maxAmplitude)

  const mainStrokeWidth = 2.5
  const glowIntensity = 0.25 + (totono_score - 1) * 0.15
  const glowBlur = 4 + totono_score * 1.5

  const deltaT = saunaTemp - coldBathTemp
  const tempRatio = Math.min(Math.max((deltaT - 40) / 40, 0), 1)
  const glowColor = tempRatio > 0.6 ? '#FF6B4A' : tempRatio > 0.3 ? '#FF8B6A' : '#FFAB8A'

  const getAmplitudeAt = (t: number): number => {
    const envelope = 0.55 + 0.45 * Math.sin(t * Math.PI)
    const variation = 1 + 0.25 * Math.sin(t * Math.PI * 4.3 + 0.7)
    return amplitude * envelope * variation
  }

  const generateWave = (offsetFn?: (t: number, angle: number, mainY: number) => number): string => {
    const points: string[] = []
    for (let i = 0; i <= 100; i++) {
      const t = i / 100
      const x = padding + t * (width - 2 * padding)
      const angle = t * Math.PI * frequency + phaseShift
      const amp = getAmplitudeAt(t)
      let y = centerY - Math.sin(angle) * amp - Math.sin(angle * 2) * (amp * 0.12)
      if (offsetFn) y = offsetFn(t, angle, y)
      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    }
    return points.join(' ')
  }

  const mainWave = generateWave()

  const smoothWave1 = generateWave((t, angle, mainY) => {
    const ampMod = 0.4 + Math.sin(t * Math.PI * 2.3 + 0.5) * 0.6
    return mainY + Math.sin(angle * 1.4) * 15 * ampMod
  })

  const smoothWave2 = generateWave((t, angle, mainY) => {
    const ampMod = 0.3 + Math.sin(t * Math.PI * 1.7 + 2.1) * 0.7
    return mainY + Math.sin(angle * 1.6 + Math.PI * 0.6) * 14 * ampMod
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMinYMid meet">
  <defs>
    <filter id="saunner-diffuse" x="-50%" y="-40%" width="160%" height="190%">
      <feGaussianBlur stdDeviation="${glowBlur}" result="blur1"/>
      <feGaussianBlur stdDeviation="${glowBlur * 0.2}" result="blur2"/>
      <feMerge><feMergeNode in="blur1"/><feMergeNode in="blur2"/></feMerge>
    </filter>
    <linearGradient id="saunner-main-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFD8C8" stop-opacity="0"/>
      <stop offset="10%" stop-color="#FFD8C8" stop-opacity="1"/>
      <stop offset="50%" stop-color="#FFC8B4" stop-opacity="1"/>
      <stop offset="90%" stop-color="#FFD8C8" stop-opacity="1"/>
      <stop offset="100%" stop-color="#FFD8C8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="saunner-sub-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFE0D4" stop-opacity="0"/>
      <stop offset="10%" stop-color="#FFE0D4" stop-opacity="0.6"/>
      <stop offset="90%" stop-color="#FFE0D4" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#FFE0D4" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="saunner-glow-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="12%" stop-color="${glowColor}" stop-opacity="${glowIntensity * 0.6}"/>
      <stop offset="50%" stop-color="${glowColor}" stop-opacity="${glowIntensity * 0.7}"/>
      <stop offset="88%" stop-color="${glowColor}" stop-opacity="${glowIntensity * 0.6}"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="${mainWave}" fill="none" stroke="url(#saunner-glow-grad)" stroke-width="${12 + totono_score * 4}" stroke-linecap="round" filter="url(#saunner-diffuse)"/>
  <path d="${smoothWave1}" fill="none" stroke="url(#saunner-sub-grad)" stroke-width="1" stroke-linecap="round"/>
  <path d="${smoothWave2}" fill="none" stroke="url(#saunner-sub-grad)" stroke-width="1" stroke-linecap="round"/>
  <path d="${mainWave}" fill="none" stroke="url(#saunner-main-grad)" stroke-width="${mainStrokeWidth}" stroke-linecap="round"/>
</svg>`
}

// ─── Bather 동심원 그래프 ───

interface BatherParams {
  waterQuality: number
  hotBathTemp: number
  coldBathTemp?: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export function renderBatherSvg({ waterQuality, hotBathTemp, coldBathTemp }: BatherParams): string {
  const size = 280
  const center = size / 2
  const circleCount = 8

  const tempNormalized = Math.min(Math.max((hotBathTemp - 35) / 10, 0), 1)
  const minRadius = 25
  const maxRadius = 80 + tempNormalized * 80
  const radiusStep = (maxRadius - minRadius) / Math.max(circleCount - 1, 1)

  const colors = [
    { h: 45, s: 30, l: 65 },
    { h: 80, s: 30, l: 70 },
    { h: 150, s: 25, l: 75 },
    { h: 180, s: 20, l: 82 },
    { h: 195, s: 10, l: 95 },
  ]
  const color = colors[waterQuality - 1] || colors[2]

  let circles = ''
  for (let i = 0; i < circleCount; i++) {
    const radius = minRadius + i * radiusStep
    const distanceRatio = i / Math.max(circleCount - 1, 1)
    const opacity = 0.9 - distanceRatio * 0.5
    const circumference = 2 * Math.PI * radius
    const dashLen = circumference * 0.18 + seededRandom(i * 13) * circumference * 0.05
    const gapLen = 1 + seededRandom(i * 19) * 2
    const dashOffset = seededRandom(i * 31) * 20

    circles += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="hsl(${color.h}, ${color.s}%, ${color.l}%)" stroke-width="1.8" stroke-opacity="${opacity}" stroke-dasharray="${dashLen} ${gapLen}" stroke-dashoffset="${dashOffset}" stroke-linecap="round"/>\n`
  }

  let coldLayer = ''
  if (coldBathTemp !== undefined) {
    const deltaT = hotBathTemp - coldBathTemp
    const deltaRatio = Math.min(Math.max((deltaT - 10) / 20, 0), 1)
    const coldRadius1 = minRadius * 0.6
    const coldRadius2 = minRadius * 0.35
    const coldOpacity = 0.3 + deltaRatio * 0.5
    coldLayer = `
    <g mask="url(#bather-mask)">
      <circle cx="${center}" cy="${center}" r="${coldRadius1}" fill="none" stroke="hsl(195, 60%, 88%)" stroke-width="1.2" stroke-opacity="${coldOpacity}"/>
      <circle cx="${center}" cy="${center}" r="${coldRadius2}" fill="none" stroke="hsl(200, 70%, 92%)" stroke-width="0.8" stroke-opacity="${coldOpacity * 0.7}"/>
    </g>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" preserveAspectRatio="xMinYMid meet">
  <defs>
    <radialGradient id="bather-fade" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="white" stop-opacity="1"/>
      <stop offset="55%" stop-color="white" stop-opacity="1"/>
      <stop offset="80%" stop-color="white" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <mask id="bather-mask">
      <circle cx="${center}" cy="${center}" r="${maxRadius + 15}" fill="url(#bather-fade)"/>
    </mask>
  </defs>
  <g mask="url(#bather-mask)">
    ${circles}
  </g>
  ${coldLayer}
</svg>`
}
