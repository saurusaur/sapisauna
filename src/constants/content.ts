/**
 * ============================================
 * SAUNA LOG - 콘텐츠 관리 파일
 * ============================================
 *
 * 이 파일에서 앱의 모든 텍스트를 관리합니다.
 * 워딩이나 메시지를 수정하려면 이 파일만 편집하세요.
 *
 * 구조:
 * - APP: 앱 전반 정보
 * - ONBOARDING: 온보딩 화면
 * - USER_TYPES: 사용자 타입별 정보
 * - QUICK_LOG: 퀵로그 입력 항목
 * - DEEP_LOG: 딥로그 입력 항목
 * - MESSAGES: 각종 메시지
 * - BUTTONS: 버튼 텍스트
 * - ICONS: Material Symbols 아이콘
 * - STORY: 스토리 템플릿
 *
 * 아이콘 사용 규칙:
 * - 기능적 UI (메뉴, 버튼, 네비게이션): Google Material Symbols
 * - 감성적 요소 (먹거리, 상태, 포인트): Emoji
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
// 온보딩
// ============================================
export const ONBOARDING = {
  TITLE: '나의 목욕 스타일은?',
  SUBTITLE: '1개 이상 선택해주세요',
  START_BUTTON: '시작하기',
  SELECTED_COUNT: (count: number) => `${count}개 선택됨`,
}

// ============================================
// 사용자 타입
// ============================================
export const USER_TYPES = {
  BATHER: {
    id: 'bather',
    name: '목욕파',
    nameEn: 'The Bathers',
    emoji: '🛁',
    description: '깨끗한 물에서 몸을 담그는 게 최고',
    color: '#3B82F6', // blue-500
  },
  SAUNER: {
    id: 'sauner',
    name: '사우너파',
    nameEn: 'The Saunners',
    emoji: '🔥',
    description: '뜨거운 사우나와 차가운 냉탕의 반복',
    color: '#EF4444', // red-500
  },
  JIMI: {
    id: 'jimi',
    name: '찜질파',
    nameEn: 'The Jimis',
    emoji: '💆',
    description: '푹 쉬면서 힐링하는 시간',
    color: '#8B5CF6', // purple-500
  },
} as const

// ============================================
// Quick Log 입력 항목 (5단계 레이블 포함)
// ============================================
export const QUICK_LOG = {
  // 공통 항목
  COMMON: {
    REVISIT: {
      label: '또 올래요',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '별로', emoji: '😐' },
        { value: 2, label: '글쎄', emoji: '🙁' },
        { value: 3, label: '괜찮아', emoji: '🙂' },
        { value: 4, label: '좋아', emoji: '😊' },
        { value: 5, label: '최고', emoji: '😍' },
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
        { value: 1, label: '탁함' },
        { value: 2, label: '조금탁함' },
        { value: 3, label: '보통' },
        { value: 4, label: '맑음' },
        { value: 5, label: '아주맑음' },
      ],
    },
    HOT_BATH_TEMP: {
      label: '온탕 온도',
      min: 38,
      max: 45,
      unit: '°C',
      // 구간별 레이블 (해당 온도 이상일 때 적용)
      steps: [
        { value: 38, label: '미지근' },
        { value: 40, label: '따뜻' },
        { value: 42, label: '뜨거움' },
        { value: 44, label: '펄펄' },
      ],
    },
  },

  // 사우너파 전용
  SAUNER: {
    SAUNA_TEMP: {
      label: '사우나 온도',
      min: 70,
      max: 110,
      unit: '°C',
      steps: [
        { value: 70, label: '미지근' },
        { value: 80, label: '따뜻' },
        { value: 90, label: '뜨거움' },
        { value: 100, label: '극한' },
        { value: 105, label: '지옥' },
      ],
    },
    COLD_BATH_TEMP: {
      label: '냉탕 온도',
      min: 5,
      max: 20,
      unit: '°C',
      // 냉탕은 낮을수록 차가움 (역순)
      steps: [
        { value: 5, label: '얼음' },
        { value: 9, label: '극강' },
        { value: 13, label: '시원' },
        { value: 17, label: '미지근' },
      ],
    },
    SETS: {
      label: '세트 수',
      min: 1,
      max: 10,
      unit: '세트',
      inputType: 'counter', // +/- 카운터 형태
    },
    TOTONO: {
      label: '토토노이 강도',
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: '그냥저냥' },
        { value: 2, label: '나쁘지않음' },
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
        { value: 1, label: '별로' },
        { value: 2, label: '그냥저냥' },
        { value: 3, label: '괜찮음' },
        { value: 4, label: '편안함' },
        { value: 5, label: '꿀잠' },
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

// 슬라이더 값에 해당하는 레이블 찾기 헬퍼 함수
export function getStepLabel(
  steps: { value: number; label: string }[],
  currentValue: number
): string {
  // 현재 값보다 작거나 같은 가장 큰 step 찾기
  const sortedSteps = [...steps].sort((a, b) => b.value - a.value)
  const step = sortedSteps.find((s) => currentValue >= s.value)
  return step?.label || steps[0].label
}

// ============================================
// Deep Log 입력 항목
// ============================================
export const DEEP_LOG = {
  // 공통
  COMMON: {
    COMPANION: {
      label: '동행자',
      options: [
        { id: 'alone', label: '혼자', emoji: '🧍' },
        { id: 'friend', label: '친구', emoji: '👯' },
        { id: 'family', label: '가족', emoji: '👨‍👩‍👧' },
        { id: 'partner', label: '연인', emoji: '💑' },
      ],
    },
    PURPOSE: {
      label: '방문 목적',
      options: [
        { id: 'healing', label: '힐링', emoji: '🧘' },
        { id: 'after-workout', label: '운동후', emoji: '💪' },
        { id: 'hangover', label: '숙취해소', emoji: '🍺' },
        { id: 'date', label: '데이트', emoji: '❤️' },
        { id: 'work', label: '작업', emoji: '💻' },
      ],
    },
    COST: {
      label: '비용',
      placeholder: '입욕료를 입력하세요',
      unit: '원',
    },
    MEMO: {
      label: '자유 메모',
      placeholder: '오늘의 기록을 남겨보세요...',
    },
  },

  // 목욕파 전용
  BATHER: {
    SCRUB: {
      label: '세신',
      satisfaction: {
        label: '만족도',
        options: ['😞', '😐', '🙂', '😊', '🤩'],
      },
      price: {
        label: '가격',
        placeholder: '세신 가격',
        unit: '원',
      },
    },
    FACILITIES: {
      label: '파우더룸',
      options: [
        { id: 'dryer-free', label: '드라이기 무료' },
        { id: 'dryer-paid', label: '드라이기 유료' },
        { id: 'amenity', label: '어메니티 구비' },
        { id: 'towel', label: '수건 지급' },
      ],
    },
    OUTDOOR: {
      label: '노천탕',
      options: [
        { id: 'yes', label: '있음' },
        { id: 'no', label: '없음' },
      ],
    },
  },

  // 사우너파 전용
  SAUNER: {
    FACILITY_TAGS: {
      label: '시설 태그',
      options: [
        { id: 'outdoor', label: '외기욕', emoji: '🌿' },
        { id: 'indoor', label: '내기욕', emoji: '🏠' },
        { id: 'dry', label: '건식', emoji: '🔥' },
        { id: 'wet', label: '습식', emoji: '💨' },
        { id: 'aroma', label: '아로마', emoji: '🌸' },
        { id: 'loyly', label: '로류', emoji: '💧' },
      ],
    },
    COLD_BATH_DETAIL: {
      label: '냉탕 디테일',
      options: [
        { id: 'deep', label: '수심깊음', emoji: '🏊' },
        { id: 'waterfall', label: '폭포수', emoji: '🌊' },
        { id: 'ice', label: '얼음물', emoji: '🧊' },
      ],
    },
  },

  // 찜질파 전용
  JIMI: {
    FOOD: {
      label: '먹거리',
      options: [
        { id: 'sikhye', label: '식혜', emoji: '🥛' },
        { id: 'egg', label: '계란', emoji: '🥚' },
        { id: 'soup', label: '미역국', emoji: '🍲' },
        { id: 'beer', label: '맥주', emoji: '🍺' },
        { id: 'ramen', label: '라면', emoji: '🍜' },
        { id: 'bingsu', label: '빙수', emoji: '🍧' },
      ],
    },
    ROOM_TYPES: {
      label: '방 종류',
      options: [
        { id: 'bulgama', label: '불한증막', emoji: '🔥' },
        { id: 'salt', label: '소금방', emoji: '🧂' },
        { id: 'ice', label: '아이스방', emoji: '❄️' },
        { id: 'clay', label: '황토방', emoji: '🟤' },
        { id: 'cave', label: '토굴방', emoji: '🕳️' },
      ],
    },
    CROWD: {
      label: '혼잡도',
      options: [
        { id: 'empty', label: '쾌적', emoji: '😌' },
        { id: 'moderate', label: '적당', emoji: '🙂' },
        { id: 'busy', label: '북적', emoji: '😅' },
        { id: 'full', label: '자리없음', emoji: '😵' },
      ],
    },
    AMENITIES: {
      label: '편의시설',
      options: [
        { id: 'massage', label: '안마의자', emoji: '💆' },
        { id: 'comics', label: '만화책', emoji: '📚' },
        { id: 'sleep', label: '수면실', emoji: '😴' },
      ],
    },
  },
}

// ============================================
// 메시지
// ============================================
export const MESSAGES = {
  HOME: {
    GREETING: (name: string) => `안녕, ${name}`,
    NO_RECORDS: '아직 기록이 없어요',
    RECENT_RECORDS: '최근 기록',
  },
  LOG: {
    SELECT_PLACE: '장소 선택',
    SEARCH_PLACEHOLDER: '사우나 검색...',
    NEARBY: '내 주변',
    ADD_PLACE: '직접 장소 추가',
    DEEP_LOG_BUTTON: '더 기록하기 (Deep Log)',
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
// Material Symbols 아이콘 (기능적 UI용)
// 사용법: <span className="material-symbols-outlined">{ICONS.HOME}</span>
// ============================================
export const ICONS = {
  // 네비게이션
  HOME: 'home',
  HISTORY: 'history',
  SETTINGS: 'settings',
  BACK: 'arrow_back',
  CLOSE: 'close',

  // 액션
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  SAVE: 'check',
  SHARE: 'share',
  SEARCH: 'search',

  // 로그 관련
  PLACE: 'location_on',
  CALENDAR: 'calendar_today',
  TIME: 'schedule',
  PHOTO: 'photo_camera',

  // 기타
  CHEVRON_RIGHT: 'chevron_right',
  CHEVRON_DOWN: 'expand_more',
  INFO: 'info',
  STAR: 'star',
  THERMOMETER: 'thermostat',
}

// ============================================
// 스토리 템플릿
// ============================================
export const STORY_TEMPLATES = {
  MINIMAL: {
    id: 'minimal',
    name: 'MINIMAL',
    nameKo: '미니멀',
    description: '깔끔하고 심플한 디자인',
  },
  DARK: {
    id: 'dark',
    name: 'DARK',
    nameKo: '다크',
    description: '어두운 배경의 세련된 디자인',
  },
  GRADIENT: {
    id: 'gradient',
    name: 'GRADIENT',
    nameKo: '그라데이션',
    description: '부드러운 그라데이션 배경',
  },
  RETRO: {
    id: 'retro',
    name: 'RETRO',
    nameKo: '레트로',
    description: '빈티지한 감성의 디자인',
  },
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
