'use client'

/**
 * TRIBE PICKS — 홈 트라이브 추천 섹션.
 * 3 컬러 카드(SAUNNER/BATHER/JIMI 영문 Oswald + 이모지 크롭), 카드 탭 → /sa-list/tribe/{id}.
 * 비로그인: 3초 오토 사이클(액티브 카드 강조 + 아래 로테이팅 소개문구·링크)로 트라이브 선택 유도.
 * 로그인: 정적(피로도 방지).
 * ※ 카드 "N곳" 카운트는 B2(중앙 RPC) 작업에서 연결 예정 — BACKLOG 참조.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TRIBES } from '@/constants/content'
import { useAuth } from '@/contexts/auth-context'

// 프로토 순서: SAUNNER · BATHER · JIMI
const TRIBE_LIST = [TRIBES.SAUNER, TRIBES.BATHER, TRIBES.JIMI]
const INTERVAL_MS = 3000

export default function TribePicksCard() {
  const router = useRouter()
  const { user } = useAuth()
  const isGuest = !user

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

  // 비로그인만 사이클 동작
  useEffect(() => {
    if (!isGuest) return
    startAutoScroll()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isGuest, startAutoScroll])

  useEffect(() => {
    if (!isGuest) return
    setTextOpacity(0.3)
    const timer = setTimeout(() => {
      setDisplayIndex(activeIndex)
      setTextOpacity(1)
    }, 100)
    return () => clearTimeout(timer)
  }, [activeIndex, isGuest])

  const goTribe = (id: string) => router.push(`/sa-list/tribe/${id}`)
  const displayTribe = TRIBE_LIST[displayIndex]

  return (
    <section>
      {/* 헤딩 + 서브타이틀 */}
      <h2 className="text-[23px] font-extrabold italic font-heading tracking-wide text-[#2a2222]">
        TRIBE PICKS
      </h2>
      <p className="text-xs text-stone-500 font-medium mt-1 mb-4">실시간 업데이트 트라이브별 베스트 사우나!</p>

      {/* 3 컬러 카드 */}
      <div className="grid grid-cols-3 gap-2.5">
        {TRIBE_LIST.map((tribe, i) => {
          const active = isGuest && activeIndex === i
          return (
            <button
              key={tribe.id}
              onClick={() => goTribe(tribe.id)}
              className={`relative h-[100px] rounded-2xl overflow-hidden p-3 flex flex-col text-left text-white transition-all duration-300 ${
                active ? 'scale-[1.04] shadow-md z-[1]' : 'shadow-sm'
              }`}
              style={{
                backgroundColor: tribe.color,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              <span
                className="text-[18px] font-extrabold italic font-heading tracking-wide leading-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}
              >
                {tribe.persona}
              </span>
              {/* 이모지 크롭 (우하단) */}
              <span
                className="absolute -right-2 -bottom-3 text-[54px] leading-none"
                style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))', transform: 'rotate(-8deg)' }}
                aria-hidden
              >
                {tribe.emoji}
              </span>
            </button>
          )
        })}
      </div>

      {/* 비로그인 전용 — 로테이팅 소개문구 + 링크 */}
      {isGuest && (
        <div
          className="mt-3 min-h-[40px] flex flex-col items-center justify-center text-center transition-opacity duration-100"
          style={{ opacity: textOpacity }}
        >
          <p className="text-xs text-stone-500">&ldquo;{displayTribe.description}&rdquo;</p>
          <button
            onClick={() => goTribe(displayTribe.id)}
            className="mt-1.5 text-[11px] font-medium flex items-center gap-0.5 hover:opacity-70"
            style={{ color: displayTribe.color }}
          >
            {displayTribe.persona} 추천 사우나 보기
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          </button>
        </div>
      )}
    </section>
  )
}
