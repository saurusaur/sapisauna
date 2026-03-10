'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'

export default function GenderEdit() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const [gender, setGender] = useState<'male' | 'female' | null>(user?.gender || null)

  const handleSave = () => {
    if (!gender) return
    updateUser({ gender })
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
          <h1 className="text-lg font-bold text-stone-700">성별 수정</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!gender}
          className={`
            px-4 py-2 rounded-xl font-semibold transition-all
            ${gender
              ? 'text-white hover:opacity-90'
              : 'bg-stone-200 text-stone-400'
            }
          `}
          style={gender ? { backgroundColor: 'var(--color-primary)' } : {}}
        >
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      <main className="p-6">
        <p className="text-sm text-stone-500 mb-6">기록 시 기본값으로 사용돼요</p>

        <div className="space-y-3">
          {/* 남탕 */}
          <button
            onClick={() => setGender('male')}
            className={`
              w-full p-4 rounded-xl text-left transition-all flex items-center justify-between
              ${gender === 'male'
                ? 'ring-2'
                : 'bg-white shadow-sm hover:shadow-md'
              }
            `}
            style={gender === 'male' ? {
              backgroundColor: 'rgba(30, 95, 138, 0.1)',
              borderColor: 'var(--color-male)',
              // @ts-ignore - ringColor is used with Tailwind ring-2 class
            } : {}}
          >
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--color-male)' }}
            >
              남 탕
            </span>
            {gender === 'male' && (
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--color-male)' }}
              >
                check
              </span>
            )}
          </button>

          {/* 여탕 */}
          <button
            onClick={() => setGender('female')}
            className={`
              w-full p-4 rounded-xl text-left transition-all flex items-center justify-between
              ${gender === 'female'
                ? 'ring-2'
                : 'bg-white shadow-sm hover:shadow-md'
              }
            `}
            style={gender === 'female' ? {
              backgroundColor: 'rgba(194, 75, 110, 0.1)',
              borderColor: 'var(--color-female)',
              // @ts-ignore - ringColor is used with Tailwind ring-2 class
            } : {}}
          >
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--color-female)' }}
            >
              여 탕
            </span>
            {gender === 'female' && (
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--color-female)' }}
              >
                check
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
