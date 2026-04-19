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
import { shareList } from '@/lib/share'
import * as listsService from '@/lib/lists-service'
import PlaceCard from '@/components/features/place-card'
import DataState from '@/components/ui/data-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import BottomNav from '@/components/bottom-nav'
import { SaveFlow } from '@/components/features/save-flow'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import ConfirmModal from '@/components/ui/confirm-modal'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { CREATOR_LINK_PREFIXES } from '@/constants/content'
import { SOCIAL_ICON_MAP } from '@/components/svg/social-icons'
import { listBgColor, profileBgColor } from '@/lib/utils'

const MAX_MEMO_LENGTH = 100

export default function SaListDetailClient() {
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  const { data: list, loading: listLoading, error: listError, refresh: refreshList } = useList(listId)
  const { data: items, loading: itemsLoading, error: itemsError, refresh: refreshItems } = useListItems(listId)
  const { isSaved, batchCheckSaved, getSavedListIds, removeFromAll } = useSavePlace()
  const { subscribed, toggling: subscribing, toggle: toggleSubscribe } = useSubscription(listId)
  const { user } = useAuth()
  const { showError, showNotice } = useToast()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // resolvedListId — slug URL 지원을 위해
  const resolvedListId = list?.id || ''

  const isMine = list?.owner_id === user?.id
  const isDefault = list?.type === 'default'
  const isAdmin = user?.id === ADMIN_USER_ID

  // ListManageSheet (3-dot 메뉴 → 편집/공개설정/삭제, 공개 pill → visibility 뷰)
  const [showManageSheet, setShowManageSheet] = useState(false)
  const [manageInitialView, setManageInitialView] = useState<'menu' | 'visibility'>('menu')

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

  // 리스트에서 장소 제거 확인 모달
  const [removeConfirmPlaceId, setRemoveConfirmPlaceId] = useState<string | null>(null)

  // items 로드 시 batchCheckSaved
  useEffect(() => {
    if (items.length === 0 || !user) return
    const placeIds = items.filter(i => i.place).map(i => i.place_id)
    if (placeIds.length > 0) batchCheckSaved(placeIds)
  }, [items, user, batchCheckSaved])

  // 검색 결과 — 이미 리스트에 있는 장소 제외
  const existingPlaceIds = new Set(items.map((item) => item.place_id))
  const filteredResults = searchResults.filter((p) => !existingPlaceIds.has(p.id)).slice(0, 10)

  // 장소 추가
  const handleAddPlace = useCallback(async (placeId: string) => {
    try {
      await listsService.addPlaceToList(resolvedListId || listId, placeId)
      refreshItems()
      refreshList()
    } catch {
      showError('추가에 실패했어요')
    }
  }, [resolvedListId, listId, refreshItems, refreshList, showError])

  // 장소 제거 (isMine 북마크)
  const handleRemoveFromList = useCallback((placeId: string) => {
    // 다른 리스트에도 저장되어 있는지 확인
    const savedListIds = getSavedListIds(placeId)
    const otherLists = savedListIds.filter(id => id !== resolvedListId && id !== listId)

    if (otherLists.length > 0) {
      // 다중 리스트에 포함 → 확인 모달
      setRemoveConfirmPlaceId(placeId)
    } else {
      // 이 리스트에서만 제거
      handleRemovePlace(placeId)
    }
  }, [getSavedListIds, resolvedListId, listId])

  // 장소 제거 실행
  const handleRemovePlace = useCallback(async (placeId: string) => {
    try {
      await listsService.removePlaceFromList(resolvedListId || listId, placeId)
      showNotice('장소를 제거했어요', async () => {
        await listsService.addPlaceToList(resolvedListId || listId, placeId)
        refreshItems()
        refreshList()
      })
      refreshItems()
      refreshList()
    } catch {
      showError('제거에 실패했어요')
    }
  }, [resolvedListId, listId, refreshItems, refreshList, showError, showNotice])

  // 메모 저장
  const handleSaveMemo = useCallback(async (placeId: string) => {
    try {
      await listsService.updateListItemMemo(resolvedListId || listId, placeId, memoText.trim() || null)
      setEditingMemoId(null)
      setMemoText('')
      refreshItems()
      showNotice('메모가 저장되었어요')
    } catch {
      showError('메모 저장에 실패했어요')
    }
  }, [resolvedListId, listId, memoText, refreshItems, showError, showNotice])

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
    <SaveFlow>
      {(handleSaveFlowToggle) => (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      <DataState loading={listLoading} error={listError} isEmpty={!list}>
        {list && (<>

      {/* ── 커버 헤더 ── */}
      <header
        className="relative flex flex-col justify-end min-h-[220px] px-5 pt-8 pb-5"
        style={{ backgroundColor: listBgColor(list.cover_hue) }}
      >
        {/* 네비 — 좌: 뒤로 / 우: 공개 pill(owner) · share · star(admin) · more(owner) */}
        <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-10">
          <button onClick={() => router.back()} className="p-1">
            <span className="material-symbols-outlined text-white/90" style={{ fontSize: '22px' }}>arrow_back</span>
          </button>
          <div className="flex gap-1 items-center">
            {isMine && !isDefault && (
              <button
                onClick={() => { setManageInitialView('visibility'); setShowManageSheet(true) }}
                className="h-7 px-2.5 rounded-full bg-white/90 text-stone-600 text-[11px] font-medium inline-flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#57534e' }}>
                  {list.visibility === 'public' ? 'public' : list.visibility === 'unlisted' ? 'link' : 'lock'}
                </span>
                {list.visibility === 'public' ? '공개' : list.visibility === 'unlisted' ? '링크 공유' : '비공개'}
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#a8a29e' }}>expand_more</span>
              </button>
            )}
            {list.visibility !== 'private' && (
              <button onClick={handleShare} className="p-1">
                <span className="material-symbols-outlined text-white/90" style={{ fontSize: '22px' }}>share</span>
              </button>
            )}
            {isAdmin && !isDefault && (
              <button onClick={handleToggleFeatured} className="p-1">
                <span
                  className="material-symbols-outlined text-white/90"
                  style={{ fontSize: '22px', fontVariationSettings: list.is_featured ? "'FILL' 1" : "'FILL' 0" }}
                >star</span>
              </button>
            )}
            {isMine && !isDefault && (
              <button onClick={() => { setManageInitialView('menu'); setShowManageSheet(true) }} className="p-1">
                <span className="material-symbols-outlined text-white/90" style={{ fontSize: '22px' }}>more_vert</span>
              </button>
            )}
          </div>
        </div>

        {/* 커버 콘텐츠 */}
        <div className="relative z-[1] flex flex-col">
          <span className="text-5xl mb-3 block" aria-hidden>
            {isDefault ? '♨️' : (list.cover_emoji || '🧖')}
          </span>
          <h1 className="text-[22px] font-bold text-white leading-tight mb-1.5">
            {isDefault ? 'MY SA-LIST' : list.title}
          </h1>
          {list.description && (
            <p className="text-[13px] text-white/85 leading-relaxed">{list.description}</p>
          )}

          {/* Visitor: 커버 내부 outline 구독 pill */}
          {!isMine && !isDefault && (
            <button
              onClick={async () => {
                const result = await toggleSubscribe()
                if (result === 'need_auth') { requireAuth(); return }
                if (!result) {
                  showNotice(`${list.title} 구독해지`, async () => { await toggleSubscribe() })
                } else {
                  showNotice(`${list.title} 구독완료!`)
                }
              }}
              disabled={subscribing}
              className={`mt-3 self-start h-8 px-3.5 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50 backdrop-blur-sm border-[1.5px] ${
                subscribed
                  ? 'bg-white text-[color:var(--color-primary)] border-white'
                  : 'bg-white/20 text-white border-white/80'
              }`}
            >
              {subscribed ? (
                <><span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'inherit', fontVariationSettings: "'FILL' 1" }}>check</span>구독중</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'inherit' }}>bookmark_add</span>리스트 구독</>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── 크리에이터 + 통계 한 줄 ── */}
      <section className="px-5 py-2.5 flex items-center gap-2 border-b border-stone-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[12px] flex-shrink-0"
            style={{ backgroundColor: profileBgColor(list.owner_profile_hue, '#e7e5e4') }}
          >
            {list.owner_profile_emoji || '🧖'}
          </div>
          <span className="text-[10px] text-stone-400 flex-shrink-0">by</span>
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide truncate">
            {list.owner_nickname || 'USER'}
          </span>
          {list.creator_links && Object.keys(list.creator_links).length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {Object.entries(list.creator_links).map(([platform, username]) => {
                const Icon = SOCIAL_ICON_MAP[platform]
                const prefix = CREATOR_LINK_PREFIXES[platform]
                if (!Icon || !prefix || !username) return null
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); window.open(`${prefix}${username}`, '_blank') }}
                    className="w-[22px] h-[22px] rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
                  >
                    <Icon size={12} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-[12px] text-stone-500 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>onsen</span>
            <strong className="font-bold text-stone-700">{list.place_count}</strong>
          </span>
          <span className="text-[12px] text-stone-500 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
            <strong className="font-bold text-stone-700">{list.subscriber_count}</strong>
          </span>
        </div>
      </section>

      {/* ── 태그 섹션 ── */}
      {list.tags && list.tags.length > 0 && (
        <div className="px-5 py-3 flex gap-1.5 flex-wrap border-b border-stone-100">
          {list.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] text-stone-500 bg-white/30 border border-stone-200">
              #{tag}
            </span>
          ))}
        </div>
      )}

        </>)}
      </DataState>

      {/* 장소 리스트 */}
      <main className="p-4">
        {isMine && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-[13px]">
              <span className="font-semibold text-stone-700">장소</span>
              <span className="text-stone-400 ml-1">· {items.length}</span>
            </div>
            <button
              onClick={() => setShowAddSheet(true)}
              className="h-7 px-2.5 rounded-lg border-[1.5px] border-dashed border-stone-300 text-stone-500 text-[11px] font-medium inline-flex items-center gap-1 hover:text-stone-700 hover:border-stone-400 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_location</span>
              장소 추가
            </button>
          </div>
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
                    collectionMemo={item.memo ?? ''}
                    isSaved={user ? isSaved(item.place.id) : false}
                    isMine={isMine}
                    onToggleSave={isMine
                      ? () => handleRemoveFromList(item.place!.id)
                      : user ? () => handleSaveFlowToggle(item.place!.id) : undefined
                    }
                    onEditMemo={isMine ? (memo) => {
                      setMemoText(memo)
                      setEditingMemoId(item.place_id)
                    } : undefined}
                    onClick={() => router.push(`/explore/${item.place!.id}`)}
                  />

                  {/* Owner: 메모 편집 인라인 */}
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

                  {/* Owner: 제거 버튼만 (메모 수정은 PlaceCard 내 편집 클릭으로 통합) */}
                  {isMine && editingMemoId !== item.place_id && (
                    <div className="flex items-center justify-end mt-1.5">
                      <button
                        onClick={() => handleRemoveFromList(item.place!.id)}
                        className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium text-stone-400"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                        제거
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DataState>
      </main>

      {/* ListManageSheet — 편집/공개설정/삭제 */}
      {list && isMine && !isDefault && (
        <ListManageSheet
          list={list}
          open={showManageSheet}
          onClose={() => setShowManageSheet(false)}
          onUpdated={refreshList}
          onDeleted={() => router.back()}
          initialView={manageInitialView}
        />
      )}

      {/* 리스트에서 제거 확인 모달 (다중 리스트 포함 시) */}
      {removeConfirmPlaceId && (
        <ConfirmModal
          message="이 장소를 이 리스트에서 제거할까요?"
          confirmLabel="제거"
          onConfirm={() => {
            handleRemovePlace(removeConfirmPlaceId)
            setRemoveConfirmPlaceId(null)
          }}
          onCancel={() => setRemoveConfirmPlaceId(null)}
        />
      )}

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
      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </div>
      )}
    </SaveFlow>
  )
}
