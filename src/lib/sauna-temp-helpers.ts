/**
 * 사우너 사우나 온도 헬퍼
 *
 * Quick log에서 사우너는 건식(sauna_temp)과 습식(steam_sauna_temp) 둘 중
 * 하나 또는 둘 다 입력 가능. 둘 다 입력 시 primary_sauna_kind로 주 이용 사우나 명시.
 *
 * 표시 영역(스토리카드/히스토리 detail/Stats 인사이트)은 모두 primary 기반으로
 * 메인 메트릭을 결정하기 위해 이 헬퍼를 통과한다.
 */

export type SaunaKind = 'dry' | 'steam'

export interface PrimarySaunaTemp {
  /** primary 사우나의 온도 (°C) */
  value: number
  /** primary 사우나 종류 */
  kind: SaunaKind
  /** "건식" / "습식" 한국어 라벨 */
  labelKr: string
  /** "TEMP DELTA" / "STEAM TEMP DELTA" 영문 라벨 */
  labelEn: string
  /** "온도차" / "습식 온도차" 한국어 ΔT 라벨 */
  deltaLabelKr: string
}

interface SaunaInputs {
  sauna_temp?: number | null
  steam_sauna_temp?: number | null
  primary_sauna_kind?: SaunaKind | null
}

/**
 * 로그에서 주 이용 사우나의 온도와 표시 메타를 추출한다.
 *
 * 결정 로직:
 *  - primary_sauna_kind가 명시되어 있으면 그쪽 (정합성: 해당 필드 값 존재 확인)
 *  - primary_sauna_kind가 null이면 fallback: sauna_temp (건식 우선), 그것도 없으면 steam_sauna_temp
 *  - 둘 다 없으면 null 반환
 *
 * fallback은 마이그레이션 이전의 레거시 데이터나 사우나 미입력 로그를 안전하게 처리하기 위함.
 */
export function getPrimarySaunaTemp(log: SaunaInputs): PrimarySaunaTemp | null {
  const dry = log.sauna_temp
  const steam = log.steam_sauna_temp
  const primary = log.primary_sauna_kind

  if (primary === 'dry' && dry != null) {
    return makeDry(dry)
  }
  if (primary === 'steam' && steam != null) {
    return makeSteam(steam)
  }
  // Fallback: primary 미지정인 경우 건식 우선
  if (dry != null) return makeDry(dry)
  if (steam != null) return makeSteam(steam)
  return null
}

function makeDry(value: number): PrimarySaunaTemp {
  return {
    value,
    kind: 'dry',
    labelKr: '건식',
    labelEn: 'TEMP DELTA',
    deltaLabelKr: '온도차',
  }
}

function makeSteam(value: number): PrimarySaunaTemp {
  return {
    value,
    kind: 'steam',
    labelKr: '습식',
    labelEn: 'STEAM TEMP DELTA',
    deltaLabelKr: '습식 온도차',
  }
}

/**
 * ΔT (사우나 - 냉탕) 계산. primary 기반.
 * 사우나 미입력 시 null. 냉탕 미입력 시 fallback 15°C 사용 (기존 stories/history 동작과 동일).
 */
export function getPrimaryTempDelta(
  log: SaunaInputs & { cold_bath_temp?: number | null }
): { delta: number; primary: PrimarySaunaTemp } | null {
  const primary = getPrimarySaunaTemp(log)
  if (primary == null) return null
  const cold = log.cold_bath_temp ?? 15
  return { delta: primary.value - cold, primary }
}
