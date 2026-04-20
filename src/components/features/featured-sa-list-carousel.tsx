'use client'

/**
 * SA-PI FEATURED 공용 캐러셀 — /sa-list 홈, /home 로그인에서 재사용
 * - full 모드: FeaturedSaListCard (구독 pill · 메타 풍부) — /sa-list 전용
 * - compact 모드: 축소 카드 (이모지+제목+1줄 설명) + '사-피엔스 추천 사우나 리스트 더 보러가기' 링크 — /home 전용
 */

import { useRouter } from 'next/navigation'
import type { SaList } from '@/types'
import { listBgColor } from '@/lib/utils'
import FeaturedSaListCard from './featured-sa-list-card'

interface Props {
  lists: SaList[]
  compact?: boolean
  /** 섹션 헤더 아래 서브 설명 노출 여부 (기본 true) */
  showSubtitle?: boolean
  /** compact 모드 전용 — 카드 아래 '더 보러가기' 링크 노출 (기본 compact=true일 때 on) */
  showDiscoveryLink?: boolean
  /** full 모드 전용 */
  onCardClick?: (list: SaList) => void
  subscribedIds?: Set<string>
  onSubscribe?: (list: SaList) => void
}

export default function FeaturedSaListCarousel({
  lists,
  compact = false,
  showSubtitle = true,
  showDiscoveryLink,
  onCardClick,
  subscribedIds,
  onSubscribe,
}: Props) {
  const router = useRouter()
  if (lists.length === 0) return null

  const showLink = showDiscoveryLink ?? compact

  return (
    <section>
      <div className="px-5 pt-2 pb-2">
        <h2 className="text-sm font-bold text-stone-600">SA-PI FEATURED</h2>
        {showSubtitle && (
          <p className="text-[11px] text-stone-400 font-normal mt-0.5">사-피 추천 리스트</p>
        )}
      </div>

      {compact ? (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 px-5">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => router.push(`/sa-list/${list.id}`)}
              className="flex-shrink-0 w-[170px] aspect-[1.35/1] rounded-[14px] p-3 flex flex-col justify-between text-left text-white active:scale-[0.96] transition-transform shadow-sm"
              style={{ backgroundColor: listBgColor(list.cover_hue) }}
            >
              <span className="text-[26px] leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}>
                {list.cover_emoji || '🧖'}
              </span>
              <div style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>
                <p className="text-[13px] font-bold leading-tight line-clamp-1">{list.title}</p>
                {list.description && (
                  <p className="text-[10px] leading-snug opacity-90 line-clamp-1 mt-0.5">{list.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
          {lists.map((list) => (
            <FeaturedSaListCard
              key={list.id}
              list={list}
              onClick={() => onCardClick?.(list) ?? router.push(`/sa-list/${list.id}`)}
              subscribed={subscribedIds?.has(list.id)}
              onSubscribe={onSubscribe ? () => onSubscribe(list) : undefined}
            />
          ))}
        </div>
      )}

      {showLink && (
        <button
          type="button"
          onClick={() => router.push('/sa-list')}
          className="mx-auto mt-2 flex items-center gap-0.5 px-4 py-1.5 text-[12px] font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          사-피엔스 추천 사우나 리스트 더 보러가기
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>chevron_right</span>
        </button>
      )}
    </section>
  )
}
