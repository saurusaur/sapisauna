/**
 * SA-리스트 전체보기 — 탭 3개(전체/내 리스트/구독 중)
 * SaListFeedRow 재사용, 카운트 표시, 새 리스트 만들기 row
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscribedLists, useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/contexts/toast-context'
import { useSavePlace } from '@/contexts/save-place-context'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import CreateListSheet from '@/components/features/create-list-sheet'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import SaListFeedRow from '@/components/features/sa-list-feed-row'
import type { SaList } from '@/types'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'

type TabId = 'all' | 'mine' | 'subscribed'
const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'mine', label: '내 리스트' },
  { id: 'subscribed', label: '구독 중' },
]

export default function SaListMyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { user: profile } = useUser()
  const { showError, showNotice } = useToast()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()
  const [tab, setTab] = useState<TabId>('all')

  const { myLists, loading: myLoading, refreshMyLists } = useSavePlace()
  const { data: subscribedLists, loading: subLoading, refresh: refreshSubscribed } = useSubscribedLists()

  const [manageList, setManageList] = useState<SaList | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const viewerNick = profile?.nickname ?? null

  const refreshMine = useCallback(() => {
    refreshMyLists()
    refreshSubscribed()
  }, [refreshMyLists, refreshSubscribed])

  // 탭별 카운트
  const counts = useMemo(() => ({
    all: myLists.length + subscribedLists.length,
    mine: myLists.length,
    subscribed: subscribedLists.length,
  }), [myLists, subscribedLists])

  const loading = myLoading || subLoading
  const showMyLists = tab === 'all' || tab === 'mine'
  const showSubscribed = tab === 'all' || tab === 'subscribed'
  const isEmpty = (showMyLists ? myLists.length : 0) + (showSubscribed ? subscribedLists.length : 0) === 0

  // 비로그인 리다이렉트
  if (!user) {
    router.replace('/sa-list')
    return null
  }

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg flex flex-col">
      {/* 헤더 — place 상세 레이아웃과 통일 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3 mb-3">
          <button type="button" onClick={() => router.back()} className="text-stone-500 hover:text-stone-700">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1" />
        </div>
        <h1 className="text-2xl font-extrabold italic font-heading">MY SA-LISTS</h1>
      </header>

      {/* 탭 — 하이라이트 레드 */}
      <div className="px-5 flex gap-4 border-b border-stone-200/60 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-sm font-semibold pb-2.5 border-b-2 transition-colors ${
              tab === t.id
                ? 'text-stone-800'
                : 'text-stone-400 border-transparent'
            }`}
            style={tab === t.id ? { borderColor: 'var(--color-primary)' } : undefined}
          >
            {t.label} {counts[t.id] > 0 && <span className="text-stone-400 font-normal">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-y-auto px-5 pt-4">
        <DataState
          loading={loading}
          error={null}
          isEmpty={isEmpty}
          emptyIcon="playlist_add"
          emptyMessage="아직 리스트가 없어요"
        >
          <div className="flex flex-col gap-2.5">
            {/* 내 리스트 */}
            {showMyLists && myLists.map((list) => (
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

            {/* 구독 중 */}
            {showSubscribed && subscribedLists.map((list) => (
              <SubscribedRow
                key={list.id}
                list={list}
                onClick={() => router.push(`/sa-list/${list.id}`)}
                showNotice={showNotice}
              />
            ))}

            {/* 새 리스트 만들기 */}
            {(tab === 'all' || tab === 'mine') && (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth()) return
                  setShowCreateSheet(true)
                }}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-stone-300 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                새 리스트 만들기
              </button>
            )}
          </div>
        </DataState>
      </main>

      {/* 시트들 */}
      <CreateListSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreated={refreshMine}
        requireAuth={requireAuth}
        userId={user?.id}
        listCount={myLists.length}
        showError={showError}
      />

      {manageList && (
        <ListManageSheet
          list={manageList}
          open={!!manageList}
          onClose={() => setManageList(null)}
          onUpdated={refreshMine}
          onDeleted={() => { setManageList(null); refreshMine() }}
        />
      )}

      <BottomNav />
      <LoginPromptModal open={showPrompt} onClose={() => setShowPrompt(false)} />
    </div>
  )
}

function SubscribedRow({
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
