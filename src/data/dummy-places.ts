import type { DummyPlace } from '@/types'

// 더미 장소 데이터 (11개)
export const DUMMY_PLACES: DummyPlace[] = [
  // 기존 3개 (dummy-logs에서 참조)
  {
    id: 'place-1',
    name: '스파랜드',
    address: '서울특별시 강남구 영동대로 513',
    shortAddress: '서울 강남구',
    countryCode: 'KR',
    latitude: 37.5245,
    longitude: 127.0270,
    facilities: [
      '온탕', '열탕', '건식사우나', '습식사우나', '소금사우나',
      '냉탕', '급냉탕',
      '외기욕', '내기욕',
      '노천탕', '아우프구스',
      'towel', 'shampoo-bodywash', 'store', 'massage', 'sleep-room',
    ],
    is_24h: true,
  },
  {
    id: 'place-2',
    name: '청학동목욕탕',
    address: '서울특별시 종로구 자하문로36길 12',
    shortAddress: '서울 종로구',
    countryCode: 'KR',
    latitude: 37.5780,
    longitude: 127.0066,
    facilities: [
      '온탕', '열탕',
      '냉탕',
      '내기욕',
      'shampoo-bodywash',
    ],
    is_24h: false,
  },
  {
    id: 'place-3',
    name: '드래곤힐스파',
    address: '서울특별시 용산구 한강대로21나길 40',
    shortAddress: '서울 용산구',
    countryCode: 'KR',
    latitude: 37.5327,
    longitude: 126.9642,
    facilities: [
      '온탕', '열탕', '건식사우나', '습식사우나', '불한증막', '소금사우나', '아로마사우나',
      '냉탕', '아이스방',
      '외기욕', '내기욕',
      '찜질방', '노천탕',
      'dryer-free', 'towel', 'shampoo-bodywash', 'charging', 'gym', 'sleep-room', 'store', 'massage',
    ],
    is_24h: true,
  },

  // 신규 8개
  {
    id: 'place-4',
    name: '시로암사우나',
    address: '서울특별시 중구 청파로 51',
    shortAddress: '서울 중구',
    countryCode: 'KR',
    latitude: 37.5568,
    longitude: 126.9647,
    facilities: [
      '온탕', '열탕', '건식사우나',
      '냉탕', '급냉탕',
      '외기욕',
      'towel', 'shampoo-bodywash', 'store',
    ],
    is_24h: true,
  },
  {
    id: 'place-5',
    name: '스크러빈',
    address: '서울 마포구 서교동',
    shortAddress: '서울 마포구',
    countryCode: 'KR',
    latitude: 37.5563,
    longitude: 126.9236,
    facilities: [
      '온탕', '열탕', '습식사우나',
      '냉탕',
      '내기욕',
      'dryer-free', 'shampoo-bodywash',
    ],
    is_24h: false,
  },
  {
    id: 'place-6',
    name: '월드컵스파랜드',
    address: '서울 마포구 상암동',
    shortAddress: '서울 마포구',
    countryCode: 'KR',
    latitude: 37.5680,
    longitude: 126.8976,
    facilities: [
      '온탕', '열탕', '건식사우나', '습식사우나', '불한증막',
      '냉탕', '급냉탕', '아이스방',
      '외기욕', '내기욕',
      '찜질방',
      'towel', 'shampoo-bodywash', 'store', 'sleep-room',
    ],
    is_24h: true,
  },
  {
    id: 'place-7',
    name: '이태원랜드',
    address: '서울 용산구 이태원동',
    shortAddress: '서울 용산구',
    countryCode: 'KR',
    latitude: 37.5345,
    longitude: 126.9895,
    facilities: [
      '온탕', '건식사우나',
      '냉탕',
      '외기욕',
      '셀프로울루',
      'shampoo-bodywash', 'store',
    ],
    is_24h: false,
  },
  {
    id: 'place-8',
    name: '천호사우나',
    address: '서울 강동구 천호동',
    shortAddress: '서울 강동구',
    countryCode: 'KR',
    latitude: 37.5391,
    longitude: 127.1243,
    facilities: [
      '온탕', '열탕', '건식사우나', '습식사우나',
      '냉탕', '급냉탕',
      '내기욕',
      'dryer-free', 'towel', 'shampoo-bodywash',
    ],
    is_24h: false,
  },
  {
    id: 'place-9',
    name: '해밀톤호텔사우나',
    address: '서울 용산구 이태원동',
    shortAddress: '서울 용산구',
    countryCode: 'KR',
    latitude: 37.5340,
    longitude: 126.9935,
    facilities: [
      '온탕', '열탕', '건식사우나',
      '냉탕', '급냉탕',
      '외기욕', '내기욕',
      '노천탕', '아우프구스', '셀프로울루',
      'towel', 'shampoo-bodywash', 'store', 'workspace',
    ],
    is_24h: false,
  },
  {
    id: 'place-10',
    name: '올림픽공원한증막',
    address: '서울 송파구 방이동',
    shortAddress: '서울 송파구',
    countryCode: 'KR',
    latitude: 37.5205,
    longitude: 127.1220,
    facilities: [
      '온탕', '건식사우나', '불한증막', '소금사우나',
      '냉탕',
      '외기욕', '내기욕',
      '찜질방',
      'shampoo-bodywash', 'store', 'sleep-room',
    ],
    is_24h: false,
  },
  {
    id: 'place-11',
    name: '종로세신탕',
    address: '서울 종로구 종로3가',
    shortAddress: '서울 종로구',
    countryCode: 'KR',
    latitude: 37.5710,
    longitude: 126.9930,
    facilities: [
      '온탕', '열탕',
      '냉탕',
      '내기욕',
      'shampoo-bodywash',
    ],
    is_24h: false,
  },
]

// id로 장소 찾기
export function findPlaceById(id: string): DummyPlace | undefined {
  return DUMMY_PLACES.find((place) => place.id === id)
}

// 이름으로 장소 찾기
export function findPlaceByName(name: string): DummyPlace | undefined {
  return DUMMY_PLACES.find((place) => place.name === name)
}

// 전체 장소 목록 반환
export function getAllPlaces(): DummyPlace[] {
  return DUMMY_PLACES
}
