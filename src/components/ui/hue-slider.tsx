'use client'

/**
 * HueSlider — 무지개 그라데이션 Hue 슬라이더 + 색 미리보기
 * 채도 75%, 밝기 55% 고정 → 화이트 텍스트 대비 보장
 */

import { hslToHex } from '@/lib/utils'

interface HueSliderProps {
  hue: number
  onChange: (hue: number) => void
}

const RAINBOW_BG = `linear-gradient(to right, ${
  [0, 60, 120, 180, 240, 300, 360].map(h => `hsl(${h},75%,55%)`).join(', ')
})`

export default function HueSlider({ hue, onChange }: HueSliderProps) {
  const hex = hslToHex(hue, 75, 55)

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
        style={{ background: RAINBOW_BG }}
      />
    </div>
  )
}
