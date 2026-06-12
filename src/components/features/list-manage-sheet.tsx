/**
 * ListManageSheet — 리스트 관리 바텀시트 (메뉴 → 편집 / 공개설정)
 * sa-list/page.tsx, sa-list-detail-client.tsx에서 공용
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import ConfirmModal from '@/components/ui/confirm-modal'
import ListForm from '@/components/features/list-form'
import { useToast } from '@/contexts/toast-context'
import * as listsService from '@/lib/lists-service'
import type { SaList, ListVisibility } from '@/types'

interface ListManageSheetProps {
  list: SaList
  open: boolean
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
  initialView?: 'menu' | 'visibility' | 'edit'
}

type View = 'menu' | 'edit' | 'visibility'

export function ListManageSheet({ list, open, onClose, onUpdated, onDeleted, initialView = 'menu' }: ListManageSheetProps) {
  const { showError, showNotice } = useToast()
  const [view, setView] = useState<View>(initialView)
  const [editDirty, setEditDirty] = useState(false)

  // Confirm modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDirtyConfirm, setShowDirtyConfirm] = useState<'close' | 'back' | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setView(initialView)
      setEditDirty(false)
    }
  }, [open, initialView])

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (view === 'edit' && editDirty) {
      setShowDirtyConfirm('close')
      return
    }
    onClose()
  }, [view, editDirty, onClose])

  // Back to menu (with unsaved changes check)
  const handleBack = useCallback(() => {
    if (view === 'edit' && editDirty) {
      setShowDirtyConfirm('back')
      return
    }
    setView('menu')
  }, [view, editDirty])

  // Change visibility (immediate apply)
  const handleVisibilityChange = useCallback(async (next: ListVisibility) => {
    if (next === list.visibility) return
    if (next === 'public' && list.place_count < 3) {
      showError('최소 3곳을 추가해야 공개할 수 있어요')
      return
    }
    try {
      await listsService.updateList(list.id, { visibility: next })
      onUpdated()
      setView('menu')
    } catch {
      showError('변경에 실패했어요')
    }
  }, [list, onUpdated, showError])

  // Delete
  const handleDelete = useCallback(async () => {
    try {
      await listsService.deleteList(list.id)
      setShowDeleteConfirm(false)
      onClose()
      onDeleted()
    } catch {
      showError('삭제에 실패했어요')
    }
  }, [list.id, onClose, onDeleted, showError])

  const visibilityOptions: { value: ListVisibility; label: string; desc: string; icon: string }[] = [
    { value: 'private', label: '비공개', desc: '나만 볼 수 있어요', icon: 'lock' },
    { value: 'unlisted', label: '링크 공유', desc: '링크를 가진 사람만', icon: 'link' },
    { value: 'public', label: '공개', desc: '모두에게 보여요 (3곳 이상)', icon: 'public' },
  ]

  return (
    <>
      <BottomSheet open={open} onClose={handleClose} title="">
        {/* VIEW: Menu */}
        {view === 'menu' && (
          <div className="space-y-1">
            <button
              onClick={() => setView('edit')}
              className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <span className="material-symbols-outlined text-stone-500">edit</span>
              <span className="text-sm text-stone-700">편집</span>
            </button>
            <button
              onClick={() => setView('visibility')}
              className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <span className="material-symbols-outlined text-stone-500">
                {list.visibility === 'public' ? 'public' : list.visibility === 'unlisted' ? 'link' : 'lock'}
              </span>
              <span className="text-sm text-stone-700">공개 설정</span>
              <span className="ml-auto text-xs text-stone-400">
                {list.visibility === 'public' ? '공개' : list.visibility === 'unlisted' ? '링크 공유' : '비공개'}
              </span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <span className="material-symbols-outlined text-red-400">delete</span>
              <span className="text-sm text-red-500">삭제</span>
            </button>
          </div>
        )}

        {/* VIEW: Edit — ListForm */}
        {view === 'edit' && (
          <div>
            <div className="flex items-center gap-2 -mt-1 mb-3">
              <button onClick={handleBack} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <h3 className="text-base font-semibold text-stone-800">리스트 편집</h3>
            </div>

            <ListForm
              key={list.id}
              mode="edit"
              isDefault={list.type === 'default'}
              initialData={{
                title: list.title || '',
                tags: list.tags || [],
                description: list.description || '',
                cover_hue: list.cover_hue,
                cover_emoji: list.cover_emoji ?? null,
                creator_links: list.creator_links || {},
              }}
              onSubmit={async (data) => {
                await listsService.updateList(list.id, {
                  title: data.title,
                  description: data.description || null,
                  tags: data.tags.length > 0 ? data.tags : [],
                  cover_hue: data.cover_hue,
                  cover_emoji: data.cover_emoji,
                  creator_links: data.creator_links || {},
                })
                onUpdated()
                showNotice('수정되었어요')
                onClose()
              }}
              onDirtyChange={setEditDirty}
              submitLabel="저장"
            />
          </div>
        )}

        {/* VIEW: Visibility */}
        {view === 'visibility' && (
          <div>
            <div className="flex items-center gap-2 -mt-1 mb-4">
              <button onClick={() => setView('menu')} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <h3 className="text-base font-semibold text-stone-800">공개 설정</h3>
            </div>

            <div className="space-y-1">
              {visibilityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleVisibilityChange(opt.value)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    list.visibility === opt.value ? 'bg-stone-100' : 'hover:bg-stone-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-stone-500">{opt.icon}</span>
                  <div className="text-left">
                    <p className="text-sm text-stone-700 font-medium">{opt.label}</p>
                    <p className="text-[11px] text-stone-400">{opt.desc}</p>
                  </div>
                  {list.visibility === opt.value && (
                    <span className="ml-auto material-symbols-outlined text-sm" style={{ color: 'var(--color-primary)' }}>check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmModal
          message={`이 리스트를 삭제할까요?\n장소 ${list.place_count}개가 포함되어 있어요.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Unsaved changes confirmation */}
      {showDirtyConfirm && (
        <ConfirmModal
          message="변경사항이 저장되지 않았어요.\n나가시겠어요?"
          confirmLabel="나가기"
          cancelLabel="계속 작성"
          onConfirm={() => {
            setShowDirtyConfirm(null)
            if (showDirtyConfirm === 'close') onClose()
            else setView('menu')
          }}
          onCancel={() => setShowDirtyConfirm(null)}
        />
      )}
    </>
  )
}
