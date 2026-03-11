'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'

// 루트: 인증·프로필 상태에 따라 분기
export default function RootPage() {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading } = useAuth()
  const { user: profile } = useUser()

  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      // 미인증 → 로그인
      router.replace('/login')
    } else if (!profile) {
      // 인증됨 + 프로필 없음 → 온보딩
      router.replace('/onboarding')
    } else {
      // 인증됨 + 프로필 있음 → 홈
      router.replace('/home')
    }
  }, [authUser, authLoading, profile, router])

  return (
    <div className="flex items-center justify-center min-h-screen bath-tile-bg">
      <div className="text-stone-400 text-sm">로딩 중...</div>
    </div>
  )
}
