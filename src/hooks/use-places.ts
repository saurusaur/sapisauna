/**
 * 장소 관련 React Hooks
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Place } from '@/types'
import * as placesService from '@/lib/places-service'

interface UseDataState<T> {
  data: T
  loading: boolean
  error: string | null
}

// 전체 장소 목록
export function usePlaces(): UseDataState<Place[]> {
  const [data, setData] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    placesService.getPlaces()
      .then((places) => { if (!cancelled) setData(places) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

// 단일 장소 조회
export function usePlace(id: string): UseDataState<Place | null> {
  const [data, setData] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    placesService.getPlaceById(id)
      .then((place) => { if (!cancelled) setData(place) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  return { data, loading, error }
}

// 장소 검색
export function usePlaceSearch() {
  const [results, setResults] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const places = await placesService.searchPlaces(query)
      setResults(places)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search }
}

// 장소 통계 (단일)
export function usePlaceStats(placeId: string) {
  const [stats, setStats] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!placeId) { setLoading(false); return }

    let cancelled = false
    placesService.getPlaceStats(placeId)
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [placeId])

  return { stats, loading }
}
