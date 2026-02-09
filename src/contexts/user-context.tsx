'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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
  const [user, setUserState] = useState<UserData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // 최초 마운트 시 localStorage에서 유저 데이터 로드
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUserState(JSON.parse(userData))
    }
    setIsLoaded(true)
  }, [])

  // 유저 데이터 전체 세팅 (온보딩에서 최초 저장 시 사용)
  const setUser = useCallback((data: UserData) => {
    localStorage.setItem('user', JSON.stringify(data))
    setUserState(data)
  }, [])

  // 유저 데이터 부분 업데이트 (설정 변경 시 사용)
  // 예: updateUser({ nickname: '새닉네임' }) → 닉네임만 변경
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
