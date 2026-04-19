/**
 * CoverCard — SA-리스트 커버카드 (VIS 9-2)
 *
 * 리스트 프리뷰 카드. 피드/검색에서 사용.
 * 커버 hue 악센트 바 + 타이틀 + 설명 + 구독/공유
 */

'use client'

import { useCallback } from 'react'
import type { SaList } from '@/types'
import { useToast } from '@/contexts/toast-context'
import { shareList } from '@/lib/share'
import { listCoverHex } from '@/lib/utils'

interface CoverCardProps {
  list: SaList
  onClick: () => void
  isMine?: boolean
  /** 구독 상태 (타인 리스트만) */
  subscribed?: boolean
  subscribing?: boolean
  onToggleSubscribe?: () => void
  /** 공개/비공개 토글 (내 리스트만) */
  onTogglePublic?: () => void
  /** 3-dot 메뉴 (편집/삭제 or 신고) */
  onMenu?: () => void
}

export default function CoverCard({
  list,
  onClick,
  isMine = false,
  subscribed = false,
  subscribing = false,
  onToggleSubscribe,
  onTogglePublic,
  onMenu,
}: CoverCardProps) {
  const { showError } = useToast()
  const accentColor = list.cover_hue != null
    ? listCoverHex(list.cover_hue)
    : list.type === 'default' ? 'var(--color-primary)'
      : list.visibility === 'public' ? '#292524'
      : list.visibility === 'unlisted' ? '#78716c'
      : '#a8a29e'
  const isDefault = list.type === 'default'
  const canShare = list.visibility !== 'private'

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await shareList(list)
    if (result !== true) showError(result)
  }, [list, showError])

  return (
    <div
      onClick={onClick}
      className="glass-card-light overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex">
        {/* 좌측 악센트 바 */}
        <div
          className="w-1 flex-shrink-0 rounded-l-xl"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex-1 p-3">
          {/* Row 1: 타이틀 + 공개배지 + 3-dot */}
          <div className="flex items-center gap-2">
            {isDefault && (
              <span
                className="material-symbols-outlined text-sm"
                style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
              >bookmark_heart</span>
            )}
            <span className="font-medium text-sm text-stone-700 truncate flex-1">
              {isDefault ? 'MY SA-LIST' : list.title}
            </span>

            {/* visibility 배지 (내 리스트만, 기본 저장 제외) */}
            {isMine && !isDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePublic?.()
                }}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
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

            {/* 큐레이션 배지 */}
            {list.is_featured && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >추천</span>
            )}

            {/* 3-dot 메뉴 */}
            {onMenu && !isDefault && (
              <button
                onClick={(e) => { e.stopPropagation(); onMenu() }}
                className="text-stone-400 hover:text-stone-600 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-lg">more_vert</span>
              </button>
            )}
          </div>

          {/* Row 2: @username · 장소 N개 */}
          <p className="text-xs text-stone-400 mt-0.5">
            {list.owner_nickname && (
              <span className="text-stone-500">@{list.owner_nickname} · </span>
            )}
            장소 {list.place_count}개
          </p>

          {/* Row 3: 설명 메모 (없으면 생략) */}
          {list.description && (
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">
              {list.description}
            </p>
          )}

          {/* Row 4: 구독 버튼 + 공유 */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100">
            {/* 구독 버튼 */}
            {!isMine && onToggleSubscribe ? (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSubscribe() }}
                disabled={subscribing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                  subscribed
                    ? 'text-white'
                    : 'glass-input text-stone-500 hover:text-stone-700'
                }`}
                style={subscribed ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', fontVariationSettings: subscribed ? "'FILL' 1" : "'FILL' 0" }}
                >bookmark_add</span>
                {subscribed ? '구독중' : '구독'}
                <span className="text-[10px] opacity-70">{list.subscriber_count}명</span>
              </button>
            ) : (
              <span className="text-xs text-stone-400">
                {list.subscriber_count > 0 && `구독 ${list.subscriber_count}명`}
              </span>
            )}

            {/* 공유 (비공개가 아닐 때만) */}
            {canShare && (
              <button
                onClick={handleShare}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
