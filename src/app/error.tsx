'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="bath-tile-bg min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">♨️</div>
        <h2 className="text-lg font-semibold text-stone-700 mb-2">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          일시적인 오류입니다. 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="btn-primary"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="block text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}
