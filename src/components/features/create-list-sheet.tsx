'use client'

import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '@/components/ui/confirm-modal'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import ListForm from '@/components/features/list-form'
import { useConfirmableExit } from '@/hooks/use-confirmable-exit'
import * as listsService from '@/lib/lists-service'

const MAX_LISTS = 15

interface CreateListSheetProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  requireAuth: () => boolean
  userId?: string
  listCount: number
  showError: (message: string) => void
  fullScreen?: boolean
}

export default function CreateListSheet({
  open,
  onClose,
  onCreated,
  requireAuth,
  userId,
  listCount,
  showError,
  fullScreen = false,
}: CreateListSheetProps) {
  const [createDirty, setCreateDirty] = useState(false)

  useEffect(() => {
    if (open) setCreateDirty(false)
  }, [open])

  const closeCreateSheet = useCallback(() => {
    setCreateDirty(false)
    onClose()
  }, [onClose])

  const createSheetExit = useConfirmableExit({
    shouldConfirm: createDirty,
    onExit: closeCreateSheet,
  })

  return (
    <>
      <BottomSheet
        open={open}
        onClose={createSheetExit.requestExit}
        title="새 리스트 만들기"
        fullScreen={fullScreen}
      >
        <ListForm
          mode="create"
          onSubmit={async (data) => {
            if (!requireAuth()) return
            if (!userId) return
            if (listCount >= MAX_LISTS) {
              showError(`리스트는 최대 ${MAX_LISTS}개까지 만들 수 있어요`)
              return
            }
            const list = await listsService.createList({
              owner_id: userId,
              title: data.title,
              type: 'user',
              tags: data.tags.length > 0 ? data.tags : undefined,
              description: data.description || undefined,
              cover_hue: data.cover_hue,
              cover_emoji: data.cover_emoji,
              creator_links: data.creator_links,
            })
            if (data.places) {
              for (const place of data.places) {
                await listsService.addPlaceToList(list.id, place.id)
                if (place.memo?.trim()) {
                  await listsService.updateListItemMemo(list.id, place.id, place.memo.trim())
                }
              }
            }
            closeCreateSheet()
            onCreated()
          }}
          onDirtyChange={setCreateDirty}
          submitLabel="만들기"
        />
      </BottomSheet>

      {createSheetExit.confirmOpen && (
        <ConfirmModal
          message="작성 중인 내용이 사라집니다. 나가시겠어요?"
          confirmLabel="나가기"
          cancelLabel="계속 작성"
          onConfirm={createSheetExit.confirmExit}
          onCancel={createSheetExit.cancelExit}
        />
      )}
    </>
  )
}
