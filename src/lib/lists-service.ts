/**
 * 리스트 서비스 — Supabase lists + list_items + list_subscriptions 연동
 */

import { supabase } from './supabase'
import { nanoid } from 'nanoid'
import { toPlace } from './places-service'
import { grantReward, checkPlaceInListMilestone, checkSubscriberMilestones } from './reward-service'
import type { SaList, ListItem, ListType, ListVisibility } from '@/types'

const SA_PI_OWNER_ID = '23c431c3-9b23-4779-bb27-13472e58090a'

// 공개 리스트용 짧은 slug 생성 (8자리)
function generateSlug(): string {
  return nanoid(8)
}

// UUID 패턴 판별 (slug는 nanoid 8자리라 이 패턴에 매칭되지 않음)
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// slug 또는 UUID → 실제 list UUID 해석.
// 공유 링크는 slug(nanoid 8자리)를 쓰므로, UUID 컬럼 쿼리 전에 반드시 해석해야 함.
async function resolveListId(idOrSlug: string): Promise<string | null> {
  if (isUuid(idOrSlug)) return idOrSlug
  const { data, error } = await supabase
    .from('lists')
    .select('id')
    .eq('slug', idOrSlug)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return (data as { id: string }).id
}

// ─── 리스트 CRUD ───

// 내 리스트 전체 조회 (default 포함)
export async function getMyLists(userId: string): Promise<SaList[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', userId)
    .order('type', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw error
  const lists = data || []

  // 구독자 마일스톤 lazy 체크 (안내자/촌장/사플루언서) — 실패는 무시
  checkSubscriberMilestones(userId, lists).catch(() => {})

  return lists
}

// 내 기본 저장 리스트 조회 (좋아요 역할)
export async function getDefaultList(userId: string): Promise<SaList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', userId)
    .eq('type', 'default')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export type PublicListSort = 'popular' | 'recent'

type PublicProfile = {
  id: string
  nickname: string | null
  profile_emoji: string | null
  profile_hue: number | null
}

function mapListWithOwner(row: Record<string, unknown>, profile?: PublicProfile): SaList {
  const owner = row.owner as Record<string, unknown> | null
  const isSaPiList = row.owner_id === SA_PI_OWNER_ID
  return {
    ...row,
    owner_nickname: profile?.nickname || (owner?.nickname as string | undefined) || (isSaPiList ? 'SA-PI' : undefined),
    owner_profile_emoji: profile?.profile_emoji ?? (owner?.profile_emoji as string | null | undefined) ?? (isSaPiList ? '♨️' : undefined),
    owner_profile_hue: profile?.profile_hue ?? (owner?.profile_hue as number | null | undefined),
    owner: undefined,
  } as unknown as SaList
}

async function hydrateListOwners(rows: Record<string, unknown>[]): Promise<SaList[]> {
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id as string).filter(Boolean)))
  if (ownerIds.length === 0) return rows.map((row) => mapListWithOwner(row))

  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, nickname, profile_emoji, profile_hue')
    .in('id', ownerIds)

  if (error) throw error

  const profiles = new Map<string, PublicProfile>(
    ((data || []) as PublicProfile[]).map((profile) => [profile.id, profile])
  )

  return rows.map((row) => mapListWithOwner(row, profiles.get(row.owner_id as string)))
}

// 공개 리스트 피드 — popular: 구독순, recent: 최근 수정순, search: 제목/태그 검색
export async function getPublicLists(
  limit = 20,
  offset = 0,
  sort: PublicListSort = 'popular',
  search?: string
): Promise<SaList[]> {
  let q = supabase
    .from('lists')
    .select('*')
    .eq('visibility', 'public')

  if (search && search.trim().length >= 2) {
    const term = search.trim()
    // 제목 ILIKE 또는 태그 포함 검색
    q = q.or(`title.ilike.%${term}%,tags.cs.{${term}}`)
  }

  if (sort === 'popular') {
    q = q.order('subscriber_count', { ascending: false }).order('updated_at', { ascending: false })
  } else {
    q = q.order('updated_at', { ascending: false })
  }

  const { data, error } = await q.range(offset, offset + limit - 1)

  if (error) throw error
  return hydrateListOwners((data || []) as Record<string, unknown>[])
}

// 인기 태그 조회 (RPC)
export async function getPopularTags(limitCount = 10): Promise<{ tag: string; count: number }[]> {
  const { data, error } = await supabase.rpc('get_popular_tags', { limit_count: limitCount })
  if (error) throw error
  return (data || []) as { tag: string; count: number }[]
}

/**
 * 어드민 전용: 리스트 추천(is_featured) 토글.
 * RLS가 owner-only이므로 toggle_featured RPC (SECURITY DEFINER) 경유.
 * 서버측에서 auth.uid() 어드민 체크 → 권한 없으면 RPC에서 exception throw.
 */
export async function toggleAdminFeatured(listId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_featured', { target_list_id: listId })
  if (error) throw error
}

/** 큐레이션 캐러셀 전용 — is_featured 공개 리스트만 */
export async function getFeaturedPublicLists(): Promise<SaList[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('visibility', 'public')
    .eq('is_featured', true)
    .order('subscriber_count', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return hydrateListOwners((data || []) as Record<string, unknown>[])
}

// 리스트 단일 조회 (+ owner 정보) — UUID 또는 slug로 조회
export async function getListById(idOrSlug: string): Promise<SaList | null> {
  // UUID 패턴이면 id로, 아니면 slug로 조회
  const column = isUuid(idOrSlug) ? 'id' : 'slug'

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq(column, idOrSlug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  const [list] = await hydrateListOwners([data as Record<string, unknown>])
  return list
}

// 리스트 생성
export async function createList(params: {
  owner_id: string
  title: string
  description?: string
  type?: ListType
  visibility?: ListVisibility
  cover_hue?: number | null
  cover_emoji?: string | null
  tags?: string[]
  creator_links?: Record<string, string>
}): Promise<SaList> {
  const visibility = params.visibility || 'private'
  const { data, error } = await supabase
    .from('lists')
    .insert({
      owner_id: params.owner_id,
      type: params.type || 'user',
      title: params.title,
      description: params.description || null,
      visibility,
      cover_hue: params.cover_hue ?? null,
      cover_emoji: params.cover_emoji ?? null,
      slug: visibility !== 'private' ? generateSlug() : null,
      tags: params.tags || [],
      ...(params.creator_links ? { creator_links: params.creator_links } : {}),
    })
    .select()
    .single()

  if (error) {
    // 같은 유저 내 리스트명 중복 (UNIQUE 제약 위반)
    if (error.code === '23505') throw new Error('이미 같은 이름의 리스트가 있어요')
    throw error
  }

  // user-type 리스트 생성 시만 XP/마일스톤 (default 자동생성 제외)
  if ((params.type || 'user') === 'user') {
    grantReward('list_created').catch(() => {})
  }

  return data
}

// 리스트 수정 (visibility 전환 시 slug 자동 생성)
// ⚠️ is_featured는 owner-only RLS에 막히므로 toggleAdminFeatured() RPC로 처리
export async function updateList(
  id: string,
  updates: Partial<Pick<SaList, 'title' | 'description' | 'visibility' | 'is_pinned' | 'cover_hue' | 'cover_emoji' | 'tags' | 'creator_links'>>
): Promise<SaList> {
  const updatePayload: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  // unlisted/public 전환 시 slug가 없으면 생성
  if (updates.visibility && updates.visibility !== 'private') {
    const { data: existing } = await supabase
      .from('lists').select('slug').eq('id', id).single()
    if (!existing?.slug) {
      updatePayload.slug = generateSlug()
    }
  }

  const { data, error } = await supabase
    .from('lists')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 리스트 삭제
export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── 리스트 아이템 ───

// 리스트 내 장소 목록 (장소 정보 JOIN)
export async function getListItems(idOrSlug: string): Promise<ListItem[]> {
  // 공유 링크는 slug로 들어오므로 UUID로 해석 후 조회 (slug를 list_id에 직접 넣으면 uuid 캐스팅 에러)
  const listId = await resolveListId(idOrSlug)
  if (!listId) return []

  // 큐레이터 순서(sort_order) 우선, 미지정(null)은 추가순으로 뒤에
  const { data, error } = await supabase
    .from('list_items')
    .select('*, place:places!place_id(*, place_sources(*))')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    place: item.place ? toPlace(item.place as Record<string, unknown>) : null,
  }))
}

// 장소를 리스트에 추가 + place_count 업데이트
export async function addPlaceToList(listId: string, placeId: string, memo?: string): Promise<ListItem> {
  // 새 장소는 맨 뒤 순서로 (sort_order = 현재 개수)
  const nextOrder = await countPlaces(listId)
  const { data, error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, place_id: placeId, memo: memo || null, sort_order: nextOrder })
    .select()
    .single()

  if (error) throw error

  // place_count + updated_at 업데이트
  const newCount = await countPlaces(listId)
  await supabase
    .from('lists')
    .update({ place_count: newCount, updated_at: new Date().toISOString() })
    .eq('id', listId)

  // 백과사전 마일스톤 — owner 본인이 추가한 경우만
  if (newCount >= 30) {
    const { data: list } = await supabase.from('lists').select('owner_id').eq('id', listId).single()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (list?.owner_id && authUser?.id === list.owner_id) {
      checkPlaceInListMilestone(list.owner_id, newCount).catch(() => {})
    }
  }

  return data
}

// 리스트에서 장소 제거 + place_count 업데이트 + visibility 강등
export async function removePlaceFromList(listId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('place_id', placeId)

  if (error) throw error

  const newCount = await countPlaces(listId)
  const updates: Record<string, unknown> = {
    place_count: newCount,
    updated_at: new Date().toISOString(),
  }
  // 공개 리스트가 3개 미만이면 unlisted로 강등 (링크 접근 유지)
  if (newCount < 3) {
    const { data: list } = await supabase.from('lists').select('visibility').eq('id', listId).single()
    if (list?.visibility === 'public') updates.visibility = 'unlisted'
  }
  await supabase.from('lists').update(updates).eq('id', listId)
}

// 리스트 내 장소 수 조회 (정확한 COUNT)
async function countPlaces(listId: string): Promise<number> {
  const { count } = await supabase
    .from('list_items')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)
  return count ?? 0
}

// 큐레이터 순서 변경 — 정렬된 item id 배열을 받아 sort_order를 0부터 재부여
export async function reorderListItems(listId: string, orderedItemIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabase
        .from('list_items')
        .update({ sort_order: index })
        .eq('id', itemId)
        .eq('list_id', listId)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

// 장소별 메모 수정
export async function updateListItemMemo(listId: string, placeId: string, memo: string | null): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .update({ memo })
    .eq('list_id', listId)
    .eq('place_id', placeId)

  if (error) throw error
}

// 특정 장소가 들어있는 내 리스트 ID 목록 (하트 상태 + 스낵바용)
export async function getListsContainingPlace(userId: string, placeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('list_items')
    .select('list_id, lists!inner(owner_id)')
    .eq('place_id', placeId)
    .eq('lists.owner_id', userId)

  if (error) throw error
  return (data || []).map((row) => row.list_id)
}

// 특정 장소가 포함된 공개 리스트 (구독자수 desc, owner 정보 포함)
export async function getPublicListsContainingPlace(placeId: string, limit = 10): Promise<SaList[]> {
  const { data, error } = await supabase
    .from('list_items')
    .select('list:lists!inner(*)')
    .eq('place_id', placeId)
    .eq('lists.visibility', 'public')
    .order('subscriber_count', { foreignTable: 'lists', ascending: false })
    .order('updated_at', { foreignTable: 'lists', ascending: false })
    .limit(limit)

  if (error) throw error
  const rows = (data || []).map((row) => (row.list as unknown) as Record<string, unknown>)
  return hydrateListOwners(rows)
}

// 여러 장소가 들어있는 내 리스트 ID 목록 (배치)
export async function getListsContainingPlaces(userId: string, placeIds: string[]): Promise<Record<string, string[]>> {
  if (placeIds.length === 0) return {}

  const { data, error } = await supabase
    .from('list_items')
    .select('place_id, list_id, lists!inner(owner_id)')
    .in('place_id', placeIds)
    .eq('lists.owner_id', userId)

  if (error) throw error

  const result: Record<string, string[]> = {}
  for (const pid of placeIds) result[pid] = []
  for (const row of data || []) {
    result[row.place_id].push(row.list_id)
  }
  return result
}

// ─── 구독 ───

// 리스트 구독 토글
export async function toggleSubscription(_userId: string, idOrSlug: string): Promise<boolean> {
  // 공유 링크는 slug로 들어오므로 UUID로 해석 후 RPC 호출
  const listId = await resolveListId(idOrSlug)
  if (!listId) throw new Error('리스트를 찾을 수 없어요')

  const { data, error } = await supabase.rpc('toggle_list_subscription', {
    target_list_id: listId,
  })

  if (error) throw error
  return Boolean(data)
}

// 내가 구독한 리스트 목록
export async function getSubscribedLists(userId: string): Promise<SaList[]> {
  const { data, error } = await supabase
    .from('list_subscriptions')
    .select('list:lists!list_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data || []).map((row) => row.list as unknown as Record<string, unknown>)
  return hydrateListOwners(rows)
}

// 특정 리스트 구독 여부 확인
export async function isSubscribed(userId: string, idOrSlug: string): Promise<boolean> {
  // 공유 링크는 slug로 들어오므로 UUID로 해석 후 조회
  const listId = await resolveListId(idOrSlug)
  if (!listId) return false

  const { data } = await supabase
    .from('list_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('list_id', listId)
    .single()

  return !!data
}

// ─── 통계 ───

// 장소별 고유 유저 저장 횟수 (SQL RPC — N+1 방지)
export async function getPlaceSaveCounts(placeIds: string[]): Promise<Record<string, number>> {
  if (placeIds.length === 0) return {}

  const { data, error } = await supabase
    .rpc('get_place_save_counts', { place_ids: placeIds })

  if (error) throw error

  const result: Record<string, number> = {}
  for (const row of data || []) {
    result[row.place_id] = Number(row.save_count)
  }
  return result
}
