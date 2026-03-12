'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBES } from '@/constants/content'
import type { TribeId } from '@/types'
import { useUser } from '@/contexts/user-context'
import BottomCTA from '@/components/ui/bottom-cta'

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
    <div className="min-h-dvh bath-tile-bg">
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
              className="text-2xl font-extrabold italic font-heading"
            >
              MY TRIBE
            </h1>
          </div>
        </div>
      </header>

      <main className="p-5 pb-24">
        <p className="text-sm text-stone-400 mb-8 text-center">순서대로 우선순위가 정해져요 (첫 번째 = 기본값)</p>

        <div className="flex justify-center gap-4 mb-6">
          {Object.values(TRIBES).map((type) => {
            const rank = getSelectionRank(type.id)
            const isSelected = rank !== null

            return (
              <div key={type.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleTypeClick(type.id)}
                  className={`
                    relative w-24 h-24 rounded-xl flex items-center justify-center text-4xl
                    transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'shadow-md scale-105'
                      : 'glass-card-light text-stone-500 hover:shadow-sm'
                    }
                  `}
                  style={isSelected ? { backgroundColor: type.color } : {}}
                >
                  {type.emoji}

                  {isSelected && (
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full
                                 flex items-center justify-center text-xs font-bold shadow-md"
                      style={{ color: type.color }}
                    >
                      {rank}
                    </span>
                  )}
                </button>

                {/* 메인 라벨: 영문 (헤딩 폰트) + 서브: 한글 */}
                <div className="text-center">
                  <span
                    className={`text-sm font-extrabold italic block transition-all duration-200 font-heading ${isSelected ? '' : 'text-stone-400'}`}
                    style={{ color: isSelected ? type.color : undefined }}
                  >
                    {type.persona.toUpperCase()}
                  </span>
                  <span
                    className={`text-[11px] transition-all duration-200 ${isSelected ? 'font-medium' : 'text-stone-400'}`}
                    style={isSelected ? { color: type.color } : {}}
                  >
                    {type.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 선택 피드백 */}
        <div className="text-center h-10 flex items-center justify-center">
          {selectedTypes.length > 0 ? (
            <p className="text-sm text-stone-600">
              &ldquo;{Object.values(TRIBES).find(t => t.id === selectedTypes[selectedTypes.length - 1])?.description}&rdquo;
            </p>
          ) : (
            <p className="text-sm text-stone-400">
              좋아하는 순서대로 선택해주세요
            </p>
          )}
        </div>
      </main>

      <BottomCTA onClick={handleSave} disabled={selectedTypes.length === 0}>저장</BottomCTA>
    </div>
  )
}
