/**
 * 로그 관련 React Hooks
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { LogWithPlace, UseDataState } from '@/types'
import * as logsService from '@/lib/logs-service'

// 최근 로그 (전체) — 탭 전환 시 자동 refetch
export function useLogs(limit = 20): UseDataState<LogWithPlace[]> {
  const [data, setData] = useState<LogWithPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const hasLoaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    // 첫 로딩만 로딩 UI 표시, 이후 탭 전환은 이전 데이터 유지하며 백그라운드 갱신
    if (!hasLoaded.current) setLoading(true)

    logsService.getRecentLogs(limit)
      .then((logs) => { if (!cancelled) { setData(logs); hasLoaded.current = true } })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [limit, pathname])

  return { data, loading, error }
}

// 현재 유저 로그 — 탭 전환 시 자동 refetch
export function useUserLogs(): UseDataState<LogWithPlace[]> {
  const [data, setData] = useState<LogWithPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const hasLoaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (!hasLoaded.current) setLoading(true)

    logsService.getUserLogs()
      .then((logs) => { if (!cancelled) { setData(logs); hasLoaded.current = true } })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [pathname])

  return { data, loading, error }
}

// 단일 로그
export function useLog(id: string): UseDataState<LogWithPlace | null> {
  const [data, setData] = useState<LogWithPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    logsService.getLogById(id)
      .then((log) => { if (!cancelled) setData(log) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  return { data, loading, error }
}

// 장소별 로그
export function useLogsByPlace(placeId: string): UseDataState<LogWithPlace[]> {
  const [data, setData] = useState<LogWithPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!placeId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    logsService.getLogsByPlace(placeId)
      .then((logs) => { if (!cancelled) setData(logs) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [placeId])

  return { data, loading, error }
}
