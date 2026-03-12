-- bath_gender를 deep_logs → logs 테이블로 이동
-- 자동 계산: facility_type + user.gender 기반

-- 1. logs 테이블에 bath_gender 칼럼 추가
ALTER TABLE logs ADD COLUMN IF NOT EXISTS bath_gender TEXT
  CHECK (bath_gender IN ('male', 'female', 'mixed', 'private', 'private_male', 'private_female', 'mixed_male', 'mixed_female'));

-- 2. 기존 deep_logs 데이터를 logs로 마이그레이션
UPDATE logs
SET bath_gender = dl.bath_gender
FROM deep_logs dl
WHERE dl.log_id = logs.id
  AND dl.bath_gender IS NOT NULL
  AND logs.bath_gender IS NULL;

-- 3. deep_logs에서 bath_gender 칼럼 제거 (선택 — 데이터 마이그레이션 확인 후 실행)
-- ALTER TABLE deep_logs DROP COLUMN IF EXISTS bath_gender;
