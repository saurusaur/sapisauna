/**
 * 앱 내 확인 모달
 * 시스템 confirm() 대신 사용 — PWA 환경에 적합
 *
 * 사용 모드:
 * 1. 기본 (message + 확인/취소): 기존 confirm 대체
 * 2. 커스텀 (children): 분기 모달 등 자유 레이아웃
 */
import type { ReactNode } from 'react'

interface ConfirmModalProps {
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel: () => void
  children?: ReactNode
}

export default function ConfirmModal({
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* 모달 본체 */}
      <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full max-w-[300px] p-6">
        {children ? (
          children
        ) : (
          <>
            <p className="text-sm text-stone-700 text-center mb-8 leading-relaxed whitespace-pre-line">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.96] active:brightness-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
