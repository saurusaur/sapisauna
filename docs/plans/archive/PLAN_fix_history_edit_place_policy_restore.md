# Fix History Edit Place Policy Restore

Date: 2026-04-30
Status: Ready for implementation

## Goal

Fix history edit sessions so they preserve place `facility_type` and `bath_policy` when routing back into quick log or deep log edit flows.

This is a focused correctness fix. Do not combine it with the broader `currentLog` helper refactor.

## Problem

Normal log entry stores complete place policy metadata in `localStorage.selectedPlace`.

Examples:

- `src/app/place/page.tsx`
- `src/app/place/add/page.tsx`

Shape:

```ts
{
  id,
  name,
  countryCode,
  facilityType,
  bathPolicy,
}
```

History edit currently stores incomplete place metadata.

Current code in `src/app/history/[id]/page.tsx`:

```ts
localStorage.setItem('selectedPlace', JSON.stringify({
  id: log.place_id,
  name: log.place_name,
  countryCode: log.place_country_code,
  facilityType: null,
}))
```

This appears in two places:

- Quick-log edit button.
- Deep-log add/edit entry.

`bathPolicy` is missing, and `facilityType` is explicitly `null`.

## Why It Matters

`src/app/log/page.tsx` derives `bath_gender` from:

- place `facilityType`
- place `bathPolicy`
- user gender

Relevant behavior:

```ts
bath_gender: deriveBathGender(facilityType, bathPolicy, user?.gender ?? undefined)
```

On edit save, `updateLog()` writes:

```ts
bath_gender: logData.bath_gender ?? null
```

So if history edit mode cannot restore `facilityType` / `bathPolicy`, saving an edited log can recompute `bath_gender` incorrectly or clear it.

Risk cases:

- `private-sauna`
- `mixed`
- `male-only`
- `female-only`
- any non-default bath policy

## Root Cause

`src/lib/logs-service.ts` already joins the full `places` row:

```ts
const LOG_SELECT = '*, public_profiles(nickname, active_title), places!inner(*, place_sources(*)), deep_logs(*)'
```

But `toLogWithPlace()` only maps:

- place display name
- address
- `place_country_code`

It does not expose:

- `places.facility_type`
- `places.bath_policy`

`src/types/index.ts` `LogWithPlace` also does not currently include these fields.

## Action Plan

### 1. Extend `LogWithPlace`

File:

```txt
src/types/index.ts
```

Add:

```ts
place_facility_type?: FacilityType
place_bath_policy?: BathPolicy
```

Recommended placement:

```ts
place_id: string
place_name: string
place_country_code: string
place_facility_type?: FacilityType
place_bath_policy?: BathPolicy
address: string
```

### 2. Map Place Policy Fields From Joined Places

File:

```txt
src/lib/logs-service.ts
```

Update type import:

```ts
import type { LogWithPlace, BathGender, FacilityType, BathPolicy } from '@/types'
```

Inside `toLogWithPlace()`, add fields to the returned object:

```ts
place_facility_type: place?.facility_type as FacilityType | undefined,
place_bath_policy: place?.bath_policy as BathPolicy | undefined,
```

### 3. Update History Edit `selectedPlace` Payloads

File:

```txt
src/app/history/[id]/page.tsx
```

Replace both `selectedPlace` writes.

Current:

```ts
localStorage.setItem('selectedPlace', JSON.stringify({
  id: log.place_id,
  name: log.place_name,
  countryCode: log.place_country_code,
  facilityType: null,
}))
```

New:

```ts
localStorage.setItem('selectedPlace', JSON.stringify({
  id: log.place_id,
  name: log.place_name,
  countryCode: log.place_country_code,
  facilityType: log.place_facility_type,
  bathPolicy: log.place_bath_policy,
}))
```

Do this in both places:

- Quick-log edit button.
- Deep-log add/edit entry.

### 4. Preserve Missing-Data Behavior

Do not add fallback guesses in this pass.

If `place_facility_type` or `place_bath_policy` is missing, let it be `undefined`.

`src/app/log/page.tsx` already preserves this behavior:

```ts
if (place.facilityType) setFacilityType(place.facilityType)
if (place.bathPolicy) setBathPolicy(place.bathPolicy)
```

This means malformed or legacy data will keep the current behavior instead of introducing guessed values.

## Verification

Run:

```bash
npm run lint
npm run build
```

## Manual Checks

Test these in preview/dev:

1. Start a new log from normal place selection.
   - Confirm no behavior change.

2. Edit a history log for a `private-sauna` place.
   - Save.
   - Confirm `bath_gender` is not cleared and stays private/private_male/private_female as appropriate.

3. Edit a history log for a `mixed` bath policy place.
   - Save.
   - Confirm `bath_gender` stays mixed/mixed_male/mixed_female as appropriate.

4. Add deep log from history detail.
   - Confirm route still goes to `/log/deep`.
   - Confirm no crash from the new payload shape.

5. Edit quick log from history detail.
   - Confirm route still goes to `/log`.
   - Confirm existing quick-log values restore as before.

## Suggested Commit

```bash
git add src/types/index.ts src/lib/logs-service.ts 'src/app/history/[id]/page.tsx'
git commit -m "fix history edit place policy restore"
git push origin preview
```

## Scope Guard

Do not refactor the broader `currentLog` helper in this change.

Do not change:

- `currentLog` storage key
- `selectedPlace` storage key
- `selectedRecordDate`
- `savedLogId`
- `isNewLog`
- `pendingReward`
- story navigation after save
- short-log date/time picker behavior
