'use client'

/**
 * HueSlider — Hue 슬라이더 + 색 미리보기
 * variant="profile": 맑은 파스텔 (채도 45%, 밝기 78%)
 * variant="list": 마카롱+선명 (채도 62%, 밝기 56%)
 */

import { coverHex, listCoverHex, COVER_TONE, LIST_COVER_TONE } from '@/lib/utils'

interface HueSliderProps {
  hue: number
  onChange: (hue: number) => void
  variant?: 'profile' | 'list'
}

const PROFILE_GRADIENT = `linear-gradient(to right, ${
  [0, 60, 120, 180, 240, 300, 360].map(h => `hsl(${h},${COVER_TONE.s}%,${COVER_TONE.l}%)`).join(', ')
})`

const LIST_GRADIENT = `linear-gradient(to right, ${
  [0, 60, 120, 180, 240, 300, 360].map(h => `hsl(${h},${LIST_COVER_TONE.s}%,${LIST_COVER_TONE.l}%)`).join(', ')
})`

export default function HueSlider({ hue, onChange, variant = 'profile' }: HueSliderProps) {
  const hex = variant === 'list' ? listCoverHex(hue) : coverHex(hue)
  const gradient = variant === 'list' ? LIST_GRADIENT : PROFILE_GRADIENT

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-stone-200 shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <input
        type="range"
        min={0}
        max={360}
        value={hue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-300 [&::-webkit-slider-thumb]:shadow-md"
        style={{ background: gradient }}
      />
    </div>
  )
}
