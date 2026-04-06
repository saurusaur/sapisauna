/**
 * SA-리스트 피드 — 상단 칩(내 리스트 / 최신 / 인기), 기본 인기 탭
 * 내 리스트 탭: 내 리스트 + 구독 목록을 한 화면에서 섹션으로 표시
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMyLists, usePublicLists, useFeaturedPublicLists } from '@/hooks/use-lists'
import { useSubscribedLists } from '@/hooks/use-subscriptions'
import { useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/contexts/toast-context'
import * as listsService from '@/lib/lists-service'
import type { PublicListSort } from '@/lib/lists-service'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import ListFormSheet from '@/components/features/list-form-sheet'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import Chip from '@/components/ui/chip'
import FeaturedSaListCard from '@/components/features/featured-sa-list-card'
import SaListFeedRow from '@/components/features/sa-list-feed-row'
import type { SaList } from '@/types'

const MAX_LISTS = 15

const FILTER_CHIPS: { id: 'mine' | 'recent' | 'popular'; label: string }[] = [
  { id: 'mine', label: '내 리스트' },
  { id: 'recent', label: '최신' },
  { id: 'popular', label: '인기' },
]

export default function SaListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { user: profile } = useUser()
  const { showError, showNotice } = useToast()
  const [filter, setFilter] = useState<'mine' | 'recent' | 'popular'>('popular')

  const discoverEnabled = filter === 'recent' || filter === 'popular'
  const discoverSort: PublicListSort = filter === 'recent' ? 'recent' : 'popular'

  const { data: myLists, loading: myLoading, error: myError, refresh: refreshMyLists } = useMyLists()
  const { data: subscribedLists, loading: subLoading, error: subError, refresh: refreshSubscribed } = useSubscribedLists()
  const { data: publicLists, loading: pubLoading, error: pubError } = usePublicLists(20, discoverSort, discoverEnabled)
  const { data: featuredLists } = useFeaturedPublicLists(discoverEnabled)

  const [manageList, setManageList] = useState<SaList | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [createDirty, setCreateDirty] = useState(false)

  const viewerNick = profile?.nickname ?? null

  const handleCloseCreateSheet = useCallback(() => {
    if (createDirty) {
      const confirmed = window.confirm('작성 중인 내용이 사라집니다. 나가시겠어요?')
      if (!confirmed) return
    }
    setShowCreateSheet(false)
  }, [createDirty])

  const refreshMine = useCallback(() => {
    refreshMyLists()
    refreshSubscribed()
  }, [refreshMyLists, refreshSubscribed])

  const feedListsDiscover = publicLists.filter((l) => !l.is_featured)
  const discoverEmpty = feedListsDiscover.length === 0 && featuredLists.length === 0
  const discoverSectionTitle = filter === 'recent' ? '최근 공개 사-리스트' : '인기 사-리스트'

  const mineLoading = myLoading || subLoading
  const mineError = myError || subError
  const mineEmpty = myLists.length === 0 && subscribedLists.length === 0

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg flex flex-col">
      <header className="p-5 pt-8 flex-shrink-0">
        <h1 className="text-3xl font-extrabold italic font-heading">
          SA-LIST
        </h1>
      </header>

      <main className="px-4 pb-4 flex-1 flex flex-col min-h-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 flex-shrink-0 -mx-0.5 px-0.5">
          {FILTER_CHIPS.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={filter === c.id}
              onClick={() => setFilter(c.id)}
            />
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {filter === 'mine' ? (
            <DataState
              loading={mineLoading}
              error={mineError}
              isEmpty={mineEmpty}
              emptyIcon="playlist_add"
              emptyMessage="아직 리스트가 없어요. 탐색에서 하트를 눌러 저장해보세요!"
            >
              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-stone-500 mb-2">내 리스트</h3>
                  <div className="space-y-2">
                    {myLists.map((list) => (
                      <SaListFeedRow
                        key={list.id}
                        list={list}
                        displayHandle={viewerNick}
                        isMine
                        isDefault={list.type === 'default'}
                        onClick={() => router.push(`/sa-list/${list.id}`)}
                        {...(list.type !== 'default' ? { onMenu: () => setManageList(list) } : {})}
                      />
                    ))}
                  </div>
                </section>

                {subscribedLists.length > 0 ? (
                  <section>
                    <h3 className="text-sm font-semibold text-stone-500 mb-2">구독 중</h3>
                    <div className="space-y-2">
                      {subscribedLists.map((list) => (
                        <SubscribedFeedRow
                          key={list.id}
                          list={list}
                          onClick={() => router.push(`/sa-list/${list.id}`)}
                          showNotice={showNotice}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowCreateSheet(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 glass-card-light rounded-xl text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  새 리스트 만들기
                </button>
              </div>
            </DataState>
          ) : (
            <DataState
              loading={pubLoading}
              error={pubError}
              isEmpty={discoverEmpty}
              emptyIcon="explore"
              emptyMessage="아직 공개 리스트가 없어요"
            >
              <div className="space-y-4">
                {featuredLists.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-stone-500 mb-2">추천 사-리스트</h3>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                      {featuredLists.map((list) => (
                        <FeaturedSaListCard
                          key={list.id}
                          list={list}
                          onClick={() => router.push(`/sa-list/${list.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {feedListsDiscover.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-stone-500 mb-2">{discoverSectionTitle}</h3>
                    <div className="space-y-2">
                      {feedListsDiscover.map((list) =>
                        user && list.owner_id === user.id ? (
                          <SaListFeedRow
                            key={list.id}
                            list={list}
                            displayHandle={viewerNick}
                            isMine
                            isDefault={list.type === 'default'}
                            onClick={() => router.push(`/sa-list/${list.id}`)}
                            {...(list.type !== 'default' ? { onMenu: () => setManageList(list) } : {})}
                          />
                        ) : (
                          <SubscribedFeedRow
                            key={list.id}
                            list={list}
                            onClick={() => router.push(`/sa-list/${list.id}`)}
                            showNotice={showNotice}
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </DataState>
          )}
        </div>
      </main>

      <BottomSheet
        open={showCreateSheet}
        onClose={handleCloseCreateSheet}
        title="새 리스트 만들기"
      >
        <ListFormSheet
          mode="create"
          onSubmit={async (data) => {
            if (!user) return
            if (myLists.length >= MAX_LISTS) {
              showError(`리스트는 최대 ${MAX_LISTS}개까지 만들 수 있어요`)
              return
            }
            const list = await listsService.createList({
              owner_id: user.id,
              title: data.title,
              type: 'user',
              tags: data.tags.length > 0 ? data.tags : undefined,
              description: data.description || undefined,
              cover_color: data.cover_color,
              cover_emoji: data.cover_emoji,
            })
            if (data.places) {
              for (const place of data.places) {
                await listsService.addPlaceToList(list.id, place.id)
                if (place.memo?.trim()) {
                  await listsService.updateListItemMemo(list.id, place.id, place.memo.trim())
                }
              }
            }
            setShowCreateSheet(false)
            refreshMine()
          }}
          onDirtyChange={setCreateDirty}
          submitLabel="만들기"
        />
      </BottomSheet>

      {manageList ? (
        <ListManageSheet
          list={manageList}
          open={!!manageList}
          onClose={() => setManageList(null)}
          onUpdated={refreshMine}
          onDeleted={() => { setManageList(null); refreshMine() }}
        />
      ) : null}

      <BottomNav />
    </div>
  )
}

function SubscribedFeedRow({
  list,
  onClick,
  showNotice,
}: {
  list: SaList
  onClick: () => void
  showNotice: (msg: string, undo?: () => Promise<void>) => void
}) {
  const { subscribed, toggling, toggle } = useSubscription(list.id)

  const handleSubscribe = useCallback(async () => {
    const wasSubscribed = subscribed
    await toggle()
    if (wasSubscribed) {
      showNotice(`${list.title} 구독해지`, async () => { await toggle() })
    } else {
      showNotice(`${list.title} 구독완료!`)
    }
  }, [subscribed, toggle, list.title, showNotice])

  return (
    <SaListFeedRow
      list={list}
      onClick={onClick}
      showSubscribe
      subscribed={subscribed}
      subscribing={toggling}
      onSubscribe={handleSubscribe}
    />
  )
}
