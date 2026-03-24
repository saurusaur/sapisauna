/**
 * 리치 스낵바 — 장소 저장 시 리스트 옵션 표시 (5초, 인터랙션 중 일시중지)
 *
 * 추가 모드: 기본 저장됨 + 다른 리스트 빠른 추가
 * ··· 탭 시 SaveBottomSheet 열기 (onShowMore)
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { SaList } from '@/types'

const DISMISS_MS = 5000

interface SnackbarProps {
  visible: boolean
  onDismiss: () => void
  /** 해당 장소가 들어있는 리스트 ID 목록 */
  savedListIds: string[]
  /** 유저의 전체 리스트 (default 제외, 최근 사용순) */
  userLists: SaList[]
  /** 리스트 토글 콜백 */
  onToggleList: (listId: string) => void
  /** ··· 또는 "새로" 탭 → SaveBottomSheet 열기 */
  onShowMore: () => void
  /** 메모 버튼 탭 → 메모 입력 시트 열기 */
  onMemo?: () => void
}

export function SaveSnackbar({
  visible,
  onDismiss,
  savedListIds,
  userLists,
  onToggleList,
  onShowMore,
  onMemo,
}: SnackbarProps) {
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef(DISMISS_MS)
  const startTimeRef = useRef(0)
  // ref로 감싸 최신 참조 유지 — 부모가 useCallback 안 써도 타이머 리셋 방지
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  // 타이머 시작
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      setShow(false)
      dismissRef.current()
    }, remainingRef.current)
  }, [])

  // 타이머 일시중지
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      const elapsed = Date.now() - startTimeRef.current
      remainingRef.current = Math.max(0, remainingRef.current - elapsed)
    }
  }, [])

  useEffect(() => {
    if (visible) {
      setShow(true)
      remainingRef.current = DISMISS_MS
      startTimer()
    } else {
      setShow(false)
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, startTimer])

  if (!show) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 animate-intro-up"
      onTouchStart={pauseTimer}
      onTouchEnd={startTimer}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      <div className="bg-stone-800 text-white rounded-xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 text-sm">
          <span className="material-symbols-rounded text-base text-green-400">check</span>
          <span className="font-medium flex-1">MY SA-LIST에 저장됨</span>
          {onMemo && (
            <button
              onClick={onMemo}
              className="text-xs text-white/70 hover:text-white whitespace-nowrap"
            >메모 추가</button>
          )}
          <button
            onClick={onShowMore}
            className="text-xs text-white/70 hover:text-white whitespace-nowrap"
          >새 리스트</button>
        </div>
      </div>
    </div>
  )
}
