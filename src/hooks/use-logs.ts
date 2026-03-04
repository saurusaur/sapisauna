/**
 * 로그 관련 React Hooks
 */

'use client'

import { useState, useEffect } from 'react'
import type { LogWithPlace, UseDataState } from '@/types'
import * as logsService from '@/lib/logs-service'

// 최근 로그 (전체)
export function useLogs(limit = 20): UseDataState<LogWithPlace[]> {
  const [data, setData] = useState<LogWithPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    logsService.getRecentLogs(limit)
      .then((logs) => { if (!cancelled) setData(logs) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [limit])

  return { data, loading, error }
}

// 현재 유저 로그
export function useUserLogs(): UseDataState<LogWithPlace[]> {
  const [data, setData] = useState<LogWithPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    logsService.getUserLogs()
      .then((logs) => { if (!cancelled) setData(logs) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

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
