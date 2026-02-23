'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP } from '@/constants/content'

// 완료 화면에서 필요한 최소 필드
type SavedLog = {
  display_id?: string
  place_name: string
  tribe_id: 'bather' | 'saunner' | 'jimi'
  created_at?: string
  deep_log?: { [key: string]: unknown }
}

export default function Complete() {
  const router = useRouter()
  const [log, setLog] = useState<SavedLog | null>(null)

  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    if (logData) {
      setLog(JSON.parse(logData))
      // 기록 흐름 종료 — localStorage 정리
      localStorage.removeItem('currentLog')
      localStorage.removeItem('selectedPlace')
    } else {
      // 새로고침 등으로 데이터 없이 진입 → 홈으로 리다이렉트
      router.replace('/home')
      return
    }

    // 뒤로가기 차단: 히스토리에 현재 페이지를 한 번 더 push한 뒤,
    // popstate 발생 시(뒤로가기) 홈으로 리다이렉트
    window.history.pushState(null, '', '/complete')
    const handlePopState = () => {
      router.replace('/home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router])

  const emoji = log ? TRIBE_EMOJI_MAP[log.tribe_id] ?? '🛁' : '🛁'

  const dateStr = log?.created_at
    ? new Date(log.created_at).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : ''

  const hasDeepLog = Boolean(log?.deep_log)

  // 데이터 없으면 리다이렉트 중이므로 아무것도 렌더링하지 않음
  if (!log) return null

  return (
    <div className="min-h-screen bath-tile-bg flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">

        {/* 완료 이모지 */}
        <div className="text-6xl mb-5">{emoji}</div>

        {/* 완료 메시지 */}
        <h1 className="text-xl font-bold text-stone-700 mb-1.5">기록 완료!</h1>
        <p className="text-stone-500 text-sm mb-8">
          {log.place_name}
          {dateStr ? ` · ${dateStr}` : ''}
        </p>

        {/* 딥로그 추가 여부 표시 */}
        {hasDeepLog && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-6 -mt-4">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_note</span>
            상세 기록도 함께 저장됐어요
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push('/history')}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            내 기록 보기
          </button>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>

      </main>
    </div>
  )
}
