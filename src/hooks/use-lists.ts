/**
 * 리스트 데이터 훅 — 피드, 내 리스트, 리스트 상세
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import * as listsService from '@/lib/lists-service'
import type { SaList, ListItem, UseDataState } from '@/types'

// 내 리스트 목록 (기본 저장 포함)
export function useMyLists(): UseDataState<SaList[]> & { refresh: () => void } {
  const { user } = useAuth()
  const [data, setData] = useState<SaList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    listsService.getMyLists(user.id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refresh: refetch }
}

// 공개 리스트 피드 (인기순)
export function usePublicLists(limit = 20): UseDataState<SaList[]> {
  const [data, setData] = useState<SaList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    listsService.getPublicLists(limit)
      .then((lists) => { if (!cancelled) setData(lists) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [limit])

  return { data, loading, error }
}

// 단일 리스트 상세
export function useList(id: string): UseDataState<SaList | null> & { refresh: () => void } {
  const [data, setData] = useState<SaList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!id) { setLoading(false); return }
    setLoading(true)

    listsService.getListById(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refresh: refetch }
}

// 리스트 내 장소 아이템 (장소 정보 JOIN)
export function useListItems(listId: string): UseDataState<ListItem[]> & { refresh: () => void } {
  const [data, setData] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!listId) { setLoading(false); return }
    setLoading(true)

    listsService.getListItems(listId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [listId])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refresh: refetch }
}
