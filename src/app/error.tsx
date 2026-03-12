'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="bath-tile-bg min-h-dvh flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-8 max-w-sm w-full text-center">
        <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: 'var(--color-accent)' }}>
          error
        </span>
        <h2 className="text-lg font-semibold text-stone-700 mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-stone-500 mb-8">
          일시적인 오류입니다. 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all active:brightness-125"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          다시 시도
        </button>
        <a
          href="/"
          className="block text-sm text-stone-400 hover:text-stone-600 transition-colors mt-4"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}
