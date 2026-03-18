/**
 * 배경 사진 전처리 유틸
 *
 * HEIC: 클라이언트 WASM 변환 (heic2any, ~3-8초)
 *       Vercel Serverless의 sharp는 HEIC 코덱 미포함으로 서버 변환 불가
 * 비-HEIC: Object URL 즉시 반환 (프리뷰는 CSS cover, export는 Canvas drawImage가 리사이즈)
 */

/** 클라이언트 HEIC → JPEG 변환 (heic2any WASM) */
async function convertHeic(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  return Array.isArray(result) ? result[0] : result
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ext === 'heic' || ext === 'heif'
}

/**
 * 사진 파일 → Object URL
 * HEIC: 클라이언트 WASM 변환 (~3-8초)
 * 비-HEIC: 즉시 반환 (~0ms)
 */
export async function processPhoto(file: File): Promise<string> {
  console.time('📸 processPhoto 전체')
  console.log(`📸 원본: ${file.name}, ${(file.size / 1024 / 1024).toFixed(1)}MB, ${file.type}`)

  if (isHeic(file)) {
    console.time('📸 HEIC→JPEG 변환 (heic2any WASM)')
    const blob = await convertHeic(file)
    console.timeEnd('📸 HEIC→JPEG 변환 (heic2any WASM)')
    console.log(`📸 변환 결과: ${(blob.size / 1024 / 1024).toFixed(1)}MB`)
    console.timeEnd('📸 processPhoto 전체')
    return URL.createObjectURL(blob)
  }

  console.log('📸 비-HEIC: 변환 불필요')
  console.timeEnd('📸 processPhoto 전체')
  return URL.createObjectURL(file)
}
