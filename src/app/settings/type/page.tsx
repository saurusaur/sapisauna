'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBES } from '@/constants/content'
import type { TribeId } from '@/types'
import { useUser } from '@/contexts/user-context'

export default function TypeEdit() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const [selectedTypes, setSelectedTypes] = useState<string[]>(user?.user_types || [])

  const handleTypeClick = (typeId: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId)
      } else {
        return [...prev, typeId]
      }
    })
  }

  const getSelectionRank = (typeId: string): number | null => {
    const index = selectedTypes.indexOf(typeId)
    return index >= 0 ? index + 1 : null
  }

  const handleSave = () => {
    if (selectedTypes.length === 0) return

    updateUser({
      user_types: selectedTypes,
      primary_type: selectedTypes[0] as TribeId,
    })

    router.back()
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 — 앱 통일 패턴 */}
      <header className="p-5 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1
              className="text-2xl font-extrabold italic"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              MY TRIBE
            </h1>
          </div>
        </div>
      </header>

      <main className="p-5 pb-24">
        <div className="mb-6">
          <p className="text-stone-700 font-medium mb-1">순서대로 우선순위가 정해져요</p>
          <p className="text-sm text-stone-400">(첫 번째 = 홈 메시지, 퀵로그 기본값)</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {Object.values(TRIBES).map((type) => {
            const rank = getSelectionRank(type.id)
            const isSelected = rank !== null

            return (
              <div key={type.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleTypeClick(type.id)}
                  className={`
                    relative w-24 h-24 rounded-2xl flex items-center justify-center text-4xl
                    transition-all duration-200 cursor-pointer border-3
                    ${isSelected
                      ? 'scale-110 shadow-lg border-transparent'
                      : 'glass-card-light border-stone-200 hover:border-stone-300'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? type.color : undefined,
                    borderColor: isSelected ? type.color : undefined,
                  }}
                >
                  {type.emoji}

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

                <span
                  className={`
                    text-sm font-medium transition-all duration-200
                    ${isSelected ? 'opacity-100' : 'opacity-60'}
                  `}
                  style={{ color: isSelected ? type.color : '#78716c' }}
                >
                  {type.name}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-sm text-stone-400 justify-center">
          <span className="material-symbols-outlined text-sm">drag_indicator</span>
          <span>탭하여 순서 변경</span>
        </div>
      </main>

      {/* 하단 고정 저장 버튼 — 앱 통일 패턴 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={selectedTypes.length === 0}
          className={`w-full py-4 rounded-2xl font-semibold text-white transition-all text-base pointer-events-auto ${selectedTypes.length === 0 ? 'opacity-40' : 'hover:opacity-90'}`}
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: selectedTypes.length > 0 ? '0 8px 30px -4px rgba(204, 26, 26, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.12)' : 'none' }}
        >
          저장
        </button>
      </div>
    </div>
  )
}
