'use client'

import { EXPLORE } from '@/constants/content'
import { usePlaceStats } from '@/hooks/use-places'

// 장소 통계 표시용 컴포넌트 (place/page, explore/type/[type]/page 공유)
export default function PlaceStatsDisplay({ placeId }: { placeId: string }) {
  const { stats } = usePlaceStats(placeId)
  if (stats.count === 0) return null
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)', fontSize: '14px' }}>move</span>
      <span className="font-medium" style={{ color: 'var(--color-accent)' }}>
        {stats.avg}/5
      </span>
      <span className="text-stone-300">·</span>
      <span className="text-stone-500">{EXPLORE.LOG_COUNT(stats.count)}</span>
    </div>
  )
}
