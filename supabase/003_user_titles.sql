-- 003: 칭호/리워드 시스템 — user_titles 테이블 + users XP 컬럼
-- 실행 전: users 테이블에 xp, level, active_title 컬럼이 이미 존재하는지 확인

-- xp, level, active_title 컬럼 추가 (없을 경우)
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_title text DEFAULT NULL;

-- 칭호 보관 테이블
CREATE TABLE IF NOT EXISTS user_titles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,                -- 최종 표시 칭호 ("뜨거운 증기술사")
  source text NOT NULL DEFAULT 'random', -- 'milestone' | 'random' | 'welcome' | 'beta'
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, title)              -- 같은 칭호 중복 방지
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);

-- RLS
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

-- 본인 조회
CREATE POLICY "user_titles_select_own"
  ON user_titles FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 삽입 (서비스에서 호출)
CREATE POLICY "user_titles_insert_own"
  ON user_titles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 업데이트 (active 변경 등)
CREATE POLICY "user_titles_update_own"
  ON user_titles FOR UPDATE
  USING (auth.uid() = user_id);
