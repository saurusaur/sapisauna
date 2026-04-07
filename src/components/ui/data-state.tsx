/**
 * 공용 데이터 상태 래퍼 — Loading / Error / Empty 처리
 */

import { captureError } from '@/lib/error-logger'

interface DataStateProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
  emptyIcon?: string
  emptyMessage?: string
  children?: React.ReactNode
}

export default function DataState({
  loading,
  error,
  isEmpty,
  emptyIcon = 'inbox',
  emptyMessage = '데이터가 없습니다',
  children,
}: DataStateProps) {
  // Loading
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">
          progress_activity
        </span>
      </div>
    )
  }

  // Error
  if (error) {
    const dbPatterns = /column|relation|violates|does not exist|PGRST|constraint/i
    const displayMessage = dbPatterns.test(error)
      ? '데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
      : error
    captureError(error, { label: 'DataState 에러' })
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: 'var(--color-accent)' }}>
          error
        </span>
        <p className="text-stone-500 text-sm">{displayMessage}</p>
      </div>
    )
  }

  // Empty
  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-4xl text-stone-300 mb-3 block">
          {emptyIcon}
        </span>
        <p className="text-stone-400 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
