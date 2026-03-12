'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth-context'
import { supabase } from '@/lib/supabase'
import { FALLBACK_TRIBE } from '@/constants/content'
import type { TribeId } from '@/types'

// 유저 데이터 타입 (DB users 테이블과 동일 구조)
export interface UserData {
  nickname: string
  user_types: string[]
  primary_type: TribeId
  gender?: 'male' | 'female'
  xp: number
  level: number
  active_title: string | null
}

// Context가 제공하는 값
interface UserContextValue {
  user: UserData | null           // 유저 데이터 (없으면 null = 온보딩 전)
  primaryTribe: TribeId           // user.primary_type 바로 접근 (폴백: FALLBACK_TRIBE)
  updateUser: (updates: Partial<UserData>) => Promise<void>  // DB + state 부분 업데이트
  setUser: (data: UserData) => void                          // state 전체 세팅 (온보딩 직후)
}

const UserContext = createContext<UserContextValue | null>(null)

// Provider: layout.tsx에서 앱 전체를 감싸는 컴포넌트
export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [user, setUserState] = useState<UserData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 인증 상태 변화에 따라 프로필 로드 (DB가 유일한 소스)
  useEffect(() => {
    if (authLoading) return

    async function loadProfile() {
      try {
        if (authUser) {
          // 로그인 상태 → DB에서 프로필 로드
          const { data } = await supabase
            .from('users')
            .select('nickname, user_types, primary_type, gender, xp, level, active_title')
            .eq('id', authUser.id)
            .single()

          if (data) {
            setUserState({
              nickname: data.nickname,
              user_types: data.user_types || [],
              primary_type: data.primary_type as UserData['primary_type'],
              gender: data.gender as UserData['gender'],
              xp: data.xp ?? 0,
              level: data.level ?? 1,
              active_title: data.active_title ?? null,
            })
          } else {
            // 로그인은 됐지만 프로필 없음 → 온보딩 필요
            setUserState(null)
            if (pathname !== '/onboarding') {
              router.push('/onboarding')
            }
          }
        } else {
          // 비로그인
          setUserState(null)
        }
      } catch (e) {
        console.error('프로필 로드 실패:', e)
        setUserState(null)
      }
      setIsLoaded(true)
    }

    loadProfile()
  }, [authUser, authLoading, pathname, router])

  // 유저 데이터 전체 세팅 (온보딩에서 DB 저장 성공 후 호출)
  const setUser = useCallback((data: UserData) => {
    setUserState(data)
  }, [])

  // 유저 데이터 부분 업데이트 (설정 변경 시 — DB + state 동시 반영)
  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!authUser) return

    // 1. 즉시 UI 반영 (optimistic update)
    const prev = user
    setUserState((current) => current ? { ...current, ...updates } : current)

    // 2. DB 저장
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)

    if (error) {
      console.error('프로필 업데이트 실패:', error)
      // 실패 시 롤백
      setUserState(prev)
    }
  }, [authUser, user])

  const primaryTribe: TribeId = user?.primary_type || FALLBACK_TRIBE

  // DB 로드 전 로딩 표시
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-stone-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, primaryTribe, updateUser, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

// Hook: 각 페이지에서 useUser()로 유저 정보 접근
export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser()는 UserProvider 안에서만 사용할 수 있습니다')
  }
  return context
}
