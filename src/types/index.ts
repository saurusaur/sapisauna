/**
 * 타입 정의
 */

// 사용자 타입 ID
export type UserTypeId = 'bather' | 'saunner' | 'jimi'

// 사용자 프로필
export interface UserProfile {
  id: string
  types: UserTypeId[]
  lastUsedType: UserTypeId
  createdAt: Date
}

// 장소 정보
export interface Place {
  id: string
  name: string
  address: string
  distance?: number
  defaultPrice?: number
  source: 'naver' | 'google' | 'user'
}

// Quick Log 기록
export interface QuickLogData {
  // 공통
  revisit: number // 1-5

  // 목욕파
  waterQuality?: number // 1-5
  hotBathTemp?: number // 38-45

  // 사우너파
  saunaTemp?: number // 70-110
  coldBathTemp?: number // 5-20
  sets?: number // 1-10
  totono?: number // 1-5

  // 찜질파
  restQuality?: number // 1-5
  cleanliness?: number // 1-5
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
  userId: string
  placeId: string
  placeName: string
  userType: UserTypeId
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
