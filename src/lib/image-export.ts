/**
 * 이미지 변환 및 공유 유틸리티
 * html-to-image로 DOM → PNG Blob 변환 (브라우저 네이티브 렌더링)
 * Web Share API 또는 다운로드로 내보내기
 */

import { toBlob } from 'html-to-image'

/**
 * DOM 요소를 이미지로 캡처
 * 캡처 대상은 고정 픽셀 크기여야 함
 * 출력: ~1080×1920 (인스타 스토리 규격)
 */
export async function captureCard(element: HTMLElement): Promise<Blob> {
  const scale = 1080 / element.offsetWidth
  const blob = await toBlob(element, {
    width: element.offsetWidth,
    height: element.offsetHeight,
    pixelRatio: scale,
    cacheBust: true,
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
