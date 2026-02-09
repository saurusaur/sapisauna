'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NAV, ICONS } from '@/constants/content'

// 4탭 네비게이션 구성
const NAV_ITEMS = [
  { label: NAV.HOME, icon: ICONS.HOME, path: '/home' },
  { label: NAV.HISTORY, icon: ICONS.HISTORY, path: '/history' },
  { label: NAV.EXPLORE, icon: ICONS.EXPLORE, path: '/explore' },
  { label: NAV.MY, icon: ICONS.MY, path: '/settings' },
] as const

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200 z-50">
      <div className="flex justify-around py-3 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => !isActive && router.push(item.path)}
              className={`flex flex-col items-center ${
                isActive ? '' : 'text-stone-400 hover:text-stone-600'
              }`}
              style={isActive ? { color: 'var(--color-green)' } : {}}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
