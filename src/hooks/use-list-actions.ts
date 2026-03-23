/**
 * useListActions — visibility 토글 + 삭제 공통 훅
 *
 * cover-card, sa-list-detail, sa-list 피드에서 중복되던 로직 통합
 */

'use client'

import { useCallback } from 'react'
import * as listsService from '@/lib/lists-service'
import type { SaList, ListVisibility } from '@/types'

interface ListActionCallbacks {
  onSuccess: () => void
  onError: (msg: string) => void
}

export function useListActions(callbacks: ListActionCallbacks) {
  // visibility 순환 토글: private → unlisted → public → private
  const toggleVisibility = useCallback(async (list: SaList) => {
    const next: ListVisibility = list.visibility === 'private' ? 'unlisted'
      : list.visibility === 'unlisted' ? 'public'
      : 'private'

    if (next === 'public' && list.place_count < 3) {
      callbacks.onError('최소 3곳을 추가해야 공개할 수 있어요')
      return
    }

    try {
      await listsService.updateList(list.id, { visibility: next })
      callbacks.onSuccess()
    } catch {
      callbacks.onError('변경에 실패했어요')
    }
  }, [callbacks])

  // 리스트 삭제 (확인 다이얼로그 포함)
  const deleteList = useCallback(async (list: SaList) => {
    const confirmed = window.confirm(
      `이 리스트를 삭제할까요?\n장소 ${list.place_count}개가 포함되어 있어요.`
    )
    if (!confirmed) return false

    try {
      await listsService.deleteList(list.id)
      return true
    } catch {
      callbacks.onError('삭제에 실패했어요')
      return false
    }
  }, [callbacks])

  return { toggleVisibility, deleteList }
}
