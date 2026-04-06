/**
 * 로그인 프롬프트 훅 — 비로그인 유저의 보호 기능 접근 시 모달 제어
 * 사용법: if (!requireAuth()) return → JSX에 <LoginPromptModal open={showPrompt} onClose={...} />
 */

'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export function useLoginPrompt() {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)

  const requireAuth = useCallback((): boolean => {
    if (user) return true
    setShowPrompt(true)
    return false
  }, [user])

  return { showPrompt, setShowPrompt, requireAuth }
}
