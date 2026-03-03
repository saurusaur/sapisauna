/**
 * 기록 완료 페이지
 * /complete
 *
 * 새 플로우:
 * 1. currentLog → savedLogs 배열에 저장
 * 2. currentLog + selectedPlace + sessionStorage 정리
 * 3. 컴포넌트 state에 보관 → 새로고침에도 UI 유지
 * 4. 새로고침 시 데이터 없으면 기본 완료 메시지 + 네비게이션 표시 (리다이렉트 안 함)
 */
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { insertLog, insertDeepLog, updateLog, saveOrUpdateDeepLog } from '@/lib/logs-service'

// sessionStorage 키 (에디터와 공유)
const EDITOR_STATE_KEY = 'story-editor-state'

type CompletedLog = {
  place_name: string
  tribe_id: 'bather' | 'saunner' | 'jimi'
  created_at?: string
  deep_log?: { [key: string]: unknown }
}

export default function Complete() {
  const router = useRouter()
  const [log, setLog] = useState<CompletedLog | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  // 새로고침 시에도 완료 UI는 보여줌
  const [showGeneric, setShowGeneric] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // React Strict Mode 이중 실행 방지
  const hasSaved = useRef(false)

  useEffect(() => {
    if (hasSaved.current) return
    const logData = localStorage.getItem('currentLog')
    if (logData) {
      const parsed = JSON.parse(logData)
      setLog(parsed)
      const editId = parsed._editId as string | undefined
      if (editId) setIsEditMode(true)
      hasSaved.current = true

      ;(async () => {
        try {
          if (editId) {
            // 편집 모드: UPDATE
            await updateLog(editId, parsed)
            if (parsed.deep_log) {
              await saveOrUpdateDeepLog(editId, parsed.deep_log)
            }
          } else {
            // 새 기록: INSERT
            const logId = await insertLog(parsed)
            if (parsed.deep_log) {
              await insertDeepLog(logId, parsed.deep_log)
            }
          }
          // 성공 시 정리: 기록 흐름 종료
          localStorage.removeItem('currentLog')
          localStorage.removeItem('selectedPlace')
          sessionStorage.removeItem(EDITOR_STATE_KEY)
        } catch (err) {
          hasSaved.current = false
          console.error('로그 저장 실패:', err)
          setError('저장에 실패했습니다. 다시 시도해주세요.')
        }
      })()
    } else {
      // 새로고침 등으로 데이터 없이 진입 → 기본 완료 메시지 표시
      setShowGeneric(true)
    }

    // 뒤로가기 차단
    window.history.pushState(null, '', '/complete')
    const handlePopState = () => {
      window.history.pushState(null, '', '/complete')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const emoji = log ? TRIBE_EMOJI_MAP[log.tribe_id] ?? '🛁' : '🛁'

  const dateStr = log?.created_at
    ? new Date(log.created_at).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : ''

  const hasDeepLog = Boolean(log?.deep_log)

  return (
    <div className="min-h-screen bath-tile-bg flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">

        {/* 완료 이모지 */}
        <div className="text-6xl mb-5">{emoji}</div>

        {/* 완료 메시지 */}
        <h1 className="text-xl font-bold text-stone-700 mb-1.5">{isEditMode ? '수정 완료!' : '기록 완료!'}</h1>

        {log ? (
          <p className="text-stone-500 text-sm mb-8">
            {log.place_name}
            {dateStr ? ` · ${dateStr}` : ''}
          </p>
        ) : showGeneric ? (
          <p className="text-stone-500 text-sm mb-8">
            기록이 저장되었습니다.
          </p>
        ) : null}

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl mb-4 -mt-4">
            {error}
            <button
              onClick={() => router.push('/complete')}
              className="ml-2 underline font-medium"
            >
              재시도
            </button>
          </div>
        )}

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
            onClick={() => router.push('/place')}
            className="w-full py-3.5 rounded-xl font-semibold border border-stone-200 text-stone-600 transition-all hover:bg-stone-50"
          >
            한 번 더 기록하기
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
