/**
 * 배경 사진 전처리 유틸
 *
 * HEIC: 서버(sharp) 우선 → 실패 시 클라이언트 WASM 폴백
 * 비-HEIC: 클라이언트 Canvas 리사이즈 (서버 불필요, ~100-300ms)
 * 결과: Object URL 반환 (즉시 렌더)
 */

const MAX_SIZE = 1920
const JPEG_QUALITY = 0.85

/** 서버에서 리사이즈 + JPEG 변환 (HEIC/JPG/PNG 모두 지원) */
async function convertOnServer(file: File): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/convert-heic', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Server conversion failed: ${res.status}`)
  return res.blob()
}

/** 클라이언트 폴백: HEIC → heic2any WASM 변환 */
async function convertHeicOnClient(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
  return Array.isArray(result) ? result[0] : result
}

/** 클라이언트 폴백: 비-HEIC → Canvas 리사이즈 */
async function resizeOnClient(blob: Blob): Promise<Blob> {
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

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', JPEG_QUALITY)
  )
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ext === 'heic' || ext === 'heif'
}

/**
 * 사진 파일 → 최적화된 Object URL
 * HEIC: 서버(~1-2초) → 실패 시 클라이언트 WASM(~5-15초)
 * 비-HEIC: 클라이언트 Canvas 리사이즈(~100-300ms)
 */
export async function processPhoto(file: File): Promise<string> {
  if (isHeic(file)) {
    // HEIC → 서버 변환 우선, 실패 시 클라이언트 폴백
    let blob: Blob
    try {
      blob = await convertOnServer(file)
    } catch {
      blob = await convertHeicOnClient(file)
    }
    return URL.createObjectURL(blob)
  }

  // 비-HEIC → 클라이언트 Canvas 리사이즈 (서버 왕복 불필요)
  const blob = await resizeOnClient(file)
  return URL.createObjectURL(blob)
}
