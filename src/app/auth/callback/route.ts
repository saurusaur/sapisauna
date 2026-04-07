/**
 * OAuth 콜백 라우트
 * Google OAuth → code 교환 → 세션 생성 → 프로필 유무에 따라 분기
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { captureError } from '@/lib/error-logger'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/home'

  if (code) {
    const supabase = await createServerSupabaseClient()

    // code → session 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      captureError(error, { label: 'Auth Callback code 교환 실패', extra: { status: String(error.status) } })
    }

    if (!error) {
      // 현재 유저 가져오기
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // users 테이블에 프로필 있는지 확인
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // 신규 유저 → 온보딩
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      // 기존 유저 → next 목적지로 이동
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 시 로그인 페이지로 복귀
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
