/**
 * 스토리 카드 Canvas 렌더러 + 공유/다운로드 유틸리티 (v3.3)
 *
 * 프리뷰(src/app/story/page.tsx)의 v3.3 에디토리얼 디자인을 1080×1920 Canvas로 미러링.
 * 표시 데이터(히어로 온도·루틴 줄·압축 여부·점수)는 페이지가 계산한 값을 그대로 받는다
 * → 프리뷰와 내보내기가 항상 동일한 데이터 규칙을 공유.
 *
 * 레이어 순서: 베이스색 → (사진: blur 7px·채도 .55·scale 1.04) → 오로라(SVG→Image)
 *             → 그레인(multiply .07) → 텍스트/점/물결 마크
 * 설계: docs/po/스토리_프로토타입_v3_20260609.html (좌표 = 프로토 300px × 3.6)
 */

import { type StoryTribeId } from '@/constants/story-colors'

const W = 1080
const H = 1920
const S = 3.6
const px = (n: number) => Math.round(n * S)

const INK = '#1c1917'
const INK_M = 'rgba(28,25,23,0.38)'
const STEAM_MARK = '/logo/sauna-steam-mark.svg'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DOT_COLOR: Record<StoryTribeId, string> = { saunner: '#F97316', bather: '#3B82F6', jimi: '#22C55E' }
const TRIBE_EN: Record<StoryTribeId, string> = { saunner: 'SAUNNER', bather: 'BATHER', jimi: 'JIMI' }

// ─── 렌더 파라미터 (페이지가 계산한 표시 데이터를 그대로 전달) ───

export interface RoutineLineData {
  name: string
  parts: string[] // 비어 있으면 bare(장식 라인)
}

export interface CardRenderParams {
  tribeId: StoryTribeId
  placeName: string
  date: string
  bgPhoto?: string | null
  heroTemp: number | null // null → 물결 마크 폴백
  metricLabel: string // TEMP DELTA / BATH TEMP / JJIMJIL TEMP
  routineLines: RoutineLineData[] // 오버플로(7줄 컷) 적용 후
  hiddenCount: number // 「+N 활동」
  repeat: number // >1 이면 세트줄
  dense: boolean // 압축 모드 (11.5px·행간 1.58)
  scoreLabel: string // TOTONOU / WATER / SWEAT
  scoreValue: number | null // 1~5, 점 5개
  userNickname?: string
  userTitle?: string
}

// ─── 오로라 그라데이션 스펙 (page.tsx AURORA/AURORA_PHOTO와 동일 값) ───

type RadialStops = Array<[color: string, opacity: number, offset: number]>
interface AuroraSpec {
  r1: { cx: number; cy: number; rx: number; ry: number; stops: RadialStops }
  r2: { cx: number; cy: number; rx: number; ry: number; stops: RadialStops }
  base: Array<[color: string, opacity: number]> // 135deg linear: [from, to]
  baseColor: string
}

// 공통 지오메트리: r1 = 120%×85% at 80% 26% / r2 = 90%×70% at 10% 64%
const R1_GEO = { cx: 0.8 * W, cy: 0.26 * H, rx: 1.2 * W, ry: 0.85 * H }
const R2_GEO = { cx: 0.1 * W, cy: 0.64 * H, rx: 0.9 * W, ry: 0.7 * H }

function spec(
  r1Stops: RadialStops,
  r2Stops: RadialStops,
  base: Array<[string, number]>,
  baseColor: string,
): AuroraSpec {
  return { r1: { ...R1_GEO, stops: r1Stops }, r2: { ...R2_GEO, stops: r2Stops }, base, baseColor }
}

const AURORA: Record<StoryTribeId, AuroraSpec> = {
  saunner: spec(
    [['#F97316', 0.82, 0], ['#FB923C', 0.45, 0.3], ['#FFFFFF', 0, 0.62]],
    [['#F472B6', 0.42, 0], ['#FFFFFF', 0, 0.55]],
    [['#fdf6f0', 1], ['#ffffff', 1]],
    '#fdf6f0',
  ),
  bather: spec(
    [['rgb(40,120,160)', 0.8, 0], ['rgb(96,165,210)', 0.42, 0.32], ['#FFFFFF', 0, 0.64]],
    [['rgb(125,211,222)', 0.45, 0], ['#FFFFFF', 0, 0.55]],
    [['#eef6fa', 1], ['#ffffff', 1]],
    '#eef6fa',
  ),
  jimi: spec(
    [['rgb(34,170,90)', 0.78, 0], ['rgb(110,200,130)', 0.4, 0.32], ['#FFFFFF', 0, 0.64]],
    [['rgb(190,220,140)', 0.45, 0], ['#FFFFFF', 0, 0.55]],
    [['#f0f8f2', 1], ['#ffffff', 1]],
    '#f0f8f2',
  ),
}

// 사진 모드: 라디얼 강화 + 흰 베이스만 반투명(.38→.46)
const AURORA_PHOTO: Record<StoryTribeId, AuroraSpec> = {
  saunner: spec(
    [['#F97316', 0.88, 0], ['#FB923C', 0.52, 0.3], ['#FFFFFF', 0, 0.62]],
    [['#F472B6', 0.48, 0], ['#FFFFFF', 0, 0.55]],
    [['#fdf6f0', 0.38], ['#ffffff', 0.46]],
    'transparent',
  ),
  bather: spec(
    [['rgb(40,120,160)', 0.86, 0], ['rgb(96,165,210)', 0.49, 0.32], ['#FFFFFF', 0, 0.64]],
    [['rgb(125,211,222)', 0.52, 0], ['#FFFFFF', 0, 0.55]],
    [['#eef6fa', 0.38], ['#ffffff', 0.46]],
    'transparent',
  ),
  jimi: spec(
    [['rgb(34,170,90)', 0.84, 0], ['rgb(110,200,130)', 0.47, 0.32], ['#FFFFFF', 0, 0.64]],
    [['rgb(190,220,140)', 0.52, 0], ['#FFFFFF', 0, 0.55]],
    [['#f0f8f2', 0.38], ['#ffffff', 0.46]],
    'transparent',
  ),
}

/**
 * 오로라 배경을 SVG로 생성 — CSS radial/linear-gradient를 1:1로 옮김
 * (Canvas createRadialGradient는 원형만 지원 → SVG 타원 그라데이션을 이미지로 래스터)
 */
function auroraSvg(tribe: StoryTribeId, photoMode: boolean): string {
  const s = (photoMode ? AURORA_PHOTO : AURORA)[tribe]
  const radial = (id: string, g: AuroraSpec['r1']) =>
    `<radialGradient id="${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" ` +
    `gradientTransform="translate(${g.cx},${g.cy}) scale(${g.rx},${g.ry})">` +
    g.stops.map(([c, o, off]) => `<stop offset="${off}" stop-color="${c}" stop-opacity="${o}"/>`).join('') +
    `</radialGradient>`
  // CSS 135deg: 중심 통과, 우하향 대각 방향
  const d = Math.SQRT1_2 // cos45 = sin45
  const len = (W + H) * d
  const x1 = W / 2 - (d * len) / 2
  const y1 = H / 2 - (d * len) / 2
  const x2 = W / 2 + (d * len) / 2
  const y2 = H / 2 + (d * len) / 2
  const linear =
    `<linearGradient id="base" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0" stop-color="${s.base[0][0]}" stop-opacity="${s.base[0][1]}"/>` +
    `<stop offset="1" stop-color="${s.base[1][0]}" stop-opacity="${s.base[1][1]}"/>` +
    `</linearGradient>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<defs>${radial('r1', s.r1)}${radial('r2', s.r2)}${linear}</defs>` +
    `<rect width="${W}" height="${H}" fill="url(#base)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#r2)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#r1)"/>` +
    `</svg>`
  )
}

// ─── 유틸리티 ───

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

// next/font(Oswald)는 해시된 패밀리명으로 등록 → DOM이 쓰는 패밀리명을 런타임에 해석
function resolveOswaldFamily(): string {
  if (typeof document === 'undefined') return 'Oswald'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-oswald').trim()
  return value || 'Oswald'
}

// 본문 sans도 DOM과 동일 페이스 사용
function resolveBodyFamily(): string {
  if (typeof document === 'undefined') return 'sans-serif'
  return getComputedStyle(document.body).fontFamily || 'sans-serif'
}

function primaryFamily(familyList: string): string {
  const first = familyList.split(',')[0].trim()
  return first.replace(/^['"]|['"]$/g, '')
}

async function ensureOswaldLoaded(familyList: string): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const family = `"${primaryFamily(familyList)}"`
  const specs = [`700 16px ${family}`, `italic 700 16px ${family}`, `300 16px ${family}`]
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {})))
  await document.fonts.ready
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

function setLetterSpacing(ctx: CanvasRenderingContext2D, spacingPx: number) {
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacingPx}px` } catch { /* noop */ }
}

// 그레인 노이즈 (밴딩 방지) — 240px 타일을 ×3.6으로 확대 타일링 (page.tsx grain과 동일 스케일)
function drawGrain(ctx: CanvasRenderingContext2D) {
  const tileSize = 240
  const tile = document.createElement('canvas')
  tile.width = tileSize
  tile.height = tileSize
  const tctx = tile.getContext('2d')
  if (!tctx) return
  const imgData = tctx.createImageData(tileSize, tileSize)
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256)
    imgData.data[i] = v
    imgData.data[i + 1] = v
    imgData.data[i + 2] = v
    imgData.data[i + 3] = 255
  }
  tctx.putImageData(imgData, 0, 0)
  ctx.save()
  ctx.globalAlpha = 0.07
  ctx.globalCompositeOperation = 'multiply'
  const T = px(240)
  for (let y = 0; y < H; y += T) {
    for (let x = 0; x < W; x += T) {
      ctx.drawImage(tile, x, y, T, T)
    }
  }
  ctx.restore()
}

function formatTopDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${dateStr.slice(0, 10).replace(/-/g, '.')} ${DAY_NAMES[d.getDay()]}`
}

// ─── 메인 렌더 ───

export async function renderCard(p: CardRenderParams): Promise<Blob> {
  const OSWALD = resolveOswaldFamily()
  const BODY = resolveBodyFamily()
  await ensureOswaldLoaded(OSWALD)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'top'

  const hasBg = !!p.bgPhoto
  const PAD = px(26) // 94 — 좌우 패딩

  // ── 배경: 베이스색 → (사진) → 오로라 → 그레인 ──
  ctx.fillStyle = hasBg ? '#ffffff' : AURORA[p.tribeId].baseColor
  ctx.fillRect(0, 0, W, H)

  if (p.bgPhoto) {
    const photo = await loadImage(p.bgPhoto)
    ctx.save()
    ctx.filter = 'blur(7px) saturate(0.55)' // page.tsx 사진 레이어와 동일
    ctx.translate(W / 2, H / 2)
    ctx.scale(1.04, 1.04)
    ctx.translate(-W / 2, -H / 2)
    drawCoverFit(ctx, photo, W, H)
    ctx.restore()
  }

  const bg = await svgToImage(auroraSvg(p.tribeId, hasBg))
  ctx.drawImage(bg, 0, 0, W, H)
  drawGrain(ctx)

  // ── 상단: 좌=날짜 / 우=메트릭 라벨 (top 72) ──
  const topY = px(72)
  ctx.fillStyle = INK
  ctx.font = `700 ${px(11)}px ${BODY}`
  setLetterSpacing(ctx, px(11) * 0.08)
  ctx.fillText(formatTopDate(p.date), PAD, topY)

  if (p.heroTemp != null) {
    setLetterSpacing(ctx, px(11) * 0.14)
    ctx.textAlign = 'right'
    ctx.fillText(p.metricLabel.toUpperCase(), W - PAD, topY)
    ctx.textAlign = 'left'
  }
  setLetterSpacing(ctx, 0)

  // ── 히어로: 온도 대형(°반잘림) 또는 물결 마크 폴백 (top 96) ──
  const heroTop = px(96)
  if (p.heroTemp != null) {
    const heroFs = px(130)
    const degFs = px(36)
    ctx.font = `700 ${heroFs}px ${OSWALD}`
    setLetterSpacing(ctx, heroFs * -0.03)
    const numText = String(p.heroTemp)
    const numW = ctx.measureText(numText).width
    ctx.font = `700 ${degFs}px ${OSWALD}`
    setLetterSpacing(ctx, 0)
    const degW = ctx.measureText('°').width
    // right: -6px → 우측 모서리 바깥으로 °가 반쯤 잘리게 (canvas가 자동 클립)
    const rightEdge = W - px(-6)
    const xNum = rightEdge - (numW + px(2) + degW)
    // 히어로 그라데이션 텍스트 (160deg 근사 → 세로 그라데이션)
    const heroH = heroFs * 0.84
    const grad = ctx.createLinearGradient(0, heroTop, 0, heroTop + heroH)
    grad.addColorStop(0, '#3a3330')
    grad.addColorStop(0.55, '#1c1917')
    ctx.fillStyle = grad
    ctx.font = `700 ${heroFs}px ${OSWALD}`
    setLetterSpacing(ctx, heroFs * -0.03)
    ctx.fillText(numText, xNum, heroTop)
    setLetterSpacing(ctx, 0)
    ctx.font = `700 ${degFs}px ${OSWALD}`
    ctx.fillText('°', xNum + numW + px(2), heroTop) // vertical-align: top
  } else {
    // 폴백: 물결 마크 (right 26 — 라벨 우측 축 정렬, width 120)
    const mark = await loadImage(STEAM_MARK)
    const mw = px(120)
    const mh = mw * (mark.naturalHeight / mark.naturalWidth)
    ctx.save()
    ctx.globalAlpha = 0.88
    ctx.drawImage(mark, W - PAD - mw, heroTop, mw, mh)
    ctx.restore()
  }

  // ── 워터마크: 물결 좌상단 반크기 (폴백 시에도 유지) ──
  {
    const mark = await loadImage(STEAM_MARK)
    const mw = px(20)
    const mh = mw * (mark.naturalHeight / mark.naturalWidth)
    ctx.save()
    ctx.globalAlpha = 0.11
    ctx.drawImage(mark, PAD, px(24), mw, mh)
    ctx.restore()
  }

  // ── 좌중: 사우나명 (top 230) ──
  ctx.fillStyle = INK
  ctx.font = `700 ${px(12.5)}px ${BODY}`
  setLetterSpacing(ctx, px(12.5) * 0.01)
  ctx.fillText(p.placeName, PAD, px(230), px(200))
  setLetterSpacing(ctx, 0)

  // ── 루틴 타임라인 + (+N) + 세트 + 점수 (top 256) ──
  const fs = p.dense ? px(11.5) : px(12.5)
  const lineH = fs * (p.dense ? 1.58 : 1.9)
  const glyphOffset = (lh: number, size: number) => (lh - size) / 2 // 줄박스 내 글리프 수직 중앙 근사
  let y = px(256)

  const dashMargin = px(6)
  for (const ln of p.routineLines) {
    const gy = y + glyphOffset(lineH, fs)
    let x = PAD
    ctx.font = `700 ${fs}px ${BODY}`
    setLetterSpacing(ctx, fs * 0.01)
    ctx.fillStyle = INK
    ctx.fillText(ln.name, x, gy)
    x += ctx.measureText(ln.name).width

    if (ln.parts.length === 0) {
      // bare: 이름 뒤 장식 라인 (폭 135)
      const lineEnd = PAD + px(135)
      const cy = y + lineH / 2
      ctx.strokeStyle = 'rgba(28,25,23,0.22)'
      ctx.lineWidth = 5 // 1.5px × 3.6
      ctx.beginPath()
      ctx.moveTo(x + px(11), cy)
      ctx.lineTo(lineEnd, cy)
      ctx.stroke()
    } else {
      ctx.font = `400 ${fs}px ${BODY}`
      for (const part of ln.parts) {
        ctx.fillStyle = INK_M
        x += dashMargin
        ctx.fillText('—', x, gy)
        x += ctx.measureText('—').width + dashMargin
        ctx.fillStyle = INK
        ctx.fillText(part, x, gy)
        x += ctx.measureText(part).width
      }
    }
    setLetterSpacing(ctx, 0)
    y += lineH
  }

  if (p.hiddenCount > 0) {
    const hFs = px(11.5)
    const hLineH = hFs * 1.58
    ctx.fillStyle = INK
    ctx.font = `400 ${hFs}px ${BODY}`
    ctx.fillText(`+ ${p.hiddenCount} 활동`, PAD, y + glyphOffset(hLineH, hFs))
    y += hLineH
  }

  if (p.repeat > 1) {
    const gy = y + glyphOffset(lineH, fs)
    let x = PAD
    ctx.fillStyle = INK
    ctx.font = `700 ${fs}px ${BODY}`
    setLetterSpacing(ctx, fs * 0.01)
    ctx.fillText('세트', x, gy)
    x += ctx.measureText('세트').width + dashMargin
    // × — 더 얇고 살짝 크게, 살짝 내려 정렬 (vertical-align -1px)
    const xFs = px(15)
    ctx.fillStyle = INK_M
    ctx.font = `300 ${xFs}px ${BODY}`
    const xGy = gy - (xFs - fs) / 2 + px(1)
    ctx.fillText('×', x, xGy)
    x += ctx.measureText('×').width + dashMargin
    ctx.fillStyle = INK
    ctx.font = `400 ${fs}px ${BODY}`
    ctx.fillText(String(p.repeat), x, gy)
    setLetterSpacing(ctx, 0)
    y += lineH
  }

  if (p.scoreValue != null) {
    const sFs = px(12)
    const sy = y + (p.dense ? px(9) : px(12))
    ctx.fillStyle = INK
    ctx.font = `700 ${sFs}px ${BODY}`
    ctx.fillText(p.scoreLabel, PAD, sy)
    const labelW = ctx.measureText(p.scoreLabel).width
    // 점 5개 — 채움=잉크 원 / 빈=잉크 2px 테두리 원, 라벨과 수직 중앙 정렬
    const pipD = px(7)
    const pipGap = px(4)
    const cy = sy + sFs / 2
    let cx = PAD + labelW + px(8) + pipD / 2
    for (let n = 1; n <= 5; n++) {
      ctx.beginPath()
      if (n <= p.scoreValue) {
        ctx.arc(cx, cy, pipD / 2, 0, Math.PI * 2)
        ctx.fillStyle = INK
        ctx.fill()
      } else {
        ctx.arc(cx, cy, (pipD - 2) / 2, 0, Math.PI * 2)
        ctx.strokeStyle = INK
        ctx.lineWidth = 2
        ctx.stroke()
      }
      cx += pipD + pipGap
    }
  }

  // ── 하단 한 줄: 좌=점+트라이브명(Oswald bold italic) / 우=칭호·닉네임 ──
  const rowFs = px(11)
  const rowGlyphY = H - px(26) - Math.round(rowFs * 1.15) // bottom 26 앵커, 한 줄 높이 근사
  const rowCenterY = rowGlyphY + rowFs / 2

  // 좌: 트라이브 점 + 트라이브명
  const dotD = px(11)
  ctx.beginPath()
  ctx.arc(PAD + dotD / 2, rowCenterY, dotD / 2, 0, Math.PI * 2)
  ctx.fillStyle = DOT_COLOR[p.tribeId]
  ctx.fill()

  ctx.fillStyle = INK
  ctx.font = `italic 700 ${rowFs}px ${OSWALD}`
  setLetterSpacing(ctx, rowFs * 0.06)
  ctx.fillText(TRIBE_EN[p.tribeId], PAD + dotD + px(7), rowGlyphY)
  setLetterSpacing(ctx, 0)

  // 우: 칭호(일반·-0.5px 보정) · 닉네임(bold) — 자간 .02em
  const nickname = p.userNickname || 'SA-PIEN'
  ctx.font = `700 ${rowFs}px ${BODY}`
  setLetterSpacing(ctx, rowFs * 0.02)
  const nickW = ctx.measureText(nickname).width
  ctx.fillStyle = INK
  ctx.fillText(nickname, W - PAD - nickW, rowGlyphY)

  if (p.userTitle) {
    const titleFs = px(10.5)
    const titleText = `${p.userTitle} · `
    ctx.font = `400 ${titleFs}px ${BODY}`
    setLetterSpacing(ctx, titleFs * 0.02)
    const titleW = ctx.measureText(titleText).width
    ctx.fillText(titleText, W - PAD - nickW - titleW, rowGlyphY + (rowFs - titleFs) / 2)
  }
  setLetterSpacing(ctx, 0)

  // ── Blob 반환 ──
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
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
