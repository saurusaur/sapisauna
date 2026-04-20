/**
 * lat/lng 누락 장소 보강 — Google Geocoding forward API로 주소 → 좌표.
 * manual 소스 국문 주소는 address_original 그대로 보존.
 *
 * 사용: npx tsx scripts/fix-missing-latlng.ts [--dry-run]
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
const DRY_RUN = process.argv.includes('--dry-run')

;(async () => {
  console.log(`\n=== lat/lng 보강 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // lat/lng 없는 장소 조회
  const { data: places, error } = await s.from('places')
    .select('id, place_sources(id, source, name_original, address_original)')
    .is('latitude', null)

  if (error) { console.error('조회 실패:', error); process.exit(1) }

  for (const p of (places ?? []) as any[]) {
    const src = p.place_sources?.[0]
    if (!src) { console.log(`  ${p.id.slice(0, 8)}: 소스 없음 skip`); continue }
    if (!src.address_original) { console.log(`  ${p.id.slice(0, 8)}: 주소 없음 skip`); continue }

    const addr = src.address_original
    console.log(`\n── ${p.id.slice(0, 8)} · ${src.name_original}`)
    console.log(`   addr: ${addr}`)

    // Google Geocoding forward
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', addr)
    url.searchParams.set('language', 'en')
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!)

    const r = await fetch(url.toString())
    const d = await r.json()
    if (d.status !== 'OK' || !d.results?.[0]) {
      console.log(`   ❌ Geocoding 실패: ${d.status}`)
      continue
    }

    const first = d.results[0]
    const lat = first.geometry?.location?.lat
    const lng = first.geometry?.location?.lng
    const resolved = resolveAddress(first.address_components, src.name_original)

    console.log(`   lat/lng: ${lat}, ${lng}`)
    console.log(`   country_code: ${resolved.country_code}`)
    console.log(`   city: ${resolved.city}`)

    if (!DRY_RUN) {
      // places 업데이트 (latitude/longitude/country_code/city)
      const { error: pErr } = await s.from('places').update({
        latitude: lat,
        longitude: lng,
        country_code: resolved.country_code,
        city: resolved.city,
      }).eq('id', p.id)
      if (pErr) { console.log(`   ❌ places update 실패: ${pErr.message}`); continue }

      // manual source의 latitude/longitude만 업데이트 (address_original은 국문 보존)
      if (src.source === 'manual') {
        const { error: sErr } = await s.from('place_sources').update({
          latitude: lat,
          longitude: lng,
        }).eq('id', src.id)
        if (sErr) { console.log(`   ⚠️ source update 실패: ${sErr.message}`) }
      }
      console.log(`   ✅ 업데이트됨`)
    }

    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n=== 완료 ===`)
  if (DRY_RUN) console.log(`(dry-run — DB 미반영)`)
})()
