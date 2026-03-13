/**
 * HEIC → JPEG 서버 변환 API
 * POST /api/convert-heic  (multipart/form-data, field: "file")
 *
 * sharp 네이티브 바이너리로 변환 — 클라이언트 WASM 대비 10-30배 빠름
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
