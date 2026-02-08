/**
 * ============================================
 * SAUNA LOG - 콘텐츠 관리 파일
 * ============================================
 *
 * 이 파일에서 앱의 모든 텍스트와 설정값을 관리합니다.
 *
 * 색상 관리:
 * → globals.css의 CSS 변수에서 관리 (--color-green, --color-orange 등)
 * → 아래 TYPE_COLORS는 타입 선택 UI에서만 사용
 *
 * 구조:
 * - APP: 앱 전반 정보
 * - TYPE_COLORS: 사용자 타입별 색상 (타입 선택 UI용)
 * - USER_TYPES: 사용자 타입 정보
 * - ONBOARDING: 온보딩 화면
 * - QUICK_LOG: 퀵로그 입력 항목
 * - DEEP_LOG: 딥로그 입력 항목
 * - MESSAGES: 각종 메시지
 * - BUTTONS: 버튼 텍스트
 * - ICONS: Material Symbols 아이콘
 */

// ============================================
// 앱 정보
// ============================================
export const APP = {
  NAME: '사우나 로그',
  TAGLINE: '나만의 사우나 기록',
  VERSION: '0.1.0',
}

// ============================================
// 타입별 포인트 색상 (globals.css의 CSS 변수 참조)
// ============================================
const TYPE_COLORS = {
  bather: 'var(--color-bather)',
  saunner: 'var(--color-saunner)',
  jimi: 'var(--color-jimi)',
} as const

// 탕 성별 옵션 (Deep Log용 - 색상은 페이지 기본 포인트 컬러 사용)
export const BATH_GENDER_OPTIONS = [
  { id: 'male', label: '남탕', icon: 'male' },
  { id: 'female', label: '여탕', icon: 'female' },
  { id: 'mixed', label: '혼탕', icon: 'wc' },
] as const

// ============================================
// 사용자 타입
// ============================================
export const USER_TYPES = {
  BATHER: {
    id: 'bather',
    // Category (기록 타입, 한국어): 목욕
    category: '목욕탕',
    // Persona (유저 레이블, 영어): Bather
    persona: 'Bather',
    name: '목욕탕파',
    emoji: '🛁',
    description: '목욕탕의 따뜻한 물과 시원한 세신이 나를 부른다',
    color: TYPE_COLORS.bather,
  },
  SAUNER: {
    id: 'saunner',
    category: '사우나',
    persona: 'Saunner',
    name: '사우나파',
    emoji: '🔥',
    description: '사우나, 냉탕, 휴식의 반복으로 완성하는 나의 루틴',
    color: TYPE_COLORS.saunner,
  },
  JIMI: {
    id: 'jimi',
    category: '찜질방',
    persona: 'Jimi',
    name: '찜질방파',
    emoji: '🥚',
    description: '찜질방에서 굴러다니며 먹고 자는 게 최고의 힐링',
    color: TYPE_COLORS.jimi,
  },
} as const

// USER_TYPES에서 자동 생성하는 조회 맵 (중복 제거)
const typeEntries = Object.values(USER_TYPES)
export const TYPE_EMOJI_MAP: Record<string, string> = Object.fromEntries(typeEntries.map(t => [t.id, t.emoji]))
export const TYPE_CATEGORY_MAP: Record<string, string> = Object.fromEntries(typeEntries.map(t => [t.id, t.category]))
export const TYPE_PERSONA_MAP: Record<string, string> = Object.fromEntries(typeEntries.map(t => [t.id, t.persona]))
export const TYPE_NAME_MAP: Record<string, string> = Object.fromEntries(typeEntries.map(t => [t.id, t.name]))

// ============================================
// 온보딩
// ============================================
export const ONBOARDING = {
  // Step 1: 닉네임
  NICKNAME: {
    TITLE: '닉네임을 입력해주세요',
    PLACEHOLDER: '닉네임 (2-10자)',
    CHECK_BUTTON: '중복 확인',
    AVAILABLE: '사용 가능한 닉네임이에요',
    DUPLICATE: '이미 사용 중인 닉네임이에요',
    INVALID: '2-10자 사이로 입력해주세요',
    CHECKING: '확인 중...',
  },
  // Step 2: 타입 선택
  TYPE: {
    TITLE: '나의 사우나 라이프스타일은?',
    SUBTITLE: '좋아하는 순서대로 선택해주세요',
  },
  // 공통
  NEXT_BUTTON: '다음',
  START_BUTTON: '시작하기',
  SELECTED_COUNT: (count: number) => `${count}개 선택됨`,
}

// ============================================
// Quick Log 입력 항목
// ============================================
export const QUICK_LOG = {
  // 공통 항목
  COMMON: {
    REVISIT: {
      label: '또 갈래요',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '절대로 안가요' },
        { value: 2, label: '대안 없다면 가요' },
        { value: 3, label: '근처면 갈만 해요' },
        { value: 4, label: '찾아갈만 해요' },
        { value: 5, label: '꼭 가야해요!' },
      ],
    },
  },

  // 목욕파 전용
  BATHER: {
    WATER_QUALITY: {
      label: '수질',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '매우 탁함' },
        { value: 2, label: '조금 탁함' },
        { value: 3, label: '보통' },
        { value: 4, label: '청량' },
        { value: 5, label: '미끈미끈' },
      ],
    },
    HOT_BATH_TEMP: {
      label: '목욕물 온도',
      min: 30,
      max: 46,
      unit: '°C',
      steps: [
        { value: 30, label: '미지근' },
        { value: 35, label: '따뜻' },
        { value: 39, label: '뜨끈' },
        { value: 41, label: '펄펄' },
      ],
    },
  },

  // 사우너파 전용
  SAUNER: {
    SAUNA_TEMP: {
      label: '건식 사우나 온도',
      min: 50,
      max: 130,
      unit: '°C',
      steps: [
        { value: 50, label: '미지근' },
        { value: 65, label: '따뜻' },
        { value: 85, label: '뜨끈' },
        { value: 100, label: '후끈' },
        { value: 120, label: '지옥' },
      ],
    },
    COLD_BATH_TEMP: {
      label: '냉탕 온도',
      min: 0,
      max: 30,
      unit: '°C',
      steps: [
        { value: 0, label: '냉동' },
        { value: 5, label: '냉장' },
        { value: 10, label: '차갑' },
        { value: 16, label: '시원' },
        { value: 25, label: '미지근' },
      ],
    },
    SETS: {
      label: '세트 수',
      min: 1,
      max: 7,
      unit: '세트',
      inputType: 'counter',
    },
    TOTONO: {
      label: '토토노이 강도',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '없음' },
        { value: 2, label: '미약' },
        { value: 3, label: '좋음' },
        { value: 4, label: '최고' },
        { value: 5, label: '승천' },
      ],
    },
  },

  // 찜질파 전용
  JIMI: {
    REST_QUALITY: {
      label: '휴식 퀄리티',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '아쉬움' },
        { value: 2, label: '무난' },
        { value: 3, label: '평온' },
        { value: 4, label: '개운' },
        { value: 5, label: '황홀' },
      ],
    },
    CLEANLINESS: {
      label: '청결도',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '별로' },
        { value: 2, label: '아쉬움' },
        { value: 3, label: '보통' },
        { value: 4, label: '깨끗' },
        { value: 5, label: '완벽' },
      ],
    },
  },
}

// ============================================
// 장소 스펙 옵션 (크라우드소싱 데이터)
// ============================================
export const PLACE_SPECS = {
  BATHS: {
    label: '탕 구성',
    options: [
      { id: '냉탕', label: '냉탕', icon: 'ac_unit', tempRange: [15, 30] },
      { id: '급냉탕', label: '급냉탕', icon: 'severe_cold', tempRange: [0, 20] },
      { id: '미온탕', label: '미온탕', icon: 'thermostat', tempRange: [30, 37] },
      { id: '온탕', label: '온탕', icon: 'heat', tempRange: [35, 43] },
      { id: '열탕', label: '열탕', icon: 'emergency_heat_2', tempRange: [40, 46] },
      { id: '노천탕', label: '노천탕', icon: 'park', tempRange: [35, 45] },
    ],
  },
  SAUNAS: {
    label: '사우나 종류',
    options: [
      { id: '건식', label: '건식', icon: 'sauna', tempRange: [50, 130] },
      { id: '습식', label: '습식', icon: 'water_voc', tempRange: [40, 90] },
      { id: '아로마', label: '아로마', icon: 'spa', tempRange: [40, 100] },
    ],
  },
  STORE: {
    label: '매점',
    toggleLabel: '이용 함',
    memoPlaceholder: '추천 메뉴 메모 (예: 식혜가 시원하고 맛있음)',
    rating: {
      label: '매점 평가',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '맛없음' },
        { value: 2, label: '아쉬움' },
        { value: 3, label: '평범' },
        { value: 4, label: '맛있음' },
        { value: 5, label: '꿀맛집' },
      ],
    },
  },
  ROOMS: {
    label: '찜질방 종류',
    options: [
      { id: '불한증막', label: '불한증막', icon: 'warehouse', tempRange: [60, 140], hasTemp: true },
      { id: '소금방', label: '소금방', icon: 'grain' },
      { id: '아이스방', label: '아이스방', icon: 'iceream' },
      { id: '황토방', label: '황토방', icon: 'foundation' },
      { id: '토굴방', label: '토굴방', icon: 'location_home' },
    ],
  },
}

// ============================================
// Deep Log 입력 항목
// ============================================
export const DEEP_LOG = {
  // 탕 선택 (남탕/여탕/혼탕)
  BATH_GENDER: {
    label: '탕 선택',
    options: BATH_GENDER_OPTIONS,
  },
  COMPANION: {
    label: '동행자',
    options: [
      { id: 'alone', label: '혼자', icon: 'person' },
      { id: 'friend', label: '친구', icon: 'group' },
      { id: 'family', label: '가족', icon: 'family_restroom' },
      { id: 'partner', label: '연인', icon: 'partner_heart' },
    ],
  },
  PURPOSE: {
    label: '방문 목적',
    multiple: true,
    options: [
      { id: 'healing', label: '힐링', icon: 'self_improvement' },
      { id: 'after-workout', label: '운동 후', icon: 'fitness_center' },
      { id: 'hangover', label: '숙취해소', icon: 'beer_meal' },
      { id: 'date', label: '데이트', icon: 'favorite' },
      { id: 'work', label: '작업', icon: 'laptop' },
      { id: 'sleep', label: '수면', icon: 'bedtime' },
      { id: 'meal', label: '식사', icon: 'restaurant' },
    ],
  },
  COST: {
    label: '비용',
    placeholder: '입장료를 입력해주세요',
    unit: '원',
  },
  AMENITIES: {
    label: '편의시설',
    options: [
      { id: 'dryer-free', label: '드라이기 무료', icon: 'air' },
      { id: 'towel', label: '수건 무제한', icon: 'dry_cleaning' },
      { id: 'shampoo-bodywash', label: '샴푸/바디워시', icon: 'clean_hands' },
      { id: 'charging', label: '충전 스테이션', icon: 'battery_charging_full' },
      { id: 'workspace', label: '작업 공간', icon: 'laptop' },
      { id: 'gym', label: '운동시설', icon: 'fitness_center' },
      { id: 'sleep-room', label: '수면실', icon: 'airline_seat_flat' },
      { id: 'store', label: '매점', icon: 'dining' },
    ],
  },
  MEMO: {
    label: '자유 메모',
    placeholder: '오늘의 경험을 기록해보세요... (예: 노천탕 온도가 평소보다 낮아서 아쉬웠음)',
  },
  CROWD: {
    label: '혼잡도',
    options: [
      { id: 'empty', label: '쾌적', icon: 'hot_tub' },
      { id: 'moderate', label: '적당', icon: 'bath_private' },
      { id: 'busy', label: '북적', icon: 'bath_public_large' },
      { id: 'full', label: '자리 없음', icon: 'crowdsource' },
    ],
  },
  SCRUB: {
    label: '세신',
    toggleLabel: '이용 함',
    satisfaction: {
      label: '만족도',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '별로' },
        { value: 2, label: '아쉬움' },
        { value: 3, label: '만족' },
        { value: 4, label: '시원' },
        { value: 5, label: '극락' },
      ],
    },
  },
}

// ============================================
// 타입별 기본 설정
// ============================================
export const TYPE_DEFAULTS = {
  bather: {
    greeting: '오늘도 따뜻한 물에서 힐링하세요 🛁',
    quickLogFields: ['WATER_QUALITY', 'HOT_BATH_TEMP', 'REVISIT'],
    emoji: '🛁',
  },
  saunner: {
    greeting: '오늘의 토토노이를 기록해보세요 🔥',
    quickLogFields: ['SAUNA_TEMP', 'COLD_BATH_TEMP', 'SETS', 'TOTONO', 'REVISIT'],
    emoji: '🔥',
  },
  jimi: {
    greeting: '편안한 찜질방 시간 되세요 🥚',
    quickLogFields: ['REST_QUALITY', 'CLEANLINESS', 'REVISIT'],
    emoji: '🥚',
  },
} as const

// ============================================
// 메시지
// ============================================
export const MESSAGES = {
  HOME: {
    GREETING: (persona: string) => `Hello, ${persona}`,
    GREETING_WITH_TYPE: (persona: string) => `Hello, ${persona}`,
    NO_RECORDS: '아직 기록이 없어요',
    RECENT_RECORDS: '최근 기록',
  },
  LOG: {
    SELECT_PLACE: '장소 선택',
    SEARCH_PLACEHOLDER: '사우나 검색...',
    NEARBY: '내 주변',
    ADD_PLACE: '직접 장소 추가',
    DEEP_LOG_BUTTON: '자세히 기록하기',
    SAVING: '저장 중...',
  },
  COMPLETE: {
    TITLE: '기록 완료!',
    SUBTITLE: (place: string) => `${place}에서의 기록이 저장되었어요`,
  },
  STORY: {
    SELECT_TEMPLATE: '템플릿 선택',
    EDIT_TITLE: '스토리 편집',
    ADD_TEXT: '문구 추가',
    TEXT_PLACEHOLDER: '오늘의 한마디...',
    DISPLAY_OPTIONS: '표시 항목',
  },
  ERROR: {
    LOAD_FAILED: '불러오기에 실패했어요',
    SAVE_FAILED: '저장에 실패했어요',
    LOCATION_DENIED: '위치 권한이 필요해요',
    RETRY: '다시 시도해주세요',
  },
}

// ============================================
// 버튼 텍스트
// ============================================
export const BUTTONS = {
  SAVE: '저장',
  CANCEL: '취소',
  NEXT: '다음',
  BACK: '뒤로',
  DONE: '완료',
  SHARE: '공유',
  VIEW_LIST: '리스트 보기',
  CREATE_STORY: '스토리 만들기',
  ADD_RECORD: '오늘의 기록',
  RETRY: '다시 시도',
}

// ============================================
// Material Symbols 아이콘
// ============================================
export const ICONS = {
  HOME: 'home',
  HISTORY: 'history',
  SETTINGS: 'settings',
  BACK: 'arrow_back',
  CLOSE: 'close',
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  SAVE: 'check',
  SHARE: 'share',
  SEARCH: 'search',
  PLACE: 'nest_farsight_heat',
  CALENDAR: 'calendar_today',
  TIME: 'schedule',
  PHOTO: 'photo_camera',
  CHEVRON_RIGHT: 'chevron_right',
  CHEVRON_DOWN: 'expand_more',
  INFO: 'info',
  STAR: 'star',
  THERMOMETER: 'device_thermostat',
}

// 타입별 Material Symbol 아이콘 (스토리 카드용, 이모지 대체)
export const TYPE_ICON_MAP: Record<string, string> = {
  bather: 'bath_outdoor',
  saunner: 'local_fire_department',
  jimi: 'egg',
}

// ============================================
// 네비게이션
// ============================================
export const NAV = {
  HOME: '홈',
  HISTORY: '기록',
  SETTINGS: '설정',
}

// ============================================
// 설정
// ============================================
export const SETTINGS = {
  TITLE: '설정',
  PROFILE: {
    TITLE: '프로필',
    CHANGE_TYPE: '타입 변경',
  },
  NOTIFICATION: {
    TITLE: '알림',
    REMINDER: '기록 리마인더',
  },
  ABOUT: {
    TITLE: '앱 정보',
    VERSION: '버전',
    TERMS: '이용약관',
    PRIVACY: '개인정보처리방침',
  },
}
