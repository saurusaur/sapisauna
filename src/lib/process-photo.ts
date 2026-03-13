/**
 * 배경 사진 전처리 유틸
 *
 * HEIC: 서버(sharp) 변환 필수 (브라우저가 HEIC 디코딩 불가)
 * 비-HEIC: Object URL 즉시 반환 (프리뷰는 CSS cover, export는 Canvas drawImage가 리사이즈)
 */

/** 서버에서 HEIC → JPEG 변환 */
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
 * HEIC: 서버 변환(~1-2초) → 실패 시 클라이언트 WASM 폴백
 * 비-HEIC: 즉시 반환 (~0ms)
 */
export async function processPhoto(file: File): Promise<string> {
  console.log(`[processPhoto] 시작 — ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB, type: ${file.type})`)
  const t0 = performance.now()

  if (isHeic(file)) {
    let blob: Blob
    try {
      console.log('[processPhoto] HEIC → 서버 전송 중...')
      const t1 = performance.now()
      blob = await convertOnServer(file)
      console.log(`[processPhoto] 서버 변환 완료 — ${((performance.now() - t1) / 1000).toFixed(1)}초`)
    } catch (err) {
      console.error('[processPhoto] 서버 실패, 클라이언트 폴백:', err)
      const t2 = performance.now()
      blob = await convertHeicOnClient(file)
      console.log(`[processPhoto] 클라이언트 변환 완료 — ${((performance.now() - t2) / 1000).toFixed(1)}초`)
    }
    console.log(`[processPhoto] 총 ${((performance.now() - t0) / 1000).toFixed(1)}초`)
    return URL.createObjectURL(blob)
  }

  console.log(`[processPhoto] 비-HEIC → 즉시 반환`)
  return URL.createObjectURL(file)
}
