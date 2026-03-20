'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { APP, LOGIN } from '@/constants/content'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/home'
  const error = searchParams.get('error')
  const [ready, setReady] = useState(false)

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  return (
    <div className="relative flex flex-col items-center min-h-dvh p-6 bath-tile-bg">
      {/* 상단 영역 — 로고 + 태그라인 */}
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '55vh' }}>
        <img
          src="/icons/icon-192.png"
          alt="사피 로고"
          onLoad={() => setReady(true)}
          className={`rounded-3xl transition-none ${ready ? 'animate-intro-up-slow' : 'opacity-0'}`}
          style={{ width: 'min(36vw, 160px)', height: 'min(36vw, 160px)', mixBlendMode: 'multiply' }}
        />
        <div
          className={`mt-5 text-center transition-none ${ready ? 'animate-intro-up-slow' : 'opacity-0'}`}
          style={{ animationDelay: '200ms' }}
        >
          <p className="font-medium text-stone-500" style={{ fontSize: '17px' }}>
            사우나 피플을 위한
          </p>
          <p className="mt-0.5 text-lg font-extrabold tracking-wide text-stone-700">
            기록 · 공유 · 발견
          </p>
        </div>
      </div>

      {/* 하단 영역 — 버튼 */}
      <div className="flex flex-col items-center w-full flex-1 justify-start">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-500 text-sm">
            {LOGIN.ERROR}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className={`w-full max-w-xs flex items-center justify-center gap-3 px-6 py-4 glass-card-light rounded-xl hover:shadow-md transition-all text-stone-700 font-medium transition-none ${ready ? 'animate-intro-up' : 'opacity-0'}`}
          style={{ animationDelay: '1000ms' }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {LOGIN.GOOGLE_BUTTON}
        </button>

        <p className="mt-4 text-[11px] text-stone-400 text-center leading-relaxed max-w-xs">
          로그인하면{' '}
          <a href="/legal/terms" className="underline underline-offset-2">이용약관</a>과{' '}
          <a href="/legal/privacy" className="underline underline-offset-2">개인정보 처리방침</a>에
          동의하게 돼요.
        </p>
      </div>

      {/* 버전 — 하단 고정 */}
      <p className="absolute bottom-6 text-xs text-stone-300">
        v{APP.VERSION}
      </p>
    </div>
  )
}
