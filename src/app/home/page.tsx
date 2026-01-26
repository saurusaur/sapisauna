'use client'

import { MESSAGES, BUTTONS, NAV, ICONS } from '@/constants/content'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{MESSAGES.HOME.GREETING('사우너')}</h1>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {/* 빈 상태 */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 mb-4">{MESSAGES.HOME.NO_RECORDS}</p>
          <button className="py-3 px-6 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors">
            {BUTTONS.ADD_RECORD}
          </button>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-3">
          <button className="flex flex-col items-center text-red-500">
            <span className="material-symbols-outlined">{ICONS.HOME}</span>
            <span className="text-xs mt-1">{NAV.HOME}</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="material-symbols-outlined">{ICONS.HISTORY}</span>
            <span className="text-xs mt-1">{NAV.HISTORY}</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="material-symbols-outlined">{ICONS.SETTINGS}</span>
            <span className="text-xs mt-1">{NAV.SETTINGS}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
