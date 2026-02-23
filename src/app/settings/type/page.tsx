'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBES } from '@/constants/content'
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
      primary_type: selectedTypes[0] as 'bather' | 'saunner' | 'jimi',
    })

    router.back()
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">타입 수정</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={selectedTypes.length === 0}
          className={`
            px-4 py-2 rounded-xl font-semibold transition-all
            ${selectedTypes.length > 0
              ? 'text-white hover:opacity-90'
              : 'bg-stone-200 text-stone-400'
            }
          `}
          style={selectedTypes.length > 0 ? { backgroundColor: 'var(--color-green)' } : {}}
        >
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      <main className="p-6">
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
                      : 'bg-white border-stone-200 hover:border-stone-300'
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
    </div>
  )
}
