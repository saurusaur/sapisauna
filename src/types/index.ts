/**
 * 타입 정의
 */

// 공용 데이터 로딩 상태 타입 (use-logs, use-places 등에서 공유)
export interface UseDataState<T> {
  data: T
  loading: boolean
  error: string | null
}

// 사용자 트라이브 ID
export type TribeId = 'bather' | 'saunner' | 'jimi'

// 장소 시설 유형 (places.facility_type)
export type FacilityType = 'small-bath' | 'public-bath' | 'hotel-premium' | 'resort-spa' | 'private-sauna' | 'special' | 'gym-sauna'

// 탕 정책 (places.bath_policy)
export type BathPolicy = 'gender-bath' | 'male-only' | 'female-only' | 'mixed'

// 탕 구분 (logs.bath_gender — facility_type + user.gender로 자동 계산)
export type BathGender = 'male' | 'female' | 'mixed' | 'private' | 'private_male' | 'private_female' | 'mixed_male' | 'mixed_female'

// 사용자 프로필
export interface UserProfile {
  id: string
  tribes: TribeId[]
  lastUsedTribe: TribeId
  xp: number
  level: number
  activeTitle: string | null
  createdAt: Date
}

// 장소 정보 (DB places + place_sources JOIN)
export interface Place {
  id: string
  country_code: string
  /** Google Geocoding에서 추출한 도시 (locality/postal_town). NULL이면 미해결 상태 */
  city: string | null
  latitude: number | null
  longitude: number | null
  facilities: string[]
  is_24h: boolean
  facility_type: FacilityType
  bath_policy: BathPolicy
  coordinate_source?: 'naver' | 'google' | 'manual' | null
  status: string
  merged: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // place_sources에서 조인된 표시용 필드
  name: string
  address: string
  short_address?: string
  sources: PlaceSource[]
}

// 장소 소스 (place_sources 테이블)
export interface PlaceSource {
  id: string
  place_id: string
  source: 'naver' | 'google' | 'manual'
  external_id: string | null
  name_original: string
  address_original: string | null
  latitude: number | null
  longitude: number | null
  plus_code: string | null
  created_at: string
}

// 슬라이더 설정 타입
export interface SliderConfig {
  label: string
  min: number
  max: number
  unit?: string
  steps: SliderStep[]
}

export interface SliderStep {
  value: number      // 이 값 이상일 때
  label: string      // 표시할 레이블
}

// log_blocks 테이블 (블록 = 순서/반복/혼합/평가의 정正)
export interface LogBlock {
  id?: string
  log_id?: string
  seq: number
  block_type: string            // BLOCK_TYPES.blockType
  category: string              // 'heat' | 'ice' | 'rest' | 'beyond'
  temp?: number | null
  duration_sec?: number | null
  score?: number | null         // 평가(세신만족/매점점수/휴식퀄) — 의미는 block_type
  cost?: number | null          // 세신/마사지 가격
  memo?: string | null          // 매점/식당 추천메뉴 / 기타
  variant?: string | null       // 세신 종류 등 서브타입 ('basic' | 'withmassage')
  norepeat?: boolean
}

// DB 로그 + 장소 조인 타입
export interface LogWithPlace {
  id: string
  user_id: string
  place_id: string
  place_name: string
  place_country_code: string
  place_facility_type?: FacilityType
  place_bath_policy?: BathPolicy
  address: string
  date: string          // 유저 지정 방문 날짜·시간 (record_date, 로컬 시간)
  tribe_id: TribeId
  revisit_score: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  repeat?: number
  sauna_temp?: number
  steam_sauna_temp?: number
  primary_sauna_kind?: 'dry' | 'steam'
  cold_bath_temp?: number
  totono_score?: number
  water_quality?: number
  hot_bath_temp?: number
  rest_quality?: number
  sweat_quality?: number
  jjim_temp?: number
  bath_gender?: BathGender
  // ── 신규 캐시 컬럼 (블록서 파생, 029) — deep_log 평탄화 ──
  dry_sauna_temp?: number | null
  bulgama_temp?: number | null
  rest_time?: number | null
  very_hot_bath_temp?: number | null
  ice_bath_temp?: number | null
  salt_sauna_temp?: number | null
  open_air_bath_temp?: number | null
  ice_room_temp?: number | null
  cleanliness?: number | null
  crowd?: string | null
  companion?: string | null
  cost?: number | null
  currency?: string | null
  memo?: string | null
  scrub_score?: number | null
  scrub_cost?: number | null
  scrub_type?: string | null
  massage_score?: number | null
  massage_cost?: number | null
  snack_score?: number | null
  snack_memo?: string | null
  restaurant_score?: number | null
  restaurant_memo?: string | null
  blocks?: LogBlock[]
  user_nickname?: string
  user_title?: string
}

// 칭호 (user_titles 테이블)
export interface UserTitle {
  id: string
  user_id: string
  title: string
  source: 'milestone' | 'random' | 'welcome' | 'beta'
  base_title: string | null   // 마일스톤 원본명 (랜덤은 null) — 사유 라벨/중복방지용
  granted_at: string
}

// 리워드 처리 결과
export interface RewardResult {
  xpGained: number
  newTotalXp: number
  oldLevel: number
  newLevel: number
  leveledUp: boolean
  newTitles: string[]   // 이번에 획득한 칭호 목록
}

// SA-리스트 (lists 테이블)
export type ListType = 'default' | 'user'

export type ListVisibility = 'private' | 'unlisted' | 'public'

export interface SaList {
  id: string
  owner_id: string
  type: ListType
  title: string
  description: string | null
  slug: string | null
  /** 리스트 커버 hue (0~360). NULL이면 기본 스톤 회색. 렌더 시 listCoverHex로 hex 계산. */
  cover_hue: number | null
  /** 리스트 커버용 이모지 1개 (선택, 생성·편집 폼에서만 설정). 마이그레이션 전 로우는 undefined일 수 있음 */
  cover_emoji?: string | null
  visibility: ListVisibility
  is_featured: boolean
  is_pinned: boolean
  sort_order: number
  subscriber_count: number
  place_count: number
  tags: string[]
  created_at: string
  updated_at: string
  // JOIN 필드 (선택)
  owner_nickname?: string
  owner_tribe?: TribeId
  owner_profile_emoji?: string | null
  /** 오너 프로필 hue (0~360). NULL이면 트라이브 색 fallback. */
  owner_profile_hue?: number | null
  /** 크리에이터 소셜 링크 { instagram?: string, naver_blog?: string, threads?: string } */
  creator_links?: Record<string, string>
}

// 리스트 아이템 (list_items 테이블)
export interface ListItem {
  id: string
  list_id: string
  place_id: string
  memo: string | null
  sort_order: number
  created_at: string
  // JOIN 필드 (선택)
  place?: Place
}

// 리스트 구독 (list_subscriptions 테이블)
export interface ListSubscription {
  id: string
  user_id: string
  list_id: string
  created_at: string
}
