'use client'

/**
 * TribePicksCard — 비로그인 홈에서 트라이브 선택 유도
 * 3초 오토 스크롤로 각 트라이브 하이라이트 + 설명 표시
 * 카드 클릭 → /explore/type/{tribe} 이동
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBES } from '@/constants/content'

const TRIBE_LIST = Object.values(TRIBES)
const INTERVAL_MS = 3000

export default function TribePicksCard() {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [textOpacity, setTextOpacity] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TRIBE_LIST.length)
    }, INTERVAL_MS)
  }, [])

  useEffect(() => {
    startAutoScroll()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startAutoScroll])

  // fade-out 100ms → 텍스트 교체 → fade-in 100ms, 최소 opacity 0.3으로 깜박임 완화
  useEffect(() => {
    setTextOpacity(0.3)
    const timer = setTimeout(() => {
      setDisplayIndex(activeIndex)
      setTextOpacity(1)
    }, 100)
    return () => clearTimeout(timer)
  }, [activeIndex])

  const handleClick = (index: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    router.push(`/explore/type/${TRIBE_LIST[index].id}`)
  }

  const displayTribe = TRIBE_LIST[displayIndex]

  return (
    <div className="glass-card-light p-5">
      {/* 헤딩 */}
      <h3 className="text-base font-extrabold italic font-heading mb-4">
        PICK YOUR TRIBE
      </h3>

      {/* 트라이브 카드 3개 */}
      <div className="flex justify-center gap-4 mb-4">
        {TRIBE_LIST.map((tribe, i) => {
          const isActive = activeIndex === i
          return (
            <div key={tribe.id} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => handleClick(i)}
                className={`
                  w-20 h-20 rounded-xl flex items-center justify-center text-3xl
                  transition-all duration-300 cursor-pointer
                  ${isActive
                    ? 'shadow-md scale-105'
                    : 'glass-card-light text-stone-400 hover:shadow-sm'
                  }
                `}
                style={isActive ? { backgroundColor: tribe.color } : {}}
              >
                {tribe.emoji}
              </button>
              <div className="text-center">
                <span
                  className={`text-xs font-extrabold italic block font-heading transition-colors duration-300 ${isActive ? '' : 'text-stone-400'}`}
                  style={isActive ? { color: tribe.color } : {}}
                >
                  {tribe.persona}
                </span>
                <span
                  className={`text-[10px] transition-colors duration-300 ${isActive ? 'font-medium' : 'text-stone-400'}`}
                  style={isActive ? { color: tribe.color } : {}}
                >
                  {tribe.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 설명 + 전체 보기 — fade 150ms로 카드 300ms transition과 동기화 */}
      <div
        className="min-h-[48px] flex flex-col items-center justify-center transition-opacity duration-100"
        style={{ opacity: textOpacity }}
      >
        <p className="text-xs text-stone-500 text-center">
          &ldquo;{displayTribe.description}&rdquo;
        </p>
        <button
          onClick={() => router.push(`/explore/type/${displayTribe.id}`)}
          className="mt-2 text-[11px] font-medium flex items-center gap-0.5 hover:opacity-70"
          style={{ color: displayTribe.color }}
        >
          {displayTribe.persona} 추천 사우나 보기
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
