/**
 * 리스트 서버 서비스 — Server Component에서 사용 (generateMetadata 등)
 * 공개/unlisted 리스트만 조회 가능
 */

import { createServerSupabaseClient } from './supabase-server'
import type { SaList } from '@/types'

const SA_PI_OWNER_ID = '23c431c3-9b23-4779-bb27-13472e58090a'

// 리스트 단일 조회 (+ owner 정보) — UUID 또는 slug
export async function getListByIdServer(idOrSlug: string): Promise<SaList | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    const column = isUuid ? 'id' : 'slug'

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq(column, idOrSlug)
      .single()

    if (error || !data) return null

    const { data: profile } = await supabase
      .from('public_profiles')
      .select('nickname, profile_emoji, profile_hue')
      .eq('id', data.owner_id)
      .single()

    const isSaPiList = data.owner_id === SA_PI_OWNER_ID

    return {
      ...data,
      owner_nickname: profile?.nickname || (isSaPiList ? 'SA-PI' : undefined),
      owner_profile_emoji: profile?.profile_emoji ?? (isSaPiList ? '♨️' : undefined),
      owner_profile_hue: profile?.profile_hue,
      owner: undefined,
    }
  } catch {
    // AbortError, network errors, etc.
    return null
  }
}
