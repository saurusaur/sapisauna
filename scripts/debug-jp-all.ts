/**
 * 모든 JP 장소(google source)의 address_components 전수 덤프
 * 패턴 분석용
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

;(async () => {
  const { data } = await s.from('places')
    .select('id, latitude, longitude, country_code, place_sources(source, name_original)')
  const targets = (data ?? []).filter((p: any) => {
    const g = p.place_sources?.find((x: any) => x.source === 'google')
    return g && p.latitude && p.longitude
  })

  console.log(`total google places: ${targets.length}\n`)

  for (const p of targets) {
    const tp = p as any
    const g = tp.place_sources.find((x: any) => x.source === 'google')
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${tp.latitude},${tp.longitude}&language=en&key=${process.env.GOOGLE_PLACES_API_KEY}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.status !== 'OK') continue
    const first = d.results[0]

    // country_code 확인 — JP만 출력
    const countryComp = first.address_components.find((c: any) => c.types.includes('country'))
    if (countryComp?.short_name !== 'JP') continue

    console.log(`── ${tp.id.slice(0, 8)} · ${g.name_original}`)
    console.log(`   formatted: ${first.formatted_address}`)
    for (const c of first.address_components) {
      const typesStr = c.types.filter((t: string) => t !== 'political').join(',')
      console.log(`   [${typesStr}]  "${c.long_name}"`)
    }
    console.log('')
    await new Promise(r => setTimeout(r, 250))
  }
})()
