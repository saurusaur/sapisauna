-- 026: facility_type 분류 확장 — hotel-spa → hotel-premium 리네임 + resort-spa 신설
-- 배경: hotel-spa가 도심 호텔/료칸/리조트 온천 + 캐주얼 메가 데이온천/워터파크를 한 바구니에
--       담아 분류가 모호했음. 두 축으로 분리한다.
--   - hotel-premium : 호텔·료칸·프리미엄 리조트 온천 (숙박형)
--   - resort-spa    : 캐주얼 메가 데이온천/워터파크 (아쿠아필드·테르메·워터파크류)
--   - special       : 불가마/효소/한증막 (유지)
-- 참고: docs/plans/PLAN_katalk_db_sync_phase18.md, docs/research/katalk-20260519/katalk-reclassify-candidates-20260601.md

-- Step 1) 기존 CHECK 제약 제거
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_facility_type_check;

-- Step 2) hotel-spa → hotel-premium 리네임 (기존 전 행)
UPDATE places SET facility_type = 'hotel-premium', updated_at = NOW()
WHERE facility_type = 'hotel-spa';

-- Step 3) 새 CHECK 제약 (hotel-premium·resort-spa 포함, hotel-spa 제거)
ALTER TABLE places ADD CONSTRAINT places_facility_type_check
  CHECK (facility_type IN ('small-bath','public-bath','hotel-premium','resort-spa','private-sauna','special','gym-sauna'));

-- Step 4) resort-spa 재태깅 — 확정 10건 (워터파크/메가 데이온천)
--   2026-06-01 유저 확정. place_id 기준.
UPDATE places SET facility_type = 'resort-spa', updated_at = NOW()
WHERE id IN (
  '122eb42f-123d-4cff-b665-641890dc2a8b', -- 스플라스 온천 워터파크
  '3e5c5182-d04f-4781-9885-a662304df0b6', -- 클럽디오아시스 스파&워터파크
  '6915d330-bb93-4d64-bf55-f302050f0149', -- 디오션 스파&사우나
  '924e2423-d068-40c5-a4f1-3f9031565942', -- 송파파크하비오워터킹덤워터파크&찜질스파
  'd0e7b437-7895-4d50-b635-9411f3ca3905', -- 아쿠아필드 안성
  '5da18c55-f459-4561-8aa8-28cac9817198', -- 아쿠아필드 하남
  'ca45c735-c8ee-4329-a80b-6eaccfd6cfa1', -- 아쿠아필드 고양
  '3c2ceb88-2cc1-4a24-b76b-d374175ce53c', -- 이천 테르메덴
  '4ea45563-6c82-4e87-b9a5-db102aa88ed7', -- 파라다이스시티 씨메르 (기존 special → resort-spa)
  '0e03904b-60c1-4c74-912a-31e1f1c22ef0'  -- Therme Erding (DE)
);

-- 확인용 (실행 후 분포 점검):
-- SELECT facility_type, COUNT(*) FROM places GROUP BY facility_type ORDER BY 2 DESC;
