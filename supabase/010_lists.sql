/**
 * SA-리스트 마이그레이션
 *
 * 이미 반영된 것: 섹션 1(lists 테이블), 섹션 2(list_items 테이블)
 * 아래는 그 이후 실행할 내용만 포함
 *
 * 설계 원칙:
 * - 비즈니스 로직(카운터, 제한, visibility 강등)은 코드에서 처리
 * - DB는 무결성(UNIQUE, RLS, FK)과 자동 생성 트리거만 담당
 */

-- ─── 스키마 변경 (기존 lists 테이블 ALTER) ───

-- type CHECK 제약 변경: admin/curated 제거 → default/user만
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_type_check;
ALTER TABLE lists ADD CONSTRAINT lists_type_check CHECK (type IN ('default', 'user'));

-- 신규 컬럼 추가
ALTER TABLE lists ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- visibility 컬럼 (원본에 없을 수 있으므로 안전하게)
-- 원본이 is_public BOOLEAN이었으면 아래 ALTER 필요 (이미 visibility면 무시됨)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lists' AND column_name = 'is_public') THEN
    ALTER TABLE lists RENAME COLUMN is_public TO _is_public_old;
    ALTER TABLE lists ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public'));
    UPDATE lists SET visibility = CASE WHEN _is_public_old THEN 'public' ELSE 'private' END;
    ALTER TABLE lists DROP COLUMN _is_public_old;
  END IF;
END $$;

-- ─── 3. 구독 테이블 ───

CREATE TABLE IF NOT EXISTS list_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

-- ─── 인덱스 ───

CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_default_per_user
  ON lists (owner_id) WHERE type = 'default';
CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_visibility ON lists(visibility) WHERE visibility IN ('public', 'unlisted');
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_place ON list_items(place_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON list_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_list ON list_subscriptions(list_id);
-- 같은 유저 내 리스트명 중복 차단 (default 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_owner_title
  ON lists (owner_id, title) WHERE type != 'default';

-- ─── RLS ───

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_subscriptions ENABLE ROW LEVEL SECURITY;

-- lists
CREATE POLICY "lists_select" ON lists
  FOR SELECT USING (visibility IN ('public', 'unlisted') OR owner_id = auth.uid());
CREATE POLICY "lists_insert" ON lists
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "lists_update" ON lists
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "lists_delete" ON lists
  FOR DELETE USING (owner_id = auth.uid() AND type != 'default');

-- list_items
CREATE POLICY "list_items_select" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
        AND (lists.visibility IN ('public', 'unlisted') OR lists.owner_id = auth.uid())
    )
  );
CREATE POLICY "list_items_insert" ON list_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM lists WHERE lists.id = list_items.list_id AND lists.owner_id = auth.uid())
  );
CREATE POLICY "list_items_update" ON list_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM lists WHERE lists.id = list_items.list_id AND lists.owner_id = auth.uid())
  );
CREATE POLICY "list_items_delete" ON list_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM lists WHERE lists.id = list_items.list_id AND lists.owner_id = auth.uid())
  );

-- list_subscriptions
CREATE POLICY "subscriptions_select" ON list_subscriptions
  FOR SELECT USING (true);
CREATE POLICY "subscriptions_insert" ON list_subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
        AND (lists.visibility IN ('public', 'unlisted') OR lists.owner_id = auth.uid())
    )
  );
CREATE POLICY "subscriptions_delete" ON list_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- ─── 트리거: default 리스트 자동 생성만 유지 ───

-- 기존 유저에게 default 리스트 생성 (아직 없는 유저만)
INSERT INTO lists (owner_id, type, title, visibility, is_pinned)
SELECT id, 'default', '기본 저장', 'private', false
FROM users
WHERE id NOT IN (SELECT owner_id FROM lists WHERE type = 'default');

-- 새 유저 가입 시 default 리스트 자동 생성
CREATE OR REPLACE FUNCTION create_default_list()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO lists (owner_id, type, title, visibility, is_pinned)
  VALUES (NEW.id, 'default', '기본 저장', 'private', false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_default_list
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_list();

-- ─── RPC: 장소별 저장 횟수 (N+1 방지) ───

CREATE OR REPLACE FUNCTION get_place_save_counts(place_ids UUID[])
RETURNS TABLE(place_id UUID, save_count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT li.place_id, COUNT(DISTINCT l.owner_id)
  FROM list_items li
  JOIN lists l ON l.id = li.list_id
  WHERE li.place_id = ANY(place_ids)
  GROUP BY li.place_id;
$$;
