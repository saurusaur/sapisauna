# facility_type + bath_policy 분리 플랜

## Background

Currently `places.facility_type` conflates two concepts:
1. **Venue type** (시설 유형): what kind of place is it?
2. **Bath policy** (탕 구분): gender access rules

Current values: `'gender-bath' | 'male-only' | 'female-only' | 'private-bath' | 'mixed-bath'`

We need to split into:
- `facility_type` → venue type: `'small-bath' | 'public-bath' | 'hotel-spa' | 'private-sauna' | 'bulgama-house' | 'gym-sauna'`
- `bath_policy` (NEW column) → gender: `NULL (=남녀분리, default) | 'male-only' | 'female-only' | 'mixed'`

## DB Migration Script

```sql
-- File: supabase/009_facility_type_bath_policy_split.sql

-- Step 1: Add bath_policy column
ALTER TABLE places ADD COLUMN bath_policy TEXT
  CHECK (bath_policy IN ('male-only', 'female-only', 'mixed'));

-- Step 2: Migrate existing gender data to bath_policy
UPDATE places SET bath_policy = 'male-only' WHERE facility_type = 'male-only';
UPDATE places SET bath_policy = 'female-only' WHERE facility_type = 'female-only';
UPDATE places SET bath_policy = 'mixed' WHERE facility_type = 'mixed-bath';
-- gender-bath → bath_policy NULL (default, 남녀분리)
-- private-bath → bath_policy NULL (private is venue type, not gender)

-- Step 3: Set facility_type to 'public-bath' for all migrated rows (temporary)
-- Seed script will set correct venue types later
UPDATE places SET facility_type = 'public-bath' WHERE facility_type IN ('gender-bath', 'male-only', 'female-only', 'mixed-bath');
UPDATE places SET facility_type = 'private-sauna' WHERE facility_type = 'private-bath';

-- Step 4: Update CHECK constraint
ALTER TABLE places DROP CONSTRAINT places_facility_type_check;
ALTER TABLE places ADD CONSTRAINT places_facility_type_check
  CHECK (facility_type IN ('small-bath', 'public-bath', 'hotel-spa', 'private-sauna', 'bulgama-house', 'gym-sauna'));

-- Step 5: Update default
ALTER TABLE places ALTER COLUMN facility_type SET DEFAULT 'public-bath';
```

## Code References (all files that reference facility_type)

### 1. Types — `src/types/index.ts`
- :15-16 `FacilityType` type definition → change values
- :18-19 `BathGender` type → unchanged (this is logs.bath_gender, different thing)
- :40 `Place.facility_type` → type changes automatically

**Change:**
```ts
// Before
export type FacilityType = 'gender-bath' | 'male-only' | 'female-only' | 'private-bath' | 'mixed-bath'

// After
export type FacilityType = 'small-bath' | 'public-bath' | 'hotel-spa' | 'private-sauna' | 'bulgama-house' | 'gym-sauna'
export type BathPolicy = 'male-only' | 'female-only' | 'mixed'

// Place interface: add bath_policy
interface Place {
  ...
  facility_type: FacilityType
  bath_policy?: BathPolicy | null  // NEW
}
```

### 2. Constants — `src/constants/content.ts`
- :57-65 `PLACE_BATH_TYPE` array — currently mixes venue + gender
- :731-733 `EXPLORE_FILTERS.GENDER` — filter options

**Change:** Split into two arrays:
```ts
// Venue type (for place registration)
export const PLACE_VENUE_TYPE = [
  { id: 'small-bath', label: '동네 목욕탕', icon: 'hot_tub' },
  { id: 'public-bath', label: '대중목욕탕', icon: 'public' },
  { id: 'hotel-spa', label: '호텔/스파', icon: 'hotel' },
  { id: 'private-sauna', label: '개인 사우나', icon: 'person' },
  { id: 'bulgama-house', label: '불한증막', icon: 'warehouse' },
  { id: 'gym-sauna', label: '헬스장 사우나', icon: 'fitness_center' },
]

// Bath policy (for place registration)
export const PLACE_BATH_POLICY = [
  { id: 'male-only', label: '남성전용', icon: 'male' },
  { id: 'female-only', label: '여성전용', icon: 'female' },
  { id: 'mixed', label: '혼탕', icon: 'wc' },
]
// NULL = 남녀분리 (default, no selection needed)
```

### 3. Service — `src/lib/places-service.ts`
- :7 import FacilityType
- :27 `facility_type` mapping from DB row
- :134 `mergeWithPlace()` param
- :159 merge default `'gender-bath'` → `'public-bath'`
- :175 `createNewPlace()` param
- :200 create default `'gender-bath'` → `'public-bath'`
- :227 `updatePlace()` param
- :234 update payload

**Change:** Add `bath_policy` to all read/write operations. Change defaults from `'gender-bath'` to `'public-bath'`.

### 4. Place Add — `src/app/place/add/page.tsx`
- :14 import FacilityType
- :51 `bathGender` state (poorly named — actually facility_type)
- :122 localStorage `facilityType` key
- :134 `facility_type: bathGender`
- :211 merge call
- :468-471 UI chips (PLACE_BATH_TYPE)

**Change:** Split into two state vars: `facilityType` + `bathPolicy`. Two UI chip sections. Update localStorage key.

### 5. Place Edit — `src/app/place/[id]/edit/page.tsx`
- :11 import FacilityType
- :29 `facilityType` state
- :46-47 load from place
- :76 save payload
- :131-134 UI chips

**Change:** Same pattern as add page — split into two.

### 6. Explore Filter — `src/app/explore/page.tsx`
- :157-160 filter by `facility_type` for gender options

**Change:** Gender filter should check `bath_policy` instead of `facility_type`. Add venue type filter section.

### 7. Explore Detail — `src/app/explore/[id]/page.tsx`
- :234 localStorage `facilityType`
- :316-325 male-only/female-only badge display

**Change:** Badge display should check `bath_policy` instead of `facility_type`.

### 8. Place Card — `src/components/features/place-card.tsx`
- :57-66 male-only/female-only badge

**Change:** Check `bath_policy` instead of `facility_type`.

### 9. Log Page — `src/app/log/page.tsx`
- :8 import FacilityType
- :22 `facilityType` state
- :25-40 `deriveBathGender()` — maps facility_type → bath_gender for logs

**Change:** This is CRITICAL. `deriveBathGender()` currently uses old facility_type values. Needs to read `bath_policy` instead:
```ts
// Before: switch on facility_type ('male-only', 'mixed-bath', etc.)
// After: switch on bath_policy ('male-only', 'female-only', 'mixed', null)
const deriveBathGender = (bathPolicy: string | null, userGender?: 'male' | 'female'): BathGender | null => {
  switch (bathPolicy) {
    case 'male-only': return 'male'
    case 'female-only': return 'female'
    case 'mixed':
      if (userGender === 'male') return 'mixed_male'
      if (userGender === 'female') return 'mixed_female'
      return 'mixed'
    default: // null = 남녀분리
      if (userGender === 'male') return 'male'
      if (userGender === 'female') return 'female'
      return null
  }
}
```

### 10. Place Select — `src/app/place/page.tsx`
- :92 passes `facility_type` on select
- :140 same

**Change:** Also pass `bath_policy`.

## localStorage Impact
`selectedPlace` in localStorage currently stores `facilityType`. Need to add `bathPolicy`:
```ts
{ id, name, countryCode, facilityType, bathPolicy }
```

## Summary: 10 files to change
1. `supabase/009_facility_type_bath_policy_split.sql` — NEW migration
2. `src/types/index.ts` — FacilityType values + BathPolicy type + Place interface
3. `src/constants/content.ts` — PLACE_BATH_TYPE → split into VENUE_TYPE + BATH_POLICY
4. `src/lib/places-service.ts` — read/write bath_policy, change defaults
5. `src/app/place/add/page.tsx` — split state + UI
6. `src/app/place/[id]/edit/page.tsx` — split state + UI
7. `src/app/explore/page.tsx` — filter logic
8. `src/app/explore/[id]/page.tsx` — badge + localStorage
9. `src/components/features/place-card.tsx` — badge
10. `src/app/log/page.tsx` — deriveBathGender() + localStorage
11. `src/app/place/page.tsx` — pass bathPolicy on select
