'use client'

/**
 * 사-피 PICK 캐러셀 — /sa-list 'FEATURED' 섹션과 /home featured 섹션이 공유하는 카드 줄.
 * ListCoverCard(pick) + 세로 스태거 + 1번 카드 살짝 틸트. 섹션 헤더는 각 페이지가 따로 렌더.
 */

import { useRouter } from 'next/navigation'
import type { SaList } from '@/types'
import ListCoverCard from './list-cover-card'

/** 카드 세로 스태거 오프셋 */
const PICK_STAGGER = [0, 16, 6, 20, 10]

interface Props {
  lists: SaList[]
  /** 카드 클릭 (기본: /sa-list/{id} 이동) */
  onCardClick?: (list: SaList) => void
  /** 스크롤 컨테이너 패딩/마진 클래스 — 페이지별 정렬 (기본 sa-list용) */
  className?: string
}

export default function FeaturedPickCarousel({
  lists,
  onCardClick,
  className = 'px-6 pt-2 pb-2 -mb-2',
}: Props) {
  const router = useRouter()
  if (lists.length === 0) return null

  return (
    <div className={`flex gap-3 overflow-x-auto scrollbar-hide items-start ${className}`}>
      {lists.map((list, i) => (
        <ListCoverCard
          key={list.id}
          list={list}
          variant="pick"
          badge={list.featured_note || '사-피 PICK'}
          onClick={() => (onCardClick ? onCardClick(list) : router.push(`/sa-list/${list.id}`))}
          style={{
            marginTop: PICK_STAGGER[i % PICK_STAGGER.length],
            transform: i === 0 ? 'rotate(-2deg)' : undefined,
          }}
        />
      ))}
    </div>
  )
}
