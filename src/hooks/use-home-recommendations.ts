/**
 * 홈 화면 추천 장소 훅
 * 유저 로그에서 장소별 평균 revisit_score ≥ 3.5인 상위 장소 반환
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import type { Place, UseDataState } from '@/types'
import { usePlaces } from '@/hooks/use-places'
import { useUserLogs } from '@/hooks/use-logs'

export function useHomeRecommendations(limit = 5): UseDataState<Place[]> {
  const { data: userLogs, loading: logsLoading } = useUserLogs()
  const { data: places, loading: placesLoading } = usePlaces()

  const recommendations = useMemo(() => {
    if (userLogs.length === 0 || places.length === 0) return []

    // 장소별 revisit_score 평균 계산
    const placeScores = new Map<string, { total: number; count: number }>()
    for (const log of userLogs) {
      const existing = placeScores.get(log.place_id) || { total: 0, count: 0 }
      existing.total += log.revisit_score
      existing.count += 1
      placeScores.set(log.place_id, existing)
    }

    // avg ≥ 3.5 필터 → 점수 높은 순 정렬 → 상위 limit개
    const qualified = Array.from(placeScores.entries())
      .map(([placeId, { total, count }]) => ({ placeId, avg: total / count }))
      .filter(({ avg }) => avg >= 3.5)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, limit)

    // Place 객체로 매핑
    const placeMap = new Map(places.map(p => [p.id, p]))
    return qualified
      .map(({ placeId }) => placeMap.get(placeId))
      .filter((p): p is Place => !!p)
  }, [userLogs, places, limit])

  return {
    data: recommendations,
    loading: logsLoading || placesLoading,
    error: null,
  }
}
