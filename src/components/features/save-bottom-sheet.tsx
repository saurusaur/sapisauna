/**
 * SaveBottomSheet — 인스타식 장소 저장 바텀시트
 *
 * save 모드: 상단 MY SA-LIST (기본 저장) + SA-LIST 섹션 (컬렉션) + 인라인 생성
 * remove 모드: 해당 장소가 들어있는 리스트에서 선택적 제거
 *
 * heart_plus / heart_check 토글 + 인라인 메모 + 시트 내 토스트
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import ContentLoader from '@/components/ui/content-loader'
import { useSavePlace } from '@/hooks/use-save-place'
import { useAuth } from '@/contexts/auth-context'
import * as listsService from '@/lib/lists-service'

interface SaveBottomSheetProps {
  mode: 'save' | 'remove'
  placeId: string
  open: boolean
  onClose: () => void
  /** 시트 닫힌 후 하트 상태 갱신용 콜백 */
  onStateChange?: () => void
  /** 인라인 생성 모드로 시작 (스낵바 → 새 리스트) */
  startInCreateMode?: boolean
}

const MAX_LISTS = 15
const MAX_TITLE_LENGTH = 20
const MAX_MEMO_LENGTH = 100
const TOAST_MS = 2000

export function SaveBottomSheet({
  mode,
  placeId,
  open,
  onClose,
  onStateChange,
  startInCreateMode = false,
}: SaveBottomSheetProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { myLists, defaultListId, isInList, toggleListSave, loading, refreshMyLists } = useSavePlace()

  const [pendingToggle, setPendingToggle] = useState<Set<string>>(new Set())
  // 인라인 메모
  const [memoListId, setMemoListId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')
  const [savingMemo, setSavingMemo] = useState(false)
  // 인라인 새 리스트 생성
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  // 시트 내 토스트
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // startInCreateMode일 때 생성 모드로 시작
  useEffect(() => {
    if (open && startInCreateMode) setShowCreate(true)
  }, [open, startInCreateMode])

  // 시트 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setMemoListId(null)
      setMemoText('')
      setShowCreate(false)
      setNewTitle('')
      setToastMsg(null)
    }
  }, [open])

  // 기본 리스트와 커스텀 리스트 분리
  const defaultList = myLists.find((l) => l.type === 'default')
  const customLists = myLists
    .filter((l) => l.type !== 'default')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  // remove 모드: 들어있는 리스트만
  const visibleCustomLists = mode === 'save'
    ? customLists
    : customLists.filter((l) => isInList(placeId, l.id))

  // 시트 내 토스트
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), TOAST_MS)
  }, [])

  // 컬렉션 토글 (heart_plus ↔ heart_check)
  const handleToggle = useCallback(async (listId: string) => {
    if (pendingToggle.has(listId)) return
    const wasChecked = isInList(placeId, listId)
    const listName = myLists.find((l) => l.id === listId)?.title || ''

    setPendingToggle((prev) => new Set(prev).add(listId))
    try {
      await toggleListSave(placeId, listId)
      if (!wasChecked) {
        // 추가됨 → 메모란 오픈 + 토스트
        setMemoListId(listId)
        setMemoText('')
        showToast(`${listName}에 저장됨`)
      } else {
        // 제거됨 → 메모란 닫기 + 토스트
        if (memoListId === listId) setMemoListId(null)
        showToast(`${listName}에서 삭제됨`)
      }
    } catch {
      showToast('저장 중 오류가 발생했어요')
    } finally {
      setPendingToggle((prev) => {
        const next = new Set(prev)
        next.delete(listId)
        return next
      })
    }
  }, [placeId, toggleListSave, isInList, myLists, pendingToggle, memoListId, showToast])

  // 메모 저장
  const handleSaveMemo = useCallback(async () => {
    if (!memoListId) return
    setSavingMemo(true)
    try {
      await listsService.updateListItemMemo(memoListId, placeId, memoText.trim() || null)
      setMemoListId(null)
      setMemoText('')
    } catch {
      showToast('메모 저장에 실패했어요')
    } finally {
      setSavingMemo(false)
    }
  }, [memoListId, placeId, memoText, showToast])

  // 새 리스트 생성 + 장소 자동 추가
  const handleCreate = useCallback(async () => {
    const title = newTitle.trim()
    if (!title || !user) return
    if (myLists.length >= MAX_LISTS) {
      showToast(`리스트는 최대 ${MAX_LISTS}개까지`)
      return
    }

    setCreating(true)
    try {
      const list = await listsService.createList({
        owner_id: user.id,
        title,
        type: 'user',
      })
      await toggleListSave(placeId, list.id)
      setNewTitle('')
      setShowCreate(false)
      refreshMyLists()
      // 메모란 오픈 + 토스트
      setMemoListId(list.id)
      setMemoText('')
      showToast(`${title}에 저장됨`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '리스트 생성에 실패했어요')
    } finally {
      setCreating(false)
    }
  }, [newTitle, user, myLists.length, placeId, refreshMyLists, showToast])

  // 시트 닫기
  const handleClose = useCallback(() => {
    onClose()
    onStateChange?.()
  }, [onClose, onStateChange])

  return (
    <BottomSheet open={open} onClose={handleClose} title="">
      {loading ? (
        <ContentLoader size="small" />
      ) : (
        <div className="space-y-0 relative">
          {/* 상단: MY SA-LIST (기본 리스트) */}
          {defaultList && mode === 'save' && (
            <div className="flex items-center gap-3 px-1 py-3">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '24px',
                  color: 'var(--color-primary)',
                  fontVariationSettings: "'FILL' 1",
                }}
              >bookmark</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800">MY SA-LIST</p>
              </div>
              <span className="text-xs text-stone-400">{defaultList.place_count}곳</span>
            </div>
          )}

          {/* 구분선 + 섹션 헤더 */}
          {mode === 'save' && (
            <div className="flex items-center justify-between pt-2 pb-1 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-400">내 리스트</span>
              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  새 리스트
                </button>
              )}
            </div>
          )}

          {/* 인라인 새 리스트 생성 */}
          {showCreate && mode === 'save' && (
            <div className="py-2 px-1 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="리스트 이름"
                autoFocus
                className="w-full glass-input px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowCreate(false); setNewTitle('') }}
                  className="px-3 py-1.5 text-xs text-stone-400"
                >취소</button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="px-4 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >{creating ? '만드는 중...' : '만들기'}</button>
              </div>
            </div>
          )}

          {/* 컬렉션 목록 */}
          <div className="space-y-0">
            {visibleCustomLists.map((list) => {
              const checked = isInList(placeId, list.id)
              const isPending = pendingToggle.has(list.id)

              return (
                <div key={list.id}>
                  <button
                    onClick={() => handleToggle(list.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-1 py-2.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex-1 text-left">
                      <span className="text-sm text-stone-700">{list.title}</span>
                    </div>

                    <span className="text-xs text-stone-400">{list.place_count}곳</span>

                    {/* heart_plus / heart_check 토글 */}
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '22px',
                        color: checked ? 'var(--color-primary)' : 'var(--color-icon-inactive)',
                        fontVariationSettings: checked ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {checked ? 'heart_check' : 'heart_plus'}
                    </span>
                  </button>

                  {/* 인라인 메모 (추가 직후 표시) */}
                  {memoListId === list.id && (
                    <div className="ml-9 mt-1 mb-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value.slice(0, MAX_MEMO_LENGTH))}
                        placeholder="메모 (선택, 최대 100자)"
                        autoFocus
                        className="flex-1 glass-input px-3 py-2 text-xs text-stone-700 outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMemo() }}
                      />
                      <button
                        onClick={handleSaveMemo}
                        disabled={savingMemo}
                        className="px-2.5 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >저장</button>
                      <button
                        onClick={() => { setMemoListId(null); setMemoText('') }}
                        className="px-2 py-1.5 text-xs text-stone-400"
                      >건너뛰기</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* remove 모드 빈 상태 */}
          {mode === 'remove' && visibleCustomLists.length === 0 && (
            <div className="py-6 text-center text-stone-400 text-sm">
              이 장소는 어떤 리스트에도 저장되어 있지 않아요
            </div>
          )}

          {/* 시트 내 하단 토스트 */}
          {toastMsg && (
            <div className="sticky bottom-0 left-0 right-0 pt-2">
              <div className="bg-stone-800 text-white rounded-lg px-4 py-2.5 text-xs text-center animate-intro-up">
                {toastMsg}
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
