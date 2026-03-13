-- 005: 마일스톤 칭호 중복 방지용 base_title 컬럼
-- base_title: 형용사 없는 원본 칭호명 (마일스톤만 사용, 랜덤은 null)

ALTER TABLE user_titles ADD COLUMN IF NOT EXISTS base_title text DEFAULT NULL;

-- 기존 마일스톤 행 백필 (형용사 없이 저장된 백필 데이터)
UPDATE user_titles SET base_title = title WHERE source IN ('milestone', 'welcome', 'beta') AND base_title IS NULL;
