/**
 * SaveFlow — 저장 플로우 공용 컴포넌트
 * 북마크 탭 → 스낵바/바텀시트/메모시트를 캡슐화하여
 * explore, explore/[id], sa-list/[id] 등에서 중복 없이 재사용
 */

'use client'

import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { useSavePlace } from '@/hooks/use-save-place'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import * as listsService from '@/lib/lists-service'
import { SaveSnackbar } from '@/components/ui/snackbar'
import { SaveBottomSheet } from '@/components/features/save-bottom-sheet'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'

interface SaveFlowProps {
  children: (handleToggleSave: (placeId: string) => Promise<void>) => ReactNode
}

export function SaveFlow({ children }: SaveFlowProps) {
  const { user } = useAuth()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()
  const {
    isSaved, toggleDefaultSave, myLists, defaultListId,
    getSavedListIds, toggleListSave, removeFromAll,
  } = useSavePlace()
  const { showError, showNotice } = useToast()

  // 스낵바 상태
  const [snackbarPlaceId, setSnackbarPlaceId] = useState<string | null>(null)

  // 저장 바텀시트 상태
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetPlaceId, setSheetPlaceId] = useState<string>('')
  const [sheetMode, setSheetMode] = useState<'save' | 'remove'>('save')
  const [sheetCreateMode, setSheetCreateMode] = useState(false)

  // 메모 미니 바텀시트 상태
  const [memoSheetOpen, setMemoSheetOpen] = useState(false)
  const [memoSheetText, setMemoSheetText] = useState('')
  const [memoPlaceId, setMemoPlaceId] = useState<string>('')
  const [savingMemo, setSavingMemo] = useState(false)

  // 유저 컬렉션 (default 제외)
  const userCollections = useMemo(
    () => myLists.filter((l) => l.type !== 'default'),
    [myLists]
  )

  // 메인 토글 핸들러 — 인스타식 분기
  const handleToggleSave = useCallback(async (placeId: string) => {
    if (!requireAuth()) return
    const wasSaved = isSaved(placeId)

    if (wasSaved) {
      // 저장 해제 분기
      const savedListIds = getSavedListIds(placeId)
      const inCustomLists = savedListIds.filter((id) => id !== defaultListId)

      if (inCustomLists.length === 0) {
        await toggleDefaultSave(placeId)
        showNotice('저장 해제됨')
      } else {
        const confirmed = window.confirm(
          `이 장소가 ${inCustomLists.length}개 리스트에도 포함되어 있어요.\n모두에서 제거할까요?`
        )
        if (confirmed) {
          await removeFromAll(placeId)
          showNotice('저장 해제됨')
        }
      }
    } else {
      // 미저장 → 기본 저장
      await toggleDefaultSave(placeId)

      if (userCollections.length === 0) {
        setSnackbarPlaceId(placeId)
      } else {
        setSheetPlaceId(placeId)
        setSheetMode('save')
        setSheetCreateMode(false)
        setSheetOpen(true)
      }
    }
  }, [requireAuth, isSaved, toggleDefaultSave, getSavedListIds, defaultListId, removeFromAll, userCollections.length, showNotice])

  // 스낵바 핸들러
  const handleSnackbarToggle = useCallback(async (listId: string) => {
    if (!snackbarPlaceId) return
    await toggleListSave(snackbarPlaceId, listId)
  }, [snackbarPlaceId, toggleListSave])

  const handleShowMore = useCallback(() => {
    if (!snackbarPlaceId) return
    const pid = snackbarPlaceId
    setSnackbarPlaceId(null)
    setSheetPlaceId(pid)
    setSheetMode('save')
    setSheetCreateMode(true)
    setSheetOpen(true)
  }, [snackbarPlaceId])

  // 메모 핸들러
  const handleOpenMemo = useCallback(() => {
    if (!snackbarPlaceId) return
    setMemoPlaceId(snackbarPlaceId)
    setSnackbarPlaceId(null)
    setMemoSheetOpen(true)
    setMemoSheetText('')
  }, [snackbarPlaceId])

  const handleSavePlaceMemo = useCallback(async () => {
    if (!defaultListId || !memoPlaceId) return
    setSavingMemo(true)
    try {
      await listsService.updateListItemMemo(defaultListId, memoPlaceId, memoSheetText.trim() || null)
      setMemoSheetOpen(false)
      setMemoSheetText('')
    } catch {
      showError('메모 저장에 실패했어요')
    } finally {
      setSavingMemo(false)
    }
  }, [defaultListId, memoPlaceId, memoSheetText, showError])

  return (
    <>
      {children(handleToggleSave)}

      {/* 스낵바 (컬렉션 없는 유저용) */}
      <SaveSnackbar
        visible={!!snackbarPlaceId}
        onDismiss={() => setSnackbarPlaceId(null)}
        savedListIds={snackbarPlaceId ? getSavedListIds(snackbarPlaceId) : []}
        userLists={[]}
        onToggleList={handleSnackbarToggle}
        onShowMore={handleShowMore}
        onMemo={handleOpenMemo}
      />

      {/* 인스타식 저장 바텀시트 (컬렉션 있는 유저용) */}
      {sheetPlaceId && (
        <SaveBottomSheet
          mode={sheetMode}
          placeId={sheetPlaceId}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          startInCreateMode={sheetCreateMode}
        />
      )}

      {/* 메모 미니 바텀시트 */}
      <BottomSheet
        open={memoSheetOpen}
        onClose={() => { setMemoSheetOpen(false); setMemoSheetText('') }}
        title="메모 추가"
      >
        <div className="space-y-3">
          <input
            type="text"
            value={memoSheetText}
            onChange={(e) => setMemoSheetText(e.target.value.slice(0, 100))}
            placeholder="이 장소에 대한 메모 (최대 100자)"
            autoFocus
            className="w-full glass-input px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePlaceMemo() }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMemoSheetOpen(false); setMemoSheetText('') }}
              className="px-3 py-1.5 text-xs text-stone-400"
            >취소</button>
            <button
              onClick={handleSavePlaceMemo}
              disabled={savingMemo}
              className="px-4 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >{savingMemo ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </BottomSheet>

      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </>
  )
}
