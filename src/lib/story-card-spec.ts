/**
 * 스토리 카드 레이아웃 스펙 — 단일 소스 (v3.5)
 *
 * 프리뷰(src/app/story/page.tsx)와 Canvas 내보내기(src/lib/image-export.ts)가
 * 이 모듈의 값만 사용한다 → 두 렌더러가 달라질 수 없는 구조(원천 차단).
 *
 * 좌표 체계: 1080×1920 native. 프로토타입(300px)의 3.6배 — spx(프로토값) = native값.
 * 디자인 SSOT: docs/wireframes/[final]_스토리_프로토타입_v3_20260609.html
 */

import type { StoryTribeId } from '@/constants/story-colors'

export const CARD_W = 1080
export const CARD_H = 1920
const S = 3.6
export const spx = (n: number) => Math.round(n * S)

// ── 컬러 ──
export const INK = '#1c1917'
export const DASH_COLOR = '#1c1917' // 루틴 구분 라인 — 폰트 색과 완전 동일 (v3.5.1)
export const BARE_RULE_COLOR = '#1c1917' // bare 장식 라인 — 구분 실선과 동일 (v3.5.1)
export const DOT_COLOR: Record<StoryTribeId, string> = { saunner: '#F97316', bather: '#3B82F6', jimi: '#22C55E' }
export const TRIBE_EN: Record<StoryTribeId, string> = { saunner: 'SAUNNER', bather: 'BATHER', jimi: 'JIMI' }
export const METRIC_LABEL: Record<StoryTribeId, string> = { saunner: 'TEMP DELTA', bather: 'BATH TEMP', jimi: 'JJIMJIL TEMP' }
export const SCORE_LABEL: Record<StoryTribeId, string> = { saunner: 'TOTONOU', bather: 'WATER', jimi: 'SWEAT' }

export const STEAM_MARK = '/logo/sauna-steam-mark.svg'

// ── 오로라 그라데이션 (구조화 데이터 → CSS/SVG 양쪽 파생) ──
// rgb: 'r,g,b' 문자열 / stop: [rgb, opacity, offset]
type Stop = [rgb: string, opacity: number, offset: number]
export interface TribeAurora {
  r1: Stop[]
  r2: Stop[]
  base: Array<[rgb: string, opacity: number]> // 135deg linear [from, to]
  baseColor: string
}

// 라디얼 지오메트리 (CSS 표기 / canvas용 비율)
export const R1_CSS = '120% 85% at 80% 26%'
export const R2_CSS = '90% 70% at 10% 64%'
export const R1_GEO = { cx: 0.8, cy: 0.26, rx: 1.2, ry: 0.85 } // ×W/H
export const R2_GEO = { cx: 0.1, cy: 0.64, rx: 0.9, ry: 0.7 }

const WHITE = '255,255,255'

export const AURORA_DATA: Record<StoryTribeId, TribeAurora> = {
  saunner: {
    r1: [['249,115,22', 0.82, 0], ['251,146,60', 0.45, 0.3], [WHITE, 0, 0.62]],
    r2: [['244,114,182', 0.42, 0], [WHITE, 0, 0.55]],
    base: [['253,246,240', 1], [WHITE, 1]],
    baseColor: '#fdf6f0',
  },
  bather: {
    r1: [['40,120,160', 0.8, 0], ['96,165,210', 0.42, 0.32], [WHITE, 0, 0.64]],
    r2: [['125,211,222', 0.45, 0], [WHITE, 0, 0.55]],
    base: [['238,246,250', 1], [WHITE, 1]],
    baseColor: '#eef6fa',
  },
  jimi: {
    r1: [['34,170,90', 0.78, 0], ['110,200,130', 0.4, 0.32], [WHITE, 0, 0.64]],
    r2: [['190,220,140', 0.45, 0], [WHITE, 0, 0.55]],
    base: [['240,248,242', 1], [WHITE, 1]],
    baseColor: '#f0f8f2',
  },
}

// 사진 모드: 라디얼 강화 + 흰 베이스만 반투명(.38→.46)
export const AURORA_PHOTO_DATA: Record<StoryTribeId, TribeAurora> = {
  saunner: {
    r1: [['249,115,22', 0.88, 0], ['251,146,60', 0.52, 0.3], [WHITE, 0, 0.62]],
    r2: [['244,114,182', 0.48, 0], [WHITE, 0, 0.55]],
    base: [['253,246,240', 0.38], [WHITE, 0.46]],
    baseColor: 'transparent',
  },
  bather: {
    r1: [['40,120,160', 0.86, 0], ['96,165,210', 0.49, 0.32], [WHITE, 0, 0.64]],
    r2: [['125,211,222', 0.52, 0], [WHITE, 0, 0.55]],
    base: [['238,246,250', 0.38], [WHITE, 0.46]],
    baseColor: 'transparent',
  },
  jimi: {
    r1: [['34,170,90', 0.84, 0], ['110,200,130', 0.47, 0.32], [WHITE, 0, 0.64]],
    r2: [['190,220,140', 0.52, 0], [WHITE, 0, 0.55]],
    base: [['240,248,242', 0.38], [WHITE, 0.46]],
    baseColor: 'transparent',
  },
}

/** CSS background 문자열 생성 (프리뷰용) */
export function cssAurora(tribe: StoryTribeId, photoMode: boolean): string {
  const a = (photoMode ? AURORA_PHOTO_DATA : AURORA_DATA)[tribe]
  const stops = (s: Stop[]) => s.map(([rgb, o, off]) => `rgba(${rgb},${o}) ${off * 100}%`).join(', ')
  return (
    `radial-gradient(${R1_CSS}, ${stops(a.r1)}),` +
    `radial-gradient(${R2_CSS}, ${stops(a.r2)}),` +
    `linear-gradient(135deg, rgba(${a.base[0][0]},${a.base[0][1]}) 0%, rgba(${a.base[1][0]},${a.base[1][1]}) 100%)`
  )
}

// ── 그레인 (feTurbulence — CSS data-uri와 Canvas SVG가 같은 소스) ──
export const GRAIN_TILE = 240 // 타일 한 변(프로토 px) — 표시 시 ×3.6
const GRAIN_RAW =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAIN_TILE}" height="${GRAIN_TILE}">` +
  `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter>` +
  `<rect width="100%" height="100%" filter="url(#n)"/></svg>`
export const GRAIN_SVG = GRAIN_RAW
export const GRAIN_URI = `data:image/svg+xml,${encodeURIComponent(GRAIN_RAW)}`
export const GRAIN_ALPHA = 0.07

// ── 사진 레이어 ──
export const PHOTO_FILTER = 'blur(7px) saturate(0.55)'
export const PHOTO_SCALE = 1.04

// ── 레이아웃 스펙 (native px) ──
export const SPEC = {
  pad: spx(20), // 좌우·기준 여백 (v3.4: 20)

  top: { y: spx(72), fs: spx(11), dateLs: 0.08, metricLs: 0.14, metricMaxW: spx(130) },

  hero: {
    top: spx(96), fs: spx(130), lh: 0.84, ls: -0.03,
    degFs: spx(36), gap: spx(2), // 숫자↔° 간격. ° 중심 = 카드 우측 모서리(반잘림)
    previewRight: spx(-7), // CSS 근사값(° 반잘림). Canvas는 measureText('°')/2로 정확 계산
    gradFrom: '#3a3330', gradTo: '#1c1917', gradStop: 0.55,
  },

  watermark: { x: spx(20), y: spx(92), w: spx(20), alpha: 0.11 }, // 날짜 아래

  fallbackMark: { w: spx(120), alpha: 0.88 }, // right=pad, top=hero.top

  place: { top: spx(230), fs: spx(12.5), lh: 1, ls: 0.01, maxW: spx(200) },

  routine: {
    top: spx(256), fs: spx(12.5), lh: 1.8, denseFs: spx(11.5), denseLh: 1.58, ls: 0.01,
    // 구분 라인: 글리프(—) 대신 실선 — 렌더러 간 폰트 차이 원천 제거 (v3.5)
    // v3.5.1: 잉크색 완전 동일·두께 1px(프로토)·middle에서 1px 올려 정중앙
    dash: { w: spx(10), h: spx(0.8), margin: spx(6), color: DASH_COLOR, raise: spx(1) }, // 두께 0.8(프로토)
    bare: { w: spx(135), ruleGap: spx(11), ruleH: spx(0.8), color: BARE_RULE_COLOR }, // 두께·색 = 구분 실선과 동일
    x: { fs: spx(15), drop: spx(1) }, // 세트 × — 잉크색, baseline +drop
    more: { fs: spx(11.5), lh: 1.58 }, // 「+N 활동」
  },

  score: { fs: spx(12), mt: spx(12), denseMt: spx(9), pipD: spx(7), pipGap: spx(4), pipMl: spx(8), pipStroke: 2 },

  foot: {
    bottom: spx(72), // IG 답장바 회피
    fs: spx(11), lh: 1, gap: spx(10), // v3.5: 줄박스 lh 1 + 갭 10(프로토) — 루틴 줄 갭과 동일 체감
    dotD: spx(11), dotGap: spx(7),
    titleFs: spx(10.5), tribeLs: 0.06, nameLs: 0.02,
    sep: spx(4), // 칭호 · 닉네임 — 점 양쪽 균일 갭 (v3.5)
  },
} as const
