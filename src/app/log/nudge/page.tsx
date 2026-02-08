'use client'

import { useRouter } from 'next/navigation'

export default function DeepLogNudge() {
  const router = useRouter()

  return (
    <div className="min-h-screen bath-tile-bg flex flex-col items-center justify-center p-6">
      {/* 체크 아이콘 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--color-green-light)' }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-green)' }}>check</span>
      </div>

      <h1 className="text-2xl font-bold text-stone-700 mb-8">Quick Log 저장됨!</h1>

      {/* 넛지 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-stone-700 mb-3 text-center">
          더 자세한 기록을 남길까요?
        </h2>
        <p className="text-sm text-stone-500 text-center">
          오늘의 동행자, 비용, 혼잡도 등을 기록하고 장소 정보도 채워주세요! 🥚
        </p>
      </div>

      {/* 버튼들 */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => router.push('/log/deep')}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-orange)' }}
        >
          <span className="material-symbols-outlined">edit_note</span>
          Deep Log 쓰기
        </button>

        <button
          onClick={() => router.push('/complete')}
          className="w-full py-4 text-stone-500 hover:text-stone-700 transition-colors"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  )
}
