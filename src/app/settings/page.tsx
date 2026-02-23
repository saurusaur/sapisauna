'use client'

import { useRouter } from 'next/navigation'
import { APP, SETTINGS, MY_PAGE, TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import { useUser } from '@/contexts/user-context'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUser()


  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  // 설정 항목 컴포넌트
  const SettingItem = ({
    icon,
    label,
    value,
    onClick,
    showArrow = true,
    isEmoji = false,
  }: {
    icon: string
    label: string
    value?: string
    onClick?: () => void
    showArrow?: boolean
    isEmoji?: boolean
  }) => (
    <button
      onClick={onClick}
      className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-all mb-3"
    >
      <div className="flex items-center gap-3">
        {isEmoji ? (
          <span className="text-xl">{icon}</span>
        ) : (
          <span className="material-symbols-outlined text-stone-500">{icon}</span>
        )}
        <span className="font-medium text-stone-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-stone-400">{value}</span>}
        {showArrow && (
          <span className="material-symbols-outlined text-stone-300">chevron_right</span>
        )}
      </div>
    </button>
  )

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-xl font-bold text-stone-700">{MY_PAGE.TITLE}</h1>
      </header>

      <main className="p-4">
        {/* 프로필 섹션 */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-stone-400 mb-3 px-1 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap">{SETTINGS.PROFILE.TITLE}</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <SettingItem
            icon="person"
            label="닉네임"
            value={user?.nickname || '설정 필요'}
            onClick={() => router.push('/settings/nickname')}
          />

          <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
            <button
              onClick={() => router.push('/settings/type')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{TRIBE_EMOJI_MAP[user?.primary_type || 'saunner']}</span>
                <span className="font-medium text-stone-700">나의 스타일</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">
                  {TRIBE_PERSONA_MAP[user?.primary_type || 'saunner']}
                </span>
                <span className="material-symbols-outlined text-stone-300">chevron_right</span>
              </div>
            </button>
          </div>
        </div>

        {/* 앱 설정 섹션 */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-stone-400 mb-3 px-1 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap">앱 설정</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-500">notifications</span>
              <span className="font-medium text-stone-700">{SETTINGS.NOTIFICATION.REMINDER}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green"></div>
            </label>
          </div>
        </div>

        {/* 정보 섹션 */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-stone-400 mb-3 px-1 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap">{SETTINGS.ABOUT.TITLE}</span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <SettingItem
            icon="info"
            label={SETTINGS.ABOUT.VERSION}
            value={`v${APP.VERSION}`}
            showArrow={false}
          />

          <SettingItem
            icon="description"
            label={SETTINGS.ABOUT.TERMS}
          />

          <SettingItem
            icon="privacy_tip"
            label={SETTINGS.ABOUT.PRIVACY}
          />
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 text-red-500 hover:shadow-md transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium">로그아웃</span>
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
