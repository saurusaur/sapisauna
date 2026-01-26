'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, ONBOARDING, USER_TYPES } from '@/constants/content'

export default function Onboarding() {
  const router = useRouter()
  // 선택된 타입들을 순서대로 저장 (배열 인덱스 = 선택 순서)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // 타입 클릭 핸들러
  const handleTypeClick = (typeId: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(typeId)) {
        // 이미 선택된 경우 -> 선택 해제
        return prev.filter((id) => id !== typeId)
      } else {
        // 새로 선택
        return [...prev, typeId]
      }
    })
  }

  // 선택 순서 (1부터 시작) 반환, 선택되지 않았으면 null
  const getSelectionRank = (typeId: string): number | null => {
    const index = selectedTypes.indexOf(typeId)
    return index >= 0 ? index + 1 : null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* 로고 영역 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{APP.NAME}</h1>
        <p className="text-gray-500">{APP.TAGLINE}</p>
      </div>

      {/* 온보딩 안내 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-1">{ONBOARDING.TITLE}</h2>
        <p className="text-sm text-gray-400">{ONBOARDING.SUBTITLE}</p>
      </div>

      {/* 타입 선택 */}
      <div className="flex gap-4 mb-8">
        {Object.values(USER_TYPES).map((type) => {
          const rank = getSelectionRank(type.id)
          const isSelected = rank !== null

          return (
            <div key={type.id} className="flex flex-col items-center gap-2">
              {/* 타입 카드 */}
              <button
                onClick={() => handleTypeClick(type.id)}
                className={`
                  relative w-20 h-20 rounded-2xl flex items-center justify-center text-3xl
                  transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? 'scale-110 shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? type.color : undefined,
                }}
              >
                {type.emoji}

                {/* 선택 순서 뱃지 */}
                {isSelected && (
                  <span
                    className="absolute -top-2 -right-2 px-2 py-0.5 bg-white rounded-full
                               flex items-center justify-center text-xs font-bold shadow-md"
                    style={{ color: type.color }}
                  >
                    #{rank}
                  </span>
                )}
              </button>

              {/* 이름 라벨 (선택 시 표시) */}
              <span
                className={`
                  text-sm font-medium transition-all duration-200
                  ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
                style={{ color: isSelected ? type.color : 'transparent' }}
              >
                {type.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* 시작 버튼 */}
      <button
        className={`
          w-full max-w-xs py-4 px-6 font-semibold rounded-2xl transition-all duration-200
          ${selectedTypes.length > 0
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        disabled={selectedTypes.length === 0}
        onClick={() => {
          // TODO: 선택된 타입을 저장 (localStorage 또는 Supabase)
          console.log('선택된 타입:', selectedTypes)
          router.push('/home')
        }}
      >
        {ONBOARDING.START_BUTTON}
      </button>

      {/* 버전 */}
      <p className="mt-8 text-xs text-gray-400">v{APP.VERSION}</p>
    </div>
  )
}
