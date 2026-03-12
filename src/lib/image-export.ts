/**
 * 이미지 변환 및 공유 유틸리티
 * modern-screenshot으로 DOM → PNG Blob 변환
 * Web Share API 또는 다운로드로 내보내기
 */

import { domToBlob } from 'modern-screenshot'

/**
 * DOM 요소를 이미지로 캡처
 * 카드는 1080×1920 고정 크기 — style 오버라이드로 scale 해제 후 캡처
 */
export async function captureCard(element: HTMLElement): Promise<Blob> {
  const blob = await domToBlob(element, {
    width: 1080,
    height: 1920,
    scale: 1,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      position: 'relative',
      top: 'auto',
      left: 'auto',
    },
  })

  if (!blob) {
    throw new Error('Failed to create image blob')
  }

  return blob
}

/**
 * Web Share API로 이미지 공유
 * 미지원 브라우저에서는 다운로드로 폴백
 */
export async function shareImage(blob: Blob, title: string): Promise<void> {
  const file = new File([blob], `${title}.png`, { type: 'image/png' })

  // Web Share API 지원 여부 확인
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title,
      files: [file],
    })
  } else {
    // 폴백: 다운로드
    downloadImage(blob, `${title}.png`)
  }
}

/**
 * 이미지 파일 다운로드
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
