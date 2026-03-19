-- 딥로그 확장: 청결도 + 습식사우나 + 열탕
-- 2026-03-20

-- 청결도 (모든 tribe 공통)
ALTER TABLE deep_logs ADD COLUMN cleanliness INT CHECK (cleanliness BETWEEN 1 AND 5);

-- 습식사우나 (사우너파 딥로그 토글)
ALTER TABLE deep_logs ADD COLUMN has_wet_sauna BOOLEAN DEFAULT false;
ALTER TABLE deep_logs ADD COLUMN wet_sauna_temp INT CHECK (wet_sauna_temp BETWEEN 40 AND 65);

-- 열탕 (사우너파 + 목욕파 딥로그 토글)
ALTER TABLE deep_logs ADD COLUMN has_hot_bath BOOLEAN DEFAULT false;
ALTER TABLE deep_logs ADD COLUMN hot_bath_temp INT CHECK (hot_bath_temp BETWEEN 38 AND 46);
