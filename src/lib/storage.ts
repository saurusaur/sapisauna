/**
 * localStorage 유틸리티
 * savedLogs: 완료된 기록 히스토리 (미래: Supabase로 대체)
 */

export type SavedLog = {
  id: string              // display_id 또는 자동 생성
  savedAt: string         // ISO timestamp
  place_name: string
  tribe_id: 'bather' | 'saunner' | 'jimi'
  created_at?: string
  date?: string
  // saunner
  sauna_temp?: number
  cold_bath_temp?: number
  repeat?: number
  totono_score?: number
  // bather
  water_quality?: number
  hot_bath_temp?: number
  refreshed_score?: number
  // jimi
  rest_quality?: number
  cleanliness?: number
  jjim_temp?: number
  // common
  revisit_score?: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  // deep log
  deep_log?: Record<string, unknown>
}

const SAVED_LOGS_KEY = 'savedLogs'

/** 기록을 히스토리에 저장 (배열 앞에 추가) */
export function saveLogToHistory(log: Record<string, unknown>): SavedLog {
  const saved = getSavedLogs()
  const entry: SavedLog = {
    ...log,
    id: (log.display_id as string) || `log-${Date.now()}`,
    savedAt: new Date().toISOString(),
  } as SavedLog

  saved.unshift(entry)
  localStorage.setItem(SAVED_LOGS_KEY, JSON.stringify(saved))
  return entry
}

/** 저장된 기록 목록 가져오기 */
export function getSavedLogs(): SavedLog[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_LOGS_KEY) || '[]')
  } catch {
    return []
  }
}
