/**
 * 024_steam_sauna_rename_and_move.sql
 *
 * 변경 요약:
 *  (1) deep_logs.wet_sauna_temp → deep_logs.steam_sauna_temp 리네임 (영문 명칭 통일)
 *  (2) deep_logs.has_wet_sauna → deep_logs.has_steam_sauna 리네임
 *  (3) logs 테이블에 steam_sauna_temp (40-75°C) 컬럼 신설 — 사우너 quick log용
 *  (4) logs 테이블에 primary_sauna_kind ('dry' | 'steam') 컬럼 신설 — 주 이용 사우나 명시
 *  (5) 기존 deep_logs.steam_sauna_temp 데이터를 logs.steam_sauna_temp로 백필
 *  (6) 백필 후 deep_logs.steam_sauna_temp / has_steam_sauna 컬럼 DROP (logs로 단일화)
 *  (7) 기존 사우나 데이터의 primary_sauna_kind 자동 백필 (dry 있으면 'dry', steam만 있으면 'steam')
 *  (8) places.facilities 배열에서 'wet-sauna' → 'steam-sauna' 치환
 */

BEGIN;

-- (1)(2) deep_logs 컬럼 RENAME
ALTER TABLE deep_logs RENAME COLUMN wet_sauna_temp TO steam_sauna_temp;
ALTER TABLE deep_logs RENAME COLUMN has_wet_sauna TO has_steam_sauna;

-- 제약 이름 리네임 (Postgres 12+: ALTER TABLE ... RENAME CONSTRAINT)
ALTER TABLE deep_logs RENAME CONSTRAINT deep_logs_wet_sauna_temp_check
  TO deep_logs_steam_sauna_temp_check;

-- (3) logs.steam_sauna_temp 신설 (사우너 quick log의 습식 사우나 온도)
ALTER TABLE logs
  ADD COLUMN steam_sauna_temp INT
  CHECK (steam_sauna_temp BETWEEN 40 AND 75);

-- (4) logs.primary_sauna_kind 신설 (둘 다 입력 시 주 이용 사우나 명시. NULL = 사우나 미입력)
ALTER TABLE logs
  ADD COLUMN primary_sauna_kind TEXT
  CHECK (primary_sauna_kind IS NULL OR primary_sauna_kind IN ('dry', 'steam'));

-- (5) deep_logs → logs 백필 (기존 사용자가 deep log에서 입력한 습식 사우나)
UPDATE logs l
   SET steam_sauna_temp = d.steam_sauna_temp
  FROM deep_logs d
 WHERE l.id = d.log_id
   AND d.has_steam_sauna = TRUE
   AND d.steam_sauna_temp IS NOT NULL;

-- (6) deep_logs steam 컬럼 DROP (logs로 단일화 — 더 이상 deep_logs에 보관 안 함)
ALTER TABLE deep_logs DROP COLUMN steam_sauna_temp;
ALTER TABLE deep_logs DROP COLUMN has_steam_sauna;

-- (7) 기존 행에 primary_sauna_kind 백필
--     - 건식만 있음 → 'dry'
--     - 습식만 있음 → 'steam'
--     - 둘 다 있음 → 'dry' (보수적 디폴트, 사용자가 추후 수정 가능)
--     - 둘 다 NULL → NULL 유지 (사우나 미입력)
UPDATE logs
   SET primary_sauna_kind = CASE
     WHEN sauna_temp IS NOT NULL THEN 'dry'
     WHEN steam_sauna_temp IS NOT NULL THEN 'steam'
     ELSE NULL
   END
 WHERE sauna_temp IS NOT NULL OR steam_sauna_temp IS NOT NULL;

-- (8) places.facilities 배열 백필 ('wet-sauna' → 'steam-sauna')
UPDATE places
   SET facilities = array_replace(facilities, 'wet-sauna', 'steam-sauna')
 WHERE 'wet-sauna' = ANY(facilities);

COMMIT;
