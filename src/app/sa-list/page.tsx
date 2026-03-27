/**
 * SA-리스트 피드 — 3탭 (내 리스트 / 구독중 / 발견)
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMyLists, usePublicLists } from '@/hooks/use-lists'
import { useSubscribedLists } from '@/hooks/use-subscriptions'
import { useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import * as listsService from '@/lib/lists-service'
import BottomNav from '@/components/bottom-nav'
import TypeTab from '@/components/ui/type-tab'
import DataState from '@/components/ui/data-state'
import CoverCard from '@/components/features/cover-card'
import ListFormSheet from '@/components/features/list-form-sheet'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { SaList } from '@/types'

const TABS = ['내 리스트', '구독중', '발견'] as const
type Tab = typeof TABS[number]

const MAX_LISTS = 15

export default function SaListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showError, showNotice } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('내 리스트')

  // 데이터 훅
  const { data: myLists, loading: myLoading, error: myError, refresh: refreshMyLists } = useMyLists()
  const { data: subscribedLists, loading: subLoading, error: subError } = useSubscribedLists()
  const { data: publicLists, loading: pubLoading, error: pubError } = usePublicLists(20)

  // 리스트 관리 시트 (편집/공개설정/삭제)
  const [manageList, setManageList] = useState<SaList | null>(null)

  // 새 리스트 생성 시트
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [createDirty, setCreateDirty] = useState(false)

  // 나가기 컨펌 (내용 있을 때만)
  const handleCloseCreateSheet = useCallback(() => {
    if (createDirty) {
      const confirmed = window.confirm('작성 중인 내용이 사라집니다. 나가시겠어요?')
      if (!confirmed) return
    }
    setShowCreateSheet(false)
  }, [createDirty])

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
                {...(list.type !== 'default' ? { onMenu: () => setManageList(list) } : {})}
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
            refreshMyLists()
          }}
          onDirtyChange={setCreateDirty}
          submitLabel="만들기"
        />
      </BottomSheet>

      {/* 리스트 관리 시트 (편집/공개설정/삭제) */}
      {manageList && (
        <ListManageSheet
          list={manageList}
          open={!!manageList}
          onClose={() => setManageList(null)}
          onUpdated={refreshMyLists}
          onDeleted={() => { setManageList(null); refreshMyLists() }}
        />
      )}

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
  showNotice: (msg: string, undo?: () => Promise<void>) => void
}) {
  const { subscribed, toggling, toggle } = useSubscription(list.id)

  const handleToggle = useCallback(async () => {
    const wasSubscribed = subscribed
    await toggle()
    if (wasSubscribed) {
      showNotice(`${list.title} 구독해지`, async () => { await toggle() })
    } else {
      showNotice(`${list.title} 구독완료!`)
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
