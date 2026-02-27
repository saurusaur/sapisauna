/**
 * Supabase 브라우저 클라이언트 (cookie 기반 세션 관리)
 * 클라이언트 컴포넌트에서 사용
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 싱글톤: 런타임에서만 사용 (빌드 prerender 시에는 호출되지 않음)
export const supabase = createClient()
