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
export type FacilityType = 'gender-bath' | 'male-only' | 'female-only' | 'private-bath' | 'mixed-bath'

// 딥로그 탕 구분 (deep_logs.bath_gender)
export type BathGender = 'male' | 'female' | 'mixed' | 'private'

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
  latitude: number | null
  longitude: number | null
  facilities: string[]
  is_24h: boolean
  facility_type: FacilityType
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

// Quick Log 기록
export interface QuickLogData {
  // 공통
  revisit: number       // 1-5

  // 공통 루틴 (heat/ice/pause 시간, repeat 세트)
  heatTime?: number     // 1-60분
  iceTime?: number      // 1-5분
  pauseTime?: number    // 1-30분
  repeat?: number       // 1-7세트

  // 목욕파
  waterQuality?: number    // 1-5
  hotBathTemp?: number     // 30-46°C
  coldBathTemp?: number    // 0-30°C (saunner/bather 공통 — 선택)
  refreshedScore?: number  // 1-5, 개운함

  // 사우너파
  saunaTemp?: number    // 50-130°C
  totonoScore?: number  // 1-5, 토토노이

  // 찜질파
  sweatQuality?: number // 1-5, 발한 퀄리티
  restQuality?: number  // 1-5, 휴식 퀄리티
  jjimTemp?: number     // 70-130°C (선택)
}

// Deep Log 기록
export interface DeepLogData {
  // 공통
  companion?: string
  cost?: number
  currency?: string
  memo?: string

  // 목욕파
  scrubSatisfaction?: number
  facilities?: string[]
  hasOutdoorBath?: boolean

  // 사우너파
  facilityTags?: string[]
  coldBathDetail?: string[]

  // 찜질파
  food_eaten?: string[]
  roomTypes?: string[]
  crowd?: string
  amenities?: string[]
}

// 전체 기록
export interface LogEntry {
  id: string
  displayId?: string    // 기록 고유 ID (15자리, 내부 참조용)
  userId: string
  placeId: string
  placeName: string
  tribeId: TribeId
  quickLog: QuickLogData
  deepLog?: DeepLogData
  createdAt: Date

  // 자동 수집
  visitDayOfWeek: number // 0-6 (일-토)
  visitHour: number // 0-23
  weather?: string
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

// DB 로그 + 장소 조인 타입
export interface LogWithPlace {
  id: string
  place_id: string
  place_name: string
  place_country_code: string
  address: string
  date: string          // 유저 지정 방문 날짜·시간 (record_date, 로컬 시간)
  tribe_id: TribeId
  revisit_score: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  repeat?: number
  sauna_temp?: number
  cold_bath_temp?: number
  totono_score?: number
  water_quality?: number
  hot_bath_temp?: number
  rest_quality?: number
  sweat_quality?: number
  jjim_temp?: number
  user_nickname?: string
  deep_log?: {
    bath_gender?: BathGender
    companion?: string | null
    cost?: number | null
    currency?: string | null
    crowd?: string | null
    memo?: string
    has_scrub?: boolean
    scrub_satisfaction?: number | null
    has_store?: boolean
    store_score?: number | null
    store_memo?: string | null
  }
}

// 즐겨찾기 컬렉션
export interface FavoriteCollection {
  id: string
  name: string           // 기본: "좋아요"
  icon: string           // Material Symbol 아이콘 (기본: "favorite")
  placeIds: string[]
  createdAt: string
  updatedAt: string
}

// 즐겨찾기 데이터 (localStorage 저장 구조)
export interface FavoritesData {
  collections: FavoriteCollection[]
}
