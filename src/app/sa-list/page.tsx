/**
 * SA-리스트 피드 — 3탭 (내 리스트 / 구독중 / 발견)
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMyLists, usePublicLists } from '@/hooks/use-lists'
import { useSubscribedLists } from '@/hooks/use-subscriptions'
import { useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useListActions } from '@/hooks/use-list-actions'
import { usePlaceSearch } from '@/hooks/use-places'
import * as listsService from '@/lib/lists-service'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import CoverCard from '@/components/features/cover-card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { SaList } from '@/types'

const TABS = ['내 리스트', '구독중', '발견'] as const
type Tab = typeof TABS[number]

const MAX_LISTS = 15
const MAX_TITLE_LENGTH = 20
const MAX_MEMO_LENGTH = 100

// 선택된 장소 + 메모
interface SelectedPlace {
  id: string
  name: string
  address: string
  short_address?: string
  memo: string
}

export default function SaListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showError, showNotice } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('내 리스트')

  // 데이터 훅
  const { data: myLists, loading: myLoading, error: myError, refresh: refreshMyLists } = useMyLists()
  const { data: subscribedLists, loading: subLoading, error: subError } = useSubscribedLists()
  const { data: publicLists, loading: pubLoading, error: pubError } = usePublicLists(20)
  const { toggleVisibility } = useListActions({ onSuccess: refreshMyLists, onError: showError })

  // 새 리스트 생성 시트
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([])
  const [placeQuery, setPlaceQuery] = useState('')
  const [creating, setCreating] = useState(false)

  // 장소 검색 (300ms 디바운스)
  const { results: placeResults, loading: placeSearchLoading, search: searchPlace } = usePlaceSearch()
  const tagInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!showCreateSheet || !placeQuery || placeQuery.length < 2) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlace(placeQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [placeQuery, showCreateSheet, searchPlace])

  const selectedIds = new Set(selectedPlaces.map((p) => p.id))
  const filteredPlaceResults = placeResults.filter((p) => !selectedIds.has(p.id)).slice(0, 8)

  const hasCreateContent = newTitle.trim() || newTags.length > 0 || selectedPlaces.length > 0

  const resetCreateSheet = useCallback(() => {
    setNewTitle('')
    setNewTags([])
    setTagInput('')
    setSelectedPlaces([])
    setPlaceQuery('')
    setShowCreateSheet(false)
  }, [])

  // 나가기 컨펌 (내용 있을 때만)
  const handleCloseCreateSheet = useCallback(() => {
    if (hasCreateContent) {
      const confirmed = window.confirm('작성 중인 내용이 사라집니다. 나가시겠어요?')
      if (!confirmed) return
    }
    resetCreateSheet()
  }, [hasCreateContent, resetCreateSheet])

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !newTags.includes(tag) && newTags.length < 5) {
      setNewTags((prev) => [...prev, tag])
    }
    setTagInput('')
    setTimeout(() => tagInputRef.current?.focus(), 0)
  }, [tagInput, newTags])

  const handleCreateList = useCallback(async () => {
    const title = newTitle.trim()
    if (!title || !user) return
    if (myLists.length >= MAX_LISTS) {
      showError(`리스트는 최대 ${MAX_LISTS}개까지 만들 수 있어요`)
      return
    }

    setCreating(true)
    try {
      const list = await listsService.createList({
        owner_id: user.id,
        title,
        type: 'user',
        tags: newTags.length > 0 ? newTags : undefined,
      })
      // 선택된 장소들을 메모와 함께 추가
      for (const place of selectedPlaces) {
        await listsService.addPlaceToList(list.id, place.id, place.memo.trim() || undefined)
      }
      resetCreateSheet()
      refreshMyLists()
      router.push(`/sa-list/${list.id}`)
    } catch (e) {
      showError(e instanceof Error ? e.message : '리스트 생성에 실패했어요')
    } finally {
      setCreating(false)
    }
  }, [newTitle, newTags, selectedPlaces, user, myLists.length, showError, refreshMyLists, router, resetCreateSheet])

  // visibility 순환 토글 (useListActions 사용)
  const handleToggleVisibility = useCallback((list: SaList) => {
    toggleVisibility(list)
  }, [toggleVisibility])

  // 탭 컨텐츠
  const renderTab = () => {
    if (activeTab === '내 리스트') {
      return (
        <DataState
          loading={myLoading}
          error={myError}
          isEmpty={myLists.length === 0}
          emptyIcon="playlist_add"
          emptyMessage="아직 리스트가 없어요. 탐색에서 하트를 눌러 저장해보세요!"
        >
          <div className="space-y-2">
            {myLists.map((list) => (
              <CoverCard
                key={list.id}
                list={list}
                onClick={() => router.push(`/sa-list/${list.id}`)}
                isMine
                onTogglePublic={() => handleToggleVisibility(list)}
                onMenu={() => router.push(`/sa-list/${list.id}`)}
              />
            ))}
          </div>

          {/* 새 리스트 만들기 */}
          <button
            onClick={() => setShowCreateSheet(true)}
            className="w-full mt-3 py-3 flex items-center justify-center gap-2 glass-card-light rounded-xl text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            새 리스트 만들기
          </button>
        </DataState>
      )
    }

    if (activeTab === '구독중') {
      return (
        <DataState
          loading={subLoading}
          error={subError}
          isEmpty={subscribedLists.length === 0}
          emptyIcon="bookmark_border"
          emptyMessage="구독한 리스트가 없어요. 발견 탭에서 찾아보세요!"
        >
          <div className="space-y-2">
            {subscribedLists.map((list) => (
              <SubscribedCoverCard
                key={list.id}
                list={list}
                onClick={() => router.push(`/sa-list/${list.id}`)}
                showNotice={showNotice}
              />
            ))}
          </div>
        </DataState>
      )
    }

    // 발견 탭 — 큐레이션 상단 + 최근 공개 하단
    const curatedLists = publicLists.filter((l) => l.is_featured)
    const userPublicLists = publicLists.filter((l) => !l.is_featured)

    return (
      <DataState
        loading={pubLoading}
        error={pubError}
        isEmpty={publicLists.length === 0}
        emptyIcon="explore"
        emptyMessage="아직 공개 리스트가 없어요"
      >
        <div className="space-y-4">
          {/* 추천 SA-LIST — 가로 스크롤 캐러셀 */}
          {curatedLists.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-400 mb-2">추천 SA-LIST</h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                {curatedLists.map((list) => (
                  <div key={list.id} className="flex-shrink-0 w-[260px]">
                    <SubscribedCoverCard
                      list={list}
                      onClick={() => router.push(`/sa-list/${list.id}`)}
                      showNotice={showNotice}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최근 공개 (유저) */}
          {userPublicLists.length > 0 && (
            <div>
              {curatedLists.length > 0 && (
                <h3 className="text-xs font-semibold text-stone-400 mb-2">최근 공개 SA-LIST</h3>
              )}
              <div className="space-y-2">
                {userPublicLists.map((list) => (
                  <SubscribedCoverCard
                    key={list.id}
                    list={list}
                    onClick={() => router.push(`/sa-list/${list.id}`)}
                    showNotice={showNotice}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DataState>
    )
  }

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <h1 className="text-3xl font-extrabold italic font-heading">
          SA-LIST
        </h1>
      </header>

      <main className="p-4">
        {/* 탭 */}
        <div className="flex gap-1.5 mb-4">
          {TABS.map((tab) => (
            <TypeTab
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {renderTab()}
      </main>

      {/* 새 리스트 생성 바텀시트 (이름 + 태그 + 장소선택) */}
      <BottomSheet
        open={showCreateSheet}
        onClose={handleCloseCreateSheet}
        title="새 리스트 만들기"
      >
        <div className="space-y-4">
          {/* 1. 이름 */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">이름 *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              placeholder="리스트 이름 (최대 20자)"
              autoFocus
              className="w-full glass-input px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            />
            <p className="text-right text-[10px] text-stone-400 mt-1">
              {newTitle.length}/{MAX_TITLE_LENGTH}
            </p>
          </div>

          {/* 2. 태그 */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">태그 (최대 5개)</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {newTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  #{tag}
                  <button onClick={() => setNewTags((prev) => prev.filter((t) => t !== tag))} className="hover:opacity-70">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </span>
              ))}
            </div>
            {newTags.length < 5 && (
              <div className="flex gap-2">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.slice(0, 15))}
                  placeholder="#노천탕, #겨울여행 ..."
                  className="flex-1 glass-input px-3 py-2 text-xs text-stone-700 outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  추가
                </button>
              </div>
            )}
          </div>

          {/* 3. 장소 선택 */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">장소 추가 (선택)</label>
            {/* 선택된 장소들 — 미니카드 + 메모란 */}
            {selectedPlaces.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedPlaces.map((place) => (
                  <div key={place.id} className="glass-card-light p-3 rounded-xl">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">{place.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{place.short_address || place.address}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPlaces((prev) => prev.filter((p) => p.id !== place.id))}
                        className="text-stone-400 hover:text-stone-600 flex-shrink-0"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={place.memo}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, MAX_MEMO_LENGTH)
                        setSelectedPlaces((prev) =>
                          prev.map((p) => p.id === place.id ? { ...p, memo: val } : p)
                        )
                      }}
                      placeholder="메모 (선택, 최대 100자)"
                      className="mt-2 w-full glass-input px-3 py-2 text-xs text-stone-700 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* 검색 */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-base">search</span>
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="장소명 또는 주소 검색"
                className="w-full pl-9 pr-4 py-2.5 glass-input text-xs text-stone-700 outline-none"
              />
            </div>
            {/* 검색 결과 */}
            {placeQuery.length >= 2 && (
              <div className="mt-1.5 space-y-0.5 max-h-[25vh] overflow-y-auto">
                {placeSearchLoading ? (
                  <p className="py-3 text-center text-stone-400 text-xs">검색 중...</p>
                ) : filteredPlaceResults.length === 0 ? (
                  <p className="py-3 text-center text-stone-400 text-xs">검색 결과가 없어요</p>
                ) : (
                  filteredPlaceResults.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        setSelectedPlaces((prev) => [...prev, {
                          id: place.id,
                          name: place.name,
                          address: place.address,
                          short_address: place.short_address,
                          memo: '',
                        }])
                        setPlaceQuery('')
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-stone-50 text-left transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-700 truncate">{place.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{place.short_address || place.address}</p>
                      </div>
                      <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--color-primary)' }}>add_circle</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleCreateList}
              disabled={!newTitle.trim() || creating}
              className="btn-primary w-full disabled:opacity-40"
            >
              {creating ? '만드는 중...' : selectedPlaces.length > 0 ? `${selectedPlaces.length}곳과 함께 만들기` : '만들기'}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  )
}

// 구독 상태가 포함된 CoverCard 래퍼 — 해지 시 Undo 토스트
function SubscribedCoverCard({
  list, onClick, showNotice,
}: {
  list: SaList
  onClick: () => void
  showNotice: (msg: string, undo: () => Promise<void>) => void
}) {
  const { subscribed, toggling, toggle } = useSubscription(list.id)

  const handleToggle = useCallback(async () => {
    const wasSubscribed = subscribed
    await toggle()
    if (wasSubscribed) {
      showNotice(`${list.title} 구독 해지됨`, async () => { await toggle() })
    } else {
      showNotice(`${list.title} 구독됨`, async () => { await toggle() })
    }
  }, [subscribed, toggle, list.title, showNotice])

  return (
    <CoverCard
      list={list}
      onClick={onClick}
      subscribed={subscribed}
      subscribing={toggling}
      onToggleSubscribe={handleToggle}
    />
  )
}
