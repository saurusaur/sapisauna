/**
 * SA-리스트 홈 — 단일 세로 스크롤
 * Featured 캐러셀 → 내 리스트 가로카드 → 인기 태그(Phase2) → 인기/최신 피드
 */

'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePublicLists, useFeaturedPublicLists, usePopularTags } from '@/hooks/use-lists'
import { useSubscribedLists, useSubscription } from '@/hooks/use-subscriptions'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/contexts/toast-context'
import { useSavePlace } from '@/contexts/save-place-context'
import { TRIBES } from '@/constants/content'
import * as listsService from '@/lib/lists-service'
import type { PublicListSort } from '@/lib/lists-service'
import { listBgColor } from '@/lib/utils'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import ListFormSheet from '@/components/features/list-form-sheet'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import FeaturedSaListCard from '@/components/features/featured-sa-list-card'
import SaListFeedRow from '@/components/features/sa-list-feed-row'
import type { SaList } from '@/types'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import ConfirmModal from '@/components/ui/confirm-modal'

const MAX_LISTS = 15
const MY_CARD_LIMIT = 5

export default function SaListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { user: profile } = useUser()
  const { showError, showNotice } = useToast()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // 데이터 훅 — myLists는 SavePlaceContext SSOT (저장/해제 시 자동 refresh)
  const { myLists, loading: myLoading, refreshMyLists } = useSavePlace()
  const { data: subscribedLists, loading: subLoading, refresh: refreshSubscribed } = useSubscribedLists()
  const { data: featuredLists } = useFeaturedPublicLists()
  const { data: popularTags } = usePopularTags()

  // 검색 + 태그 필터
  const [showSearch, setShowSearch] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // 300ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().length >= 2 ? searchInput.trim() : '')
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // 검색어 또는 태그 → 피드 필터
  const feedSearch = activeTag || debouncedSearch || undefined

  // 피드 정렬
  const [feedSort, setFeedSort] = useState<PublicListSort>('popular')
  const { data: publicLists, loading: pubLoading, error: pubError } = usePublicLists(20, feedSort, true, feedSearch)

  // 시트 상태
  const [manageList, setManageList] = useState<SaList | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [createDirty, setCreateDirty] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const viewerNick = profile?.nickname ?? null

  // 구독 ID Set (Featured 카드 구독 표시용)
  const subscribedIds = useMemo(
    () => new Set(subscribedLists.map((l) => l.id)),
    [subscribedLists]
  )

  // 내 리스트 가로 카드: 기본 리스트 맨 앞 + 나머지 최근 수정순 (내 리스트 + 구독 혼합)
  const myCardItems = useMemo(() => {
    const defaultList = myLists.find((l) => l.type === 'default')
    const otherMyLists = myLists.filter((l) => l.type !== 'default')

    // 내 리스트 + 구독 리스트를 updated_at 기준 내림차순 정렬
    const mixed = [
      ...otherMyLists.map((l) => ({ list: l, kind: 'mine' as const })),
      ...subscribedLists.map((l) => ({ list: l, kind: 'subscribed' as const })),
    ].sort((a, b) => new Date(b.list.updated_at).getTime() - new Date(a.list.updated_at).getTime())

    const result: { list: SaList; kind: 'default' | 'mine' | 'subscribed' }[] = []
    if (defaultList) result.push({ list: defaultList, kind: 'default' })
    result.push(...mixed.slice(0, MY_CARD_LIMIT - (defaultList ? 1 : 0)))
    return result
  }, [myLists, subscribedLists])

  // 피드에서 featured 제외 (검색/태그 모드에서는 featured도 포함 — 태그가 featured에만 있을 때 대응)
  const feedLists = feedSearch
    ? publicLists
    : publicLists.filter((l) => !l.is_featured)

  const handleCloseCreateSheet = useCallback(() => {
    if (createDirty) {
      setShowCloseConfirm(true)
      return
    }
    setShowCreateSheet(false)
  }, [createDirty])

  const refreshMine = useCallback(() => {
    refreshMyLists()
    refreshSubscribed()
  }, [refreshMyLists, refreshSubscribed])

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg flex flex-col">
      {/* 헤더: SA-LIST + 검색/생성 버튼 (다른 페이지와 동일 p-5 pt-8) */}
      <header className="p-5 pt-8 flex items-center justify-between flex-shrink-0">
        <h1 className="text-3xl font-extrabold italic font-heading">
          SA-LIST
        </h1>
        <div className="flex gap-1">
          <button
            type="button"
            className="p-1"
            aria-label="검색"
            onClick={() => {
              setShowSearch((v) => !v)
              if (!showSearch) setTimeout(() => searchRef.current?.focus(), 100)
            }}
          >
            <span className="material-symbols-outlined text-stone-500" style={{ fontSize: '22px' }}>search</span>
          </button>
          <button
            type="button"
            className="p-1"
            aria-label="새 리스트"
            onClick={() => {
              if (!requireAuth()) return
              setShowCreateSheet(true)
            }}
          >
            <span className="material-symbols-outlined text-stone-500" style={{ fontSize: '22px' }}>add</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* ── 검색 바 ── */}
        {showSearch && (
          <div className="mx-5 mb-2 px-3.5 py-2.5 rounded-[14px] glass-card-light flex items-center gap-2">
            <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '18px' }}>search</span>
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setActiveTag(null) }}
              placeholder="리스트 또는 태그 검색"
              className="flex-1 bg-transparent outline-none text-sm text-stone-800 placeholder:text-stone-300"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); setActiveTag(null) }} className="p-0.5">
                <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>
        )}

        {/* ── SA-PI FEATURED 캐러셀 ── */}
        {featuredLists.length > 0 && (
          <section>
            <div className="px-5 pt-2 pb-2">
              <h2 className="text-sm font-bold text-stone-600">SA-PI FEATURED</h2>
              <p className="text-[10.5px] text-stone-400 font-normal mt-0.5">사-피 추천 리스트!</p>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
              {featuredLists.map((list) => (
                <FeaturedSaListCard
                  key={list.id}
                  list={list}
                  onClick={() => router.push(`/sa-list/${list.id}`)}
                  subscribed={user ? subscribedIds.has(list.id) : undefined}
                  onSubscribe={async () => {
                    if (!requireAuth() || !user) return
                    const wasSub = subscribedIds.has(list.id)
                    await listsService.toggleSubscription(user.id, list.id)
                    refreshSubscribed()
                    if (wasSub) {
                      showNotice(`${list.title} 구독해지`, async () => {
                        await listsService.toggleSubscription(user.id, list.id)
                        refreshSubscribed()
                      })
                    } else {
                      showNotice(`${list.title} 구독완료!`)
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── TRIBE PICKS — 트라이브별 실시간 추천 ── */}
        <section>
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-bold text-stone-600">TRIBE PICKS</h2>
            <p className="text-[10.5px] text-stone-400 font-normal mt-0.5">실시간 업데이트 트라이브별 베스트 픽!</p>
          </div>
          <div className="px-5 pb-1 grid grid-cols-3 gap-2">
            {Object.values(TRIBES).map((tribe) => (
              <button
                key={tribe.id}
                type="button"
                onClick={() => router.push(`/sa-list/tribe/${tribe.id}`)}
                className="aspect-[1.2/1] rounded-[14px] flex flex-col items-center justify-center gap-1.5 active:scale-[0.96] transition-transform shadow-sm"
                style={{ backgroundColor: tribe.color }}
              >
                <span className="text-[30px] leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}>{tribe.emoji}</span>
                <span className="text-[12px] font-bold font-heading tracking-wide text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>{tribe.persona}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 내 리스트 가로 카드 ── */}
        {user && (
          <section>
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-600">내 사-리스트</h2>
              <Link href="/sa-list/my" className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>
                전체보기
              </Link>
            </div>
            {myLoading || subLoading ? (
              <div className="px-5 py-4 text-xs text-stone-400">불러오는 중...</div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-5 pb-1">
                {myCardItems.map(({ list, kind }) => (
                  <MyCardItem
                    key={list.id}
                    list={list}
                    kind={kind}
                    onClick={() => router.push(`/sa-list/${list.id}`)}
                  />
                ))}
                {/* 새 리스트 카드 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth()) return
                    setShowCreateSheet(true)
                  }}
                  className="flex-shrink-0 w-[140px] min-h-[92px] rounded-[14px] border-[1.5px] border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 active:scale-[0.96] transition-transform"
                >
                  <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '20px' }}>add</span>
                  <span className="text-[11px] text-stone-400 font-medium">새 리스트</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── 인기 태그 ── */}
        {popularTags.length > 0 && (
          <section>
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-sm font-bold text-stone-600">인기 태그</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-1">
              <button
                type="button"
                onClick={() => { setActiveTag(null); setSearchInput('') }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !activeTag
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-white/30 text-stone-500 border-stone-200'
                }`}
              >
                전체
              </button>
              {popularTags.map(({ tag }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { setActiveTag(activeTag === tag ? null : tag); setSearchInput('') }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                    activeTag === tag
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white/30 text-stone-500 border-stone-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 인기/최신 피드 ── */}
        <section>
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-sm font-bold text-stone-600">인기 사-리스트</h2>
          </div>
          <div className="px-5 pt-1 pb-2 flex gap-3">
            <button
              type="button"
              onClick={() => setFeedSort('popular')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                feedSort === 'popular'
                  ? 'text-stone-800 border-stone-800'
                  : 'text-stone-400 border-transparent'
              }`}
            >
              인기순
            </button>
            <button
              type="button"
              onClick={() => setFeedSort('recent')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                feedSort === 'recent'
                  ? 'text-stone-800 border-stone-800'
                  : 'text-stone-400 border-transparent'
              }`}
            >
              최신순
            </button>
          </div>

          <div className="px-5 pb-4">
            <DataState
              loading={pubLoading}
              error={pubError}
              isEmpty={feedLists.length === 0}
              emptyIcon="explore"
              emptyMessage="아직 공개 리스트가 없어요"
            >
              <div className="flex flex-col gap-2.5">
                {feedLists.map((list) =>
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
            </DataState>
          </div>
        </section>
      </main>

      {/* 나가기 확인 모달 */}
      {showCloseConfirm && (
        <ConfirmModal
          message="작성 중인 내용이 사라집니다. 나가시겠어요?"
          confirmLabel="나가기"
          cancelLabel="계속 작성"
          onConfirm={() => { setShowCloseConfirm(false); setShowCreateSheet(false) }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}

      {/* 시트들 */}
      <BottomSheet
        open={showCreateSheet}
        onClose={handleCloseCreateSheet}
        title="새 리스트 만들기"
        fullScreen
      >
        <ListFormSheet
          mode="create"
          onSubmit={async (data) => {
            if (!requireAuth()) return
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
            setShowCreateSheet(false)
            refreshMine()
          }}
          onDirtyChange={setCreateDirty}
          submitLabel="만들기"
        />
      </BottomSheet>

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

/* ── 내 리스트 가로 미니카드 (인라인) ── */

function MyCardItem({
  list,
  kind,
  onClick,
}: {
  list: SaList
  kind: 'default' | 'mine' | 'subscribed'
  onClick: () => void
}) {
  const isDefault = kind === 'default'
  const isSubscribed = kind === 'subscribed'
  const emoji = isDefault ? '♨️' : list.cover_emoji
  const thumbBg = isDefault ? '#ffffff' : listBgColor(list.cover_hue)
  const title = isDefault ? 'MY SA-LIST' : list.title

  const visibilityBadge = isSubscribed
    ? { label: '구독 중', cls: 'bg-stone-200 text-stone-500' }
    : {
        label: VISIBILITY_LABEL[list.visibility],
        cls: list.visibility === 'public'
          ? 'bg-green-500/10 text-green-600'
          : list.visibility === 'unlisted'
            ? 'bg-blue-500/10 text-blue-500'
            : 'bg-stone-500/10 text-stone-500',
      }

  const meta = isSubscribed
    ? `${(list.owner_nickname || '').toUpperCase()} · ${list.place_count}곳`
    : `${list.place_count}곳${list.subscriber_count > 0 ? ` · 구독 ${list.subscriber_count}` : ''}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-[140px] min-h-[92px] rounded-[14px] p-3 flex flex-col justify-between gap-1.5 text-left active:scale-[0.96] transition-transform glass-card-light ${
        isDefault ? 'ring-1 ring-inset ring-red-600/10' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-xl"
          style={{ backgroundColor: thumbBg }}
        >
          {emoji || <span className="material-symbols-outlined text-white/80" style={{ fontSize: '18px' }}>playlist_play</span>}
        </div>
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${visibilityBadge.cls}`}>
          {visibilityBadge.label}
        </span>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-stone-800 truncate">{title}</p>
        <p className="text-[11px] text-stone-400">{meta}</p>
      </div>
    </button>
  )
}

const VISIBILITY_LABEL: Record<string, string> = {
  public: '공개',
  private: '비공개',
  unlisted: '링크공유',
}

/* ── 구독 가능한 피드 행 (내부 컴포넌트) ── */

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
