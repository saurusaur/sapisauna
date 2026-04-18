-- 크리에이터 소셜 링크 (JSONB: { "instagram": "username", "naver_blog": "blogid", "threads": "username" })
ALTER TABLE lists ADD COLUMN creator_links JSONB DEFAULT '{}';
