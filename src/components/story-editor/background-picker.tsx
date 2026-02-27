/**
 * 배경 선택 바텀시트
 * 3 코어 옵션 (기본/트라이브/사진) + 모듈식 테마 슬롯
 * 사진 배경 시 채도 슬라이더 + 재크롭 버튼 포함
 */
'use client'

import { useRef } from 'react'
import { APP_BG_COLOR, TRIBE_BG_MAP } from '@/lib/sticker-templates'
import { getActiveThemes } from '@/lib/themed-backgrounds'
import type { BackgroundState } from './editor-canvas'

interface BackgroundPickerProps {
  isOpen: boolean
  onClose: () => void
  background: BackgroundState
  onBackgroundChange: (bg: BackgroundState) => void
  onCropRequest: (imageUrl: string) => void
  tribeId: string
  tintHsl: { h: number; s: number; l: number }
}

export default function BackgroundPicker({
  isOpen,
  onClose,
  background,
  onBackgroundChange,
  onCropRequest,
  tribeId,
  tintHsl,
}: BackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeThemes = getActiveThemes()

  const handleSolidColor = (color: string) => {
    onBackgroundChange({ type: 'solid', color })
    onClose()
  }

  const handleImageSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    onCropRequest(url)
    onClose()
  }

  const handlePhotoInput = () => {
    fileInputRef.current?.click()
  }

  // 재크롭: 원본 이미지로 크롭 모달 다시 열기
  const handleRecrop = () => {
    if (background.type === 'image' && background.rawImageUrl) {
      onCropRequest(background.rawImageUrl)
      onClose()
    }
  }

  // 테마 이미지 배경 적용
  const handleThemedBg = (imageUrl: string) => {
    onBackgroundChange({
      type: 'image',
      imageUrl,
      tintHsl: { h: 0, s: 0, l: 0 },
      saturation: 0,
    })
    onClose()
  }

  const tribeBg = TRIBE_BG_MAP[tribeId] || '#c25c4a'
  // 기본 색상이 현재 선택인지 확인
  const isAppBgSelected = background.type === 'solid' && background.color === APP_BG_COLOR
  const isTribeBgSelected = background.type === 'solid' && background.color === tribeBg
  const isPhotoSelected = background.type === 'image' && !activeThemes.some(t => t.imageUrl === (background as { imageUrl: string }).imageUrl)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 rounded-t-2xl
        animate-slide-up">
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-stone-600 rounded-full" />
        </div>

        <div className="px-4 pb-6">
          <h3 className="text-white/80 text-sm font-medium mb-4 text-center">배경</h3>

          {/* 코어 옵션 3개 */}
          <div className="flex gap-3 mb-4">
            {/* 1. 기본 (앱 브랜드 컬러) */}
            <button
              onClick={() => handleSolidColor(APP_BG_COLOR)}
              className={`flex flex-col items-center gap-1.5 transition-all ${isAppBgSelected ? 'scale-105' : ''}`}
            >
              <div
                className={`w-12 h-12 rounded-full border-2 transition-all
                  ${isAppBgSelected ? 'border-white' : 'border-transparent hover:border-white/40'}`}
                style={{ backgroundColor: 'var(--color-green)' }}
              />
              <span className="text-white/50 text-[10px]">기본</span>
            </button>

            {/* 2. 트라이브 */}
            <button
              onClick={() => handleSolidColor(tribeBg)}
              className={`flex flex-col items-center gap-1.5 transition-all ${isTribeBgSelected ? 'scale-105' : ''}`}
            >
              <div
                className={`w-12 h-12 rounded-full border-2 transition-all
                  ${isTribeBgSelected ? 'border-white' : 'border-transparent hover:border-white/40'}`}
                style={{ backgroundColor: tribeBg }}
              />
              <span className="text-white/50 text-[10px]">트라이브</span>
            </button>

            {/* 테마 슬롯 (활성 테마가 있을 때만) */}
            {activeThemes.map(theme => {
              const isSelected = background.type === 'image' && (background as { imageUrl: string }).imageUrl === theme.imageUrl
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemedBg(theme.imageUrl)}
                  className={`flex flex-col items-center gap-1.5 transition-all ${isSelected ? 'scale-105' : ''}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all
                      ${isSelected ? 'border-white' : 'border-transparent hover:border-white/40'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.imageUrl} alt={theme.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white/50 text-[10px]">{theme.label}</span>
                </button>
              )
            })}

            {/* 3. 사진 */}
            <button
              onClick={handlePhotoInput}
              className={`flex flex-col items-center gap-1.5 transition-all ${isPhotoSelected ? 'scale-105' : ''}`}
            >
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all
                  ${isPhotoSelected
                    ? 'border-white bg-stone-700'
                    : 'border-stone-600 hover:border-white/40 bg-stone-800'
                  }`}
              >
                <span className="material-symbols-outlined text-white/60 text-lg">add_photo_alternate</span>
              </div>
              <span className="text-white/50 text-[10px]">사진</span>
            </button>
          </div>

          {/* 사진 배경일 때: 재크롭 버튼 + 채도 슬라이더 */}
          {background.type === 'image' && isPhotoSelected && (
            <div className="mt-2 space-y-4">
              {/* 재크롭 버튼 */}
              {background.rawImageUrl && (
                <button
                  onClick={handleRecrop}
                  className="w-full py-2.5 rounded-xl border border-stone-600 text-white/70 text-sm
                    flex items-center justify-center gap-2 hover:border-stone-400 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">crop</span>
                  크롭 조정
                </button>
              )}

              {/* 채도 슬라이더 */}
              <div>
                <p className="text-white/40 text-[11px] tracking-wider uppercase mb-2">틴트 채도</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={background.saturation}
                  onChange={(e) => {
                    onBackgroundChange({
                      ...background,
                      saturation: Number(e.target.value),
                    })
                  }}
                  className="w-full accent-white/60"
                />
                <div className="flex justify-between text-white/30 text-[10px] mt-1">
                  <span>무채색</span>
                  <span>풀 컬러</span>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageSelect(file)
            }}
          />
        </div>
      </div>
    </>
  )
}
