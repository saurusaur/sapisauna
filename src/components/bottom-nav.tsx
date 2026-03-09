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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass 배경 — 떠있는 느낌의 깊은 그림자 */}
      <div className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: 'hsl(var(--glass))',
          borderTop: '0.5px solid hsl(var(--glass-border))',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06), 0 -12px 40px rgba(0,0,0,0.04)',
        }}
      />

      {/* Center raised: + 버튼 */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 flex flex-col items-center">
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
          className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--color-green)',
            boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
        </button>
      </div>

      <div className="flex items-center justify-around py-2.5 pb-3 max-w-md mx-auto relative">
        {/* 좌측 탭들 */}
        {LEFT_TABS.map(renderTab)}

        {/* 중앙 빈 공간 — 버튼 자리 */}
        <div className="min-w-[56px]" />

        {/* 우측 탭들 */}
        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  )
}
