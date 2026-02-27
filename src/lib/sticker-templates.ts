/**
 * 스티커 타입 및 기본 템플릿 정의
 * 에디터 진입 시 tribe별 초기 스티커 배치를 제공
 */

export type StickerType =
  | 'temp-delta'    // ΔT (saunner: sauna-cold, bather: hot-cold)
  | 'heat-temp'     // HEAT temp (saunner=sauna, bather=hot water, jimi=한증막)
  | 'graph'         // 타입별 SVG 그래프
  | 'location'      // 장소명
  | 'timestamp'     // 날짜
  | 'comment'       // 자유 문구 (인라인 편집 가능)
  | 'score'         // 또갈래요 점수
  | 'nickname'      // 유저 닉네임
  | 'tribe'         // 유저 타입 (이모지+이름)
  | 'ritual-2line'  // 루틴 2줄 레이아웃
  | 'ritual-1col'   // 루틴 1컬럼 레이아웃

export type Sticker = {
  id: string
  type: StickerType
  x: number          // % (캔버스 기준 0-100)
  y: number          // %
  scale: number      // 1 = 기본
  rotation: 0 | 90 | 180 | 270
  text?: string      // comment 스티커용
  imageUrl?: string  // 캡처된 스티커 이미지 (에디터에서 사용)
}

// 스티커 타입별 최대 개수
export const STICKER_MAX_COUNT: Record<StickerType, number> = {
  'temp-delta': 1,
  'heat-temp': 1,
  'graph': 1,
  'location': 1,
  'timestamp': 1,
  'score': 1,
  'nickname': 1,
  'tribe': 1,
  'ritual-2line': 1,
  'ritual-1col': 1,
  'comment': 2,
}

// ritual 타입은 합산 1개 (2line + 1col 중 택1)
export const RITUAL_TYPES: StickerType[] = ['ritual-2line', 'ritual-1col']

let stickerCounter = 0
export function generateStickerId(): string {
  return `sticker-${Date.now()}-${++stickerCounter}`
}

/**
 * tribe별 기본 스티커 배치
 * 현재 프리뷰 카드 레이아웃을 개별 스티커로 분해
 */
export function getDefaultStickers(tribeId: string): Sticker[] {
  // 스티커 위치: 세로 공간을 넉넉하게 분배하여 겹침 방지
  const tempType: StickerType = tribeId === 'jimi' ? 'heat-temp' : 'temp-delta'

  return [
    {
      id: generateStickerId(),
      type: 'location',
      x: 50, y: 8,
      scale: 1, rotation: 0,
    },
    {
      id: generateStickerId(),
      type: 'timestamp',
      x: 50, y: 14,
      scale: 1, rotation: 0,
    },
    {
      id: generateStickerId(),
      type: tempType,
      x: 50, y: 38,
      scale: 1, rotation: 0,
    },
    {
      id: generateStickerId(),
      type: 'graph',
      x: 50, y: 65,
      scale: 0.8, rotation: 0,
    },
    {
      id: generateStickerId(),
      type: 'tribe',
      x: 50, y: 92,
      scale: 1, rotation: 0,
    },
  ]
}

// 앱 브랜드 기본 배경색
export const APP_BG_COLOR = 'var(--color-green)'

// tribe별 기본 배경색 매핑
export const TRIBE_BG_MAP: Record<string, string> = {
  saunner: '#c25c4a',
  bather: '#4a8b9c',
  jimi: '#61906d',
}

// tribe별 틴트 색상 (HSL 기반)
export const TRIBE_TINT_MAP: Record<string, { h: number; s: number; l: number }> = {
  saunner: { h: 9, s: 52, l: 52 },
  bather: { h: 195, s: 35, l: 45 },
  jimi: { h: 139, s: 22, l: 47 },
}
