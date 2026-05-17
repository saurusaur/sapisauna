# Form Flow Consistency Refactor Plan

Date: 2026-04-30
Status: Archived 2026-05-18 — Passes 1–3 shipped, Pass 4 split out to `PLAN_log_edit_session_helper.md`

## Shipped Commits

- Pass 1 (`PlaceFacilityEditor`) + Pass 2 (`useConfirmableExit`): `6b39d2c refactor place form flow components`
- Pass 3 (`ErrorBanner`): `b4989bf refactor shared error banner`
- Bonus (sa-list create sheet reuse of `useConfirmableExit`): `a4ec206 refactor sa-list create sheet`
- Pass 4 decision-point fix (place policy restore on history edit): `4defe93 fix history edit place policy restore`

Pass 4 helper extraction itself was deferred and tracked separately.

## Goal

Improve code cleanliness, consistency, and future localization readiness across form-like flows without changing any existing user-facing functionality.

This is not a visual redesign. Preserve current UX behavior unless an explicit product decision is made.

## Non-Negotiables

- Do not change the save/cancel/edit behavior of short log, deep log, place add, place edit, or history edit entry.
- Do not alter short-log date/time selection or month navigation logic without explicit approval.
- Do not alter `currentLog`, `selectedPlace`, `selectedRecordDate`, `savedLogId`, `isNewLog`, or `pendingReward` semantics without first mapping exact before/after behavior.
- Do not alter place merge behavior in `place/add`.
- Do not alter story navigation after log save.
- Do not remove code unless usage has been checked with `rg`, route reachability, and dynamic/localStorage usage.
- Run `npm run lint` and `npm run build` after each meaningful slice.

## Pages / Modules To Examine

Primary pages:

- `src/app/log/page.tsx`
  - Short-log entry and edit mode.
  - Uses `currentLog`, `selectedPlace`, `selectedRecordDate`.
  - Opens branch modal: direct story save vs deep-log continuation.
  - Critical: date/time picker logic must be preserved.

- `src/app/log/deep/page.tsx`
  - Deep-log entry and edit mode.
  - Reads `currentLog` from short-log/history.
  - Saves short log + deep log, then routes to story.
  - Critical: short-log/deep-log XP and `pendingReward` behavior must remain unchanged.

- `src/app/place/add/page.tsx`
  - Search, manual entry, duplicate detection, merge candidates, new place creation.
  - Uses facility editor UI shared with place edit.
  - Critical: Naver/Google/reverse-geocode/merge flow must stay local and unchanged.

- `src/app/place/[id]/edit/page.tsx`
  - Edits existing place facilities only.
  - Nearly duplicates facility editor from place add.
  - Has original-value dirty detection.

- `src/app/history/[id]/page.tsx`
  - Builds edit-session payload for quick log via `localStorage.currentLog`.
  - Candidate for typed helper, but behavior-sensitive.

Supporting components/hooks:

- `src/components/ui/confirm-modal.tsx`
- `src/components/ui/bottom-cta.tsx`
- `src/components/ui/chip-select.tsx`
- `src/components/ui/select-button.tsx`
- `src/components/ui/toggle-switch.tsx`
- `src/lib/logs-service.ts`
- `src/lib/places-service.ts`
- `src/lib/utils.ts`
- `src/constants/content.ts`
- `src/types/index.ts`

Related but lower-priority flows to inspect for consistency:

- `src/components/features/list-form-sheet.tsx`
- `src/components/features/list-manage-sheet.tsx`
- `src/app/sa-list/page.tsx`
- `src/app/sa-list/my/page.tsx`
- `src/app/settings/profile-icon/page.tsx`
- `src/app/settings/nickname/page.tsx`

## Current Findings

### 1. Place Facility Editor Duplication

Duplicated between:

- `src/app/place/add/page.tsx`
- `src/app/place/[id]/edit/page.tsx`

Shared behavior:

- Facility type selection via `PLACE_VENUE_TYPE`.
- Bath policy selection via `PLACE_BATH_POLICY`.
- Five `PLACE_SPECS` sections: `HEAT`, `ICE`, `PAUSE`, `BEYOND`, `AMENITIES`.
- `isInputVisibleOption` filtering.
- Tattoo behavior:
  - If `tattoo-cover` is selected, also display `tattoo-friendly` as selected.
  - If toggling tattoo off, remove both `tattoo-friendly` and `tattoo-cover`.
  - If country is Japan, show tattoo-cover modal.
  - Otherwise directly add `tattoo-friendly`.
- 24h toggle.

Recommended extraction:

- New component: `src/components/features/place-facility-editor.tsx`
- Props:
  - `selectedFacilities: string[]`
  - `onFacilitiesChange: (next: string[]) => void`
  - `is24h: boolean`
  - `onIs24hChange: (next: boolean) => void`
  - `venueType: FacilityType`
  - `onVenueTypeChange: (next: FacilityType) => void`
  - `bathPolicy: BathPolicy`
  - `onBathPolicyChange: (next: BathPolicy) => void`
  - `countryCode: string`
  - optional labels/section wrapper class if needed

Implementation caution:

- Keep the tattoo modal behavior inside the component only if both pages should behave identically.
- If `place/add` needs `resolvedCountryCode || (source === 'naver' ? 'KR' : '')`, pass the already-resolved country code into the component from the page.

Expected impact:

- Less duplicated UI/logic.
- Lower risk that add/edit place drift.
- Easier future localization of facility editor labels.

### 2. Unsaved-Change Confirm Mechanics

Repeated patterns:

- `showBackConfirm` / `showCancelConfirm` state.
- If dirty/input exists, open `ConfirmModal`.
- On confirm, route back.
- On cancel, close modal.

Current variants:

- `log/page.tsx`
  - Button text: edit mode `편집 취소`, otherwise `기록 취소`.
  - Message differs for edit vs create.
  - Confirm: `나가기`, cancel: `계속 입력`.

- `log/deep/page.tsx`
  - Button text: edit mode `편집 취소`, otherwise `딥로그 취소`.
  - Confirm label differs: `편집 취소` vs `입력 취소`.
  - Cancel: `돌아가기`.

- `place/add/page.tsx`
  - Back button shows confirm if `hasInput || canSave`.
  - Message: unsaved input.
  - Confirm: `나가기`, cancel: `계속 입력`.

- `place/[id]/edit/page.tsx`
  - Back button shows confirm if `isDirty`.
  - Message: unsaved edits.
  - Confirm: `나가기`, cancel: `계속 편집`.

Recommended extraction:

- Hook: `src/hooks/use-confirmable-exit.ts`
- Keep copy configurable.
- Possible API:

```ts
type ConfirmableExitOptions = {
  shouldConfirm: boolean
  onExit: () => void
}

function useConfirmableExit(options: ConfirmableExitOptions) {
  // returns: requestExit, confirmOpen, confirmExit, cancelExit
}
```

Do not centralize copy in this hook. Copy can move later to constants for localization.

Expected impact:

- Less repeated modal state and back/cancel logic.
- Safer future changes to exit behavior.

### 3. Save Error + Bottom CTA Patterns

Repeated patterns:

- `isSaving`
- `saveError`
- red error block
- `BottomCTA` disabled while saving
- spinner or progress icon inside CTA

Candidate extractions:

- `src/components/ui/save-error-banner.tsx`
- Optional helper component:

```tsx
<BottomCTAWithSaving
  onClick={handleSave}
  disabled={!canSave}
  saving={isSaving}
  label="저장"
  savingLabel="저장 중..."
/>
```

Use caution:

- `BottomCTA` is already simple and widely used.
- Prefer adding `SaveErrorBanner` first.
- Avoid wrapping all CTAs at once unless it reduces real duplication.

Expected impact:

- UI consistency.
- Easier localization for repeated save failure text.
- Minor code reduction.

### 4. Log Edit Session Helper

Current flow:

- `history/[id]/page.tsx` manually builds a `currentLog` object and stores it in localStorage before routing to `/log`.
- `log/page.tsx` parses `currentLog`, restores short-log state, preserves `deep_log`, and may route onward to `/log/deep`.
- `log/deep/page.tsx` parses `currentLog`, detects `_editId`, restores deep-log state, and saves both log and deep-log data.

Recommended extraction:

- New helper: `src/lib/log-edit-session.ts`
- Initial scope:
  - `toCurrentLogPayload(log: LogWithPlace): CurrentLogPayload`
  - `saveCurrentLogSession(payload)`
  - `readCurrentLogSession()`
  - `clearLogSessionAfterSave()`

Do not change storage keys without approval.

Fields to preserve:

- `_editId`
- `place_id`
- `place_name`
- `place_country_code`
- `tribe_id`
- `record_date`
- `revisit_score`
- `repeat`
- `heat_time`
- `ice_time`
- `pause_time`
- tribe-specific quick-log fields
- `bath_gender` if needed
- `deep_log`

Important current risk to verify:

- `history/[id]/page.tsx` currently stores `selectedPlace` with `facilityType: null` and does not include `bathPolicy`. Short-log bath gender derivation uses selected place facility/bath policy when available. Before changing this, confirm whether edit sessions should preserve original `bath_policy`/`facility_type`. If unsure, ask user.

Expected impact:

- Reduces missing-field risk when edit payload changes.
- Easier to reason about log edit behavior.
- Better type safety around localStorage payload.

### 5. Dead Code Review

Known candidate already in backlog:

- `explore/[id]/page.tsx:266-268` Google Maps URL fallback branch reportedly returns the same result on both branches.

Before removing or changing:

- Inspect current map URL construction.
- Confirm intended behavior: place name search vs exact lat/lng pin.
- If choosing exact coordinates changes UX, ask user.

General dead-code process:

1. Use `rg` to find imports/usages.
2. Check App Router reachability for pages/routes.
3. Check dynamic imports, localStorage keys, string route navigation.
4. Only remove if behavior is demonstrably unreachable or obsolete.

## Suggested Implementation Order

### Pass 1: `PlaceFacilityEditor`

Risk: Low/medium.

Steps:

1. Create `src/components/features/place-facility-editor.tsx`.
2. Move duplicated facility editor UI from place add/edit into the component.
3. Keep parent state in each page; child remains controlled.
4. Pass country code from parent for tattoo modal decision.
5. Replace duplicated blocks in:
   - `src/app/place/add/page.tsx`
   - `src/app/place/[id]/edit/page.tsx`
6. Run:
   - `npm run lint`
   - `npm run build`
7. Manual checks:
   - Place add Naver selection.
   - Place add Google selection.
   - Manual place add.
   - JP tattoo flow.
   - Non-JP tattoo flow.
   - Place edit dirty state changes when toggling facility.
   - Place edit save disabled/enabled behavior.

### Pass 2: Confirmable Exit Hook

Risk: Low/medium.

Steps:

1. Create `src/hooks/use-confirmable-exit.ts`.
2. Apply first to `place/[id]/edit/page.tsx` because it has the simplest dirty condition.
3. Run lint/build.
4. Apply to `place/add/page.tsx`.
5. Only then consider `log/page.tsx` and `log/deep/page.tsx`.

Manual checks:

- No input place add back returns immediately.
- Dirty place add back opens confirm.
- Place edit unchanged back returns immediately.
- Place edit changed back opens confirm.
- Log/deep cancel labels and messages remain identical.

### Pass 3: Save Error Banner

Risk: Low.

Steps:

1. Create `src/components/ui/save-error-banner.tsx`.
2. Replace repeated red error blocks in:
   - `place/add/page.tsx`
   - `place/[id]/edit/page.tsx`
   - `log/deep/page.tsx`
3. Consider `log/page.tsx` branch modal error separately because it appears inside a custom modal, not as page-level banner.
4. Run lint/build.

### Pass 4: Log Edit Session Helper

Risk: Medium/high.

Steps:

1. Define `CurrentLogPayload` type in `src/lib/log-edit-session.ts`.
2. Add helper for history detail to build payload.
3. Replace only `history/[id]/page.tsx` payload construction first.
4. Run lint/build.
5. Then update `log/page.tsx` and `log/deep/page.tsx` to read via helper, preserving `safeParse` fallback behavior.

Decision point:

- Ask whether edit sessions should preserve `facilityType` and `bathPolicy` in `selectedPlace` for bath-gender derivation. Current code appears to store `facilityType: null` from history edit entry.

Manual checks:

- Edit short log from history.
- Edit deep log from history.
- Change tribe in edit mode.
- Direct story save from edit mode.
- Deep-log edit then story save.
- Cancel from quick log edit.
- Cancel from deep log edit.

## Verification Commands

Run after each pass:

```bash
npm run lint
npm run build
```

If touching log/session behavior, also manually test in browser:

```bash
npm run dev
```

## Current Worktree Notes At Handoff

As of this plan creation:

- Cleanup/Sentry migration was committed and pushed:
  - `387e96f chore: clean up lint warnings and sentry client config`
- Uncommitted files remain:
  - `docs/po/BACKLOG.md` includes user’s existing 2026-04-30 done entry plus this new refactor backlog item.
  - `.claude/scheduled_tasks.lock` untracked.
  - `docs/plans/PLAN_staging_environment.md` untracked.
  - This plan file is newly added.

Before starting implementation in another terminal, run:

```bash
git status --short
```

Do not overwrite unrelated uncommitted files.
