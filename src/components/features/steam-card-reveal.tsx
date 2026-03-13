'use client'

/**
 * Steam Card Reveal — 레벨업 보상 애니메이션
 * 화면 딤 → 증기 올라옴 → 카드 슬라이드업 → 플립하며 칭호 공개 → 컨페티 → 증기 사라짐
 * ~2.5초, CSS @keyframes + canvas-confetti
 */

import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import type { RewardResult } from '@/types'

interface SteamCardRevealProps {
  reward: RewardResult
  onComplete: () => void
}

export default function SteamCardReveal({ reward, onComplete }: SteamCardRevealProps) {
  const [phase, setPhase] = useState<'steam' | 'card' | 'reveal' | 'done'>('steam')

  const fireConfetti = useCallback(() => {
    // ♨️ 스팀 테마 컨페티 — 따뜻한 색 위주
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x: 0.3, y: 0.5 },
      colors: ['#cc1a1a', '#F97316', '#fbbf24', '#ffffff'],
    })
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x: 0.7, y: 0.5 },
      colors: ['#cc1a1a', '#F97316', '#fbbf24', '#ffffff'],
    })
  }, [])

  useEffect(() => {
    // 타이밍 시퀀스
    const t1 = setTimeout(() => setPhase('card'), 400)    // 증기 후 카드 등장
    const t2 = setTimeout(() => {
      setPhase('reveal')
      fireConfetti()
    }, 1000)   // 카드 플립 + 칭호 공개
    const t3 = setTimeout(() => setPhase('done'), 2800)    // 자동 종료

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [fireConfetti])

  useEffect(() => {
    if (phase === 'done') onComplete()
  }, [phase, onComplete])

  const displayTitle = reward.newTitles[0] || '새로운 칭호'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onComplete}
    >
      {/* 배경 딤 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: phase === 'steam' ? 0 : 1,
        }}
      />

      {/* 증기 파티클 */}
      <div className={`absolute inset-0 pointer-events-none ${phase === 'reveal' || phase === 'done' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-steam-float"
            style={{
              width: 40 + i * 15,
              height: 40 + i * 15,
              left: `${15 + i * 13}%`,
              bottom: '20%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)',
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* 칭호 카드 */}
      {(phase === 'card' || phase === 'reveal' || phase === 'done') && (
        <div
          className={`relative z-10 transition-all duration-700 ${
            phase === 'card'
              ? 'translate-y-8 opacity-90'
              : 'translate-y-0 opacity-100'
          }`}
          style={{
            perspective: '600px',
          }}
        >
          <div
            className={`w-64 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 ${
              phase === 'reveal' || phase === 'done' ? 'animate-card-flip' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="p-6 text-center">
              {/* 레벨업 표시 */}
              <div className="mb-3">
                <span className="text-xs font-bold tracking-[0.3em] text-stone-400 uppercase">
                  Level Up
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-white/50 font-heading">
                    {reward.oldLevel}
                  </span>
                  <span className="material-symbols-outlined text-white/30" style={{ fontSize: '20px' }}>
                    arrow_forward
                  </span>
                  <span
                    className="text-3xl font-bold font-heading"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {reward.newLevel}
                  </span>
                </div>
              </div>

              {/* 칭호 */}
              <div className="py-4 border-t border-white/10">
                <p className="text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-2">
                  New Title
                </p>
                <p className="text-lg font-bold text-white">
                  {displayTitle}
                </p>
              </div>

              {/* XP 표시 */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-xs text-stone-500">
                  +{reward.xpGained} XP
                </span>
              </div>
            </div>
          </div>

          {/* 탭하여 닫기 */}
          <p className="text-center text-xs text-white/40 mt-4 animate-pulse">
            탭하여 닫기
          </p>
        </div>
      )}
    </div>
  )
}
