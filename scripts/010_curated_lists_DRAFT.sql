-- 큐레이션 리스트 (사우나슐렝, 올해의 사우나 등 추천 리스트)
CREATE TABLE IF NOT EXISTS curated_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 큐레이션 ↔ 장소 매핑
CREATE TABLE IF NOT EXISTS curated_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES curated_lists(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  rank INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, place_id)
);

ALTER TABLE curated_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lists" ON curated_lists
  FOR SELECT USING (is_published = true);

CREATE POLICY "Anyone can view list items" ON curated_list_items
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_curated_list_items_list_id ON curated_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_curated_list_items_place_id ON curated_list_items(place_id);
