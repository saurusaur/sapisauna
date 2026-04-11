-- 016: ice_time 분 → 초 단위 변환
-- 기존: 1~5분 (CHECK 1~5)
-- 변경: 10~90초, 10초 단위 입력 (CHECK 10~300, 기존 데이터 ×60 허용)

-- 1. 기존 CHECK 제약조건 제거
ALTER TABLE logs DROP CONSTRAINT logs_ice_time_check;

-- 2. 기존 데이터 변환 (분 → 초)
UPDATE logs
SET ice_time = ice_time * 60
WHERE ice_time IS NOT NULL;

-- 3. 새 CHECK 제약조건 추가 (10~300: 기존 5분=300초도 허용)
ALTER TABLE logs ADD CONSTRAINT logs_ice_time_check CHECK (ice_time BETWEEN 10 AND 300);
