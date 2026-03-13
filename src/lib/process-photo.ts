/**
 * 배경 사진 전처리 유틸
 *
 * HEIC: 서버 변환 (sharp) 우선 → 실패 시 클라이언트 폴백 (heic2any)
 * 비-HEIC: 클라이언트에서 Canvas 리사이즈
 * 결과: Object URL 반환 (즉시 렌더)
 */

const MAX_SIZE = 1920
const JPEG_QUALITY = 0.85

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ext === 'heic' || ext === 'heif'
}

/** 서버에서 HEIC → JPEG 변환 */
async function convertOnServer(file: File): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/convert-heic', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Server conversion failed: ${res.status}`)
  return res.blob()
}

/** 클라이언트에서 heic2any WASM 변환 (폴백) */
async function convertOnClient(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
  return Array.isArray(result) ? result[0] : result
}

/** Blob → Canvas 리사이즈 → Object URL */
async function resizeToObjectUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  let { width, height } = bitmap

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

  const resized = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', JPEG_QUALITY)
  )
  return URL.createObjectURL(resized)
}

/**
 * 사진 파일 → 최적화된 Object URL
 * HEIC: 서버(~1-2초) → 실패 시 클라이언트 폴백(~5-15초)
 * 비-HEIC: 클라이언트 리사이즈만
 */
export async function processPhoto(file: File): Promise<string> {
  if (isHeic(file)) {
    let jpegBlob: Blob
    try {
      jpegBlob = await convertOnServer(file)
    } catch {
      jpegBlob = await convertOnClient(file)
    }
    return URL.createObjectURL(jpegBlob)
  }

  // 비-HEIC: 리사이즈만
  return resizeToObjectUrl(file)
}
