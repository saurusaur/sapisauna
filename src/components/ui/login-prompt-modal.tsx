/**
 * 로그인 유도 모달 — 비로그인 유저가 보호 기능 접근 시 표시
 * ConfirmModal과 동일한 스타일 (overlay + 300px 카드)
 */

'use client'

import { useRouter, usePathname } from 'next/navigation'

interface LoginPromptModalProps {
  open: boolean
  onClose: () => void
}

export default function LoginPromptModal({ open, onClose }: LoginPromptModalProps) {
  const router = useRouter()
  const pathname = usePathname()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 본체 */}
      <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full max-w-[300px] p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <h2 className="text-xl font-extrabold italic font-heading mb-2">
            WELCOME{' '}
            <span style={{ color: 'var(--color-primary)' }}>SA-PIEN</span>
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            사-피엔스 전용 기능이에요.
            <br />
            지금 바로 사-피 합류하기!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            나중에
          </button>
          <button
            onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.96] active:brightness-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            3초 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
