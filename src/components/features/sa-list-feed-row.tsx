'use client'

/**
 * 사-리스트 피드 세로 리스트 행 — 커버 색 썸네일 + 메타 + 구독
 * accent bar 제거, glass-card-light 스타일, 유저네임 대문자
 */

import type { SaList } from '@/types'
import { listBgColor } from '@/lib/utils'

interface SaListFeedRowProps {
  list: SaList
  onClick: () => void
  /** @표시용 닉네임(내 리스트는 프로필 닉네임 주입) */
  displayHandle?: string | null
  isMine?: boolean
  isDefault?: boolean
  onMenu?: () => void
  subscribed?: boolean
  subscribing?: boolean
  onSubscribe?: () => void
  /** 타인 리스트에서만 구독 버튼 */
  showSubscribe?: boolean
}

export default function SaListFeedRow({
  list,
  onClick,
  displayHandle,
  isMine = false,
  isDefault = false,
  onMenu,
  subscribed = false,
  subscribing = false,
  onSubscribe,
  showSubscribe = false,
}: SaListFeedRowProps) {
  const thumbBg = listBgColor(list.cover_hue)
  const title = isDefault ? 'MY SA-LIST' : list.title
  const handleText = displayHandle?.trim()
    ? displayHandle.trim().toUpperCase()
    : list.owner_nickname
      ? list.owner_nickname.toUpperCase()
      : null
  const handlePart = handleText ? `@${handleText}` : null
  const metaLine = [handlePart, `${list.place_count}곳`, `구독 ${list.subscriber_count}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.99] transition-transform cursor-pointer glass-card-light"
      style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}
    >
      {/* 이모지+배경색 썸네일 */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: thumbBg }}
      >
        {isDefault ? (
          <span className="text-[22px] leading-none" aria-hidden>♨️</span>
        ) : list.cover_emoji ? (
          <span className="text-[22px] leading-none" aria-hidden>{list.cover_emoji}</span>
        ) : (
          <span className="material-symbols-outlined text-white/80" style={{ fontSize: '22px' }}>
            playlist_play
          </span>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-stone-800 truncate">{title}</p>
          {isMine && onMenu && !isDefault && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMenu() }}
              className="text-stone-400 hover:text-stone-600 flex-shrink-0 p-0.5 -mr-1"
              aria-label="메뉴"
            >
              <span className="material-symbols-outlined text-lg">more_vert</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5 truncate uppercase tracking-wide">{metaLine}</p>
      </div>

      {/* 구독 버튼 */}
      {showSubscribe && onSubscribe && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSubscribe() }}
          disabled={subscribing}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
          style={
            subscribed
              ? { backgroundColor: '#e7e5e4', color: '#57534e' }
              : { backgroundColor: 'var(--color-primary)', color: '#fff' }
          }
        >
          {subscribed ? '구독중' : '구독'}
        </button>
      )}
    </div>
  )
}
