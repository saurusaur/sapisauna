/**
 * 배경 사진 전처리 유틸
 *
 * 1. HEIC/HEIF → createImageBitmap 시도 → 실패 시 heic2any 폴백
 * 2. Canvas 리사이즈 (max 1920px) + JPEG 0.85 변환
 *
 * iOS Safari: HEIC를 자동 JPEG 변환하므로 1단계 스킵
 * Android Chrome (HEIC 지원): createImageBitmap으로 통과
 * Android Chrome (HEIC 미지원): heic2any WASM 폴백
 */

const MAX_SIZE = 1920
const JPEG_QUALITY = 0.85

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  // 일부 Android는 MIME을 빈 문자열로 전달 — 확장자로 판별
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ext === 'heic' || ext === 'heif'
}

/** HEIC → Blob 변환 (createImageBitmap 우선, 실패 시 heic2any 폴백) */
async function decodeHeic(file: File): Promise<Blob> {
  // A: 브라우저 네이티브 디코딩 시도
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    return new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', JPEG_QUALITY)
    )
  } catch {
    // B: heic2any 폴백 (dynamic import — 필요시만 로드)
    const heic2any = (await import('heic2any')).default
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
    return Array.isArray(result) ? result[0] : result
  }
}

/** 이미지 Blob → Canvas 리사이즈 + JPEG data URL */
async function resizeToDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  let { width, height } = bitmap

  // max 1920px로 축소
  if (width > MAX_SIZE || height > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

/**
 * 사진 파일 → 최적화된 JPEG data URL
 * HEIC 변환 + 리사이즈 + 압축을 한 번에 처리
 */
export async function processPhoto(file: File): Promise<string> {
  let blob: Blob = file

  if (isHeic(file)) {
    blob = await decodeHeic(file)
  }

  return resizeToDataUrl(blob)
}
