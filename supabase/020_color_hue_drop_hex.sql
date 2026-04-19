/**
 * 020 — 컬러 hex 컬럼 DROP + public_profiles 뷰 재생성 + 백업 테이블 정리
 * 2026-04-19
 *
 * 전제 조건:
 *   - 019_color_hue_add.sql 적용 완료
 *   - scripts/migrate-color-to-hue.ts 실행 완료 (모든 hex → hue 변환)
 *   - hue 기반 렌더링 코드 배포 완료 (또는 배포 직전)
 *
 * 주의: 이 SQL 실행 후 cover_color / profile_color 참조 코드는 런타임 에러 발생.
 *       코드 배포 타이밍과 함께 실행.
 *
 * 관련: docs/plans/PLAN_color_hue_migration.md
 */

-- ─── public_profiles 뷰 재생성 (profile_color → profile_hue) ───
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT id, nickname, active_title, primary_type, profile_hue, profile_emoji
FROM users;
GRANT SELECT ON public_profiles TO anon, authenticated;

-- ─── hex 컬럼 DROP ───
ALTER TABLE lists DROP COLUMN IF EXISTS cover_color;
ALTER TABLE users DROP COLUMN IF EXISTS profile_color;

-- ─── 백업 테이블 정리 ───
DROP TABLE IF EXISTS lists_color_backup_20260419;
DROP TABLE IF EXISTS users_color_backup_20260419;
