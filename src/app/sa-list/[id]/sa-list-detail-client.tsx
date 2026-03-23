/**
 * SA-리스트 상세 — 클라이언트 컴포넌트
 * (page.tsx에서 generateMetadata를 위해 분리)
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ICONS, ADMIN_USER_ID } from '@/constants/content'
import { useList, useListItems } from '@/hooks/use-lists'
import { useSavePlace } from '@/hooks/use-save-place'
import { useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { usePlaceSearch } from '@/hooks/use-places'
import { useListActions } from '@/hooks/use-list-actions'
import { shareList } from '@/lib/share'
import * as listsService from '@/lib/lists-service'
import PlaceCard from '@/components/features/place-card'
import DataState from '@/components/ui/data-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import BottomNav from '@/components/bottom-nav'

const MAX_MEMO_LENGTH = 100
const MAX_TITLE_LENGTH = 20
const MAX_DESC_LENGTH = 140

export default function SaListDetailClient() {
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  const { data: list, loading: listLoading, error: listError, refresh: refreshList } = useList(listId)
  const { data: items, loading: itemsLoading, error: itemsError, refresh: refreshItems } = useListItems(listId)
  const { isSaved, toggleDefaultSave } = useSavePlace()
  const { subscribed, toggling: subscribing, toggle: toggleSubscribe } = useSubscription(listId)
  const { user } = useAuth()
  const { showError, showUndo } = useToast()
  const { toggleVisibility, deleteList: confirmDeleteList } = useListActions({
    onSuccess: refreshList,
    onError: showError,
  })

  const isMine = list?.owner_id === user?.id
  const isDefault = list?.type === 'default'
  const isAdmin = user?.id === ADMIN_USER_ID

  // 3-dot 메뉴
  const [showMenu, setShowMenu] = useState(false)

  // 리스트 편집
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

  // 장소 추가 검색 (서버사이드 ILIKE, 300ms 디바운스)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, loading: searchLoading, search } = usePlaceSearch()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!showAddSheet || !searchQuery || searchQuery.length < 2) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(searchQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, showAddSheet, search])

  // 메모 편집
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')

  // 장소별 ··· 메뉴
  const [itemMenuId, setItemMenuId] = useState<string | null>(null)

  // 검색 결과 — 이미 리스트에 있는 장소 제외
  const existingPlaceIds = new Set(items.map((item) => item.place_id))
  const filteredResults = searchResults.filter((p) => !existingPlaceIds.has(p.id)).slice(0, 10)

  // visibility 순환 토글 (useListActions 사용)
  const handleToggleVisibility = useCallback(() => {
    if (list) toggleVisibility(list)
  }, [list, toggleVisibility])

  // 리스트 삭제 (useListActions 사용)
  const handleDelete = useCallback(async () => {
    if (!list) return
    const deleted = await confirmDeleteList(list)
    if (deleted) router.back()
  }, [list, confirmDeleteList, router])

  // 리스트 메타 수정
  const handleEdit = useCallback(async () => {
    if (!list) return
    const title = editTitle.trim()
    if (!title) return

    try {
      await listsService.updateList(list.id, {
        title,
        description: editDesc.trim() || null,
      })
      setShowEditSheet(false)
      refreshList()
    } catch {
      showError('수정에 실패했어요')
    }
  }, [list, editTitle, editDesc, showError, refreshList])

  const handleAddPlace = useCallback(async (placeId: string) => {
    try {
      await listsService.addPlaceToList(listId, placeId)
      refreshItems()
    } catch {
      showError('추가에 실패했어요')
    }
  }, [listId, refreshItems, showError])

  // 장소 제거
  const handleRemovePlace = useCallback(async (placeId: string) => {
    try {
      await listsService.removePlaceFromList(listId, placeId)
      showUndo('장소를 제거했어요', async () => {
        await listsService.addPlaceToList(listId, placeId)
        refreshItems()
      })
      refreshItems()
    } catch {
      showError('제거에 실패했어요')
    }
  }, [listId, refreshItems, showError, showUndo])

  // 메모 저장
  const handleSaveMemo = useCallback(async (placeId: string) => {
    try {
      await listsService.updateListItemMemo(listId, placeId, memoText.trim() || null)
      setEditingMemoId(null)
      setMemoText('')
      refreshItems()
    } catch {
      showError('메모 저장에 실패했어요')
    }
  }, [listId, memoText, refreshItems, showError])

  // 공유 (shareList 유틸 사용)
  const handleShare = useCallback(async () => {
    if (!list) return
    const result = await shareList(list)
    if (result !== true) showError(result)
  }, [list, showError])

  // 어드민: 추천 등록/해제
  const handleToggleFeatured = useCallback(async () => {
    if (!list) return
    try {
      await listsService.updateList(list.id, { is_featured: !list.is_featured })
      refreshList()
    } catch {
      showError('추천 상태 변경에 실패했어요')
    }
  }, [list, refreshList, showError])

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-stone-500 hover:text-stone-700">
            <span className="material-symbols-outlined">{ICONS.BACK}</span>
          </button>
          <div className="flex-1" />

          {/* 공유 (비공개가 아닐 때만) */}
          {list?.visibility !== 'private' && (
            <button onClick={handleShare} className="text-stone-400 hover:text-stone-600">
              <span className="material-symbols-outlined">{ICONS.SHARE}</span>
            </button>
          )}

          {/* 어드민: 추천 등록/해제 */}
          {isAdmin && !isDefault && (
            <button
              onClick={handleToggleFeatured}
              className="text-stone-400 hover:text-stone-600"
              title={list?.is_featured ? '추천 해제' : '추천 등록'}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  color: list?.is_featured ? 'var(--color-primary)' : undefined,
                  fontVariationSettings: list?.is_featured ? "'FILL' 1" : "'FILL' 0",
                }}
              >star</span>
            </button>
          )}

          {/* 본인: 3-dot 메뉴 */}
          {isMine && !isDefault && (
            <button onClick={() => setShowMenu(true)} className="text-stone-400 hover:text-stone-600">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          )}
        </div>

        {/* 타이틀 */}
        <DataState loading={listLoading} error={listError} isEmpty={!list}>
          {list && (
            <div>
              <div className="flex items-center gap-2">
                {isDefault && (
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
                    bookmark_heart
                  </span>
                )}
                <h1 className="text-xl font-bold text-stone-800">
                  {isDefault ? 'MY SA-LIST' : list.title}
                </h1>
                {/* visibility 배지 */}
                {isMine && !isDefault && (
                  <button
                    onClick={handleToggleVisibility}
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={list.visibility === 'public'
                      ? { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                      : list.visibility === 'unlisted'
                        ? { backgroundColor: '#dbeafe', color: '#2563eb' }
                        : { backgroundColor: '#f5f5f4', color: '#78716c' }
                    }
                  >
                    {list.visibility === 'public' ? '공개' : list.visibility === 'unlisted' ? '링크 공유' : '비공개'}
                  </button>
                )}
              </div>

              {list.description && (
                <p className="text-sm text-stone-500 mt-1">{list.description}</p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                {list.owner_nickname && <span>@{list.owner_nickname}</span>}
                <span>장소 {list.place_count}개</span>
                {list.subscriber_count > 0 && <span>구독 {list.subscriber_count}명</span>}
              </div>

              {/* 타인: 구독 버튼 */}
              {!isMine && (
                <button
                  onClick={async () => {
                    const was = subscribed
                    await toggleSubscribe()
                    if (was) {
                      showUndo(`${list?.title} 구독 해지됨`, async () => { await toggleSubscribe() })
                    } else {
                      showUndo(`${list?.title} 구독됨`, async () => { await toggleSubscribe() })
                    }
                  }}
                  disabled={subscribing}
                  className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                    subscribed
                      ? 'text-white'
                      : 'glass-input text-stone-500 hover:text-stone-700'
                  }`}
                  style={subscribed ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', fontVariationSettings: subscribed ? "'FILL' 1" : "'FILL' 0" }}
                  >favorite</span>
                  {subscribed ? '구독중' : '구독하기'}
                </button>
              )}
            </div>
          )}
        </DataState>
      </header>

      {/* 장소 리스트 */}
      <main className="p-4">
        {isMine && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-full mb-3 py-2.5 flex items-center justify-center gap-2 glass-card-light rounded-xl text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            장소 추가
          </button>
        )}

        <DataState
          loading={itemsLoading}
          error={itemsError}
          isEmpty={items.length === 0}
          emptyIcon="location_off"
          emptyMessage="아직 장소가 없어요. 위 버튼으로 추가해보세요!"
        >
          <div className="space-y-2">
            {items.map((item) => {
              if (!item.place) return null
              return (
                <div key={item.id} className="relative">
                  <PlaceCard
                    place={item.place}
                    variant="collection"
                    collectionMemo={item.memo || undefined}
                    isSaved={isSaved(item.place.id)}
                    onToggleSave={() => toggleDefaultSave(item.place!.id)}
                    onClick={() => router.push(`/explore/${item.place!.id}`)}
                  />

                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setItemMenuId(item.place_id)
                      }}
                      className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  )}

                  {editingMemoId === item.place_id && (
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value.slice(0, MAX_MEMO_LENGTH))}
                        placeholder="장소에 대한 메모 (최대 100자)"
                        autoFocus
                        className="flex-1 glass-input px-3 py-2 text-xs text-stone-700 outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMemo(item.place_id) }}
                      />
                      <button
                        onClick={() => handleSaveMemo(item.place_id)}
                        className="px-2 py-1 text-xs font-medium text-white rounded-lg"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >저장</button>
                      <button
                        onClick={() => { setEditingMemoId(null); setMemoText('') }}
                        className="px-2 py-1 text-xs text-stone-400"
                      >취소</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DataState>
      </main>

      {/* 3-dot 메뉴 바텀시트 */}
      <BottomSheet open={showMenu} onClose={() => setShowMenu(false)} title="리스트 관리">
        <div className="space-y-1">
          <button
            onClick={() => {
              setShowMenu(false)
              setEditTitle(list?.title || '')
              setEditDesc(list?.description || '')
              setShowEditSheet(true)
            }}
            className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-stone-500">{ICONS.EDIT}</span>
            <span className="text-sm text-stone-700">편집</span>
          </button>
          <button
            onClick={() => { setShowMenu(false); handleDelete() }}
            className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-red-400">{ICONS.DELETE}</span>
            <span className="text-sm text-red-500">삭제</span>
          </button>
        </div>
      </BottomSheet>

      {/* 리스트 편집 바텀시트 */}
      <BottomSheet open={showEditSheet} onClose={() => setShowEditSheet(false)} title="리스트 편집">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">이름</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              className="w-full glass-input px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            />
            <p className="text-right text-[10px] text-stone-400 mt-1">{editTitle.length}/{MAX_TITLE_LENGTH}</p>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">설명</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value.slice(0, MAX_DESC_LENGTH))}
              rows={3}
              className="w-full glass-input px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200 resize-none"
              placeholder="리스트에 대한 설명 (선택)"
            />
            <p className="text-right text-[10px] text-stone-400 mt-1">{editDesc.length}/{MAX_DESC_LENGTH}</p>
          </div>
          <button
            onClick={handleEdit}
            disabled={!editTitle.trim()}
            className="btn-primary w-full disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </BottomSheet>

      {/* 장소별 ··· 메뉴 바텀시트 */}
      <BottomSheet open={!!itemMenuId} onClose={() => setItemMenuId(null)} title="장소 관리">
        <div className="space-y-1">
          <button
            onClick={() => {
              const item = items.find((i) => i.place_id === itemMenuId)
              setMemoText(item?.memo || '')
              setEditingMemoId(itemMenuId)
              setItemMenuId(null)
            }}
            className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-stone-500">{ICONS.EDIT}</span>
            <span className="text-sm text-stone-700">메모 수정</span>
          </button>
          <button
            onClick={() => {
              if (itemMenuId) handleRemovePlace(itemMenuId)
              setItemMenuId(null)
            }}
            className="w-full flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-red-400">{ICONS.DELETE}</span>
            <span className="text-sm text-red-500">이 리스트에서 제거</span>
          </button>
        </div>
      </BottomSheet>

      {/* 장소 추가 검색 바텀시트 */}
      <BottomSheet
        open={showAddSheet}
        onClose={() => { setShowAddSheet(false); setSearchQuery('') }}
        title="장소 추가"
      >
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
              {ICONS.SEARCH}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="장소명 또는 주소 검색"
              autoFocus
              className="w-full pl-10 pr-4 py-3 glass-input text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          {searchQuery && searchQuery.length >= 2 && (
            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
              {searchLoading ? (
                <div className="py-6 text-center">
                  <p className="text-stone-400 text-sm">검색 중...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-stone-400 text-sm">검색 결과가 없어요</p>
                  <button
                    onClick={() => { setShowAddSheet(false); router.push('/place') }}
                    className="mt-2 text-xs font-medium underline underline-offset-2"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    새 장소 등록하기
                  </button>
                </div>
              ) : (
                filteredResults.map((place) => (
                  <div key={place.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-stone-700">{place.name}</p>
                      <p className="text-xs text-stone-400">{place.short_address || place.address}</p>
                    </div>
                    <button
                      onClick={() => handleAddPlace(place.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      + 추가
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="py-4 text-center text-stone-400 text-xs">
              장소명이나 주소를 검색해보세요
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  )
}
