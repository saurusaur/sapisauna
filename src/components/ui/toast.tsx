/**
 * Toast 컴포넌트 — VIS 9-7 기준
 * error: primary-light BG + primary text, 4초
 * notice: stone-800 BG + white text + "되돌리기" 버튼 (optional), 5초
 * 위치: BottomNav 위 (bottom: 80px)
 */

'use client'

import { useToast } from '@/contexts/toast-context'

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-intro-up ${
            toast.type === 'error'
              ? 'bg-primary-light text-primary'
              : 'bg-stone-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex-1">{toast.message}</span>
            {toast.type === 'notice' && toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo?.()
                  dismiss(toast.id)
                }}
                className="text-white/80 hover:text-white font-semibold whitespace-nowrap"
              >
                되돌리기
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
