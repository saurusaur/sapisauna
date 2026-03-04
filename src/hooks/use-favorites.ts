'use client'

import { useState, useEffect, useCallback } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/utils'
import type { FavoritesData, FavoriteCollection } from '@/types'

// 기본 즐겨찾기 컬렉션 생성
function getDefaultCollection(): FavoriteCollection {
  return {
    id: 'default',
    name: '좋아요',
    icon: 'favorite',
    placeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 즐겨찾기 데이터 로드
function loadFavorites(): FavoritesData {
  const data = storage.get<FavoritesData>(STORAGE_KEYS.FAVORITES)
  if (data && data.collections?.length > 0) return data
  return { collections: [getDefaultCollection()] }
}

// 즐겨찾기 저장
function saveFavorites(data: FavoritesData) {
  storage.set(STORAGE_KEYS.FAVORITES, data)
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesData>({ collections: [getDefaultCollection()] })

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const toggleFavorite = useCallback((placeId: string) => {
    setFavorites((prev) => {
      const updated = { ...prev, collections: [...prev.collections] }
      const defaultCol = { ...updated.collections[0] }
      if (defaultCol.placeIds.includes(placeId)) {
        defaultCol.placeIds = defaultCol.placeIds.filter((id) => id !== placeId)
      } else {
        defaultCol.placeIds = [...defaultCol.placeIds, placeId]
      }
      defaultCol.updatedAt = new Date().toISOString()
      updated.collections[0] = defaultCol
      saveFavorites(updated)
      return updated
    })
  }, [])

  const isFavorited = useCallback((placeId: string) => {
    return favorites.collections[0]?.placeIds.includes(placeId) || false
  }, [favorites])

  const getFavoriteCount = useCallback((placeId: string) => {
    return favorites.collections.reduce((count, col) =>
      count + (col.placeIds.includes(placeId) ? 1 : 0), 0
    )
  }, [favorites])

  return { favorites, toggleFavorite, isFavorited, getFavoriteCount }
}
