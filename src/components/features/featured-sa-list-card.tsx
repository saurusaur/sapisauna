'use client'

/**
 * 큐레이션(is_featured) 가로 캐러셀 카드 — 단색 배경 + 이모지/아이콘
 * 상단: 이모지 좌 + 구독 pill 우
 * 하단: 제목(16px 2줄) + 설명(1줄) + 메타(유저네임 · 곳 수)
 */

import type { SaList } from '@/types'

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
  const bg = list.cover_color || '#78716c'
  const handle = list.owner_nickname ? list.owner_nickname.toUpperCase() : ''
  const emoji = list.cover_emoji

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-shrink-0 w-[min(72vw,200px)] aspect-square rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
      style={{
        backgroundColor: bg,
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* 하단 그라데이션 오버레이 (0.18) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.18] pointer-events-none" style={{ backgroundPosition: '0 55%' }} />

      <div className="absolute inset-0 p-3.5 flex flex-col z-[1]">
        {/* 상단: 이모지 좌 + 구독 pill 우 */}
        <div className="flex items-start justify-between">
          {emoji ? (
            <span className="text-[2.5rem] leading-none" aria-hidden>{emoji}</span>
          ) : (
            <span
              className="material-symbols-outlined text-[2.5rem] text-white/90"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
          )}

          {/* 구독 pill — subscribed prop이 undefined면 미표시 (비로그인) */}
          {subscribed !== undefined && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSubscribe?.() }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-0.5 backdrop-blur-sm ${
                subscribed
                  ? 'bg-white/90 text-stone-800'
                  : 'bg-white/90 text-red-600'
              }`}
            >
              {subscribed && (
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              )}
              {subscribed ? '구독중' : '구독하기'}
            </button>
          )}
        </div>

        {/* 하단: 제목 + 설명 + 메타 */}
        <div className="mt-auto">
          <p className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow-sm">
            {list.title}
          </p>
          {list.description && (
            <p className="text-white/75 text-xs mt-0.5 line-clamp-1">
              {list.description}
            </p>
          )}
          <p className="text-white/85 text-[11px] mt-1 uppercase tracking-wide">
            {handle}{handle ? ' · ' : ''}{list.place_count}곳
          </p>
        </div>
      </div>
    </button>
  )
}
