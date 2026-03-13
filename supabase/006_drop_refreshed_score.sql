-- 006: refreshed_score 컬럼 삭제
-- 사유: UI 입력란 없음, 앱에서 읽기/쓰기 모두 제거됨, 전 행 null
ALTER TABLE logs DROP COLUMN IF EXISTS refreshed_score;
