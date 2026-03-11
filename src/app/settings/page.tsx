'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, FALLBACK_TRIBE } from '@/constants/content'
import BottomNav from '@/components/bottom-nav'
import ConfirmModal from '@/components/ui/confirm-modal'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 — Home/Explore 통일 스타일 */}
      <header className="p-5 pt-8">
        <h1
          className="text-3xl font-extrabold italic font-heading"
        >
          SETTINGS
        </h1>
      </header>

      <main className="p-4 space-y-6">
        {/* 프로필 섹션 */}
        <div>
          <p className="text-xs font-bold text-stone-400 mb-2 px-1">
            프로필
          </p>
          <div className="glass-card-light rounded-xl divide-y divide-stone-200/60">
            {/* 닉네임 */}
            <button
              onClick={() => router.push('/settings/nickname')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-stone-500">person</span>
                <span className="font-medium text-stone-700">닉네임</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">{user?.nickname || '설정 필요'}</span>
                <span className="material-symbols-outlined text-stone-300">chevron_right</span>
              </div>
            </button>
            {/* 나의 스타일 */}
            <button
              onClick={() => router.push('/settings/type')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{TRIBE_EMOJI_MAP[user?.primary_type || FALLBACK_TRIBE]}</span>
                <span className="font-medium text-stone-700">MY TRIBE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">
                  {TRIBE_PERSONA_MAP[user?.primary_type || FALLBACK_TRIBE]?.toUpperCase()}
                </span>
                <span className="material-symbols-outlined text-stone-300">chevron_right</span>
              </div>
            </button>
          </div>
        </div>

        {/* 앱 정보 섹션 */}
        <div>
          <p className="text-xs font-bold text-stone-400 mb-2 px-1">앱 정보</p>
          <div className="glass-card-light rounded-xl divide-y divide-stone-200/60">
            {/* 버전 */}
            <div className="p-4 flex items-center justify-between">
              <span className="font-medium text-stone-700">버전</span>
              <span className="text-sm text-stone-400">v{APP.VERSION}</span>
            </div>
            {/* 이용약관 */}
            <button className="w-full p-4 flex items-center justify-between">
              <span className="font-medium text-stone-700">이용약관</span>
              <span className="material-symbols-outlined text-stone-300">chevron_right</span>
            </button>
            {/* 개인정보처리방침 */}
            <button className="w-full p-4 flex items-center justify-between">
              <span className="font-medium text-stone-700">개인정보처리방침</span>
              <span className="material-symbols-outlined text-stone-300">chevron_right</span>
            </button>
          </div>
        </div>

        {/* 로그아웃 — 텍스트 버튼 */}
        <div className="pt-2 text-center">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            로그아웃
          </button>
        </div>
      </main>

      {showLogoutConfirm && (
        <ConfirmModal
          message="로그아웃 하시겠습니까?"
          confirmLabel="로그아웃"
          cancelLabel="취소"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}
