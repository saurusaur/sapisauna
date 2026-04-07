/**
 * 이모지 데이터 프록시 — emojibase 데이터에서 불필요 그룹 제거
 * Frimousse emojibaseUrl="/api/emoji" → /api/emoji/ko/data.json 등으로 요청됨
 * 제거: group 1(사람/몸), 8(기호), 9(깃발)
 */

import { NextResponse } from 'next/server'

const HIDDEN_GROUPS = [1, 8, 9]
const EMOJIBASE_CDN = 'https://cdn.jsdelivr.net/npm/emojibase-data@latest'

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  const subpath = params.path.join('/')

  try {
    const res = await fetch(`${EMOJIBASE_CDN}/${subpath}`, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return new NextResponse(res.body, { status: res.status })
    }

    // data.json만 필터링, 나머지(messages.json 등)는 패스스루
    if (subpath.endsWith('data.json')) {
      const data = await res.json()
      const filtered = data.filter(
        (e: { group?: number }) => !('group' in e && HIDDEN_GROUPS.includes(e.group!))
      )
      return NextResponse.json(filtered, {
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
      })
    }

    // messages.json 등 그대로 전달
    const body = await res.text()
    return new NextResponse(body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  const subpath = params.path.join('/')

  try {
    const res = await fetch(`${EMOJIBASE_CDN}/${subpath}`, { method: 'HEAD' })
    const originEtag = res.headers.get('ETag') || ''
    // data.json은 필터링하므로 ETag를 변경하여 캐시 무효화
    const etag = subpath.endsWith('data.json') && originEtag
      ? `"filtered-${originEtag.replace(/"/g, '')}"`
      : originEtag
    return new NextResponse(null, {
      status: res.status,
      headers: { ETag: etag },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
