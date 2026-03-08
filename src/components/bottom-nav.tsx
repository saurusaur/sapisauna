'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NAV, ICONS, MESSAGES } from '@/constants/content'

// 4탭 + center raised 구성
const LEFT_TABS = [
  { label: NAV.HOME, icon: ICONS.HOME, path: '/home' },
  { label: NAV.SA_LIST, icon: ICONS.SA_LIST, path: null, disabled: true },
] as const

const RIGHT_TABS = [
  { label: NAV.EXPLORE, icon: ICONS.EXPLORE, path: '/explore' },
  { label: NAV.MY, icon: ICONS.MY, path: '/settings' },
] as const

interface BottomNavProps {
  showTooltip?: boolean
}

export default function BottomNav({ showTooltip = false }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const renderTab = (item: { label: string; icon: string; path: string | null; disabled?: boolean }) => {
    const isActive = item.path ? pathname === item.path : false
    const isDisabled = item.disabled

    return (
      <button
        key={item.label}
        onClick={() => {
          if (isDisabled || !item.path) return
          if (!isActive) router.push(item.path)
        }}
        className={`flex flex-col items-center min-w-[48px] ${
          isDisabled
            ? 'opacity-20 cursor-default'
            : isActive
              ? ''
              : 'text-stone-400 hover:text-stone-600'
        }`}
        style={isActive && !isDisabled ? { color: 'var(--color-green)' } : {}}
      >
        <span className="material-symbols-outlined">{item.icon}</span>
        <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
      </button>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200 z-50">
      <div className="flex items-end justify-around py-2 max-w-md mx-auto relative">
        {/* 좌측 탭들 */}
        {LEFT_TABS.map(renderTab)}

        {/* Center raised: + 기록 버튼 */}
        <div className="flex flex-col items-center relative -mt-7">
          {/* 말풍선 tooltip */}
          {showTooltip && (
            <div className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div
                className="px-3 py-1.5 rounded-lg text-white text-[11px] font-medium shadow-md relative"
                style={{ backgroundColor: 'var(--color-green)' }}
              >
                {MESSAGES.HOME.TOOLTIP_CTA}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                  style={{ backgroundColor: 'var(--color-green)' }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/place')}
            className="flex items-center gap-1 px-6 py-3 rounded-full text-white font-semibold shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95 border-4 border-white"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span className="text-sm">{NAV.ADD_RECORD}</span>
          </button>
        </div>

        {/* 우측 탭들 */}
        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  )
}
