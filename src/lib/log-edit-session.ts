/**
 * Log edit session — typed contract for the localStorage payload used when
 * entering an edit flow from history.
 *
 * Storage keys are intentionally preserved: `currentLog` and `selectedPlace`.
 * Reader sites use safeParse with a fallback, so writers MUST keep field
 * names and shapes stable across this module.
 */

import type { LogWithPlace, TribeId, FacilityType, BathPolicy } from '@/types'

export interface CurrentLogPayload {
  _editId: string
  _deepOnly?: boolean
  place_id: string
  place_name: string
  place_country_code: string
  tribe_id: TribeId
  record_date: string
  revisit_score: number
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
  deep_log?: LogWithPlace['deep_log']
}

export interface SelectedPlacePayload {
  id: string
  name: string
  countryCode: string
  facilityType?: FacilityType
  bathPolicy?: BathPolicy
}

function buildSelectedPlace(log: LogWithPlace): SelectedPlacePayload {
  return {
    id: log.place_id,
    name: log.place_name,
    countryCode: log.place_country_code,
    facilityType: log.place_facility_type,
    bathPolicy: log.place_bath_policy,
  }
}

function buildBaseCurrentLog(log: LogWithPlace): CurrentLogPayload {
  return {
    _editId: log.id,
    place_id: log.place_id,
    place_name: log.place_name,
    place_country_code: log.place_country_code,
    tribe_id: log.tribe_id,
    record_date: log.date,
    revisit_score: log.revisit_score,
    repeat: log.repeat,
    heat_time: log.heat_time,
    ice_time: log.ice_time,
    pause_time: log.pause_time,
    sauna_temp: log.sauna_temp,
    cold_bath_temp: log.cold_bath_temp,
    totono_score: log.totono_score,
    hot_bath_temp: log.hot_bath_temp,
    water_quality: log.water_quality,
    jjim_temp: log.jjim_temp,
    rest_quality: log.rest_quality,
  }
}

/** Quick-log edit entry from history. Includes deep_log if present so the
 * quick-log page can preserve it through edit-save. */
export function buildQuickEditSession(log: LogWithPlace): {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
} {
  const currentLog = buildBaseCurrentLog(log)
  if (log.deep_log) currentLog.deep_log = log.deep_log
  return { currentLog, selectedPlace: buildSelectedPlace(log) }
}

/** Deep-log entry from history detail (used when no deep_log exists yet).
 * `_deepOnly` flag is preserved for back-compat even though no reader
 * currently branches on it. */
export function buildDeepEntrySession(log: LogWithPlace): {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
} {
  const currentLog = buildBaseCurrentLog(log)
  currentLog._deepOnly = true
  return { currentLog, selectedPlace: buildSelectedPlace(log) }
}

/** Persist both payloads to localStorage. Keys are stable contract. */
export function saveEditSession(payload: {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
}): void {
  localStorage.setItem('currentLog', JSON.stringify(payload.currentLog))
  localStorage.setItem('selectedPlace', JSON.stringify(payload.selectedPlace))
}
