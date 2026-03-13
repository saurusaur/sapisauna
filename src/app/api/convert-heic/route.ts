/**
 * HEIC → JPEG 서버 변환 API
 * POST /api/convert-heic  (multipart/form-data, field: "file")
 *
 * HEIC 전용 — 브라우저가 HEIC를 디코딩할 수 없으므로 서버에서 JPEG 변환
 * 비-HEIC는 클라이언트에서 직접 Object URL 사용 (이 API 불필요)
 */
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const MAX_SIZE = 1920
const JPEG_QUALITY = 85

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const jpeg = await sharp(buffer)
      .rotate() // EXIF orientation 자동 보정
      .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('HEIC conversion failed:', err)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
}
