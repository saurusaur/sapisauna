'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './auth-context'
import { supabase } from '@/lib/supabase'

// 유저 데이터 타입 (localStorage 'user' 키와 동일 구조)
export interface UserData {
  nickname: string
  user_types: string[]
  primary_type: 'bather' | 'saunner' | 'jimi'
  gender?: 'male' | 'female'
}

// Context가 제공하는 값
interface UserContextValue {
  user: UserData | null           // 유저 데이터 (없으면 null = 온보딩 전)
  primaryTribe: 'bather' | 'saunner' | 'jimi'  // user.primary_type 바로 접근 (기본값: 'saunner')
  updateUser: (updates: Partial<UserData>) => void  // 유저 데이터 부분 업데이트
  setUser: (data: UserData) => void                 // 유저 데이터 전체 세팅 (온보딩 등)
}

const UserContext = createContext<UserContextValue | null>(null)

// Provider: layout.tsx에서 앱 전체를 감싸는 컴포넌트
export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [user, setUserState] = useState<UserData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // 인증 상태 변화에 따라 프로필 로드
  useEffect(() => {
    if (authLoading) return

    async function loadProfile() {
      // 1. 로그인 상태면 Supabase에서 프로필 로드
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('nickname, user_types, primary_type, gender')
          .eq('id', authUser.id)
          .single()

        if (data) {
          const profile: UserData = {
            nickname: data.nickname,
            user_types: data.user_types || [],
            primary_type: data.primary_type as UserData['primary_type'],
            gender: data.gender as UserData['gender'],
          }
          setUserState(profile)
          // localStorage 캐시 동기화
          localStorage.setItem('user', JSON.stringify(profile))
          setIsLoaded(true)
          return
        }
      }

      // 2. 비로그인 또는 Supabase 프로필 없음 → localStorage 폴백
      const cached = localStorage.getItem('user')
      if (cached) {
        setUserState(JSON.parse(cached))
      }
      setIsLoaded(true)
    }

    loadProfile()
  }, [authUser, authLoading])

  // 유저 데이터 전체 세팅 (온보딩에서 최초 저장 시 사용)
  const setUser = useCallback((data: UserData) => {
    localStorage.setItem('user', JSON.stringify(data))
    setUserState(data)
  }, [])

  // 유저 데이터 부분 업데이트 (설정 변경 시 사용)
  const updateUser = useCallback((updates: Partial<UserData>) => {
    setUserState((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const primaryTribe: 'bather' | 'saunner' | 'jimi' = user?.primary_type || 'saunner'

  // localStorage 로드 전에는 빈 화면 방지
  if (!isLoaded) return null

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
