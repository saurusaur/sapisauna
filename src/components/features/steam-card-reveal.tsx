'use client'

/**
 * Steam Card Reveal — 레벨업 보상 애니메이션
 * 화면 딤 → 증기 올라옴 → 카드 슬라이드업 → 플립하며 칭호 공개 → 컨페티
 * 유저가 탭할 때까지 유지
 */

import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import type { RewardResult } from '@/types'

interface SteamCardRevealProps {
  reward: RewardResult
  onComplete: () => void
}

export default function SteamCardReveal({ reward, onComplete }: SteamCardRevealProps) {
  const [phase, setPhase] = useState<'steam' | 'card' | 'reveal'>('steam')

  const fireConfetti = useCallback(() => {
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
    // 타이밍 시퀀스 (속도 2배 느리게)
    const t1 = setTimeout(() => setPhase('card'), 800)
    const t2 = setTimeout(() => {
      setPhase('reveal')
      fireConfetti()
    }, 2000)
    // 자동 종료 없음 — 유저 탭으로만 닫힘

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [fireConfetti])

  const displayTitle = reward.newTitles[0] || '새로운 칭호'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onComplete}
    >
      {/* 배경 딤 */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: phase === 'steam' ? 0 : 1,
        }}
      />

      {/* 증기 파티클 */}
      <div className={`absolute inset-0 pointer-events-none ${phase === 'reveal' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-1400`}>
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
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* 칭호 카드 */}
      {(phase === 'card' || phase === 'reveal') && (
        <div
          className={`relative z-10 transition-all duration-1400 ${
            phase === 'card'
              ? 'translate-y-8 opacity-90'
              : 'translate-y-0 opacity-100'
          }`}
          style={{ perspective: '600px' }}
        >
          <div
            className={`w-64 rounded-2xl overflow-hidden transition-transform duration-1400 ${
              phase === 'reveal' ? 'animate-card-flip' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f2ef 50%, #ffffff 100%)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            <div className="p-6 text-center">
              {/* 레벨업 표시 */}
              <div className="mb-3">
                <span className="text-xs font-bold tracking-[0.3em] text-stone-400 uppercase">
                  Level Up
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-stone-300 font-heading">
                    {reward.oldLevel}
                  </span>
                  <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '20px' }}>
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
              <div className="py-4 border-t border-stone-200">
                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-2">
                  New Title
                </p>
                <p className="text-lg font-bold text-stone-800">
                  {displayTitle}
                </p>
              </div>

              {/* XP 표시 */}
              <div className="pt-2 border-t border-stone-200">
                <span className="text-xs text-stone-400">
                  +{reward.xpGained} XP
                </span>
              </div>
            </div>
          </div>

          {/* 탭하여 닫기 */}
          <p className="text-center text-xs text-white/50 mt-4 animate-pulse">
            탭하여 닫기
          </p>
        </div>
      )}
    </div>
  )
}
