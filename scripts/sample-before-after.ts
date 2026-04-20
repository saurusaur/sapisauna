/**
 * Before/after 샘플 비교 — 스크립트 실제 결과 미리 보기
 * 6개 Google 소스 장소의 주소 변환 결과 출력.
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

const prefixes = [
  '5dc18d60', '908c8ab7', '0130e29a', '07da6b4f', 'ca118a6e', 'a5414757', '346d8006',
  '06dd629e', '49bcf998', '0c80856e',
  'a666495a', '273d4c33', 'b6aaadfd', '9fa63f79', '9ac220df',
]

;(async () => {
  // 모든 google 소스 있는 places 가져와서 prefix 필터
  const { data: allPlaces } = await s.from('places')
    .select('id, latitude, longitude, country_code, city, place_sources(source, name_original, address_original)')
  const googlePlaces = (allPlaces ?? []).filter((p: any) =>
    p.place_sources?.some((x: any) => x.source === 'google') && p.latitude && p.longitude
  )
  console.log(`total places with google source: ${googlePlaces.length}`)
  console.log('')

  for (const prefix of prefixes) {
    const p = googlePlaces.find((x: any) => (x.id as string).startsWith(prefix)) as any
    if (!p) { console.log(`no match for ${prefix}`); continue }
    const google = p.place_sources.find((x: any) => x.source === 'google')
    if (!google) continue

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${p.latitude},${p.longitude}&language=en&key=${process.env.GOOGLE_PLACES_API_KEY}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.status !== 'OK') { console.log(prefix, 'Geocoding 실패:', d.status); continue }
    const resolved = resolveAddress(d.results[0].address_components, google.name_original)

    console.log(`─── ${p.id.slice(0, 8)} ${google.name_original} ───`)
    console.log(`BEFORE  cc="${p.country_code}" city="${p.city ?? ''}"`)
    console.log(`        addr: ${google.address_original}`)
    console.log(`AFTER   cc="${resolved.country_code}" city="${resolved.city ?? ''}"`)
    console.log(`        addr: ${resolved.address}`)
    console.log('')
    await new Promise(r => setTimeout(r, 300))
  }
})()
