/**
 * 022 — places.city 컬럼 추가
 * 2026-04-20
 *
 * Geocoding 마이그레이션 일환. Google Geocoding API reverse의
 * address_components에서 추출한 locality(또는 postal_town)를 저장.
 *
 * 채우는 시점:
 *   - 신규 등록: /api/places/reverse-geocode 호출 시 자동
 *   - 기존 row: scripts/migrate-existing-addresses.ts 로 일괄 교정
 *
 * 관련:
 *   - docs/plans/PLAN_geocoding_migration.md
 *   - country_code는 기존 컬럼 재사용 (오염값은 스크립트로 교정)
 */

ALTER TABLE places ADD COLUMN IF NOT EXISTS city TEXT;
