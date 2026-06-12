/**
 * Log edit session — typed contract for the localStorage payload used when
 * entering an edit flow from history (and as an in-flight scratch on the
 * log page).
 *
 * Storage keys are intentionally preserved: `currentLog`, `selectedPlace`,
 * and `selectedRecordDate` (cleared together post-save).
 *
 * All fields on the read side are optional — readers must tolerate partial
 * or legacy payloads. Writers fill in what they know; structural typing
 * still validates the writer outputs.
 */

import { safeParse } from './utils'
import type { LogWithPlace, LogBlock, TribeId, FacilityType, BathPolicy } from '@/types'

export interface CurrentLogPayload {
  _editId?: string
  place_id?: string
  place_name?: string
  place_country_code?: string
  tribe_id?: TribeId
  record_date?: string
  revisit_score?: number
  repeat?: number
  heat_time?: number
  ice_time?: number
  steam_sauna_temp?: number
  primary_sauna_kind?: 'dry' | 'steam'
  cold_bath_temp?: number
  totono_score?: number
  hot_bath_temp?: number
  water_quality?: number
  sweat_quality?: number
  rest_quality?: number
  cleanliness?: number
  crowd?: string
  companion?: string
  cost?: number
  currency?: string
  memo?: string
  blocks?: LogBlock[]
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
    steam_sauna_temp: log.steam_sauna_temp,
    primary_sauna_kind: log.primary_sauna_kind,
    cold_bath_temp: log.cold_bath_temp,
    totono_score: log.totono_score,
    hot_bath_temp: log.hot_bath_temp,
    water_quality: log.water_quality,
    rest_quality: log.rest_quality,
    cleanliness: log.cleanliness ?? undefined,
    crowd: log.crowd ?? undefined,
    companion: log.companion ?? undefined,
    cost: log.cost ?? undefined,
    currency: log.currency ?? undefined,
    memo: log.memo ?? undefined,
    blocks: log.blocks,
  }
}

/** Edit entry from history — 편집 데이터는 blocks(+평탄 필드)가 정본. */
export function buildQuickEditSession(log: LogWithPlace): {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
} {
  return { currentLog: buildBaseCurrentLog(log), selectedPlace: buildSelectedPlace(log) }
}

/** Persist both payloads to localStorage. Keys are stable contract. */
export function saveEditSession(payload: {
  currentLog: CurrentLogPayload
  selectedPlace: SelectedPlacePayload
}): void {
  localStorage.setItem('currentLog', JSON.stringify(payload.currentLog))
  localStorage.setItem('selectedPlace', JSON.stringify(payload.selectedPlace))
}

/** Read edit session payloads. Returns null for keys that are absent or
 * malformed. Readers should check fields individually before use — types
 * are optional to reflect that legacy/partial payloads exist in the wild. */
export function readEditSession(): {
  currentLog: CurrentLogPayload | null
  selectedPlace: SelectedPlacePayload | null
} {
  const rawLog = localStorage.getItem('currentLog')
  const rawPlace = localStorage.getItem('selectedPlace')
  return {
    currentLog: rawLog ? safeParse<CurrentLogPayload | null>(rawLog, null) : null,
    selectedPlace: rawPlace ? safeParse<SelectedPlacePayload | null>(rawPlace, null) : null,
  }
}

/** Post-save cleanup. Removes all three keys that participate in the log
 * entry/edit flow — including `selectedRecordDate` which is set by the
 * home page calendar and history calendar to preset the log date. */
export function clearLogSessionAfterSave(): void {
  localStorage.removeItem('currentLog')
  localStorage.removeItem('selectedPlace')
  localStorage.removeItem('selectedRecordDate')
}
