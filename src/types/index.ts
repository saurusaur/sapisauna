/**
 * 타입 정의
 */

// 사용자 트라이브 ID
export type TribeId = 'bather' | 'saunner' | 'jimi'

// 사용자 프로필
export interface UserProfile {
  id: string
  tribes: TribeId[]
  lastUsedTribe: TribeId
  createdAt: Date
}

// 장소 정보
export interface Place {
  id: string
  name: string
  address: string
  countryCode?: string   // ISO 2자리 국가코드 — display_id 생성용
  distance?: number
  defaultPrice?: number
  source: 'naver' | 'google' | 'user'
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
  totono?: number       // 1-5, 토토노이

  // 찜질파
  restQuality?: number  // 1-5, 가벼움
  cleanliness?: number  // 1-5
  jjimTemp?: number     // 60-100°C (선택)
}

// Deep Log 기록
export interface DeepLogData {
  // 공통
  companion?: string
  purpose?: string
  cost?: number
  memo?: string

  // 목욕파
  scrubSatisfaction?: number
  scrubPrice?: number
  facilities?: string[]
  hasOutdoorBath?: boolean

  // 사우너파
  facilityTags?: string[]
  coldBathDetail?: string[]

  // 찜질파
  food?: string[]
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

// 스토리 템플릿 ID
export type StoryTemplateId = 'minimal' | 'dark' | 'gradient' | 'retro'

// 스토리 설정
export interface StorySettings {
  templateId: StoryTemplateId
  customText?: string
  showTemperature: boolean
  showSets: boolean
  showRevisit: boolean
  showDate: boolean
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

// 더미 장소 정보
export interface DummyPlace {
  id: string
  name: string
  address: string
  shortAddress?: string  // 카드 미리보기용 짧은 주소 (예: "서울 강남구", "Tokyo, Japan")
  countryCode?: string   // ISO 2자리 국가코드 (예: 'KR', 'JP') — display_id 생성용, 없으면 'KR' 기본값
  facilities: string[]   // PLACE_SPECS 전체의 id들 (평탄한 배열)
  is_24h: boolean        // 24시간 영업 여부
  latitude?: number      // 위도 (좌표 없는 장소도 호환)
  longitude?: number     // 경도
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
