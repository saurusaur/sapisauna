/**
 * ============================================
 * SAUNA LOG - 콘텐츠 관리 파일
 * ============================================
 *
 * 이 파일에서 앱의 모든 텍스트와 설정값을 관리합니다.
 *
 * 색상 관리:
 * → globals.css의 CSS 변수에서 관리 (--color-primary, --color-accent 등)
 * → 아래 TRIBE_COLORS는 타입 선택 UI에서만 사용
 *
 * 구조:
 * - APP: 앱 전반 정보
 * - TRIBE_COLORS: 사용자 타입별 색상 (타입 선택 UI용)
 * - TRIBES: 사용자 타입 정보
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
// 어드민 유저 ID (시드 데이터 로그 — 통계에만 사용, UI에서 비가시화)
export const ADMIN_USER_ID = "23c431c3-9b23-4779-bb27-13472e58090a";

export const APP = {
  NAME: "사-피 | 우리는 사우나 신인류!",
  TAGLINE: "사우나 피플을 위한 기록, 공유, 발견",
  VERSION: "0.1.0",
};

// ============================================
// 트라이브 ID 상수
// ============================================
import type { TribeId } from "@/types";

export const TRIBE_IDS = ["bather", "saunner", "jimi"] as const;
export const FALLBACK_TRIBE: TribeId = "saunner";

// 닉네임 예약어 (소문자로 비교)
export const RESERVED_NICKNAMES = [
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "help",
  "official",
  "staff",
  "sapien",
  "sapi",
  "sa_pi",
];

// ============================================
// 타입별 포인트 색상 (globals.css의 CSS 변수 참조)
// ============================================
export const TRIBE_COLORS: Record<TribeId, string> = {
  bather: "var(--color-bather)",
  saunner: "var(--color-saunner)",
  jimi: "var(--color-jimi)",
};

// 시설 유형 (places.facility_type)
export const PLACE_VENUE_TYPE = [
  { id: "public-bath", label: "대중목욕탕", icon: "public" },
  { id: "small-bath", label: "동네목욕탕", icon: "hot_tub" },
  { id: "hotel-premium", label: "호텔/프리미엄", icon: "hotel" },
  { id: "resort-spa", label: "리조트/워터파크", icon: "pool" },
  { id: "private-sauna", label: "개인사우나", icon: "person" },
  { id: "special", label: "특수(불가마, 효소 등)", icon: "bath_bedrock" },
] as const;

// 탕 정책 (places.bath_policy)
export const PLACE_BATH_POLICY = [
  { id: "gender-bath", label: "남녀분리", icon: "wc" },
  { id: "male-only", label: "남성전용", icon: "male" },
  { id: "female-only", label: "여성전용", icon: "female" },
  { id: "mixed", label: "혼탕", icon: "group" },
] as const;

// 딥로그 기록: "오늘 나는 어디 이용?" (deep_logs.bath_gender)
export const LOG_BATH_GENDER = [
  { id: "male", label: "남탕", icon: "male" },
  { id: "female", label: "여탕", icon: "female" },
  { id: "mixed", label: "혼탕", icon: "wc" },
  { id: "private", label: "개인", icon: "person" },
] as const;

// ============================================
// 사용자 타입
// ============================================
export const TRIBES = {
  BATHER: {
    id: "bather",
    // Category (기록 타입, 한국어): 목욕
    category: "목욕탕",
    // Persona (유저 레이블, 영어): Bather
    persona: "BATHER",
    name: "목욕파",
    emoji: "🛁",
    description: "목욕탕의 따뜻한 물과 시원한 세신이 나를 부른다",
    color: TRIBE_COLORS.bather,
  },
  SAUNER: {
    id: "saunner",
    category: "사우나",
    persona: "SAUNNER",
    name: "사우나파",
    emoji: "🔥",
    description: "사우나, 냉탕, 휴식의 반복으로 완성하는 나의 루틴",
    color: TRIBE_COLORS.saunner,
  },
  JIMI: {
    id: "jimi",
    category: "찜질",
    persona: "JIMI",
    name: "찜질파",
    emoji: "🥚",
    description: "한증막에서 뜨겁게 지진 후 먹고 자는 게 최고의 힐링",
    color: TRIBE_COLORS.jimi,
  },
} as const;

// TRIBES에서 자동 생성하는 조회 맵
const tribeEntries = Object.values(TRIBES);
export const TRIBE_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  tribeEntries.map((t) => [t.id, t.emoji]),
);
export const TRIBE_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  tribeEntries.map((t) => [t.id, t.category]),
);
export const TRIBE_PERSONA_MAP: Record<string, string> = Object.fromEntries(
  tribeEntries.map((t) => [t.id, t.persona]),
);

// ============================================
// 로그인 & 비로그인 홈
// ============================================
export const LOGIN = {
  GOOGLE_BUTTON: "Google로 시작하기",
  ERROR: "로그인에 실패했어요. 다시 시도해주세요.",
  TERMS_NOTICE: "로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.",
  HOME_TITLE: "사-피에 오신 걸 환영해요",
  HOME_SUBTITLE: "사우나, 목욕, 찜질 기록을 시작해보세요",
  EXPLORE_CTA: "사우나 탐색하기",
  LOGIN_CTA: "로그인하고 기록해보세요",
};

// ============================================
// 온보딩
// ============================================
export const ONBOARDING = {
  // Step 1: 닉네임
  NICKNAME: {
    TITLE: "닉네임을 정해주세요",
    PLACEHOLDER: "NICKNAME (영문, 2-10자)",
    CHECK_BUTTON: "중복 확인",
    AVAILABLE: "사용 가능한 닉네임이에요",
    DUPLICATE: "이미 사용 중인 닉네임이에요",
    INVALID: "영문·숫자·밑줄만, 2-10자",
    RESERVED: "사용할 수 없는 닉네임이에요",
    CHECKING: "확인 중...",
  },
  // Step 2: 타입 선택
  TYPE: {
    TITLE: "나의 사우나 라이프 스타일은?",
    SUBTITLE: "나의 사우나 스타일은?",
  },
  // 공통
  NEXT_BUTTON: "다음",
  START_BUTTON: "시작하기",
};

// ============================================
// Quick Log 입력 항목
// ============================================

// 공통 냉탕 온도 config (saunner/bather 공유)
const COLD_BATH_TEMP_CONFIG = {
  label: "냉탕 온도",
  shortLabel: "냉탕",
  min: 0,
  max: 30,
  unit: "°C",
  steps: [
    { value: 0, label: "냉동" },
    { value: 5, label: "냉장" },
    { value: 10, label: "차갑" },
    { value: 16, label: "시원" },
    { value: 25, label: "미지근" },
  ],
} as const;

export const QUICK_LOG = {
  // 공통 항목
  COMMON: {
    REVISIT: {
      label: "또 갈래요",
      labelEn: "REVISIT",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "안가요" },
        { value: 2, label: "대안 없다면" },
        { value: 3, label: "근처면 가요" },
        { value: 4, label: "찾아가요" },
        { value: 5, label: "꼭 가야해요!" },
      ],
    },
    // 냉탕 온도 (saunner 필수 / bather 선택)
    COLD_BATH_TEMP: { ...COLD_BATH_TEMP_CONFIG, labelEn: "COLD BATH" },
    // 루틴 기록 (전 타입 선택 — 탭 시 활성화, 초기화 버튼으로 리셋)
    ROUTINE: {
      HEAT: {
        label: "HEAT",
        labelEn: "HEAT",
        placeholder: 12,
        min: 1,
        max: 60,
        unit: "분",
      },
      ICE: {
        label: "ICE",
        labelEn: "ICE",
        placeholder: 60,
        min: 10,
        max: 90,
        step: 10,
        unit: "초",
      },
      PAUSE: {
        label: "PAUSE",
        labelEn: "PAUSE",
        placeholder: 5,
        min: 1,
        max: 30,
        unit: "분",
      },
      REPEAT: {
        label: "REPEAT",
        labelEn: "REPEAT",
        placeholder: 3,
        min: 1,
        max: 7,
        unit: "sets",
      },
      // 트라이브별 placeholder 오버라이드 (saunner/bather는 기본값 사용)
      PLACEHOLDER_BY_TRIBE: {
        saunner: { HEAT: 12, ICE: 60, PAUSE: 5, REPEAT: 3 },
        bather: { HEAT: 12, ICE: 60, PAUSE: 5, REPEAT: 3 },
        jimi: { HEAT: 15, PAUSE: 10, REPEAT: 3 },
      },
    },
  },

  // 목욕파 전용
  BATHER: {
    HOT_BATH_TEMP: {
      label: "목욕물 온도",
      shortLabel: "온탕",
      labelEn: "HOT BATH",
      min: 30,
      max: 46,
      unit: "°C",
      steps: [
        { value: 30, label: "미지근" },
        { value: 35, label: "따뜻" },
        { value: 39, label: "뜨끈" },
        { value: 42, label: "펄펄" },
      ],
    },
    WATER_QUALITY: {
      label: "수질",
      shortLabel: "수질",
      labelEn: "WATER QUALITY",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "매우 탁함" },
        { value: 2, label: "조금 탁함" },
        { value: 3, label: "보통" },
        { value: 4, label: "청량" },
        { value: 5, label: "생명수" },
      ],
    },
  },

  // 사우너파 전용
  SAUNER: {
    SAUNA_TEMP: {
      label: "건식 사우나 온도",
      shortLabel: "건식",
      labelEn: "DRY SAUNA",
      min: 50,
      max: 130,
      unit: "°C",
      steps: [
        { value: 50, label: "미지근" },
        { value: 65, label: "따뜻" },
        { value: 85, label: "뜨끈" },
        { value: 100, label: "후끈" },
        { value: 120, label: "지옥" },
      ],
    },
    STEAM_SAUNA_TEMP: {
      label: "습식 사우나 온도",
      shortLabel: "습식",
      labelEn: "STEAM SAUNA",
      min: 40,
      max: 75,
      unit: "°C",
      steps: [
        { value: 40, label: "미지근" },
        { value: 48, label: "따뜻" },
        { value: 55, label: "뜨끈" },
        { value: 62, label: "뜨겁" },
        { value: 70, label: "찜기" },
      ],
    },
    // 주 이용 사우나 안내 (둘 다 입력 시 표시)
    PRIMARY_PROMPT: "주 이용 사우나를 선택해주세요",
    TOGGLE_DRY_LABEL: "건식",
    TOGGLE_STEAM_LABEL: "습식",
    TOTONO: {
      label: "토토노우",
      shortLabel: "토토노우",
      labelEn: "TOTONO",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "없음" },
        { value: 2, label: "미약" },
        { value: 3, label: "좋음" },
        { value: 4, label: "최고" },
        { value: 5, label: "승천" },
      ],
    },
  },

  // 찜질파 전용
  JIMI: {
    JJIM_TEMP: {
      label: "한증막 온도",
      shortLabel: "한증막",
      labelEn: "JJIMJIL",
      min: 70,
      max: 130,
      unit: "°C",
      steps: [
        { value: 70, label: "따뜻" },
        { value: 85, label: "뜨끈" },
        { value: 100, label: "후끈" },
        { value: 115, label: "지글지글" },
        { value: 130, label: "용암" },
      ],
    },
    SWEAT_QUALITY: {
      label: "땀 만족도",
      shortLabel: "땀",
      labelEn: "SWEAT QUALITY",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "건조" },
        { value: 2, label: "삐질" },
        { value: 3, label: "촉촉" },
        { value: 4, label: "방울" },
        { value: 5, label: "해독" },
      ],
    },
    REST_QUALITY: {
      label: "휴식 퀄리티",
      shortLabel: "휴식",
      labelEn: "REST QUALITY",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "별로" },
        { value: 2, label: "아쉬움" },
        { value: 3, label: "보통" },
        { value: 4, label: "개운" },
        { value: 5, label: "완벽" },
      ],
    },
  },
};

// ============================================
// 계산 메트릭 라벨 (QUICK_LOG에 대응 항목이 없는 파생값)
// ============================================
export const COMPUTED_METRICS = {
  saunner: { label: "온도 차이", labelEn: "TEMP DELTA" },
  bather: { label: "목욕 온도", labelEn: "BATH TEMP" },
  jimi: { label: "한증막 온도", labelEn: "JJIMJIL TEMP" },
} as const;

// ============================================
// 장소 스펙 옵션 (크라우드소싱 데이터)
// ============================================
export const PLACE_SPECS = {
  // 온열 시설
  HEAT: {
    label: "HEAT 온열",
    options: [
      {
        id: "hot-bath",
        label: "온탕",
        icon: "heat",
        category: "heat",
        tempRange: [35, 43],
      },
      {
        id: "very-hot-bath",
        label: "열탕",
        icon: "emergency_heat_2",
        category: "heat",
        tempRange: [40, 46],
      },
      {
        id: "dry-sauna",
        label: "건식사우나",
        icon: "sauna",
        category: "heat",
        tempRange: [50, 130],
      },
      {
        id: "steam-sauna",
        label: "습식사우나",
        icon: "water_voc",
        category: "heat",
        tempRange: [40, 75],
      },
      {
        id: "bulgama",
        label: "불한증막",
        icon: "warehouse",
        category: "heat",
        tempRange: [60, 140],
      },
      {
        id: "salt-sauna",
        label: "소금사우나",
        icon: "salinity",
        category: "heat",
      },
    ],
  },
  // 냉각 시설
  ICE: {
    label: "ICE 냉각",
    options: [
      {
        id: "cold-bath",
        label: "냉탕",
        icon: "ac_unit",
        category: "ice",
        tempRange: [15, 30],
      },
      {
        id: "ice-bath",
        label: "급냉탕",
        icon: "severe_cold",
        category: "ice",
        tempRange: [0, 20],
      },
      { id: "ice-room", label: "아이스방", icon: "icecream", category: "ice" },
    ],
  },
  // 휴식 시설
  PAUSE: {
    label: "PAUSE 휴식",
    options: [
      {
        id: "outdoor-rest",
        label: "외기욕(바깥)",
        icon: "chair_umbrella",
        category: "pause",
      },
      {
        id: "indoor-rest",
        label: "내기욕(실내)",
        icon: "living",
        category: "pause",
      },
    ],
  },
  // 추가 시설
  BEYOND: {
    label: "BEYOND 추가",
    options: [
      {
        id: "open-air-bath",
        label: "노천탕",
        icon: "bath_outdoor",
        category: "beyond",
        tempRange: [35, 45],
      },
      {
        id: "jjimjilbang",
        label: "찜질방",
        icon: "foundation",
        category: "beyond",
      },
      {
        id: "aufguss",
        label: "아우프구스",
        icon: "airwave",
        category: "beyond",
      },
      {
        id: "self-loyly",
        label: "셀프 뢰일리",
        icon: "format_color_fill",
        category: "beyond",
      },
      { id: "scrub", label: "세신", icon: "spa", category: "beyond" },
      { id: "massage", label: "마사지", icon: "massage", category: "beyond" },
    ],
  },
  // 편의 정보
  AMENITIES: {
    label: "COMFORT 편의",
    options: [
      {
        id: "dryer-free",
        label: "드라이기 무료",
        icon: "air",
        category: "amenities",
      },
      {
        id: "dryer-paid",
        label: "드라이기 유료",
        icon: "air",
        category: "amenities",
      },
      {
        id: "towel",
        label: "수건 제공",
        icon: "dry_cleaning",
        category: "amenities",
      },
      {
        id: "shampoo-bodywash",
        label: "샴푸/바디워시",
        icon: "clean_hands",
        category: "amenities",
      },
      {
        id: "tattoo-friendly",
        label: "타투 가능",
        icon: "brush",
        category: "amenities",
      },
      {
        // 시스템 자동 부여용 (JP 모달에서만 설정) — 입력 폼에선 숨기고 조회에만 노출
        id: "tattoo-cover",
        label: "타투 가능(커버)",
        icon: "brush",
        category: "amenities",
        hiddenInInput: true,
      },
      {
        id: "workspace",
        label: "작업 공간",
        icon: "laptop",
        category: "amenities",
      },
      { id: "food", label: "매점", icon: "dining", category: "amenities" },
      {
        id: "sleep-room",
        label: "수면실",
        icon: "airline_seat_flat",
        category: "amenities",
      },
      {
        id: "parking",
        label: "주차",
        icon: "local_parking",
        category: "amenities",
      },
    ],
  },
  // 매점 토글/평가 (Deep Log 전용 — 건드리지 않음)
  STORE: {
    label: "매점",
    toggleLabel: "이용 함",
    memoPlaceholder: "추천 메뉴 메모 (예: 식혜가 시원하고 맛있음)",
    rating: {
      label: "매점 평가",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "맛없음" },
        { value: 2, label: "아쉬움" },
        { value: 3, label: "평범" },
        { value: 4, label: "맛있음" },
        { value: 5, label: "꿀맛집" },
      ],
    },
  },
};

// ============================================
// BLOCK_TYPES SSOT — 로그 블록 카탈로그 (log_blocks 정본)
// 설계: docs/po/PLAN_로그_컷오버_20260606.md
// ⚠️ 카탈로그(pickable) ≠ block_type: 일부 항목은 blockType+variant로 매핑(건강세신).
//    rest·건강세신은 시설(PLACE_SPECS) 아님 = 카탈로그 전용.
// ============================================
export type BlockCategory = "heat" | "ice" | "rest" | "beyond";
export type DurUnit = "min" | "sec" | null;
// 온도·시간 없는 블록의 평가 의미(점수/가격/메모) 라우팅
export type BlockEvalKind = "rest" | "scrub" | "massage" | "snack" | "restaurant" | null;

export interface BlockTypeDef {
  id: string; // 카탈로그 id (pickable)
  blockType: string; // log_blocks.block_type 저장값 (보통 = id)
  variant?: string; // log_blocks.variant (건강세신 = 'withmassage')
  label: string;
  icon: string;
  category: BlockCategory;
  tempRange?: [number, number]; // heat/ice 온도시설
  tempSteps?: { value: number; label: string }[]; // 온도 슬라이더 질적 라벨(D2)
  durUnit: DurUnit; // 입력 단위(냉탕/급냉=초, 그외 분). DB는 duration_sec
  cacheCol?: string; // logs 온도 캐시 컬럼
  evalKind?: BlockEvalKind; // 평가행 의미(없으면 순수 행동)
  catalogOnly?: boolean; // 시설(PLACE_SPECS) 아님
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  // ── HEAT ──
  { id: "dry-sauna", blockType: "dry-sauna", label: "건식", icon: "sauna", category: "heat", durUnit: "min", cacheCol: "dry_sauna_temp", tempRange: [50, 130], tempSteps: [ { value: 50, label: "미지근" }, { value: 65, label: "따뜻" }, { value: 85, label: "뜨끈" }, { value: 100, label: "후끈" }, { value: 120, label: "지옥" } ] },
  { id: "steam-sauna", blockType: "steam-sauna", label: "습식", icon: "water_voc", category: "heat", durUnit: "min", cacheCol: "steam_sauna_temp", tempRange: [40, 75], tempSteps: [ { value: 40, label: "미지근" }, { value: 48, label: "따뜻" }, { value: 55, label: "뜨끈" }, { value: 62, label: "뜨겁" }, { value: 70, label: "찜기" } ] },
  { id: "salt-sauna", blockType: "salt-sauna", label: "소금", icon: "salinity", category: "heat", durUnit: "min", cacheCol: "salt_sauna_temp", tempRange: [40, 70], tempSteps: [ { value: 40, label: "미온" }, { value: 55, label: "적당" }, { value: 70, label: "뜨끈" } ] },
  { id: "hot-bath", blockType: "hot-bath", label: "온탕", icon: "heat", category: "heat", durUnit: "min", cacheCol: "hot_bath_temp", tempRange: [35, 43], tempSteps: [ { value: 35, label: "미지근" }, { value: 37, label: "따뜻" }, { value: 39, label: "적당" }, { value: 41, label: "뜨끈" }, { value: 42, label: "뜨겁" } ] },
  { id: "very-hot-bath", blockType: "very-hot-bath", label: "열탕", icon: "emergency_heat_2", category: "heat", durUnit: "min", cacheCol: "very_hot_bath_temp", tempRange: [38, 46], tempSteps: [ { value: 38, label: "따뜻" }, { value: 40, label: "뜨끈" }, { value: 42, label: "뜨겁" }, { value: 44, label: "극열" }, { value: 46, label: "삶음" } ] },
  { id: "bulgama", blockType: "bulgama", label: "한증막", icon: "warehouse", category: "heat", durUnit: "min", cacheCol: "bulgama_temp", tempRange: [60, 140], tempSteps: [ { value: 70, label: "따뜻" }, { value: 90, label: "뜨끈" }, { value: 105, label: "후끈" }, { value: 120, label: "지글지글" }, { value: 140, label: "용암" } ] },
  { id: "open-air-bath", blockType: "open-air-bath", label: "노천탕", icon: "bath_outdoor", category: "heat", durUnit: "min", cacheCol: "open_air_bath_temp", tempRange: [30, 45], tempSteps: [ { value: 30, label: "미지근" }, { value: 38, label: "따뜻" }, { value: 45, label: "뜨끈" } ] },
  // ── ICE ──
  { id: "cold-bath", blockType: "cold-bath", label: "냉탕", icon: "ac_unit", category: "ice", durUnit: "sec", cacheCol: "cold_bath_temp", tempRange: [5, 30], tempSteps: [ { value: 5, label: "극냉" }, { value: 10, label: "차가움" }, { value: 15, label: "시원" }, { value: 20, label: "미지근" }, { value: 30, label: "미온" } ] },
  { id: "ice-bath", blockType: "ice-bath", label: "급냉탕", icon: "severe_cold", category: "ice", durUnit: "sec", cacheCol: "ice_bath_temp", tempRange: [0, 15], tempSteps: [ { value: 0, label: "얼음" }, { value: 5, label: "극냉" }, { value: 10, label: "짜릿" }, { value: 15, label: "차갑" } ] },
  { id: "ice-room", blockType: "ice-room", label: "아이스방", icon: "icecream", category: "ice", durUnit: "min", cacheCol: "ice_room_temp", tempRange: [0, 15], tempSteps: [ { value: 0, label: "얼음" }, { value: 8, label: "쌀쌀" }, { value: 15, label: "시원" } ] },
  // ── PAUSE(rest) ──
  { id: "rest", blockType: "rest", label: "휴식", icon: "self_improvement", category: "rest", durUnit: "min", evalKind: "rest", catalogOnly: true },
  { id: "outdoor-rest", blockType: "outdoor-rest", label: "외기욕", icon: "chair_umbrella", category: "rest", durUnit: "min", evalKind: "rest" },
  { id: "indoor-rest", blockType: "indoor-rest", label: "내기욕", icon: "living", category: "rest", durUnit: "min", evalKind: "rest" },
  // ── BEYOND ──
  // 선택 빈도 높은 순서로 정렬 (팔레트 노출 순서)
  { id: "scrub", blockType: "scrub", variant: "basic", label: "세신", icon: "spa", category: "beyond", durUnit: null, evalKind: "scrub" },
  { id: "scrub-withmassage", blockType: "scrub", variant: "withmassage", label: "마사지세신", icon: "spa", category: "beyond", durUnit: null, evalKind: "scrub", catalogOnly: true },
  { id: "massage", blockType: "massage", label: "마사지", icon: "massage", category: "beyond", durUnit: null, evalKind: "massage" },
  { id: "snack", blockType: "snack", label: "매점", icon: "dining", category: "beyond", durUnit: null, evalKind: "snack" },
  { id: "restaurant", blockType: "restaurant", label: "식당", icon: "restaurant", category: "beyond", durUnit: null, evalKind: "restaurant" },
  { id: "sleep-room", blockType: "sleep-room", label: "수면", icon: "airline_seat_flat", category: "beyond", durUnit: null, evalKind: "rest" },
  { id: "aufguss", blockType: "aufguss", label: "아우프구스", icon: "airwave", category: "beyond", durUnit: "min" },
  { id: "other", blockType: "other", label: "기타", icon: "more_horiz", category: "beyond", durUnit: "min" },
];

export const BLOCK_TYPE_MAP: Record<string, BlockTypeDef> = Object.fromEntries(
  BLOCK_TYPES.map((b) => [b.id, b]),
);

// 트라이브별 기본 노출 블록 (팔레트 상단 숏컷)
export const TRIBE_DEFAULT_BLOCKS: Record<string, string[]> = {
  saunner: ["dry-sauna", "steam-sauna", "cold-bath", "hot-bath", "rest"],
  bather: ["hot-bath", "very-hot-bath", "cold-bath", "scrub", "rest"],
  jimi: ["bulgama", "ice-room", "snack", "sleep-room", "rest"],
};

// 레인 카테고리 메타 (활동 전체보기)
export const BLOCK_CATEGORY_META: Record<BlockCategory, { label: string; icon: string }> = {
  heat: { label: "HEAT", icon: "local_fire_department" },
  ice: { label: "ICE", icon: "ac_unit" },
  rest: { label: "PAUSE", icon: "self_improvement" },
  beyond: { label: "BEYOND", icon: "auto_awesome" },
};

// ============================================
// Deep Log 입력 항목
// ============================================
export const DEEP_LOG = {
  // 탕 선택 (남탕/여탕/혼탕/개인)
  BATH_GENDER: {
    label: "탕 선택",
    options: LOG_BATH_GENDER,
  },
  COMPANION: {
    label: "동행",
    options: [
      { id: "alone", label: "혼자", icon: "person" },
      { id: "friend", label: "친구", icon: "group" },
      { id: "family", label: "가족", icon: "family_restroom" },
      { id: "partner", label: "연인", icon: "partner_heart" },
    ],
  },
  COST: {
    label: "비용",
    placeholder: "입장료를 입력해주세요",
    // 상단 고정 통화 (셀렉터에서 구분선 위에 표시)
    pinnedCurrencies: ["USD", "KRW", "JPY", "EUR"] as const,
  },
  MEMO: {
    label: "자유 메모",
    placeholder:
      "오늘의 경험을 메모해보세요...(특별히 좋았던 점, 아쉬웠던 점이 있었나요?)",
  },
  CROWD: {
    label: "혼잡도",
    options: [
      { id: "empty", label: "쾌적", icon: "hot_tub" },
      { id: "moderate", label: "적당", icon: "bath_private" },
      { id: "busy", label: "북적", icon: "bath_public_large" },
      { id: "full", label: "자리 없음", icon: "crowdsource" },
    ],
  },
  CLEANLINESS: {
    label: "청결도",
    labelEn: "CLEANLINESS",
    min: 1,
    max: 5,
    steps: [
      { value: 1, label: "불결" },
      { value: 2, label: "아쉬움" },
      { value: 3, label: "깔끔" },
      { value: 4, label: "청결" },
      { value: 5, label: "광이남" },
    ],
  },
  SAUNA_TEMPS: {
    label: "사우나 온도",
    labelEn: "SAUNA TEMPS",
    toggleLabel: "기록",
    toggleLabelActive: "기록 중",
    DRY: {
      label: "건식",
      min: 50,
      max: 130,
      unit: "°C",
      steps: [
        { value: 50, label: "미온" },
        { value: 70, label: "따뜻" },
        { value: 85, label: "적당" },
        { value: 100, label: "뜨거움" },
        { value: 130, label: "극한" },
      ],
    },
    STEAM: {
      label: "습식",
      min: 40,
      max: 75,
      unit: "°C",
      steps: [
        { value: 40, label: "미지근" },
        { value: 48, label: "따뜻" },
        { value: 55, label: "뜨끈" },
        { value: 62, label: "뜨겁" },
        { value: 70, label: "찜기" },
      ],
    },
  },
  BATH_TEMPS: {
    label: "탕 온도",
    labelEn: "BATH TEMPS",
    toggleLabel: "기록",
    toggleLabelActive: "기록 중",
    HOT_BATH: {
      label: "온탕",
      min: 35,
      max: 42,
      unit: "°C",
      steps: [
        { value: 35, label: "미지근" },
        { value: 37, label: "따뜻" },
        { value: 39, label: "적당" },
        { value: 41, label: "뜨끈" },
        { value: 42, label: "뜨겁" },
      ],
    },
    VERY_HOT_BATH: {
      label: "열탕",
      min: 38,
      max: 46,
      unit: "°C",
      steps: [
        { value: 38, label: "따뜻" },
        { value: 40, label: "뜨끈" },
        { value: 42, label: "뜨겁" },
        { value: 44, label: "극열" },
        { value: 46, label: "삶음" },
      ],
    },
    COLD_BATH: {
      label: "냉탕",
      min: 5,
      max: 30,
      unit: "°C",
      steps: [
        { value: 5, label: "극냉" },
        { value: 10, label: "차가움" },
        { value: 15, label: "시원" },
        { value: 20, label: "미지근" },
        { value: 30, label: "미온" },
      ],
    },
    ICE_BATH: {
      label: "급냉탕",
      min: 0,
      max: 15,
      unit: "°C",
      steps: [
        { value: 0, label: "얼음" },
        { value: 5, label: "극냉" },
        { value: 10, label: "짜릿" },
        { value: 15, label: "차갑" },
      ],
    },
  },
  SCRUB: {
    label: "세신/마사지",
    toggleLabel: "기록",
    toggleLabelActive: "기록 중",
    types: [
      { id: "scrub", label: "일반 세신" },
      { id: "massage", label: "마사지" },
    ],
    costPlaceholder: "가격을 입력해주세요",
    satisfaction: {
      label: "만족도는 어떠셨나요?",
      min: 1,
      max: 5,
      steps: [
        { value: 1, label: "별로" },
        { value: 2, label: "아쉬움" },
        { value: 3, label: "만족" },
        { value: 4, label: "시원" },
        { value: 5, label: "극락" },
      ],
    },
  },
};

// ============================================
// 메시지
// ============================================
export const MESSAGES = {
  HOME: {
    GREETING: "HELLO SA-PIEN",
    CALENDAR_HEADING: (name?: string) =>
      name ? `${name.toUpperCase()}의 기록` : "나의 기록",
    NO_RECORDS: "이 날은 기록이 없어요",
    RECENT_RECORDS: "최근 기록",
    TODAY: "오늘",
    VIEW_ALL: "내 기록 전체보기",
    TOOLTIP_CTA: "오늘 사우나 어땠어요?",
    EMPTY_RECORD: {
      saunner: "사우나 땡긴다..",
      bather: "목욕 하고싶다..",
      jimi: "지지고 싶다..",
    },
    TODAY_HEADING: "오늘의 기록",
    CTA_BUTTON: "기록하기",
    COMMUNITY_HEADING: "사-피엔스 라이브",
    COMMUNITY_EMPTY: "아직 조용하네요..",

    // ── 홈 리디자인 (2026-06) 문구 — 한곳에서 관리 ──
    HERO_HELLO: "HELLO",
    HERO_BRAND: "SA-PIEN",
    HERO_SUBTITLE: "우리는 사우나 신인류",
    // 스탬프 카드
    STAMP_GUEST_NAME: "SA-PIEN",
    STAMP_FILL_PROMPT: "나만의 사우나 도장판 채우기!",
    // 사-첵 포스트잇 CTA (문구 = PREFIX + SUFFIX, SUFFIX는 빨강 강조)
    CTA_PREFIX_RETURNING: "오늘도", // 로그인 + 기록 있음
    CTA_PREFIX_NEW: "사우나",       // 비로그인 · 신규(기록 0)
    CTA_SUFFIX: "첵!",
    // 섹션 헤딩/서브
    TRIBE_HEADING: "TRIBE PICKS",
    TRIBE_SUBTITLE: "실시간 업데이트 트라이브별 베스트 사우나!",
    FEATURED_HEADING: "SA-PI FEATURED",
    FEATURED_SUBTITLE: "고수들의 추천 사우나",
  },
  LOG: {
    SELECT_PLACE: "장소 선택",
    SEARCH_PLACEHOLDER: "사우나를 검색해보세요!",
    NEARBY: "내 주변",
    ADD_PLACE: "직접 장소 추가",
    DEEP_LOG_BUTTON: "자세히 기록하기",
    SAVING: "저장 중...",
  },
  COMPLETE: {
    TITLE: "기록 완료!",
    SUBTITLE: (place: string) => `${place}에서의 기록이 저장되었어요`,
  },
  ERROR: {
    LOAD_FAILED: "불러오기에 실패했어요",
    SAVE_FAILED: "저장에 실패했어요",
    LOCATION_DENIED: "위치 권한이 필요해요",
    RETRY: "다시 시도해주세요",
  },
};

// ============================================
// 버튼 텍스트
// ============================================
export const BUTTONS = {
  SAVE: "저장",
  CANCEL: "취소",
  NEXT: "다음",
  BACK: "뒤로",
  DONE: "완료",
  SHARE: "공유",
  VIEW_LIST: "리스트 보기",
  CREATE_STORY: "카드 만들기",
  ADD_RECORD: "오늘의 기록",
  RETRY: "다시 시도",
};

// ============================================
// Material Symbols 아이콘
// ============================================
export const ICONS = {
  HOME: "home",
  HISTORY: "history",
  SETTINGS: "settings",
  EXPLORE: "explore",
  MY: "manage_accounts",
  HEART_SAVED: "bookmark_heart",
  HEART_UNSAVED: "bookmark_heart",
  FAVORITE: "bookmark_heart",
  FAVORITE_BORDER: "bookmark_heart",
  BACK: "arrow_back",
  CLOSE: "close",
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  SAVE: "check",
  SHARE: "share",
  SEARCH: "search",
  PLACE: "location_on",
  CALENDAR: "calendar_today",
  TIME: "schedule",
  PHOTO: "photo_camera",
  CHEVRON_RIGHT: "chevron_right",
  CHEVRON_DOWN: "expand_more",
  CHEVRON_UP: "expand_less",
  SA_LIST: "diagnosis",
  INFO: "info",
  STAR: "star",
  THERMOMETER: "device_thermostat",
  FILTER: "tune",
  MAP: "map",
};

// ============================================
// 네비게이션
// ============================================
export const NAV = {
  HOME: "홈",
  HISTORY: "내 기록",
  SA_LIST: "사-리스트",
  EXPLORE: "사우나 찾기",
  MY: "마이",
  ADD_RECORD: "기록하기",
  COMING_SOON: "coming soon",
};

// ============================================
// 설정
// ============================================
// ============================================
// 탐색 페이지
// ============================================
export const EXPLORE = {
  TITLE: "탐색",
  SEARCH_PLACEHOLDER: "장소명 또는 주소 검색 (해외 사우나는 영어로!)",
  FILTER_BUTTON: "필터",
  SORT: {
    LABEL: "정렬",
    RECOMMENDED: "추천순",
    POPULAR: "인기순",
    NEARBY: "가까운",
  },
  TOGGLE_24H: "24시 영업",
  RECOMMENDATION: {
    SAUNNER: "SAUNNER PICK",
    BATHER: "BATHER PICK",
    JIMI: "JIMI PICK",
  },
  NO_RESULTS: "조건에 맞는 장소가 없습니다",
  AVG_RATING: "평균",
  LOG_COUNT: (count: number) => `${count}건의 흔적`,
  VIEW_ALL: "전체 보기",
  REVISIT_LABEL: "또 갈래요",
};

// ============================================
// 장소 상세 페이지
// ============================================
export const PLACE_DETAIL = {
  FACILITIES: "시설 정보",
  AVG_RATING: "평균 평가",
  RATING_SUMMARY: (avg: string, count: number) =>
    `평균 ${avg} · ${count}건의 흔적`,
  NO_LOGS: "아직 기록이 없어요",
  LOGS_TITLE: "사-피엔스의 흔적",
  MORE_LOGS: "더보기",
  RECORD_CTA: "이 장소에서 기록하기",
  NAVER_MAP: "네이버 지도",
  GOOGLE_MAP: "구글 지도",
};

// ============================================
// 마이 페이지
// ============================================
export const MY_PAGE = {
  TITLE: "마이",
};

// ============================================
// 탐색 필터 항목 (PLACE_SPECS id 참조)
// ============================================
export const EXPLORE_FILTERS = {
  HEAT: {
    label: PLACE_SPECS.HEAT.label,
    options: [
      "hot-bath",
      "very-hot-bath",
      "dry-sauna",
      "steam-sauna",
      "bulgama",
      "salt-sauna",
    ],
  },
  ICE: {
    label: PLACE_SPECS.ICE.label,
    options: ["cold-bath", "ice-bath", "ice-room"],
  },
  PAUSE: {
    label: PLACE_SPECS.PAUSE.label,
    options: ["outdoor-rest", "indoor-rest"],
  },
  BEYOND: {
    label: PLACE_SPECS.BEYOND.label,
    options: ["open-air-bath", "jjimjilbang", "aufguss", "self-loyly", "scrub", "massage"],
  },
  AMENITIES: {
    label: PLACE_SPECS.AMENITIES.label,
    options: ["food", "sleep-room", "workspace", "tattoo-friendly"],
  },
  GENDER: {
    label: "탕 구분",
    options: ["male-only", "female-only", "mixed"],
  },
} as const;

// 전체 시설 ID → 라벨 통합 매핑 (PLACE_SPECS 모든 섹션 + PLACE_VENUE_TYPE)
export const FACILITY_LABEL_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const sections = [
    PLACE_SPECS.HEAT,
    PLACE_SPECS.ICE,
    PLACE_SPECS.PAUSE,
    PLACE_SPECS.BEYOND,
    PLACE_SPECS.AMENITIES,
  ];
  for (const section of sections) {
    for (const opt of section.options) {
      map[opt.id] = opt.label;
    }
  }
  for (const opt of PLACE_VENUE_TYPE) {
    map[opt.id] = opt.label;
  }
  for (const opt of PLACE_BATH_POLICY) {
    map[opt.id] = opt.label;
  }
  return map;
})();

// 전체 시설 ID → 아이콘 통합 매핑 (PLACE_SPECS 모든 섹션 + PLACE_VENUE_TYPE + PLACE_BATH_POLICY)
export const FACILITY_ICON_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const sections = [
    PLACE_SPECS.HEAT,
    PLACE_SPECS.ICE,
    PLACE_SPECS.PAUSE,
    PLACE_SPECS.BEYOND,
    PLACE_SPECS.AMENITIES,
  ];
  for (const section of sections) {
    for (const opt of section.options) {
      map[opt.id] = opt.icon;
    }
  }
  for (const opt of PLACE_VENUE_TYPE) {
    map[opt.id] = opt.icon;
  }
  for (const opt of PLACE_BATH_POLICY) {
    map[opt.id] = opt.icon;
  }
  return map;
})();

/** 입력 폼에 노출 가능한 옵션 필터 — hiddenInInput=true는 조회/자동 부여 전용 */
export const isInputVisibleOption = (o: object): boolean =>
  !(o as { hiddenInInput?: boolean }).hiddenInInput;

// ============================================
// 크리에이터 소셜 링크
// ============================================
export const CREATOR_LINK_PLATFORMS = [
  { id: 'instagram', label: '인스타그램', prefix: 'https://instagram.com/' },
  { id: 'naver_blog', label: '네이버 블로그', prefix: 'https://blog.naver.com/' },
  { id: 'threads', label: '스레드', prefix: 'https://threads.net/@' },
] as const

export const CREATOR_LINK_PREFIXES: Record<string, string> = Object.fromEntries(
  CREATOR_LINK_PLATFORMS.map((p) => [p.id, p.prefix])
)
