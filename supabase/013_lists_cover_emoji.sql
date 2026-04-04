-- SA-리스트 커버 이모지 (선택). ListFormSheet에서만 설정.
ALTER TABLE lists ADD COLUMN IF NOT EXISTS cover_emoji TEXT;
