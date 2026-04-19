/**
 * SavePlace Context — useSavePlace 로직을 앱 전체에서 공유
 *
 * 모든 컴포넌트가 동일한 savedMap 캐시를 사용하여
 * explore 페이지와 SaveBottomSheet 간 상태 불일치 방지
 */

'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import * as listsService from '@/lib/lists-service'
import type { SaList } from '@/types'

interface SavePlaceContextValue {
  myLists: SaList[]
  defaultListId: string | null
  loading: boolean
  isSaved: (placeId: string) => boolean
  isInList: (placeId: string, listId: string) => boolean
  checkSavedStatus: (placeId: string) => Promise<string[]>
  batchCheckSaved: (placeIds: string[]) => Promise<void>
  toggleDefaultSave: (placeId: string) => Promise<boolean>
  toggleListSave: (placeId: string, listId: string) => Promise<boolean>
  getListsForPlace: (placeId: string) => SaList[]
  getSavedListIds: (placeId: string) => string[]
  removeFromAll: (placeId: string) => Promise<void>
  refreshMyLists: () => void
}

const SavePlaceContext = createContext<SavePlaceContextValue | null>(null)

export function SavePlaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [myLists, setMyLists] = useState<SaList[]>([])
  const [defaultListId, setDefaultListId] = useState<string | null>(null)
  const [savedMap, setSavedMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  // 내 리스트 로드
  const loadMyLists = useCallback(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    listsService.getMyLists(user.id)
      .then((lists) => {
        setMyLists(lists)
        const defaultList = lists.find((l) => l.type === 'default')
        if (defaultList) setDefaultListId(defaultList.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { loadMyLists() }, [loadMyLists])

  const checkSavedStatus = useCallback(async (placeId: string): Promise<string[]> => {
    if (!user) return []
    if (savedMap[placeId] !== undefined) return savedMap[placeId]

    const listIds = await listsService.getListsContainingPlace(user.id, placeId)
    setSavedMap((prev) => ({ ...prev, [placeId]: listIds }))
    return listIds
  }, [user, savedMap])

  const batchCheckSaved = useCallback(async (placeIds: string[]): Promise<void> => {
    if (!user || placeIds.length === 0) return

    // Filter out already cached
    const uncached = placeIds.filter((id) => savedMap[id] === undefined)
    if (uncached.length === 0) return

    const result = await listsService.getListsContainingPlaces(user.id, uncached)
    setSavedMap((prev) => ({ ...prev, ...result }))
  }, [user, savedMap])

  const isSaved = useCallback((placeId: string): boolean => {
    return (savedMap[placeId]?.length || 0) > 0
  }, [savedMap])

  const isInList = useCallback((placeId: string, listId: string): boolean => {
    return savedMap[placeId]?.includes(listId) || false
  }, [savedMap])

  const toggleDefaultSave = useCallback(async (placeId: string): Promise<boolean> => {
    if (!user || !defaultListId) return false

    const isCurrentlyInDefault = savedMap[placeId]?.includes(defaultListId) || false

    if (isCurrentlyInDefault) {
      await listsService.removePlaceFromList(defaultListId, placeId)
      setSavedMap((prev) => ({
        ...prev,
        [placeId]: (prev[placeId] || []).filter((id) => id !== defaultListId),
      }))
      loadMyLists()
      return false
    } else {
      await listsService.addPlaceToList(defaultListId, placeId)
      setSavedMap((prev) => ({
        ...prev,
        [placeId]: [...(prev[placeId] || []), defaultListId],
      }))
      loadMyLists()
      return true
    }
  }, [user, defaultListId, savedMap, loadMyLists])

  const toggleListSave = useCallback(async (placeId: string, listId: string): Promise<boolean> => {
    if (!user) return false

    const isCurrentlyIn = savedMap[placeId]?.includes(listId) || false

    if (isCurrentlyIn) {
      await listsService.removePlaceFromList(listId, placeId)
      setSavedMap((prev) => ({
        ...prev,
        [placeId]: (prev[placeId] || []).filter((id) => id !== listId),
      }))
      loadMyLists()
      return false
    } else {
      await listsService.addPlaceToList(listId, placeId)
      setSavedMap((prev) => ({
        ...prev,
        [placeId]: [...(prev[placeId] || []), listId],
      }))
      loadMyLists()
      return true
    }
  }, [user, savedMap, loadMyLists])

  const getListsForPlace = useCallback((placeId: string): SaList[] => {
    const listIds = savedMap[placeId] || []
    return myLists.filter((l) => listIds.includes(l.id))
  }, [savedMap, myLists])

  const getSavedListIds = useCallback((placeId: string): string[] => {
    return savedMap[placeId] || []
  }, [savedMap])

  // 모든 리스트에서 장소 제거 (저장 해제)
  const removeFromAll = useCallback(async (placeId: string): Promise<void> => {
    const listIds = savedMap[placeId] || []
    for (const listId of listIds) {
      await listsService.removePlaceFromList(listId, placeId)
    }
    setSavedMap((prev) => ({ ...prev, [placeId]: [] }))
    loadMyLists()
  }, [savedMap, loadMyLists])

  return (
    <SavePlaceContext.Provider value={{
      myLists, defaultListId, loading,
      isSaved, isInList, checkSavedStatus, batchCheckSaved,
      toggleDefaultSave, toggleListSave,
      getListsForPlace, getSavedListIds,
      removeFromAll,
      refreshMyLists: loadMyLists,
    }}>
      {children}
    </SavePlaceContext.Provider>
  )
}

export function useSavePlace() {
  const ctx = useContext(SavePlaceContext)
  if (!ctx) throw new Error('useSavePlace must be used within SavePlaceProvider')
  return ctx
}
