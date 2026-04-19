'use client'

/**
 * 큐레이션(is_featured) 가로 캐러셀 카드 — 단색 배경 + 이모지/아이콘
 * 상단: 이모지 좌 + 구독 pill 우 (B안: 아웃라인)
 * 하단: 제목(1줄) + 설명(2줄) + 메타(유저네임 · 곳 수)
 * 블랙 그라데이션 없음 — 입체감은 inner shadow + ring으로 표현
 */

import type { SaList } from '@/types'
import { listBgColor } from '@/lib/utils'

interface FeaturedSaListCardProps {
  list: SaList
  onClick: () => void
  /** 유저의 구독 여부 */
  subscribed?: boolean
  /** 구독 토글 핸들러 */
  onSubscribe?: () => void
}

export default function FeaturedSaListCard({
  list,
  onClick,
  subscribed,
  onSubscribe,
}: FeaturedSaListCardProps) {
  const bg = listBgColor(list.cover_hue)
  const handle = list.owner_nickname ? list.owner_nickname.toUpperCase() : ''
  const emoji = list.cover_emoji

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-shrink-0 w-[min(72vw,200px)] aspect-square rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform ring-1 ring-inset ring-white/25"
      style={{
        backgroundColor: bg,
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="absolute inset-0 p-3.5 flex flex-col z-[1]">
        {/* 상단: 이모지 좌 + 구독 pill 우 */}
        <div className="flex items-start justify-between">
          {emoji ? (
            <span className="text-[2.5rem] leading-none drop-shadow-sm" aria-hidden>{emoji}</span>
          ) : (
            <span
              className="material-symbols-outlined text-[2.5rem] text-white/90 drop-shadow-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
          )}

          {/* 구독 pill B안: 아웃라인 스타일 */}
          {subscribed !== undefined && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSubscribe?.() }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                subscribed
                  ? 'bg-white text-stone-700'
                  : 'bg-transparent border border-white/70 text-white'
              }`}
            >
              {subscribed && (
                <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>check</span>
              )}
              {subscribed ? '구독중' : '구독'}
            </button>
          )}
        </div>

        {/* 하단: 제목(1줄) + 설명(2줄) + 메타 */}
        <div className="mt-auto">
          <p className="text-white font-bold text-base leading-tight truncate drop-shadow-sm">
            {list.title}
          </p>
          <p className="text-white/90 text-[13px] mt-0.5 line-clamp-2 leading-relaxed drop-shadow-sm min-h-[2lh]">
            {list.description || '\u00A0'}
          </p>
          <p className="text-white/85 text-[11px] mt-1 uppercase tracking-wide">
            {handle}{handle ? ' · ' : ''}{list.place_count}곳
          </p>
        </div>
      </div>
    </button>
  )
}
