/**
 * SA-리스트 상세 — 스크랩북 리디자인 (2026-06)
 * cover_hue 파스텔 곡선 헤더 + 이모지 워터마크 + 글래스 칩 액션 + 스크랩북 장소 카드
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
import DataState from '@/components/ui/data-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import BottomNav from '@/components/bottom-nav'
import { CurveEdge } from '@/components/ui/curve-header'
import { SaveFlow } from '@/components/features/save-flow'
import { ListManageSheet } from '@/components/features/list-manage-sheet'
import ConfirmModal from '@/components/ui/confirm-modal'
import { useLoginPrompt } from '@/hooks/use-login-prompt'
import LoginPromptModal from '@/components/ui/login-prompt-modal'
import { CREATOR_LINK_PREFIXES } from '@/constants/content'
import { SOCIAL_ICON_MAP } from '@/components/svg/social-icons'
import { listToneColors } from '@/lib/utils'
import type { ListItem } from '@/types'

const MAX_MEMO_LENGTH = 100

/** 글래스 칩 공통 클래스 — 구독·공유·공개·SNS 전부 동일 문법 */
const CHIP_CLS =
  'h-6 px-2.5 rounded-full bg-white/55 border-[0.5px] border-white/90 inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 transition-transform active:scale-95'

export default function SaListDetailClient() {
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  const { data: list, loading: listLoading, error: listError, refresh: refreshList } = useList(listId)
  const { data: items, loading: itemsLoading, error: itemsError, refresh: refreshItems } = useListItems(listId)
  const { isSaved, batchCheckSaved, getSavedListIds } = useSavePlace()
  const { subscribed, toggling: subscribing, toggle: toggleSubscribe } = useSubscription(listId)
  const { user } = useAuth()
  const { showError, showNotice } = useToast()
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt()

  // resolvedListId — slug URL 지원을 위해
  const resolvedListId = list?.id || ''

  const isMine = list?.owner_id === user?.id
  const isDefault = list?.type === 'default'
  const isAdmin = user?.id === ADMIN_USER_ID
  const [subscriberCount, setSubscriberCount] = useState(0)

  // hue 4톤 — 헤더·편집 UI 색은 전부 cover_hue 파생
  const tones = listToneColors(isDefault ? null : list?.cover_hue)
  const headerBg = isDefault ? '#ffffff' : tones.bg

  // ListManageSheet (편집/공개설정/삭제)
  const [showManageSheet, setShowManageSheet] = useState(false)
  const [manageInitialView, setManageInitialView] = useState<'menu' | 'visibility' | 'edit'>('menu')

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

  useEffect(() => {
    if (!list) return
    setSubscriberCount(list.subscriber_count)
  }, [list])

  // 메모 편집
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')

  // 리스트에서 장소 제거 확인 모달
  const [removeConfirmPlaceId, setRemoveConfirmPlaceId] = useState<string | null>(null)

  // ── 순서 변경 (owner 드래그) — 로그 페이지 라이브 리오더 패턴 ──
  const [localItems, setLocalItems] = useState<ListItem[]>([])
  const localItemsRef = useRef<ListItem[]>([])
  const dragInfo = useRef<{ idx: number; x: number; y: number; moved: boolean } | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setLocalItems(items)
    localItemsRef.current = items
  }, [items])

  const gripPointerDown = (i: number) => (e: React.PointerEvent) => {
    if (!isMine) return
    dragInfo.current = { idx: i, x: e.clientX, y: e.clientY, moved: false }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
    setDragIdx(i)
  }
  const gripPointerMove = (e: React.PointerEvent) => {
    const info = dragInfo.current; if (!info) return
    if (!info.moved && (Math.abs(e.clientY - info.y) > 6 || Math.abs(e.clientX - info.x) > 6)) info.moved = true
    if (!info.moved) return
    setDragPos({ x: e.clientX, y: e.clientY })
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-srow]') as HTMLElement | null
    let target = el ? Number(el.dataset.srow) : null
    if (target == null) {
      const last = document.querySelector(`[data-srow="${localItemsRef.current.length - 1}"]`)
      if (last && e.clientY > last.getBoundingClientRect().bottom) target = localItemsRef.current.length - 1
    }
    // 손가락 위 행으로 즉시 이동 (라이브 리오더)
    if (target != null && target !== info.idx) {
      const from = info.idx
      setLocalItems((prev) => {
        const arr = [...prev]
        const [it] = arr.splice(from, 1)
        arr.splice(target as number, 0, it)
        localItemsRef.current = arr
        return arr
      })
      info.idx = target
      setDragIdx(target)
    }
  }
  const gripPointerUp = (e: React.PointerEvent) => {
    const info = dragInfo.current
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
    dragInfo.current = null
    setDragIdx(null)
    setDragPos(null)
    if (info?.moved) {
      // 새 순서 저장 (실패 시 서버 순서로 복원)
      listsService
        .reorderListItems(resolvedListId || listId, localItemsRef.current.map((it) => it.id))
        .catch(() => { showError('순서 저장에 실패했어요'); refreshItems() })
    }
  }

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

  // 장소 제거 (다중 리스트 포함 시 확인 모달)
  const handleRemoveFromList = useCallback((placeId: string) => {
    const savedListIds = getSavedListIds(placeId)
    const otherLists = savedListIds.filter(id => id !== resolvedListId && id !== listId)

    if (otherLists.length > 0) {
      setRemoveConfirmPlaceId(placeId)
    } else {
      handleRemovePlace(placeId)
    }
  }, [getSavedListIds, resolvedListId, listId, handleRemovePlace])

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
      await listsService.toggleAdminFeatured(list.id)
      refreshList()
    } catch {
      showError('추천 상태 변경에 실패했어요')
    }
  }, [list, refreshList, showError])

  const handleToggleSubscribe = useCallback(async () => {
    if (!list) return
    const result = await toggleSubscribe()
    if (result === 'need_auth') {
      requireAuth()
      return
    }

    setSubscriberCount((count) => Math.max(0, count + (result ? 1 : -1)))
    refreshList()

    if (!result) {
      showNotice(`${list.title} 구독해지`, async () => {
        const undoResult = await toggleSubscribe()
        if (undoResult !== 'need_auth') {
          setSubscriberCount((count) => Math.max(0, count + (undoResult ? 1 : -1)))
          refreshList()
        }
      })
    } else {
      showNotice(`${list.title} 구독완료!`)
    }
  }, [list, toggleSubscribe, requireAuth, refreshList, showNotice])

  // 편집 시트 열기 (제목 연필·SNS 연결 칩 공용 진입점)
  const openEditSheet = useCallback(() => {
    setManageInitialView('edit')
    setShowManageSheet(true)
  }, [])

  // 업데이트일 "M월 D일" 표기 (owner 메타 줄)
  const updatedLabel = list?.updated_at
    ? `${new Date(list.updated_at).getMonth() + 1}월 ${new Date(list.updated_at).getDate()}일`
    : null

  return (
    <SaveFlow>
      {(handleSaveFlowToggle) => (
    <div className="relative min-h-dvh pb-24 bath-tile-bg overflow-hidden">
      <DataState loading={listLoading} error={listError} isEmpty={!list}>
        {list && (<>

      {/* ── 컬러 존 — 플로우 컨테이너 (내용 높이에 맞춰 늘어나고 곡선이 아래로 따라옴, v5) ── */}
      <div className="relative" style={{ backgroundColor: headerBg, paddingBottom: '2px' }}>

      {/* 이모지 워터마크 — 존 상단 우측 엠블럼 (존 안에 완전히 포함, 아래로 안 흘러내림) */}
      <span
        className="absolute z-0 pointer-events-none select-none"
        style={{
          fontSize: '92px',
          lineHeight: 1,
          opacity: isDefault ? 0.14 : 0.26,
          right: '-10px',
          top: '44px',
          transform: 'rotate(-8deg)',
        }}
        aria-hidden
      >
        {isDefault ? '♨️' : (list.cover_emoji || '🧖')}
      </span>

      {/* ── 네비 — 좌: 뒤로 / 우: 공개 pill(owner) · star(admin) · more(owner) ── */}
      <div className="relative z-10 flex justify-between items-center px-4 pt-8">
        <button onClick={() => router.back()} className="p-1">
          <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>arrow_back</span>
        </button>
        <div className="flex gap-1 items-center">
          {isMine && !isDefault && (
            <button
              onClick={() => { setManageInitialView('visibility'); setShowManageSheet(true) }}
              className={CHIP_CLS}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#57534e' }}>
                {list.visibility === 'public' ? 'public' : list.visibility === 'unlisted' ? 'link' : 'lock'}
              </span>
              {list.visibility === 'public' ? '공개' : list.visibility === 'unlisted' ? '링크 공유' : '비공개'}
              <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#a8a29e' }}>expand_more</span>
            </button>
          )}
          {isAdmin && !isDefault && (
            <button onClick={handleToggleFeatured} className="p-1">
              <span
                className="material-symbols-outlined text-stone-600"
                style={{ fontSize: '22px', fontVariationSettings: list.is_featured ? "'FILL' 1" : "'FILL' 0" }}
              >star</span>
            </button>
          )}
          {isMine && !isDefault && (
            <button onClick={() => { setManageInitialView('menu'); setShowManageSheet(true) }} className="p-1">
              <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>more_vert</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 헤더 콘텐츠 — 단일 잉크색 제목 + 설명 + 메타 + 칩 줄 ── */}
      <div className="relative z-[3] px-6 pt-4">
        <h1 className="text-[25px] font-extrabold leading-tight text-stone-800" style={{ wordBreak: 'keep-all' }}>
          {isDefault ? 'MY SA-LIST' : list.title}
          {isMine && !isDefault && (
            <button onClick={openEditSheet} className="ml-1.5 align-baseline p-0.5" aria-label="리스트 편집">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: tones.accent }}>edit</span>
            </button>
          )}
        </h1>
        {list.description && (
          <p className="text-xs leading-relaxed text-stone-600 mt-2.5 max-w-[94%]">{list.description}</p>
        )}

        {/* 메타 줄 — visitor: @닉 · 구독 · 곳수 / owner: 구독 · 곳수 · 업데이트 (v5) */}
        <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-semibold text-stone-600 flex-wrap">
          <span
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] flex-shrink-0 bg-white"
            style={{ border: `1.5px solid ${tones.accentSoft}` }}
          >
            {list.owner_profile_emoji || '🧖'}
          </span>
          {!isMine && <span className="truncate max-w-[120px]">@{list.owner_nickname || 'USER'}</span>}
          <span>{!isMine ? '· ' : ''}구독 {subscriberCount}</span>
          <span>· {list.place_count}곳</span>
          {isMine && updatedLabel && <span>· 업데이트 {updatedLabel}</span>}
        </div>

        {/* 태그 */}
        {list.tags && list.tags.length > 0 && (
          <div className="flex gap-1 mt-2.5 flex-wrap">
            {list.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/40" style={{ color: tones.accent }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* SNS 칩 줄 */}
        {(!isDefault && (
          (list.creator_links && Object.keys(list.creator_links).length > 0) || isMine
        )) && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {list.creator_links && Object.entries(list.creator_links).map(([platform, username]) => {
              const Icon = SOCIAL_ICON_MAP[platform]
              const prefix = CREATOR_LINK_PREFIXES[platform]
              if (!Icon || !prefix || !username) return null
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => window.open(`${prefix}${username}`, '_blank')}
                  className={CHIP_CLS}
                >
                  <Icon size={11} />
                  {platform === 'instagram' ? 'Instagram' : platform === 'naver_blog' ? 'Blog' : 'Threads'}
                </button>
              )
            })}
            {isMine && (!list.creator_links || Object.keys(list.creator_links).length === 0) && (
              <button type="button" onClick={openEditSheet} className={CHIP_CLS} style={{ borderStyle: 'dashed', color: tones.accentSoft }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>add</span>
                SNS 연결
              </button>
            )}
          </div>
        )}

        {/* 액션 칩 줄 — visitor: 구독+공유 / owner: 공유만 (구독자수는 메타 줄, v5) */}
        <div className="flex gap-1.5 mt-2.5">
          {!isMine && !isDefault && (
            <button
              onClick={handleToggleSubscribe}
              disabled={subscribing}
              className={`${CHIP_CLS} disabled:opacity-50 ${subscribed ? '!bg-white !text-[color:var(--color-primary)]' : ''}`}
            >
              {subscribed ? (
                <><span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'inherit', fontVariationSettings: "'FILL' 1" }}>check</span>구독중</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '12px' }}>bookmark_add</span>리스트 구독</>
              )}
            </button>
          )}
          {list.visibility !== 'private' && (
            <button onClick={handleShare} className={CHIP_CLS}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>share</span>
              공유
            </button>
          )}
        </div>
      </div>
      {/* 컬러 존 끝 */}
      </div>

      {/* 곡선 에지 — 존 아래 플로우 (v5) */}
      <CurveEdge color={headerBg} />

      {/* ── THE LIST — 스크랩북 장소 카드 ── */}
      <main className="relative z-[2] px-5">
        <div className="flex justify-end pt-3 pb-2 pr-1 text-[10px] text-stone-400 font-semibold">
          {localItems.length}곳 · {isMine ? '잡고 끌어 순서 변경' : '큐레이터 순서'}
        </div>

        <DataState
          loading={itemsLoading}
          error={itemsError}
          isEmpty={localItems.length === 0}
          emptyIcon="location_off"
          emptyMessage={isMine ? '아직 장소가 없어요. 아래 버튼으로 추가해보세요!' : '아직 장소가 없어요'}
        >
          <div className="space-y-3">
            {localItems.map((item, idx) => {
              if (!item.place) return null
              const place = item.place
              const editing = editingMemoId === item.place_id
              return (
                <div
                  key={item.id}
                  data-srow={idx}
                  className={`relative rounded-lg p-3.5 transition-opacity ${dragIdx === idx ? 'opacity-40' : ''}`}
                  style={{
                    backgroundColor: '#fdfcfa',
                    boxShadow: '0 4px 14px -4px rgba(38,33,33,0.16)',
                    transform: `rotate(${idx % 2 === 0 ? -1.2 : 1}deg)`,
                  }}
                >
                  {/* 시설명 + 우측 액션 — 긴 이름은 자연 줄바꿈, 동네는 항상 둘째 줄 */}
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/explore/${place.id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-[13.5px] font-extrabold text-stone-800 leading-snug" style={{ wordBreak: 'keep-all' }}>
                        {place.name}
                      </p>
                      <p className="text-[10px] font-semibold text-stone-400 mt-0.5 truncate">
                        {place.short_address || place.address}
                      </p>
                    </button>

                    {isMine ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* 제거 */}
                        <button onClick={() => handleRemoveFromList(place.id)} className="p-1" aria-label="리스트에서 제거">
                          <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '16px' }}>close</span>
                        </button>
                        {/* 순서 변경 그립 (포인터 드래그, 로그 페이지 패턴) */}
                        <span
                          onPointerDown={gripPointerDown(idx)}
                          onPointerMove={gripPointerMove}
                          onPointerUp={gripPointerUp}
                          className="w-7 h-7 flex flex-col items-center justify-center gap-[3px] cursor-grab touch-none select-none"
                          title="끌어서 순서 변경"
                        >
                          {[0, 1, 2].map((r) => (
                            <span key={r} className="flex gap-[3px]">
                              <span className="w-[3px] h-[3px] rounded-full bg-stone-300" />
                              <span className="w-[3px] h-[3px] rounded-full bg-stone-300" />
                            </span>
                          ))}
                        </span>
                      </div>
                    ) : (
                      /* 방문자: 시설 저장 (인스타식 save_place, place-card와 동일 문법) */
                      user && (
                        <button onClick={() => handleSaveFlowToggle(place.id)} className="p-1 flex-shrink-0" aria-label="시설 저장">
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '19px',
                              color: isSaved(place.id) ? 'var(--color-primary)' : 'var(--color-icon-inactive)',
                              fontVariationSettings: isSaved(place.id) ? "'FILL' 1" : "'FILL' 0",
                            }}
                          >
                            bookmark_heart
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  {/* 큐레이터 메모 */}
                  {editing ? (
                    <div className="mt-2 flex gap-1.5 items-center rounded-[9px] px-2.5 py-2" style={{ backgroundColor: tones.tint }}>
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value.slice(0, MAX_MEMO_LENGTH))}
                        placeholder="장소에 대한 메모 (최대 100자)"
                        autoFocus
                        className="flex-1 bg-transparent text-[11.5px] text-stone-700 outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMemo(item.place_id) }}
                      />
                      <button
                        onClick={() => handleSaveMemo(item.place_id)}
                        className="text-[10.5px] font-bold flex-shrink-0"
                        style={{ color: tones.accent }}
                      >저장</button>
                      <button
                        onClick={() => { setEditingMemoId(null); setMemoText('') }}
                        className="text-[10.5px] text-stone-400 flex-shrink-0"
                      >취소</button>
                    </div>
                  ) : isMine ? (
                    item.memo ? (
                      <button
                        type="button"
                        onClick={() => { setMemoText(item.memo || ''); setEditingMemoId(item.place_id) }}
                        className="mt-2 w-full flex items-start gap-1.5 rounded-[9px] px-2.5 py-2 text-left"
                        style={{ backgroundColor: tones.tint }}
                      >
                        <span className="flex-1 text-[11.5px] leading-relaxed text-stone-600">{item.memo}</span>
                        <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '13px', color: tones.accent }}>edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setMemoText(''); setEditingMemoId(item.place_id) }}
                        className="mt-2 w-full flex items-center gap-1.5 rounded-[9px] px-2.5 py-2 text-left"
                        style={{ backgroundColor: tones.tint }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: tones.accentSoft }}>edit</span>
                        <span className="text-[11px]" style={{ color: tones.accentSoft }}>메모를 남기면 구독자에게 보여요</span>
                      </button>
                    )
                  ) : (
                    item.memo && (
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-stone-600">{item.memo}</p>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </DataState>

        {/* 장소 추가 — 틴트 슬롯 버튼 (로그 슬롯 버튼 문법) */}
        {isMine && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="mt-3 w-full h-11 rounded-xl flex items-center justify-center gap-1 text-[12.5px] font-bold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: tones.tint, color: tones.accent }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>add_location_alt</span>
            장소 추가
          </button>
        )}
      </main>

        </>)}
      </DataState>

      {/* 드래그 고스트 — 손가락 따라오는 미니 라벨 */}
      {dragIdx != null && dragPos && localItems[dragIdx]?.place && (
        <div className="fixed z-50 pointer-events-none" style={{ left: dragPos.x, top: dragPos.y, transform: 'translate(-50%,-50%) scale(1.05)' }}>
          <div className="px-3 py-1.5 rounded-full bg-white shadow-lg text-[11px] font-bold text-stone-700 whitespace-nowrap">
            {localItems[dragIdx].place!.name}
          </div>
        </div>
      )}

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
