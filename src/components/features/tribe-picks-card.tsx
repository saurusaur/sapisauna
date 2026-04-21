'use client'

/**
 * TribePicksCard — 비로그인 홈에서 트라이브 선택 유도
 * 3초 오토 스크롤로 각 트라이브 하이라이트 + 설명 표시
 * 카드 클릭 → /sa-list/tribe/{tribe} 이동
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
    router.push(`/sa-list/tribe/${TRIBE_LIST[index].id}`)
  }

  const displayTribe = TRIBE_LIST[displayIndex]

  return (
    <div className="glass-card-light p-5">
      {/* 헤딩 */}
      <h3 className="text-base font-extrabold italic font-heading mb-4">
        PICK YOUR TRIBE
      </h3>

      {/* 트라이브 카드 3개 — 컬러 풀필 + 박스 안 이모지·영문 persona */}
      <div className="flex justify-center gap-4 mb-4">
        {TRIBE_LIST.map((tribe, i) => {
          const isActive = activeIndex === i
          return (
            <button
              key={tribe.id}
              onClick={() => handleClick(i)}
              className={`
                w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1
                transition-all duration-300 cursor-pointer shadow-sm
                ${isActive ? 'scale-105 shadow-md' : 'opacity-85'}
              `}
              style={{ backgroundColor: tribe.color }}
            >
              <span
                className="text-[24px] leading-none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
              >
                {tribe.emoji}
              </span>
              <span
                className="text-[11px] font-extrabold italic font-heading tracking-wide text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}
              >
                {tribe.persona}
              </span>
            </button>
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
          onClick={() => router.push(`/sa-list/tribe/${displayTribe.id}`)}
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
