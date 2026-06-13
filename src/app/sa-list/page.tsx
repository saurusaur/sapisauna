/**
 * SA-리스트 홈 — 디스커버리 리디자인 (2026-06)
 * 레드 돔 헤더 → 이주의 사피픽 캐러셀 → MY SHELF(책등) → BROWSE BY TAG(타일) → 전체 피드
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
import type { PublicListSort } from '@/lib/lists-service'
import { listToneColors, tagHue } from '@/lib/utils'
import BottomNav from '@/components/bottom-nav'
import DataState from '@/components/ui/data-state'
import ContentLoader from '@/components/ui/content-loader'
import CurveHeader from '@/components/ui/curve-header'
import CreateListSheet from '@/components/features/create-list-sheet'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import ListCoverCard from '@/components/features/list-cover-card'
import SaListFeedRow from '@/components/features/sa-list-feed-row'
import type { SaList } from '@/types'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'

const SHELF_LIMIT = 10
/** 사피픽 카드 세로 스태거 오프셋 (홈 캐러셀 문법) */
const PICK_STAGGER = [0, 16, 6, 20, 10]
/** 태그 결과 모자이크 높이 패턴 */
const MOSAIC_HEIGHTS = [150, 122, 118, 146]

export default function SaListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { user: profile } = useUser()
  const { showError, showNotice } = useToast()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // 데이터 훅 — myLists는 SavePlaceContext SSOT (저장/해제 시 자동 refresh)
  const { myLists, loading: myLoading, refreshMyLists } = useSavePlace()
  const { data: subscribedLists, loading: subLoading, refresh: refreshSubscribed } = useSubscribedLists()
  const { data: featuredLists, loading: featuredLoading } = useFeaturedPublicLists()
  const { data: popularTags } = usePopularTags(4)

  // 상단 섹션들 초기 로딩 게이트 (피드 재쿼리는 섹션 내부 DataState가 처리)
  const initialLoading = myLoading || subLoading || featuredLoading

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

  // 텍스트 검색 → 큐레이션 숨기고 피드를 검색 결과로 전환
  // 태그 선택 → BROWSE BY TAG 안에서 인라인 결과 (다른 섹션 유지)
  const feedSearch = activeTag || debouncedSearch || undefined
  const isTextSearching = !activeTag && !!debouncedSearch

  // 피드 정렬
  const [feedSort, setFeedSort] = useState<PublicListSort>('popular')
  const { data: publicLists, loading: pubLoading, error: pubError } = usePublicLists(20, feedSort, true, feedSearch)

  // 시트 상태
  const [manageList, setManageList] = useState<SaList | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const viewerNick = profile?.nickname ?? null

  // MY SHELF: 기본 리스트 맨 앞 + 내 리스트·구독 혼합 (updated_at 내림차순)
  const shelfItems = useMemo(() => {
    const defaultList = myLists.find((l) => l.type === 'default')
    const otherMyLists = myLists.filter((l) => l.type !== 'default')
    const mixed = [
      ...otherMyLists.map((l) => ({ list: l, kind: 'mine' as const })),
      ...subscribedLists.map((l) => ({ list: l, kind: 'subscribed' as const })),
    ].sort((a, b) => new Date(b.list.updated_at).getTime() - new Date(a.list.updated_at).getTime())

    const result: { list: SaList; kind: 'default' | 'mine' | 'subscribed' }[] = []
    if (defaultList) result.push({ list: defaultList, kind: 'default' })
    result.push(...mixed.slice(0, SHELF_LIMIT - (defaultList ? 1 : 0)))
    return result
  }, [myLists, subscribedLists])

  const shelfCount = useMemo(
    () => myLists.filter((l) => l.type !== 'default').length + subscribedLists.length,
    [myLists, subscribedLists]
  )

  const refreshMine = useCallback(() => {
    refreshMyLists()
    refreshSubscribed()
  }, [refreshMyLists, refreshSubscribed])

  // 태그 결과 모자이크: 2열 분배 (좌/우 번갈아)
  const tagMosaicCols = useMemo(() => {
    const cols: [SaList[], SaList[]] = [[], []]
    publicLists.forEach((l, i) => cols[i % 2].push(l))
    return cols
  }, [publicLists])

  const activeTagCount = activeTag
    ? popularTags.find((t) => t.tag === activeTag)?.count
    : undefined

  return (
    <div className="relative min-h-dvh pb-24 bath-tile-bg overflow-hidden flex flex-col">
      {/* ── 레드 돔 (홈과 동일 곡선 헤더, 높이만 축소) ── */}
      <CurveHeader color="var(--color-primary)" height={232} />

      {/* ── 헤더 ── */}
      <header className="relative z-[3] px-6 pt-8 pb-1">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[40px] leading-none italic font-heading font-bold text-white">SA-LIST</h1>
            <p className="text-white/90 text-sm font-medium mt-2.5">고수들의 사우나 리스트 둘러보기</p>
          </div>
          <div className="flex gap-1.5 mt-1">
            <button
              type="button"
              aria-label="검색"
              onClick={() => {
                setShowSearch((v) => !v)
                if (!showSearch) setTimeout(() => searchRef.current?.focus(), 100)
              }}
              className="w-9 h-9 rounded-full bg-white/[0.18] border border-white/35 flex items-center justify-center active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '17px' }}>search</span>
            </button>
            <button
              type="button"
              aria-label="새 리스트"
              onClick={() => {
                if (!requireAuth()) return
                setShowCreateSheet(true)
              }}
              className="w-9 h-9 rounded-full bg-white/[0.18] border border-white/35 flex items-center justify-center active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '17px' }}>add</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 검색 바 ── */}
        {showSearch && (
          <div className="relative z-[3] mx-5 mt-2 mb-1 px-3.5 py-2.5 rounded-[11px] bg-white/90 shadow-sm flex items-center gap-2">
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

        {!isTextSearching && initialLoading ? (
          <ContentLoader />
        ) : (<>
        {/* ── 사-피 추천 — 돔 경계에 겹치는 피쳐드 캐러셀 ── */}
        {!isTextSearching && featuredLists.length > 0 && (
          <section className="relative z-[5] mt-5">
            <div className="px-6 pb-0">
              <h2 className="text-[19px] font-extrabold italic font-heading tracking-wide text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                사-피 추천
              </h2>
              <p className="text-white/90 text-sm font-medium mt-0.5">사-피 PICK · 주목할 리스트</p>
            </div>
            {/* pt-2 = 1번 카드 회전(-2°) 상단 클립 방지(헤딩↔카드 ≈8px 밀착) / pb-2 -mb-2 = 그림자 여유는 두되 섹션 간 갭은 mt-5로 균일 */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6 pt-2 pb-2 -mb-2 items-start">
              {featuredLists.map((list, i) => (
                <ListCoverCard
                  key={list.id}
                  list={list}
                  variant="pick"
                  badge={list.featured_note || '사-피 PICK'}
                  onClick={() => router.push(`/sa-list/${list.id}`)}
                  style={{
                    marginTop: PICK_STAGGER[i % PICK_STAGGER.length],
                    transform: i === 0 ? 'rotate(-2deg)' : undefined,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 내 리스트 — 내 리스트 + 구독 책등 선반 ── */}
        {!isTextSearching && user && (
          <section className="mt-5">
            <div className="px-6 pb-2.5 flex items-end justify-between">
              <div>
                <h2 className="text-[19px] font-extrabold italic font-heading tracking-wide text-stone-800">내 사-리스트</h2>
                <p className="text-[10.5px] text-stone-400 font-medium mt-0.5">내가 저장하거나 구독한 리스트 · {shelfCount}</p>
              </div>
              <Link href="/sa-list/my" className="text-[11px] font-medium pb-0.5" style={{ color: 'var(--color-primary)' }}>
                전체보기
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-6 pb-1">
              {shelfItems.map(({ list, kind }) => (
                <ShelfSpine
                  key={list.id}
                  list={list}
                  kind={kind}
                  onClick={() => router.push(`/sa-list/${list.id}`)}
                />
              ))}
              {/* 새 리스트 spine */}
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth()) return
                  setShowCreateSheet(true)
                }}
                className="flex-shrink-0 w-[62px] h-[116px] rounded-[8px] border-[1.5px] border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 active:scale-[0.96] transition-transform"
                aria-label="새 리스트"
              >
                <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '18px' }}>add</span>
              </button>
            </div>
          </section>
        )}

        {/* ── 인기 태그 — 태그 타일 → 인라인 결과 ── */}
        {!isTextSearching && popularTags.length > 0 && (
          <section className="mt-5">
            <div className="px-6 pb-2.5">
              <h2 className="text-[19px] font-extrabold italic font-heading tracking-wide text-stone-800">인기 태그</h2>
              <p className="text-[10.5px] text-stone-400 font-medium mt-0.5">태그를 눌러 관련 리스트 둘러보기</p>
            </div>

            {!activeTag ? (
              /* 기본 상태: 2×2 타일 */
              <div className="grid grid-cols-2 gap-2.5 px-6">
                {popularTags.map(({ tag, count }) => (
                  <TagTile key={tag} tag={tag} count={count} onClick={() => { setActiveTag(tag); setSearchInput('') }} />
                ))}
              </div>
            ) : (
              /* 선택 상태: 컴팩트 바 + 결과 모자이크 */
              <>
                <TagBar
                  tag={activeTag}
                  count={activeTagCount}
                  onClose={() => setActiveTag(null)}
                />
                <div className="px-6 pt-3">
                  <DataState
                    loading={pubLoading}
                    error={pubError}
                    isEmpty={publicLists.length === 0}
                    emptyIcon="explore"
                    emptyMessage="이 태그의 리스트가 아직 없어요"
                  >
                    <div className="flex gap-2.5 items-start">
                      {tagMosaicCols.map((col, colIdx) => (
                        <div key={colIdx} className="flex-1 flex flex-col gap-2.5">
                          {col.map((list, i) => (
                            <ListCoverCard
                              key={list.id}
                              list={list}
                              variant="mosaic"
                              height={MOSAIC_HEIGHTS[(i * 2 + colIdx) % MOSAIC_HEIGHTS.length]}
                              onClick={() => router.push(`/sa-list/${list.id}`)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </DataState>
                </div>
              </>
            )}
          </section>
        )}

        {/* ── 전체 공개 사-리스트 (태그 선택 중엔 숨김 — 인기 태그 결과와 중복) ── */}
        {!activeTag && (
        <section className="mt-5">
          <div className="px-6 pb-1">
            <h2 className="text-[19px] font-extrabold italic font-heading tracking-wide text-stone-800">
              {isTextSearching ? '검색 결과' : '전체 공개 사-리스트'}
            </h2>
            {!isTextSearching && (
              <p className="text-[10.5px] text-stone-400 font-medium mt-0.5">인기순·최신순으로 모아보기</p>
            )}
          </div>
          <div className="px-6 pt-1 pb-2 flex gap-3">
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

          <div className="px-6 pb-4">
            <DataState
              loading={pubLoading}
              error={pubError}
              isEmpty={publicLists.length === 0}
              emptyIcon="explore"
              emptyMessage="아직 공개 리스트가 없어요"
            >
              <div className="flex flex-col gap-2.5">
                {publicLists.map((list) =>
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
                      requireAuth={requireAuth}
                    />
                  )
                )}
              </div>
            </DataState>
          </div>
        </section>
        )}
        </>)}
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
        fullScreen
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

/* ── MY SHELF 책등 카드 (인라인) ── */

function ShelfSpine({
  list,
  kind,
  onClick,
}: {
  list: SaList
  kind: 'default' | 'mine' | 'subscribed'
  onClick: () => void
}) {
  const isDefault = kind === 'default'
  const tones = listToneColors(isDefault ? null : list.cover_hue)
  const title = isDefault ? 'MY SA-LIST' : list.title

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-[62px] h-[116px] rounded-[8px] p-2 flex flex-col justify-between items-start text-left active:scale-[0.96] transition-transform ${
        isDefault ? 'ring-1 ring-inset ring-red-600/15' : ''
      }`}
      style={{
        backgroundColor: isDefault ? '#ffffff' : tones.bg,
        boxShadow: '0 3px 10px -4px rgba(0,0,0,0.18)',
      }}
    >
      {/* 세로쓰기 제목 */}
      <span
        className="text-[10.5px] font-extrabold leading-tight text-stone-800 overflow-hidden"
        style={{ writingMode: 'vertical-rl', maxHeight: '78px', wordBreak: 'keep-all' }}
      >
        {title}
      </span>
      <span className="text-[9px] font-semibold opacity-60 flex items-center gap-0.5">
        {kind === 'subscribed' && (
          <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>bookmark_add</span>
        )}
        {isDefault ? `♨️ ${list.place_count}` : `${list.place_count}곳`}
      </span>
    </button>
  )
}

/* ── BROWSE BY TAG 타일 + 컴팩트 바 (인라인) ── */

function TagTile({ tag, count, onClick }: { tag: string; count: number; onClick: () => void }) {
  const tones = listToneColors(tagHue(tag))
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-[10px] h-[70px] p-3 text-left active:scale-[0.97] transition-transform"
      style={{ backgroundColor: tones.bg }}
    >
      {/* '#' 워터마크 — 카드 이모지 워터마크와 동일 문법 */}
      <span
        className="absolute pointer-events-none select-none font-extrabold"
        style={{ fontSize: '64px', lineHeight: 1, opacity: 0.18, right: '2px', bottom: '-16px', color: tones.accent, transform: 'rotate(-8deg)' }}
        aria-hidden
      >
        #
      </span>
      <span className="relative z-[1] block text-[14px] font-extrabold text-stone-800 truncate" style={{ wordBreak: 'keep-all' }}>
        #{tag}
      </span>
      <span className="relative z-[1] block text-[10px] font-semibold mt-0.5" style={{ color: tones.accent }}>
        {count} lists
      </span>
    </button>
  )
}

function TagBar({ tag, count, onClose }: { tag: string; count?: number; onClose: () => void }) {
  const tones = listToneColors(tagHue(tag))
  return (
    <button
      type="button"
      onClick={onClose}
      className="mx-6 w-[calc(100%-3rem)] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between active:scale-[0.98] transition-transform"
      style={{ backgroundColor: tones.bg, boxShadow: '0 4px 12px -5px rgba(0,0,0,0.18)' }}
    >
      <span className="flex items-baseline gap-2">
        <span className="text-[14px] font-extrabold text-stone-800">#{tag}</span>
        {count != null && (
          <span className="text-[10px] font-semibold" style={{ color: tones.accent }}>
            {count} lists · 인기순
          </span>
        )}
      </span>
      <span className="w-[22px] h-[22px] rounded-full bg-stone-800/80 flex items-center justify-center">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>close</span>
      </span>
    </button>
  )
}

/* ── 구독 가능한 피드 행 (내부 컴포넌트) ── */

function SubscribedFeedRow({
  list,
  onClick,
  showNotice,
  requireAuth,
}: {
  list: SaList
  onClick: () => void
  showNotice: (msg: string, undo?: () => Promise<void>) => void
  requireAuth: () => boolean
}) {
  const { subscribed, toggling, toggle } = useSubscription(list.id)
  const [subscriberCount, setSubscriberCount] = useState(list.subscriber_count)

  useEffect(() => {
    setSubscriberCount(list.subscriber_count)
  }, [list.subscriber_count])

  const handleSubscribe = useCallback(async () => {
    if (!requireAuth()) return
    const wasSubscribed = subscribed
    const result = await toggle()
    if (result === 'need_auth') return
    setSubscriberCount((count) => Math.max(0, count + (result ? 1 : -1)))
    if (wasSubscribed) {
      showNotice(`${list.title} 구독해지`, async () => {
        const undoResult = await toggle()
        if (undoResult !== 'need_auth') {
          setSubscriberCount((count) => Math.max(0, count + (undoResult ? 1 : -1)))
        }
      })
    } else {
      showNotice(`${list.title} 구독완료!`)
    }
  }, [requireAuth, subscribed, toggle, list.title, showNotice])

  const displayList = useMemo(
    () => ({ ...list, subscriber_count: subscriberCount }),
    [list, subscriberCount]
  )

  return (
    <SaListFeedRow
      list={displayList}
      onClick={onClick}
      showSubscribe
      subscribed={subscribed}
      subscribing={toggling}
      onSubscribe={handleSubscribe}
    />
  )
}
