-- ============================================
-- SAUNA LOG - 초기 데이터베이스 스키마
-- ============================================
-- Supabase SQL Editor에서 이 파일을 실행하세요.
-- Dashboard → SQL Editor → New Query → 붙여넣기 → Run

-- ============================================
-- 1. USERS 테이블 - 사용자 프로필
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  -- 성별 (남탕/여탕 구분용)
  gender TEXT CHECK (gender IN ('male', 'female')),
  -- 선택한 타입들 (순서대로 저장: ["sauner", "bather", "jimi"])
  user_types TEXT[] DEFAULT '{}',
  -- 최선호 타입 (user_types 배열의 첫 번째 값, 홈 메시지/퀵로그 기본값으로 사용)
  primary_type TEXT CHECK (primary_type IN ('bather', 'sauner', 'jimi')),
  -- 마지막 사용 템플릿 (스토리 공유 시 기본값)
  last_used_template TEXT DEFAULT 'minimal' CHECK (last_used_template IN ('minimal', 'dark', 'gradient', 'retro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. PLACES 테이블 - 장소의 스펙 (변하지 않는 정보)
-- ============================================
-- "이 곳에 무엇이 있는가?"
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  -- 위치 정보 (위도, 경도)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- 카테고리는 장소가 아닌 logs 테이블의 log_type으로 관리
  -- (한 장소에서 사우나/목욕/찜질 모두 가능할 수 있음)
  -- 외부 API 연동은 place_sources 테이블에서 1:N으로 관리
  -- (같은 장소가 Naver/Google 양쪽에서 등록될 수 있음)

  -- ========== 시설 스펙 (정적 정보) ==========
  -- ※ 사용자가 처음 Deep Log 작성 시 장소 정보도 함께 등록 (크라우드소싱)

  -- 탕 구성 (JSONB: 각 탕별 존재 여부 + 온도)
  -- 예: {"냉탕": {"temp": 15}, "온탕": {"temp": 42}, "열탕": {"temp": 45}, "노천탕": {}}
  -- 탕 종류: 냉탕, 급냉탕, 온탕, 열탕, 미온탕, 노천탕
  baths JSONB DEFAULT '{}',

  -- 사우나 구성 (JSONB: 각 사우나별 존재 여부 + 온도)
  -- 예: {"건식": {"temp": 90}, "습식": {"temp": 70}, "로류": {}}
  -- 사우나 종류: 건식, 습식, 아로마, 로류
  saunas JSONB DEFAULT '{}',

  -- 기본 편의시설
  is_dryer_free BOOLEAN,  -- 드라이기 무료 여부 (NULL: 정보없음)
  has_amenities BOOLEAN,  -- 어메니티 구비 여부
  has_towel_service BOOLEAN,  -- 수건 지급 여부

  -- 매점
  has_store BOOLEAN,  -- 매점 유무
  store_recommended TEXT,  -- 매점 추천메뉴 (선택 입력)

  -- 찜질방 전용 (JSONB: 각 방별 존재 여부 + 온도(불한증막만))
  -- 예: {"불한증막": {"temp": 80}, "소금방": {}, "아이스방": {}}
  -- 방 종류: 불한증막, 소금방, 아이스방, 황토방, 토굴방
  rooms JSONB DEFAULT '{}',
  has_sleep_room BOOLEAN,  -- 수면실 유무

  -- 메타 정보
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- 모든 로그인 사용자가 장소 조회 가능
CREATE POLICY "Anyone can view places" ON places
  FOR SELECT USING (true);

-- 로그인 사용자만 장소 추가 가능
CREATE POLICY "Authenticated users can add places" ON places
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 2-1. PLACE_SOURCES 테이블 - 외부 API 연동 정보
-- ============================================
-- 하나의 장소가 Naver/Google 양쪽에서 등록될 수 있음
-- 좌표 기반 매칭으로 같은 장소면 하나의 place에 여러 source 연결
CREATE TABLE IF NOT EXISTS place_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('naver', 'google', 'manual')),
  external_id TEXT,  -- 외부 API 고유 ID
  name_original TEXT,  -- 해당 소스에서 가져온 원본 이름
  address_original TEXT,  -- 해당 소스에서 가져온 원본 주소
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 소스+외부ID 중복 방지
  UNIQUE(source, external_id)
);

ALTER TABLE place_sources ENABLE ROW LEVEL SECURITY;

-- 모든 로그인 사용자가 조회 가능
CREATE POLICY "Anyone can view place_sources" ON place_sources
  FOR SELECT USING (true);

-- 로그인 사용자만 추가 가능
CREATE POLICY "Authenticated users can add place_sources" ON place_sources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- place_sources 인덱스
CREATE INDEX IF NOT EXISTS idx_place_sources_place_id ON place_sources(place_id);

-- ============================================
-- 3. LOGS 테이블 - Quick Log (기본 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  -- 기록 날짜/시간
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  -- 공통: 재방문 의사 (1-5)
  revisit_score INT CHECK (revisit_score BETWEEN 1 AND 5),
  -- 기록 타입 (이 기록이 어떤 활동인지)
  log_type TEXT CHECK (log_type IN ('bather', 'saunner', 'jimi')),

  -- 목욕파 전용
  water_quality INT CHECK (water_quality BETWEEN 1 AND 5),
  hot_bath_temp INT CHECK (hot_bath_temp BETWEEN 38 AND 45),

  -- 사우너파 전용
  sauna_temp INT CHECK (sauna_temp BETWEEN 70 AND 110),
  cold_bath_temp INT CHECK (cold_bath_temp BETWEEN 5 AND 20),
  sets INT CHECK (sets BETWEEN 1 AND 10),
  totono_score INT CHECK (totono_score BETWEEN 1 AND 5),

  -- 찜질파 전용
  rest_quality INT CHECK (rest_quality BETWEEN 1 AND 5),
  cleanliness INT CHECK (cleanliness BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. DEEP_LOGS 테이블 - 그날의 경험 (매번 바뀌는 정보)
-- ============================================
-- "오늘 거기서 무엇을 했고, 어땠는가?"
CREATE TABLE IF NOT EXISTS deep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,

  -- ========== 공통 경험 ==========
  companion TEXT CHECK (companion IN ('alone', 'friend', 'family', 'partner')),
  purpose TEXT CHECK (purpose IN ('healing', 'after-workout', 'hangover', 'date', 'work')),
  cost INT,       -- 입욕료/입장료 (원)
  memo TEXT,      -- 자유 메모 ("노천탕 온도가 평소보다 낮아서 아쉬웠음")

  -- ========== 오늘 실제 이용한 시설들 ==========
  -- places 테이블의 시설 중 오늘 내가 이용한 것들
  used_sauna_types TEXT[] DEFAULT '{}',  -- 오늘 이용한 사우나 ['건식', '로류']
  used_rooms TEXT[] DEFAULT '{}',  -- 오늘 이용한 찜질방 ['불한증막', '소금방']
  used_amenities TEXT[] DEFAULT '{}',  -- 오늘 이용한 편의시설 ['안마의자', '수면실']

  -- ========== 그날의 컨디션/상황 ==========
  crowd TEXT CHECK (crowd IN ('empty', 'moderate', 'busy', 'full')),  -- 혼잡도

  -- ========== 세신 경험 (선택) ==========
  had_scrub BOOLEAN DEFAULT false,  -- 세신 받았는지
  scrub_satisfaction INT CHECK (scrub_satisfaction BETWEEN 1 AND 5),
  scrub_price INT,

  -- ========== 먹은 것들 ==========
  food_eaten TEXT[] DEFAULT '{}',  -- ['식혜', '계란']

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deep_logs ENABLE ROW LEVEL SECURITY;

-- deep_logs는 logs를 통해 user_id 확인
CREATE POLICY "Users can view own deep_logs" ON deep_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM logs WHERE logs.id = deep_logs.log_id AND logs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own deep_logs" ON deep_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM logs WHERE logs.id = deep_logs.log_id AND logs.user_id = auth.uid())
  );

CREATE POLICY "Users can update own deep_logs" ON deep_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM logs WHERE logs.id = deep_logs.log_id AND logs.user_id = auth.uid())
  );

-- ============================================
-- 5. 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_place_id ON logs(place_id);
CREATE INDEX IF NOT EXISTS idx_logs_logged_at ON logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_deep_logs_log_id ON deep_logs(log_id);

-- ============================================
-- 완료 메시지
-- ============================================
-- 이 스크립트 실행 후 테이블이 생성됩니다:
--
-- [users] - 사용자 프로필
--   - gender: 성별 (남탕/여탕 구분)
--   - user_types: 선택한 타입 배열 (순서대로)
--   - primary_type: 최선호 타입 (홈 메시지, 퀵로그 기본값)
--   - last_used_template: 마지막 사용 스토리 템플릿
--
-- [places] - "이 곳에 무엇이 있는가?" (정적 스펙)
--   ※ 사용자가 처음 Deep Log 작성 시 함께 등록 (크라우드소싱)
--   - 기본 정보: 이름, 주소, 좌표
--   - 카테고리 없음: 한 장소에서 사우나/목욕/찜질 모두 가능할 수 있으므로 logs.log_type으로 관리
--
-- [place_sources] - 외부 API 연동 (1:N)
--   - 같은 장소가 Naver/Google 양쪽에서 등록될 수 있음
--   - 좌표 기반 매칭 (반경 50m)으로 같은 장소면 하나의 place에 여러 source 연결
--   - 각 소스별 원본 이름/주소 보존
--   - 탕 구성 (JSONB): {"냉탕": {"temp": 15}, "온탕": {"temp": 42}, ...}
--     → 냉탕, 급냉탕, 미온탕, 온탕, 열탕, 노천탕
--   - 사우나 (JSONB): {"건식": {"temp": 90}, "습식": {"temp": 70}, ...}
--     → 건식, 습식, 아로마, 로류
--   - 편의시설: is_dryer_free, has_amenities, has_towel_service
--   - 매점: has_store, store_recommended (추천메뉴)
--   - 찜질방 (JSONB): {"불한증막": {"temp": 80}, "소금방": {}, ...}
--     → 불한증막(온도입력가능), 소금방, 아이스방, 황토방, 토굴방
--   - 수면실: has_sleep_room
--
-- [logs] - Quick Log (그날의 수치 - 동적)
--   - log_type: 기록 타입 (bather/saunner/jimi)
--   - 재방문 의사, 오늘 측정한 온도, 세트수, 토토노이 등
--
-- [deep_logs] - "오늘 거기서 무엇을 했고, 어땠는가?" (동적 경험)
--   - 공통: 동행자, 목적, 비용, 메모
--   - 이용 시설: 오늘 실제 이용한 사우나/방/편의시설
--   - 상황: 혼잡도, 세신 경험, 먹은 것들
