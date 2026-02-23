-- ============================================================
-- Migration 002: Feature 1 (Display ID) + Feature 2 (Short Review Fields)
-- ============================================================

-- Feature 1: 기록용 고유 ID (15자리, 내부 참조용)
-- 포맷: [Type 1][Country 4][YY 2][MM 2][DD 2][HH 2][mm 2]
-- 예시: 100822602231430 (saunner, 한국, 2026-02-23 14:30)
ALTER TABLE logs ADD COLUMN display_id TEXT UNIQUE;

-- Feature 2: 공통 루틴 시간 기록
ALTER TABLE logs ADD COLUMN heat_time INT CHECK (heat_time BETWEEN 1 AND 60);
ALTER TABLE logs ADD COLUMN ice_time  INT CHECK (ice_time  BETWEEN 1 AND 5);
ALTER TABLE logs ADD COLUMN pause_time INT CHECK (pause_time BETWEEN 1 AND 30);
-- repeat: 전 타입 공통 세트 수 (기존 saunner의 sets를 대체)
ALTER TABLE logs ADD COLUMN repeat INT CHECK (repeat BETWEEN 1 AND 7);

-- Feature 2: Bather 신규 필드
-- cold_bath_temp: 냉탕 온도 (ΔT = hot_bath_temp - cold_bath_temp 계산용)
ALTER TABLE logs ADD COLUMN cold_bath_temp  INT CHECK (cold_bath_temp  BETWEEN 0 AND 30);
-- refreshed_score: Bather 목적달성 레벨 "개운함"
ALTER TABLE logs ADD COLUMN refreshed_score INT CHECK (refreshed_score BETWEEN 1 AND 5);

-- Feature 2: Jimi 신규 필드
-- jjim_temp: 한증막 온도 (글로우 그래프 강도에 반영)
ALTER TABLE logs ADD COLUMN jjim_temp INT CHECK (jjim_temp BETWEEN 60 AND 100);

-- 기존 saunner의 sets 데이터를 repeat으로 이관 (sets 컬럼은 하위 호환을 위해 유지)
UPDATE logs SET repeat = sets WHERE sets IS NOT NULL AND tribe_id = 'saunner';
