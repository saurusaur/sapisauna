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
    <div className="min-h-dvh pb-20 bath-tile-bg">
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
            {/* 나의 칭호 */}
            <button
              onClick={() => router.push('/settings/titles')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-stone-500">military_tech</span>
                <span className="font-medium text-stone-700">나의 칭호</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50 truncate max-w-[120px]">
                  {user?.active_title || '미설정'}
                </span>
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
                  {TRIBE_PERSONA_MAP[user?.primary_type || FALLBACK_TRIBE]}
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
            <button onClick={() => router.push('/legal/terms')} className="w-full p-4 flex items-center justify-between">
              <span className="font-medium text-stone-700">이용약관</span>
              <span className="material-symbols-outlined text-stone-300">chevron_right</span>
            </button>
            {/* 개인정보처리방침 */}
            <button onClick={() => router.push('/legal/privacy')} className="w-full p-4 flex items-center justify-between">
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

        {/* 인스타그램 링크 */}
        <div className="text-center pb-2">
          <a
            href="https://instagram.com/sapi.sauna"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            @sapi.sauna
          </a>
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
