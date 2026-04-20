/**
 * 기존 places/place_sources 데이터를 Geocoding 기반으로 교정
 *
 * 사용법: npx tsx scripts/migrate-existing-addresses.ts [--dry-run]
 *
 * 처리 규칙 (place_sources 조합에 따라):
 *   · Naver only           → places.country_code/city만 업데이트 (국문 주소 보존)
 *   · Naver + Google       → places + Google source의 address_original만 정제
 *   · Google only          → places + Google source address_original 정제
 *   · Manual only          → places + Manual source address_original 정제 (reversed 감지 시)
 *
 * 에러 처리: Geocoding 실패는 로그 축적 → 실행 끝에 수동 검토 리스트 출력
 * Rate limit: 250ms 간격 (Geocoding 50 QPS 여유)
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// .env.local 로드
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const googleKey = process.env.GOOGLE_PLACES_API_KEY!
const supabase = createClient(supabaseUrl, serviceKey)

const DRY_RUN = process.argv.includes('--dry-run')
const RATE_LIMIT_MS = 250

// ─── address-builder 로직 인라인 복제 (self-contained 스크립트) ───
interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}
interface ResolvedAddress {
  country_code: string
  city: string | null
  address: string
}

function resolveAddress(components: AddressComponent[], placeName?: string): ResolvedAddress {
  const getLong = (type: string) => components.find(c => c.types.includes(type))?.long_name
  const getShort = (type: string) => components.find(c => c.types.includes(type))?.short_name

  const country_code = (getShort('country') ?? '').toUpperCase()
  const city = getLong('locality') ?? getLong('postal_town') ?? null

  const parts: string[] = []
  const seen = new Set<string>()
  const add = (s?: string) => {
    if (!s || seen.has(s)) return
    seen.add(s); parts.push(s)
  }

  const num = getLong('street_number')
  const route = getLong('route')
  if (num || route) {
    add([num, route].filter(Boolean).join(' '))
  } else {
    const deepSubs = ['sublocality_level_3', 'sublocality_level_4', 'sublocality_level_5']
      .map(t => getLong(t))
      .filter((v): v is string => !!v)
    const premises = components
      .filter(c => c.types.includes('premise'))
      .map(c => c.long_name)
      .filter(n => !isLikelyPOIName(n, placeName))
    const blockStr = [...deepSubs, ...premises].join('-')
    if (blockStr) add(blockStr)
  }

  for (const t of ['sublocality_level_2', 'sublocality_level_1', 'neighborhood']) {
    add(getLong(t))
  }
  add(city ?? undefined)
  const admin1 = getLong('administrative_area_level_1')
  if (admin1 && admin1 !== city) add(admin1)
  add(getLong('country'))

  return { country_code, city, address: parts.join(', ') }
}

function isLikelyPOIName(value: string, placeName?: string): boolean {
  if (!value) return false
  if (placeName) {
    const v = value.toLowerCase()
    const n = placeName.toLowerCase()
    if (v === n || v.includes(n) || n.includes(v)) return true
  }
  return !/\d/.test(value) && value.length >= 4
}

async function reverseGeocode(lat: number, lng: number, placeName?: string): Promise<ResolvedAddress | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${lat},${lng}`)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', googleKey)

  try {
    const resp = await fetch(url.toString())
    if (!resp.ok) return null
    const data = await resp.json()
    if (data.status !== 'OK') return null
    const first = data.results?.[0]
    if (!first) return null
    return resolveAddress(first.address_components, placeName)
  } catch {
    return null
  }
}

// ─── 기존 주소 reversed order 감지 (manual 소스용) ───
const REVERSED_PREFIXES = ['Japan,', 'South Korea,', 'Korea,', 'China,', 'Taiwan,']
function isReversedAddress(addr: string): boolean {
  return REVERSED_PREFIXES.some(p => addr.startsWith(p))
}

// ─── 메인 ───
interface PlaceRow {
  id: string
  latitude: number | null
  longitude: number | null
  country_code: string | null
  city: string | null
  place_sources: {
    id: string
    source: 'naver' | 'google' | 'manual'
    name_original: string
    address_original: string | null
  }[]
}

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function migrate() {
  console.log(`\n=== addresses 교정 마이그레이션 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  const { data, error } = await supabase
    .from('places')
    .select('id, latitude, longitude, country_code, city, place_sources(id, source, name_original, address_original)')

  if (error) { console.error('places 조회 실패:', error); process.exit(1) }
  const places = (data ?? []) as unknown as PlaceRow[]

  let processed = 0
  let updatedPlaces = 0
  let updatedSources = 0
  let skipped = 0
  const errors: { place_id: string; reason: string }[] = []

  for (const p of places) {
    if (!p.latitude || !p.longitude) {
      errors.push({ place_id: p.id, reason: 'no lat/lng' })
      continue
    }

    const sources = p.place_sources || []
    const hasNaver = sources.some(s => s.source === 'naver')
    const hasGoogle = sources.some(s => s.source === 'google')
    const hasManual = sources.some(s => s.source === 'manual')

    // Naver only: places만 업데이트, address_original 미변경
    const type = hasGoogle ? 'google-or-mixed' : hasNaver ? 'naver-only' : hasManual ? 'manual-only' : 'unknown'

    // 어떤 source의 name을 reverseGeocode에 전달할지 (POI 이름 filter용)
    const nameHint = sources.find(s => s.source === 'google')?.name_original
      ?? sources.find(s => s.source === 'manual')?.name_original
      ?? sources[0]?.name_original

    const resolved = await reverseGeocode(p.latitude, p.longitude, nameHint)
    await sleep(RATE_LIMIT_MS)

    if (!resolved) {
      errors.push({ place_id: p.id, reason: 'geocoding failed' })
      continue
    }

    console.log(`  ${p.id.slice(0, 8)} [${type}] ${resolved.country_code} · ${resolved.city ?? '(no city)'}`)

    // places 업데이트 (country_code, city)
    if (!DRY_RUN) {
      const { error: pErr } = await supabase
        .from('places')
        .update({ country_code: resolved.country_code, city: resolved.city })
        .eq('id', p.id)
      if (pErr) {
        errors.push({ place_id: p.id, reason: `places update: ${pErr.message}` })
        continue
      }
    }
    updatedPlaces++

    // source address_original 정제 (조건부)
    for (const s of sources) {
      if (s.source === 'naver') continue // 네이버는 국문 주소 보존

      let shouldUpdate = false
      if (s.source === 'google') {
        shouldUpdate = true // 항상 정제
      } else if (s.source === 'manual') {
        // reversed order 감지 시에만 정제
        shouldUpdate = !!s.address_original && isReversedAddress(s.address_original)
      }

      if (shouldUpdate && resolved.address) {
        console.log(`    → source ${s.source} (${s.id.slice(0, 8)}) address 정제`)
        if (!DRY_RUN) {
          const { error: sErr } = await supabase
            .from('place_sources')
            .update({ address_original: resolved.address })
            .eq('id', s.id)
          if (sErr) {
            errors.push({ place_id: p.id, reason: `source ${s.id} update: ${sErr.message}` })
            continue
          }
        }
        updatedSources++
      }
    }

    processed++
  }

  console.log(`\n=== 완료 ===`)
  console.log(`  처리: ${processed} / 전체 ${places.length}`)
  console.log(`  places 업데이트: ${updatedPlaces}`)
  console.log(`  place_sources 업데이트: ${updatedSources}`)
  console.log(`  skip: ${skipped}`)
  console.log(`  errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log(`\n수동 검토 필요:`)
    for (const e of errors) console.log(`  - ${e.place_id}: ${e.reason}`)
  }

  if (DRY_RUN) console.log(`\n(dry-run — DB 미반영)`)
}

migrate().catch(e => { console.error(e); process.exit(1) })
