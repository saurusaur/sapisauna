import type { UserTypeId } from '@/types'

// 더미 로그 타입 (MVP용, 추후 LogEntry 타입으로 전환)
export interface DummyLog {
  id: string
  place_id: string // [NEW] 장소 ID (DummyPlace.id 참조)
  place_name: string
  address: string
  date: string
  log_type: UserTypeId
  revisit_score: number
  // saunner
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
  // --- 2025년 1월 ---
  {
    id: '1',
    place_id: 'place-1',
    place_name: '스파랜드',
    address: '서울 강남구 신사동',
    date: '2025-01-27T20:30:00',
    log_type: 'saunner',
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
    place_id: 'place-1',
    place_name: '스파랜드',
    address: '서울 강남구 신사동',
    date: '2025-01-25T18:00:00',
    log_type: 'saunner',
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
    id: '13',
    place_id: 'place-6',
    place_name: '월드컵스파랜드',
    address: '서울 마포구 상암동',
    date: '2025-01-22T21:00:00',
    log_type: 'jimi',
    revisit_score: 5,
    rest_quality: 5,
    cleanliness: 5,
    companion: 'friend',
    cost: 13000,
    crowd: 'moderate',
    memo: '찜질방 시설 최신, 수면실도 쾌적',
  },
  {
    id: '3',
    place_id: 'place-2',
    place_name: '청학동목욕탕',
    address: '서울 종로구 청학동',
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
    id: '15',
    place_id: 'place-9',
    place_name: '해밀톤호텔사우나',
    address: '서울 용산구 이태원동',
    date: '2025-01-20T20:00:00',
    log_type: 'saunner',
    revisit_score: 5,
    sauna_temp: 105,
    cold_bath_temp: 10,
    sets: 5,
    totono: 5,
    companion: 'alone',
    cost: 14000,
    crowd: 'empty',
    memo: '아우프구스 이벤트 날 방문, 셀프 로울루도 가능',
  },
  {
    id: '11',
    place_id: 'place-5',
    place_name: '스크러빈',
    address: '서울 마포구 서교동',
    date: '2025-01-18T16:00:00',
    log_type: 'bather',
    revisit_score: 5,
    water_quality: 5,
    hot_bath_temp: 42,
    companion: 'alone',
    cost: 9000,
    crowd: 'empty',
    memo: '수질 최고, 세신도 잘함',
  },
  {
    id: '4',
    place_id: 'place-1',
    place_name: '스파랜드',
    address: '서울 강남구 신사동',
    date: '2025-01-15T21:00:00',
    log_type: 'saunner',
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
    id: '12',
    place_id: 'place-11',
    place_name: '종로세신탕',
    address: '서울 종로구 종로3가',
    date: '2025-01-12T14:00:00',
    log_type: 'bather',
    revisit_score: 4,
    water_quality: 4,
    hot_bath_temp: 43,
    companion: 'family',
    cost: 7000,
    crowd: 'moderate',
  },
  {
    id: '9',
    place_id: 'place-4',
    place_name: '시로암사우나',
    address: '서울 중구 중림동',
    date: '2025-01-10T19:00:00',
    log_type: 'saunner',
    revisit_score: 5,
    sauna_temp: 100,
    cold_bath_temp: 12,
    sets: 4,
    totono: 5,
    companion: 'alone',
    cost: 10000,
    crowd: 'empty',
    memo: '급냉탕이 진짜 차갑고 외기욕 공간이 넓어서 최고',
  },
  {
    id: '14',
    place_id: 'place-10',
    place_name: '올림픽공원한증막',
    address: '서울 송파구 방이동',
    date: '2025-01-08T18:00:00',
    log_type: 'jimi',
    revisit_score: 4,
    rest_quality: 4,
    cleanliness: 4,
    companion: 'partner',
    cost: 11000,
    crowd: 'empty',
    memo: '불한증막이 진짜 뜨겁고 좋음',
  },
  {
    id: '10',
    place_id: 'place-4',
    place_name: '시로암사우나',
    address: '서울 중구 중림동',
    date: '2025-01-05T20:00:00',
    log_type: 'saunner',
    revisit_score: 4,
    sauna_temp: 98,
    cold_bath_temp: 13,
    sets: 3,
    totono: 4,
    companion: 'friend',
    cost: 10000,
    crowd: 'moderate',
  },
  {
    id: '16',
    place_id: 'place-7',
    place_name: '이태원랜드',
    address: '서울 용산구 이태원동',
    date: '2025-01-03T17:00:00',
    log_type: 'saunner',
    revisit_score: 4,
    sauna_temp: 88,
    cold_bath_temp: 15,
    sets: 3,
    totono: 3,
    companion: 'friend',
    cost: 9000,
    crowd: 'moderate',
  },
  // --- 2024년 12월 ---
  {
    id: '5',
    place_id: 'place-3',
    place_name: '드래곤힐스파',
    address: '서울 용산구 한강로3가',
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
    id: '17',
    place_id: 'place-8',
    place_name: '천호사우나',
    address: '서울 강동구 천호동',
    date: '2024-12-28T19:00:00',
    log_type: 'bather',
    revisit_score: 4,
    water_quality: 4,
    hot_bath_temp: 41,
    companion: 'alone',
    cost: 8000,
    crowd: 'empty',
  },
  {
    id: '6',
    place_id: 'place-1',
    place_name: '스파랜드',
    address: '서울 강남구 신사동',
    date: '2024-12-20T19:00:00',
    log_type: 'saunner',
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
    place_id: 'place-2',
    place_name: '청학동목욕탕',
    address: '서울 종로구 청학동',
    date: '2024-12-10T14:00:00',
    log_type: 'bather',
    revisit_score: 4,
    water_quality: 5,
    hot_bath_temp: 43,
    companion: 'alone',
    cost: 8000,
    crowd: 'empty',
  },
  // --- 2024년 11월 ---
  {
    id: '8',
    place_id: 'place-3',
    place_name: '드래곤힐스파',
    address: '서울 용산구 한강로3가',
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

// 장소별 통계 계산 (place_id 기준)
export function getPlaceStats(placeId: string) {
  const logs = DUMMY_LOGS.filter((log) => log.place_id === placeId)
  if (logs.length === 0) return { avg: 0, count: 0 }
  const sum = logs.reduce((acc, log) => acc + log.revisit_score, 0)
  return { avg: Math.round((sum / logs.length) * 10) / 10, count: logs.length }
}
