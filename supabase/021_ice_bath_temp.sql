-- 급냉탕(ice bath) 온도 필드 추가
-- deep_logs 테이블에만 저장 (숏로그는 간단성 유지)
-- 패턴은 has_very_hot_bath/very_hot_bath_temp 와 동일

ALTER TABLE deep_logs ADD COLUMN IF NOT EXISTS has_ice_bath BOOLEAN DEFAULT false;
ALTER TABLE deep_logs ADD COLUMN IF NOT EXISTS ice_bath_temp INT CHECK (ice_bath_temp BETWEEN 0 AND 20);

COMMENT ON COLUMN deep_logs.has_ice_bath IS '급냉탕 유무 (선택적)';
COMMENT ON COLUMN deep_logs.ice_bath_temp IS '급냉탕 온도 0-20°C (has_ice_bath=true일 때)';
