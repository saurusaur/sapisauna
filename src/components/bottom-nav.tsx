'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NAV, ICONS } from '@/constants/content'

// 2 + center raised + 2 구성 (논리적 그룹핑)
const LEFT_TABS = [
  { label: NAV.HISTORY, icon: ICONS.HISTORY, path: '/history' },
  { label: NAV.EXPLORE, icon: ICONS.EXPLORE, path: '/explore' },
] as const

const RIGHT_TABS = [
  { label: NAV.SA_LIST, icon: ICONS.SA_LIST, path: null, disabled: true },
  { label: NAV.MY, icon: ICONS.MY, path: '/settings' },
] as const

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const isHomeActive = pathname === '/home'

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
        style={isActive && !isDisabled ? { color: 'var(--color-primary)' } : {}}
      >
        <span className="material-symbols-outlined">{item.icon}</span>
        <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
      </button>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      {/* Glass 배경 */}
      <div className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: 'hsl(var(--glass))',
          borderTop: '0.5px solid hsl(var(--glass-border))',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06), 0 -12px 40px rgba(0,0,0,0.04)',
        }}
      />

      {/* Center raised: 홈 버튼 */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 flex flex-col items-center">
        <button
          onClick={() => { if (!isHomeActive) router.push('/home') }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 active:brightness-125"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>home</span>
        </button>
        <span
          className="text-[10px] mt-0.5 leading-tight"
          style={isHomeActive ? { color: 'var(--color-primary)' } : { color: '#a8a29e' }}
        >
          {NAV.HOME}
        </span>
      </div>

      <div className="flex items-center justify-around py-2.5 pb-3 max-w-md mx-auto relative">
        {/* 좌측: 내 기록 + 탐색 */}
        {LEFT_TABS.map(renderTab)}

        {/* 중앙 빈 공간 — raised 버튼 자리 */}
        <div className="min-w-[56px]" />

        {/* 우측: 사-리스트 + 마이 */}
        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  )
}
