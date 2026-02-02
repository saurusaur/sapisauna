import type { UserTypeId } from '@/types'

// 더미 로그 타입 (MVP용, 추후 LogEntry 타입으로 전환)
export interface DummyLog {
  id: string
  place_name: string
  address: string
  date: string
  log_type: UserTypeId
  revisit_score: number
  // sauner
  sauna_temp?: number
  cold_bath_temp?: number
  sets?: number
  totono?: number
  // bather
  water_quality?: number
  hot_bath_temp?: number
  // jimi
  rest_quality?: number
  cleanliness?: number
  // deep log
  companion?: string
  purpose?: string
  cost?: number
  crowd?: string
  memo?: string
}

// 더미 히스토리 데이터 (날짜 최신순 정렬)
export const DUMMY_LOGS: DummyLog[] = [
  {
    id: '1',
    place_name: '스파랜드',
    address: '서울 강남구',
    date: '2025-01-27T20:30:00',
    log_type: 'sauner',
    revisit_score: 5,
    sauna_temp: 95,
    cold_bath_temp: 15,
    sets: 3,
    totono: 5,
    companion: 'friend',
    purpose: 'after-workout',
    cost: 12000,
    crowd: 'empty',
    memo: '노천탕 온도가 평소보다 낮아서 아쉬웠음',
  },
  {
    id: '2',
    place_name: '스파랜드',
    address: '서울 강남구',
    date: '2025-01-25T18:00:00',
    log_type: 'sauner',
    revisit_score: 4,
    sauna_temp: 92,
    cold_bath_temp: 14,
    sets: 4,
    totono: 4,
    companion: 'alone',
    purpose: 'healing',
    cost: 12000,
    crowd: 'moderate',
  },
  {
    id: '3',
    place_name: '청학동목욕탕',
    address: '서울 종로구',
    date: '2025-01-20T15:00:00',
    log_type: 'bather',
    revisit_score: 3,
    water_quality: 4,
    hot_bath_temp: 42,
    companion: 'family',
    purpose: 'healing',
    cost: 8000,
    crowd: 'busy',
  },
  {
    id: '4',
    place_name: '스파랜드',
    address: '서울 강남구',
    date: '2025-01-15T21:00:00',
    log_type: 'sauner',
    revisit_score: 4,
    sauna_temp: 90,
    cold_bath_temp: 16,
    sets: 3,
    totono: 3,
    companion: 'alone',
    cost: 12000,
    crowd: 'busy',
    memo: '주말이라 혼잡했지만 사우나 컨디션은 좋았음',
  },
  {
    id: '5',
    place_name: '드래곤힐스파',
    address: '서울 용산구',
    date: '2024-12-31T22:00:00',
    log_type: 'jimi',
    revisit_score: 4,
    rest_quality: 5,
    cleanliness: 4,
    companion: 'friend',
    purpose: 'healing',
    cost: 15000,
    crowd: 'full',
    memo: '연말이라 사람 많았지만 분위기 좋았음',
  },
  {
    id: '6',
    place_name: '스파랜드',
    address: '서울 강남구',
    date: '2024-12-20T19:00:00',
    log_type: 'sauner',
    revisit_score: 5,
    sauna_temp: 98,
    cold_bath_temp: 13,
    sets: 5,
    totono: 5,
    cost: 12000,
    crowd: 'empty',
    memo: '평일 저녁 최고의 컨디션',
  },
  {
    id: '7',
    place_name: '청학동목욕탕',
    address: '서울 종로구',
    date: '2024-12-10T14:00:00',
    log_type: 'bather',
    revisit_score: 4,
    water_quality: 5,
    hot_bath_temp: 43,
    companion: 'alone',
    cost: 8000,
    crowd: 'empty',
  },
  {
    id: '8',
    place_name: '드래곤힐스파',
    address: '서울 용산구',
    date: '2024-11-23T17:00:00',
    log_type: 'jimi',
    revisit_score: 3,
    rest_quality: 4,
    cleanliness: 3,
    companion: 'partner',
    purpose: 'healing',
    cost: 15000,
    crowd: 'moderate',
  },
]

// id로 로그 찾기
export function findLogById(id: string): DummyLog | undefined {
  return DUMMY_LOGS.find((log) => log.id === id)
}

// 같은 장소의 다른 기록 찾기 (현재 기록 제외, 날짜 최신순)
export function findLogsBySamePlace(currentId: string, placeName: string): DummyLog[] {
  return DUMMY_LOGS
    .filter((log) => log.place_name === placeName && log.id !== currentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
