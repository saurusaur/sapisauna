'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'

// 온보딩 또는 홈으로 리다이렉트
export default function RootPage() {
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      router.replace('/home')
    } else {
      router.replace('/onboarding')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-screen bath-tile-bg">
      <div className="text-stone-400 text-sm">로딩 중...</div>
    </div>
  )
}
