/**
 * Geocoding 응답의 address_components 원본 덤프
 * 여러 국가 샘플 채취해서 구조 비교
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 각국 대표 샘플 — prefix 매칭
const prefixes = [
  { p: '908c8ab7', note: 'Shibuya Saunas (문제 케이스)' },
  { p: '5dc18d60', note: 'Spa Alps (Japanese leak)' },
  { p: 'b6aaadfd', note: 'Othership NY (US)' },
  { p: 'a666495a', note: 'Friedrichsbad (DE)' },
  { p: '273d4c33', note: 'Löyly Helsinki (FI)' },
  { p: '9fa63f79', note: 'ES Barcelona' },
  { p: '9ac220df', note: 'EE Tallinn' },
  { p: '06dd629e', note: 'Hakusan-yu (JP Kyoto)' },
]

;(async () => {
  const { data: allPlaces } = await s.from('places')
    .select('id, latitude, longitude, place_sources(source, name_original)')

  for (const { p, note } of prefixes) {
    const place = (allPlaces ?? []).find((x: any) => (x.id as string).startsWith(p)) as any
    if (!place) { console.log(`--- ${note} --- NOT FOUND`); continue }
    const google = place.place_sources.find((x: any) => x.source === 'google')
    if (!google) { console.log(`--- ${note} --- no google source`); continue }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${place.latitude},${place.longitude}&language=en&key=${process.env.GOOGLE_PLACES_API_KEY}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.status !== 'OK') { console.log(`--- ${note} --- Geocoding ${d.status}`); continue }

    const first = d.results[0]
    console.log(`\n══════ ${note} (${p}) ══════`)
    console.log(`POI name: ${google.name_original}`)
    console.log(`formatted_address: ${first.formatted_address}`)
    console.log(`address_components:`)
    for (const c of first.address_components) {
      console.log(`  [${c.types.join(', ')}]  long="${c.long_name}"  short="${c.short_name}"`)
    }
    await new Promise(r => setTimeout(r, 300))
  }
})()
