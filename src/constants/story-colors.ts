/**
 * 스토리 카드 색상 상수
 * API route, story page, Canvas 합성 모두 이 파일에서 import
 * 색상 변경 시 이 파일 하나만 수정하면 전체 반영
 */

export const STORY_COLORS = {
  saunner: {
    bg: '#c25c4a',       // 스토리 카드 배경
    dot: '#cc1a1a',      // 트라이브 점 (--color-primary)
    rgb: '194,92,74',    // 그라데이션 tint용 RGB
  },
  bather: {
    bg: '#4a8b9c',
    dot: '#3B82F6',      // --color-bather
    rgb: '74,139,156',
  },
  jimi: {
    bg: '#61906d',
    dot: '#22C55E',      // --color-jimi
    rgb: '97,144,109',
  },
} as const

export type StoryTribeId = keyof typeof STORY_COLORS
