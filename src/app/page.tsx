'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 로그인 화면 제거 → 온보딩 또는 홈으로 리다이렉트
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      router.replace('/home')
    } else {
      router.replace('/onboarding')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bath-tile-bg">
      <div className="text-stone-400 text-sm">로딩 중...</div>
    </div>
  )
}
