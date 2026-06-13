'use client'

/**
 * SA-PI FEATURED 공용 캐러셀 — /sa-list 홈, /home 로그인에서 재사용
 * - full 모드: FeaturedSaListCard (구독 pill · 메타 풍부) — /sa-list 전용
 * - compact 모드: 축소 카드 (이모지+제목+1줄 설명) + '사-피엔스 추천 사우나 리스트 더 보러가기' 링크 — /home 전용
 */

import { useRouter } from 'next/navigation'
import type { SaList } from '@/types'
import { listBgColor } from '@/lib/utils'
import { MESSAGES } from '@/constants/content'
import FeaturedSaListCard from './featured-sa-list-card'
import FeaturedPickCarousel from './featured-pick-carousel'

interface Props {
  lists: SaList[]
  compact?: boolean
  /** home variant — "SA-PI FEATURED" 섹션: 각도 똑바로·겹침 없음·높낮이 차이만, 이모지 없음 */
  home?: boolean
  /** 섹션 헤더 타이틀 커스텀 (기본 "SA-PI FEATURED") */
  title?: string
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
  home = false,
  title = 'SA-PI FEATURED',
  showSubtitle = true,
  showDiscoveryLink,
  onCardClick,
  subscribedIds,
  onSubscribe,
}: Props) {
  const router = useRouter()
  if (lists.length === 0) return null

  // ── home variant: /sa-list FEATURED와 동일한 사-피 PICK 카드(ListCoverCard) 재사용 ──
  if (home) {
    return (
      <section>
        <h2 className="text-[23px] font-extrabold italic font-heading tracking-wide text-[#2a2222]">
          {MESSAGES.HOME.FEATURED_HEADING}
        </h2>
        <p className="text-xs text-stone-500 font-medium mt-1 mb-3">{MESSAGES.HOME.FEATURED_SUBTITLE}</p>

        {/* -mx-5: 섹션 px-5 상쇄 → 풀블리드 스크롤 */}
        <FeaturedPickCarousel lists={lists} className="-mx-5 px-5 pt-2 pb-2" />
      </section>
    )
  }

  const showLink = showDiscoveryLink ?? compact
  // compact 모드는 홈(main p-4 컨텍스트)용 — 내부 px-4로 정렬 맞춤
  const px = compact ? 'px-4' : 'px-5'

  return (
    <section>
      <div className={`${px} pt-2 pb-2`}>
        <h2 className="text-sm font-bold text-stone-600">{title}</h2>
        {showSubtitle && (
          <p className="text-[11px] text-stone-400 font-normal mt-0.5">사-피 추천 리스트</p>
        )}
      </div>

      {compact ? (
        <div className={`flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 ${px}`}>
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => router.push(`/sa-list/${list.id}`)}
              className="flex-shrink-0 w-[170px] aspect-[1.35/1] rounded-[14px] p-3 flex flex-col justify-between text-left text-white active:scale-[0.96] transition-transform shadow-sm"
              style={{ backgroundColor: listBgColor(list.cover_hue) }}
            >
              <span className="text-[32px] leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}>
                {list.cover_emoji || '🧖'}
              </span>
              <div style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>
                <p className="text-[15px] font-bold leading-tight line-clamp-1">{list.title}</p>
                {list.description && (
                  <p className="text-[11px] leading-snug opacity-90 line-clamp-1 mt-0.5">{list.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-1 ${px}`}>
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
