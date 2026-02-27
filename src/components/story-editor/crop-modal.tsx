/**
 * 사진 크롭 모달
 * react-easy-crop 기반, 9:16 고정비 크롭
 */
'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Area, CropperProps } from 'react-easy-crop'

// react-easy-crop은 DOM API 사용 → SSR 방지를 위해 dynamic import
const Cropper = dynamic(() => import('react-easy-crop'), { ssr: false }) as React.ComponentType<Partial<CropperProps> & { image: string }>

interface CropModalProps {
  imageUrl: string
  onConfirm: (croppedUrl: string) => void
  onCancel: () => void
}

export default function CropModal({ imageUrl, onConfirm, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea || isProcessing) return
    setIsProcessing(true)

    try {
      const croppedUrl = await getCroppedImage(imageUrl, croppedArea)
      onConfirm(croppedUrl)
    } catch {
      // 크롭 실패 시 원본 이미지 그대로 사용
      onConfirm(imageUrl)
    } finally {
      setIsProcessing(false)
    }
  }

  // 크롭 건너뛰기 — 원본 이미지 그대로 적용
  const handleSkip = () => {
    onConfirm(imageUrl)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onCancel} className="text-white/70 p-2">
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="text-white text-sm">크롭</span>
        <div className="flex items-center gap-2">
          <button onClick={handleSkip} className="text-white/50 p-2 text-xs">
            건너뛰기
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="text-white font-medium p-2 text-sm disabled:opacity-50"
          >
            {isProcessing ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>

      {/* 크롭 영역 */}
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={9 / 16}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* 줌 슬라이더 */}
      <div className="px-8 py-4">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-white/60"
        />
      </div>
    </div>
  )
}

/**
 * canvas로 이미지 크롭 수행
 * blob URL / data URL 모두 지원
 */
async function getCroppedImage(imageSrc: string, cropArea: Area): Promise<string> {
  const image = new Image()
  // blob URL은 crossOrigin 설정하면 로드 실패 — 설정하지 않음
  image.src = imageSrc

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image load failed'))
    // 이미 로드된 경우 (캐시)
    if (image.complete && image.naturalWidth > 0) resolve()
  })

  const canvas = document.createElement('canvas')
  // 출력 크기를 적당히 제한 (인스타 스토리 규격)
  const maxWidth = 1080
  const scale = Math.min(maxWidth / cropArea.width, 1)
  canvas.width = cropArea.width * scale
  canvas.height = cropArea.height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context failed')

  ctx.drawImage(
    image,
    cropArea.x, cropArea.y,
    cropArea.width, cropArea.height,
    0, 0,
    canvas.width, canvas.height,
  )

  return canvas.toDataURL('image/jpeg', 0.85)
}
