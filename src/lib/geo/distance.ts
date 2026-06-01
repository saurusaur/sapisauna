// ⚠️ 이 Haversine 로직은 scripts/check-distance.mjs에 복제본이 있습니다.
//    (devDependency 없이 `node`로 검증하기 위한 의도적 복제 — PLAN 결정)
//    계산식/null·NaN 처리를 수정하면 check-distance.mjs도 함께 갱신하세요.
export interface Coordinates {
  latitude: number | string | null
  longitude: number | string | null
}

const EARTH_RADIUS_M = 6371000

function toFiniteNumber(value: number | string | null): number | null {
  if (value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function distanceMeters(from: Coordinates, to: Coordinates): number | null {
  const fromLat = toFiniteNumber(from.latitude)
  const fromLng = toFiniteNumber(from.longitude)
  const toLat = toFiniteNumber(to.latitude)
  const toLng = toFiniteNumber(to.longitude)

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
    return null
  }

  const dLat = ((toLat - fromLat) * Math.PI) / 180
  const dLng = ((toLng - fromLng) * Math.PI) / 180
  const lat1 = (fromLat * Math.PI) / 180
  const lat2 = (toLat * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(EARTH_RADIUS_M * c)
}

export function formatDistance(meters: number | null): string | null {
  if (meters === null || !Number.isFinite(meters)) return null
  if (meters < 1000) return `${Math.max(0, Math.round(meters))}m`
  return `${(meters / 1000).toFixed(1)}km`
}
