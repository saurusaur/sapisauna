/**
 * 앱 내 확인 모달
 * 시스템 confirm() 대신 사용 — PWA 환경에 적합
 */
interface ConfirmModalProps {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* 모달 본체 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[280px] p-6">
        <p className="text-sm text-stone-700 text-center mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-orange)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
