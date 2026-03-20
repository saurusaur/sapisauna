-- 열탕 필드 rename: hot_bath → very_hot_bath (딥로그)
-- 온탕(hot_bath)은 logs 테이블에 기존 유지
-- 2026-03-20

ALTER TABLE deep_logs RENAME COLUMN has_hot_bath TO has_very_hot_bath;
ALTER TABLE deep_logs RENAME COLUMN hot_bath_temp TO very_hot_bath_temp;
