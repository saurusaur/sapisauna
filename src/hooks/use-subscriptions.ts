/**
 * 구독 훅 — 리스트 구독 토글 및 조회
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import * as listsService from '@/lib/lists-service'
import type { SaList, UseDataState } from '@/types'

// 내가 구독한 리스트 목록
export function useSubscribedLists(): UseDataState<SaList[]> & { refresh: () => void } {
  const { user } = useAuth()
  const [data, setData] = useState<SaList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    listsService.getSubscribedLists(user.id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refresh: refetch }
}

// 특정 리스트 구독 상태 및 토글
export function useSubscription(listId: string) {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!user || !listId) { setLoading(false); return }

    listsService.isSubscribed(user.id, listId)
      .then(setSubscribed)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, listId])

  const toggle = useCallback(async () => {
    if (!user || !listId || toggling) return
    setToggling(true)
    try {
      const result = await listsService.toggleSubscription(user.id, listId)
      setSubscribed(result)
      return result
    } finally {
      setToggling(false)
    }
  }, [user, listId, toggling])

  return { subscribed, loading, toggling, toggle }
}
