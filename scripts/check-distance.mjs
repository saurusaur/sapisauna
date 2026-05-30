// ⚠️ 아래 Haversine 로직은 src/lib/geo/distance.ts의 복제본입니다.
//    (devDependency 없이 `node`로 검증하기 위한 의도적 복제 — PLAN 결정)
//    distance.ts의 계산식/null·NaN 처리를 수정하면 이 파일도 함께 갱신하세요.
const EARTH_RADIUS_M = 6371000

function toFiniteNumber(value) {
  if (value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function distanceMeters(from, to) {
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const seoulStation = { latitude: 37.5547, longitude: 126.9707 }
const gangnamStation = { latitude: 37.4979, longitude: 127.0276 }
const distance = distanceMeters(seoulStation, gangnamStation)

assert(distance >= 8000 && distance <= 8300, `Expected Seoul-Gangnam around 8.0-8.3km, got ${distance}`)
assert(
  distanceMeters(
    { latitude: '37.5547', longitude: '126.9707' },
    { latitude: '37.4979', longitude: '127.0276' }
  ) === distance,
  'Expected string coordinates to match numeric coordinates'
)
assert(distanceMeters(seoulStation, { latitude: null, longitude: 127.0276 }) === null, 'Expected null latitude to return null')
assert(distanceMeters(seoulStation, { latitude: Number.NaN, longitude: 127.0276 }) === null, 'Expected NaN latitude to return null')

console.log('distance checks passed')
