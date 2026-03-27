/**
 * 리스트 서버 서비스 — Server Component에서 사용 (generateMetadata 등)
 * 공개/unlisted 리스트만 조회 가능
 */

import { createServerSupabaseClient } from './supabase-server'
import type { SaList } from '@/types'

// 리스트 단일 조회 (+ owner 정보) — UUID 또는 slug
export async function getListByIdServer(idOrSlug: string): Promise<SaList | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    const column = isUuid ? 'id' : 'slug'

    const { data, error } = await supabase
      .from('lists')
      .select('*, owner:users!owner_id(nickname)')
      .eq(column, idOrSlug)
      .single()

    if (error || !data) return null

    return {
      ...data,
      owner_nickname: (data.owner as Record<string, unknown>)?.nickname as string | undefined,
      owner: undefined,
    }
  } catch {
    // AbortError, network errors, etc.
    return null
  }
}
