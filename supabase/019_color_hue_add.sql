/**
 * 019 — 컬러 hue 컬럼 추가
 * 2026-04-19
 *
 * 배경: cover_color/profile_color (hex TEXT) 저장 방식을 hue(INT, 0~360)
 *       기반으로 전환. OKLCH 톤 공식 변경 시 DB 수정 불필요.
 *
 * 실행 순서:
 *   1. 이 SQL 실행 (hue 컬럼 + 백업 테이블 생성)
 *   2. scripts/migrate-color-to-hue.ts 실행 (기존 hex → hue 변환)
 *   3. 코드 배포 (hue 기반 렌더링)
 *   4. 020_color_hue_drop_hex.sql 실행 (hex 컬럼 drop + 백업 정리)
 *
 * 관련 플랜: docs/plans/PLAN_color_hue_migration.md
 */

-- ─── 백업 (020에서 drop. 롤백 대비) ───
CREATE TABLE IF NOT EXISTS lists_color_backup_20260419 AS
  SELECT id, cover_color FROM lists WHERE cover_color IS NOT NULL;

CREATE TABLE IF NOT EXISTS users_color_backup_20260419 AS
  SELECT id, profile_color FROM users WHERE profile_color IS NOT NULL;

-- ─── hue 컬럼 추가 ───
-- NULL 허용 = 기본색 사용 (lists: #78716c, profile: 트라이브 컬러)
-- CHECK: 0~360 범위
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS cover_hue INT
    CHECK (cover_hue IS NULL OR (cover_hue >= 0 AND cover_hue <= 360));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_hue INT
    CHECK (profile_hue IS NULL OR (profile_hue >= 0 AND profile_hue <= 360));
