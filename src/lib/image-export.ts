/**
 * 스토리 카드 Canvas 렌더러 + 공유/다운로드 유틸리티 (v3.5)
 *
 * 레이아웃·컬러·그라데이션은 전부 공유 스펙(src/lib/story-card-spec.ts)에서 가져온다
 * — 프리뷰(page.tsx)와 같은 값을 쓰므로 두 렌더러가 달라질 수 없음(단일 소스).
 * 표시 데이터(히어로·루틴 줄·압축·점수)도 페이지가 계산한 값을 그대로 받는다.
 *
 * 수직 정렬: CSS 줄박스 공식(baseline = top + (행간·fs − (A+D))/2 + A)을
 * fontBoundingBox 메트릭으로 재현 (textBaseline='alphabetic').
 * 루틴 구분자는 글리프(—) 대신 실선 — 폰트 렌더링 차이까지 제거.
 */

import { type StoryTribeId } from '@/constants/story-colors'
import {
  CARD_W as W, CARD_H as H, SPEC, INK,
  DOT_COLOR, TRIBE_EN, STEAM_MARK,
  AURORA_DATA, AURORA_PHOTO_DATA, R1_GEO, R2_GEO, type TribeAurora,
  GRAIN_SVG, GRAIN_TILE, GRAIN_ALPHA, PHOTO_FILTER, PHOTO_SCALE, spx,
} from '@/lib/story-card-spec'

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
  metricLabel: string
  routineLines: RoutineLineData[] // 오버플로(7줄 컷) 적용 후
  hiddenCount: number // 「+N 활동」
  repeat: number // >1 이면 세트줄
  dense: boolean // 압축 모드
  scoreLabel: string
  scoreValue: number | null // 1~5, 점 5개
  userNickname?: string
  userTitle?: string
}

// ─── 오로라 SVG (스펙의 구조화 데이터 → SVG 래스터, CSS와 동일 값) ───

function auroraSvg(tribe: StoryTribeId, photoMode: boolean): string {
  const a: TribeAurora = (photoMode ? AURORA_PHOTO_DATA : AURORA_DATA)[tribe]
  const radial = (id: string, geo: typeof R1_GEO, stops: TribeAurora['r1']) =>
    `<radialGradient id="${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" ` +
    `gradientTransform="translate(${geo.cx * W},${geo.cy * H}) scale(${geo.rx * W},${geo.ry * H})">` +
    stops.map(([rgb, o, off]) => `<stop offset="${off}" stop-color="rgb(${rgb})" stop-opacity="${o}"/>`).join('') +
    `</radialGradient>`
  // CSS 135deg: 중심 통과, 우하향 대각 방향
  const d = Math.SQRT1_2
  const len = (W + H) * d
  const x1 = W / 2 - (d * len) / 2
  const y1 = H / 2 - (d * len) / 2
  const x2 = W / 2 + (d * len) / 2
  const y2 = H / 2 + (d * len) / 2
  const linear =
    `<linearGradient id="base" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0" stop-color="rgb(${a.base[0][0]})" stop-opacity="${a.base[0][1]}"/>` +
    `<stop offset="1" stop-color="rgb(${a.base[1][0]})" stop-opacity="${a.base[1][1]}"/>` +
    `</linearGradient>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<defs>${radial('r1', R1_GEO, a.r1)}${radial('r2', R2_GEO, a.r2)}${linear}</defs>` +
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

function formatTopDate(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, '.') // 요일 없음
}

// ─── CSS 줄박스 ↔ Canvas baseline 변환 ───
function makeTypo(ctx: CanvasRenderingContext2D) {
  const cache: Record<string, { A: number; D: number; xh: number }> = {}
  const metrics = (font: string) => {
    if (!cache[font]) {
      const prev = ctx.font
      ctx.font = font
      const m = ctx.measureText('Mg')
      const xm = ctx.measureText('x')
      cache[font] = { A: m.fontBoundingBoxAscent, D: m.fontBoundingBoxDescent, xh: xm.actualBoundingBoxAscent }
      ctx.font = prev
    }
    return cache[font]
  }
  return {
    metrics,
    // CSS top → canvas alphabetic baseline y (lh=null → line-height:normal)
    baseline(cssTop: number, fs: number, lh: number | null, font: string): number {
      const { A, D } = metrics(font)
      const lineH = lh != null ? lh * fs : A + D
      return cssTop + (lineH - (A + D)) / 2 + A
    },
    // 줄박스 수직 중앙 (도트·점 정렬용)
    centerY(cssTop: number, fs: number, lh: number | null, font: string): number {
      const { A, D } = metrics(font)
      const lineH = lh != null ? lh * fs : A + D
      return cssTop + lineH / 2
    },
    contentH(font: string): number {
      const { A, D } = metrics(font)
      return A + D
    },
  }
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
  ctx.textBaseline = 'alphabetic'
  const typo = makeTypo(ctx)

  const hasBg = !!p.bgPhoto
  const PAD = SPEC.pad

  // ── 배경: 베이스색 → (사진) → 오로라 → 그레인 ──
  ctx.fillStyle = hasBg ? '#ffffff' : AURORA_DATA[p.tribeId].baseColor
  ctx.fillRect(0, 0, W, H)

  if (p.bgPhoto) {
    const photo = await loadImage(p.bgPhoto)
    ctx.save()
    ctx.filter = PHOTO_FILTER
    ctx.translate(W / 2, H / 2)
    ctx.scale(PHOTO_SCALE, PHOTO_SCALE)
    ctx.translate(-W / 2, -H / 2)
    drawCoverFit(ctx, photo, W, H)
    ctx.restore()
  }

  const bg = await svgToImage(auroraSvg(p.tribeId, hasBg))
  ctx.drawImage(bg, 0, 0, W, H)

  // 그레인 — 프리뷰와 동일한 feTurbulence 타일 (×3.6 확대 타일링)
  try {
    const grain = await svgToImage(GRAIN_SVG)
    ctx.save()
    ctx.globalAlpha = GRAIN_ALPHA
    ctx.globalCompositeOperation = 'multiply'
    const T = spx(GRAIN_TILE)
    for (let y = 0; y < H; y += T) {
      for (let x = 0; x < W; x += T) {
        ctx.drawImage(grain, x, y, T, T)
      }
    }
    ctx.restore()
  } catch {
    // 그레인 실패 시 생략 (장식 레이어)
  }

  // ── 상단: 좌=날짜 / 우=메트릭 라벨 ──
  const topFont = `700 ${SPEC.top.fs}px ${BODY}`
  ctx.fillStyle = INK
  ctx.font = topFont
  setLetterSpacing(ctx, SPEC.top.fs * SPEC.top.dateLs)
  ctx.fillText(formatTopDate(p.date), PAD, typo.baseline(SPEC.top.y, SPEC.top.fs, null, topFont))

  if (p.heroTemp != null) {
    setLetterSpacing(ctx, SPEC.top.fs * SPEC.top.metricLs)
    ctx.textAlign = 'right'
    ctx.fillText(p.metricLabel.toUpperCase(), W - PAD, typo.baseline(SPEC.top.y, SPEC.top.fs, null, topFont))
    ctx.textAlign = 'left'
  }
  setLetterSpacing(ctx, 0)

  // ── 히어로: 온도 대형(° 중심=카드 모서리 반잘림) 또는 물결 마크 폴백 ──
  if (p.heroTemp != null) {
    const { fs: heroFs, degFs, top: heroTop, lh: heroLh, ls: heroLs, gap } = SPEC.hero
    const heroFont = `700 ${heroFs}px ${OSWALD}`
    const degFont = `700 ${degFs}px ${OSWALD}`
    ctx.font = heroFont
    setLetterSpacing(ctx, heroFs * heroLs)
    const numText = String(p.heroTemp)
    const numW = ctx.measureText(numText).width
    setLetterSpacing(ctx, 0)
    ctx.font = degFont
    const degW = ctx.measureText('°').width
    // ° 글리프 중심 = 카드 우측 모서리 → 좌측 절반만 보임 (canvas가 우측 자동 클립)
    const xDegLeft = W - degW / 2
    const xNum = xDegLeft - gap - numW

    const heroBaseline = typo.baseline(heroTop, heroFs, heroLh, heroFont)
    const heroA = typo.metrics(heroFont).A
    const grad = ctx.createLinearGradient(0, heroBaseline - heroA, 0, heroBaseline)
    grad.addColorStop(0, SPEC.hero.gradFrom)
    grad.addColorStop(SPEC.hero.gradStop, SPEC.hero.gradTo)
    ctx.fillStyle = grad
    ctx.font = heroFont
    setLetterSpacing(ctx, heroFs * heroLs)
    ctx.fillText(numText, xNum, heroBaseline)
    setLetterSpacing(ctx, 0)
    // ° — CSS vertical-align:top 재현 (줄박스 상단 기준)
    ctx.font = degFont
    ctx.fillText('°', xDegLeft, typo.baseline(heroTop, degFs, null, degFont))
  } else {
    const mark = await loadImage(STEAM_MARK)
    const mw = SPEC.fallbackMark.w
    const mh = mw * (mark.naturalHeight / mark.naturalWidth)
    ctx.save()
    ctx.globalAlpha = SPEC.fallbackMark.alpha
    ctx.drawImage(mark, W - PAD - mw, SPEC.hero.top, mw, mh)
    ctx.restore()
  }

  // ── 워터마크: 물결 날짜 아래 (폴백 시에도 유지) ──
  {
    const mark = await loadImage(STEAM_MARK)
    const mw = SPEC.watermark.w
    const mh = mw * (mark.naturalHeight / mark.naturalWidth)
    ctx.save()
    ctx.globalAlpha = SPEC.watermark.alpha
    ctx.drawImage(mark, SPEC.watermark.x, SPEC.watermark.y, mw, mh)
    ctx.restore()
  }

  // ── 좌중: 사우나명 ──
  const placeFont = `700 ${SPEC.place.fs}px ${BODY}`
  ctx.fillStyle = INK
  ctx.font = placeFont
  setLetterSpacing(ctx, SPEC.place.fs * SPEC.place.ls)
  ctx.fillText(p.placeName, PAD, typo.baseline(SPEC.place.top, SPEC.place.fs, SPEC.place.lh, placeFont), SPEC.place.maxW)
  setLetterSpacing(ctx, 0)

  // ── 루틴 타임라인 + (+N) + 세트 + 점수 ──
  const fs = p.dense ? SPEC.routine.denseFs : SPEC.routine.fs
  const lh = p.dense ? SPEC.routine.denseLh : SPEC.routine.lh
  const lineH = fs * lh
  const nameFont = `700 ${fs}px ${BODY}`
  const valFont = `400 ${fs}px ${BODY}`
  let y = SPEC.routine.top

  const { dash, bare } = SPEC.routine
  for (const ln of p.routineLines) {
    const by = typo.baseline(y, fs, lh, nameFont)
    let x = PAD
    ctx.font = nameFont
    setLetterSpacing(ctx, fs * SPEC.routine.ls)
    ctx.fillStyle = INK
    ctx.fillText(ln.name, x, by)
    x += ctx.measureText(ln.name).width

    if (ln.parts.length === 0) {
      // bare: 이름 뒤 장식 라인 — 줄박스 수직 중앙 + raise 보정 (구분 실선과 동일 룩)
      const cy = y + lineH / 2 - dash.raise
      ctx.fillStyle = bare.color
      ctx.fillRect(x + bare.ruleGap, cy - bare.ruleH / 2, PAD + bare.w - (x + bare.ruleGap), bare.ruleH)
    } else {
      ctx.font = valFont
      // 구분 실선의 수직 중앙 = CSS vertical-align:middle (baseline − x-height/2) + raise 보정 (v3.5.1)
      const midY = by - typo.metrics(valFont).xh / 2 - dash.raise
      for (const part of ln.parts) {
        x += dash.margin
        ctx.fillStyle = dash.color
        ctx.fillRect(x, midY - dash.h / 2, dash.w, dash.h)
        x += dash.w + dash.margin
        ctx.fillStyle = INK
        ctx.fillText(part, x, by)
        x += ctx.measureText(part).width
      }
    }
    setLetterSpacing(ctx, 0)
    y += lineH
  }

  if (p.hiddenCount > 0) {
    const { fs: mFs, lh: mLh } = SPEC.routine.more
    const mFont = `400 ${mFs}px ${BODY}`
    ctx.fillStyle = INK
    ctx.font = mFont
    ctx.fillText(`+ ${p.hiddenCount} 활동`, PAD, typo.baseline(y, mFs, mLh, mFont))
    y += mFs * mLh
  }

  if (p.repeat > 1) {
    const by = typo.baseline(y, fs, lh, nameFont)
    let x = PAD
    ctx.fillStyle = INK
    ctx.font = nameFont
    setLetterSpacing(ctx, fs * SPEC.routine.ls)
    ctx.fillText('세트', x, by)
    x += ctx.measureText('세트').width + dash.margin
    // × — 얇고 살짝 크게, 잉크색, baseline 공유 + drop
    ctx.font = `300 ${SPEC.routine.x.fs}px ${BODY}`
    ctx.fillText('×', x, by + SPEC.routine.x.drop)
    x += ctx.measureText('×').width + dash.margin
    ctx.font = valFont
    ctx.fillText(String(p.repeat), x, by)
    setLetterSpacing(ctx, 0)
    y += lineH
  }

  if (p.scoreValue != null) {
    const sFont = `700 ${SPEC.score.fs}px ${BODY}`
    const sy = y + (p.dense ? SPEC.score.denseMt : SPEC.score.mt)
    ctx.fillStyle = INK
    ctx.font = sFont
    ctx.fillText(p.scoreLabel, PAD, typo.baseline(sy, SPEC.score.fs, null, sFont))
    const labelW = ctx.measureText(p.scoreLabel).width
    const cy = typo.centerY(sy, SPEC.score.fs, null, sFont)
    let cx = PAD + labelW + SPEC.score.pipMl + SPEC.score.pipD / 2
    for (let n = 1; n <= 5; n++) {
      ctx.beginPath()
      if (n <= p.scoreValue) {
        ctx.arc(cx, cy, SPEC.score.pipD / 2, 0, Math.PI * 2)
        ctx.fillStyle = INK
        ctx.fill()
      } else {
        ctx.arc(cx, cy, (SPEC.score.pipD - SPEC.score.pipStroke) / 2, 0, Math.PI * 2)
        ctx.strokeStyle = INK
        ctx.lineWidth = SPEC.score.pipStroke
        ctx.stroke()
      }
      cx += SPEC.score.pipD + SPEC.score.pipGap
    }
  }

  // ── 하단 우측 스택: 트라이브명+도트 위 / 칭호·닉네임 아래 (lh1 + 갭, 우측 정렬) ──
  const { fs: fFs, lh: fLh, gap: fGap, dotD, dotGap, titleFs, tribeLs, nameLs, sep, bottom } = SPEC.foot
  const tribeFont = `italic 700 ${fFs}px ${OSWALD}`
  const nameFont2 = `700 ${fFs}px ${BODY}`
  const titleFont = `400 ${titleFs}px ${BODY}`

  // lh=1 → 줄박스 높이 = fs
  const nameTop = H - bottom - fFs
  const tribeTop = nameTop - fGap - fFs

  // 트라이브명 + 도트 (이름 먼저, 도트 뒤)
  ctx.font = tribeFont
  setLetterSpacing(ctx, fFs * tribeLs)
  const tribeText = TRIBE_EN[p.tribeId]
  const tribeW = ctx.measureText(tribeText).width
  ctx.fillStyle = INK
  ctx.fillText(tribeText, W - PAD - dotD - dotGap - tribeW, typo.baseline(tribeTop, fFs, fLh, tribeFont))
  setLetterSpacing(ctx, 0)
  ctx.beginPath()
  ctx.arc(W - PAD - dotD / 2, tribeTop + fFs / 2, dotD / 2, 0, Math.PI * 2)
  ctx.fillStyle = DOT_COLOR[p.tribeId]
  ctx.fill()

  // 칭호 · 닉네임 — 점 양쪽 균일 갭(sep), 우측 정렬
  const nickname = p.userNickname || 'SA-PIEN'
  ctx.font = nameFont2
  setLetterSpacing(ctx, fFs * nameLs)
  const nickW = ctx.measureText(nickname).width
  ctx.fillStyle = INK
  const nameBaseline = typo.baseline(nameTop, fFs, fLh, nameFont2)
  ctx.fillText(nickname, W - PAD - nickW, nameBaseline)

  if (p.userTitle) {
    ctx.font = titleFont
    setLetterSpacing(ctx, titleFs * nameLs)
    const dotW = ctx.measureText('·').width
    const titleW = ctx.measureText(p.userTitle).width
    // 작은 폰트(칭호·점)를 닉네임 줄박스(fs, lh1) 수직 중앙에 — flex align-center 재현
    const smallBaseline = typo.baseline(nameTop + (fFs - titleFs) / 2, titleFs, 1, titleFont)
    const xDot = W - PAD - nickW - sep - dotW
    const xTitle = xDot - sep - titleW
    ctx.fillText('·', xDot, smallBaseline)
    ctx.fillText(p.userTitle, xTitle, smallBaseline)
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
