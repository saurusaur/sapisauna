/**
 * 이미지 변환 및 공유 유틸리티
 * html2canvas로 DOM → Canvas → Blob 변환
 * Web Share API 또는 다운로드로 내보내기
 */

import html2canvas from 'html2canvas'

/**
 * DOM 요소를 9:16 비율 이미지로 캡처
 */
export async function captureCard(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2, // 고해상도
    useCORS: true,
    backgroundColor: null,
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create image blob'))
        }
      },
      'image/png',
      1.0
    )
  })
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
