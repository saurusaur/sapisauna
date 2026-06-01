> **[ARCHIVED 2026-05-30]** 적용 완료. `src/lib/log-edit-session.ts` 구현됨
> (buildQuickEditSession / buildDeepEntrySession 분리, clearLogSessionAfterSave가 selectedRecordDate까지 정리).
> writer 2곳 + reader 2곳 마이그레이션 완료 (커밋 `00918da`, `3cac216`).
> PLAN 대비 더 잘 구현됨 (steam_sauna_temp · primary_sauna_kind · _deepOnly 추가). 근거: handoff_20260529_doc_cleanup_b_plan.md §2.4.

# Log Edit Session Helper

Date: 2026-05-18
Status: Ready for implementation
Origin: Pass 4 of `archive/PLAN_form_flow_consistency_refactor.md`

## Goal

Centralize the localStorage payload contract used when entering a log edit session from history, so writer and reader sides share a typed contract.

## Current State

Four sites touch the same two keys (`currentLog`, `selectedPlace`) with no shared type. The decision-point fix landed in `4defe93` — `place_facility_type` / `place_bath_policy` are now restored — but the inline payload construction still lives across 4 files.

| File | Line | Role |
|------|------|------|
| `src/app/history/[id]/page.tsx` | 124–153 | Writer — quick-log edit |
| `src/app/history/[id]/page.tsx` | 302–331 | Writer — deep-log entry |
| `src/app/log/page.tsx` | 107–115, 122–145 | Reader — short-log restore |
| `src/app/log/deep/page.tsx` | 84–87, 194–224 | Reader — deep-log restore + clear |

## Non-Negotiables

- Do not change storage keys (`currentLog`, `selectedPlace`).
- Do not change `_editId`, `selectedRecordDate`, `savedLogId`, `isNewLog`, `pendingReward` semantics.
- Do not change story-save flow after log save.
- Do not change short-log date/time picker logic.
- Reader behavior must remain tolerant of malformed payloads (`safeParse` fallback).

## Design

New module: `src/lib/log-edit-session.ts`

```ts
export interface CurrentLogPayload {
  _editId?: string
  place_id: string
  place_name: string
  place_country_code: string
  tribe_id: TribeId
  record_date: string
  revisit_score?: number
  repeat?: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  sauna_temp?: number
  cold_bath_temp?: number
  totono_score?: number
  hot_bath_temp?: number
  water_quality?: number
  jjim_temp?: number
  rest_quality?: number
  deep_log?: DeepLog
}

export interface SelectedPlacePayload {
  id: string
  name: string
  countryCode: string
  facilityType?: FacilityType
  bathPolicy?: BathPolicy
}

// Build payloads from a history log
export function buildEditSessionFromHistory(log: LogWithPlace): {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
}

// Persistence helpers (thin wrappers; preserve current behavior)
export function saveEditSession(payload: {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
}): void

export function readEditSession(): {
  currentLog: CurrentLogPayload | null
  selectedPlace: SelectedPlacePayload | null
}

export function clearEditSession(): void
```

## Implementation Stages

### Stage A — writers

1. Create `src/lib/log-edit-session.ts` with types + `buildEditSessionFromHistory` + `saveEditSession`.
2. Replace both writer sites in `src/app/history/[id]/page.tsx` with the helper.
3. Readers untouched.
4. `npm run lint && npm run build`.
5. Manual smoke test scenarios 1–4 below.
6. Commit.

### Stage B — readers

1. Add `readEditSession` + `clearEditSession`.
2. Migrate `src/app/log/page.tsx` to read via helper, preserving `safeParse` tolerance.
3. Migrate `src/app/log/deep/page.tsx` likewise.
4. `npm run lint && npm run build`.
5. Manual smoke test scenarios 1–5.
6. Commit.

## Verification

```bash
npm run lint
npm run build
npm run dev  # then exercise scenarios below
```

## Manual Smoke Tests

1. **Private sauna edit** — edit a `private-sauna` log → save without changes → confirm `bath_gender` in DB is unchanged.
2. **Mixed policy edit** — edit a `mixed` bath_policy log → save → confirm `bath_gender` stays mixed/mixed_male/mixed_female.
3. **Deep log add from history (no existing deep_log)** — click "딥로그 추가" → page renders cleanly, no console errors.
4. **Edit log with deep_log** — edit a log that has a deep_log → all values restored in both quick + deep forms.
5. **Cancel from quick edit** — open edit → cancel → start a fresh `/log` → confirm no stale place pre-fill.

## Scope Guard

This refactor does not change:

- Storage keys
- `selectedRecordDate`, `savedLogId`, `isNewLog`, `pendingReward` handling
- Tribe switching during edit
- Direct story save from edit
- Reward flow
