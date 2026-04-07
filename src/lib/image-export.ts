/**
 * 스토리 카드 Canvas 렌더러 + 공유/다운로드 유틸리티
 * 배경(단색/사진) + 텍스트 + 뱃지 + 그래프를 Canvas에서 직접 렌더링
 * SVG 그래프는 SVG→Image→drawImage 방식으로 100% 보존
 *
 * 좌표 기준: 1080×1920 카드, padding 80/72
 * textBaseline='top' 사용하여 CSS top-edge 기준과 일치시킴
 */

import { STORY_COLORS, type StoryTribeId } from '@/constants/story-colors'
import { renderSaunnerSvg, renderBatherSvg } from '@/lib/story-overlay/graphs'

const W = 1080
const H = 1920
const R = 48
const PX = 80
const PY = 72

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export interface CardRenderParams {
  tribeId: StoryTribeId
  placeName: string
  date: string
  bgPhoto?: string | null
  saunaTemp?: number
  coldBathTemp?: number
  hotBathTemp?: number
  jjimTemp?: number
  totono_score?: number
  waterQuality?: number
  sweatQuality?: number
  heatTime?: number | null
  iceTime?: number | null
  pauseTime?: number | null
  repeat?: number | null
  userNickname?: string
  userTitle?: string
}

// ─── 유틸리티 ───

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${dateStr.slice(0, 10).replace(/-/g, '.')} · ${DAY_NAMES[d.getDay()]}`
}

function getMetric(p: CardRenderParams) {
  switch (p.tribeId) {
    case 'saunner': {
      const d = (p.saunaTemp || 80) - (p.coldBathTemp || 15)
      return { value: String(d), unit: '°C', label: 'TEMP DELTA' }
    }
    case 'bather':
      return { value: String(p.hotBathTemp || 40), unit: '°C', label: 'BATH TEMP' }
    case 'jimi':
      return p.jjimTemp
        ? { value: String(p.jjimTemp), unit: '°C', label: 'JJIMJIL TEMP' }
        : { value: '—', unit: '', label: 'JJIMJIL TEMP' }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function svgToImage(svgStr: string): Promise<HTMLImageElement> {
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  return loadImage(url).finally(() => URL.revokeObjectURL(url))
}

function drawCoverFit(ctx: CanvasRenderingContext2D, img: HTMLImageElement, tw: number, th: number) {
  const ir = img.naturalWidth / img.naturalHeight
  const tr = tw / th
  let sw: number, sh: number, sx: number, sy: number
  if (ir > tr) {
    sh = img.naturalHeight; sw = sh * tr; sx = (img.naturalWidth - sw) / 2; sy = 0
  } else {
    sw = img.naturalWidth; sh = sw / tr; sx = 0; sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th)
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  try { (ctx as any).letterSpacing = `${px}px` } catch { /* noop */ }
}

function setShadow(ctx: CanvasRenderingContext2D, on: boolean) {
  if (on) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 4
  } else {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
}

// ─── 메인 렌더 함수 ───

/**
 * CSS line-height:1 과 Canvas textBaseline='top' 사이의 차이를 보정
 *
 * CSS leading-none: line-box = fontSize, 하지만 font의 자연 높이(ascent+descent)가
 * fontSize보다 크면 글리프가 line-box 위아래로 삐져나옴 (negative half-leading)
 * → line-box 상단이 em-square 상단보다 아래에 위치
 *
 * Canvas textBaseline='top': em-square 상단에 배치 → CSS보다 위에 그려짐
 *
 * 보정값 = fontSize × (naturalLineHeightRatio - 1) / 2
 * 이 값을 y에 더해주면 CSS와 동일한 위치에 렌더링됨
 */
function measureHalfLeading(ctx: CanvasRenderingContext2D): number {
  // Oswald의 자연 line-height 비율을 런타임에 측정
  const prevBaseline = ctx.textBaseline
  const prevFont = ctx.font
  ctx.font = 'bold 100px Oswald'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText('M')
  const naturalRatio = (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 100
  ctx.textBaseline = prevBaseline
  ctx.font = prevFont
  return naturalRatio
}

export async function renderCard(p: CardRenderParams): Promise<Blob> {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // export 이미지는 모서리 꽉 채움 (프리뷰만 borderRadius 유지)

  ctx.textBaseline = 'top'

  // CSS leading-none 보정: 각 fillText y에 hl(fontSize)를 더함
  const nlr = measureHalfLeading(ctx) // Oswald natural line-height ratio (~1.18)
  const hl = (fs: number) => fs * (nlr - 1) / 2

  const colors = STORY_COLORS[p.tribeId]
  const hasBg = !!p.bgPhoto

  // ── 배경 ──
  if (p.bgPhoto) {
    const photo = await loadImage(p.bgPhoto)
    ctx.save()
    ctx.filter = 'blur(3px)'
    ctx.scale(1.02, 1.02)
    ctx.translate(-W * 0.01, -H * 0.01)
    drawCoverFit(ctx, photo, W, H)
    ctx.restore()
    const rgb = colors.rgb
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, `rgba(${rgb},0.88)`)
    grad.addColorStop(0.25, `rgba(${rgb},0.65)`)
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)')
    grad.addColorStop(0.75, 'rgba(0,0,0,0.5)')
    grad.addColorStop(1, 'rgba(0,0,0,0.6)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  } else {
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)
  }

  // ───────────────────────────────────────────────
  // 레이아웃 계산 (CSS flexbox 시뮬레이션)
  // 원본 CSS:
  //   card padding: 72px 80px
  //   header paddingTop: 16px
  //   content: flex-1, justify-center, paddingTop: 80px
  //   footer: flex items-end justify-between
  // ───────────────────────────────────────────────

  // 헤더 좌표 (leading-none 적용: 텍스트 높이 = font-size)
  const headerTop = PY + 16                          // 88
  const placeNameTop = headerTop                     // 88
  const dateTop = headerTop + 56 + 24               // 168 (marginTop: 24)
  const headerBottom = dateTop + 48                  // 216

  // 푸터 좌표 (카드 하단 패딩 안쪽 끝에서 위로)
  const footerBottom = H - PY                        // 1848
  const footerTextH = 42
  const footerTop = footerBottom - footerTextH       // 1806

  // 컨텐츠 영역 (flex-1, paddingTop: 80, justify-center)
  const contentAreaTop = headerBottom + 80            // 296
  const contentAreaHeight = footerTop - contentAreaTop // 1510

  // 컨텐츠 블록 높이 (라벨~그래프 끝, leading-none 기준)
  const labelH = 48
  const labelGap = 28                                // marginBottom: 28
  const valueH = 380
  const badgeGap = 64
  const badgeH = 96 + 22 + 42                       // 160 (gap: 22)
  const graphOverlap = -100
  const graphH = 640
  const blockH = labelH + labelGap + valueH + badgeGap + badgeH + graphOverlap + graphH // 1210

  // 블록을 컨텐츠 영역 중앙에 배치
  const blockTop = contentAreaTop + (contentAreaHeight - blockH) / 2  // ≈445

  // 각 요소의 y 좌표
  const labelY = blockTop                                             // ≈445
  const valueY = labelY + labelH + labelGap                          // ≈509
  const badgeY = valueY + valueH + badgeGap                          // ≈953
  const graphY = badgeY + badgeH + graphOverlap                      // ≈1005

  // ── 헤더: 장소명 + 날짜 ──
  ctx.fillStyle = 'white'
  ctx.font = 'bold 56px Oswald'
  setLetterSpacing(ctx, 1.12)
  ctx.fillText(p.placeName, PX, placeNameTop + hl(56))

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'italic 48px Oswald'
  setLetterSpacing(ctx, 0)
  ctx.fillText(formatDate(p.date), PX, dateTop + hl(48))

  // ── 메인 수치 ──
  const metric = getMetric(p)

  // 라벨
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'bold 48px Oswald'
  setLetterSpacing(ctx, 9.6)
  ctx.fillText(metric.label, PX, labelY + hl(48))
  setLetterSpacing(ctx, 0)

  // 큰 숫자
  setShadow(ctx, hasBg)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 380px Oswald'
  setLetterSpacing(ctx, -7.6)
  ctx.fillText(metric.value, PX - 16, valueY + hl(380))

  // 단위 (큰 숫자 옆, marginTop: 28)
  if (metric.unit) {
    const vw = ctx.measureText(metric.value).width
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '600 88px Oswald'
    setLetterSpacing(ctx, 0)
    ctx.fillText(metric.unit, PX - 16 + vw + 8, valueY + 28 + hl(88))
  }
  setShadow(ctx, false)

  // ── 루틴 뱃지 ──
  const badges = p.tribeId === 'jimi'
    ? [
        { value: p.heatTime, label: 'HEAT', suffix: '' },
        { value: p.pauseTime, label: 'PAUSE', suffix: '' },
        { value: p.repeat, label: 'RPT', suffix: '' },
        { value: p.sweatQuality, label: 'SWEAT', suffix: '/5' },
      ]
    : [
        { value: p.heatTime, label: 'HEAT', suffix: '' },
        { value: p.iceTime, label: 'ICE', suffix: '' },
        { value: p.pauseTime, label: 'PAUSE', suffix: '' },
        { value: p.repeat, label: 'RPT', suffix: '' },
      ]
  const valTexts = badges.map(b => b.value != null ? String(b.value) : '-')

  // 각 뱃지 컬럼 너비 측정 → gap: 72px 배치
  ctx.font = 'bold 96px Oswald'
  const valWidths = valTexts.map(t => ctx.measureText(t).width)
  ctx.font = '42px Oswald'
  setLetterSpacing(ctx, 4.2)
  const lblWidths = badges.map(b => ctx.measureText(b.label).width)
  setLetterSpacing(ctx, 0)
  const colWidths = badges.map((_, i) => Math.max(valWidths[i], lblWidths[i]))

  setShadow(ctx, hasBg)
  let bx = PX
  badges.forEach((b, i) => {
    const cx = bx + colWidths[i] / 2

    ctx.textAlign = 'center'

    // 숫자 + suffix (/5)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 96px Oswald'
    ctx.fillText(valTexts[i], cx, badgeY + hl(96))
    if (b.suffix && b.value != null) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = 'bold 48px Oswald'
      // 96px 숫자 폭 측정은 같은 폰트로 해야 정확
      ctx.font = 'bold 96px Oswald'
      const valW = ctx.measureText(valTexts[i]).width
      ctx.font = 'bold 48px Oswald'
      ctx.textAlign = 'left'
      // 48px 텍스트를 96px 텍스트 하단에 맞춤 (top 기준이므로 96-48=48 오프셋)
      ctx.fillText(b.suffix, cx + valW / 2, badgeY + hl(96) + (96 - 48) - 8)
      ctx.textAlign = 'center'
      ctx.fillStyle = 'white'
    }

    // 라벨
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '42px Oswald'
    setLetterSpacing(ctx, 4.2)
    ctx.fillText(b.label, cx, badgeY + 96 + 22 + hl(42))
    setLetterSpacing(ctx, 0)

    bx += colWidths[i] + 72
  })
  ctx.textAlign = 'left'
  setShadow(ctx, false)

  // ── 그래프 (SVG → Image → drawImage, preserveAspectRatio 수동 구현) ──
  let svgStr = ''
  if (p.tribeId === 'saunner') {
    svgStr = renderSaunnerSvg({
      saunaTemp: p.saunaTemp || 80,
      coldBathTemp: p.coldBathTemp || 15,
      repeat: p.repeat || 3,
      totono_score: p.totono_score || 3,
    })
  } else if (p.tribeId === 'bather') {
    svgStr = renderBatherSvg({
      waterQuality: p.waterQuality || 3,
      hotBathTemp: p.hotBathTemp || 40,
      coldBathTemp: p.coldBathTemp,
    })
  }

  if (svgStr) {
    const svgImg = await svgToImage(svgStr)
    // 그래프 영역: CSS width:140% (부모 컨텐츠 너비 기준) height:640px marginLeft:-80px
    const contentW = W - 2 * PX  // 920 (패딩 제외 내부 너비)
    const areaX = 0              // CSS: content(x=80) + marginLeft(-80) = 0
    const areaW = contentW * 1.4 // 1288
    const areaH = graphH   // 640

    // preserveAspectRatio="xMinYMid meet" 시뮬레이션
    const vbW = svgImg.naturalWidth
    const vbH = svgImg.naturalHeight
    const scale = Math.min(areaW / vbW, areaH / vbH)
    const drawW = vbW * scale
    const drawH = vbH * scale
    const drawX = areaX                           // xMin (좌측 정렬)
    const drawY = graphY + (areaH - drawH) / 2   // YMid (수직 중앙)

    ctx.drawImage(svgImg, drawX, drawY, drawW, drawH)
  }

  // ── 푸터: 윗줄(tribe dot+이름) / 아랫줄(SA-PI SAUNA 좌 + 칭호pill+닉네임 우) ──
  const footerTextY = footerBottom - footerTextH
  const upperY = footerTextY - 56

  // 윗줄: tribe dot + 이름
  const dotCy = upperY + footerTextH / 2
  ctx.beginPath()
  ctx.arc(PX + 15, dotCy, 15, 0, Math.PI * 2)
  ctx.fillStyle = colors.dot
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'bold 42px Oswald'
  setLetterSpacing(ctx, 4.2)
  ctx.fillText(p.tribeId.toUpperCase(), PX + 15 + 15 + 20, upperY + hl(42))

  // 아랫줄: SA-PI SAUNA (좌)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = 'bold 42px Oswald'
  ctx.fillText('SA-PI SAUNA', PX, footerTextY + hl(42))

  // 아랫줄: 칭호pill + 닉네임 (우측 정렬)
  ctx.textAlign = 'right'
  const nickname = p.userNickname || 'SA-PIEN'
  ctx.fillText(nickname, W - PX, footerTextY + hl(42))

  if (p.userTitle) {
    const nickW = ctx.measureText(nickname).width
    const pillText = p.userTitle
    ctx.font = 'bold 30px Oswald'
    const pillTextW = ctx.measureText(pillText).width
    const pillPadX = 20
    const pillH = 38
    const pillW = pillTextW + pillPadX * 2
    const pillX = W - PX - nickW - 16 - pillW
    // pill을 닉네임 42px 텍스트와 수직 중앙 정렬
    const nickTextTop = footerTextY + hl(42)
    const pillY = nickTextTop + (42 - pillH) / 2

    // pill 배경
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    const pillR = pillH / 2
    ctx.beginPath()
    ctx.moveTo(pillX + pillR, pillY)
    ctx.lineTo(pillX + pillW - pillR, pillY)
    ctx.arc(pillX + pillW - pillR, pillY + pillR, pillR, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(pillX + pillR, pillY + pillH)
    ctx.arc(pillX + pillR, pillY + pillR, pillR, Math.PI / 2, -Math.PI / 2)
    ctx.closePath()
    ctx.fill()

    // pill 텍스트
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillText(pillText, pillX + pillPadX, pillY + (pillH - 30) / 2 + hl(30) - 4)
  }

  ctx.textAlign = 'left'
  setLetterSpacing(ctx, 0)

  // ── Blob 반환 ──
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('toBlob failed'))
        }
      },
      'image/png',
    )
  })
}

// ─── 공유/다운로드 ───

export async function shareImage(blob: Blob, title: string): Promise<void> {
  const file = new File([blob], `${title}.png`, { type: 'image/png' })
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ title, files: [file] })
  } else {
    downloadImage(blob, `${title}.png`)
  }
}

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
