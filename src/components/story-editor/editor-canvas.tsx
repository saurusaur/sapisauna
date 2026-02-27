/**
 * 에디터 캔버스
 * 9:16 비율, 배경 + 오버레이 + 워터마크 + 스티커 렌더링
 */
'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Watermark } from './sticker-content'
import StickerWrapper from './sticker'
import type { Sticker } from '@/lib/sticker-templates'
import type { LogData } from './sticker-content'

// 배경 상태 타입
export type BackgroundState = {
  type: 'solid'
  color: string
} | {
  type: 'image'
  imageUrl: string
  rawImageUrl?: string  // 원본 이미지 (재크롭용)
  tintHsl: { h: number; s: number; l: number }
  saturation: number  // 0-100
}

interface EditorCanvasProps {
  log: LogData
  nickname?: string
  stickers: Sticker[]
  selectedId: string | null
  background: BackgroundState
  isDragging: boolean
  isCapturing?: boolean
  className?: string
  onStickerSelect: (id: string | null) => void
  onStickerUpdate: (id: string, updates: Partial<Sticker>) => void
  onStickerDelete: (id: string) => void
  onDragStateChange: (isDragging: boolean) => void
}

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>(({
  log,
  nickname,
  stickers,
  selectedId,
  background,
  isDragging,
  isCapturing,
  className,
  onStickerSelect,
  onStickerUpdate,
  onStickerDelete,
  onDragStateChange,
}, ref) => {
  // 실제 캔버스 너비 측정 (드래그 계산에 사용)
  const localRef = useRef<HTMLDivElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState(320)

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    localRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      // forwardRef의 ref는 런타임에서 mutable — 타입만 readonly
      const mutableRef = ref as { current: HTMLDivElement | null }
      mutableRef.current = node
    }
  }, [ref])

  useEffect(() => {
    const el = localRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setMeasuredWidth(w)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 빈 영역 탭 → 선택 해제
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
      onStickerSelect(null)
    }
  }

  // 솔리드 배경색 (이미지 배경일 때는 투명)
  const bgColor = background.type === 'solid' ? background.color : '#000'

  // 사진 틴트 오버레이
  const renderTintOverlay = () => {
    if (background.type !== 'image') return null
    const { h, s, l } = background.tintHsl
    const adjustedS = (s * background.saturation) / 100
    return (
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ backgroundColor: `hsla(${h}, ${adjustedS}%, ${l}%, 0.45)` }}
      />
    )
  }

  return (
    <div className={className || "relative w-full max-w-[320px] mx-auto"}>
      {/* 9:16 캔버스 */}
      <div
        ref={setRefs}
        className="relative w-full rounded-2xl overflow-hidden shadow-xl"
        style={{
          aspectRatio: '9 / 16',
          backgroundColor: bgColor,
        }}
        onClick={handleCanvasClick}
      >
        {/* 사진 배경 — <img> 태그로 렌더링 (data URL/blob URL 모두 안정적) */}
        {background.type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={background.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {renderTintOverlay()}

        {/* 스티커 레이어 */}
        <div className="absolute inset-0 z-[2]" data-canvas="true" onClick={handleCanvasClick}>
          {stickers.map(sticker => (
            <StickerWrapper
              key={sticker.id}
              sticker={sticker}
              log={log}
              nickname={nickname}
              isSelected={selectedId === sticker.id}
              isCapturing={isCapturing}
              canvasWidth={measuredWidth}
              onSelect={() => onStickerSelect(sticker.id)}
              onUpdate={(updates) => onStickerUpdate(sticker.id, updates)}
              onDelete={() => onStickerDelete(sticker.id)}
              onDragStateChange={onDragStateChange}
            />
          ))}
        </div>

        {/* 삭제 존 — 캔버스 내부 좌하단, 드래그 중에만 표시 */}
        {!isCapturing && (
          <div
            className={`absolute left-3 bottom-3 z-[30] flex items-center justify-center
              w-10 h-10 rounded-full bg-red-500/80 transition-all duration-200
              ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
            data-delete-zone="true"
          >
            <span className="material-symbols-outlined text-white text-lg">delete</span>
          </div>
        )}

        {/* 워터마크 (최상위 z-index, 조작 불가) */}
        <Watermark />
      </div>
    </div>
  )
})

EditorCanvas.displayName = 'EditorCanvas'
export default EditorCanvas
