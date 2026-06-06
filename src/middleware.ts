/**
 * Next.js Middleware — 라우트 보호
 * 공개 라우트 외에는 인증 필요 → 미인증 시 /login?next={pathname}
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 공개 라우트 패턴 (미인증 접근 허용)
const publicRoutes = [
  '/login',
  '/auth/callback',
  '/api',
  '/explore',
  '/home',
  '/sa-list',
]

// 정적 파일 패턴
const staticPaths = ['/_next/', '/favicon.ico', '/manifest.json', '/icons/']

function isPublicRoute(pathname: string): boolean {
  // 정적 파일
  if (staticPaths.some(p => pathname.startsWith(p))) return true
  // 루트
  if (pathname === '/') return true
  // 공개 라우트
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 라우트 → 패스
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Supabase 세션 확인 (cookie 기반)
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase 에러 시 미인증과 동일 처리
  }

  if (!user) {
    // 미인증 → 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // 정적 파일과 _next 제외
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|logo/).*)',
  ],
}
