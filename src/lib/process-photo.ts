/**
 * 배경 사진 전처리 유틸
 *
 * HEIC → createImageBitmap 시도 → 실패 시 heic2any 폴백
 * 리사이즈 (max 1920px) → Object URL 반환 (data URL 대비 즉시 렌더)
 *
 * iOS Safari: HEIC를 자동 JPEG 변환하므로 HEIC 경로 스킵
 * Android Chrome (HEIC 지원): createImageBitmap으로 통과
 * Android Chrome (HEIC 미지원): heic2any WASM 폴백
 */

const MAX_SIZE = 1920
const JPEG_QUALITY = 0.85

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ext === 'heic' || ext === 'heif'
}

/**
 * 사진 파일 → 최적화된 Object URL
 * HEIC 디코딩 + 리사이즈를 단일 Canvas 패스로 처리
 */
export async function processPhoto(file: File): Promise<string> {
  let bitmap: ImageBitmap

  if (isHeic(file)) {
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      const heic2any = (await import('heic2any')).default
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
      const jpegBlob = Array.isArray(blob) ? blob[0] : blob
      bitmap = await createImageBitmap(jpegBlob)
    }
  } else {
    bitmap = await createImageBitmap(file)
  }

  // 리사이즈 계산
  let { width, height } = bitmap
  if (width > MAX_SIZE || height > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // 단일 Canvas 패스 → Blob → Object URL
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', JPEG_QUALITY)
  )

  return URL.createObjectURL(blob)
}
