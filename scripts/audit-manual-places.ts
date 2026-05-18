/**
 * Audit: manual로 등록된 장소의 country_code 정합성 전수 점검.
 *
 * 배경:
 *   src/app/place/add/page.tsx:170에서 source 상태 기본값('naver') 때문에
 *   manual 입력도 country_code='KR'로 저장되는 버그가 있었음.
 *
 * 이 스크립트는 read-only — DB 변경하지 않음.
 * source='manual'인 모든 row를 forward-geocode 결과와 비교.
 *
 * 사용: npx tsx scripts/audit-manual-places.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import { resolveAddress } from '../src/lib/geo/address-builder'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface PlaceRow {
  id: string
  country_code: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  place_sources: Array<{
    source: string
    name_original: string | null
    address_original: string | null
  }> | null
}

;(async () => {
  console.log(`\n=== Manual Source 전수 Audit (READ-ONLY) ===\n`)

  // source='manual'인 place_id 전체
  const { data: manualSources, error: srcErr } = await s
    .from('place_sources')
    .select('place_id')
    .eq('source', 'manual')

  if (srcErr) { console.error('place_sources 조회 실패:', srcErr); process.exit(1) }
  const manualIds = (manualSources ?? []).map(r => r.place_id)
  if (manualIds.length === 0) {
    console.log('manual 소스 row가 없음. 종료.')
    return
  }

  const { data: places, error: pErr } = await s
    .from('places')
    .select('id, country_code, city, latitude, longitude, place_sources(source, name_original, address_original)')
    .in('id', manualIds)

  if (pErr) { console.error('places 조회 실패:', pErr); process.exit(1) }
  const rows = (places ?? []) as PlaceRow[]

  console.log(`총 ${rows.length}건의 manual 소스 row 발견.\n`)
  if (rows.length === 0) return

  const mismatches: Array<{ id: string; name: string; addr: string; currentCC: string | null; currentCity: string | null; currentLat: number | null; currentLng: number | null; guessedCC: string; guessedCity: string | null; lat: number; lng: number }> = []
  const okRows: Array<{ id: string; name: string; cc: string | null }> = []
  const geocodeFailed: Array<{ id: string; name: string; addr: string; status: string }> = []
  const noAddr: Array<{ id: string; name: string }> = []

  for (const p of rows) {
    const manualSource = p.place_sources?.find(src => src.source === 'manual')
    const name = manualSource?.name_original ?? '(no name)'
    const addr = manualSource?.address_original ?? ''
    if (!addr) {
      noAddr.push({ id: p.id, name })
      continue
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', addr)
    url.searchParams.set('language', 'en')
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!)

    let resp: Response
    try {
      resp = await fetch(url.toString())
    } catch (e) {
      console.error(`  ${p.id.slice(0, 8)} · ${name} — fetch 실패:`, e)
      geocodeFailed.push({ id: p.id, name, addr, status: 'fetch_error' })
      continue
    }

    const data = await resp.json()
    if (data.status !== 'OK' || !data.results?.[0]) {
      geocodeFailed.push({ id: p.id, name, addr, status: data.status ?? 'unknown' })
      continue
    }

    const first = data.results[0]
    const lat = first.geometry?.location?.lat
    const lng = first.geometry?.location?.lng
    const resolved = resolveAddress(first.address_components, name)

    // 불일치 판정: country_code 다르거나, city/lat/lng 누락
    const ccMismatch = p.country_code !== resolved.country_code
    const cityMissing = !p.city && resolved.city
    const latLngMissing = (p.latitude == null || p.longitude == null) && lat && lng

    if (ccMismatch || cityMissing || latLngMissing) {
      mismatches.push({
        id: p.id,
        name,
        addr,
        currentCC: p.country_code,
        currentCity: p.city,
        currentLat: p.latitude,
        currentLng: p.longitude,
        guessedCC: resolved.country_code,
        guessedCity: resolved.city,
        lat,
        lng,
      })
    } else {
      okRows.push({ id: p.id, name, cc: p.country_code })
    }

    await new Promise(r => setTimeout(r, 250))
  }

  console.log(`\n=== 결과 ===\n`)
  console.log(`✅ 정상: ${okRows.length}건`)
  console.log(`❌ 불일치 (country_code 또는 city/lat/lng 누락): ${mismatches.length}건`)
  console.log(`⚠️  Geocoding 실패: ${geocodeFailed.length}건`)
  console.log(`⚠️  주소 자체 없음: ${noAddr.length}건`)

  if (mismatches.length > 0) {
    console.log(`\n— 수정 후보 ——`)
    for (const r of mismatches) {
      console.log(`  ${r.id.slice(0, 8)} · ${r.name}`)
      console.log(`    addr: ${r.addr}`)
      console.log(`    현재: country_code=${r.currentCC}, city=${r.currentCity}, lat=${r.currentLat}, lng=${r.currentLng}`)
      console.log(`    제안: country_code=${r.guessedCC}, city=${r.guessedCity}, lat=${r.lat.toFixed(4)}, lng=${r.lng.toFixed(4)}`)
    }
  }

  if (geocodeFailed.length > 0) {
    console.log(`\n— Geocoding 실패 ——`)
    for (const r of geocodeFailed) {
      console.log(`  ${r.id.slice(0, 8)} · ${r.name} — ${r.status}`)
      console.log(`    addr: ${r.addr}`)
    }
  }

  if (noAddr.length > 0) {
    console.log(`\n— 주소 없음 ——`)
    for (const r of noAddr) {
      console.log(`  ${r.id.slice(0, 8)} · ${r.name}`)
    }
  }

  console.log(`\n=== 완료 ===`)
})()
