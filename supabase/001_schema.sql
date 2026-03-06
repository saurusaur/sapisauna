-- ============================================
-- SAUNA LOG - 통합 데이터베이스 스키마
-- ============================================
-- 기존 001 + 002 병합 + 버그 수정
-- Supabase SQL Editor에서 실행:
-- Dashboard → SQL Editor → New Query → 붙여넣기 → Run

-- ============================================
-- 1. USERS 테이블 - 사용자 프로필
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  -- 선택한 타입들 (순서대로: ["saunner", "bather", "jimi"])
  user_types TEXT[] DEFAULT '{}',
  -- 최선호 타입 (user_types[0], 홈/퀵로그 기본값)
  primary_type TEXT CHECK (primary_type IN ('bather', 'saunner', 'jimi')),
  last_used_template TEXT DEFAULT 'minimal' CHECK (last_used_template IN ('minimal', 'dark', 'gradient', 'retro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 닉네임 중복 확인용: 모든 인증 사용자가 닉네임 조회 가능
CREATE POLICY "Authenticated users can check nicknames" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2. PLACES 테이블 - 장소 (이름/주소는 place_sources에서 관리)
-- ============================================
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL DEFAULT 'KR',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- 시설 스펙 (평탄 배열: PLACE_SPECS의 id들)
  facilities TEXT[] DEFAULT '{}',
  is_24h BOOLEAN DEFAULT false,
  -- 시설 유형 (기본값: 일반 대중탕)
  facility_type TEXT NOT NULL DEFAULT 'gender-bath' CHECK (facility_type IN ('gender-bath', 'male-only', 'female-only', 'private-bath', 'mixed-bath')),
  -- 대표 좌표 출처
  coordinate_source TEXT CHECK (coordinate_source IN ('naver', 'google', 'manual')),
  -- 영업 상태
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed_permanently', 'closed_temporarily', 'under_review')),
  -- 다른 소스에서 병합된 이력
  merged BOOLEAN NOT NULL DEFAULT false,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view places" ON places
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add places" ON places
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 2-1. PLACE_SOURCES 테이블 - 외부 API 연동
-- ============================================
CREATE TABLE IF NOT EXISTS place_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('naver', 'google', 'manual')),
  external_id TEXT,
  name_original TEXT NOT NULL,
  address_original TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  plus_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

ALTER TABLE place_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view place_sources" ON place_sources
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add place_sources" ON place_sources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_place_sources_place_id ON place_sources(place_id);

-- ============================================
-- 3. LOGS 테이블 - Quick Log
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  -- 공통
  revisit_score INT CHECK (revisit_score BETWEEN 1 AND 5),
  tribe_id TEXT CHECK (tribe_id IN ('bather', 'saunner', 'jimi')),

  -- 공통 루틴 시간
  heat_time INT CHECK (heat_time BETWEEN 1 AND 60),
  ice_time INT CHECK (ice_time BETWEEN 1 AND 5),
  pause_time INT CHECK (pause_time BETWEEN 1 AND 30),
  repeat INT CHECK (repeat BETWEEN 1 AND 7),

  -- 공통: 냉탕 온도 (saunner 필수 / bather 선택)
  cold_bath_temp INT CHECK (cold_bath_temp BETWEEN 0 AND 30),

  -- 목욕파 전용
  water_quality INT CHECK (water_quality BETWEEN 1 AND 5),
  hot_bath_temp INT CHECK (hot_bath_temp BETWEEN 30 AND 46),
  refreshed_score INT CHECK (refreshed_score BETWEEN 1 AND 5),

  -- 사우너파 전용
  sauna_temp INT CHECK (sauna_temp BETWEEN 50 AND 130),
  totono_score INT CHECK (totono_score BETWEEN 1 AND 5),

  -- 찜질파 전용
  jjim_temp INT CHECK (jjim_temp BETWEEN 60 AND 100),
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
-- 4. DEEP_LOGS 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS deep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,

  companion TEXT CHECK (companion IN ('alone', 'friend', 'family', 'partner')),
  purposes TEXT[] DEFAULT '{}',
  cost INT,
  memo TEXT,

  used_sauna_types TEXT[] DEFAULT '{}',
  used_rooms TEXT[] DEFAULT '{}',
  used_amenities TEXT[] DEFAULT '{}',

  bath_gender TEXT CHECK (bath_gender IN ('male', 'female', 'mixed', 'private')),
  crowd TEXT CHECK (crowd IN ('empty', 'moderate', 'busy', 'full')),

  has_scrub BOOLEAN DEFAULT false,
  scrub_satisfaction INT CHECK (scrub_satisfaction BETWEEN 1 AND 5),
  scrub_price INT,

  -- 매점
  has_store BOOLEAN DEFAULT false,
  store_score INT CHECK (store_score BETWEEN 1 AND 5),
  store_memo TEXT,

  food_eaten TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deep_logs ENABLE ROW LEVEL SECURITY;

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
-- 5. 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_place_id ON logs(place_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deep_logs_log_id ON deep_logs(log_id);
CREATE INDEX IF NOT EXISTS idx_places_facilities ON places USING GIN (facilities);

-- ============================================
-- 6. RPC 함수 - 근접 장소 검색
-- ============================================
CREATE OR REPLACE FUNCTION find_nearby_places(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_radius_m INT DEFAULT 50
)
RETURNS SETOF places
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM places
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND ABS(latitude - p_lat) < (p_radius_m::DECIMAL / 111320)
    AND ABS(longitude - p_lng) < (p_radius_m::DECIMAL / (111320 * COS(RADIANS(p_lat))))
  ORDER BY
    POWER(latitude - p_lat, 2) + POWER(longitude - p_lng, 2)
  LIMIT 10;
$$;

-- ============================================
-- 7. RPC 함수 - 장소별 통계
-- ============================================
CREATE OR REPLACE FUNCTION get_place_stats(p_place_id UUID)
RETURNS TABLE(avg_score NUMERIC, log_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(revisit_score)::NUMERIC, 1) AS avg_score,
    COUNT(*) AS log_count
  FROM logs
  WHERE place_id = p_place_id
    AND revisit_score IS NOT NULL;
$$;
