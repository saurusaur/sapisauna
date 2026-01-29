/**
 * Supabase 클라이언트 설정
 * 이 파일에서 Supabase 연결을 관리합니다.
 */

import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase 클라이언트 생성 (싱글톤 패턴)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
