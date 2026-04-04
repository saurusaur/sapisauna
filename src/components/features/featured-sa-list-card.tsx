'use client'

/**
 * 큐레이션(is_featured) 가로 캐러셀 카드 — 단색 배경 + 이모지/아이콘 + 제목·핸들·곳 수
 * 비율: 가로를 기준으로 높이를 낮춘 랜드스케이프(스샷보다 살짝 낮은 느낌).
 */

import type { SaList } from '@/types'

interface FeaturedSaListCardProps {
  list: SaList
  onClick: () => void
}

export default function FeaturedSaListCard({ list, onClick }: FeaturedSaListCardProps) {
  const bg = list.cover_color || '#78716c'
  const handle = list.owner_nickname ? `@${list.owner_nickname}` : ''
  const emoji = list.cover_emoji

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-shrink-0 w-[min(72vw,216px)] aspect-[5/4] rounded-2xl overflow-hidden text-left shadow-md active:scale-[0.98] transition-transform"
      style={{ backgroundColor: bg }}
    >
      <div className="absolute inset-0 p-3.5 flex flex-col">
        <div className="flex items-start">
          {emoji ? (
            <span className="text-[2.25rem] leading-none" aria-hidden>{emoji}</span>
          ) : (
            <span
              className="material-symbols-outlined text-[2.25rem] text-white/90"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
          )}
        </div>
        <div className="mt-auto flex justify-between items-end gap-2 pt-2">
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate drop-shadow-sm">{list.title}</p>
            {handle ? <p className="text-white/85 text-[11px] truncate">{handle}</p> : null}
          </div>
          <span className="text-white text-xs font-semibold flex-shrink-0 tabular-nums">{list.place_count}곳</span>
        </div>
      </div>
    </button>
  )
}
