/**
 * 012 — 신규 시설 등록 + 온도 업데이트
 * 2026-04-04
 *
 * DB 구조:
 * - places: facility_type(small-bath/public-bath/hotel-spa/private-sauna/special/gym-sauna), bath_policy, latitude, longitude
 * - place_sources: name_original, address_original, source, external_id
 * - logs: hot_bath_temp(온탕), cold_bath_temp(냉탕), sauna_temp(건식) — 어드민 23c431c3-...
 * - deep_logs: very_hot_bath_temp(열탕), wet_sauna_temp(습식), cost
 *
 * Naver mapx/mapy → 좌표: mapx/10^7 = longitude, mapy/10^7 = latitude
 */

-- ═══════════════════════════════════════════
-- 0. DB CHECK 제약 확장 — 습식 사우나 40-65 → 40-90 (UI 범위와 일치시킴)
-- ═══════════════════════════════════════════

ALTER TABLE deep_logs DROP CONSTRAINT IF EXISTS deep_logs_wet_sauna_temp_check;
ALTER TABLE deep_logs ADD CONSTRAINT deep_logs_wet_sauna_temp_check CHECK (wet_sauna_temp BETWEEN 40 AND 90);

-- ═══════════════════════════════════════════
-- 0. DB CHECK 제약 확장 — 습식 사우나 40-65 → 40-75 (UI/content.ts와 통일)
-- ═══════════════════════════════════════════

ALTER TABLE deep_logs DROP CONSTRAINT IF EXISTS deep_logs_wet_sauna_temp_check;
ALTER TABLE deep_logs ADD CONSTRAINT deep_logs_wet_sauna_temp_check CHECK (wet_sauna_temp BETWEEN 40 AND 75);

-- ═══════════════════════════════════════════
-- A. 신규 시설 등록 (9건)
-- ═══════════════════════════════════════════

-- 1. 한림탕 (제주)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('public-bath', 'gender-bath', 'KR', 33.4160422, 126.2642832, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '한림탕', '제주특별자치도 제주시 한림읍 한림로 685-10', 33.4160422, 126.2642832);
END $$;

-- 2. 리버사우나 (이촌, 남성전용)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('public-bath', 'male-only', 'KR', 37.5184361, 126.9770515, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '리버사우나', '서울특별시 용산구 이촌로84길 9 유일빌딩 지하2, 3층', 37.5184361, 126.9770515);
END $$;

-- 3. 소금강스파 (강릉)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('special', 'gender-bath', 'KR', 37.8494213, 128.8073403, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '소금강스파', '강원특별자치도 강릉시 연곡면 진고개로 2418-30 1층', 37.8494213, 128.8073403);
END $$;

-- 4. 봉래탕 (부산)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('small-bath', 'gender-bath', 'KR', 35.0933863, 129.0447966, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '봉래탕', '부산광역시 영도구 대교로2번길 7 2층', 35.0933863, 129.0447966);
END $$;

-- 5. 서울사우나 휘트니스 (제주)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('public-bath', 'gender-bath', 'KR', 33.4788364, 126.4683171, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '서울사우나 휘트니스', '제주특별자치도 제주시 노형로 283', 33.4788364, 126.4683171);
END $$;

-- 6. 인천조탕 (영종도)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('special', 'gender-bath', 'KR', 37.4441625, 126.4045572, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '인천조탕', '인천광역시 중구 용유서로 30', 37.4441625, 126.4045572);
END $$;

-- 7. 라파사우나찜질방 (송파)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('public-bath', 'gender-bath', 'KR', 37.4980888, 127.1343990, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '라파사우나찜질방', '서울특별시 송파구 오금로 396 지하1층', 37.4980888, 127.1343990);
END $$;

-- 8. 동아온천사우나 (대전 유성)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('public-bath', 'gender-bath', 'KR', 36.3556006, 127.3445830, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '동아온천사우나', '대전광역시 유성구 온천로 59', 36.3556006, 127.3445830);
END $$;

-- 9. 파라다이스시티 씨메르 (인천 영종도)
DO $$ DECLARE pid UUID; BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code, latitude, longitude, coordinate_source)
  VALUES ('special', 'gender-bath', 'KR', 37.4356280, 126.4570723, 'naver')
  RETURNING id INTO pid;
  INSERT INTO place_sources (place_id, source, name_original, address_original, latitude, longitude)
  VALUES (pid, 'naver', '파라다이스시티 씨메르', '인천광역시 중구 영종해안남로321번길 186', 37.4356280, 126.4570723);
END $$;

-- ═══════════════════════════════════════════
-- B. 온도 업데이트 (기존 시설, 어드민 로그)
-- 어드민 ID: 23c431c3-9b23-4779-bb27-13472e58090a
-- ═══════════════════════════════════════════

-- B-1. 프라임노다지: 온탕 41→38, 건식 76→79 (logs) + 열탕 43→42, 습식 추가 74 (deep_logs)
UPDATE logs SET hot_bath_temp = 38, sauna_temp = 79
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%노다지%')
  AND hot_bath_temp = 41;

UPDATE deep_logs SET very_hot_bath_temp = 42, wet_sauna_temp = 74
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%노다지%')
);

-- B-2. 아쿠아필드 하남: 건식 추가 81 (logs.sauna_temp) — 열탕 40 유지
UPDATE logs SET sauna_temp = 81
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%아쿠아필드%하남%')
  AND sauna_temp IS NULL;

-- B-3. 그랜드워커힐: 냉탕 21 + 건식 85 (logs) + 열탕 42 (deep_logs) — 가격 제외
UPDATE logs SET cold_bath_temp = 21, sauna_temp = 85
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%워커힐%')
  AND cold_bath_temp IS NULL;

UPDATE deep_logs SET very_hot_bath_temp = 42
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%워커힐%')
)
AND very_hot_bath_temp IS NULL;

-- B-4. 오레브핫스프링앤스파: 냉탕 19 (logs) + 열탕 41 (deep_logs) — 가격 제외
UPDATE logs SET cold_bath_temp = 19
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%오레브%')
  AND cold_bath_temp IS NULL;

UPDATE deep_logs SET very_hot_bath_temp = 41
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%오레브%')
)
AND very_hot_bath_temp IS NULL;
