/**
 * 개별 스티커 래퍼
 * 드래그(이동) + 핀치(크기조절) + 선택/해제 처리
 * 하이브리드 렌더링: graph 스티커만 사전 캡처 PNG, 나머지는 라이브 React 컴포넌트
 */
'use client'

import { useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import StickerContent from './sticker-content'
import type { Sticker } from '@/lib/sticker-templates'
import type { LogData } from './sticker-content'

interface StickerWrapperProps {
  sticker: Sticker
  log: LogData
  nickname?: string
  isSelected: boolean
  isCapturing?: boolean
  canvasWidth: number
  onSelect: () => void
  onUpdate: (updates: Partial<Sticker>) => void
  onDelete: () => void
  onDragStateChange: (isDragging: boolean) => void
}

export default function StickerWrapper({
  sticker,
  log,
  nickname,
  isSelected,
  isCapturing,
  canvasWidth,
  onSelect,
  onUpdate,
  onDelete,
  onDragStateChange,
}: StickerWrapperProps) {
  const stickerRef = useRef<HTMLDivElement>(null)
  const [localX, setLocalX] = useState(sticker.x)
  const [localY, setLocalY] = useState(sticker.y)
  const [localScale, setLocalScale] = useState(sticker.scale)
  const [isDragging, setIsDragging] = useState(false)

  const canvasHeight = (canvasWidth * 16) / 9

  const bind = useGesture(
    {
      onDrag: ({ first, movement: [mx, my], memo, tap, event }) => {
        event.stopPropagation()

        if (tap) {
          onSelect()
          return memo
        }

        if (first) {
          setIsDragging(true)
          onDragStateChange(true)
          return { startX: localX, startY: localY }
        }

        const startX = memo?.startX ?? localX
        const startY = memo?.startY ?? localY
        const dx = (mx / canvasWidth) * 100
        const dy = (my / canvasHeight) * 100
        setLocalX(Math.max(5, Math.min(95, startX + dx)))
        setLocalY(Math.max(3, Math.min(97, startY + dy)))

        return memo
      },
      onDragEnd: ({ tap }) => {
        if (tap) return

        setIsDragging(false)
        onDragStateChange(false)

        // 삭제 존 체크
        const deleteZone = document.querySelector('[data-delete-zone]')
        if (deleteZone && stickerRef.current) {
          const dzRect = deleteZone.getBoundingClientRect()
          const sRect = stickerRef.current.getBoundingClientRect()
          const cx = sRect.left + sRect.width / 2
          const cy = sRect.top + sRect.height / 2
          if (cx >= dzRect.left - 20 && cx <= dzRect.right + 20 &&
              cy >= dzRect.top - 20 && cy <= dzRect.bottom + 20) {
            onDelete()
            return
          }
        }

        onUpdate({ x: localX, y: localY })
      },
      onPinch: ({ offset: [scale], event }) => {
        event.stopPropagation()
        setLocalScale(Math.max(0.3, Math.min(3, scale)))
      },
      onPinchEnd: () => {
        onUpdate({ scale: localScale })
      },
    },
    {
      drag: { filterTaps: true, threshold: 3 },
      pinch: { scaleBounds: { min: 0.3, max: 3 }, from: () => [localScale, 0] },
    }
  )

  const rotateStyle = sticker.rotation ? `rotate(${sticker.rotation}deg)` : ''

  return (
    <div
      ref={stickerRef}
      {...bind()}
      className="absolute touch-none select-none"
      style={{
        left: `${localX}%`,
        top: `${localY}%`,
        transform: `translate(-50%, -50%) scale(${localScale}) ${rotateStyle}`,
        zIndex: isSelected ? 20 : 10,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* 선택 외곽선 — 캡처 시 숨김 */}
      {isSelected && !isCapturing && (
        <div className="absolute inset-[-6px] border border-dashed border-white/50 rounded-lg pointer-events-none" />
      )}

      {/* 하이브리드 렌더링: graph+imageUrl → 정적 이미지, 나머지 → 라이브 컴포넌트 */}
      {sticker.type === 'graph' && sticker.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sticker.imageUrl}
          alt=""
          className="pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="pointer-events-none">
          <StickerContent
            type={sticker.type}
            log={log}
            nickname={nickname}
            text={sticker.text}
          />
        </div>
      )}
    </div>
  )
}
