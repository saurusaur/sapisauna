-- facility_type + bath_policy 분리
-- facility_type: 시설 유형 (small-bath, public-bath, hotel-spa, private-sauna, special, gym-sauna)
-- bath_policy: 탕 구분 (gender-bath=남녀분리, male-only, female-only, mixed)
-- 2026-03-20

-- Step 1: Add bath_policy column (gender-bath 기본)
ALTER TABLE places ADD COLUMN bath_policy TEXT DEFAULT 'gender-bath'
  CHECK (bath_policy IN ('gender-bath', 'male-only', 'female-only', 'mixed'));

-- Step 2: Migrate existing gender data to bath_policy
UPDATE places SET bath_policy = 'male-only' WHERE facility_type = 'male-only';
UPDATE places SET bath_policy = 'female-only' WHERE facility_type = 'female-only';
UPDATE places SET bath_policy = 'mixed' WHERE facility_type = 'mixed-bath';

-- Step 3: DROP old constraint FIRST (before changing values)
ALTER TABLE places DROP CONSTRAINT places_facility_type_check;

-- Step 4: Update facility_type values
UPDATE places SET facility_type = 'private-sauna' WHERE facility_type = 'private-bath';
UPDATE places SET facility_type = 'public-bath' WHERE facility_type IN ('gender-bath', 'male-only', 'female-only', 'mixed-bath');

-- Step 5: Add new constraint (special 포함, bulgama-house 제거)
ALTER TABLE places ADD CONSTRAINT places_facility_type_check
  CHECK (facility_type IN ('small-bath', 'public-bath', 'hotel-spa', 'private-sauna', 'special', 'gym-sauna'));

-- Step 6: Update default
ALTER TABLE places ALTER COLUMN facility_type SET DEFAULT 'public-bath';
